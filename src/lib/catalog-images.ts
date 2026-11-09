const CATEGORY_IMAGE_PATHS: Record<string, string> = {
  "Cartões": "/products/cartoes.jpg",
  "Panfletos": "/products/panfletos.jpg",
  "Adesivos": "/products/adesivos.jpg",
  "Banners": "/products/banners.jpg",
  "Canecas": "/products/canecas.jpg",
  "Camisetas": "/products/camisetas.jpg",
  "Brindes": "/products/brindes.jpg",
  "Embalagens": "/products/embalagens.jpg",
  "Plotagem": "/products/plotagem.jpg",
};

function normalizeCatalogText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function inferCatalogCategory(name: string, category?: string): string {
  const text = normalizeCatalogText(`${name} ${category ?? ""}`);
  if (/cartao|cartoes|visita|card/.test(text)) return "Cartões";
  if (/panfleto|flyer|folder|folheto/.test(text)) return "Panfletos";
  if (/adesivo|etiqueta|recorte|sticker/.test(text)) return "Adesivos";
  if (/banner|lona|faixa|cavalete/.test(text)) return "Banners";
  if (/caneca|copo/.test(text)) return "Canecas";
  if (/camiseta|camisa|uniforme/.test(text)) return "Camisetas";
  if (/embalagem|caixa|sacola/.test(text)) return "Embalagens";
  if (/plotagem|planta|projeto/.test(text)) return "Plotagem";
  if (/brinde|chaveiro|squeeze|personalizado/.test(text)) return "Brindes";
  return category?.trim() || "Outros";
}

export function imagePathFor(category: string, name: string): string | null {
  const resolved = inferCatalogCategory(name, category);
  return CATEGORY_IMAGE_PATHS[resolved] ?? null;
}
