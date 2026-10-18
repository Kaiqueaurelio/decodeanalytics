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
          "Design, tecnologia, programação e soluções digitais para ajudar seu negócio a avançar.",
      },
      { property: "og:title", content: "Decode Analytics — Design & Soluções" },
      {
        property: "og:description",
        content:
          "Design, tecnologia, programação e soluções digitais para ajudar seu negócio a avançar.",
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
