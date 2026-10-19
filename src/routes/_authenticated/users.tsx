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
] as const;
type Role = (typeof ROLES)[number]["value"];

interface Row {
  id: string;
  name: string;
  email: string;
  roleId: string | null;
  role: Role | null;
}

function UsersPage() {
  const { isAdmin, user } = useAuth();
  const qc = useQueryClient();

  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin-users-list"],
    staleTime: 0,
    queryFn: async (): Promise<Row[]> => {
      const [p, r] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email").order("created_at"),
        supabase.from("user_roles").select("id, user_id, role"),
      ]);
      if (p.error) throw p.error;
      if (r.error) throw r.error;
      return (p.data ?? []).map((pr) => {
        const ur = r.data?.find((x) => x.user_id === pr.id);
        return {
          id: pr.id,
          name: pr.full_name || "—",
          email: pr.email || "—",
          roleId: ur?.id ?? null,
          role: (ur?.role as Role) ?? null,
        };
      });
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-users-list"] });

  const setRole = useMutation({
    mutationFn: async ({ row, role }: { row: Row; role: Role }) => {
      if (row.roleId) {
        const { error } = await supabase.from("user_roles").update({ role }).eq("id", row.roleId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: row.id, role });
        if (error) throw error;
      }
    },
    onSuccess: () => { refresh(); toast.success("Cargo atualizado."); },
    onError: () => toast.error("Não foi possível alterar o cargo."),
  });

  const revoke = useMutation({
    mutationFn: async (row: Row) => {
      if (!row.roleId) return;
      const { error } = await supabase.from("user_roles").delete().eq("id", row.roleId);
      if (error) throw error;
    },
    onSuccess: () => { refresh(); toast.success("Acesso removido."); },
    onError: () => toast.error("Não foi possível remover o acesso."),
  });

  if (!isAdmin) {
    return (
      <Card className="mx-auto mt-8 max-w-xl p-8 text-center">
        <ShieldAlert aria-hidden="true" className="mx-auto mb-4 h-10 w-10 text-primary" />
        <h2 className="text-xl font-bold">Acesso restrito</h2>
        <p className="mt-2 text-sm text-muted-foreground">Apenas administradores podem gerenciar usuários.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Usuários e permissões</h2>
        <p className="text-sm text-muted-foreground">Defina o cargo de cada pessoa ou remova o acesso ao sistema.</p>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/50 font-medium text-muted-foreground">
              <tr>
                <th className="p-4">Nome</th>
                <th className="p-4">E-mail</th>
                <th className="p-4">Cargo</th>
                <th className="p-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Carregando...</td></tr>
              ) : rows?.length ? (
                rows.map((row) => {
                  const self = row.id === user?.id;
                  return (
                    <tr key={row.id} className="hover:bg-muted/30">
                      <td className="p-4 font-medium">{row.name}{self && <span className="ml-2 text-xs text-muted-foreground">(você)</span>}</td>
                      <td className="p-4 text-muted-foreground">{row.email}</td>
                      <td className="p-4">
                        <select
                          className="h-10 rounded-md border bg-background px-3 text-sm"
                          value={row.role ?? ""}
                          disabled={self || setRole.isPending}
                          onChange={(e) => setRole.mutate({ row, role: e.target.value as Role })}
                        >
                          <option value="" disabled>Sem acesso</option>
                          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          type="button" size="sm" variant="outline"
                          disabled={self || !row.roleId || revoke.isPending}
                          onClick={() => { if (confirm(`Remover o acesso de ${row.email}?`)) revoke.mutate(row); }}
                        >
                          <Trash2 className="mr-1 h-4 w-4" /> Remover acesso
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Nenhum usuário.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
