import imgAdesivos from "@/assets/products/adesivos.jpg";
import imgBanners from "@/assets/products/banners.jpg";
import imgBrindes from "@/assets/products/brindes.jpg";
import imgCamisetas from "@/assets/products/camisetas.jpg";
import imgCanecas from "@/assets/products/canecas.jpg";
import imgCartoes from "@/assets/products/cartoes.jpg";
import imgEmbalagens from "@/assets/products/embalagens.jpg";
import imgPanfletos from "@/assets/products/panfletos.jpg";
import imgPlotagem from "@/assets/products/plotagem.jpg";
import imgDesign from "@/assets/products/design.jpg";
import imgManutencao from "@/assets/products/manutencao.jpg";
import imgProgramacao from "@/assets/products/programacao.jpg";
import imgSocialMedia from "@/assets/products/socialmedia.jpg";

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
 * Paletas visuais sofisticadas para os cards SVG de serviços, software e tecnologia Decode Analytics.
 */
interface ThemeColors {
  bg1: string;
  bg2: string;
  accent: string;
  secondary: string;
  glow: string;
  tag: string;
}

const THEMES: Record<string, ThemeColors> = {
  tech: { bg1: "#0B1026", bg2: "#0D2352", accent: "#38BDF8", secondary: "#0284C7", glow: "#38BDF8", tag: "TI & HARDWARE" },
  mobile: { bg1: "#091E2A", bg2: "#0F3C4C", accent: "#22D3EE", secondary: "#06B6D4", glow: "#22D3EE", tag: "MOBILE & SMARTPHONE" },
  apple: { bg1: "#0D1117", bg2: "#1F2937", accent: "#F3F4F6", secondary: "#9CA3AF", glow: "#E5E7EB", tag: "APPLE ECOSYSTEM" },
  ai: { bg1: "#130B2B", bg2: "#2A1261", accent: "#A855F7", secondary: "#C084FC", glow: "#9333EA", tag: "INTELIGÊNCIA ARTIFICIAL" },
  code: { bg1: "#081226", bg2: "#142952", accent: "#60A5FA", secondary: "#3B82F6", glow: "#2563EB", tag: "DESENVOLVIMENTO" },
  design: { bg1: "#1C0D2E", bg2: "#431464", accent: "#F472B6", secondary: "#EC4899", glow: "#DB2777", tag: "DESIGN & CRIAÇÃO" },
  video: { bg1: "#1F0B18", bg2: "#4C102F", accent: "#FB7185", secondary: "#E11D48", glow: "#BE123C", tag: "AUDIOVISUAL & REELS" },
  social: { bg1: "#09212B", bg2: "#0E4957", accent: "#2DD4BF", secondary: "#14B8A6", glow: "#0D9488", tag: "REDES SOCIAIS" },
  ads: { bg1: "#1C1917", bg2: "#3E2510", accent: "#FBBF24", secondary: "#F59E0B", glow: "#D97706", tag: "TRÁFEGO & PERFORMANCE" },
  academic: { bg1: "#0F172A", bg2: "#1E293B", accent: "#94A3B8", secondary: "#64748B", glow: "#38BDF8", tag: "ACADÊMICO & PESQUISA" },
  print3d: { bg1: "#18181B", bg2: "#27272A", accent: "#F97316", secondary: "#EA580C", glow: "#C2410C", tag: "FABRICAÇÃO DIGITAL" },
  productivity: { bg1: "#0C1C24", bg2: "#143642", accent: "#34D399", secondary: "#10B981", glow: "#059669", tag: "ORGANIZAÇÃO & TEMPLATES" },
  utility: { bg1: "#0B132B", bg2: "#1C2541", accent: "#38BDF8", secondary: "#0284C7", glow: "#0284C7", tag: "SERVIÇOS RÁPIDOS" },
};

interface CoverConfig {
  name: string;
  cat: string;
  sub: string;
  theme: keyof typeof THEMES;
  icon: string;
}

/**
 * Mapeamento exclusivo para todos os serviços digitais, de software, acadêmicos,
 * de mídia e templates, garantindo que cada um tenha arte própria e exclusiva.
 */
const PRODUCT_CUSTOM_COVERS: Record<string, CoverConfig> = {
  // Acadêmicos
  "banners-academicos": {
    name: "Banners Acadêmicos",
    cat: "Acadêmicos",
    sub: "Apresentação & Congressos",
    theme: "academic",
    icon: "🎓",
  },
  "encadernacao-de-tcc-capa-mole": {
    name: "Encadernação de TCC",
    cat: "Acadêmicos",
    sub: "Capa Mole & Espiral Premium",
    theme: "academic",
    icon: "📚",
  },
  "trabalho-academico": {
    name: "Trabalho Acadêmico",
    cat: "Acadêmicos",
    sub: "Impressão & Normas ABNT",
    theme: "academic",
    icon: "📑",
  },

  // Brindes / Especial
  "impressao-3d": {
    name: "Impressão 3D Personalizada",
    cat: "Brindes & Criação",
    sub: "Prototipagem & Peças Exclusivas",
    theme: "print3d",
    icon: "🧊",
  },

  // Design Gráfico & Audiovisual
  "animacao-de-fotos-antigas": {
    name: "Animação de Fotos Antigas",
    cat: "Design Gráfico",
    sub: "Restauração & Movimento com IA",
    theme: "ai",
    icon: "🎞️",
  },
  "apresentacoes-catalogos": {
    name: "Apresentações & Catálogos",
    cat: "Design Gráfico",
    sub: "Design Digital Corporativo",
    theme: "design",
    icon: "📊",
  },
  "cobertura-de-eventos-e-festas": {
    name: "Cobertura de Eventos & Festas",
    cat: "Audiovisual",
    sub: "Captação & Registro Fotográfico",
    theme: "video",
    icon: "📸",
  },
  "criacao-de-identidade-visual": {
    name: "Criação de Identidade Visual",
    cat: "Branding",
    sub: "Logotipo, Cores & Manual de Marca",
    theme: "design",
    icon: "✨",
  },
  "identidade-visual": {
    name: "Criação de Logotipo & Marca",
    cat: "Branding",
    sub: "Identidade Visual Profissional",
    theme: "design",
    icon: "🎨",
  },
  "design-pecas": {
    name: "Design de Peças Digitais",
    cat: "Design Gráfico",
    sub: "Criativos para Mídia & Gráfica",
    theme: "design",
    icon: "🖌️",
  },
  "edicao-de-audio": {
    name: "Edição de Áudio",
    cat: "Audiovisual",
    sub: "Tratamento, Vinhetas & Podcasts",
    theme: "video",
    icon: "🎙️",
  },
  "edicao-de-videos": {
    name: "Edição de Vídeos Profissional",
    cat: "Audiovisual",
    sub: "Cortes, Efeitos, Cor & Legendas",
    theme: "video",
    icon: "🎬",
  },
  "remocao-de-fundo-de-imagens": {
    name: "Remoção de Fundo de Imagens",
    cat: "Design Gráfico",
    sub: "Recorte Preciso para E-commerce",
    theme: "design",
    icon: "✂️",
  },
  "remocao-de-objetos-e-pessoas": {
    name: "Remoção de Objetos & Pessoas",
    cat: "Design Gráfico",
    sub: "Edição & Limpeza Fotográfica",
    theme: "design",
    icon: "🪄",
  },
  "restauracao-de-imagens": {
    name: "Restauração de Imagens",
    cat: "Design Gráfico",
    sub: "Recuperação de Fotos Danificadas",
    theme: "design",
    icon: "🖼️",
  },
  "tratamento-de-pele-photoshop": {
    name: "Tratamento de Pele Photoshop",
    cat: "Design Gráfico",
    sub: "Retoque de Retratos Profissional",
    theme: "design",
    icon: "💎",
  },

  // Manutenção de Computadores & Mobile
  "diagnostico-hardware": {
    name: "Diagnóstico & Reparo Hardware",
    cat: "Manutenção",
    sub: "Análise Técnica de Componentes",
    theme: "tech",
    icon: "🛠️",
  },
  "formatacao-de-android": {
    name: "Formatação de Android",
    cat: "Mobile",
    sub: "Restauração de Fábrica & Otimização",
    theme: "mobile",
    icon: "🤖",
  },
  "formatacao-de-android-rapida": {
    name: "Formatação Express Android",
    cat: "Mobile",
    sub: "Reset Rápido & Limpeza Segura",
    theme: "mobile",
    icon: "⚡",
  },
  "formatacao-de-computadores-e-notebooks-com-backup": {
    name: "Formatação com Backup Completo",
    cat: "Manutenção",
    sub: "Salvamento Seguro de Dados & Windows",
    theme: "tech",
    icon: "💾",
  },
  "formatacao-de-computadores-e-notebooks-sem-backup": {
    name: "Formatação de PC & Notebook",
    cat: "Manutenção",
    sub: "Instalação Limpa de SO & Drivers",
    theme: "tech",
    icon: "🖥️",
  },
  "formatacao-de-ios-iphone-com-backup": {
    name: "Formatação iOS (iPhone)",
    cat: "Apple iOS",
    sub: "Restauração Segura com Backup iCloud",
    theme: "apple",
    icon: "🍎",
  },
  "formatacao-otimizacao": {
    name: "Formatação & Otimização",
    cat: "Manutenção",
    sub: "Aceleração, Limpeza & Desempenho",
    theme: "tech",
    icon: "🚀",
  },
  "limpeza-pasta-termica": {
    name: "Limpeza Preventiva & Térmica",
    cat: "Manutenção",
    sub: "Redução de Temperatura & Dissipação",
    theme: "tech",
    icon: "❄️",
  },
  "pacote-office-365-personal-plus": {
    name: "Pacote Office 365 Personal",
    cat: "Software",
    sub: "Word, Excel, PowerPoint & 1TB Nuvem",
    theme: "tech",
    icon: "💼",
  },
  "upgrade-ssd-ram": {
    name: "Upgrade de SSD & Memória RAM",
    cat: "Hardware",
    sub: "Velocidade até 10x Mais Rápida",
    theme: "tech",
    icon: "⚡",
  },

  // Outros & Produtividade
  "caderno-de-estudos-digital": {
    name: "Caderno de Estudos Digital",
    cat: "Produtividade",
    sub: "Template Interativo para Estudos",
    theme: "productivity",
    icon: "📖",
  },
  "cards-advanced-template": {
    name: "Cards Advanced Template",
    cat: "Produtividade",
    sub: "Layout Moderno de Cartões Notionais",
    theme: "productivity",
    icon: "🗂️",
  },
  "game-dash-v1-0-template": {
    name: "Game Dash v1.0 Template",
    cat: "Produtividade",
    sub: "Dashboard Gamer & Backlog Tracker",
    theme: "productivity",
    icon: "🎮",
  },
  "laminacao-e-plastificacao": {
    name: "Laminação & Plastificação",
    cat: "Gráfica",
    sub: "Proteção Térmica para Documentos",
    theme: "utility",
    icon: "🛡️",
  },
  "mapeamento-de-metas-e-habit-tracker": {
    name: "Metas & Habit Tracker",
    cat: "Produtividade",
    sub: "Controle de Rotinas & Hábitos",
    theme: "productivity",
    icon: "🎯",
  },
  "planner-2025-administrando-sua-vida": {
    name: "Planner 2025: Gestão de Vida",
    cat: "Produtividade",
    sub: "Planejamento Anual & Financeiro",
    theme: "productivity",
    icon: "📅",
  },
  "planner-book-template": {
    name: "Planner Book Template",
    cat: "Produtividade",
    sub: "Organizador Editorial & Leituras",
    theme: "productivity",
    icon: "📚",
  },
  "planner-de-estudos-template": {
    name: "Planner de Estudos Template",
    cat: "Produtividade",
    sub: "Cronograma de Aulas & Concursos",
    theme: "productivity",
    icon: "📝",
  },
  "registro-de-habitos-template": {
    name: "Registro de Hábitos Template",
    cat: "Produtividade",
    sub: "Acompanhamento Diário & Gráficos",
    theme: "productivity",
    icon: "📊",
  },
  "segunda-via-contas": {
    name: "Segunda Via de Contas",
    cat: "Serviços Digitais",
    sub: "Emissão & Consulta Rápida de Boletos",
    theme: "utility",
    icon: "🧾",
  },

  // Programação & Web
  "automacoes-integracoes": {
    name: "Automações & Integrações",
    cat: "Programação",
    sub: "Webhooks, APIs & Fluxos Sem Código",
    theme: "code",
    icon: "⚡",
  },
  "criacao-de-apps": {
    name: "Criação de Aplicativos Mobile",
    cat: "Programação",
    sub: "Apps iOS & Android Sob Medida",
    theme: "code",
    icon: "📲",
  },
  "criacao-de-sites": {
    name: "Criação de Sites Profissionais",
    cat: "Programação",
    sub: "Design Exclusivo, Rápido & Responsivo",
    theme: "code",
    icon: "🌐",
  },
  "sites-landing-pages": {
    name: "Sites & Landing Pages",
    cat: "Programação",
    sub: "Foco Total em Vendas & Conversão",
    theme: "code",
    icon: "🚀",
  },
  "hackprompt-chatgpt": {
    name: "HackPrompt ChatGPT",
    cat: "Inteligência Artificial",
    sub: "Comandos & Engenharia de Prompts",
    theme: "ai",
    icon: "🤖",
  },
  "loja-virtual": {
    name: "Desenvolvimento Loja Virtual",
    cat: "E-Commerce",
    sub: "Catálogo, Meios de Pagamento & Frete",
    theme: "code",
    icon: "🛍️",
  },
  "sistemas-sob-medida": {
    name: "Sistemas Web Sob Medida",
    cat: "Programação",
    sub: "Softwares Customizados para seu Negócio",
    theme: "code",
    icon: "💻",
  },

  // Social Media & Tráfego
  "design-para-midias-sociais-avulso": {
    name: "Design Mídias Sociais (Avulso)",
    cat: "Social Media",
    sub: "Posts & Stories Personalizados",
    theme: "social",
    icon: "📱",
  },
  "design-para-midias-sociais-mensal": {
    name: "Design Mídias Sociais (Mensal)",
    cat: "Social Media",
    sub: "Plano Recorrente de Criativos",
    theme: "social",
    icon: "📅",
  },
  "edicao-reels": {
    name: "Edição de Reels & Shorts",
    cat: "Social Media",
    sub: "Vídeos Dinâmicos para TikTok & Reels",
    theme: "video",
    icon: "⚡",
  },
  "gestao-de-midias-sociais": {
    name: "Gestão de Mídias Sociais",
    cat: "Social Media",
    sub: "Estratégia, Cronograma & Publicação",
    theme: "social",
    icon: "📣",
  },
  "gestao-redes-sociais": {
    name: "Gestão Mensal de Redes Sociais",
    cat: "Social Media",
    sub: "Acompanhamento, Métricas & Crescimento",
    theme: "social",
    icon: "📈",
  },
  "pacote-artes-feed-stories": {
    name: "Pacote Artes Feed & Stories",
    cat: "Social Media",
    sub: "Templates Editáveis & Identidade Visual",
    theme: "social",
    icon: "🖼️",
  },
  "planejamento-social-media": {
    name: "Planejamento Estratégico Social",
    cat: "Social Media",
    sub: "Linha Editorial, Tom de Voz & Calendário",
    theme: "social",
    icon: "🗺️",
  },
  "trafego-pago": {
    name: "Tráfego Pago (Meta & Google Ads)",
    cat: "Marketing Digital",
    sub: "Campanhas Estratégicas para Escala",
    theme: "ads",
    icon: "🎯",
  },
};

/**
 * Gera uma capa gráfica em SVG com gradiente dinâmico, grid futurista e branding da Decode Analytics.
 */
function renderProductSvg(config: CoverConfig): string {
  // Fallback fotográfico: não gerar capas SVG ou ícones para serviços.
  const themeImages: Record<keyof typeof THEMES, string> = {
    tech: imgManutencao, mobile: imgManutencao, apple: imgManutencao,
    ai: imgProgramacao, code: imgProgramacao, design: imgDesign,
    video: imgSocialMedia, social: imgSocialMedia, ads: imgSocialMedia,
    academic: imgNotebook, print3d: imgBrindes, productivity: imgNotebook,
    utility: imgDesign,
  };
  return themeImages[config.theme] || imgManutencao;
}

// Imagens específicas de produtos físicos, indexadas pelo slug normalizado.
const PHYSICAL_PRODUCT_IMAGES: Record<string, string> = {
  // Adesivos & Rótulos
  "adesivo-chao": imgFloorSticker,
  "adesivo-bopp-transparente": imgLabelTransparent,
  "rotulo-cosmetico": imgLabelTransparent,
  "adesivo-vinil": imgAdesivos,
  "etiqueta-redonda": imgAdesivos,
  "adesivacao-vitrine-veiculo": imgFloorSticker,

  // Banners & Fachadas
  "banner-lona-440g": imgBanners,
  "banner-vinil-280g": imgBannerBacklight,
  "banner-backlight": imgBannerBacklight,
  "fachada-acm": imgBannerBacklight,
  "lona-front-light": imgBanners,

  // Brindes & Papelaria
  "bloco-anotacoes": imgNotebook,
  "caderno-a5": imgNotebook,
  "calendario-mesa": imgCalendar,
  "calendario-parede": imgCalendar,
  "caneta-brinde": imgPen,
  "copos-termicos-personalizados": imgSqueeze,
  "boné-personalizado": imgCap,
  "bone-personalizado": imgCap,
  "bonés-personalizados": imgCap,
  "bone": imgCap,
  "boné": imgCap,
  "impressao-3d": imgBrindes,
  "topo-de-bolo": imgBrindes,
  "topos-de-bolo": imgBrindes,
  "dtf-uv": imgAdesivos,
  "adesivo-dtf-uv": imgAdesivos,
  "plotagem-a3": imgPlotagem,
  "chaveiro-personalizado": imgKeychain,
  "avental": imgEcobag,
  "adesivo-holografico": imgHoloSticker,
  "manutencao-de-computadores": imgManutencao,
  "criacao-de-sites": imgProgramacao,
  "sites-landing-pages": imgProgramacao,
  "gestao-de-midias-sociais": imgSocialMedia,
  "design-para-midias-sociais-avulso": imgSocialMedia,
  "design-para-midias-sociais-mensal": imgSocialMedia,
  "ecobag": imgEcobag,
  "ima-geladeira": imgKeychain,
  "mouse-pad": imgMousepad,
  "squeeze-500ml": imgSqueeze,
  "tag-personalizada": imgKeychain,

  // Vestuário
  "camiseta-dtf": imgCamisetas,
  "camiseta-sublimada": imgCamisetas,
  "camiseta-silk": imgPolo,
  "polo-bordada": imgPolo,
  "camiseta-personalizada": imgCamisetas,

  // Canecas
  "caneca-plastico": imgCanecas,
  "caneca-porcelana": imgMagicMug,
  "caneca-magica": imgMagicMug,
  "caneca-personalizada": imgCanecas,

  // Cartões & Identificação
  "cartao-couche-250g": imgBusinessCard,
  "cartao-visita-couche-300g": imgBusinessCard,
  "cartao-visita-laminado-fosco": imgBusinessCard,
  "cartao-verniz-localizado": imgBusinessCard,
  "cartao-kraft": imgBusinessCard,
  "cartao-pvc": imgIdBadge,
  "convite-casamento": imgWeddingInvite,
  "convites-personalizados": imgWeddingInvite,
  "cracha": imgIdBadge,
  "talao-pedido": imgNotebook,

  // Embalagens
  "caixa-delivery": imgDeliveryBox,
  "embalagem-personalizada": imgDeliveryBox,
  "embalagem-hot-stamping": imgDeliveryBox,
  "sacola-kraft": imgKraftBag,

  // Panfletos, Menus e Folders
  "cardapio-plastificado": imgMenu,
  "folder-3-dobras": imgBrochure,
  "grandes-tiragens-de-cartazes-e-panfletos": imgPoster,
  "panfleto-a4": imgPanfletos,
  "panfleto-a5-couche-115g": imgBrochure,
  "panfleto-a6": imgPanfletos,

  // Plotagem & Pôsteres
  "plotagem-a0-color": imgPlotagem,
  "plotagem-a2-pb": imgPlotBw,
  "plotagem-a3-colorida": imgPlotagem,
  "poster-fine-art": imgPoster,
};

/**
 * Fotografias reais de alta definição para todos os serviços técnicos, digitais e soluções Decode Analytics.
 * Cada serviço possui sua fotografia real de bancada técnica, profissionais e equipamentos especializados.
 */
const SERVICE_REAL_PHOTOS: Record<string, string> = {
  // Manutenção & Formatação de Computadores, Notebooks e Smartphones
  "formatacao-de-android":
    "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80",
  "formatacao-de-android-rapida":
    "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=900&q=80",
  "formatacao-de-ios-iphone-com-backup":
    "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=900&q=80",
  "formatacao-de-computadores-e-notebooks-com-backup":
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=900&q=80",
  "formatacao-de-computadores-e-notebooks-sem-backup":
    "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=900&q=80",
  "formatacao-otimizacao":
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=900&q=80",
  "limpeza-pasta-termica":
    "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=900&q=80",
  "upgrade-ssd-ram":
    "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=900&q=80",
  "diagnostico-hardware":
    "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80",
  "manutencao-de-computadores":
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=900&q=80",
  "pacote-office-365-personal-plus":
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=900&q=80",

  // Programação, Softwares, Web & IA
  "criacao-de-sites":
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80",
  "sites-landing-pages":
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80",
  "criacao-de-apps":
    "https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=900&q=80",
  "loja-virtual":
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80",
  "sistemas-sob-medida":
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=900&q=80",
  "automacoes-integracoes":
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80",
  "hackprompt-chatgpt":
    "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=900&q=80",

  // Design Gráfico & Audiovisual
  "criacao-de-identidade-visual":
    "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=900&q=80",
  "identidade-visual":
    "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=900&q=80",
  "design-pecas":
    "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=900&q=80",
  "apresentacoes-catalogos":
    "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=900&q=80",
  "edicao-de-videos":
    "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=900&q=80",
  "edicao-de-audio":
    "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=900&q=80",
  "animacao-de-fotos-antigas":
    "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=900&q=80",
  "restauracao-de-imagens":
    "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=900&q=80",
  "remocao-de-fundo-de-imagens":
    "https://images.unsplash.com/photo-1572044162444-ad60f128bdea?auto=format&fit=crop&w=900&q=80",
  "remocao-de-objetos-e-pessoas":
    "https://images.unsplash.com/photo-1572044162444-ad60f128bdea?auto=format&fit=crop&w=900&q=80",
  "tratamento-de-pele-photoshop":
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80",
  "cobertura-de-eventos-e-festas":
    "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80",

  // Social Media & Marketing
  "gestao-de-midias-sociais":
    "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=900&q=80",
  "gestao-redes-sociais":
    "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=900&q=80",
  "planejamento-social-media":
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80",
  "design-para-midias-sociais-mensal":
    "https://images.unsplash.com/photo-1611162616475-46b635cb6868?auto=format&fit=crop&w=900&q=80",
  "design-para-midias-sociais-avulso":
    "https://images.unsplash.com/photo-1611162616475-46b635cb6868?auto=format&fit=crop&w=900&q=80",
  "pacote-artes-feed-stories":
    "https://images.unsplash.com/photo-1611162616475-46b635cb6868?auto=format&fit=crop&w=900&q=80",
  "trafego-pago":
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80",
  "edicao-reels":
    "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=900&q=80",

  // Acadêmicos, Templates & Documentos
  "trabalho-academico":
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=900&q=80",
  "banners-academicos":
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80",
  "encadernacao-de-tcc-capa-mole":
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=900&q=80",
  "caderno-de-estudos-digital":
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=900&q=80",
  "planner-2025-administrando-sua-vida":
    "https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=900&q=80",
  "planner-book-template":
    "https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=900&q=80",
  "planner-de-estudos-template":
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=900&q=80",
  "game-dash-v1-0-template":
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80",
  "cards-advanced-template":
    "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=900&q=80",
  "registro-de-habitos-template":
    "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=900&q=80",
  "mapeamento-de-metas-e-habit-tracker":
    "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=900&q=80",
  "segunda-via-contas":
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80",
  "laminacao-e-plastificacao":
    "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=900&q=80",
};

// Mapeamento de imagens padrão por nome de arquivo quando o banco traz referências do tipo __l5e ou paths legados
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
  "design.jpg": imgDesign,
  "manutencao.jpg": imgManutencao,
  "programacao.jpg": imgProgramacao,
  "socialmedia.jpg": imgSocialMedia,
};

function getImageFromFileName(imageUrl: string): string | undefined {
  const fileName = imageUrl.split(/[?#]/)[0]?.split("/").pop()?.toLowerCase();
  return fileName ? PRODUCT_IMAGES_BY_FILE[fileName] : undefined;
}

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
  "Social Media": imgSocialMedia,
  "Design Gráfico": imgDesign,
  Encadernação: imgNotebook,
  "Laminação e Plastificação": imgLabelTransparent,
  Cartazes: imgPoster,
  Convites: imgWeddingInvite,
  "Copos Térmicos": imgSqueeze,
};

function normalizeKey(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-");
}

/**
 * Resolve e retorna a imagem correspondente e específica ao produto,
 * combinando fotos dedicadas, capas personalizadas pelo nome do serviço
 * e gradientes temáticos da Decode Analytics.
 */
export function resolveProductImage(
  imageUrl: string | null | undefined,
  category: string | null | undefined,
  slugOrName?: string | null,
): string {
  const normKey = slugOrName ? normalizeKey(slugOrName) : "";

  // 1. Verificar se o registro possui imagem
  const normalizedUrl = imageUrl?.trim();

  // Fotos genéricas de categoria (ex.: cartoes.jpg) ou caminhos __l5e não devem
  // sobrepor a foto específica do produto quando ela existe.
  const isGenericOrLegacy =
    !!normalizedUrl &&
    (normalizedUrl.startsWith("/__l5e/") || !!getImageFromFileName(normalizedUrl));
  if ((!normalizedUrl || isGenericOrLegacy) && normKey && PHYSICAL_PRODUCT_IMAGES[normKey]) {
    return PHYSICAL_PRODUCT_IMAGES[normKey];
  }

  if (normalizedUrl) {
    // Se for um caminho legado (__l5e ou /assets/products/), mapeia para o asset local real de alta resolução
    const localAssetFromPath = getImageFromFileName(normalizedUrl);
    if (localAssetFromPath) {
      return localAssetFromPath;
    }

    const isSupportedImageUrl =
      normalizedUrl.startsWith("https://") ||
      normalizedUrl.startsWith("http://") ||
      normalizedUrl.startsWith("data:") ||
      normalizedUrl.startsWith("blob:") ||
      normalizedUrl.startsWith("/");
    // Se for URL válida externa ou caminho relativo suportado, preserva
    if (isSupportedImageUrl) {
      return normalizedUrl;
    }
  }

  // 2. Se for um produto físico mapeado para foto específica em alta definição
  if (normKey && PHYSICAL_PRODUCT_IMAGES[normKey]) {
    return PHYSICAL_PRODUCT_IMAGES[normKey];
  }

  // 3. Se for um serviço técnico ou solução digital com foto real de alta definição dedicada
  if (normKey && SERVICE_REAL_PHOTOS[normKey]) {
    return SERVICE_REAL_PHOTOS[normKey];
  }

  // 4. Mapeamento heurístico inteligente de fotografias reais por termos no slug ou nome
  if (normKey) {
    if (normKey.includes("android")) {
      return SERVICE_REAL_PHOTOS["formatacao-de-android"];
    }
    if (normKey.includes("iphone") || normKey.includes("ios") || normKey.includes("apple")) {
      return SERVICE_REAL_PHOTOS["formatacao-de-ios-iphone-com-backup"];
    }
    if (normKey.includes("formatacao") || normKey.includes("backup")) {
      return SERVICE_REAL_PHOTOS["formatacao-de-computadores-e-notebooks-com-backup"];
    }
    if (normKey.includes("ssd") || normKey.includes("ram") || normKey.includes("upgrade")) {
      return SERVICE_REAL_PHOTOS["upgrade-ssd-ram"];
    }
    if (normKey.includes("pasta-termica") || normKey.includes("limpeza")) {
      return SERVICE_REAL_PHOTOS["limpeza-pasta-termica"];
    }
    if (normKey.includes("hardware") || normKey.includes("diagnostico")) {
      return SERVICE_REAL_PHOTOS["diagnostico-hardware"];
    }
    if (normKey.includes("office") || normKey.includes("365")) {
      return SERVICE_REAL_PHOTOS["pacote-office-365-personal-plus"];
    }
    if (normKey.includes("chatgpt") || normKey.includes("prompt") || normKey.includes("ia")) {
      return SERVICE_REAL_PHOTOS["hackprompt-chatgpt"];
    }
    if (normKey.includes("app") || normKey.includes("mobile")) {
      return SERVICE_REAL_PHOTOS["criacao-de-apps"];
    }
    if (normKey.includes("landing") || normKey.includes("site") || normKey.includes("web")) {
      return SERVICE_REAL_PHOTOS["criacao-de-sites"];
    }
    if (normKey.includes("loja") || normKey.includes("ecommerce")) {
      return SERVICE_REAL_PHOTOS["loja-virtual"];
    }
    if (normKey.includes("reels") || normKey.includes("tiktok") || normKey.includes("video")) {
      return SERVICE_REAL_PHOTOS["edicao-reels"];
    }
    if (normKey.includes("audio") || normKey.includes("podcast")) {
      return SERVICE_REAL_PHOTOS["edicao-de-audio"];
    }
    if (normKey.includes("trafego") || normKey.includes("ads") || normKey.includes("meta")) {
      return SERVICE_REAL_PHOTOS["trafego-pago"];
    }
    if (normKey.includes("segunda-via") || normKey.includes("contas")) {
      return SERVICE_REAL_PHOTOS["segunda-via-contas"];
    }
    if (normKey.includes("planner")) {
      return SERVICE_REAL_PHOTOS["planner-2025-administrando-sua-vida"];
    }
    if (normKey.includes("habito") || normKey.includes("meta")) {
      return SERVICE_REAL_PHOTOS["mapeamento-de-metas-e-habit-tracker"];
    }
    if (normKey.includes("tcc") || normKey.includes("academico")) {
      return SERVICE_REAL_PHOTOS["encadernacao-de-tcc-capa-mole"];
    }
    if (normKey.includes("3d")) {
      return imgBrindes;
    }
    if (normKey.includes("cracha") || normKey.includes("badge")) {
      return imgIdBadge;
    }
    if (normKey.includes("casamento") || normKey.includes("convite")) {
      return imgWeddingInvite;
    }
    if (normKey.includes("cardapio") || normKey.includes("menu")) {
      return imgMenu;
    }
    if (normKey.includes("sacola")) {
      return imgKraftBag;
    }
    if (normKey.includes("caixa") || normKey.includes("delivery")) {
      return imgDeliveryBox;
    }
    if (normKey.includes("folder") || normKey.includes("dobras")) {
      return imgBrochure;
    }
    if (normKey.includes("calendario")) {
      return imgCalendar;
    }
    if (normKey.includes("caneta")) {
      return imgPen;
    }
    if (normKey.includes("mouse-pad") || normKey.includes("mousepad")) {
      return imgMousepad;
    }
    if (normKey.includes("squeeze") || normKey.includes("copo")) {
      return imgSqueeze;
    }
    if (normKey.includes("ecobag")) {
      return imgEcobag;
    }
    if (normKey.includes("caneca-magica")) {
      return imgMagicMug;
    }
  }

  // 5. Se houver configuração legada para capa gerada de software/serviço
  if (normKey && PRODUCT_CUSTOM_COVERS[normKey]) {
    return renderProductSvg(PRODUCT_CUSTOM_COVERS[normKey]);
  }

  // 5. Fallback por categoria se nenhuma regra específica bateu
  if (category) {
    const catLower = category.toLowerCase();
    if (catLower.includes("manutencao") || catLower.includes("computador")) {
      return imgManutencao;
    }
    if (catLower.includes("programacao") || catLower.includes("software")) {
      return imgProgramacao;
    }
    if (catLower.includes("social") || catLower.includes("midia")) {
      return imgSocialMedia;
    }
    if (catLower.includes("design")) {
      return imgDesign;
    }
    if (CATEGORY_IMAGES[category]) {
      return CATEGORY_IMAGES[category];
    }
  }

  // Se nada mais bater, gera uma capa personalizada genérica com o nome recebido
  const cleanTitle = slugOrName ? slugOrName.replace(/[-_]+/g, " ") : "Solução Especializada";
  return renderProductSvg({
    name: cleanTitle,
    cat: category || "Decode Analytics",
    sub: "Solução Personalizada",
    theme: "tech",
    icon: "💎",
  });
}


/** Retorna uma imagem local de categoria para servir como segunda tentativa. */
export function resolveProductFallbackImage(category: string | null | undefined): string {
  return resolveProductImage(null, category, null);
}
