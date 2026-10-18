/**
 * Category artwork for Decode Analytics. Neutral technology visuals replace
 * the former print-shop product imagery.
 */
const IMAGES: Record<string, string> = {
  "Dados & Business Intelligence": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80",
  "Desenvolvimento Web": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=80",
  "Automação de Processos": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80",
  "Consultoria em Tecnologia": "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1000&q=80",
  "Design & Identidade Visual": "https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=1000&q=80",
  "Suporte Técnico": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=80",
  "Marketing Digital": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=80",
};
const DEFAULT_IMAGE = IMAGES["Dados & Business Intelligence"];
export const CATEGORY_IMAGES: Record<string, string> = IMAGES;

export function resolveProductImage(
  imageUrl: string | null | undefined,
  category: string | null | undefined,
  _slug?: string | null,
): string | undefined {
  if (imageUrl?.startsWith("https://") || imageUrl?.startsWith("http://")) return imageUrl;
  if (imageUrl?.startsWith("/") || imageUrl?.startsWith("data:")) return imageUrl;
  if (category && IMAGES[category]) return IMAGES[category];
  const normalized = (category ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const match = Object.entries(IMAGES).find(([key]) =>
    key.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === normalized
  );
  return match?.[1] ?? DEFAULT_IMAGE;
}
