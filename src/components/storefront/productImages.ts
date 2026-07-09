import imgAdesivos from "@/assets/products/adesivos.jpg";
import imgBanners from "@/assets/products/banners.jpg";
import imgBrindes from "@/assets/products/brindes.jpg";
import imgCamisetas from "@/assets/products/camisetas.jpg";
import imgCanecas from "@/assets/products/canecas.jpg";
import imgCartoes from "@/assets/products/cartoes.jpg";
import imgEmbalagens from "@/assets/products/embalagens.jpg";
import imgPanfletos from "@/assets/products/panfletos.jpg";
import imgPlotagem from "@/assets/products/plotagem.jpg";

// Imagens específicas por subcategoria/produto
import imgBusinessCard from "@/assets/products/sub/business-card.jpg";
import imgWeddingInvite from "@/assets/products/sub/wedding-invite.jpg";
import imgIdBadge from "@/assets/products/sub/id-badge.jpg";
import imgCap from "@/assets/products/sub/cap.jpg";
import imgEcobag from "@/assets/products/sub/ecobag.jpg";
import imgPolo from "@/assets/products/sub/polo.jpg";
import imgHoodie from "@/assets/products/sub/hoodie.jpg";
import imgMagicMug from "@/assets/products/sub/magic-mug.jpg";
import imgKraftBag from "@/assets/products/sub/kraft-bag.jpg";
import imgDeliveryBox from "@/assets/products/sub/delivery-box.jpg";
import imgMenu from "@/assets/products/sub/menu.jpg";
import imgBrochure from "@/assets/products/sub/brochure.jpg";
import imgCalendar from "@/assets/products/sub/calendar.jpg";
import imgNotebook from "@/assets/products/sub/notebook.jpg";
import imgPen from "@/assets/products/sub/pen.jpg";
import imgKeychain from "@/assets/products/sub/keychain.jpg";
import imgHoloSticker from "@/assets/products/sub/holo-sticker.jpg";
import imgLabelTransparent from "@/assets/products/sub/label-transparent.jpg";
import imgFloorSticker from "@/assets/products/sub/floor-sticker.jpg";
import imgPlotBw from "@/assets/products/sub/plot-bw.jpg";
import imgBannerBacklight from "@/assets/products/sub/banner-backlight.jpg";
import imgPoster from "@/assets/products/sub/poster.jpg";
import imgSqueeze from "@/assets/products/sub/squeeze.jpg";
import imgMousepad from "@/assets/products/sub/mousepad.jpg";

/**
 * Mapeamento por slug do produto (mais específico que a categoria).
 */
const PRODUCT_IMAGES_BY_SLUG: Record<string, string> = {
  // Cartões
  "cartao-couche-250g": imgBusinessCard,
  "cartao-visita-couche-300g": imgBusinessCard,
  "cartao-visita-laminado-fosco": imgBusinessCard,
  "cartao-verniz-localizado": imgBusinessCard,
  "cartao-kraft": imgKraftBag,
  "cartao-pvc": imgIdBadge,
  "convite-casamento": imgWeddingInvite,
  "cracha": imgIdBadge,
  "talao-pedido": imgNotebook,
  // Camisetas
  "polo-bordada": imgPolo,
  "moletom-bordado": imgHoodie,
  // Canecas
  "caneca-magica": imgMagicMug,
  // Brindes
  "bone-bordado": imgCap,
  "ecobag": imgEcobag,
  "avental": imgEcobag,
  "caderno-a5": imgNotebook,
  "bloco-anotacoes": imgNotebook,
  "calendario-mesa": imgCalendar,
  "calendario-parede": imgCalendar,
  "caneta-brinde": imgPen,
  "chaveiro-personalizado": imgKeychain,
  "ima-geladeira": imgKeychain,
  "tag-personalizada": imgKeychain,
  "mouse-pad": imgMousepad,
  "squeeze-500ml": imgSqueeze,
  // Embalagens
  "caixa-delivery": imgDeliveryBox,
  "embalagem-hot-stamping": imgDeliveryBox,
  "embalagem-personalizada": imgDeliveryBox,
  "sacola-kraft": imgKraftBag,
  // Panfletos
  "cardapio-plastificado": imgMenu,
  "folder-3-dobras": imgBrochure,
  // Adesivos
  "adesivo-holografico": imgHoloSticker,
  "adesivo-bopp-transparente": imgLabelTransparent,
  "rotulo-cosmetico": imgLabelTransparent,
  "adesivo-chao": imgFloorSticker,
  // Plotagem
  "plotagem-a2-pb": imgPlotBw,
  "poster-fine-art": imgPoster,
  // Banners
  "banner-backlight": imgBannerBacklight,
};

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
  "brindes.jpg": imgBrindes,
  "camisetas.jpg": imgCamisetas,
  "canecas.jpg": imgCanecas,
  "cartoes.jpg": imgCartoes,
  "embalagens.jpg": imgEmbalagens,
  "panfletos.jpg": imgPanfletos,
  "plotagem.jpg": imgPlotagem,
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
  slug?: string | null,
): string | undefined {
  if (slug && PRODUCT_IMAGES_BY_SLUG[slug]) {
    return PRODUCT_IMAGES_BY_SLUG[slug];
  }

  if (imageUrl) {
    const localProductImage = getImageFromFileName(imageUrl);
    if (localProductImage) {
      return localProductImage;
    }
  }

  if (imageUrl?.startsWith("http")) {
    return imageUrl;
  }

  // URLs relativas (inclui `/__l5e/...` do CDN de assets do Lovable).
  if (imageUrl?.startsWith("/") && !imageUrl.startsWith("/products/")) {
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
