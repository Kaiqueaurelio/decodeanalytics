import { Link } from "@tanstack/react-router";
import cartoes from "@/assets/products/cartoes.jpg.asset.json";
import panfletos from "@/assets/products/panfletos.jpg.asset.json";
import adesivos from "@/assets/products/adesivos.jpg.asset.json";
import canecas from "@/assets/products/canecas.jpg.asset.json";
import camisetas from "@/assets/products/camisetas.jpg.asset.json";
import brindes from "@/assets/products/brindes.jpg.asset.json";
import banners from "@/assets/products/banners.jpg.asset.json";
import embalagens from "@/assets/products/embalagens.jpg.asset.json";
import plotagem from "@/assets/products/plotagem.jpg.asset.json";

const CATS = [
  { slug: "Cartões", label: "Cartão de Visita", img: cartoes.url },
  { slug: "Panfletos", label: "Folhetos & Panfletos", img: panfletos.url },
  { slug: "Adesivos", label: "Adesivos & Etiquetas", img: adesivos.url },
  { slug: "Banners", label: "Banners & Faixas", img: banners.url },
  { slug: "Camisetas", label: "Camisetas DTF", img: camisetas.url },
  { slug: "Canecas", label: "Canecas", img: canecas.url },
  { slug: "Brindes", label: "Brindes", img: brindes.url },
  { slug: "Embalagens", label: "Embalagens", img: embalagens.url },
  { slug: "Plotagem", label: "Plotagem", img: plotagem.url },
];

export function CategoryCircles() {
  return (
    <section className="bg-white py-8 sm:py-10">
      <div className="mx-auto max-w-[1280px] px-4">
        <div className="flex gap-4 overflow-x-auto pb-2 sm:gap-6 sm:justify-center [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATS.map((c, i) => (
            <Link
              key={c.slug}
              to="/produtos"
              search={{ cat: c.slug }}
              className="group flex w-20 shrink-0 flex-col items-center gap-2 sm:w-28 animate-fade-in"
              style={{ animationDelay: `${60 + i * 40}ms`, animationFillMode: "both" }}
            >
              <div className="relative grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-[#eef4ff] ring-2 ring-transparent transition-all group-hover:ring-[#1366ff] sm:h-24 sm:w-24">
                <img
                  src={c.img}
                  alt={c.label}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <span className="text-center text-[11px] font-bold leading-tight text-[var(--store-text)] sm:text-xs">
                {c.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}