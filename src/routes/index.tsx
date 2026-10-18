import { createFileRoute } from "@tanstack/react-router";
import { DecodeLanding } from "@/components/storefront/DecodeLanding";
import { StoreShell } from "@/components/storefront/StoreShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Decode Analytics — Design & Soluções" },
      {
        name: "description",
        content:
          "Conheça nossos produtos gráficos e serviços de design, manutenção de computadores, social media e programação. Peça um orçamento à Decode Analytics.",
      },
      { property: "og:title", content: "Decode Analytics — Design & Soluções" },
      {
        property: "og:description",
        content:
          "Conheça nossos produtos gráficos e serviços de design, manutenção de computadores, social media e programação. Peça um orçamento à Decode Analytics.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <StoreShell>
      <DecodeLanding />
    </StoreShell>
  );
}
