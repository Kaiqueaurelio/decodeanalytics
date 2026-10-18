import { Link } from "@tanstack/react-router";
import { ArrowRight, Upload, CheckCircle, ExternalLink } from "lucide-react";
import { useWaLink, useCompanyInfo } from "@/hooks/useCompanyInfo";


export function Hero() {
  const waLink = useWaLink();
  const { heroTitle, heroSubtitle, heroCtaPrimary, heroCtaSecondary } = useCompanyInfo();
  return (
    <section className="mx-auto w-full max-w-[1280px] px-3 pt-2 sm:px-4 sm:pt-4 md:pt-6">
      {/* Big bright blue hero banner — Futuraim-style */}
      <div
        className="relative min-w-0 overflow-hidden rounded-[var(--store-radius-lg)] sm:rounded-[var(--store-radius-xl)] bg-linear-to-br from-store-primary-light/70 via-store-primary to-store-primary-dark p-4 text-white shadow-[var(--store-shadow-lg)] sm:p-6 md:p-10 lg:p-12 animate-fade-in"
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
            <span
              className="inline-flex max-w-full items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[10px] font-extrabold uppercase text-white backdrop-blur sm:text-[11px]"
              style={{ letterSpacing: "0.08em" }}
            >
              <CheckCircle className="h-3 w-3" /> Dados · Tecnologia · Automação · Design
            </span>
            <h1 className="font-display mt-4 text-[2.15rem] leading-[0.98] sm:mt-5 sm:text-6xl md:text-7xl lg:text-8xl">
              DADOS, TECNOLOGIA
              <br />
              & RESULTADOS
            </h1>
            <p className="mt-5 max-w-md text-sm sm:text-base font-medium text-white/85">
              {heroSubtitle}
            </p>

            <div className="mt-6 inline-flex max-w-full items-center gap-2 rounded-full border border-cyan-300/25 bg-black/25 px-3 py-2 text-xs font-semibold text-white/85 backdrop-blur sm:text-sm"><span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_#22d3ee]" /> Tecnologia aplicada a resultados reais</div>

            <div className="mt-7 flex flex-col gap-2.5 min-[420px]:flex-row min-[420px]:flex-wrap">
              <Link
                to="/produtos"
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[var(--store-radius-md)] bg-white px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-store-primary shadow-md transition-transform hover:scale-[1.03] sm:px-8"
              >
                {heroCtaPrimary} <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://wa.me/c/5511939222885"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[var(--store-radius-md)] border-2 border-white/70 bg-transparent px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-white hover:text-store-primary sm:px-8"
              >
                <ExternalLink className="h-4 w-4" /> Ver catálogo no WhatsApp
              </a>
            </div>
          </div>

          {/* Decorative technology panel — no unrelated stock product photo */}
          <div className="relative hidden min-h-[300px] items-center justify-center md:flex">
            <div className="absolute h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" />
            <div className="relative w-full max-w-md rounded-2xl border border-cyan-300/20 bg-[#08080d]/80 p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur">
              <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                <span className="ml-2 font-mono text-xs text-zinc-500">decode://solucoes</span>
              </div>
              <div className="space-y-3 py-6 font-mono text-sm">
                <p className="text-zinc-500">// tecnologia com propósito</p>
                <p className="text-cyan-300"><span className="text-violet-400">const</span> ideia = desafio;</p>
                <p className="text-zinc-300">transformar(ideia);</p>
                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-3/4 rounded-full bg-gradient-to-r from-violet-500 to-cyan-300" /></div>
                <p className="pt-2 text-xs text-zinc-500">DESIGN · DADOS · SOLUÇÕES</p>
              </div>
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
            <p className="text-xs sm:text-sm font-extrabold text-[var(--store-text)]">
              Orçamento rápido
            </p>
            <p className="text-[10px] sm:text-xs text-[var(--store-text-muted)]">
              Calcule o preço em segundos
            </p>
          </div>
        </Link>
        <a
          href={waLink("Olá! Quero conhecer as soluções da Decode Analytics.")}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 rounded-[var(--store-radius-lg)] border border-[var(--store-border)] bg-white p-3 sm:gap-3 sm:p-4 shadow-[var(--store-shadow-sm)] transition-all hover:-translate-y-1 hover:shadow-[var(--store-shadow-md)] animate-fade-in"
          style={{ animationDelay: "180ms", animationFillMode: "both" }}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg sm:h-11 sm:w-11 sm:rounded-xl bg-[var(--store-secondary)]/20 text-[var(--store-secondary-dark)]">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-extrabold text-[var(--store-text)]">
              Criamos sua arte
            </p>
            <p className="text-[10px] sm:text-xs text-[var(--store-text-muted)]">
              Designers prontos pra ajudar
            </p>
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
            <p className="text-xs sm:text-sm font-extrabold text-[var(--store-text)]">
              Envie sua arte
            </p>
            <p className="text-[10px] sm:text-xs text-[var(--store-text-muted)]">
              PDF, AI, PSD, PNG até 50MB
            </p>
          </div>
        </a>
      </div>
    </section>
  );
}
