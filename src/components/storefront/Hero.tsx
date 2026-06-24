import { Link } from "@tanstack/react-router";
import { ArrowRight, Upload, Calculator, Sparkles, Tag } from "lucide-react";
import { waLink } from "./tokens";
// Imagem importada localmente da pasta public
const cartoesImgUrl = "/products/cartoes.jpg";

export function Hero() {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-3 pt-3 sm:px-4 sm:pt-4 md:pt-6">
      {/* Big bright blue hero banner — Futuraim-style */}
      <div
        className="relative overflow-hidden rounded-[var(--store-radius-xl)] bg-gradient-to-br from-[#1e63ff] via-[#1366ff] to-[#0a45c2] p-4 text-white shadow-[var(--store-shadow-lg)] sm:p-6 md:p-10 lg:p-12 animate-fade-in"
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
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white backdrop-blur">
              <Sparkles className="h-3 w-3" /> Gráfica online · produção em 48h
            </span>
            <h1 className="font-display mt-5 text-4xl leading-[0.95] sm:text-5xl md:text-6xl lg:text-7xl">
              IMPRESSOS
              <br />
              <span className="rounded-md bg-[var(--store-secondary)] px-3 py-1 text-[var(--store-primary-dark)]">
                IMBATÍVEIS
              </span>
            </h1>
            <p className="mt-5 max-w-md text-sm sm:text-base font-medium text-white/85">
              Cartões de visita, panfletos, banners, camisetas, canecas, adesivos e brindes
              personalizados com acabamento de gráfica de verdade.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur">
              <Tag className="h-4 w-4 text-[var(--store-secondary)]" />
              <span>
                10% OFF na 1ª compra ·{" "}
                <span className="rounded bg-[var(--store-secondary)] px-1.5 py-0.5 text-[12px] text-[var(--store-primary-dark)]">
                  BEMVINDO10
                </span>
              </span>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/produtos"
                className="inline-flex items-center justify-center gap-2 rounded-[var(--store-radius-md)] bg-white px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-[#1366ff] shadow-md transition-transform hover:scale-[1.03] sm:px-8"
              >
                Ver produtos <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={waLink("Olá! Quero enviar minha arte para um orçamento.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-[var(--store-radius-md)] border-2 border-white/70 bg-transparent px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-white hover:text-[#1366ff] sm:px-8"
              >
                <Upload className="h-4 w-4" /> Enviar minha arte
              </a>
            </div>
          </div>

          {/* Right column: product hero photo */}
          <div className="relative hidden md:block">
            <div className="absolute -right-8 -top-8 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
            <div className="relative aspect-square overflow-hidden rounded-[var(--store-radius-xl)] bg-white p-2 shadow-2xl rotate-[-2deg] transition-transform hover:rotate-0 border border-white/20">
              <img
                src={cartoesImgUrl}
                alt="Cartões de Visita Premium"
                className="h-full w-full rounded-[var(--store-radius-lg)] object-cover"
              />
              <span className="absolute -top-3 -left-3 inline-flex items-center gap-1 rounded-full bg-[var(--store-secondary)] px-3 py-1 text-xs font-extrabold uppercase text-[var(--store-primary-dark)] shadow-md">
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
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg sm:h-11 sm:w-11 sm:rounded-xl bg-[#1366ff]/10 text-[#1366ff]">
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