import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Download,
  Github,
  Search,
  ExternalLink,
  Shield,
  Zap,
  RefreshCw,
  Cpu,
  Monitor,
  Terminal,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Layers,
  Palette,
  Film,
  Camera,
  FileText,
  Code,
  Layout,
  Music,
  Box,
  Table as TableIcon,
  Sliders,
} from "lucide-react";
import { StoreShell } from "@/components/storefront/StoreShell";

export interface LauncherApp {
  id: string;
  name: string;
  category: "Visual" | "Vídeo" | "Editorial" | "Produtividade" | "Engenharia & Áudio";
  tagline: string;
  description: string;
  color: string;
  icon: string;
  githubRepo: string;
}

export const APPS_DATA: LauncherApp[] = [
  {
    id: "photocraft",
    name: "PhotoDecode",
    category: "Visual",
    tagline: "Edição de fotos profissional",
    description:
      "Edição raster avançada com suporte a camadas, máscaras, ajustes não-destrutivos e compatibilidade nativa com arquivos PSD reais.",
    color: "#2F7BF5",
    icon: "/apps/photocraft.png",
    githubRepo: "storytold/photocraft",
  },
  {
    id: "vectorcraft",
    name: "VectorDecode",
    category: "Visual",
    tagline: "Ilustração vetorial precisa",
    description:
      "Criação de vetores escaláveis, logotipos, ícones e ilustrações complexas com curva de Bézier intuitiva e exportação SVG/PDF.",
    color: "#E8573F",
    icon: "/apps/vectorcraft.png",
    githubRepo: "storytold/vectorcraft",
  },
  {
    id: "filmcraft",
    name: "FilmDecode",
    category: "Vídeo",
    tagline: "Edição de vídeo, cor e som",
    description:
      "Editor não-linear completo com timeline em tempo real, gradação de cor com curvas/LUTs e sincronização de múltiplas faixas de áudio.",
    color: "#8B5CF6",
    icon: "/apps/filmcraft.png",
    githubRepo: "storytold/filmcraft",
  },
  {
    id: "lightcraft",
    name: "LightDecode",
    category: "Visual",
    tagline: "Catálogo fotográfico e revelação RAW",
    description:
      "Fluxo de trabalho para fotógrafos: importação, organização por tags, tratamento de cor em lote e revelação precisa de arquivos RAW.",
    color: "#F2A516",
    icon: "/apps/lightcraft.png",
    githubRepo: "storytold/lightcraft",
  },
  {
    id: "pdfcraft",
    name: "PdfDecode",
    category: "Editorial",
    tagline: "Leitura, organização e proteção de PDFs",
    description:
      "Visualização de alta velocidade, divisão, junção, proteção criptográfica, anotações e assinatura eletrônica de documentos PDF.",
    color: "#12A58A",
    icon: "/apps/pdfcraft.png",
    githubRepo: "storytold/pdfcraft",
  },
  {
    id: "effectcraft",
    name: "EffectDecode",
    category: "Vídeo",
    tagline: "Motion graphics e efeitos visuais",
    description:
      "Composição visual avançada, animação baseada em keyframes, efeitos de partículas e integração com fluxos de produção cinematográfica.",
    color: "#A855F7",
    icon: "/apps/effectcraft.png",
    githubRepo: "storytold/effectcraft",
  },
  {
    id: "designcraft",
    name: "DesignDecode",
    category: "Editorial",
    tagline: "Diagramação e publicação gráfica",
    description:
      "Layout editorial para livros, revistas, catálogos e folhetos com suporte completo a espaços de cor CMYK e sangrias para impressão.",
    color: "#EC4899",
    icon: "/apps/designcraft.png",
    githubRepo: "storytold/designcraft",
  },
  {
    id: "figcraft",
    name: "FigDecode",
    category: "Visual",
    tagline: "Design de interfaces e componentes",
    description:
      "Construção de interfaces de usuário (UI/UX), auto-layout responsivo, tokens de design e componentes reutilizáveis para web e apps.",
    color: "#06B6D4",
    icon: "/apps/figcraft.png",
    githubRepo: "storytold/figcraft",
  },
  {
    id: "wordcraft",
    name: "WordDecode",
    category: "Produtividade",
    tagline: "Processador de texto focado na escrita",
    description:
      "Interface limpa e sem distrações para redação de artigos, contratos e documentos técnicos com controle tipográfico impecável.",
    color: "#3B82F6",
    icon: "/apps/wordcraft.png",
    githubRepo: "storytold/wordcraft",
  },
  {
    id: "deckcraft",
    name: "DeckDecode",
    category: "Produtividade",
    tagline: "Slides modernos e apresentações dinâmicas",
    description:
      "Criação ágil de pitch decks e apresentações corporativas com transições fluidas e modo de apresentação em tela cheia sem travamentos.",
    color: "#F43F5E",
    icon: "/apps/deckcraft.png",
    githubRepo: "storytold/deckcraft",
  },
  {
    id: "gridcraft",
    name: "GridDecode",
    category: "Produtividade",
    tagline: "Planilhas velozes e análise de dados",
    description:
      "Processamento de dados e planilhas em alta velocidade com motor nativo em Rust, fórmulas inteligentes e gráficos personalizáveis.",
    color: "#10B981",
    icon: "/apps/gridcraft.png",
    githubRepo: "storytold/gridcraft",
  },
  {
    id: "cadcraft",
    name: "CADDecode",
    category: "Engenharia & Áudio",
    tagline: "Modelagem paramétrica e projetos técnicos",
    description:
      "Desenho assistido por computador 2D/3D com restrições geométricas, precisão milimétrica para projetos mecânicos e manufatura.",
    color: "#64748B",
    icon: "/apps/cadcraft.png",
    githubRepo: "storytold/cadcraft",
  },
  {
    id: "soundcraft",
    name: "SoundDecode",
    category: "Engenharia & Áudio",
    tagline: "Gravação e edição de áudio multifaixa",
    description:
      "Estúdio de áudio digital completo para pós-produção, masterização musical, redução de ruído e gravação de podcasts.",
    color: "#14B8A6",
    icon: "/apps/soundcraft.png",
    githubRepo: "storytold/soundcraft",
  },
];

const CATEGORIES = [
  "Todos",
  "Visual",
  "Vídeo",
  "Editorial",
  "Produtividade",
  "Engenharia & Áudio",
] as const;

export const Route = createFileRoute("/apps")({
  head: () => ({
    meta: [
      { title: "Decode Launcher & Apps — O Hub de Ferramentas Livres da Decode" },
      {
        name: "description",
        content:
          "Instale, atualize e execute a suíte de aplicativos criativos de código aberto da Decode. Construído 100% em Rust para máximo desempenho.",
      },
      { property: "og:title", content: "Decode Launcher & Apps — Hub Open Source" },
      {
        property: "og:description",
        content:
          "Um único lugar para gerenciar softwares livres para criadores, designers, desenvolvedores e engenheiros.",
      },
    ],
  }),
  component: AppsPage,
});

function AppsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredApps = useMemo(() => {
    return APPS_DATA.filter((app) => {
      const matchesCategory =
        selectedCategory === "Todos" || app.category === selectedCategory;
      const matchesSearch =
        searchTerm.trim() === "" ||
        app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.tagline.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchTerm]);

  return (
    <StoreShell>
      <div className="min-h-screen bg-[#070A1A] text-white">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden border-b border-white/10 bg-radial from-[#13224B] via-[#090D23] to-[#060814] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid items-center gap-12 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#22D3EE]/30 bg-[#22D3EE]/10 px-3.5 py-1 text-xs font-bold tracking-wide text-[#22D3EE]">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>DECODE OPEN SOURCE HUB · LAUNCHER 0.8.1</span>
                </div>

                <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl lg:leading-[1.1]">
                  Uma suíte completa de{" "}
                  <span className="bg-gradient-to-r from-[#22D3EE] via-[#087CF0] to-[#A855F7] bg-clip-text text-transparent">
                    softwares criativos
                  </span>{" "}
                  no seu computador.
                </h1>

                <p className="mt-5 text-base leading-relaxed text-slate-300 sm:text-lg">
                  O <strong>Decode Launcher</strong> é o aplicativo desktop oficial para você
                  descobrir, instalar e manter atualizados 13 aplicativos profissionais de código aberto
                  — tudo em pura performance Rust, sem telemetria e com interface moderna.
                </p>

                {/* CTAs */}
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <a
                    href="https://github.com/Kaiqueaurelio/decode-open-source-hub/releases/latest"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#087CF0] to-[#22D3EE] px-6 text-sm font-extrabold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#22D3EE]"
                  >
                    <Download className="h-4 w-4" />
                    <span>Baixar Decode Launcher</span>
                  </a>

                  <a
                    href="https://github.com/Kaiqueaurelio/decode-open-source-hub"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.05] px-5 text-sm font-bold text-white transition hover:border-[#22D3EE]/50 hover:bg-white/10"
                  >
                    <Github className="h-4 w-4" />
                    <span>Código no GitHub</span>
                  </a>
                </div>

                {/* Badges de recursos */}
                <div className="mt-10 flex flex-wrap gap-5 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="h-4 w-4 text-[#22D3EE]" /> 100% Rust Nativo
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Monitor className="h-4 w-4 text-[#22D3EE]" /> Linux · Windows · macOS · Web
                  </span>
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="h-4 w-4 text-[#22D3EE]" /> Auto-atualização via GitHub
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-[#22D3EE]" /> Licença MIT / Apache 2.0
                  </span>
                </div>
              </div>

              {/* Launcher Visual Preview */}
              <div className="lg:col-span-5">
                <div className="relative mx-auto max-w-md overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-[#101736] to-[#0A0E23] p-4 shadow-2xl shadow-blue-900/30">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <img
                        src="/brand/decode-logo.png"
                        alt="Decode"
                        className="h-6 w-6 object-contain"
                      />
                      <span className="text-xs font-extrabold uppercase tracking-wider text-white">
                        Decode Launcher
                      </span>
                    </div>
                    <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-[#22D3EE]">
                      v0.8.1
                    </span>
                  </div>

                  <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                    <img
                      src="/launcher/decode-launcher-grid.png"
                      alt="Interface do Decode Launcher"
                      className="h-auto w-full object-cover transition duration-300 hover:scale-[1.02]"
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                    <span>13 Aplicativos integrados</span>
                    <a
                      href="#download-options"
                      className="font-bold text-[#22D3EE] hover:underline"
                    >
                      Ver instaladores ↓
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* APPS SHOWCASE CATALOG */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[.25em] text-[#22D3EE]">
                Suíte de Criação & Engenharia
              </p>
              <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
                Aplicativos da Suíte Decode
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Explore os softwares que você pode instalar e atualizar em 1 clique pelo Launcher.
              </p>
            </div>

            {/* Barra de Pesquisa */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar aplicativo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 transition focus:border-[#22D3EE] focus:bg-white/[0.07] focus:outline-none"
              />
            </div>
          </div>

          {/* Categorias */}
          <div className="mt-8 flex flex-wrap gap-2 border-b border-white/10 pb-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                  selectedCategory === cat
                    ? "bg-[#087CF0] text-white shadow-md shadow-blue-500/25"
                    : "border border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid de Aplicativos */}
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-gradient-to-b from-[#0E1535] to-[#080D22] p-6 transition hover:-translate-y-1 hover:border-[#22D3EE]/50 hover:shadow-xl hover:shadow-cyan-950/40"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#070B1E] p-1.5 shadow-md border border-white/10">
                      <img
                        src={app.icon}
                        alt={app.name}
                        className="h-full w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[11px] font-semibold text-slate-300">
                      {app.category}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-black text-white group-hover:text-[#22D3EE] transition">
                    {app.name}
                  </h3>
                  <p className="text-xs font-semibold text-[#22D3EE]">{app.tagline}</p>

                  <p className="mt-3 text-xs leading-relaxed text-slate-300">
                    {app.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs">
                  <a
                    href={`https://github.com/${app.githubRepo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-bold text-slate-400 hover:text-white transition"
                  >
                    <Github className="h-3.5 w-3.5" />
                    <span>Repositório</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>

                  <a
                    href="https://github.com/Kaiqueaurelio/decode-open-source-hub/releases/latest"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-extrabold text-[#22D3EE] hover:underline"
                  >
                    <span>Instalar via Launcher</span>
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {filteredApps.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/15 p-12 text-center">
              <p className="text-sm text-slate-400">
                Nenhum aplicativo encontrado com o termo "{searchTerm}".
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("Todos");
                }}
                className="mt-3 text-xs font-bold text-[#22D3EE] underline"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </section>

        {/* FEATURES HIGHLIGHT SECTION */}
        <section className="border-t border-white/10 bg-[#060917] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="text-2xl font-black text-white sm:text-3xl">
                Por que usar o Decode Launcher?
              </h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-400">
                Criado para quem quer ferramentas abertas, produtividade sem atrito e código seguro.
              </p>
            </div>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10 text-[#087CF0]">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-white">100% Nativo em Rust</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  Zero uso de Electron ou WebView pesados. Inicia em milissegundos e consome o mínimo de RAM e CPU.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-500/10 text-[#22D3EE]">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-white">Atualizações com 1 Clique</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  O launcher verifica lançamentos oficiais no GitHub e atualiza seus programas sem complicações manuais.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-500/10 text-[#A855F7]">
                  <Shield className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-white">Privacidade e Liberdade</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  Sem rastreadores ou anúncios. Seus arquivos permanecem apenas no seu computador sob licença aberta.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-[#10B981]">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-white">Instalação Flexível</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  Suporta AppImage, DEB, Flatpak no Linux, MSI no Windows e DMG no macOS, além de modo portátil.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* DOWNLOAD OPTIONS SECTION */}
        <section
          id="download-options"
          className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8"
        >
          <div className="rounded-3xl border border-white/15 bg-gradient-to-r from-[#0C153B] via-[#0E1B48] to-[#12113A] p-8 sm:p-12">
            <div className="max-w-2xl">
              <span className="text-xs font-black uppercase tracking-widest text-[#22D3EE]">
                Disponível para todos os sistemas operacionais
              </span>
              <h2 className="mt-2 text-3xl font-black text-white">
                Pronto para transformar sua rotina criativa?
              </h2>
              <p className="mt-3 text-sm text-slate-300">
                Baixe o instalador oficial diretamente das releases do repositório no GitHub ou
                compile a partir do código fonte.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <a
                href="https://github.com/Kaiqueaurelio/decode-open-source-hub/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col justify-between rounded-2xl border border-white/15 bg-white/[0.04] p-5 transition hover:border-[#22D3EE] hover:bg-white/[0.08]"
              >
                <div>
                  <span className="text-sm font-extrabold text-white">Linux</span>
                  <p className="mt-1 text-xs text-slate-400">AppImage, DEB, Flatpak e tarball</p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#22D3EE]">
                  Baixar para Linux <ArrowRight className="h-3 w-3 transition group-hover:translate-x-1" />
                </span>
              </a>

              <a
                href="https://github.com/Kaiqueaurelio/decode-open-source-hub/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col justify-between rounded-2xl border border-white/15 bg-white/[0.04] p-5 transition hover:border-[#22D3EE] hover:bg-white/[0.08]"
              >
                <div>
                  <span className="text-sm font-extrabold text-white">Windows</span>
                  <p className="mt-1 text-xs text-slate-400">Instalador MSI e ZIP portátil</p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#22D3EE]">
                  Baixar para Windows <ArrowRight className="h-3 w-3 transition group-hover:translate-x-1" />
                </span>
              </a>

              <a
                href="https://github.com/Kaiqueaurelio/decode-open-source-hub/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col justify-between rounded-2xl border border-white/15 bg-white/[0.04] p-5 transition hover:border-[#22D3EE] hover:bg-white/[0.08]"
              >
                <div>
                  <span className="text-sm font-extrabold text-white">macOS</span>
                  <p className="mt-1 text-xs text-slate-400">DMG para Apple Silicon e Intel</p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#22D3EE]">
                  Baixar para macOS <ArrowRight className="h-3 w-3 transition group-hover:translate-x-1" />
                </span>
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-slate-400">
              <span>Desenvolvido e mantido pela Decode e pela comunidade de código aberto.</span>
              <a
                href="https://github.com/Kaiqueaurelio/decode-open-source-hub"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-bold text-[#22D3EE] hover:underline"
              >
                <Github className="h-4 w-4" />
                <span>Ver repositório completo</span>
              </a>
            </div>
          </div>
        </section>
      </div>
    </StoreShell>
  );
}
