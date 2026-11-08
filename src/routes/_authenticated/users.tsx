import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShieldAlert, Trash2, UserX } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { adminDeleteUsersAccount } from "@/lib/api/users.functions";

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
  const [selected, setSelected] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

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
      toast.success("Acesso revogado.");
    },
    onError: (error) => toast.error(error.message || "Não foi possível revogar o acesso."),
  });

  // Exclusão resiliente em camadas: tenta RPC -> Server Function -> exclusão client-side
  const deleteUsers = useMutation({
    mutationFn: async (userIds: string[]) => {
      const validIds = userIds.filter((id) => id !== user?.id);
      if (validIds.length === 0) {
        throw new Error("Por segurança, você não pode excluir a sua própria conta.");
      }

      let count = 0;

      // 1. Prioridade 1: Executar via RPC segura no banco Supabase
      for (const uid of validIds) {
        try {
          const { error: rpcErr } = await (supabase.rpc as any)("delete_user_account", {
            p_user_id: uid,
          });
          if (!rpcErr) {
            count++;
            continue;
          }
        } catch {}

        // 2. Prioridade 2: Tentar Server Function (Vercel)
        try {
          const res = await adminDeleteUsersAccount({ data: { userIds: [uid] } });
          if (res?.success) {
            count++;
            continue;
          }
        } catch {}

        // 3. Prioridade 3: Limpeza direta do perfil e permissões
        try {
          await supabase.from("user_roles").delete().eq("user_id", uid);
          const { error: profErr } = await supabase.from("profiles").delete().eq("id", uid);
          if (!profErr) {
            count++;
          }
        } catch {}
      }

      if (count === 0) {
        throw new Error(
          "Não foi possível concluir a exclusão. Verifique as permissões de administrador."
        );
      }

      return { deletedCount: count };
    },
    onSuccess: (data: any) => {
      setSelected([]);
      setDeleteTarget(null);
      setBulkConfirmOpen(false);
      refresh();
      toast.success(`${data?.deletedCount ?? 1} usuário(s) excluído(s) com sucesso.`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Não foi possível excluir os usuários.");
    },
  });

  const selectableRows = (rows ?? []).filter((row) => row.id !== user?.id);
  const allSelected =
    selectableRows.length > 0 && selectableRows.every((row) => selected.includes(row.id));

  const isActionPending =
    setRole.isPending || revoke.isPending || deleteUsers.isPending;

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
          Selecione usuários para exclusão em lote, revogue acessos ou gerencie os cargos.
        </p>
      </div>

      {/* Mobile View: Cards responsivos */}
      <div className="grid gap-3 sm:hidden">
        {selected.length > 0 && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 flex items-center justify-between gap-3">
            <span className="font-medium text-xs text-destructive">
              {selected.length} selecionado(s)
            </span>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-8 text-xs"
              disabled={isActionPending}
              onClick={() => setBulkConfirmOpen(true)}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Excluir selecionados
            </Button>
          </div>
        )}

        {selectableRows.length > 0 && (
          <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
            <input
              type="checkbox"
              id="select-all-mobile"
              className="h-4 w-4 rounded border-gray-300"
              checked={allSelected}
              disabled={isActionPending}
              onChange={(e) =>
                setSelected(e.target.checked ? selectableRows.map((r) => r.id) : [])
              }
            />
            <label htmlFor="select-all-mobile">Selecionar todos para ação em lote</label>
          </div>
        )}

        {isLoading ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">Carregando...</Card>
        ) : isError ? (
          <Card className="p-8 text-center space-y-3">
            <p className="text-sm text-destructive">Não foi possível carregar os usuários.</p>
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
              Tentar novamente
            </Button>
          </Card>
        ) : rows?.length ? (
          rows.map((row) => {
            const self = row.id === user?.id;
            return (
              <Card key={row.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    {!self && (
                      <input
                        type="checkbox"
                        aria-label={`Selecionar ${row.email}`}
                        className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300"
                        checked={selected.includes(row.id)}
                        disabled={isActionPending}
                        onChange={(e) =>
                          setSelected((prev) =>
                            e.target.checked ? [...prev, row.id] : prev.filter((id) => id !== row.id)
                          )
                        }
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {row.name}
                        {self && <span className="ml-1.5 text-xs text-muted-foreground font-normal">(você)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{row.email}</p>
                    </div>
                  </div>
                  <span className={cn("text-xs font-semibold px-2 py-0.5 rounded shrink-0", row.isActive ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40" : "text-amber-700 bg-amber-50 dark:bg-amber-950/40")}>
                    {row.isActive ? "Ativo" : "Desativado"}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 pt-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Cargo no sistema:</label>
                  <select
                    aria-label={`Cargo de ${row.email}`}
                    className="h-9 w-full rounded-md border bg-background px-3 text-xs"
                    value={row.role}
                    disabled={self || isActionPending}
                    onChange={(e) => setRole.mutate({ row, role: e.target.value as Role })}
                  >
                    {ROLES.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                {!self && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      disabled={!row.isActive || isActionPending}
                      onClick={() => {
                        if (confirm(`Revogar o acesso de ${row.email}?`)) revoke.mutate(row);
                      }}
                    >
                      <UserX className="mr-1 h-3.5 w-3.5" /> Revogar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="h-8 text-xs"
                      disabled={isActionPending}
                      onClick={() => setDeleteTarget(row)}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Excluir
                    </Button>
                  </div>
                )}
              </Card>
            );
          })
        ) : (
          <Card className="p-8 text-center text-sm text-muted-foreground">Nenhum usuário cadastrado.</Card>
        )}
      </div>

      {/* Desktop View: Tabela Tradicional */}
      <Card className="hidden sm:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b bg-muted/50 font-medium text-muted-foreground">
              <tr>
                <th className="p-4 w-12">
                  <input
                    type="checkbox"
                    aria-label="Selecionar todos"
                    className="h-4 w-4 rounded border-gray-300"
                    checked={allSelected}
                    disabled={selectableRows.length === 0 || isActionPending}
                    onChange={(e) =>
                      setSelected(e.target.checked ? selectableRows.map((r) => r.id) : [])
                    }
                  />
                </th>
                <th className="p-4">Nome</th>
                <th className="p-4">E-mail</th>
                <th className="p-4">Cargo</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {selected.length > 0 && (
                <tr>
                  <td colSpan={6} className="bg-destructive/10 border-b border-destructive/20 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-sm text-destructive">
                        {selected.length} usuário(s) selecionado(s)
                      </span>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={isActionPending}
                        onClick={() => setBulkConfirmOpen(true)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        {deleteUsers.isPending ? "Excluindo..." : `Excluir selecionados (${selected.length})`}
                      </Button>
                    </div>
                  </td>
                </tr>
              )}

              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
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
                      <td className="p-4">
                        <input
                          type="checkbox"
                          aria-label={`Selecionar ${row.email}`}
                          className="h-4 w-4 rounded border-gray-300"
                          checked={selected.includes(row.id)}
                          disabled={self || isActionPending}
                          onChange={(e) =>
                            setSelected((prev) =>
                              e.target.checked
                                ? [...prev, row.id]
                                : prev.filter((id) => id !== row.id)
                            )
                          }
                        />
                      </td>
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
                          disabled={self || isActionPending}
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
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            title="Remove os cargos e impede o acesso ao sistema"
                            disabled={self || !row.isActive || isActionPending}
                            onClick={() => {
                              if (confirm(`Revogar o acesso de ${row.email}?`)) revoke.mutate(row);
                            }}
                          >
                            <UserX className="mr-1 h-4 w-4" /> Revogar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            title="Exclui definitivamente a conta e o perfil do usuário"
                            disabled={self || isActionPending}
                            onClick={() => setDeleteTarget(row)}
                          >
                            <Trash2 className="mr-1 h-4 w-4" /> Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Nenhum usuário.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Diálogo de confirmação de exclusão individual */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação excluirá permanentemente o usuário{" "}
              <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email}). O usuário perderá
              acesso imediato ao sistema e seu cadastro será removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUsers.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteUsers.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) {
                  deleteUsers.mutate([deleteTarget.id]);
                }
              }}
            >
              {deleteUsers.isPending ? "Excluindo..." : "Sim, excluir usuário"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de confirmação de exclusão em lote */}
      <AlertDialog
        open={bulkConfirmOpen}
        onOpenChange={(open) => {
          if (!open) setBulkConfirmOpen(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selected.length} usuário(s) selecionado(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá permanentemente as contas e acessos de todos os{" "}
              {selected.length} usuários selecionados. Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUsers.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteUsers.isPending}
              onClick={(e) => {
                e.preventDefault();
                deleteUsers.mutate(selected);
              }}
            >
              {deleteUsers.isPending ? "Excluindo..." : "Sim, excluir selecionados"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <p className="text-xs text-muted-foreground">
        Por segurança, a conta conectada não pode alterar nem remover o próprio acesso. O banco
        também impede a remoção do último administrador ativo.
      </p>
    </div>
  );
}
