import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Star } from "lucide-react";
import { useStoreProducts } from "./useStoreProducts";
import { brl } from "./tokens";
import type { StoreProduct } from "./ProductCard";
import { useShowPrices } from "@/hooks/useCompanyInfo";
import { SmartImage } from "./SmartImage";
import { trackCardClick, trackCta, trackInfinitePage } from "@/lib/analytics";

const PAGE = 8;

export function InfiniteProducts() {
  const { data, isLoading, isError } = useStoreProducts();
  const all = useMemo(() => data ?? [], [data]);
  const [visibleCount, setVisibleCount] = useState(PAGE);
  const sentinel = useRef<HTMLDivElement | null>(null);
  const visible = useMemo(() => all.slice(0, visibleCount), [all, visibleCount]);
  const loadedPage = Math.ceil(visible.length / PAGE);
  const hasMore = visible.length < all.length;

  // Começa do início se produtos forem adicionados/removidos em tempo real.
  useEffect(() => setVisibleCount(PAGE), [all.length]);

  // Analytics acompanha a quantidade única de produtos realmente exibida.
  useEffect(() => {
    if (!visible.length) return;
    trackInfinitePage(loadedPage, visible.length);
  }, [loadedPage, visible.length]);

  useEffect(() => {
    const target = sentinel.current;
    if (!target || !hasMore) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((count) => Math.min(count + PAGE, all.length));
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(target);
    return () => io.disconnect();
  }, [all.length, hasMore]);

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

  if (isError) {
    return (
      <section className="mx-auto w-full max-w-[1280px] px-4 py-12" aria-labelledby="all-products-title">
        <div className="rounded-2xl border border-white/10 bg-[#0B1026] p-6 text-sm text-slate-300">
          <h2 id="all-products-title" className="font-display text-2xl font-bold text-white">Todos os produtos</h2>
          <p className="mt-2">Não foi possível carregar o catálogo agora.</p>
          <Link to="/produtos" className="mt-3 inline-flex min-h-10 items-center font-bold text-[#22D3EE]">Abrir catálogo completo →</Link>
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
              Catálogo Decode completo
            </p>
            <h2 className="font-display mt-1 text-4xl leading-none text-white sm:text-5xl lg:text-6xl">
              TODOS OS PRODUTOS
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              {all.length} {all.length === 1 ? "produto ativo" : "produtos ativos"} no catálogo — role para explorar todos.
            </p>
          </div>
          <Link
            to="/produtos"
            className="inline-flex min-h-11 items-center gap-1 text-xs font-extrabold uppercase tracking-[0.18em] text-[#22D3EE] transition-colors hover:text-white"
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

        {hasMore ? (
          <div
            ref={sentinel}
            className="mt-10 flex min-h-12 flex-wrap items-center justify-center gap-2 text-sm text-[var(--store-text-muted)]"
          >
            <span role="status">Continue rolando ou carregue os próximos produtos.</span>
            <button
              type="button"
              onClick={() => setVisibleCount((count) => Math.min(count + PAGE, all.length))}
              className="ml-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-[#22D3EE] transition hover:border-[#22D3EE]/60 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22D3EE]"
            >
              Mostrar mais {Math.min(PAGE, all.length - visible.length)}
            </button>
          </div>
        ) : (
          <p role="status" className="mt-10 text-center text-sm text-slate-400">
            Você chegou ao fim do catálogo · {all.length} {all.length === 1 ? "produto" : "produtos"}
          </p>
        )}
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
      className="store-bento-card group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0B1026] p-3 text-[#F8FAFC] shadow-[0_14px_36px_rgba(0,0,0,.18)] animate-fade-in hover:border-[#22D3EE]/35 hover:shadow-[0_18px_42px_rgba(8,124,240,.12)]"
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
      <div className="relative mb-3 aspect-square overflow-hidden rounded-[var(--store-radius-md)] bg-white/5">
        <SmartImage 
          src={product.image_url} 
          alt={product.name}
          className="brightness-[1.02] contrast-[1.05] saturate-[1.08] transition-transform duration-500 group-hover:scale-110"
        />
        {product.badge && (
          <span className="absolute left-2 top-2 rounded-sm bg-[#22D3EE] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#0B1026]">
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
              <span className="text-[11px] font-bold text-white">
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
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--store-radius-sm)] bg-gradient-to-br from-[#087CF0] to-[#7138F5] text-white transition-all group-hover:from-[#22D3EE] group-hover:to-[#087CF0] group-hover:text-[#0B1026]">
          <Plus className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}