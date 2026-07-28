import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Search,
  ShoppingCart,
  User,
  MessageCircle,
  Menu,
  Tag,
  Phone,
  Mail,
  MapPin,
  Instagram,
  Facebook,
  X,
  Sparkles,
} from "lucide-react";
import { STORE_CATEGORIES } from "./tokens";
import { useCompanyInfo, useWaLink } from "@/hooks/useCompanyInfo";
import { useCart } from "@/lib/cart-context";
import { useState } from "react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";

export function StoreShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="store-light min-h-dvh bg-[var(--store-bg)] text-[var(--store-text)]"
      style={{ fontFamily: "var(--store-font)" }}
    >
      <TopPromoBar />
      <StoreHeader />
      <CategoryNav />
      <main className="min-h-[60vh]">{children}</main>
      <StoreFooter />
      <FloatingWhatsApp />
    </div>
  );
}

function CartButton() {
  const { count } = useCart();
  return (
    <Link
      to="/carrinho"
      aria-label={`Carrinho, ${count} ${count === 1 ? "item" : "itens"}`}
      className="relative inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-[var(--store-primary)] px-3 py-2 text-sm font-bold text-inverse transition-colors hover:bg-[var(--store-primary-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--store-primary)] focus-visible:ring-offset-2"
    >
      <ShoppingCart className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="hidden lg:inline">Carrinho</span>
      <span aria-hidden="true" className="ml-1 rounded-full bg-[var(--store-secondary)] px-1.5 text-2xs font-extrabold text-[var(--store-primary-dark)]">
        {count}
      </span>
    </Link>
  );
}

function CartCountBadge() {
  const { count } = useCart();
  return (
    <span className="ml-auto rounded-full bg-[var(--store-primary)] px-2 py-0.5 text-2xs font-extrabold text-inverse">
      {count}
    </span>
  );
}

function TopPromoBar() {
  return (
    <div className="safe-area-top bg-[var(--store-secondary)] text-[var(--store-primary-dark)]">
      <div className="mx-auto flex min-h-9 max-w-[1280px] items-center justify-center gap-1 px-3 py-1.5 text-center text-2xs font-semibold leading-tight sm:min-h-10 sm:gap-2 sm:px-4 sm:py-2 sm:text-xs md:text-sm">
        <Tag className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0 break-words">
          Ganhe <strong>10% OFF</strong> na sua primeira compra — cupom{" "}
          <strong className="inline-block rounded-md bg-[var(--store-primary)] px-2 py-0.5 text-[var(--store-secondary)]">
            BEMVINDO10
          </strong>
        </span>
      </div>
    </div>
  );
}

function StoreHeader() {
  const [q, setQ] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const info = useCompanyInfo();
  const waLink = useWaLink();
  return (
    <header className="store-sticky-header sticky z-30 border-b border-[var(--store-border)] bg-[var(--store-surface)]/95 backdrop-blur">
      <div className="mx-auto grid max-w-[1280px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3 md:flex md:gap-6 md:py-4">
        <Link to="/" className="flex shrink-0 items-center gap-2 sm:gap-3">
          <img
            src="/brand/alcateia-symbol.png"
            alt="Alcateia's"
            className="h-10 w-auto sm:h-12 md:h-14 object-contain"
          />
          <div className="hidden leading-tight sm:block">
            <div
              className="font-display text-xl sm:text-2xl leading-none text-[var(--store-primary)]"
              style={{ letterSpacing: "0.04em" }}
            >
              ALCATEIA&apos;S
            </div>
            <div className="text-2xs sm:text-2xs font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[var(--store-accent)]">
              Gráfica online
            </div>
          </div>
        </Link>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            window.location.href = `/produtos?q=${encodeURIComponent(q)}`;
          }}
          className="relative flex-1"
          role="search"
        >
          <label htmlFor="store-search" className="sr-only">
            O que você está procurando?
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--store-text-light)] sm:left-4 sm:h-5 sm:w-5" />
          <input
            id="store-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="O que você está procurando?"
            className="h-10 w-full min-w-0 rounded-[var(--store-radius-lg)] border border-[var(--store-border)] bg-card pl-10 pr-20 text-base sm:h-11 sm:pl-12 sm:pr-28 sm:text-base md:h-12 md:text-base outline-none transition-all placeholder:text-[var(--store-text-light)] focus:border-[var(--store-primary-light)] focus:ring-4 focus:ring-[var(--store-primary-light)]/15"
          />
          <button
            type="submit"
            aria-label="Buscar produtos"
            className="absolute right-1 top-1/2 inline-flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-[var(--store-radius-md)] bg-[var(--store-primary)] px-3 text-2xs font-bold uppercase tracking-wide text-inverse transition-colors hover:bg-[var(--store-primary-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--store-primary)] focus-visible:ring-offset-2 sm:right-1.5 sm:text-xs md:px-4 md:text-sm"
          >
            Buscar
          </button>
        </form>

        <nav className="hidden shrink-0 items-center gap-0.5 md:flex lg:gap-1">
          <Link
            to="/assistente"
            aria-label="Ella AI, assistente virtual"
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-bold text-highlight transition-colors hover:bg-highlight/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--store-primary)] focus-visible:ring-offset-2 lg:px-3"
          >
            <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="hidden lg:inline">Ella AI</span>
          </Link>
          <a
            href={waLink("Olá! Vim do site da Alcateia's.")}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Atendimento pelo WhatsApp"
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium text-[var(--store-text)] transition-colors hover:bg-[var(--store-surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--store-primary)] focus-visible:ring-offset-2 lg:px-3"
          >
            <MessageCircle className="h-4 w-4 shrink-0 text-[var(--store-success)]" aria-hidden="true" />
            <span className="hidden lg:inline">Atendimento</span>
          </a>
          <Link
            to="/auth"
            aria-label="Entrar na conta"
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium text-[var(--store-text)] transition-colors hover:bg-[var(--store-surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--store-primary)] focus-visible:ring-offset-2 lg:px-3"
          >
            <User className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="hidden lg:inline">Entrar</span>
          </Link>
          <CartButton />
        </nav>

        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Abrir menu de navegação"
              aria-expanded={mobileMenuOpen}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-[var(--store-border)] bg-card md:hidden transition-colors hover:bg-[var(--store-surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--store-primary)] focus-visible:ring-offset-2"
            >
              <Menu className="h-5 w-5 text-[var(--store-primary)]" aria-hidden="true" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-full sm:w-80 bg-card p-0 flex flex-col [&>button.absolute]:hidden"
          >
            <div className="flex items-center justify-between border-b border-[var(--store-border)] px-6 py-5">
              <div className="flex items-center gap-3">
                <img
                  src="/brand/alcateia-symbol.png"
                  alt="Alcateia's"
                  className="h-11 w-auto object-contain"
                />
                <div className="leading-tight">
                  <div className="text-sm font-extrabold text-[var(--store-primary)]">
                    Alcateia's
                  </div>
                  <div className="text-2xs font-bold uppercase tracking-[0.15em] text-[var(--store-accent)]">
                    Gráfica
                  </div>
                </div>
              </div>
              <SheetClose className="rounded-lg p-1 hover:bg-[var(--store-surface-soft)]">
                <X className="h-5 w-5 text-[var(--store-text)]" />
              </SheetClose>
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
              {/* Categorias */}
              <div className="border-b border-[var(--store-border)] px-6 py-4">
                <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--store-text-muted)] mb-3">
                  Categorias
                </h3>
                <div className="space-y-2">
                  {STORE_CATEGORIES.map((c) => (
                    <Link
                      key={c.slug}
                      to="/produtos"
                      search={{ cat: c.slug }}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-lg text-sm font-medium text-[var(--store-text)] hover:bg-[var(--store-surface-soft)] transition-colors"
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Ações principais */}
              <div className="border-b border-[var(--store-border)] px-6 py-4">
                <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--store-text-muted)] mb-3">
                  Minha Conta
                </h3>
                <div className="space-y-2">
                  <Link
                    to="/assistente"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-bold text-highlight hover:bg-highlight/10 transition-colors"
                  >
                    <Sparkles className="h-4 w-4" />
                    Perguntar à Ella
                  </Link>
                  <Link
                    to="/auth"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-[var(--store-text)] hover:bg-[var(--store-surface-soft)] transition-colors"
                  >
                    <User className="h-4 w-4 text-[var(--store-primary)]" />
                    Entrar na conta
                  </Link>
                  <Link
                    to="/carrinho"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-[var(--store-text)] hover:bg-[var(--store-surface-soft)] transition-colors"
                  >
                    <ShoppingCart className="h-4 w-4 text-[var(--store-primary)]" />
                    Carrinho
                    <CartCountBadge />
                  </Link>
                </div>
              </div>

              {/* Atendimento */}
              <div className="px-6 py-4">
                <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--store-text-muted)] mb-3">
                  Atendimento
                </h3>
                <a
                  href={waLink("Olá! Vim do site da Alcateia's.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-[var(--store-text)] hover:bg-[var(--store-surface-soft)] transition-colors bg-[var(--store-secondary)]/10"
                >
                  <MessageCircle className="h-4 w-4 text-[var(--store-success)]" />
                  <div>
                    <div className="font-semibold text-[var(--store-success)]">WhatsApp</div>
                    <div className="text-xs text-[var(--store-text-muted)]">{info.whatsappDisplay}</div>
                  </div>
                </a>
              </div>
            </nav>

            {/* Footer do menu */}
            <div className="border-t border-[var(--store-border)] px-6 py-4 bg-[var(--store-surface-soft)]">
              <p className="text-xs text-[var(--store-text-muted)] leading-relaxed mb-3">
                Produtos personalizados com acabamento profissional para sua marca brilhar.
              </p>
              <div className="flex gap-2">
                <a
                  href={info.instagramUrl ?? "#"}
                  target={info.instagramUrl ? "_blank" : undefined}
                  rel={info.instagramUrl ? "noopener noreferrer" : undefined}
                  aria-label="Instagram"
                  className="grid h-11 w-11 place-items-center rounded-lg bg-card hover:bg-[var(--store-primary)] hover:text-inverse transition-colors"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  aria-label="Facebook"
                  className="grid h-11 w-11 place-items-center rounded-lg bg-card hover:bg-[var(--store-primary)] hover:text-inverse transition-colors"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

function CategoryNav() {
  return (
    <nav
      aria-label="Categorias"
      className="hidden border-b border-[var(--store-border)] bg-[var(--store-surface)] md:block"
    >
      <div className="mx-auto flex max-w-[1280px] gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STORE_CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            to="/produtos"
            search={{ cat: c.slug }}
            className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-[var(--store-text-muted)] transition-colors hover:bg-[var(--store-surface-soft)] hover:text-[var(--store-primary)]"
            activeProps={{
              className:
                "shrink-0 rounded-full bg-[var(--store-primary)] px-4 py-2 text-sm font-semibold text-inverse",
            }}
          >
            {c.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function StoreFooter() {
  const info = useCompanyInfo();
  const waLink = useWaLink();
  return (
    <footer className="mt-16 bg-[var(--store-primary-dark)] text-inverse">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <img
              src="/brand/alcateia-symbol.png"
              alt="Alcateia's"
              className="h-16 w-auto object-contain"
            />
            <div>
              <div className="text-lg font-extrabold">Alcateia's</div>
              <div className="text-2xs font-bold uppercase tracking-[0.2em] text-[var(--store-secondary)]">
                Gráfica online
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-inverse/70">
            Produtos personalizados com acabamento profissional para a sua marca aparecer mais.
          </p>
          <div className="mt-4 flex gap-2">
            <a
              href={info.instagramUrl ?? "#"}
              target={info.instagramUrl ? "_blank" : undefined}
              rel={info.instagramUrl ? "noopener noreferrer" : undefined}
              aria-label="Instagram"
              className="grid h-11 w-11 place-items-center rounded-lg bg-inverse/10 transition-colors hover:bg-inverse/20"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="#"
              aria-label="Facebook"
              className="grid h-11 w-11 place-items-center rounded-lg bg-inverse/10 transition-colors hover:bg-inverse/20"
            >
              <Facebook className="h-4 w-4" />
            </a>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--store-secondary)]">
            Produtos
          </h3>
          <ul className="mt-2 text-sm text-inverse/70">
            {STORE_CATEGORIES.slice(1, 6).map((c) => (
              <li key={c.slug}>
                <Link
                  to="/produtos"
                  search={{ cat: c.slug }}
                  className="inline-flex min-h-11 items-center transition-colors hover:text-inverse"
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--store-secondary)]">
            Atendimento
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-inverse/70">
            <li className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 shrink-0" />
              <a
                href={waLink("Olá! Vim do site.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center transition-colors hover:text-inverse"
              >
                WhatsApp {info.whatsappDisplay}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                {info.hours.map((h) => (
                  <div key={h.day}>
                    <strong className="text-inverse/90">{h.day}:</strong> {h.time}
                  </div>
                ))}
              </div>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0" /> {info.email}
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <a
                href={info.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center transition-colors hover:text-inverse"
              >
                {info.address}
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--store-secondary)]">
            Institucional
          </h3>
          <ul className="mt-2 text-sm text-inverse/70">
            <li>
              <Link to="/produtos" className="inline-flex min-h-11 items-center transition-colors hover:text-inverse">
                Catálogo completo
              </Link>
            </li>
            <li>
              <Link to="/auth" className="inline-flex min-h-11 items-center transition-colors hover:text-inverse">
                Minha conta
              </Link>
            </li>
            <li>
              <a href="#" className="inline-flex min-h-11 items-center transition-colors hover:text-inverse">
                Política de privacidade
              </a>
            </li>
            <li>
              <a href="#" className="inline-flex min-h-11 items-center transition-colors hover:text-inverse">
                Trocas e devoluções
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-inverse/10">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-inverse/50 md:flex-row">
          <p>© {new Date().getFullYear()} Alcateia's Produções Gráficas. Todos os direitos reservados.</p>
          <p>Feito com cuidado para sua marca brilhar.</p>
        </div>
      </div>
    </footer>
  );
}

function FloatingWhatsApp() {
  const waLink = useWaLink();
  return (
    <a
      href={waLink("Olá! Gostaria de um orçamento.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      style={{
        bottom: "calc(env(safe-area-inset-bottom) + 1.25rem)",
        right: "calc(env(safe-area-inset-right) + 1.25rem)",
      }}
      className="fixed z-40 grid h-14 w-14 place-items-center rounded-full bg-[var(--store-success)] text-inverse shadow-lg transition-transform hover:scale-110"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
