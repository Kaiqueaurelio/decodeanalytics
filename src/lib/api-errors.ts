// Tradução de erros (Supabase/rede) em mensagens específicas + retry com backoff.
import { toast } from "sonner";

export type ApiErrorCode =
  | "FIELD_REQUIRED"
  | "DUPLICATE_KEY"
  | "RLS_DENIED"
  | "NOT_FOUND"
  | "NETWORK_ERROR"
  | "RATE_LIMIT_EXCEEDED"
  | "SERVER_ERROR";

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  retryable: boolean;
  retryAfterSeconds?: number;
}

/** Converte qualquer erro (PostgrestError, fetch, Error) num ApiError previsível. */
export function mapApiError(err: unknown): ApiError {
  const anyErr = err as any;
  const pgCode: string | undefined = anyErr?.code;
  const status: number | undefined = anyErr?.status ?? anyErr?.statusCode;
  const raw = String(anyErr?.message ?? err ?? "").trim();
  const lower = raw.toLowerCase();

  if (pgCode === "23505" || lower.includes("duplicate key")) {
    return {
      code: "DUPLICATE_KEY",
      message: "Já existe um registro com esses dados. Use um valor diferente.",
      retryable: false,
    };
  }
  if (pgCode === "23502" || lower.includes("violates not-null")) {
    return {
      code: "FIELD_REQUIRED",
      message: "Preencha todos os campos obrigatórios.",
      retryable: false,
    };
  }
  if (
    pgCode === "42501" ||
    pgCode === "PGRST301" ||
    status === 401 ||
    status === 403 ||
    lower.includes("row-level security") ||
    lower.includes("permission denied")
  ) {
    return {
      code: "RLS_DENIED",
      message: "Você não tem permissão para essa ação. Fale com um administrador.",
      retryable: false,
    };
  }
  if (pgCode === "PGRST116" || status === 404) {
    return { code: "NOT_FOUND", message: "Registro não encontrado.", retryable: false };
  }
  if (status === 429 || lower.includes("rate limit")) {
    return {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Muitas requisições. Aguarde alguns segundos e tente de novo.",
      retryable: true,
      retryAfterSeconds: 30,
    };
  }
  if (
    lower.includes("failed to fetch") ||
    lower.includes("fetch failed") ||
    lower.includes("networkerror") ||
    lower.includes("network") ||
    lower.includes("timeout") ||
    (typeof navigator !== "undefined" && navigator.onLine === false)
  ) {
    return {
      code: "NETWORK_ERROR",
      message: "Sem conexão com o servidor. Verifique sua internet.",
      retryable: true,
    };
  }
  return {
    code: "SERVER_ERROR",
    message: raw || "Algo deu errado. Tente novamente.",
    retryable: true,
  };
}

/** Mostra o erro pro usuário com título curto + mensagem específica. */
export function toastApiError(err: unknown, title = "Não foi possível concluir") {
  const mapped = mapApiError(err);
  toast.error(title, { description: mapped.message });
  return mapped;
}

/** Retenta apenas erros transitórios (rede/500/429) com backoff exponencial. */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 500,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const mapped = mapApiError(err);
      if (!mapped.retryable || attempt === maxRetries - 1) throw err;
      const delay = baseDelayMs * 2 ** attempt;
      console.warn(`[retry] tentativa ${attempt + 2}/${maxRetries} em ${delay}ms`, mapped.code);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}