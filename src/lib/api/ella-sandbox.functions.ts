import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableGateway } from "@/lib/ai-gateway.server";
import { ADMIN_SYSTEM_PROMPT, PUBLIC_SYSTEM_PROMPT } from "./ella.helpers.server";
import { classifyAiError, logAiEvent, newTraceId } from "./ai-logs.server";

const InputSchema = z.object({
  message: z.string().min(1),
  scope: z.enum(["admin", "public"]).default("admin"),
  topK: z.number().min(1).max(20).optional(),
});

const STOPWORDS = new Set([
  "a","o","e","de","do","da","dos","das","um","uma","para","por","com","que","se","no","na",
  "nos","nas","em","é","ao","aos","às","à","você","voce","eu","me","meu","minha","seu","sua",
  "the","and","of","to","for","in","on","is","it","this","that","how","what","como","qual","onde",
  "quando","quero","preciso","tem","ter","ser","estar","seria","poderia","por","favor",
]);

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

export const ellaSandboxChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => InputSchema.parse(v))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY não configurada");
    const supabase = context.supabase;
    const userId = context.userId;

    const modelName = "google/gemini-2.5-flash";
    const model = createLovableGateway(key)(modelName);
    const traceId = newTraceId();
    const startedAt = Date.now();

    const scopes = data.scope === "admin" ? ["admin", "both"] : ["public", "both"];
    const { data: kbRaw } = await supabase
      .from("ella_knowledge" as any)
      .select("id,title,content,scope,tags,updated_at")
      .in("scope", scopes)
      .order("updated_at", { ascending: false })
      .limit(200);

    const kbAll = ((kbRaw ?? []) as any[]).map((k) => ({
      id: k.id as string,
      title: k.title as string,
      content: k.content as string,
      scope: k.scope as string,
      tags: (k.tags as string[]) ?? [],
    }));

    const qTokens = tokenize(data.message);
    const qSet = new Set(qTokens);
    const scored = kbAll.map((k) => {
      const hay = tokenize(`${k.title} ${k.content} ${(k.tags ?? []).join(" ")}`);
      let score = 0;
      const matched: string[] = [];
      for (const t of new Set(hay)) {
        if (qSet.has(t)) {
          score += 1;
          matched.push(t);
        }
      }
      return { ...k, score, matched };
    });
    scored.sort((a, b) => b.score - a.score);

    const topK = data.topK ?? 6;
    const relevant = scored.filter((s) => s.score > 0).slice(0, topK);
    // Se nada casou, ainda envia os mais recentes para dar contexto mínimo.
    const used = relevant.length > 0 ? relevant : scored.slice(0, Math.min(3, scored.length));

    const kbBlock = used.length
      ? `\n\nCONHECIMENTO RELEVANTE (recuperado da base de treinamento — priorize sobre suposições):\n${used
          .map((k, i) => `${i + 1}. [${k.scope}] ${k.title}\n${k.content}`)
          .join("\n\n")}`
      : "";

    const basePrompt = data.scope === "admin" ? ADMIN_SYSTEM_PROMPT : PUBLIC_SYSTEM_PROMPT;
    const today = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const systemPrompt = `${basePrompt}\n\nModo: SANDBOX de teste. Não execute tools reais — responda com base apenas no conhecimento fornecido e nas diretrizes.\nData/hora atual (America/Sao_Paulo): ${today}${kbBlock}`;

    const temperature = 0.4;

    try {
      const result = await generateText({
        model,
        system: systemPrompt,
        messages: [{ role: "user", content: data.message }],
        temperature,
      });

      const duration = Date.now() - startedAt;
      logAiEvent({
        provider: "lovable-ai-gateway",
        model: modelName,
        endpoint: "/ella-sandbox",
        trace_id: traceId,
        status: "success",
        duration_ms: duration,
        user_id: userId,
        extra: { kb_used: used.length, scope: data.scope },
      });

      const knowledgeUsed = used.map((k) => ({
        id: k.id,
        title: k.title,
        content: k.content,
        scope: k.scope,
        tags: k.tags,
        score: k.score,
        matched: k.matched,
      }));

      const { data: run } = await supabase
        .from("ella_sandbox_runs" as any)
        .insert({
          created_by: userId,
          question: data.message,
          answer: result.text || "(sem resposta)",
          scope: data.scope,
          model: modelName,
          provider: "Lovable AI Gateway",
          temperature,
          duration_ms: duration,
          trace_id: traceId,
          base_prompt_name: data.scope === "admin" ? "ADMIN_SYSTEM_PROMPT" : "PUBLIC_SYSTEM_PROMPT",
          system_prompt: systemPrompt,
          knowledge_used: knowledgeUsed,
          knowledge_total: kbAll.length,
        } as any)
        .select("id")
        .single();

      return {
        run_id: (run as any)?.id ?? null,
        answer: result.text || "(sem resposta)",
        trace_id: traceId,
        duration_ms: duration,
        model: modelName,
        provider: "Lovable AI Gateway",
        scope: data.scope,
        temperature,
        systemPrompt,
        basePromptName: data.scope === "admin" ? "ADMIN_SYSTEM_PROMPT" : "PUBLIC_SYSTEM_PROMPT",
        knowledgeTotal: kbAll.length,
        knowledgeUsed,
      };
    } catch (err: any) {
      const cls = classifyAiError(err);
      logAiEvent({
        provider: "lovable-ai-gateway",
        model: modelName,
        endpoint: "/ella-sandbox",
        trace_id: traceId,
        status: "error",
        duration_ms: Date.now() - startedAt,
        user_id: userId,
        ...cls,
      });
      throw new Error(cls.error_message ?? "Falha ao consultar a Ella.");
    }
  });
