import { Link } from "@tanstack/react-router";

const CATS = [
  { slug: "Cartões", label: "Cartão de Visita", emoji: "📇" },
  { slug: "Panfletos", label: "Folhetos & Panfletos", emoji: "📄" },
  { slug: "Adesivos", label: "Adesivos & Etiquetas", emoji: "🏷️" },
  { slug: "Banners", label: "Banners & Faixas", emoji: "🎌" },
  { slug: "Camisetas", label: "Camisetas DTF", emoji: "👕" },
  { slug: "Canecas", label: "Canecas", emoji: "☕" },
  { slug: "Brindes", label: "Brindes", emoji: "🎁" },
  { slug: "Embalagens", label: "Embalagens", emoji: "📦" },
  { slug: "Plotagem", label: "Plotagem", emoji: "🖨️" },
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
              <div className="relative grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#172554]/10 to-[#172554]/5 ring-2 ring-transparent transition-all group-hover:ring-[#172554] group-hover:shadow-lg sm:h-24 sm:w-24">
                <span className="text-3xl sm:text-4xl transition-transform duration-300 group-hover:scale-110">
                  {c.emoji}
                </span>
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
