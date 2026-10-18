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
  Wrench,
  Share2,
  Palette,
  Code2,
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
  { slug: "Manutenção de Computadores", label: "Manutenção de PC", Icon: Wrench },
  { slug: "Social Media", label: "Social Media", Icon: Share2 },
  { slug: "Design Gráfico", label: "Design Gráfico", Icon: Palette },
  { slug: "Programação", label: "Programação", Icon: Code2 },
];

export function CategoryCircles() {
  return (
    <section aria-label="Explore por categoria" className="border-y border-white/10 bg-[#080B14] py-7 sm:py-10">
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
              <div className="relative grid h-[76px] w-[76px] place-items-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#111A38] to-[#0B1026] text-[#22D3EE] shadow-[0_12px_30px_rgba(0,0,0,.2)] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[#22D3EE]/50 group-hover:shadow-[0_16px_36px_rgba(8,124,240,.16)] sm:h-24 sm:w-24">
                <c.Icon
                  className="h-8 w-8 transition-transform duration-300 group-hover:scale-110 sm:h-9 sm:w-9"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </div>
              <span className="text-center text-[11px] font-bold leading-tight text-slate-300 transition-colors group-hover:text-white sm:text-xs">
                {c.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
