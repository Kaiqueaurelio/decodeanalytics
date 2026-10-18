import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { brl } from "./tokens";
import { SmartImage } from "./SmartImage";
import { useShowPrices } from "@/hooks/useCompanyInfo";

export type StoreProduct = {
  id: string;
  name: string;
  slug: string | null;
  category: string | null;
  short_description: string | null;
  base_price: number | string;
  image_url: string | null | undefined;
  rating: number | string | null;
  reviews_count: number | null;
  min_quantity: number | null;
  badge: string | null;
  specs: string[] | null;
  unit: string | null;
};

const BADGE_TONE: Record<string, string> = {
  "Mais vendido": "bg-[var(--store-secondary)] text-[var(--store-primary-dark)]",
  Promoção: "bg-[var(--store-accent)] text-white",
  Lançamento: "bg-[var(--store-primary-light)] text-white",
  "Arte grátis": "bg-[var(--store-success)] text-white",
  "Produção rápida": "bg-[var(--store-warning)] text-white",
};

export function ProductCard({ product }: { product: StoreProduct }) {
  const slug = product.slug ?? product.id;
  const showPrices = useShowPrices();
  const tone = product.badge
    ? (BADGE_TONE[product.badge] ?? "bg-[var(--store-primary)] text-white")
    : null;
  const rating = product.rating ? Number(product.rating) : null;
  const price = Number(product.base_price ?? 0);
  const hasPrice = Number.isFinite(price) && price > 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-[var(--store-radius-lg)] border border-[var(--store-border)] bg-white shadow-[var(--store-shadow-sm)] transition-all duration-200 hover:-translate-y-1 hover:border-[var(--store-primary-light)]/40 hover:shadow-[var(--store-shadow-md)]">
      <Link
        to="/produto/$slug"
        params={{ slug }}
        className="relative block aspect-[4/3] overflow-hidden bg-[var(--store-surface-soft)]"
      >
        <SmartImage
          src={product.image_url}
          alt={product.name}
          fallbackEmoji="🛍️"
          className="brightness-[1.02] contrast-[1.05] saturate-[1.08] transition-transform duration-500 group-hover:scale-110"
        />
        {product.badge && tone && (
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${tone}`}
          >
            {product.badge}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--store-accent)]">
          {product.category ?? "Personalizado"}
        </p>
        <h3 className="mt-1 line-clamp-2 text-[15px] font-bold leading-snug text-[var(--store-text)]">
          <Link to="/produto/$slug" params={{ slug }} className="hover:text-[var(--store-primary)]">
            {product.name}
          </Link>
        </h3>
        {rating != null && (
          <div className="mt-1.5 flex items-center gap-1 text-xs text-[var(--store-text-muted)]">
            <Star className="h-3.5 w-3.5 fill-[var(--store-secondary)] text-[var(--store-secondary)]" />
            <span className="font-semibold text-[var(--store-text)]">{rating.toFixed(1)}</span>
            <span>({product.reviews_count ?? 0})</span>
          </div>
        )}
        {product.short_description && (
          <p className="mt-2 line-clamp-2 text-xs text-[var(--store-text-muted)]">
            {product.short_description}
          </p>
        )}
        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            {showPrices && hasPrice ? (
              <>
                <p className="text-[10px] uppercase tracking-wide text-[var(--store-text-light)]">
                  Preço no catálogo
                </p>
                <p className="text-xl font-extrabold leading-tight text-[var(--store-primary)]">
                  {brl(price)}
                </p>
              </>
            ) : (
              <p className="text-base font-extrabold leading-tight text-[var(--store-primary)]">
                Sob consulta
              </p>
            )}
            {product.min_quantity ? (
              <p className="text-[11px] text-[var(--store-text-muted)]">
                a partir de {product.min_quantity} {product.unit ?? "un"}
              </p>
            ) : null}
          </div>
        </div>
        <Link
          to="/produto/$slug"
          params={{ slug }}
          className="mt-4 inline-flex h-10 items-center justify-center rounded-[var(--store-radius-md)] bg-[var(--store-primary)] text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Ver detalhes
        </Link>
      </div>
    </article>
  );
}

export function ProductGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</div>;
}

export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-[var(--store-radius-lg)] border border-[var(--store-border)] bg-white">
      <div className="aspect-[4/3] bg-[var(--store-surface-soft)]" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-2/3 rounded bg-[var(--store-border)]" />
        <div className="h-4 w-full rounded bg-[var(--store-border)]" />
        <div className="h-4 w-1/2 rounded bg-[var(--store-border)]" />
      </div>
    </div>
  );
}

export function SectionHeader({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--store-accent)]">{kicker}</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-[var(--store-text)] sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--store-text-muted)]">{description}</p>
    </div>
  );
}
