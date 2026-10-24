import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { z } from "zod";
import { createGeminiProvider, createLovableGateway } from "@/lib/ai-gateway.server";
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
    const supabase = context.supabase;
    const userId = context.userId;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role,is_active")
      .eq("id", userId)
      .maybeSingle();
    if (profileError) throw new Error("Não foi possível verificar suas permissões.");
    const staffRoles = ["admin", "super_admin", "administrador", "atendente", "producao", "financeiro", "vendedor"];
    if (!profile || profile.is_active === false || !staffRoles.includes(profile.role ?? "")) {
      throw new Error("Acesso não liberado para esta conta.");
    }

    const modelName = "google/gemini-2.5-flash";
    const traceId = newTraceId();
    const startedAt = Date.now();
    const temperature = 0.4;

    type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };
    type JsonObject = { [k: string]: JsonValue };
    type Step = {
      name: string;
      status: "ok" | "error";
      at_ms: number;
      duration_ms: number | null;
      detail: JsonObject | null;
      error: string | null;
    };
    const steps: Step[] = [];
    const t0 = Date.now();
    const step = <T,>(name: string, fn: () => Promise<T> | T, detail?: () => JsonObject) =>
      Promise.resolve().then(async () => {
        const s = Date.now();
        try {
          const out = await fn();
          steps.push({
            name,
            status: "ok",
            at_ms: s - t0,
            duration_ms: Date.now() - s,
            detail: detail ? detail() : null,
            error: null,
          });
          return out;
        } catch (e: any) {
          steps.push({
            name,
            status: "error",
            at_ms: s - t0,
            duration_ms: Date.now() - s,
            detail: null,
            error: e?.message ?? String(e),
          });
          throw e;
        }
      });

    const inputs: JsonObject = {
      message: data.message,
      scope: data.scope,
      topK: data.topK ?? 6,
      user_id: userId,
    };

    // Prefer the Google AI Studio key when configured; otherwise use the Lovable gateway.
    const geminiKey = process.env.GEMINI_API_KEY;
    const lovableKey = process.env.LOVABLE_API_KEY;
    const providerName = geminiKey ? "Google Gemini" : lovableKey ? "Lovable AI Gateway" : "Modo básico (sem chave configurada)";
    const model = geminiKey
      ? createGeminiProvider(geminiKey)("gemini-2.5-flash")
      : lovableKey
        ? createLovableGateway(lovableKey)(modelName)
        : null;

    const scopes = data.scope === "admin" ? ["admin", "both"] : ["public", "both"];
    const { data: kbRaw } = await step("load_knowledge", async () => supabase
      .from("ella_knowledge" as any)
      .select("id,title,content,scope,tags,updated_at")
      .in("scope", scopes)
      .order("updated_at", { ascending: false })
      .limit(200)
    , () => ({ scopes }));

    const kbAll = ((kbRaw ?? []) as any[]).map((k) => ({
      id: k.id as string,
      title: k.title as string,
      content: k.content as string,
      scope: k.scope as string,
      tags: (k.tags as string[]) ?? [],
    }));

    const qTokens = await step("tokenize_query", () => tokenize(data.message), () => ({ tokens_count: tokenize(data.message).length }));
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
    const used = relevant.length > 0 ? relevant : scored.slice(0, Math.min(3, scored.length));
    steps.push({
      name: "rank_knowledge",
      status: "ok",
      at_ms: Date.now() - t0,
      duration_ms: 0,
      detail: { kb_total: kbAll.length, kb_used: used.length, top_k: topK },
      error: null,
    });

    const kbBlock = used.length
      ? `\n\nCONHECIMENTO RELEVANTE (recuperado da base de treinamento — priorize sobre suposições):\n${used
          .map((k, i) => `${i + 1}. [${k.scope}] ${k.title}\n${k.content}`)
          .join("\n\n")}`
      : "";

    const basePrompt = data.scope === "admin" ? ADMIN_SYSTEM_PROMPT : PUBLIC_SYSTEM_PROMPT;
    const basePromptName = data.scope === "admin" ? "ADMIN_SYSTEM_PROMPT" : "PUBLIC_SYSTEM_PROMPT";
    const today = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const systemPrompt = `${basePrompt}\n\nModo: SANDBOX de teste. Não execute tools reais — responda com base apenas no conhecimento fornecido e nas diretrizes.\nData/hora atual (America/Sao_Paulo): ${today}${kbBlock}`;
    const knowledgeUsed = used.map((k) => ({
      id: k.id, title: k.title, content: k.content, scope: k.scope, tags: k.tags,
      score: k.score, matched: k.matched,
    }));

    try {
      const result = model
        ? await step("generate_text", () => generateText({
            model,
            system: systemPrompt,
            messages: [{ role: "user", content: data.message }],
            temperature,
          }), () => ({ model: geminiKey ? "gemini-2.5-flash" : modelName, temperature }))
        : {
            text: used.length
              ? `A chave de IA do servidor não está configurada. Encontrei este conteúdo na base de treinamento que pode ajudar:\\n\\n${used.map((k, i) => `${i + 1}. ${k.title}\\n${k.content}`).join("\\n\\n")}\\n\\nPara habilitar respostas geradas por IA, configure GEMINI_API_KEY no ambiente do servidor.`
              : "A chave de IA do servidor não está configurada e não encontrei conteúdo de treinamento diretamente relacionado à pergunta. Configure GEMINI_API_KEY no ambiente do servidor para habilitar as respostas inteligentes.";
      };

      const duration = Date.now() - startedAt;
      logAiEvent({
        provider: geminiKey ? "google-gemini" : lovableKey ? "lovable-ai-gateway" : "local-fallback",
        model: geminiKey ? "gemini-2.5-flash" : modelName,
        endpoint: "/ella-sandbox",
        trace_id: traceId,
        status: model ? "success" : "error",
        duration_ms: duration,
        user_id: userId,
        extra: { kb_used: used.length, scope: data.scope },
      });

      const { data: run } = await supabase
        .from("ella_sandbox_runs" as any)
        .insert({
          created_by: userId,
          question: data.message,
          answer: result.text || "(sem resposta)",
          scope: data.scope,
          model: modelName,
          provider: providerName,
          temperature,
          duration_ms: duration,
          trace_id: traceId,
          base_prompt_name: basePromptName,
          system_prompt: systemPrompt,
          knowledge_used: knowledgeUsed,
          knowledge_total: kbAll.length,
          status: "success",
          inputs,
          steps,
        } as any)
        .select("id")
        .single();

      return {
        run_id: (run as any)?.id ?? null,
        status: "success" as const,
        answer: result.text || "(sem resposta)",
        trace_id: traceId,
        duration_ms: duration,
        model: modelName,
        provider: providerName,
        scope: data.scope,
        temperature,
        systemPrompt,
        basePromptName,
        knowledgeTotal: kbAll.length,
        knowledgeUsed,
        inputs,
        steps,
        error: null as null | { type: string; message: string; stack?: string | null },
      };
    } catch (err: any) {
      const cls = classifyAiError(err);
      const duration = Date.now() - startedAt;
      logAiEvent({
        provider: "lovable-ai-gateway",
        model: modelName,
        endpoint: "/ella-sandbox",
        trace_id: traceId,
        status: "error",
        duration_ms: duration,
        user_id: userId,
        ...cls,
      });
      const errMsg = cls.error_message ?? err?.message ?? "Falha ao consultar a Ella.";
      const errType = (cls as any).error_type ?? "unknown";
      const stack = err?.stack ?? null;
      const { data: run } = await supabase
        .from("ella_sandbox_runs" as any)
        .insert({
          created_by: userId,
          question: data.message,
          answer: null,
          scope: data.scope,
          model: modelName,
          provider: "Lovable AI Gateway",
          temperature,
          duration_ms: duration,
          trace_id: traceId,
          base_prompt_name: basePromptName,
          system_prompt: systemPrompt,
          knowledge_used: knowledgeUsed,
          knowledge_total: kbAll.length,
          status: "error",
          inputs,
          steps,
          error_type: errType,
          error_message: errMsg,
          stack_trace: stack,
        } as any)
        .select("id")
        .single();

      const e = new Error(errMsg) as Error & {
        run_id?: string; error_type?: string; stack_trace?: string | null; steps?: unknown;
      };
      e.run_id = (run as any)?.id;
      e.error_type = errType;
      e.stack_trace = stack;
      e.steps = steps;
      // Retorne uma mensagem segura para a interface; não propague a stack trace do servidor.
      const isAuthError = errType === "auth";
      const fallbackAnswer = used.length
        ? `A conexão com o serviço de IA foi recusada${isAuthError ? " por uma credencial inválida" : ""}. Confira GEMINI_API_KEY no ambiente do servidor. Conteúdo de treinamento relacionado:\n\n${used.map((k, i) => `${i + 1}. ${k.title}\n${k.content}`).join("\n\n")}`
        : `A conexão com o serviço de IA falhou${isAuthError ? " por uma credencial inválida" : ""}. Confira GEMINI_API_KEY no ambiente do servidor e tente novamente.`;
      return {
        run_id: (run as any)?.id ?? null,
        status: "error" as const,
        answer: fallbackAnswer,
        trace_id: traceId,
        duration_ms: duration,
        model: geminiKey ? "gemini-2.5-flash" : modelName,
        provider: geminiKey ? "Google Gemini" : "Lovable AI Gateway",
        scope: data.scope,
        temperature,
        systemPrompt,
        basePromptName,
        knowledgeTotal: kbAll.length,
        knowledgeUsed,
        inputs,
        steps,
        error: { type: errType, message: isAuthError ? "Credencial de IA inválida ou recusada." : "Não foi possível consultar o serviço de IA." },
      };
    }
  });

async function persistErrorRun(
  supabase: any,
  userId: string,
  ctx: {
    inputs: Record<string, unknown>;
    steps: unknown;
    traceId: string;
    modelName: string;
    temperature: number;
    scope: string;
    systemPrompt: string;
    basePromptName: string;
    knowledgeUsed: unknown;
    knowledgeTotal: number;
    duration: number;
    error_type: string;
    error_message: string;
    stack_trace: string | null;
  },
) {
  await supabase.from("ella_sandbox_runs" as any).insert({
    created_by: userId,
    question: (ctx.inputs as any).message ?? "",
    answer: null,
    scope: ctx.scope,
    model: ctx.modelName,
    provider: "Lovable AI Gateway",
    temperature: ctx.temperature,
    duration_ms: ctx.duration,
    trace_id: ctx.traceId,
    base_prompt_name: ctx.basePromptName,
    system_prompt: ctx.systemPrompt,
    knowledge_used: ctx.knowledgeUsed,
    knowledge_total: ctx.knowledgeTotal,
    status: "error",
    inputs: ctx.inputs,
    steps: ctx.steps,
    error_type: ctx.error_type,
    error_message: ctx.error_message,
    stack_trace: ctx.stack_trace,
  } as any);
}
