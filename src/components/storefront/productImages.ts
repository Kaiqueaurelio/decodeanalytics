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
import imgManutencao from "@/assets/products/manutencao.jpg";
import imgDesign from "@/assets/products/design.jpg";
import imgProgramacao from "@/assets/products/programacao.jpg";
import imgSocial from "@/assets/products/socialmedia.jpg";

// Fotos locais da própria biblioteca do catálogo: carregam sem depender de terceiros.
/**
 * Mapeamento por slug do produto (mais específico que a categoria).
 */
const PRODUCT_IMAGES_BY_SLUG: Record<string, string> = {
  "encadernacao-tcc-capa-mole": imgNotebook,
  "laminacao-plastificacao": imgLabelTransparent,
  "adesivos-personalizados-catalogo": imgAdesivos,
  "grandes-tiragens-cartazes-panfletos": imgPoster,
  "panfletos-e-flyers-catalogo": imgPanfletos,
  "convites-personalizados-catalogo": imgWeddingInvite,
  "copos-termicos-personalizados-catalogo": imgSqueeze,
  "canecas-personalizadas-catalogo": imgCanecas,
  "social-media": imgSocial,
  "design-grafico": imgDesign,
  programacao: imgProgramacao,
  "manutencao-de-computadores": imgManutencao,
  // Serviços e entregas digitais
  "apresentacoes-catalogos": imgDesign,
  "automacoes-integracoes": imgProgramacao,
  "identidade-visual": imgDesign,
  "sites-landing-pages": imgProgramacao,
  "design-pecas": imgDesign,
  "diagnostico-hardware": imgManutencao,
  "formatacao-otimizacao": imgManutencao,
  "edicao-reels": imgSocial,
  "gestao-redes-sociais": imgSocial,
  "impressao-3d": imgProgramacao,
  "limpeza-pasta-termica": imgManutencao,
  "loja-virtual": imgProgramacao,
  "pacote-artes-feed-stories": imgSocial,
  "sistemas-sob-medida": imgProgramacao,
  "trafego-pago": imgSocial,
  "upgrade-ssd-ram": imgManutencao,
  // Produtos sem imagem própria no catálogo: use foto específica disponível.
  "adesivacao-vitrine-veiculo": imgFloorSticker,
  "adesivo-vinil": imgHoloSticker,
  "banner-lona-440g": imgBanners,
  "banner-vinil-280g": imgBannerBacklight,
  "camiseta-dtf": imgCamisetas,
  "camiseta-personalizada": imgCamisetas,
  "camiseta-silk": imgCamisetas,
  "camiseta-sublimada": imgCamisetas,
  "caneca-plastico": imgCanecas,
  "caneca-porcelana": imgMagicMug,
  "fachada-acm": imgBannerBacklight,
  "lona-front-light": imgBanners,
  "panfleto-a4": imgPanfletos,
  "panfleto-a5-couche-115g": imgBrochure,
  "panfleto-a6": imgPoster,
  "plotagem-a0-color": imgPlotagem,
  "plotagem-a3-colorida": imgPlotagem,
  // Cartões
  "cartao-couche-250g": imgBusinessCard,
  "cartao-visita-couche-300g": imgBusinessCard,
  "cartao-visita-laminado-fosco": imgBusinessCard,
  "cartao-verniz-localizado": imgBusinessCard,
  "cartao-kraft": imgBusinessCard,
  "cartao-pvc": imgIdBadge,
  "convite-casamento": imgWeddingInvite,
  cracha: imgIdBadge,
  "talao-pedido": imgNotebook,
  // Camisetas
  "polo-bordada": imgPolo,
  "moletom-bordado": imgHoodie,
  // Canecas
  "caneca-magica": imgMagicMug,
  // Brindes
  "bone-bordado": imgCap,
  ecobag: imgEcobag,
  avental: imgEcobag,
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
  Cartões: imgCartoes,
  Panfletos: imgPanfletos,
  Adesivos: imgAdesivos,
  Banners: imgBanners,
  Camisetas: imgCamisetas,
  Canecas: imgCanecas,
  Brindes: imgBrindes,
  Embalagens: imgEmbalagens,
  Plotagem: imgPlotagem,
  "Manutenção de Computadores": imgManutencao,
  Programação: imgProgramacao,
  Encadernação: imgNotebook,
  "Laminação e Plastificação": imgLabelTransparent,
  Cartazes: imgPoster,
  Convites: imgWeddingInvite,
  "Copos Térmicos": imgSqueeze,
  "Social Media": imgSocial,
  "Design Gráfico": imgDesign,
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
  "manutencao de computadores": imgManutencao,
  "manutenção de computadores": imgManutencao,
  programacao: imgProgramacao,
  "social media": imgSocial,
  "design grafico": imgDesign,
  encadernacao: imgNotebook,
  "laminacao e plastificacao": imgLabelTransparent,
  cartazes: imgPoster,
  convites: imgWeddingInvite,
  "copos termicos": imgSqueeze,
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
): string {
  // Preferir uma foto local específica para o produto sempre que disponível.
  if (slug && PRODUCT_IMAGES_BY_SLUG[slug]) {
    return PRODUCT_IMAGES_BY_SLUG[slug];
  }

  const normalizedUrl = imageUrl?.trim();
  if (normalizedUrl) {
    const localProductImage = getImageFromFileName(normalizedUrl);
    if (localProductImage) return localProductImage;

    // Preservar fotos próprias válidas, mas não devolver caminhos antigos do
    // Lovable/CDN ou caminhos públicos legados que não existem neste deploy.
    const isLegacyAssetPath =
      normalizedUrl.startsWith("/__l5e/") ||
      normalizedUrl.startsWith("/products/") ||
      normalizedUrl.startsWith("/assets/products/");
    if (!isLegacyAssetPath && (normalizedUrl.startsWith("https://") ||
        normalizedUrl.startsWith("http://") ||
        normalizedUrl.startsWith("data:") ||
        normalizedUrl.startsWith("blob:") ||
        normalizedUrl.startsWith("/"))) {
      return normalizedUrl;
    }
  }

  if (category) {
    const key = getCategoryKey(category);
    const categoryImage =
      CATEGORY_IMAGES[category] ??
      CATEGORY_IMAGES_BY_KEY[key] ??
      (key.includes("caneca") ? imgCanecas :
       key.includes("copo") || key.includes("squeeze") ? imgSqueeze :
       key.includes("camiseta") || key.includes("uniforme") || key.includes("textil") ? imgCamisetas :
       key.includes("cartao") || key.includes("cartoes") ? imgCartoes :
       key.includes("panfleto") || key.includes("folder") || key.includes("folheto") ? imgPanfletos :
       key.includes("adesiv") || key.includes("rotulo") || key.includes("etiqueta") ? imgAdesivos :
       key.includes("banner") || key.includes("lona") || key.includes("fachada") ? imgBanners :
       key.includes("embalagem") || key.includes("sacola") || key.includes("caixa") ? imgEmbalagens :
       key.includes("plotagem") || key.includes("impressao") ? imgPlotagem :
       key.includes("brinde") || key.includes("presente") ? imgBrindes :
       key.includes("manutencao") || key.includes("computador") || key.includes("hardware") ? imgManutencao :
       key.includes("programacao") || key.includes("site") || key.includes("sistema") ? imgProgramacao :
       key.includes("social") || key.includes("marketing") ? imgSocial :
       key.includes("design") || key.includes("arte") ? imgDesign :
       key.includes("convite") ? imgWeddingInvite :
       key.includes("encadernacao") || key.includes("caderno") ? imgNotebook :
       key.includes("cartaz") || key.includes("poster") ? imgPoster :
       undefined);
    if (categoryImage) return categoryImage;
  }

  // Último recurso local: nunca deixar o card sem imagem por falta de URL.
  return imgDesign;
}
