import { useState, useMemo, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Kanban,
  Boxes,
  ChevronRight,
  LogOut,
  Menu,
  Package,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  Search,
  Settings,
  ShoppingCart,
  Activity,
  Users,
  UserRound,
  GraduationCap,
  Beaker,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth, ROLE_LABEL, type AppRole } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationsBell } from "@/components/NotificationsBell";
import { EllaFab } from "@/components/EllaFab";

type NavItem = {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
  section: "Visão geral" | "Operação" | "Financeiro" | "Administração";
  roles?: AppRole[];
};

const NAV: NavItem[] = [
  {
    to: "/dashboard",
    label: "Dashboard",
    description: "Indicadores do negócio",
    icon: LayoutDashboard,
    section: "Visão geral",
  },
  {
    to: "/clients",
    label: "Clientes",
    description: "Cadastro e relacionamento",
    icon: Users,
    section: "Operação",
    roles: ["administrador", "atendente"],
  },
  {
    to: "/quotes",
    label: "Orçamentos",
    description: "Propostas comerciais",
    icon: FileText,
    section: "Operação",
    roles: ["administrador", "atendente"],
  },
  {
    to: "/orders",
    label: "Ordens de Serviço",
    description: "Pedidos e prazos",
    icon: ClipboardList,
    section: "Operação",
    roles: ["administrador", "atendente", "producao", "financeiro"],
  },
  {
    to: "/production",
    label: "Produção",
    description: "Etapas e responsáveis",
    icon: Kanban,
    section: "Operação",
    roles: ["administrador", "atendente", "producao"],
  },
  {
    to: "/inventory",
    label: "Estoque",
    description: "Entradas, saidas e minimo",
    icon: Boxes,
    section: "Operação",
    roles: ["administrador", "atendente", "producao", "financeiro"],
  },
  {
    to: "/pdv",
    label: "Caixa / PDV",
    description: "Venda rápida e saldo do dia",
    icon: ShoppingCart,
    section: "Financeiro",
    roles: ["administrador", "financeiro", "vendedor"],
  },
  {
    to: "/receivables",
    label: "Contas a Receber",
    description: "Cobranças e vencimentos",
    icon: Receipt,
    section: "Financeiro",
    roles: ["administrador", "financeiro", "atendente"],
  },
  {
    to: "/closures",
    label: "Fechamentos de Caixa",
    description: "Histórico de fechamentos",
    icon: Receipt,
    section: "Financeiro",
    roles: ["administrador", "financeiro"],
  },
  {
    to: "/services",
    label: "Serviços",
    description: "Catálogo e preços",
    icon: Package,
    section: "Administração",
    roles: ["administrador", "atendente"],
  },
  {
    to: "/catalog-admin",
    label: "Produtos da loja",
    description: "Cadastrar fotos, preços e descrições",
    icon: Package,
    section: "Administração",
    roles: ["administrador"],
  },
  {
    to: "/brand",
    label: "Identidade da marca",
    description: "Nome, logotipo, cores e contato",
    icon: Palette,
    section: "Administração",
    roles: ["administrador"],
  },
  {
    to: "/settings",
    label: "Configurações",
    description: "Empresa e preferências",
    icon: Settings,
    section: "Administração",
    roles: ["administrador"],
  },
  {
    to: "/users",
    label: "Usuários",
    description: "Gerenciar cargos e acessos",
    icon: Users,
    section: "Administração",
    roles: ["administrador"],
  },
  {
    to: "/ella",
    label: "Gestor Inteligente",
    description: "Automação e consultas de gestão",
    icon: LayoutDashboard,
    section: "Administração",
    roles: ["administrador"],
  },
  {
    to: "/ella-training",
    label: "Treinar a IA",
    description: "Base de conhecimento e regras do gestor",
    icon: GraduationCap,
    section: "Administração",
    roles: ["administrador"],
  },
  {
    to: "/ella-sandbox",
    label: "Sandbox da IA",
    description: "Testar respostas e ver treinamento aplicado",
    icon: Beaker,
    section: "Administração",
    roles: ["administrador"],
  },
  {
    to: "/ai-logs",
    label: "Logs de Automação",
    description: "Histórico de chamadas e processamento",
    icon: Activity,
    section: "Administração",
    roles: ["administrador"],
  },
];

const SECTIONS: NavItem["section"][] = ["Visão geral", "Operação", "Financeiro", "Administração"];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, roles, signOut, isAdmin } = useAuth();
  const path = useRouterState({ select: (state) => state.location.pathname });
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("alcateia_sidebar_collapsed");
    return saved ? saved === "1" : false;
  });
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  // The mobile drawer always shows labels, even when the desktop sidebar is collapsed.
  const compact = collapsed && !open;

  const items = useMemo(() => {
    return NAV.filter((item) => {
      if (!item.roles) return true;
      if (isAdmin) return true;
      return roles.some((role) => item.roles?.includes(role));
    });
  }, [isAdmin, roles]);

  const results = search.trim()
    ? items.filter((item) =>
        `${item.label} ${item.description}`
          .toLocaleLowerCase("pt-BR")
          .includes(search.toLocaleLowerCase("pt-BR")),
      )
    : [];

  const title = currentTitle(path);
  const userInitial = user?.email?.charAt(0).toUpperCase() ?? "A";
  const avatarUrl = String(user?.user_metadata?.avatar_url ?? "");
  const displayName = String(user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email?.split("@")[0] ?? "Meu perfil");

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col overflow-hidden border-r border-[#293451]/20 bg-[#0B1026] text-[#AAB6D1] transition-[width,transform] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
          collapsed ? "w-72 md:w-20" : "w-72 md:w-64 lg:w-[17.5rem]",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className={cn("flex flex-col py-5", compact ? "items-center px-0" : "px-3")}>
          <div
            className={cn(
              "flex w-full items-center px-3 mb-6",
              compact ? "justify-center" : "justify-between",
            )}
          >
            <div
              className={cn(
                "flex items-center transition-all duration-500",
                compact ? "justify-center" : "gap-3",
              )}
            >
              <img
                src="/brand/decode-logo.png"
                alt="Decode Analytics"
                className={cn(
                  "brand-logo shrink-0 rounded-md bg-black p-1 object-contain transition-all duration-300",
                  compact ? "h-11 w-11" : "h-9 w-auto max-w-32",
                )}
              />
              {!compact && (
                <div className="flex flex-col leading-none animate-in fade-in duration-500">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F8FAFC]">
                    Decode Analytics
                  </span>
                  <span className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-[#AAB6D1]">
                    Design & Soluções
                  </span>
                </div>
              )}
            </div>
            {!compact && (
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-lg text-[#AAB6D1] transition-colors hover:bg-white/5 hover:text-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] md:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div
            className={cn(
              "relative w-full px-2",
              compact && "flex justify-center",
            )}
          >
            <div
              className={cn(
                "group relative flex h-10 items-center rounded-lg bg-[#080C1F] transition-all focus-within:bg-[#080C1F]/80 border border-[#293451]/30",
                compact ? "w-11 justify-center px-0" : "w-full px-3",
              )}
              title={compact ? "Expandir menu para buscar" : undefined}
            >
              {compact ? (
                <button
                  type="button"
                  aria-label="Expandir menu para buscar"
                  title="Expandir menu para buscar"
                  onClick={() => {
                    localStorage.setItem("alcateia_sidebar_collapsed", "0");
                    setCollapsed(false);
                  }}
                  className="grid h-10 w-10 place-items-center rounded-lg text-[#AAB6D1] transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
                >
                  <Search className="h-4 w-4" />
                </button>
              ) : (
                <Search className="h-4 w-4 shrink-0 text-[#AAB6D1]/70 transition-colors group-focus-within:text-[#22D3EE]" />
              )}
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                className={cn(
                  "ml-2 flex-1 bg-transparent text-xs text-white placeholder:text-[#AAB6D1] focus:outline-hidden",
                  compact && "hidden",
                )}
              />
              {searchFocused && results.length > 0 && !compact && (
                <div className="absolute top-full right-0 left-0 z-50 mt-2 max-h-60 overflow-y-auto rounded-xl border border-[#293451]/30 bg-[#080C1F] p-1 shadow-2xl backdrop-blur-xl">
                  {results.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => {
                        setSearch("");
                        setOpen(false);
                      }}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-[#AAB6D1] hover:bg-[#0B1026] hover:text-[#F8FAFC] transition-colors"
                    >
                      <item.icon className="h-3.5 w-3.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium">{item.label}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <nav className="app-scrollbar flex-1 space-y-5 overflow-y-auto px-3 py-3">
          {SECTIONS.map((section, sectionIndex) => {
            const sectionItems = items.filter((item) => item.section === section);
            if (!sectionItems.length) return null;
            return (
              <div key={section} className={cn("flex flex-col", compact && "items-center")}>
                {compact && sectionIndex > 0 && (
                  <div aria-hidden="true" className="my-1 h-px w-7 bg-white/10" />
                )}
                {!compact && (
                  <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">
                    {section}
                  </p>
                )}
                <div className={cn("flex w-full flex-col gap-1", compact && "items-center")}>
                  {sectionItems.map((item) => {
                    const active =
                      path === item.to || (item.to !== "/dashboard" && path.startsWith(item.to));
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setOpen(false)}
                        title={compact ? item.label : undefined}
                        aria-label={item.label}
                        className={cn(
                          "group relative flex items-center rounded-xl transition-all duration-300",
                          active
                            ? "border border-[#22D3EE]/20 bg-[#111A38] font-semibold text-white shadow-sm shadow-black/20"
                            : "border border-transparent text-[#D5DEEF] hover:bg-white/5 hover:text-white",
                          compact
                            ? "h-11 w-11 justify-center px-0"
                            : "min-h-11 w-full gap-3 px-3 py-2.5 justify-start",
                        )}
                      >
                        <Icon
                          className={cn(
                            "shrink-0 transition-transform duration-300",
                            active
                              ? "scale-105 text-[#22D3EE]"
                              : "text-[#AAB6D1] group-hover:text-[#F8FAFC]",
                            "h-5 w-5",
                          )}
                        />
                        {!compact && (
                          <>
                            <span className="flex-1 truncate">{item.label}</span>
                            {active && <ChevronRight className="h-4 w-4 shrink-0 text-[#22D3EE]" />}
                          </>
                        )}
                        {active && compact && (
                          <div className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1 h-3 rounded-l-full bg-[#087CF0] shadow-[0_0_8px_rgba(8,124,240,0.5)]" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className={cn("px-3 pb-3", compact && "px-0 flex justify-center")}>
          <Link to="/profile" title={compact ? "Meu perfil" : undefined} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-xl border border-[#293451]/30 bg-[#080C1F] p-2 text-[#F8FAFC] transition-colors hover:bg-[#111936]", compact && "h-12 w-12 justify-center p-1")}>
            <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[#087CF0]/20 text-sm font-bold text-[#087CF0]">
              {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : <UserRound className="h-5 w-5" />}
            </div>
            {!compact && <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{displayName}</p><p className="text-[10px] text-[#AAB6D1]">Meu perfil · Editar dados</p></div>}
          </Link>
        </div>

        <div
          className={cn(
            "mt-auto border-t border-[#293451]/20 bg-[#080C1F]/50 p-3 flex flex-col",
            compact && "items-center",
          )}
        >
          <div className={cn("mb-4 w-full", compact && "flex justify-center")}>
            <div
              className={cn(
                "flex items-center rounded-xl bg-[#080C1F] ring-1 ring-[#293451]/20 transition-all duration-300",
                compact ? "h-12 w-12 justify-center" : "min-h-12 w-full gap-3 p-2",
              )}
              title={compact ? (isAdmin ? "Administrador" : "Usuário") : undefined}
            >
              <div
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-lg bg-[#087CF0]/20 text-[10px] font-black text-[#087CF0] transition-all duration-300",
                  compact ? "h-10 w-10" : "h-8 w-8",
                )}
              >
                {isAdmin ? "AD" : roles[0]?.substring(0, 2).toUpperCase() || "US"}
              </div>
              {!compact && (
                <div className="flex flex-col min-w-0 animate-in fade-in duration-500">
                  <span className="text-[10px] font-bold text-[#F8FAFC] truncate uppercase tracking-wider">
                    {user?.email?.split("@")[0]}
                  </span>
                  <span className="text-[9px] font-medium text-[#AAB6D1] uppercase tracking-tighter">
                    {isAdmin ? "Administrador" : ROLE_LABEL[roles[0]] || "Usuário"}
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setCollapsed((value) => {
                const newValue = !value;
                localStorage.setItem("alcateia_sidebar_collapsed", newValue ? "1" : "0");
                return newValue;
              })
            }
            className={cn(
              "group hidden items-center rounded-xl text-xs text-[#F8FAFC] transition-all hover:bg-[#080C1F] hover:text-white md:flex",
              compact ? "h-11 w-11 justify-center mx-auto" : "min-h-11 w-full gap-3 px-3 py-2.5",
            )}
            aria-label={compact ? "Expandir menu" : "Recolher menu"}
            aria-expanded={!collapsed}
            title={compact ? "Expandir menu" : undefined}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4 shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">Recolher menu</span>
              </>
            )}
          </button>

          <button
            onClick={() => signOut()}
            className={cn(
              "group mt-1 flex items-center rounded-xl text-xs text-rose-400 transition-all hover:bg-rose-500/10 hover:text-rose-300",
              compact ? "h-11 w-11 justify-center mx-auto" : "min-h-11 w-full gap-3 px-3 py-2.5",
            )}
            title={compact ? "Sair" : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!compact && <span className="flex-1 truncate">Sair</span>}
          </button>
        </div>
      </aside>

      <div
        className={cn(
          "flex flex-col transition-[padding] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
          collapsed ? "md:pl-20" : "md:pl-64 lg:pl-[17.5rem]",
        )}
      >
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/90 text-foreground backdrop-blur-md">
          <div className="flex h-full items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setOpen(true)}
                aria-label="Abrir menu"
                className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-muted md:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-foreground md:text-base">
                  {title}
                </h1>
                <div className="hidden items-center gap-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider md:flex">
                  <span className="h-1 w-1 rounded-full bg-[#22D3EE]" />
                  Decode Analytics
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <ThemeToggle />
              <NotificationsBell />
              <div className="mx-1 h-4 w-px bg-border md:mx-2" />
              <div className="flex items-center gap-2 md:gap-3">
                <div className="hidden text-right md:block">
                  <p className="text-xs font-bold text-foreground truncate max-w-[120px]">
                    {user?.email?.split("@")[0]}
                  </p>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">
                    {isAdmin ? "Administrador" : ROLE_LABEL[roles[0]] || "Usuário"}
                  </p>
                </div>
                <Link to="/profile" aria-label="Abrir meu perfil" className="grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-[#0B1026] text-sm font-bold text-white shadow-lg shadow-[#0B1026]/10">{avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : userInitial}</Link>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      <EllaFab />

      {open && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function currentTitle(path: string) {
  const item = NAV.find((i) => i.to === path || (i.to !== "/dashboard" && path.startsWith(i.to)));
  return item?.label || "Painel";
}
