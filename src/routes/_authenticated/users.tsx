// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ShieldCheck, Users as UsersIcon, Search, Check, X, Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, ROLE_LABEL, type AppRole } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/users")({ component: UsersPage });

const ALL_ROLES: AppRole[] = ["administrador", "atendente", "producao", "financeiro", "vendedor"];

const ROLE_DESCRIPTION: Record<AppRole, string> = {
  administrador: "Acesso total ao sistema, incluindo configurações e usuários.",
  atendente: "Atende clientes, gera orçamentos, abre OS e lança cobranças.",
  producao: "Acompanha o kanban de produção e atualiza o andamento das OS.",
  financeiro: "Caixa/PDV, contas a receber e fechamentos do dia.",
  vendedor: "Opera o PDV para vendas rápidas no balcão.",
};

// Matriz: o que cada papel enxerga na barra lateral
const PERMISSION_MATRIX: { area: string; roles: AppRole[] }[] = [
  { area: "Dashboard", roles: ["administrador", "atendente", "producao", "financeiro", "vendedor"] },
  { area: "Clientes", roles: ["administrador", "atendente"] },
  { area: "Orçamentos", roles: ["administrador", "atendente"] },
  { area: "Ordens de Serviço", roles: ["administrador", "atendente", "producao", "financeiro"] },
  { area: "Produção", roles: ["administrador", "atendente", "producao"] },
  { area: "Caixa / PDV", roles: ["administrador", "financeiro", "vendedor"] },
  { area: "Contas a Receber", roles: ["administrador", "financeiro", "atendente"] },
  { area: "Fechamentos de Caixa", roles: ["administrador", "financeiro"] },
  { area: "Serviços (catálogo)", roles: ["administrador", "atendente"] },
  { area: "Configurações", roles: ["administrador"] },
  { area: "Usuários e papéis", roles: ["administrador"] },
  { area: "Ella (assistente IA)", roles: ["administrador"] },
];

function UsersPage() {
  const { isAdmin, user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const profilesQ = useQuery({
    queryKey: ["admin", "profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: isAdmin,
  });

  const rolesQ = useQuery({
    queryKey: ["admin", "user_roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw error;
      return data ?? [];
    },
    enabled: isAdmin,
  });

  const byUser = useMemo(() => {
    const map = new Map<string, Set<AppRole>>();
    (rolesQ.data ?? []).forEach((r: any) => {
      const set = map.get(r.user_id) ?? new Set<AppRole>();
      set.add(r.role as AppRole);
      map.set(r.user_id, set);
    });
    return map;
  }, [rolesQ.data]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return (profilesQ.data ?? []).filter((p: any) => {
      if (!term) return true;
      return (
        (p.full_name ?? "").toLocaleLowerCase("pt-BR").includes(term) ||
        (p.email ?? "").toLocaleLowerCase("pt-BR").includes(term)
      );
    });
  }, [profilesQ.data, search]);

  async function toggleRole(userId: string, role: AppRole, has: boolean) {
    if (userId === user?.id && role === "administrador" && has) {
      toast.error("Você não pode remover seu próprio acesso de administrador.");
      return;
    }
    if (has) {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
      if (error) return toast.error("Erro ao remover papel: " + error.message);
      toast.success(`${ROLE_LABEL[role]} removido.`);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) return toast.error("Erro ao adicionar papel: " + error.message);
      toast.success(`${ROLE_LABEL[role]} adicionado.`);
    }
    qc.invalidateQueries({ queryKey: ["admin", "user_roles"] });
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card className="rounded-2xl border-amber-200 bg-amber-50 p-6 text-amber-800">
          <p className="font-black">Acesso restrito</p>
          <p className="mt-1 text-sm">
            Apenas administradores podem gerenciar usuários e permissões.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-3 sm:p-6">
      <header className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-blue">
            Administração
          </p>
          <h1 className="text-2xl font-black tracking-tight">Usuários e permissões</h1>
          <p className="mt-1 text-sm text-slate-500">
            Defina o que cada pessoa pode ver e fazer no sistema marcando os papéis abaixo.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 self-start rounded-full bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
          <ShieldCheck className="h-4 w-4" /> Você é administrador
        </span>
      </header>

      {/* Cards de papéis */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {ALL_ROLES.map((role) => (
          <Card key={role} className="rounded-2xl border-slate-200 p-4">
            <p className="text-[11px] font-black uppercase tracking-widest text-brand-blue">
              Papel
            </p>
            <p className="mt-1 text-lg font-black">{ROLE_LABEL[role]}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {ROLE_DESCRIPTION[role]}
            </p>
          </Card>
        ))}
      </section>

      {/* Matriz de permissões */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Info className="h-4 w-4 text-brand-blue" />
          <h2 className="text-base font-black">O que cada papel acessa</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="py-2 pr-3 text-xs font-black uppercase tracking-wider text-slate-500">
                  Área do sistema
                </th>
                {ALL_ROLES.map((r) => (
                  <th key={r} className="px-2 py-2 text-center text-xs font-black uppercase tracking-wider text-slate-500">
                    {ROLE_LABEL[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_MATRIX.map((row) => (
                <tr key={row.area} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 pr-3 font-bold text-slate-700">{row.area}</td>
                  {ALL_ROLES.map((r) => {
                    const has = row.roles.includes(r);
                    return (
                      <td key={r} className="px-2 py-2 text-center">
                        {has ? (
                          <span className="inline-grid h-7 w-7 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                            <Check className="h-4 w-4" />
                          </span>
                        ) : (
                          <span className="inline-grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-slate-400">
                            <X className="h-4 w-4" />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Um usuário pode ter mais de um papel. As permissões somam — quem é Atendente e
          Financeiro vê as duas áreas.
        </p>
      </section>

      {/* Lista de usuários */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-brand-blue" />
            <h2 className="text-base font-black">
              Pessoas com acesso ({profilesQ.data?.length ?? 0})
            </h2>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou e-mail"
              className="h-10 rounded-xl pl-9"
            />
          </div>
        </div>

        {profilesQ.isLoading || rolesQ.isLoading ? (
          <div className="grid place-items-center py-12 text-sm text-slate-500">
            Carregando usuários...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-slate-200 py-12 text-sm text-slate-500">
            Nenhum usuário encontrado.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredUsers.map((p: any) => {
              const userRoles = byUser.get(p.id) ?? new Set<AppRole>();
              const isSelf = p.id === user?.id;
              return (
                <li key={p.id} className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-blue/10 font-black text-brand-blue">
                      {(p.full_name || p.email || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-black">
                        {p.full_name || "Sem nome"}
                        {isSelf && (
                          <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-brand-blue">
                            Você
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-slate-500">{p.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {ALL_ROLES.map((role) => {
                      const has = userRoles.has(role);
                      const disabled = isSelf && role === "administrador" && has;
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => !disabled && toggleRole(p.id, role, has)}
                          disabled={disabled}
                          title={
                            disabled
                              ? "Você não pode remover seu próprio acesso de administrador"
                              : has
                                ? `Clique para remover ${ROLE_LABEL[role]}`
                                : `Clique para adicionar ${ROLE_LABEL[role]}`
                          }
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black transition",
                            has
                              ? "border-brand-blue bg-brand-blue text-white hover:bg-brand-blue-light"
                              : "border-slate-200 bg-white text-slate-500 hover:border-brand-blue hover:text-brand-blue",
                            disabled && "cursor-not-allowed opacity-60",
                          )}
                        >
                          {has ? <Check className="h-3 w-3" /> : <span className="h-3 w-3" />}
                          {ROLE_LABEL[role]}
                        </button>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}