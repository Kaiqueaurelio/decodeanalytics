// Registra eventos e falhas do gateway de IA em ai_provider_logs.
// Roda apenas em servidor (usa supabaseAdmin para bypass de RLS).

export type AiLogInput = {
  provider: string;
  model?: string;
  endpoint: string;
  trace_id: string;
  status: "success" | "error";
  http_status?: number;
  error_type?: string;
  error_message?: string;
  duration_ms?: number;
  user_id?: string | null;
  ip?: string | null;
  extra?: Record<string, unknown>;
};

export function classifyAiError(err: any): {
  http_status?: number;
  error_type: string;
  error_message: string;
} {
  const raw =
    err?.responseBody ??
    err?.cause?.responseBody ??
    err?.data?.error?.message ??
    err?.message ??
    String(err);
  const message = typeof raw === "string" ? raw.slice(0, 1000) : JSON.stringify(raw).slice(0, 1000);
  const status: number | undefined =
    err?.statusCode ??
    err?.status ??
    err?.response?.status ??
    err?.cause?.statusCode ??
    undefined;

  let type = "unknown";
  const name = String(err?.name ?? "").toLowerCase();
  const msgLower = String(message).toLowerCase();

  if (name.includes("abort") || msgLower.includes("timeout") || msgLower.includes("timed out")) {
    type = "timeout";
  } else if (
    err?.code === "ECONNRESET" ||
    err?.code === "ENOTFOUND" ||
    err?.code === "ECONNREFUSED" ||
    msgLower.includes("network") ||
    msgLower.includes("fetch failed")
  ) {
    type = "network";
  } else if (status === 401 || status === 403 || msgLower.includes("unauthorized") || msgLower.includes("api key")) {
    type = "auth";
  } else if (status === 429 || msgLower.includes("rate limit")) {
    type = "rate_limit";
  } else if (status === 402 || msgLower.includes("credit") || msgLower.includes("insufficient")) {
    type = "credit";
  } else if (status === 400 || msgLower.includes("invalid") || msgLower.includes("validation")) {
    type = "validation";
  } else if (typeof status === "number" && status >= 500) {
    type = "upstream";
  }

  return { http_status: status, error_type: type, error_message: message };
}

export async function logAiEvent(input: AiLogInput): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("ai_provider_logs" as any).insert({
      provider: input.provider,
      model: input.model ?? null,
      endpoint: input.endpoint,
      trace_id: input.trace_id,
      status: input.status,
      http_status: input.http_status ?? null,
      error_type: input.error_type ?? null,
      error_message: input.error_message ?? null,
      duration_ms: input.duration_ms ?? null,
      user_id: input.user_id ?? null,
      ip: input.ip ?? null,
      extra: (input.extra as any) ?? null,
    });
  } catch (e) {
    // Nunca deixar log de erro quebrar a resposta principal.
    console.error("[ai-logs] failed to persist log", e);
  }
}

export function newTraceId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `t-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}