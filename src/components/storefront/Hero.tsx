import { Link } from "@tanstack/react-router";
import { ArrowRight, Upload, Calculator, Sparkles, Tag } from "lucide-react";
import { useWaLink, useCompanyInfo } from "@/hooks/useCompanyInfo";
import { CATEGORY_IMAGES } from "./productImages";

export function Hero() {
  const waLink = useWaLink();
  const { heroTitle, heroSubtitle, heroCtaPrimary, heroCtaSecondary } = useCompanyInfo();
  return (
    <section className="mx-auto w-full max-w-[1280px] px-3 pt-3 sm:px-4 sm:pt-4 md:pt-6">
      {/* Big bright blue hero banner — Futuraim-style */}
      <div
        className="relative min-w-0 overflow-hidden rounded-[var(--store-radius-xl)] bg-linear-to-br from-store-primary-light/70 via-store-primary to-store-primary-dark p-4 text-white shadow-[var(--store-shadow-lg)] sm:p-6 md:p-10 lg:p-12 animate-fade-in"
        style={{ animationDelay: "60ms", animationFillMode: "both" }}
      >
        {/* Decorative percent marks */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.5) 0, transparent 35%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.4) 0, transparent 40%)",
          }}
        />
        <div className="relative grid items-center gap-6 sm:gap-8 md:grid-cols-2">
          <div className="min-w-0">
            <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[10px] font-extrabold uppercase text-white backdrop-blur sm:text-[11px]" style={{ letterSpacing: "0.08em" }}>
              <Sparkles className="h-3 w-3" /> Alcateia · produções gráficas · 48h
            </span>
            <h1 
              className="font-display mt-5 text-[2rem] leading-[0.98] sm:text-5xl md:text-6xl lg:text-7xl"
              dangerouslySetInnerHTML={{ __html: heroTitle }}
            />
            <p className="mt-5 max-w-md text-sm sm:text-base font-medium text-white/85">
              {heroSubtitle}
            </p>

            <div className="mt-6 inline-flex max-w-full items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold backdrop-blur sm:px-4 sm:text-sm">
              <Tag className="h-4 w-4 text-[var(--store-secondary)]" />
              <span className="min-w-0">
                10% OFF na 1ª compra ·{" "}
                <span className="rounded bg-[var(--store-secondary)] px-1.5 py-0.5 text-[12px] text-[var(--store-primary-dark)]">
                  BEMVINDO10
                </span>
              </span>
            </div>

            <div className="mt-7 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap">
              <Link
                to="/produtos"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--store-radius-md)] bg-white px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-store-primary shadow-md transition-transform hover:scale-[1.03] sm:px-8"
              >
                {heroCtaPrimary} <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={waLink("Olá! Quero enviar minha arte para um orçamento.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--store-radius-md)] border-2 border-white/70 bg-transparent px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-white hover:text-store-primary sm:px-8"
              >
                <Upload className="h-4 w-4" /> {heroCtaSecondary}
              </a>
            </div>
          </div>

          {/* Right column: product hero photo */}
          <div className="relative hidden md:block">
            <div className="absolute -right-8 -top-8 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
            <div className="relative animate-float">
              <div className="relative aspect-square overflow-hidden rounded-[var(--store-radius-xl)] border border-white/20 bg-white p-2 shadow-2xl rotate-[-2deg] transition-transform duration-500 hover:rotate-0">
                <img
                  src={CATEGORY_IMAGES["Cartões"]}
                  alt="Cartões de Visita Premium"
                  className="h-full w-full rounded-[var(--store-radius-lg)] object-cover"
                />
              </div>
              <span className="pointer-events-none absolute -top-3 left-2 z-10 inline-flex items-center gap-1 rounded-full bg-store-secondary px-3 py-1 text-xs font-extrabold uppercase text-store-primary-dark shadow-md">
                <Sparkles className="h-3 w-3" /> Acabamento premium
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick-action strip */}
      <div className="mt-2 grid gap-2 sm:mt-3 sm:gap-3 sm:grid-cols-3">
        <Link
          to="/calculator"
          className="group flex items-center gap-2 rounded-[var(--store-radius-lg)] border border-[var(--store-border)] bg-white p-3 sm:gap-3 sm:p-4 shadow-[var(--store-shadow-sm)] transition-all hover:-translate-y-1 hover:shadow-[var(--store-shadow-md)] animate-fade-in"
          style={{ animationDelay: "120ms", animationFillMode: "both" }}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg sm:h-11 sm:w-11 sm:rounded-xl bg-store-primary/10 text-store-primary">
            <Calculator className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-extrabold text-[var(--store-text)]">Orçamento rápido</p>
            <p className="text-[10px] sm:text-xs text-[var(--store-text-muted)]">Calcule o preço em segundos</p>
          </div>
        </Link>
        <a
          href={waLink("Olá! Quero contratar a criação de uma arte.")}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 rounded-[var(--store-radius-lg)] border border-[var(--store-border)] bg-white p-3 sm:gap-3 sm:p-4 shadow-[var(--store-shadow-sm)] transition-all hover:-translate-y-1 hover:shadow-[var(--store-shadow-md)] animate-fade-in"
          style={{ animationDelay: "180ms", animationFillMode: "both" }}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg sm:h-11 sm:w-11 sm:rounded-xl bg-[var(--store-secondary)]/20 text-[var(--store-secondary-dark)]">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-extrabold text-[var(--store-text)]">Criamos sua arte</p>
            <p className="text-[10px] sm:text-xs text-[var(--store-text-muted)]">Designers prontos pra ajudar</p>
          </div>
        </a>
        <a
          href={waLink("Olá! Quero enviar minha arte.")}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 rounded-[var(--store-radius-lg)] border border-[var(--store-border)] bg-white p-3 sm:gap-3 sm:p-4 shadow-[var(--store-shadow-sm)] transition-all hover:-translate-y-1 hover:shadow-[var(--store-shadow-md)] animate-fade-in"
          style={{ animationDelay: "240ms", animationFillMode: "both" }}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg sm:h-11 sm:w-11 sm:rounded-xl bg-[var(--store-success)]/15 text-[var(--store-success)]">
            <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-extrabold text-[var(--store-text)]">Envie sua arte</p>
            <p className="text-[10px] sm:text-xs text-[var(--store-text-muted)]">PDF, AI, PSD, PNG até 50MB</p>
          </div>
        </a>
      </div>
    </section>
  );
}
