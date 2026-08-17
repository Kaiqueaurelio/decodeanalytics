import { Link } from "@tanstack/react-router";
import {
  Contact,
  FileText,
  Tags,
  Flag,
  Shirt,
  Coffee,
  Gift,
  Package,
  Printer,
  type LucideIcon,
} from "lucide-react";

const CATS: { slug: string; label: string; Icon: LucideIcon }[] = [
  { slug: "Cartões", label: "Cartão de Visita", Icon: Contact },
  { slug: "Panfletos", label: "Folhetos & Panfletos", Icon: FileText },
  { slug: "Adesivos", label: "Adesivos & Etiquetas", Icon: Tags },
  { slug: "Banners", label: "Banners & Faixas", Icon: Flag },
  { slug: "Camisetas", label: "Camisetas DTF", Icon: Shirt },
  { slug: "Canecas", label: "Canecas", Icon: Coffee },
  { slug: "Brindes", label: "Brindes", Icon: Gift },
  { slug: "Embalagens", label: "Embalagens", Icon: Package },
  { slug: "Plotagem", label: "Plotagem", Icon: Printer },
];

export function CategoryCircles() {
  return (
    <section className="bg-white py-6 sm:py-10">
      <div className="mx-auto max-w-[1280px] overflow-hidden px-4">
        <div className="safe-area-scroll-x flex gap-3 overflow-x-auto pb-4 sm:gap-6 sm:justify-center [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATS.map((c, i) => (
            <Link
              key={c.slug}
              to="/produtos"
              search={{ cat: c.slug }}
              className="group flex w-[76px] shrink-0 flex-col items-center gap-2 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-store-primary focus-visible:ring-offset-2 sm:w-28 animate-fade-in"
              style={{ animationDelay: `${60 + i * 40}ms`, animationFillMode: "both" }}
            >
              <div className="relative grid h-[76px] w-[76px] place-items-center overflow-hidden rounded-full bg-slate-50 text-store-primary ring-1 ring-slate-200 transition-all duration-300 group-hover:-translate-y-1 group-hover:ring-store-primary group-hover:shadow-[var(--store-shadow-md)] sm:h-24 sm:w-24">
                <c.Icon
                  className="h-8 w-8 transition-transform duration-300 group-hover:scale-110 sm:h-9 sm:w-9"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </div>
              <span className="text-center text-[11px] font-bold leading-tight text-[var(--store-text)] transition-colors group-hover:text-store-primary sm:text-xs">
                {c.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
