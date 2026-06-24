import { Link } from "@tanstack/react-router";
import { ArrowRight, Upload, Calculator, Sparkles, Tag } from "lucide-react";
import { waLink } from "./tokens";
import { CATEGORY_IMAGES } from "./productImages";

export function Hero() {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-3 pt-3 sm:px-4 sm:pt-4 md:pt-6">
      <div
        className="store-crop-marks relative overflow-hidden rounded-[var(--store-radius-xl)] bg-[var(--store-primary)] p-4 text-white shadow-[var(--store-shadow-lg)] sm:p-6 md:p-10 lg:p-12 animate-fade-in"
        style={{ animationDelay: "60ms", animationFillMode: "both" }}
      >
        <div
          aria-hidden="true"
          className="store-halftone pointer-events-none absolute inset-0 opacity-60"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#00a3ff_0_25%,#ff3b30_25%_50%,#f5c542_50%_75%,#171717_75%_100%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 bottom-8 h-44 w-44 rounded-full border border-[var(--store-secondary)]/25"
          style={{
            boxShadow: "0 0 0 28px rgba(245, 197, 66, 0.05)",
          }}
        />
        <div className="relative grid items-center gap-6 sm:gap-8 md:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white backdrop-blur">
              <Sparkles className="h-3 w-3 text-[var(--store-secondary)]" /> Alcateia's · gráfica de produção
            </span>
            <h1 className="font-display mt-5 text-4xl leading-[0.95] text-white sm:text-5xl md:text-6xl lg:text-7xl">
              SUA MARCA
              <br />
              <span className="inline-block rotate-[-1deg] rounded-md bg-[var(--store-secondary)] px-3 py-1 text-[var(--store-primary-dark)]">
                NO CAPRICHO
              </span>
            </h1>
            <p className="mt-5 max-w-md text-sm sm:text-base font-medium text-white/85">
              Cartões, panfletos, banners, adesivos, camisetas, canecas e brindes feitos com
              atendimento próximo, arte bem cuidada e acabamento de gráfica de bairro que joga junto.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur">
              <Tag className="h-4 w-4 text-[var(--store-secondary)]" />
              <span>
                Retirada em Carapicuíba · suporte pelo WhatsApp
              </span>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/produtos"
                className="inline-flex items-center justify-center gap-2 rounded-[var(--store-radius-md)] bg-[var(--store-secondary)] px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-[var(--store-primary-dark)] shadow-md transition-transform hover:scale-[1.03] sm:px-8"
              >
                Ver produtos <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={waLink("Olá! Quero enviar minha arte para um orçamento.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-[var(--store-radius-md)] border-2 border-white/70 bg-transparent px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-white hover:text-[var(--store-primary)] sm:px-8"
              >
                <Upload className="h-4 w-4" /> Enviar minha arte
              </a>
            </div>
          </div>

          {/* Right column: product hero photo */}
          <div className="relative hidden md:block">
            <div className="absolute -right-8 -top-8 h-72 w-72 rounded-full bg-[var(--store-secondary)]/10 blur-2xl" />
            <div className="relative aspect-square overflow-hidden rounded-[var(--store-radius-xl)] bg-white p-2 shadow-2xl rotate-[-2deg] transition-transform hover:rotate-0 border border-white/20">
              <img
                src={CATEGORY_IMAGES["Cartões"]}
                alt="Cartões de Visita Premium"
                className="h-full w-full rounded-[var(--store-radius-lg)] object-cover"
              />
              <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[var(--store-primary)] px-3 py-1 text-xs font-extrabold uppercase text-[var(--store-secondary)] shadow-md">
                <Sparkles className="h-3 w-3" /> Feito pela Alcateia
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
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg sm:h-11 sm:w-11 sm:rounded-xl bg-[var(--store-primary)] text-[var(--store-secondary)]">
            <Calculator className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
          <div>
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
          <div>
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
          <div>
            <p className="text-xs sm:text-sm font-extrabold text-[var(--store-text)]">Envie sua arte</p>
            <p className="text-[10px] sm:text-xs text-[var(--store-text-muted)]">PDF, AI, PSD, PNG até 50MB</p>
          </div>
        </a>
      </div>
    </section>
  );
}
