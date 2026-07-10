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
