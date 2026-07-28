import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createLovableGateway(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    supportsStructuredOutputs: false,
    headers: {
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}

// Provider direto do Google Gemini (endpoint OpenAI-compatível).
// Usa GEMINI_API_KEY do usuário — cobrança e cotas vão pra conta dele.
export function createGeminiProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "gemini",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
    supportsStructuredOutputs: false,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
}

/**
 * Resolve o provider da Ella de forma idêntica em qualquer host (Lovable/Vercel).
 * Prioriza a chave própria do Gemini; cai para o gateway da Lovable se não houver.
 * Retorna null quando nenhuma chave está configurada.
 */
export function resolveEllaModel() {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  // Chaves do Google AI Studio começam com "AIza". Se o valor salvo não tiver
  // esse formato, ignoramos em vez de derrubar a Ella com erro 400 de auth.
  if (geminiKey && geminiKey.startsWith("AIza")) {
    const modelName = "gemini-2.5-flash";
    return {
      model: createGeminiProvider(geminiKey)(modelName),
      modelName,
      provider: "google-gemini" as const,
    };
  }
  const lovableKey = process.env.LOVABLE_API_KEY;
  if (lovableKey) {
    const modelName = "google/gemini-2.5-flash";
    return {
      model: createLovableGateway(lovableKey)(modelName),
      modelName,
      provider: "lovable-ai-gateway" as const,
    };
  }
  return null;
}

/** Aborta a chamada do modelo depois de N ms para a Ella nunca "pensar" pra sempre. */
export function aiTimeoutSignal(ms = 60_000) {
  return AbortSignal.timeout(ms);
}
