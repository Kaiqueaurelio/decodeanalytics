import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const NVIDIA_MODEL = "mistralai/mistral-large-4-1t-a52b";
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

function createNvidiaGateway(apiKey: string) {
  const provider = createOpenAICompatible({
    name: "nvidia",
    baseURL: NVIDIA_BASE_URL,
    supportsStructuredOutputs: false,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  // Existing Ella handlers request Gemini model IDs. Map those requests to
  // Mistral Large 4 when NVIDIA_API_KEY is configured, without changing the
  // handlers' tools, prompts, or message formats.
  const aliasedProvider = Object.assign(
    (_requestedModel: string) => provider(NVIDIA_MODEL),
    provider,
  );
  return aliasedProvider as typeof provider;
}

export function createLovableGateway(apiKey: string) {
  const nvidiaKey = process.env.NVIDIA_API_KEY;
  if (nvidiaKey) return createNvidiaGateway(nvidiaKey);

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

// Provider direto da NVIDIA NIM (endpoint OpenAI-compatível).
// Usa NVIDIA_API_KEY do usuário (nvapi-...)
export function createNvidiaProvider(apiKey: string, baseURL = "https://integrate.api.nvidia.com/v1") {
  return createOpenAICompatible({
    name: "nvidia",
    baseURL,
    supportsStructuredOutputs: false,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
}

// Provider direto do Google Gemini (endpoint OpenAI-compatível).
// NVIDIA_API_KEY, quando configurada no servidor, tem prioridade.
export function createGeminiProvider(apiKey: string) {
  const nvidiaKey = process.env.NVIDIA_API_KEY;
  if (nvidiaKey) return createNvidiaGateway(nvidiaKey);

  return createOpenAICompatible({
    name: "gemini",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
    supportsStructuredOutputs: false,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
}
