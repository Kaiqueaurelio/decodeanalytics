import { createFileRoute } from "@tanstack/react-router";

// Health check do Lovable AI Gateway.
// Retorna 200 OK com corpo vazio quando a configuração básica está presente,
// 503 quando o servidor não tem a LOVABLE_API_KEY configurada.
// Não faz chamada ao modelo — apenas valida disponibilidade do endpoint.
export const Route = createFileRoute("/api/public/ai-health")({
  server: {
    handlers: {
      GET: async () => {
        const configured = Boolean(process.env.LOVABLE_API_KEY);
        return new Response(null, {
          status: configured ? 200 : 503,
          headers: {
            "cache-control": "no-store",
            "x-ai-gateway": "lovable",
          },
        });
      },
      HEAD: async () => {
        const configured = Boolean(process.env.LOVABLE_API_KEY);
        return new Response(null, {
          status: configured ? 200 : 503,
          headers: { "cache-control": "no-store", "x-ai-gateway": "lovable" },
        });
      },
    },
  },
});