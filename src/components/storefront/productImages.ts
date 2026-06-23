import imgAdesivos from "@/assets/products/adesivos.jpg";
import imgBanners from "@/assets/products/banners.webp";
import imgBrindes from "@/assets/products/brindes.webp";
import imgCamisetas from "@/assets/products/camisetas.jpg";
import imgCanecas from "@/assets/products/canecas.jpg";
import imgCartoes from "@/assets/products/cartoes.jpg";
import imgEmbalagens from "@/assets/products/embalagens.webp";
import imgPanfletos from "@/assets/products/panfletos.jpg";
import imgPlotagem from "@/assets/products/plotagem.webp";

/**
 * Mapeamento de imagens locais por categoria de produto.
 * Importadas estaticamente para o Vite processar como base64 ou arquivos otimizados.
 */
export const CATEGORY_IMAGES: Record<string, string> = {
  "Cartões": imgCartoes,
  "Panfletos": imgPanfletos,
  "Adesivos": imgAdesivos,
  "Banners": imgBanners,
  "Camisetas": imgCamisetas,
  "Canecas": imgCanecas,
  "Brindes": imgBrindes,
  "Embalagens": imgEmbalagens,
  "Plotagem": imgPlotagem,
};

const CATEGORY_IMAGES_BY_KEY: Record<string, string> = {
  adesivos: imgAdesivos,
  banners: imgBanners,
  brindes: imgBrindes,
  camisetas: imgCamisetas,
  canecas: imgCanecas,
  cartoes: imgCartoes,
  embalagens: imgEmbalagens,
  panfletos: imgPanfletos,
  plotagem: imgPlotagem,
};

const PRODUCT_IMAGES_BY_FILE: Record<string, string> = {
  "adesivos.jpg": imgAdesivos,
  "banners.jpg": imgBanners,
  "banners.webp": imgBanners,
  "brindes.jpg": imgBrindes,
  "brindes.webp": imgBrindes,
  "camisetas.jpg": imgCamisetas,
  "canecas.jpg": imgCanecas,
  "cartoes.jpg": imgCartoes,
  "embalagens.jpg": imgEmbalagens,
  "embalagens.webp": imgEmbalagens,
  "panfletos.jpg": imgPanfletos,
  "plotagem.jpg": imgPlotagem,
  "plotagem.webp": imgPlotagem,
};

function getImageFromFileName(imageUrl: string): string | undefined {
  const fileName = imageUrl.split(/[?#]/)[0]?.split("/").pop()?.toLowerCase();
  return fileName ? PRODUCT_IMAGES_BY_FILE[fileName] : undefined;
}

function getCategoryKey(category: string): string {
  return category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Retorna a URL de imagem válida para um produto.
 */
export function resolveProductImage(
  imageUrl: string | null | undefined,
  category: string | null | undefined,
): string | undefined {
  const isLegacyUrl = imageUrl?.includes("__l5e");

  if (imageUrl) {
    const localProductImage = getImageFromFileName(imageUrl);
    if (localProductImage) {
      return localProductImage;
    }
  }

  if (imageUrl?.startsWith("http") && !isLegacyUrl) {
    return imageUrl;
  }

  if (imageUrl?.startsWith("/") && !isLegacyUrl && !imageUrl.startsWith("/products/")) {
    return imageUrl;
  }

  if (imageUrl?.startsWith("data:")) {
    return imageUrl;
  }

  if (category) {
    return CATEGORY_IMAGES[category] ?? CATEGORY_IMAGES_BY_KEY[getCategoryKey(category)];
  }

  return undefined;
}
