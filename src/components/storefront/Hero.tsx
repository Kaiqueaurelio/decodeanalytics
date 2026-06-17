import { Link } from "@tanstack/react-router";
import { ArrowRight, Upload, Calculator, Sparkles } from "lucide-react";
import { waLink } from "./tokens";

export function Hero() {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 pt-4 sm:pt-6">
      <div className="grid gap-3 sm:gap-4 md:grid-cols-12">
        {/* HERO YELLOW BLOCK */}
        <div
          className="store-bento-card store-crop-marks group relative overflow-hidden bg-[var(--store-gold)] p-6 sm:p-10 md:col-span-8 md:p-12 animate-fade-in"
          style={{ animationDelay: "60ms", animationFillMode: "both" }}
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--store-ink)] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--store-gold)]">
            <Sparkles className="h-3 w-3" /> Produção em até 48h
          </span>
          <h1
            className="font-display mt-5 text-[44px] italic leading-[0.95] text-[var(--store-ink)] sm:text-6xl md:text-7xl lg:text-8xl"
            style={{ letterSpacing: "-0.01em" }}
          >
            QUALIDADE
            <br />
            QUE VOCÊ <span className="text-[var(--store-ink-soft)]">TOCA.</span>
          </h1>
          <p className="mt-5 max-w-xl text-sm font-medium text-[var(--store-ink)]/80 sm:text-base">
            Cartões, banners, adesivos, camisetas, canecas e brindes impressos com acabamento de
            gráfica de verdade — sem cara de loja online genérica.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/produtos"
              className="inline-flex items-center justify-center gap-2 bg-[var(--store-ink)] px-6 py-3 text-xs font-extrabold uppercase tracking-[0.18em] text-white transition-transform hover:scale-[1.03] sm:px-8 sm:py-4 sm:text-sm"
            >
              Ver produtos <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={waLink("Olá! Quero enviar minha arte para um orçamento.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border-2 border-[var(--store-ink)] px-6 py-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--store-ink)] transition-colors hover:bg-[var(--store-ink)] hover:text-[var(--store-gold)] sm:px-8 sm:py-4 sm:text-sm"
            >
              <Upload className="h-4 w-4" /> Enviar minha arte
            </a>
          </div>

          {/* Decorative giant number */}
          <div
            className="font-display pointer-events-none absolute -right-6 -bottom-10 select-none text-[180px] leading-none text-[var(--store-ink)]/10 transition-transform duration-700 group-hover:rotate-3 sm:text-[240px]"
            aria-hidden="true"
          >
            48H
          </div>
        </div>

        {/* SIDE BENTO COLUMN */}
        <div className="grid gap-3 sm:gap-4 md:col-span-4 md:grid-rows-2">
          <div
            className="store-bento-card flex flex-col justify-between border border-[var(--store-ink-line)] bg-[var(--store-ink-soft)] p-6 text-white animate-fade-in"
            style={{ animationDelay: "140ms", animationFillMode: "both" }}
          >
            <span className="w-fit rounded-full bg-[var(--store-gold)]/15 px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--store-gold)]">
              Acabamento
            </span>
            <h3 className="font-display mt-4 text-3xl leading-none">
              SOFT TOUCH,<br />
              LAMINAÇÃO &amp; VERNIZ
            </h3>
            <p className="mt-2 text-xs text-white/60">
              Sinta a diferença na primeira entrega.
            </p>
          </div>
          <Link
            to="/calculator"
            className="store-bento-card group flex cursor-pointer flex-col justify-between border border-[var(--store-ink-line)] bg-[var(--store-ink-soft)] p-6 text-white transition-colors hover:border-[var(--store-gold)]/60 animate-fade-in"
            style={{ animationDelay: "220ms", animationFillMode: "both" }}
          >
            <Calculator className="h-6 w-6 text-[var(--store-gold)]" />
            <div>
              <h3 className="font-display text-3xl leading-none">ORÇAMENTO RÁPIDO</h3>
              <div className="mt-3 inline-flex items-center gap-2 text-[var(--store-gold)]">
                <span className="text-xs font-extrabold uppercase tracking-[0.18em]">
                  Calcular agora
                </span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}