import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, Plus, Star } from "lucide-react";
import { useStoreProducts } from "./useStoreProducts";
import { brl } from "./tokens";
import type { StoreProduct } from "./ProductCard";
import { useShowPrices } from "@/hooks/useCompanyInfo";
import { SmartImage } from "./SmartImage";
import { trackCardClick, trackCta, trackInfinitePage } from "@/lib/analytics";

const PAGE = 8;

function shuffle<T>(arr: T[], seed: number) {
  const a = arr.slice();
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function InfiniteProducts() {
  const { data, isLoading } = useStoreProducts();
  const all = useMemo(() => data ?? [], [data]);
  const [pages, setPages] = useState(1);
  const sentinel = useRef<HTMLDivElement | null>(null);

  // Reset quando o catálogo carrega
  useEffect(() => setPages(1), [all.length]);

  // Analytics: emite um evento por página carregada pelo scroll infinito.
  useEffect(() => {
    if (!all.length) return;
    trackInfinitePage(pages, Math.min(pages * PAGE, all.length * pages));
  }, [pages, all.length]);

  useEffect(() => {
    if (!sentinel.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setPages((p) => p + 1);
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(sentinel.current);
    return () => io.disconnect();
  }, [all.length]);

  // Gera páginas "infinitas" ciclando o catálogo embaralhado
  const visible = useMemo<StoreProduct[]>(() => {
    if (!all.length) return [];
    const out: StoreProduct[] = [];
    for (let i = 0; i < pages; i++) {
      const reshuffled = i === 0 ? all : shuffle(all, i * 7919 + 1);
      out.push(...reshuffled.slice(0, PAGE));
    }
    return out;
  }, [all, pages]);

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-[1280px] px-4 py-12">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-[var(--store-radius-lg)] bg-[var(--store-surface-soft)]"
              style={{ minHeight: 280 }}
            />
          ))}
        </div>
      </section>
    );
  }

  if (!all.length) return null;

  return (
    <section className="bg-[var(--store-bg)] py-12 sm:py-16">
      <div className="mx-auto w-full max-w-[1280px] px-4">
        <header className="mb-6 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--store-accent)]">
              Nosso portfólio completo
            </p>
            <h2 className="font-display mt-1 text-4xl leading-none text-[var(--store-primary)] sm:text-5xl lg:text-6xl">
              CONFIRA NOSSA PRODUÇÃO
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[var(--store-text-muted)]">
              Centenas de produtos personalizados — role à vontade para descobrir mais.
            </p>
          </div>
          <Link
            to="/produtos"
            className="inline-flex min-h-11 items-center gap-1 text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--store-primary)] transition-colors hover:text-[var(--store-accent)]"
            onClick={() =>
              trackCta({
                cta_id: "infinite_view_all",
                cta_label: "Ver catálogo completo",
                section: "infinite_products",
                destination: "/produtos",
                channel: "internal",
              })
            }
          >
            Ver catálogo completo →
          </Link>
        </header>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((p, idx) => (
            <FeedCard
              key={`${p.id}-${idx}`}
              product={p}
              index={idx}
              page={Math.floor(idx / PAGE) + 1}
            />
          ))}
        </div>

        <div
          ref={sentinel}
          className="mt-10 flex items-center justify-center gap-2 text-sm text-[var(--store-text-muted)]"
        >
          <Loader2 className="h-4 w-4 animate-spin text-[var(--store-primary)]" />
          Carregando mais produtos…
        </div>
      </div>
    </section>
  );
}

function FeedCard({
  product,
  index,
  page,
}: {
  product: StoreProduct;
  index: number;
  page: number;
}) {
  const slug = product.slug ?? product.id;
  const rating = product.rating ? Number(product.rating) : null;
  const showPrices = useShowPrices();
  return (
    <Link
      to="/produto/$slug"
      params={{ slug }}
      className="store-bento-card group flex flex-col overflow-hidden bg-white p-3 text-[var(--store-ink)] animate-fade-in"
      style={{ animationDelay: `${(index % PAGE) * 50}ms`, animationFillMode: "both" }}
      onClick={() =>
        trackCardClick({
          card_id: product.id,
          card_title: product.name,
          card_type: "product",
          section: "infinite_products",
          position: index + 1,
          infinite_page_at_click: page,
          price: product.base_price != null ? Number(product.base_price) : null,
          category: product.category ?? null,
        })
      }
    >
      <div className="relative mb-3 aspect-square overflow-hidden rounded-[var(--store-radius-md)] bg-slate-100">
        <SmartImage 
          src={product.image_url} 
          alt={product.name}
          fallbackEmoji="📦"
          className="brightness-[1.02] contrast-[1.05] saturate-[1.08] transition-transform duration-500 group-hover:scale-110"
        />
        {product.badge && (
          <span className="absolute left-2 top-2 rounded-sm bg-[var(--store-ink)] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[var(--store-gold)]">
            {product.badge}
          </span>
        )}
      </div>
      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--store-text-muted)]">
        {product.category ?? "Personalizado"}
      </p>
      <h4 className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug sm:text-[15px]">
        {product.name}
      </h4>
      <div className="mt-auto flex items-end justify-between gap-2 pt-3">
        <div className="min-w-0">
          {rating != null && (
            <div className="flex items-center gap-1 text-[var(--store-gold)]">
              <Star className="h-3 w-3 fill-current" />
              <span className="text-[11px] font-bold text-[var(--store-ink)]">
                {rating.toFixed(1)}
              </span>
            </div>
          )}
          {showPrices ? (
            <p className="font-display text-2xl leading-none">{brl(product.base_price)}</p>
          ) : (
            <p className="font-display text-base leading-none">Sob consulta</p>
          )}
        </div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--store-radius-sm)] bg-[var(--store-ink)] text-white transition-colors group-hover:bg-[var(--store-gold)] group-hover:text-[var(--store-ink)]">
          <Plus className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}