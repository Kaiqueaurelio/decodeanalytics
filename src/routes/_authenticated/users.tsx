import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({ meta: [{ title: "Usuários — Decode Analytics" }] }),
  component: UsersPage,
});

const ROLES = [
  { value: "administrador", label: "Administrador" },
  { value: "atendente", label: "Atendente" },
  { value: "producao", label: "Produção" },
  { value: "financeiro", label: "Financeiro" },
  { value: "none", label: "Sem acesso" },
] as const;
type Role = (typeof ROLES)[number]["value"];

interface Row {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
}

function UsersPage() {
  const { isAdmin, user } = useAuth();
  const qc = useQueryClient();

  const {
    data: rows,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin-users-list"],
    staleTime: 0,
    enabled: isAdmin,
    queryFn: async (): Promise<Row[]> => {
      const [{ data, error }, { data: roleRows, error: roleError }] = await Promise.all([
        supabase.from("profiles").select("id,full_name,email").order("created_at"),
        supabase.from("user_roles").select("user_id,role"),
      ]);
      if (error) throw error;
      if (roleError) throw roleError;
      return (data ?? []).map((profile) => {
        const role = roleRows?.find((r) => r.user_id === profile.id)?.role;
        return {
          id: profile.id,
          name: profile.full_name?.trim() || "—",
          email: profile.email || "—",
          role: (role ?? "none") as Role,
          isActive: Boolean(role),
        };
      });
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-users-list"] });

  const setRole = useMutation({
    mutationFn: async ({ row, role }: { row: Row; role: Role }) => {
      if (row.id === user?.id)
        throw new Error("Não é permitido alterar o próprio acesso por esta tela.");
      const { error: delError } = await supabase.from("user_roles").delete().eq("user_id", row.id);
      if (delError) throw delError;
      if (role !== "none") {
        const { error } = await supabase.from("user_roles").insert({ user_id: row.id, role });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      refresh();
      toast.success("Cargo atualizado.");
    },
    onError: (error) => toast.error(error.message || "Não foi possível alterar o cargo."),
  });

  const revoke = useMutation({
    mutationFn: async (row: Row) => {
      if (row.id === user?.id) throw new Error("Não é permitido remover o próprio acesso.");
      const { error } = await supabase.from("user_roles").delete().eq("user_id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      refresh();
      toast.success("Acesso removido.");
    },
    onError: (error) => toast.error(error.message || "Não foi possível remover o acesso."),
  });

  if (!isAdmin) {
    return (
      <Card className="mx-auto mt-8 max-w-xl p-8 text-center">
        <ShieldAlert aria-hidden="true" className="mx-auto mb-4 h-10 w-10 text-primary" />
        <h2 className="text-xl font-bold">Acesso restrito</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Apenas administradores podem gerenciar usuários.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Usuários e permissões</h2>
        <p className="text-sm text-muted-foreground">
          Defina o cargo de cada pessoa ou remova o acesso ao sistema.
        </p>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b bg-muted/50 font-medium text-muted-foreground">
              <tr>
                <th className="p-4">Nome</th>
                <th className="p-4">E-mail</th>
                <th className="p-4">Cargo</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <p className="text-sm text-destructive">
                      Não foi possível carregar os usuários e suas permissões.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      disabled={isFetching}
                      onClick={() => void refetch()}
                    >
                      {isFetching ? "Tentando novamente..." : "Tentar novamente"}
                    </Button>
                  </td>
                </tr>
              ) : rows?.length ? (
                rows.map((row) => {
                  const self = row.id === user?.id;
                  return (
                    <tr key={row.id} className="hover:bg-muted/30">
                      <td className="p-4"><input type="checkbox" aria-label={"Selecionar " + row.email} checked={selected.includes(row.id)} disabled={row.id === user?.id || deleteUsers.isPending} onChange={(e) => setSelected((prev) => e.target.checked ? [...prev, row.id] : prev.filter((id) => id !== row.id))} /></td>
                      <td className="p-4 font-medium">
                        {row.name}
                        {self && <span className="ml-2 text-xs text-muted-foreground">(você)</span>}
                      </td>
                      <td className="p-4 text-muted-foreground">{row.email}</td>
                      <td className="p-4">
                        <select
                          aria-label={`Cargo de ${row.email}`}
                          className="h-10 rounded-md border bg-background px-3 text-sm"
                          value={row.role}
                          disabled={self || setRole.isPending || revoke.isPending}
                          onChange={(e) => setRole.mutate({ row, role: e.target.value as Role })}
                        >
                          {ROLES.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4">
                        <span className={row.isActive ? "text-emerald-600" : "text-amber-600"}>
                          {row.isActive ? "Ativo" : "Desativado"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={self || !row.isActive || revoke.isPending || setRole.isPending}
                          onClick={() => {
                            if (confirm(`Remover o acesso de ${row.email}?`)) revoke.mutate(row);
                          }}
                        >
                          <Trash2 className="mr-1 h-4 w-4" /> Revogar acesso
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Nenhum usuário.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-xs text-muted-foreground">
        Por segurança, a conta conectada não pode alterar nem remover o próprio acesso. O banco
        também impede a remoção do último administrador ativo.
      </p>
    </div>
  );
}
