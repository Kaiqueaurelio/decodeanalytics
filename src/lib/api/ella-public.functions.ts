import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { createLovableGateway } from "@/lib/ai-gateway.server";
import type { Database } from "@/integrations/supabase/types";
import { getRequestIP, getRequestHeader } from "@tanstack/react-start/server";
import { PUBLIC_SYSTEM_PROMPT, checkPublicRateLimit } from "./ella.helpers.server";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const InputSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationHistory: z.array(MessageSchema).max(30).optional(),
});

export const ellaPublicChat = createServerFn({ method: "POST" })
  .inputValidator((v: unknown) => InputSchema.parse(v))
  .handler(async ({ data }) => {
    // Anti-abuso: limita mensagens por IP.
    let ipKey = "unknown";
    try {
      ipKey =
        getRequestIP({ xForwardedFor: true }) ||
        getRequestHeader("x-forwarded-for") ||
        "unknown";
    } catch {
      ipKey = "unknown";
    }
    if (!checkPublicRateLimit(ipKey)) {
      return {
        response:
          "Estou recebendo muitas mensagens agora. Aguarde alguns segundos ou fale direto com a equipe pelo WhatsApp 💙",
      };
    }

    const key = process.env.LOVABLE_API_KEY;
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!key || !url || !anonKey) throw new Error("Configuração de servidor ausente.");

    // Cliente anônimo — RLS trata como visitante (sem sessão).
    const supabase = createClient<Database>(url, anonKey, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });

    const gateway = createLovableGateway(key);
    const model = gateway("google/gemini-2.5-flash");

    const tools = {
      list_products: tool({
        description:
          "Consulta o catálogo público de produtos/serviços da gráfica. Filtra por texto (nome ou categoria).",
        inputSchema: z.object({
          search: z.string().optional(),
          limit: z.number().min(1).max(15).optional(),
        }),
        execute: async ({ search, limit }) => {
          let q = supabase
            .from("services")
            .select("name,category,slug,base_price,unit,short_description,min_quantity,specs")
            .eq("active", true)
            .order("name");
          if (search) q = q.or(`name.ilike.%${search}%,category.ilike.%${search}%`);
          const { data, error } = await q.limit(limit ?? 8);
          if (error) return { error: "Não consegui consultar o catálogo agora." };
          return { products: data ?? [] };
        },
      }),
      list_categories: tool({
        description: "Lista as categorias de produtos disponíveis na loja.",
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
        ? `\n\nBase de conhecimento da gráfica (fonte da verdade):\n${(kb as any[])
            .map((k) => `• ${k.title}: ${k.content}`)
            .join("\n")}`
        : "";

    const history = (data.conversationHistory ?? []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    try {
      const result = await generateText({
        model,
        system: `${PUBLIC_SYSTEM_PROMPT}${kbBlock}`,
        messages: [...history, { role: "user", content: data.message }],
        tools,
        stopWhen: stepCountIs(8),
      });
      return {
        response:
          result.text ||
          "Posso te ajudar a escolher um produto — me conta o que você precisa imprimir 😉",
      };
    } catch (err: any) {
      console.error("ellaPublicChat error:", err);
      return {
        response:
          "Tive um probleminha aqui. Se quiser falar direto com a equipe, o WhatsApp está no topo do site.",
      };
    }
  });