/**
 * Utilitário de fetch resiliente com timeout configurável e abort controller.
 * Evita que requisições a serviços externos travem indefinidamente.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit & { timeoutMs?: number },
): Promise<Response> {
  const { timeoutMs = 12000, ...restInit } = init || {};

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(new Error(`Timeout de requisição excedido (${timeoutMs}ms)`));
  }, timeoutMs);

  try {
    const response = await fetch(input, {
      ...restInit,
      signal: restInit.signal ? AbortSignal.any([restInit.signal, controller.signal]) : controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}
