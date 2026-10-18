import type { CSSProperties, ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
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
  CheckCircle,
} from "lucide-react";
import { STORE_CATEGORIES } from "./tokens";

const SOLUTION_CATEGORIES = STORE_CATEGORIES.filter(({ slug }) =>
  ["Manutenção de Computadores", "Social Media", "Design Gráfico", "Programação"].includes(slug),
);
import { useCompanyInfo, useWaLink } from "@/hooks/useCompanyInfo";
import { useCart } from "@/lib/cart-context";
import { useEffect, useState } from "react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";

export function StoreShell({ children }: { children: ReactNode }) {
  const info = useCompanyInfo();
  return (
    <div
      className="storefront-dark min-h-dvh bg-[var(--store-bg)] text-slate-100"
      style={{ fontFamily: "var(--store-font)", "--store-bg": info.brandBackground, "--store-primary": info.brandSecondary, "--store-primary-light": info.brandPrimary, "--store-secondary": info.brandPrimary, "--store-accent": info.brandAccent } as CSSProperties}
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
      className="relative flex items-center gap-1.5 rounded-lg bg-[var(--store-primary)] px-3 py-2 text-sm font-bold text-white hover:bg-[var(--store-primary-light)]"
    >
      <ShoppingCart className="h-4 w-4" />
      Carrinho
      <span className="ml-1 rounded-full bg-[var(--store-secondary)] px-1.5 text-[10px] font-extrabold text-[var(--store-primary-dark)]">
        {count}
      </span>
    </Link>
  );
}

function CartCountBadge() {
  const { count } = useCart();
  return (
    <span className="ml-auto rounded-full bg-[var(--store-primary)] px-2 py-0.5 text-[10px] font-extrabold text-white">
      {count}
    </span>
  );
}

function TopPromoBar() {
  return (
    <div className="safe-area-top bg-[var(--store-secondary)] text-[var(--store-primary-dark)]">
      <div className="mx-auto flex min-h-9 max-w-[1280px] items-center justify-center gap-1 px-3 py-1.5 text-center text-[11px] font-semibold leading-tight sm:min-h-10 sm:gap-2 sm:px-4 sm:py-2 sm:text-[13px] md:text-sm">
        <Tag className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0 break-words">
          Código de boas-vindas:{" "}
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
  const { count } = useCart();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const menuCategories = pathname === "/" ? SOLUTION_CATEGORIES : STORE_CATEGORIES;
  return (
    <header className="store-sticky-header sticky z-40 border-b border-[var(--store-border)] bg-[var(--store-surface)]/95 backdrop-blur transition-all duration-300">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-3 py-2 sm:px-4 sm:py-3 md:gap-6 md:py-4">
        <Link
          to="/"
          aria-label="Logo Decode Analytics"
          className="flex shrink-0 items-center gap-2 sm:gap-3 transition-transform hover:scale-[1.02]"
        >
          <img
            src={info.logoUrl || "/brand/decode-logo.png"}
            alt={info.name}
            className="h-10 w-auto brand-logo rounded-md bg-black p-1 object-contain sm:h-12 md:h-14"
          />
          <div className="leading-tight hidden sm:block">
            <div
              className="font-display text-lg sm:text-2xl leading-none text-[#22D3EE]"
              style={{ letterSpacing: "0.04em" }}
            >
              {info.name.toUpperCase()}
            </div>
            <div className="text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[#A78BFA]">
              Design & Soluções
            </div>
          </div>
        </Link>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            window.location.href = `/produtos?q=${encodeURIComponent(q)}`;
          }}
          className="relative hidden flex-1 max-w-2xl lg:block"
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
            className="h-10 w-full min-w-0 rounded-[var(--store-radius-lg)] border border-[var(--store-border)] bg-white pl-10 pr-20 text-base sm:h-11 sm:pl-12 sm:pr-28 outline-none transition-all placeholder:text-[var(--store-text-light)] focus:border-[var(--store-primary-light)] focus:ring-4 focus:ring-[var(--store-primary-light)]/15"
          />
          <button
            type="submit"
            className="absolute right-1 top-1/2 inline-flex h-8 -translate-y-1/2 items-center justify-center rounded-[var(--store-radius-md)] bg-[var(--store-primary)] px-3 text-[10px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-[var(--store-primary-light)] md:px-4 md:text-sm"
          >
            Buscar
          </button>
        </form>

        <nav className="hidden items-center gap-1 md:flex">
          <a
            href={waLink("Olá! Vim do site da Decode Analytics.")}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-100 hover:bg-white/10"
          >
            <MessageCircle className="h-4 w-4 text-[var(--store-success)]" />
            Atendimento
          </a>
          <Link
            to="/auth"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[var(--store-text)] hover:bg-[var(--store-surface-soft)]"
          >
            <User className="h-4 w-4" />
            Entrar
          </Link>
          <Link to="/orcamento" className="rounded-lg border border-[#22D3EE]/30 px-3 py-2 text-sm font-bold text-[#22D3EE] hover:bg-[#22D3EE]/10">Orçamento</Link>
          <CartButton />
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/carrinho"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--store-border)] bg-white md:hidden hover:bg-[var(--store-surface-soft)]"
          >
            <ShoppingCart className="h-5 w-5 text-[var(--store-primary)]" />
            <span className="absolute -right-1 -top-1 rounded-full bg-[var(--store-secondary)] px-1.5 text-[9px] font-extrabold text-[var(--store-primary-dark)] shadow-sm">
              {count}
            </span>
          </Link>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Menu"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[var(--store-border)] bg-white md:hidden transition-colors hover:bg-[var(--store-surface-soft)]"
              >
                <Menu className="h-5 w-5 text-[var(--store-primary)]" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="!w-[85%] sm:!w-80 !bg-[#0B1026] !text-white p-0 flex flex-col [&>button.absolute]:hidden" style={{ backgroundColor: "#0B1026", color: "#F8FAFC", opacity: 1, zIndex: 60 }}
            >
              <div className="flex items-center justify-between border-b border-white/10 bg-[#0B1026] px-6 py-5 text-white">
                <div className="flex items-center gap-3">
                  <img
                    src={info.logoUrl || "/brand/decode-logo.png"}
                    alt={info.name}
                    className="h-10 w-auto brand-logo rounded-md bg-black p-1 object-contain"
                  />
                  <div className="leading-tight">
                    <div className="text-sm font-extrabold text-cyan-300">
                      {info.name}
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-violet-300">
                      Design & Soluções
                    </div>
                  </div>
                </div>
                <SheetClose className="rounded-lg p-2 text-slate-100 hover:bg-white/10">
                  <X className="h-5 w-5 text-slate-100" />
                </SheetClose>
              </div>

              <nav className="flex-1 overflow-y-auto bg-[#0B1026] py-2 text-white" style={{ color: "#F8FAFC", backgroundColor: "#0B1026" }}>
                {/* Categorias */}
                <div className="border-b border-white/10 bg-[#0B1026] px-6 py-4 text-white">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-300 mb-3">
                    {pathname === "/" ? "Soluções" : "Categorias"}
                  </h3>
                  <div className="space-y-2">
                    <Link to="/produtos" onClick={() => setMobileMenuOpen(false)} className="block rounded-lg bg-[var(--store-primary)] px-3 py-2 text-sm font-bold text-white transition hover:bg-[var(--store-primary-light)]">Ver catálogo completo</Link>
                    <Link to="/orcamento" onClick={() => setMobileMenuOpen(false)} className="block rounded-lg border border-[#22D3EE]/30 px-3 py-2 text-sm font-bold text-[#22D3EE] transition hover:bg-white/10">Solicitar orçamento</Link>
                    {menuCategories.map((c) => (
                      <Link
                        key={c.slug}
                        to="/produtos"
                        search={{ cat: c.slug }}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-100 hover:bg-white/10 transition-colors"
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="border-b border-white/10 bg-[#0B1026] px-6 py-4 text-slate-100">
                  <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                    Minha Conta
                  </h3>
                  <div className="space-y-2">
                    <Link
                      to="/auth"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-100 transition-colors hover:bg-white/10"
                    >
                      <User className="h-4 w-4 text-[var(--store-primary)]" />
                      Entrar na conta
                    </Link>
                    <Link
                      to="/carrinho"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-100 transition-colors hover:bg-white/10"
                    >
                      <ShoppingCart className="h-4 w-4 text-cyan-300" />
                      Carrinho
                      <CartCountBadge />
                    </Link>
                  </div>
                </div>

                <div className="bg-[#0B1026] px-6 py-4 text-white">
                  <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                    Atendimento
                  </h3>
                  <a
                    href={waLink("Olá! Vim do site da Decode Analytics.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-3 text-sm font-medium text-slate-100 transition-colors hover:bg-white/10"
                  >
                    <MessageCircle className="h-4 w-4 text-[var(--store-success)]" />
                    <div>
                      <div className="font-semibold text-emerald-300">WhatsApp</div>
                      <div className="text-xs text-slate-300">
                        {info.whatsappDisplay}
                      </div>
                    </div>
                  </a>
                </div>
              </nav>

              {/* Footer do menu */}
              <div className="border-t border-white/10 bg-[#080C1F] px-6 py-4 text-slate-100">
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  Soluções digitais, design e tecnologia pensadas para fazer seu negócio avançar.
                </p>
                <div className="flex gap-2">
                  <a
                    href={info.instagramUrl ?? "#"}
                    target={info.instagramUrl ? "_blank" : undefined}
                    rel={info.instagramUrl ? "noopener noreferrer" : undefined}
                    aria-label="Instagram"
                    className="grid h-11 w-11 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-100 transition-colors hover:bg-white/10 hover:text-cyan-300"
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                  <a
                    href="#"
                    aria-label="Facebook"
                    className="grid h-11 w-11 place-items-center rounded-lg bg-white hover:bg-[var(--store-primary)] hover:text-white transition-colors"
                  >
                    <Facebook className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          window.location.href = `/produtos?q=${encodeURIComponent(q)}`;
        }}
        className="border-t border-white/10 px-3 py-3 md:hidden"
        role="search"
      >
        <label htmlFor="store-search-mobile" className="sr-only">
          Buscar produtos e serviços
        </label>
        <div className="relative mx-auto flex max-w-[1280px] items-center">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 h-4 w-4 text-slate-500" />
          <input
            id="store-search-mobile"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar produtos e serviços"
            className="h-11 w-full rounded-xl border border-white/15 bg-white pl-10 pr-24 text-base text-slate-900 outline-none placeholder:text-slate-500 focus:border-[#22D3EE] focus:ring-4 focus:ring-[#22D3EE]/20"
          />
          <button
            type="submit"
            className="absolute right-1 inline-flex h-9 items-center justify-center rounded-lg bg-[#087CF0] px-4 text-xs font-extrabold text-white transition hover:bg-[#075BB5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22D3EE]"
          >
            Buscar
          </button>
        </div>
      </form>
    </header>
  );
}

function CategoryNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (pathname === "/") {
    return (
      <nav aria-label="Navegação principal" className="hidden border-b border-white/10 bg-[#080C1F] md:block">
        <div className="mx-auto flex max-w-[1280px] items-center gap-2 px-4 py-2">
          <a href="#solucoes" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">Soluções</a>
          <a href="#como-funciona" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">Como funciona</a>
          <Link to="/produtos" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">Catálogo</Link>
          <a href="#contato" className="ml-auto rounded-full px-4 py-2 text-sm font-semibold text-[#22D3EE] transition hover:bg-white/10">Fale com a Decode <span aria-hidden="true">↗</span></a>
        </div>
      </nav>
    );
  }
  return (
    <nav aria-label="Categorias" className="hidden border-b border-[var(--store-border)] bg-[var(--store-surface)] md:block">
      <div className="mx-auto flex max-w-[1280px] gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STORE_CATEGORIES.map((c) => (
          <Link key={c.slug} to="/produtos" search={{ cat: c.slug }} className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-[var(--store-text-muted)] transition-colors hover:bg-[var(--store-surface-soft)] hover:text-[var(--store-primary)]" activeProps={{ className: "shrink-0 rounded-full bg-[var(--store-primary)] px-4 py-2 text-sm font-semibold text-white" }}>
            {c.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function BusinessStatus() {
  const [open, setOpen] = useState<boolean | null>(null);
  useEffect(() => {
    const update = () => {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Sao_Paulo",
        weekday: "long",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).formatToParts(new Date());
      const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
      const day = values.weekday;
      const minute = Number(values.hour) * 60 + Number(values.minute);
      const start = day === "Saturday" ? 9 * 60 : day === "Sunday" ? 24 * 60 : 8 * 60;
      const end = day === "Saturday" ? 16 * 60 : day === "Sunday" ? 0 : 22 * 60;
      setOpen(day !== "Sunday" && minute >= start && minute < end);
    };
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return <div className="mb-2 flex items-center gap-2 text-xs font-bold"><span className={`h-2 w-2 rounded-full ${open ? "bg-emerald-400" : "bg-slate-400"}`} /><span className={open ? "text-emerald-300" : "text-slate-300"}>{open === null ? "Horário de atendimento" : open ? "Aberto agora" : "Fechado agora"}</span><span className="font-normal text-white/50">· horário de Brasília</span></div>;
}

function StoreFooter() {
  const info = useCompanyInfo();
  const waLink = useWaLink();
  return (
    <footer className="mt-16 bg-[var(--store-primary-dark)] text-white">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <img
              src={info.logoUrl || "/brand/decode-logo.png"}
              alt={info.name}
              className="h-16 w-auto brand-logo rounded-md bg-black p-1 object-contain"
            />
            <div>
              <div className="text-lg font-extrabold uppercase">Decode Analytics</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--store-secondary)]">
                Design & Soluções
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Tecnologia, design e presença digital para ajudar sua marca a crescer.
          </p>
          <div className="mt-4 flex gap-2">
            <a
              href={info.instagramUrl ?? "#"}
              target={info.instagramUrl ? "_blank" : undefined}
              rel={info.instagramUrl ? "noopener noreferrer" : undefined}
              aria-label="Instagram"
              className="grid h-11 w-11 place-items-center rounded-lg bg-white/10 transition-colors hover:bg-white/20"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="#"
              aria-label="Facebook"
              className="grid h-11 w-11 place-items-center rounded-lg bg-white/10 transition-colors hover:bg-white/20"
            >
              <Facebook className="h-4 w-4" />
            </a>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--store-secondary)]">
            Soluções
          </h3>
          <ul className="mt-2 text-sm text-white/70">
            {SOLUTION_CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link
                  to="/produtos"
                  search={{ cat: c.slug }}
                  className="inline-flex min-h-11 items-center transition-colors hover:text-white"
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/produtos" className="mt-3 inline-flex min-h-10 items-center text-xs font-bold text-[var(--store-secondary)] hover:text-white">Ver catálogo completo <span aria-hidden="true">↗</span></Link>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--store-secondary)]">
            Atendimento
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-white/70">
            <li className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 shrink-0" />
              <a
                href={waLink("Olá! Vim do site.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center transition-colors hover:text-white"
              >
                WhatsApp {info.whatsappDisplay}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <BusinessStatus />
                {info.hours.map((h) => (
                  <div key={h.day}>
                    <strong className="text-white/90">{h.day}:</strong> {h.time}
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
                className="inline-flex min-h-11 items-center transition-colors hover:text-white"
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
          <ul className="mt-2 text-sm text-white/70">
            <li>
              <Link
                to="/produtos"
                className="inline-flex min-h-11 items-center transition-colors hover:text-white"
              >
                Catálogo completo
              </Link>
            </li>
            <li>
              <Link
                to="/auth"
                className="inline-flex min-h-11 items-center transition-colors hover:text-white"
              >
                Minha conta
              </Link>
            </li>
            <li>
              <a
                href="#"
                className="inline-flex min-h-11 items-center transition-colors hover:text-white"
              >
                Política de privacidade
              </a>
            </li>
            <li>
              <a
                href="#"
                className="inline-flex min-h-11 items-center transition-colors hover:text-white"
              >
                Trocas e devoluções
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-white/50 md:flex-row">
          <p>
            © {new Date().getFullYear()} Decode Analytics. Todos os direitos reservados.
          </p>
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
      className="fixed z-40 grid h-14 w-14 place-items-center rounded-full bg-[var(--store-success)] text-white shadow-lg transition-transform hover:scale-110"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
