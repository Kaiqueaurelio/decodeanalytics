import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { createLovableGateway } from "@/lib/ai-gateway.server";
import type { Database } from "@/integrations/supabase/types";
import { getRequestIP } from "@tanstack/react-start/server";
import { PUBLIC_SYSTEM_PROMPT } from "./ella.helpers.server";
import { classifyAiError, logAiEvent, newTraceId } from "./ai-logs.server";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(1000),
});

const InputSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  conversationHistory: z.array(MessageSchema).max(12).optional(),
});

export const ellaPublicChat = createServerFn({ method: "POST" })
  .inputValidator((v: unknown) => InputSchema.parse(v))
  .handler(async ({ data }) => {
    // Anti-abuso: limita mensagens por IP.
    let ipKey = "unknown";
    try {
      // Never trust a raw forwarded header supplied by the client.
      ipKey = getRequestIP({ xForwardedFor: true }) || "unknown";
    } catch {
      ipKey = "unknown";
    }
    const key = process.env.LOVABLE_API_KEY;
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!key || !url || !anonKey) throw new Error("Configuração de servidor ausente.");

    // Cliente anônimo — RLS trata como visitante (sem sessão).
    const supabase = createClient<Database>(url, anonKey, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });

    // Use the server-only service role for the durable limiter; never expose this RPC to visitors.
    let withinRateLimit = false;
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data, error } = await (supabaseAdmin as any).rpc("consume_public_ai_rate_limit", {
        p_key: ipKey,
      });
      withinRateLimit = !error && data === true;
    } catch {
      withinRateLimit = false;
    }
    if (!withinRateLimit) {
      return {
        response:
          "Estou recebendo muitas mensagens agora. Aguarde alguns segundos ou fale direto com a equipe pelo WhatsApp 💙",
      };
    }

    const model = createLovableGateway(key)("google/gemini-2.5-flash");
    const traceId = newTraceId();
    const startedAt = Date.now();

    const tools = {
      list_products: tool({
        description:
          "Consulta o catálogo público ATIVO da Decode. Use antes de afirmar disponibilidade, preço, especificações ou recomendar um produto/serviço. Sem busca, retorna o catálogo completo (até 50 itens). Preços são sob consulta no site. Inclui links reais para detalhes e orçamento.",
        inputSchema: z.object({
          search: z.string().max(100).optional(),
          category: z.string().max(80).optional(),
          limit: z.number().int().min(1).max(50).optional(),
        }),
        execute: async ({ search, category, limit }) => {
          let q = supabase
            .from("services")
            .select("name,category,slug,base_price,unit,short_description,min_quantity,specs")
            .eq("active", true)
            .order("name");
          // Sanitize text before interpolating it into PostgREST filter grammar.
          const safeSearch = (search ?? "")
            .normalize("NFKC")
            .replace(/[^\p{L}\p{N}\s-]/gu, "")
            .trim()
            .slice(0, 80);
          const safeCategory = (category ?? "")
            .normalize("NFKC")
            .replace(/[^\p{L}\p{N}\s-]/gu, "")
            .trim()
            .slice(0, 80);
          if (safeSearch) {
            q = q.or(
              `name.ilike.%${safeSearch}%,category.ilike.%${safeSearch}%,short_description.ilike.%${safeSearch}%`,
            );
          }
          if (safeCategory) q = q.ilike("category", `%${safeCategory}%`);
          const { data, error } = await q.limit(limit ?? 50);
          if (error) return { error: "Não consegui consultar o catálogo agora." };
          return {
            products: (data ?? []).map((product) => ({
              name: product.name,
              category: product.category,
              slug: product.slug,
              price: "Sob consulta",
              unit: product.unit,
              short_description: (product.short_description ?? "").replace(
                /R\$\s*[\d.,]+/gi,
                "valor sob consulta",
              ),
              min_quantity: product.min_quantity,
              specs: product.specs,
              detail_url: product.slug ? `/produto/${product.slug}` : null,
              quote_url: "/orcamento",
            })),
            count: data?.length ?? 0,
            source: "catálogo público ativo da Decode",
          };
        },
      }),
      list_categories: tool({
        description:
          "Lista somente as categorias que têm produtos ou serviços ativos no catálogo público agora.",
        inputSchema: z.object({}),
        execute: async () => {
          const { data, error } = await supabase
            .from("services")
            .select("category")
            .eq("active", true);
          if (error) return { error: "Falha ao listar categorias." };
          const cats = Array.from(new Set((data ?? []).map((r: any) => r.category))).sort();
          return { categories: cats };
        },
      }),
    };

    // Base de conhecimento pública ensinada pelo admin.
    const { data: kb } = await supabase
      .from("ella_knowledge" as any)
      .select("title,content")
      .in("scope", ["public", "both"])
      .order("updated_at", { ascending: false })
      .limit(40);
    const kbBlock =
      kb && kb.length
        ? `\n\nBase de conhecimento da Decode (fonte da verdade):\n${(kb as any[])
            .map((k) => `• ${k.title}: ${k.content}`)
            .join("\n")}`
        : "";

    // Client-supplied history is untrusted context; cap both turns and message size.
    const history = (data.conversationHistory ?? []).slice(-12).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content.slice(-1000),
    }));

    try {
      const result = await generateText({
        model,
        system: `${PUBLIC_SYSTEM_PROMPT}${kbBlock}`,
        messages: [...history, { role: "user", content: data.message }],
        tools,
        stopWhen: stepCountIs(8),
      });
      logAiEvent({
        provider: "lovable-ai-gateway",
        model: "google/gemini-2.5-flash",
        endpoint: "/assistente",
        trace_id: traceId,
        status: "success",
        duration_ms: Date.now() - startedAt,
        ip: ipKey,
      });
      return {
        response:
          result.text ||
          "Posso ajudar a encontrar um produto ou serviço — me conte o que você está buscando 🙂",
        trace_id: traceId,
      };
    } catch (err: any) {
      const cls = classifyAiError(err);
      console.error("ellaPublicChat error:", traceId, cls);
      logAiEvent({
        provider: "lovable-ai-gateway",
        model: "google/gemini-2.5-flash",
        endpoint: "/assistente",
        trace_id: traceId,
        status: "error",
        duration_ms: Date.now() - startedAt,
        ip: ipKey,
        ...cls,
      });
      return {
        response:
          "Tive um probleminha aqui. Se quiser falar direto com a equipe, o WhatsApp está no topo do site.",
        trace_id: traceId,
        error: cls.error_type,
      };
    }
  });
