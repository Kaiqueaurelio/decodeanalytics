import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, ShieldAlert } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/users")({
  component: UsersPage,
});

function UsersPage() {
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          user_id,
          role,
          id
        `);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Usuários e Permissões</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie quem tem acesso ao sistema e quais são seus níveis de permissão.
          </p>
        </div>
        <Button className="bg-primary shadow-lg shadow-primary/10">
          <Plus className="mr-2 h-4 w-4" /> Novo Usuário
        </Button>
      </div>

      <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2">
        <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
          <ShieldAlert className="h-6 w-6 text-amber-600" />
        </div>
        <h3 className="text-lg font-semibold">Módulo de Gestão de Usuários</h3>
        <p className="text-sm text-muted-foreground max-w-sm mt-1">
          As permissões são gerenciadas via funções (Roles). 
          Para adicionar um novo usuário, utilize o convite do sistema ou entre em contato com o suporte técnico.
        </p>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
              <tr>
                <th className="p-4">ID do Usuário</th>
                <th className="p-4">Cargo / Função</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-muted-foreground italic">
                    Carregando usuários...
                  </td>
                </tr>
              ) : users?.length ? (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-mono text-[10px] text-muted-foreground">
                      {u.user_id}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary uppercase tracking-wider">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm">Editar</Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="p-12 text-center text-muted-foreground">
                    Nenhum registro de função encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
