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
  const t = THEMES[config.theme] || THEMES.tech;
  const safeName = (config.name || "Serviço").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeCat = (config.cat || t.tag || "DECODE").toUpperCase().replace(/&/g, "&amp;");
  const safeSub = (config.sub || "SOLUÇÃO ESPECIALIZADA").toUpperCase().replace(/&/g, "&amp;");
  const icon = config.icon || "⚡";

  // Quebra de linha inteligente para títulos longos
  let line1 = safeName;
  let line2 = "";
  if (safeName.length > 22) {
    const words = safeName.split(" ");
    let cur = "";
    for (let i = 0; i < words.length; i++) {
      if ((cur + " " + words[i]).trim().length <= 22) {
        cur = (cur + " " + words[i]).trim();
      } else {
        line1 = cur;
        line2 = words.slice(i).join(" ");
        break;
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${t.bg1}" />
      <stop offset="100%" stop-color="${t.bg2}" />
    </linearGradient>
    <linearGradient id="acc" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${t.accent}" />
      <stop offset="100%" stop-color="${t.secondary}" />
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.035)" stroke-width="1" />
    </pattern>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="70" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <rect width="800" height="800" fill="url(#bg)" />
  <rect width="800" height="800" fill="url(#grid)" />

  <!-- Ambient Glow -->
  <circle cx="400" cy="330" r="260" fill="${t.glow}" opacity="0.16" filter="url(#glow)" />
  <circle cx="680" cy="160" r="140" fill="${t.accent}" opacity="0.12" filter="url(#glow)" />
  <circle cx="120" cy="680" r="140" fill="${t.secondary}" opacity="0.10" filter="url(#glow)" />

  <!-- Outer Elegant Card Frame -->
  <rect x="44" y="44" width="712" height="712" rx="36" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2" />
  <rect x="52" y="52" width="696" height="696" rx="28" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1" />

  <!-- Corner Accent Lights -->
  <path d="M 44 94 L 44 44 L 94 44" fill="none" stroke="${t.accent}" stroke-width="3" stroke-linecap="round" />
  <path d="M 756 94 L 756 44 L 706 44" fill="none" stroke="${t.accent}" stroke-width="3" stroke-linecap="round" />
  <path d="M 44 706 L 44 756 L 94 756" fill="none" stroke="${t.accent}" stroke-width="3" stroke-linecap="round" />
  <path d="M 756 706 L 756 756 L 706 756" fill="none" stroke="${t.accent}" stroke-width="3" stroke-linecap="round" />

  <!-- Top Brand Pill -->
  <g transform="translate(80, 84)">
    <rect x="0" y="0" width="168" height="38" rx="19" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" stroke-width="1" />
    <circle cx="20" cy="19" r="5" fill="${t.accent}" />
    <text x="96" y="24" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="800" letter-spacing="2" text-anchor="middle">DECODE ANALYTICS</text>
  </g>

  <!-- Category Tag -->
  <g transform="translate(720, 84)">
    <text x="0" y="24" fill="${t.accent}" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="800" letter-spacing="2" text-anchor="end">${safeCat}</text>
  </g>

  <!-- Central Symbol Disc -->
  <g transform="translate(400, 280)">
    <circle cx="0" cy="0" r="92" fill="rgba(255,255,255,0.02)" stroke="url(#acc)" stroke-width="2" />
    <circle cx="0" cy="0" r="80" fill="rgba(11,16,38,0.85)" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
    <text x="0" y="16" font-size="52" text-anchor="middle" dominant-baseline="middle">${icon}</text>
  </g>

  <!-- Subtitle / Tagline -->
  <text x="400" y="425" fill="${t.accent}" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="800" letter-spacing="3" text-anchor="middle">${safeSub}</text>

  <!-- Main Product Title -->
  ${
    line2
      ? `
  <text x="400" y="480" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="800" text-anchor="middle">
    ${line1}
  </text>
  <text x="400" y="525" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="30" font-weight="800" text-anchor="middle">
    ${line2}
  </text>
  `
      : `
  <text x="400" y="500" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="800" text-anchor="middle">
    ${line1}
  </text>
  `
  }

  <!-- Bottom Accent Divider Bar -->
  <rect x="260" y="580" width="280" height="4" rx="2" fill="url(#acc)" />

  <!-- Bottom Badges / Trust Info -->
  <g transform="translate(400, 680)">
    <rect x="-180" y="-18" width="360" height="36" rx="18" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
    <text x="0" y="5" fill="rgba(255,255,255,0.7)" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" letter-spacing="1.5" text-anchor="middle">SOLUÇÃO EXCLUSIVA • SUPORTE DECODE</text>
  </g>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Mapeamento fotográfico de produtos físicos do catálogo para imagens reais de alta definição.
 */
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
  "fachada-acm": imgBannerBacklight,
  "lona-front-light": imgBanners,

  // Brindes & Papelaria
  "bloco-anotacoes": imgNotebook,
  "caderno-a5": imgNotebook,
  "calendario-mesa": imgCalendar,
  "calendario-parede": imgCalendar,
  "caneta-brinde": imgPen,
  "copos-termicos-personalizados": imgSqueeze,
  "ecobag": imgEcobag,
  "ima-geladeira": imgKeychain,
  "mouse-pad": imgMousepad,
  "squeeze-500ml": imgSqueeze,
  "tag-personalizada": imgKeychain,

  // Vestuário
  "camiseta-dtf": imgCamisetas,
  "camiseta-sublimada": imgCamisetas,

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

  // 1. Verificar se é uma imagem externa válida/própria enviada pelo usuário (ex: S3, Supabase Storage, CDN)
  const normalizedUrl = imageUrl?.trim();
  if (normalizedUrl) {
    const isLegacyAssetPath =
      normalizedUrl.startsWith("/__l5e/") ||
      normalizedUrl.startsWith("/products/") ||
      normalizedUrl.startsWith("/assets/products/");
    if (
      !isLegacyAssetPath &&
      (normalizedUrl.startsWith("https://") ||
        normalizedUrl.startsWith("http://") ||
        normalizedUrl.startsWith("data:") ||
        normalizedUrl.startsWith("blob:"))
    ) {
      return normalizedUrl;
    }
  }

  // 2. Se for um produto físico mapeado para foto específica em alta definição
  if (normKey && PHYSICAL_PRODUCT_IMAGES[normKey]) {
    return PHYSICAL_PRODUCT_IMAGES[normKey];
  }

  // 3. Se houver configuração dedicada para capa gerada de software/serviço
  if (normKey && PRODUCT_CUSTOM_COVERS[normKey]) {
    return renderProductSvg(PRODUCT_CUSTOM_COVERS[normKey]);
  }

  // 4. Mapeamento heurístico inteligente por termos no slug ou nome
  if (normKey) {
    if (normKey.includes("office") || normKey.includes("365")) {
      return renderProductSvg(PRODUCT_CUSTOM_COVERS["pacote-office-365-personal-plus"]);
    }
    if (normKey.includes("iphone") || normKey.includes("ios") || normKey.includes("apple")) {
      return renderProductSvg(PRODUCT_CUSTOM_COVERS["formatacao-de-ios-iphone-com-backup"]);
    }
    if (normKey.includes("android")) {
      return renderProductSvg(PRODUCT_CUSTOM_COVERS["formatacao-de-android"]);
    }
    if (normKey.includes("formatacao") || normKey.includes("backup")) {
      return renderProductSvg(PRODUCT_CUSTOM_COVERS["formatacao-de-computadores-e-notebooks-com-backup"]);
    }
    if (normKey.includes("ssd") || normKey.includes("ram") || normKey.includes("upgrade")) {
      return renderProductSvg(PRODUCT_CUSTOM_COVERS["upgrade-ssd-ram"]);
    }
    if (normKey.includes("pasta-termica") || normKey.includes("limpeza")) {
      return renderProductSvg(PRODUCT_CUSTOM_COVERS["limpeza-pasta-termica"]);
    }
    if (normKey.includes("hardware") || normKey.includes("diagnostico")) {
      return renderProductSvg(PRODUCT_CUSTOM_COVERS["diagnostico-hardware"]);
    }
    if (normKey.includes("chatgpt") || normKey.includes("prompt") || normKey.includes("ia")) {
      return renderProductSvg(PRODUCT_CUSTOM_COVERS["hackprompt-chatgpt"]);
    }
    if (normKey.includes("app") || normKey.includes("mobile")) {
      return renderProductSvg(PRODUCT_CUSTOM_COVERS["criacao-de-apps"]);
    }
    if (normKey.includes("landing") || normKey.includes("site") || normKey.includes("web")) {
      return renderProductSvg(PRODUCT_CUSTOM_COVERS["criacao-de-sites"]);
    }
    if (normKey.includes("loja") || normKey.includes("ecommerce")) {
      return renderProductSvg(PRODUCT_CUSTOM_COVERS["loja-virtual"]);
    }
    if (normKey.includes("reels") || normKey.includes("tiktok") || normKey.includes("video")) {
      return renderProductSvg(PRODUCT_CUSTOM_COVERS["edicao-reels"]);
    }
    if (normKey.includes("audio") || normKey.includes("podcast")) {
      return renderProductSvg(PRODUCT_CUSTOM_COVERS["edicao-de-audio"]);
    }
    if (normKey.includes("trafego") || normKey.includes("ads") || normKey.includes("meta")) {
      return renderProductSvg(PRODUCT_CUSTOM_COVERS["trafego-pago"]);
    }
    if (normKey.includes("segunda-via") || normKey.includes("contas")) {
      return renderProductSvg(PRODUCT_CUSTOM_COVERS["segunda-via-contas"]);
    }
    if (normKey.includes("planner")) {
      return renderProductSvg(PRODUCT_CUSTOM_COVERS["planner-2025-administrando-sua-vida"]);
    }
    if (normKey.includes("habito") || normKey.includes("meta")) {
      return renderProductSvg(PRODUCT_CUSTOM_COVERS["mapeamento-de-metas-e-habit-tracker"]);
    }
    if (normKey.includes("tcc") || normKey.includes("academico")) {
      return renderProductSvg(PRODUCT_CUSTOM_COVERS["encadernacao-de-tcc-capa-mole"]);
    }
    if (normKey.includes("3d")) {
      return renderProductSvg(PRODUCT_CUSTOM_COVERS["impressao-3d"]);
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
