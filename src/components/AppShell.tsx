import { useState, useMemo, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
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
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Receipt,
  Search,
  Settings,
  ShoppingCart,
  Activity,
  Users,
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
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("alcateia_sidebar_collapsed");
    return saved ? saved === "1" : false;
  });
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

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

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col overflow-hidden border-r border-[#535d7d]/20 bg-[#0c1e35] text-[#7d84ab] transition-[width,transform] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] md:translate-x-0",
          collapsed ? "w-72 md:w-20" : "w-72 md:w-60",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col gap-6 px-4 py-8">
          <div className="flex items-center justify-between">
            <div className={cn("flex items-center gap-2.5 transition-opacity duration-300", collapsed && "md:opacity-0 md:pointer-events-none")}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ff8100] font-black text-white shadow-md shadow-[#ff8100]/20 text-xs">
                A
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#dee2ec]">
                  Alcateia
                </span>
                <span className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-[#7d84ab]">
                  Produções Gráficas
                </span>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-white/40 hover:bg-white/10 md:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className={cn("relative transition-all duration-300", collapsed && "md:px-0")}>
            <div
              className={cn(
                "group relative flex h-9 items-center rounded-lg bg-[#0b1a2c] px-3 transition-all focus-within:bg-[#0b1a2c]/80 border border-[#535d7d]/30",
                collapsed && "md:h-9 md:w-9 md:px-0 md:justify-center mx-auto",
              )}
            >
              <Search
                className={cn("h-4 w-4 shrink-0 text-[#7d84ab]/50 group-focus-within:text-[#dee2ec] transition-colors", collapsed && "md:h-4 md:w-4")}
              />
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                className={cn(
                  "ml-2 flex-1 bg-transparent text-xs text-[#dee2ec] placeholder:text-[#7d84ab]/50 focus:outline-hidden",
                  collapsed && "md:hidden",
                )}
              />
              {searchFocused && results.length > 0 && (
                <div className="absolute top-full right-0 left-0 z-50 mt-2 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-[#0f172a] p-1 shadow-2xl backdrop-blur-xl">
                  {results.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => {
                        setSearch("");
                        setOpen(false);
                      }}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-white/70 hover:bg-white/5 hover:text-white transition-colors"
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

        <nav className="app-scrollbar flex-1 overflow-y-auto px-3 py-2 space-y-8">
          {SECTIONS.map((section) => {
            const sectionItems = items.filter((item) => item.section === section);
            if (!sectionItems.length) return null;
            return (
              <div key={section}>
                <p
                  className={cn(
                    "mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[#7d84ab]/60",
                    collapsed && "md:hidden",
                  )}
                >
                  {section}
                </p>
                <div className="space-y-1">
                  {sectionItems.map((item) => {
                    const active =
                      path === item.to || (item.to !== "/dashboard" && path.startsWith(item.to));
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setOpen(false)}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs transition-all duration-300",
                          active
                            ? "bg-[#0b1a2c] text-[#dee2ec] font-bold shadow-lg shadow-black/20"
                            : "text-[#7d84ab] hover:bg-[#0b1a2c]/50 hover:text-[#dee2ec]",
                          collapsed && "md:justify-center md:px-0 md:w-10 md:mx-auto"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0 transition-transform duration-300", active ? "text-[#dee2ec] scale-110" : "text-[#7d84ab]")} />
                        <span className={cn("flex-1 truncate transition-opacity duration-300", collapsed && "md:hidden")}>
                          {item.label}
                        </span>
                        {item.label === "Dashboard" && !collapsed && (
                          <span className="rounded-md bg-rose-500 px-1.5 py-0.5 text-[8px] font-black text-white uppercase animate-pulse">
                            Novo
                          </span>
                        )}
                        {item.label === "Ordens de Serviço" && !collapsed && (
                          <span className="rounded-full bg-blue-500 w-4 h-4 flex items-center justify-center text-[8px] font-black text-white">
                            3
                          </span>
                        )}
                        {active && !collapsed && (
                          <ChevronRight className="h-3 w-3 text-[#dee2ec]/40" />
                        )}
                        {active && collapsed && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-brand-yellow hidden md:block" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-[#535d7d]/20 bg-[#0b1a2c]/50 p-4">
          <div className={cn("mb-4 px-2 transition-opacity duration-300", collapsed && "md:opacity-0 md:hidden")}>
            <div className="flex items-center gap-3 rounded-xl bg-[#0b1a2c] p-2 ring-1 ring-[#535d7d]/20">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff8100]/20 text-[10px] font-black text-[#ff8100]">
                {isAdmin ? "AD" : roles[0]?.substring(0, 2).toUpperCase() || "US"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-[#dee2ec] truncate uppercase tracking-wider">
                  {user?.email?.split("@")[0]}
                </span>
                <span className="text-[9px] font-medium text-[#7d84ab] uppercase tracking-tighter">
                  {isAdmin ? "Administrador" : ROLE_LABEL[roles[0]] || "Usuário"}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              setCollapsed((value) => {
                localStorage.setItem("alcateia_sidebar_collapsed", !value ? "1" : "0");
                return !value;
              })
            }
            className={cn(
              "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-[#7d84ab] transition-all hover:bg-[#0b1a2c] hover:text-[#dee2ec]",
              collapsed && "md:justify-center md:px-0 md:w-10 md:mx-auto"
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4 shrink-0" />
            ) : (
              <PanelLeftClose className="h-4 w-4 shrink-0" />
            )}
            <span className={cn("flex-1 truncate transition-opacity duration-300", collapsed && "md:hidden")}>
              Recolher menu
            </span>
          </button>
          <button
            onClick={() => signOut()}
            className={cn(
              "group mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-rose-500/50 transition-all hover:bg-rose-500/10 hover:text-rose-400",
              collapsed && "md:justify-center md:px-0 md:w-10 md:mx-auto"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className={cn("flex-1 truncate transition-opacity duration-300", collapsed && "md:hidden")}>Sair</span>
          </button>
        </div>
      </aside>

      <div
        className={cn(
          "flex flex-col transition-[padding] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
          collapsed ? "md:pl-20" : "md:pl-60",
        )}
      >
        <header className="sticky top-0 z-30 h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <div className="flex h-full items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setOpen(true)}
                className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 md:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-slate-900 md:text-base">
                  {title}
                </h1>
                <div className="hidden items-center gap-2 text-[10px] font-medium text-slate-500 uppercase tracking-wider md:flex">
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  Alcateia Produções Gráficas
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <ThemeToggle />
              <NotificationsBell />
              <div className="mx-1 h-4 w-px bg-slate-200 md:mx-2" />
              <div className="flex items-center gap-2 md:gap-3">
                <div className="hidden text-right md:block">
                  <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                    {user?.email?.split("@")[0]}
                  </p>
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tighter">
                    {isAdmin ? "Administrador" : ROLE_LABEL[roles[0]] || "Usuário"}
                  </p>
                </div>
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#0b4a3a] text-sm font-bold text-white shadow-lg shadow-emerald-900/10">
                  {userInitial}
                </div>
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
        <div
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
