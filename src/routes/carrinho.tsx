import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart-context";
import { brl } from "@/components/storefront/tokens";
import { useWaLink } from "@/hooks/useCompanyInfo";
import { StoreShell } from "@/components/storefront/StoreShell";
import { ShoppingCart, Trash2, Minus, Plus, ArrowRight, MessageCircle } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Carrinho — Alcateia's" },
      {
        name: "description",
        content: "Revise seus produtos e finalize seu pedido na Alcateia's.",
      },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const waLink = useWaLink();
  const { items, count, total, updateQuantity, removeItem, clear } = useCart();

  const message = useMemo(() => {
    const lines = items.map(
      (item: { name: string; quantity: number; price: number }) =>
        `• ${item.name} — ${item.quantity}x ${brl(item.price)} = ${brl(item.price * item.quantity)}`,
    );
    return `Olá! Estou finalizando um pedido no site:\n\n${lines.join("\n")}\n\n*Total: ${brl(total)}*\n\nPodemos prosseguir?`;
  }, [items, total]);

  if (items.length === 0) {
    return (
      <StoreShell>
        <section className="mx-auto max-w-[1280px] px-4 py-16 text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-[var(--store-text-light)]" />
          <h1 className="mt-4 text-2xl font-extrabold text-[var(--store-primary)]">
            Seu carrinho está vazio
          </h1>
          <p className="mt-2 text-sm text-[var(--store-text-muted)]">
            Explore nosso catálogo e adicione produtos personalizados.
          </p>
          <Link
            to="/produtos"
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-[var(--store-radius-md)] bg-[var(--store-primary)] px-5 text-sm font-bold text-white hover:bg-[var(--store-primary-light)]"
          >
            Ver catálogo <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </StoreShell>
    );
  }

  return (
    <StoreShell>
      <section className="mx-auto max-w-[1280px] px-3 sm:px-4 py-6 sm:py-12 pb-32 lg:pb-12">
        <h1 className="text-2xl font-extrabold text-[var(--store-primary)] sm:text-3xl">
          Carrinho
        </h1>
        <p className="mt-1 text-sm text-[var(--store-text-muted)]">
          {count} {count === 1 ? "item" : "itens"}
        </p>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-3">
            {items.map((item: { id: string; name: string; category: string | null; price: number; quantity: number; image_url?: string | null }) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-[var(--store-radius-lg)] border border-[var(--store-border)] bg-white p-4 shadow-[var(--store-shadow-sm)]"
              >
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[var(--store-radius-md)] bg-[var(--store-surface-soft)] text-2xl">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-full w-full rounded-[var(--store-radius-md)] object-cover"
                    />
                  ) : (
                    "🛍️"
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[var(--store-text)]">
                    {item.name}
                  </p>
                  <p className="text-xs text-[var(--store-text-muted)]">
                    {item.category ?? "Personalizado"} · {brl(item.price)} un
                  </p>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="grid h-10 w-10 sm:h-9 sm:w-9 place-items-center rounded-lg border border-[var(--store-border)] bg-white text-[var(--store-text)] hover:bg-[var(--store-surface-soft)] active:scale-95"
                    aria-label="Diminuir quantidade"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-7 text-center text-sm font-bold text-[var(--store-text)]">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="grid h-10 w-10 sm:h-9 sm:w-9 place-items-center rounded-lg border border-[var(--store-border)] bg-white text-[var(--store-text)] hover:bg-[var(--store-surface-soft)] active:scale-95"
                    aria-label="Aumentar quantidade"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <p className="hidden min-w-[5rem] text-right text-sm font-bold text-[var(--store-primary)] sm:block">
                  {brl(item.price * item.quantity)}
                </p>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="grid h-10 w-10 sm:h-9 sm:w-9 place-items-center rounded-lg text-[var(--store-text-light)] hover:bg-red-50 hover:text-red-600"
                  aria-label="Remover item"
                >
                  <Trash2 className="h-4 w-4 sm:h-4 sm:w-4" />
                </button>
              </div>
            ))}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={clear}
                className="text-xs font-semibold text-[var(--store-text-muted)] underline hover:text-[var(--store-danger)]"
              >
                Esvaziar carrinho
              </button>
            </div>
          </div>

          <aside className="space-y-4 hidden lg:block">
            <div className="rounded-[var(--store-radius-xl)] border border-[var(--store-border)] bg-white p-6 shadow-[var(--store-shadow-sm)]">
              <h2 className="text-lg font-extrabold text-[var(--store-primary)]">Resumo</h2>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm text-[var(--store-text-muted)]">
                  <span>Subtotal</span>
                  <span>{brl(total)}</span>
                </div>
                <div className="flex justify-between text-sm text-[var(--store-text-muted)]">
                  <span>Entrega</span>
                  <span>A combinar</span>
                </div>
              </div>
              <div className="mt-4 border-t border-[var(--store-border)] pt-4">
                <div className="flex justify-between text-base font-extrabold text-[var(--store-text)]">
                  <span>Total estimado</span>
                  <span>{brl(total)}</span>
                </div>
              </div>

              <a
                href={waLink(message)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--store-radius-md)] bg-[var(--store-success)] text-sm font-extrabold uppercase tracking-wide text-white shadow-[var(--store-shadow-md)] transition-transform hover:-translate-y-0.5"
              >
                <MessageCircle className="h-5 w-5" /> Finalizar pelo WhatsApp
              </a>

              <p className="mt-3 text-center text-xs text-[var(--store-text-muted)]">
                Você será redirecionado para o WhatsApp com o resumo do pedido.
              </p>
            </div>

            <Link
              to="/produtos"
              className="flex h-11 items-center justify-center gap-2 rounded-[var(--store-radius-md)] border border-[var(--store-border)] bg-white text-sm font-bold text-[var(--store-primary)] hover:bg-[var(--store-surface-soft)]"
            >
              Continuar comprando
            </Link>
          </aside>
        </div>
      </section>

      {/* Barra fixa de checkout no mobile/tablet */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--store-border)] bg-white/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-3 py-3 sm:px-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--store-text-muted)]">
              Total ({count} {count === 1 ? "item" : "itens"})
            </p>
            <p className="truncate text-lg font-extrabold text-[var(--store-primary)]">
              {brl(total)}
            </p>
          </div>
          <a
            href={waLink(message)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-[var(--store-radius-md)] bg-[var(--store-success)] px-5 text-sm font-extrabold uppercase tracking-wide text-white shadow-[var(--store-shadow-md)] active:scale-[0.98]"
          >
            <MessageCircle className="h-5 w-5" /> Finalizar
          </a>
        </div>
      </div>
    </StoreShell>
  );
}
