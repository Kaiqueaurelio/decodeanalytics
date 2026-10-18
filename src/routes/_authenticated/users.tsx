import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/users")({
  component: UsersPage,
});

function UsersPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role, id");
      if (error) throw error;
      return data;
    },
  });

  const approveAccount = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: "atendente" })
        .eq("id", roleId)
        .eq("role", "aguardando_aprovacao");
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users-list"] });
      toast.success("Acesso liberado como atendente.");
    },
    onError: () => toast.error("Não foi possível liberar o acesso. Verifique sua permissão e tente novamente."),
  });

  if (!isAdmin) {
    return (
      <Card className="mx-auto mt-8 max-w-xl p-8 text-center">
        <ShieldAlert aria-hidden="true" className="mx-auto mb-4 h-10 w-10 text-amber-500" />
        <h2 className="text-xl font-bold">Acesso aguardando aprovação</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Um administrador precisa liberar as permissões da sua conta antes de você acessar esta área.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Usuários e permissões</h2>
        <p className="text-sm text-muted-foreground">
          Revise os cadastros e libere o acesso da equipe quando apropriado.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/50 font-medium text-muted-foreground">
              <tr>
                <th scope="col" className="p-4">ID do usuário</th>
                <th scope="col" className="p-4">Cargo / função</th>
                <th scope="col" className="p-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-muted-foreground">
                    Carregando usuários...
                  </td>
                </tr>
              ) : users?.length ? (
                users.map((userRole) => (
                  <tr key={userRole.id} className="hover:bg-muted/30">
                    <td className="p-4 font-mono text-xs text-muted-foreground">{userRole.user_id}</td>
                    <td className="p-4">
                      <span className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        {userRole.role}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {userRole.role === "aguardando_aprovacao" ? (
                        <Button
                          type="button"
                          size="sm"
                          disabled={approveAccount.isPending}
                          onClick={() => approveAccount.mutate(userRole.id)}
                        >
                          Aprovar como atendente
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-muted-foreground">
                    Nenhum cadastro encontrado.
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
