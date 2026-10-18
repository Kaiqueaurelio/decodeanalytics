import { ExternalLink, ShoppingBag, ArrowUpRight } from "lucide-react";

const CATALOG_URL = "https://wa.me/c/5511939222885";

export function CategoryCircles() {
  return (
    <section className="bg-[#08080d] px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-[1180px] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#11111b] via-[#0b0b12] to-[#10152a] p-6 sm:p-10">
        <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/5 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_#22d3ee]" />
              Catálogo oficial
            </span>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-4xl">
              Conheça nossos produtos e soluções
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base">
              Veja os itens publicados no nosso catálogo do WhatsApp, consulte detalhes atualizados e fale diretamente com a equipe.
            </p>
          </div>
          <a
            href={CATALOG_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-extrabold text-[#050508] transition hover:-translate-y-0.5 hover:bg-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
          >
            <ShoppingBag className="h-4 w-4" />
            Abrir catálogo
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
        <div className="mt-8 flex flex-wrap gap-3 border-t border-white/10 pt-5 text-xs text-zinc-400">
          <span className="inline-flex items-center gap-2"><ExternalLink className="h-3.5 w-3.5 text-cyan-300" /> Fotos e detalhes no catálogo oficial</span>
          <span>•</span>
          <span>Sem preços ou produtos inventados no site</span>
        </div>
      </div>
    </section>
  );
}
