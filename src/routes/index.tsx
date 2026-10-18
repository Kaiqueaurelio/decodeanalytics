import { createFileRoute } from "@tanstack/react-router";
import { DecodeLanding } from "@/components/storefront/DecodeLanding";
import { StoreShell } from "@/components/storefront/StoreShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Decode Analytics — Gráfica, Design & Soluções" },
      {
        name: "description",
        content:
          "Encontre cartões, panfletos, adesivos, canecas, brindes, design gráfico e soluções digitais. Peça seu orçamento personalizado à Decode Analytics.",
      },
      { property: "og:title", content: "Decode Analytics — Gráfica, Design & Soluções" },
      {
        property: "og:description",
        content:
          "Encontre cartões, panfletos, adesivos, canecas, brindes, design gráfico e soluções digitais. Peça seu orçamento personalizado à Decode Analytics.",
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
