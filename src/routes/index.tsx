import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronRight,
  Sparkles,
  Upload,
  Send,
  PackageCheck,
  ShieldCheck,
  Lock,
  Server,
  Cloud,
  FileText,
  Palette,
  Bot,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  Plus,
  Star,
  Quote,
  Zap,
  Users,
  Award,
} from "lucide-react";
import { StoreShell } from "@/components/storefront/StoreShell";
import { Hero } from "@/components/storefront/Hero";
import {
  SectionHeader,
  type StoreProduct,
} from "@/components/storefront/ProductCard";
import { SmartImage } from "@/components/storefront/SmartImage";
import { STORE_CATEGORIES, brl } from "@/components/storefront/tokens";
import { useCompanyInfo, useShowPrices, useWaLink } from "@/hooks/useCompanyInfo";
import { useStoreProducts } from "@/components/storefront/useStoreProducts";
import { InfiniteProducts } from "@/components/storefront/InfiniteProducts";
import { CategoryCircles } from "@/components/storefront/CategoryCircles";
import { Reveal } from "@/components/storefront/Reveal";
import { CursorFollower } from "@/components/storefront/CursorFollower";
import { AnalyticsDebugPanel } from "@/components/storefront/AnalyticsDebugPanel";
import { trackCardClick, trackCta } from "@/lib/analytics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Alcateia's — Gráfica online com produtos personalizados" },
      {
        name: "description",
        content:
          "Cartões de visita, canecas, camisetas, adesivos, banners e brindes personalizados com acabamento profissional. Peça pelo site ou WhatsApp.",
      },
      { property: "og:title", content: "Alcateia's — Gráfica online" },
      {
        property: "og:description",
        content:
          "Produtos personalizados com acabamento profissional. Peça pelo site ou WhatsApp.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <StoreShell>
      <CursorFollower />
      <AnalyticsDebugPanel />
      <Hero />
      <CategoryCircles />
      <LightBand>
        <Reveal variant="up"><FeaturedBento /></Reveal>
      </LightBand>
      <Reveal variant="up"><StatsStrip /></Reveal>
      <Reveal variant="up"><CategoriesSection /></Reveal>
      <Reveal variant="up"><InfiniteProducts /></Reveal>
      <Reveal variant="up"><TestimonialsSection /></Reveal>
      <Reveal variant="up"><HowItWorks /></Reveal>
      <Reveal variant="up"><ArtTipsSection /></Reveal>
      <Reveal variant="up"><TechSecuritySection /></Reveal>
      <Reveal variant="up"><ContactSection /></Reveal>
    </StoreShell>
  );
}

function LightBand({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative overflow-hidden bg-[var(--store-bg)] pb-12 pt-2 sm:pb-16 sm:pt-4"
    >
      {children}
    </div>
  );
}

function FeaturedBento() {
  const { data, isLoading } = useStoreProducts(24);
  const items = data ?? [];
  const waLink = useWaLink();
  const { bentoKicker, bentoTitle, bentoDescription } = useCompanyInfo();
  const featured = items.slice(0, 10);

  return (
    <section className="mx-auto mt-3 w-full max-w-[1280px] px-4 sm:mt-4">
      <header className="mb-5 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#172554]">
            {bentoKicker}
          </p>
          <h2 className="font-display mt-1 text-4xl leading-none text-[var(--store-primary-dark)] sm:text-5xl">
            {bentoTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--store-text-muted)]">
            {bentoDescription}
          </p>
        </div>
        <Link
          to="/produtos"
          className="inline-flex min-h-11 items-center gap-1 text-xs font-extrabold uppercase tracking-[0.18em] text-store-primary transition-colors hover:text-[var(--store-primary-dark)]"
          onClick={() =>
            trackCta({
              cta_id: "bento_view_all",
              cta_label: "Ver tudo",
              section: "featured_bento",
              destination: "/produtos",
              channel: "internal",
            })
          }
        >
          Ver tudo <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-[var(--store-radius-lg)] bg-white/5 p-4"
                style={{ minHeight: 260 }}
              />
            ))
          : featured.slice(0, 2).map((p, idx) => (
              <BentoProductCard
                key={p.id}
                product={p}
                animationDelay={120 + idx * 80}
                position={idx + 1}
              />
            ))}

        {/* Creative bento card — "Criamos sua arte" */}
        <a
          href={waLink("Olá! Quero contratar a criação de uma arte.")}
          target="_blank"
          rel="noopener noreferrer"
          className="store-bento-card group flex flex-col items-center justify-center bg-[var(--store-gold)] p-5 text-center text-[var(--store-ink)] animate-fade-in"
          style={{ animationDelay: "280ms", animationFillMode: "both" }}
          onClick={() =>
            trackCta({
              cta_id: "bento_criar_arte",
              cta_label: "Criamos sua arte",
              section: "featured_bento",
              channel: "whatsapp",
            })
          }
        >
          <Palette className="mb-2 h-7 w-7" />
          <p className="font-display text-2xl leading-none sm:text-3xl">CRIAMOS SUA ARTE</p>
          <p className="mt-2 text-xs font-medium">
            Designers prontos para criar do zero.
          </p>
          <span className="mt-4 inline-flex items-center justify-center bg-[var(--store-ink)] px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white transition-transform group-hover:scale-105">
            Saiba mais
          </span>
        </a>

        {/* Card "mais produtos" */}
        <Link
          to="/produtos"
          className="store-bento-card group flex flex-col items-center justify-center bg-[#172554] p-5 text-center text-white animate-fade-in"
          style={{ animationDelay: "360ms", animationFillMode: "both" }}
          onClick={() =>
            trackCta({
              cta_id: "bento_mais_produtos",
              cta_label: "Mais produtos",
              section: "featured_bento",
              destination: "/produtos",
              channel: "internal",
            })
          }
        >
          <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-white text-white transition-transform group-hover:rotate-90">
            <Plus className="h-5 w-5" />
          </div>
          <p className="font-display mt-3 text-2xl leading-none">MAIS PRODUTOS</p>
          <p className="mt-1 text-xs text-white/80">Catálogo completo</p>
        </Link>

        {/* Mais 4 produtos */}
        {!isLoading &&
          featured.slice(2, 6).map((p, idx) => (
            <BentoProductCard
              key={p.id}
              product={p}
              animationDelay={440 + idx * 80}
              position={idx + 3}
            />
          ))}
      </div>
    </section>
  );
}

function BentoProductCard({
  product,
  animationDelay,
  position,
}: {
  product: StoreProduct;
  animationDelay: number;
  position?: number;
}) {
  const slug = product.slug ?? product.id;
  const rating = product.rating ? Number(product.rating) : null;
  const showPrices = useShowPrices();
  const categoryShort = (product.category ?? "PRINT").slice(0, 9).toUpperCase();

  return (
    <Link
      to="/produto/$slug"
      params={{ slug }}
      className="store-bento-card group flex flex-col overflow-hidden bg-white p-3 text-[var(--store-ink)] animate-fade-in"
      style={{ animationDelay: `${animationDelay}ms`, animationFillMode: "both" }}
      onClick={() =>
        trackCardClick({
          card_id: product.id,
          card_title: product.name,
          card_type: "product",
          section: "featured_bento",
          position,
          price: product.base_price != null ? Number(product.base_price) : null,
          category: product.category ?? null,
        })
      }
    >
      <div className="relative mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-[var(--store-radius-md)] bg-slate-100">
        <SmartImage 
          src={product.image_url} 
          alt={product.name}
          fallbackEmoji="✨"
          className="transition-transform duration-500 group-hover:scale-[1.06]"
        />
        {product.badge && (
          <span className="absolute left-2 top-2 rounded-sm bg-[var(--store-ink)] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[var(--store-gold)]">
            {product.badge}
          </span>
        )}
      </div>

      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--store-text-muted)]">
        {product.category ?? "Personalizado"}
      </p>
      <h4 className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug sm:text-base">
        {product.name}
      </h4>

      <div className="mt-auto flex items-end justify-between gap-2 pt-3">
        <div className="min-w-0">
          {rating != null && (
            <div className="flex items-center gap-1 text-[var(--store-gold)]">
              <Star className="h-3 w-3 fill-current" />
              <span className="text-[11px] font-bold text-[var(--store-ink)]">
                {rating.toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-400">
                ({product.reviews_count ?? 0})
              </span>
            </div>
          )}
          {showPrices ? (
            <p className="font-display text-2xl leading-none">{brl(product.base_price)}</p>
          ) : (
            <p className="font-display text-base leading-none">Sob consulta</p>
          )}
          {product.min_quantity ? (
            <p className="text-[10px] text-slate-500">
              a partir de {product.min_quantity} {product.unit ?? "un"}
            </p>
          ) : null}
        </div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--store-radius-sm)] bg-[var(--store-ink)] text-white transition-colors group-hover:bg-[var(--store-gold)] group-hover:text-[var(--store-ink)]">
          <Plus className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

function CategoriesSection() {
  return (
    <section className="bg-[var(--store-surface)] py-12 sm:py-16">
      <div className="mx-auto max-w-[1280px] px-4">
        <SectionHeader
          kicker="Serviços gráficos"
          title="Para todos os tipos de marca"
          description="Escolha uma categoria e personalize seu produto em poucos minutos."
        />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {STORE_CATEGORIES.slice(1).map((c) => (
            <Link
              key={c.slug}
              to="/produtos"
              search={{ cat: c.slug }}
              className="group flex flex-col justify-between rounded-[var(--store-radius-lg)] border border-[var(--store-border)] bg-white p-5 shadow-[var(--store-shadow-sm)] transition-all hover:-translate-y-1 hover:border-[var(--store-primary-light)]/40 hover:shadow-[var(--store-shadow-md)]"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--store-primary)] text-white transition-colors group-hover:bg-[var(--store-accent)]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="mt-5">
                <p className="text-base font-extrabold text-[var(--store-text)]">{c.label}</p>
                <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[var(--store-primary)]">
                  Ver produtos <ChevronRight className="h-3.5 w-3.5" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const waLink = useWaLink();
  const { howItWorksTitle } = useCompanyInfo();
  const steps = [
    { icon: Sparkles, title: "Escolha o produto", desc: "Navegue pelo catálogo e selecione a opção ideal." },
    { icon: Upload, title: "Envie sua arte", desc: "Anexe o arquivo ou peça para nossa equipe criar." },
    { icon: Send, title: "Aprovação rápida", desc: "Confirmamos detalhes e prazos pelo WhatsApp." },
    { icon: PackageCheck, title: "Produção e entrega", desc: "Retirada na loja ou entrega no endereço." },
  ];
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-12 sm:py-16">
      <SectionHeader
        kicker="Como funciona"
        title={howItWorksTitle}
      />
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, idx) => (
          <Reveal
            as="li"
            key={s.title}
            variant="up"
            delay={idx * 90}
            className="lift-on-hover rounded-[var(--store-radius-lg)] border border-[var(--store-border)] bg-white p-5 shadow-[var(--store-shadow-sm)]"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--store-primary)] text-sm font-extrabold text-white">
                {idx + 1}
              </span>
              <s.icon className="h-5 w-5 text-[var(--store-accent)]" />
            </div>
            <p className="mt-4 text-base font-extrabold text-[var(--store-text)]">{s.title}</p>
            <p className="mt-1 text-sm text-[var(--store-text-muted)]">{s.desc}</p>
          </Reveal>
        ))}
      </ol>
      <div className="mt-8 flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-[var(--store-text-muted)]">
          Tem dúvida sobre qual produto escolher?
        </p>
        <a
          href={waLink("Olá! Preciso de ajuda para escolher um produto.")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--store-radius-md)] bg-[var(--store-success)] px-5 text-sm font-bold text-white shadow-[var(--store-shadow-md)] hover:brightness-110"
          onClick={() =>
            trackCta({
              cta_id: "how_it_works_whatsapp",
              cta_label: "Falar com a equipe no WhatsApp",
              section: "how_it_works",
              channel: "whatsapp",
            })
          }
        >
          Falar com a equipe no WhatsApp
        </a>
      </div>
    </section>
  );
}

function ArtTipsSection() {
  const tips = [
    {
      icon: FileText,
      title: "PDF editável é o ideal",
      desc: "Envie em PDF/X-1a ou PDF com fontes incorporadas. Mantém qualidade, cores e textos nítidos na impressão.",
    },
    {
      icon: ImageIcon,
      title: "300 DPI no tamanho final",
      desc: "Para imagens, use 300 DPI em CMYK. Evite imagens baixadas da internet ou prints de tela — saem borradas.",
    },
    {
      icon: Palette,
      title: "Cores em CMYK + sangria de 3mm",
      desc: "Trabalhe em CMYK (não RGB) e deixe 3mm de sangria além do corte para evitar bordas brancas.",
    },
    {
      icon: Bot,
      title: "Arte feita por IA? Avise!",
      desc: "Imagens geradas por IA (Midjourney, DALL·E, etc.) costumam ter resolução baixa. Nos avise para tratarmos a arte antes de imprimir.",
    },
    {
      icon: Sparkles,
      title: "Arte feita no Canva? Conta pra gente",
      desc: "No Canva, exporte como “PDF para impressão” com marcas de corte e sangria. Avise no envio para conferirmos antes da produção.",
    },
    {
      icon: AlertTriangle,
      title: "Confira o que NÃO mandar",
      desc: "Evite JPG/PNG comprimido, Word/PowerPoint, fotos de tela e arquivos abaixo de 1 MB. Em caso de dúvida, mande tudo e a gente avalia.",
    },
  ];
  return (
    <section className="bg-[var(--store-surface)] py-12 sm:py-16">
      <div className="mx-auto max-w-[1280px] px-4">
        <SectionHeader
          kicker="Boas práticas"
          title="Como enviar sua arte na melhor qualidade"
          description="Seguindo essas dicas, sua impressão sai impecável e o prazo é ainda mais rápido."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tips.map((t) => (
            <Reveal
              key={t.title}
              variant="up"
              className="lift-on-hover rounded-[var(--store-radius-lg)] border border-[var(--store-border)] bg-white p-5 shadow-[var(--store-shadow-sm)]"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--store-primary)] text-white">
                  <t.icon className="h-5 w-5" />
                </span>
                <p className="text-base font-extrabold text-[var(--store-text)]">{t.title}</p>
              </div>
              <p className="mt-3 text-sm text-[var(--store-text-muted)]">{t.desc}</p>
            </Reveal>
          ))}
        </div>
        <div className="mt-8 rounded-[var(--store-radius-lg)] border border-[var(--store-primary)]/15 bg-[var(--store-primary)]/5 p-5 text-sm text-[var(--store-text)]">
          <p className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--store-success)]" />
            <span>
              <strong>Resumo rápido:</strong> PDF editável · 300 DPI · CMYK · sangria 3mm · avisar
              se for IA ou Canva. Aceitamos PDF, AI, CDR, PSD, SVG, PNG e JPG até 50 MB.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

function TechSecuritySection() {
  const items = [
    {
      icon: Lock,
      title: "Login criptografado",
      desc: "Autenticação protegida e senhas com hash seguro. Seu acesso é só seu.",
    },
    {
      icon: ShieldCheck,
      title: "Arquivos privados",
      desc: "Cada pedido tem link único. Suas artes ficam isoladas e só sua equipe enxerga.",
    },
    {
      icon: Server,
      title: "Banco com RLS",
      desc: "Banco de dados com regras linha-a-linha (Row Level Security) — ninguém vê dados de outro cliente.",
    },
    {
      icon: Cloud,
      title: "Infra global",
      desc: "Hospedagem em nuvem com HTTPS, backups e disponibilidade alta. App rápido em qualquer dispositivo.",
    },
  ];
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-12 sm:py-16">
      <SectionHeader
        kicker="Tecnologia e segurança"
        title="Um app moderno, rápido e protegido"
        description="Construído com React, TanStack Start e backend gerenciado com criptografia, RLS e HTTPS de ponta a ponta."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it) => (
          <Reveal
            key={it.title}
            variant="up"
            className="lift-on-hover rounded-[var(--store-radius-lg)] border border-[var(--store-border)] bg-white p-5 shadow-[var(--store-shadow-sm)]"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--store-success)]/10 text-[var(--store-success)]">
              <it.icon className="h-5 w-5" />
            </span>
            <p className="mt-4 text-base font-extrabold text-[var(--store-text)]">{it.title}</p>
            <p className="mt-1 text-sm text-[var(--store-text-muted)]">{it.desc}</p>
          </Reveal>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-[var(--store-text-muted)]">
        {["React 19", "TanStack Start", "TypeScript", "Tailwind CSS", "Supabase", "HTTPS", "PWA"].map(
          (t) => (
            <span
              key={t}
              className="rounded-full border border-[var(--store-border)] bg-white px-3 py-1"
            >
              {t}
            </span>
          ),
        )}
      </div>
    </section>
  );
}

function ContactSection() {
  return _ContactSection();
}

function StatsStrip() {
  const stats = [
    { icon: Users, value: "+12.000", label: "Clientes atendidos" },
    { icon: Zap, value: "48h", label: "Produção média" },
    { icon: Award, value: "4.9★", label: "Avaliação dos clientes" },
    { icon: PackageCheck, value: "+200k", label: "Pedidos entregues" },
  ];
  return (
    <section className="border-y border-[var(--store-border)] bg-white">
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-3 px-4 py-8 sm:gap-4 sm:py-10 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-2 text-center sm:flex-row sm:gap-3 sm:text-left">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--store-ink)] text-[var(--store-gold)] sm:h-12 sm:w-12 sm:rounded-xl">
              <s.icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-2xl leading-none text-[var(--store-primary)] sm:text-3xl md:text-4xl">
                {s.value}
              </p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--store-text-muted)] sm:mt-1 sm:text-[11px]">
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const items = [
    {
      name: "Mariana S.",
      role: "Salão Bella Hair",
      text: "Pedi 2 milheiros de cartão laminado fosco e chegou perfeito em 3 dias. Cores fiéis e papel pesado, recomendo demais!",
      rating: 5,
    },
    {
      name: "Rafael P.",
      role: "Hamburgueria Bun's",
      text: "Faço caixas de delivery aqui há meses. Preço justo, prazo cumprido e impressão sem falhas. Virei cliente fiel.",
      rating: 5,
    },
    {
      name: "Camila R.",
      role: "Coach financeiro",
      text: "Camisetas DTF e canecas pro meu evento. Material premium e ainda me ajudaram com a arte. Show!",
      rating: 5,
    },
  ];
  return (
    <section className="bg-[var(--store-ink)] py-12 sm:py-16">
      <div className="mx-auto max-w-[1280px] px-4">
        <div className="mb-8 flex flex-col items-start gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--store-gold)]">
              Quem já imprimiu com a gente
            </p>
            <h2 className="font-display mt-1 text-4xl leading-none text-white sm:text-5xl">
              MARCAS QUE CONFIAM NA ALCATEIA'S
            </h2>
          </div>
          <div className="flex items-center gap-1 text-[var(--store-gold)]">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-current" />
            ))}
            <span className="ml-2 text-sm font-bold text-white">4.9 / 5 · 1.247 avaliações</span>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((t, idx) => (
            <article
              key={t.name}
              className="store-bento-card relative flex flex-col bg-white p-6 text-[var(--store-ink)] animate-fade-in"
              style={{ animationDelay: `${120 + idx * 100}ms`, animationFillMode: "both" }}
            >
              <Quote className="h-7 w-7 text-[var(--store-gold)]" />
              <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--store-ink)]/85">
                "{t.text}"
              </p>
              <div className="mt-5 flex items-center justify-between border-t border-[var(--store-ink-line)]/15 pt-4">
                <div>
                  <p className="text-sm font-extrabold">{t.name}</p>
                  <p className="text-xs text-[var(--store-text-muted)]">{t.role}</p>
                </div>
                <div className="flex text-[var(--store-gold)]">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function _ContactSection() {
  const info = useCompanyInfo();
  const waLink = useWaLink();
  return (
    <section className="bg-[var(--store-primary-dark)] py-12 text-white sm:py-16">
      <div className="mx-auto grid max-w-[1280px] gap-8 px-4 lg:grid-cols-2 lg:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--store-secondary)]">
            Atendimento
          </p>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">
            Estamos por perto para tirar sua ideia do papel
          </h2>
          <p className="mt-3 text-white/70">
            Fale com a equipe Alcateia's no WhatsApp, na loja ou por e-mail. Resposta rápida nos
            horários de atendimento.
          </p>
          <a
            href={waLink("Olá! Quero fazer um orçamento.")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-[var(--store-radius-md)] bg-[var(--store-success)] px-6 text-sm font-extrabold uppercase tracking-wide text-white shadow-[var(--store-shadow-md)] hover:brightness-110"
            onClick={() =>
              trackCta({
                cta_id: "contact_whatsapp",
                cta_label: "Falar no WhatsApp",
                section: "contact",
                channel: "whatsapp",
              })
            }
          >
            <Send className="h-4 w-4" /> Falar no WhatsApp
          </a>
        </div>
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          <div className="rounded-[var(--store-radius-lg)] bg-white/5 p-4 sm:p-5">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[var(--store-secondary)]">
              Telefone / WhatsApp
            </p>
            <p className="mt-2 text-base sm:text-lg font-extrabold">{info.whatsappDisplay}</p>
          </div>
          <div className="rounded-[var(--store-radius-lg)] bg-white/5 p-4 sm:p-5">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[var(--store-secondary)]">
              E-mail
            </p>
            <p className="mt-2 break-all text-sm sm:text-base font-semibold">{info.email}</p>
          </div>
          <div className="rounded-[var(--store-radius-lg)] bg-white/5 p-4 sm:p-5 sm:col-span-2">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[var(--store-secondary)]">
              Endereço
            </p>
            <a
              href={info.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block text-sm sm:text-base font-semibold hover:text-[var(--store-secondary)]"
            >
              {info.address}
              {info.instagram && (
                <>
                  <br />
                  <span className="text-[var(--store-secondary)]">{info.instagram}</span>
                </>
              )}
            </a>
          </div>
          <div className="rounded-[var(--store-radius-lg)] bg-white/5 p-5 sm:col-span-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--store-secondary)]">
              Horário de atendimento
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {info.hours.map((h) => (
                <li key={h.day} className="flex justify-between gap-3">
                  <span className="text-white/80">{h.day}</span>
                  <span className="font-semibold">{h.time}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div className="mx-auto mt-10 max-w-[1280px] px-4">
        <div className="overflow-hidden rounded-[var(--store-radius-lg)] border border-white/10 bg-white/5">
          <iframe
            title="Localização Alcateia's"
            src="https://maps.google.com/maps?q=Estrada+do+Cabreúva,703,Vila+Santa+Lúcia,Carapicuíba,SP&t=&z=15&ie=UTF8&iwloc=&output=embed"
            className="h-72 w-full border-0 sm:h-96"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 sm:px-5">
            <p className="text-xs font-semibold text-white/80">
              {info.address}
            </p>
            <a
              href={info.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center text-xs font-bold text-[var(--store-secondary)] hover:underline"
            >
              Abrir no Google Maps
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
