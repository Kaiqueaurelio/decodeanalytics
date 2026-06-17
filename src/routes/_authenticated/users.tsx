// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABEL, type AppRole, useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Loader2, ShieldCheck, UserCog, Mail, Calendar, Trash2, Save } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/users")({
  component: UsersPage,
});

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string;
  roles: AppRole[];
}

const ROLE_COLORS: Record<AppRole, string> = {
  administrador: "bg-red-100 text-red-800 border-red-300",
  atendente: "bg-blue-100 text-blue-800 border-blue-300",
  vendedor: "bg-green-100 text-green-800 border-green-300",
  producao: "bg-purple-100 text-purple-800 border-purple-300",
  financeiro: "bg-orange-100 text-orange-800 border-orange-300",
  consumidor: "bg-gray-100 text-gray-800 border-gray-300",
};

function UsersPage() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<AppRole | null>(null);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["admin_users"],
    queryFn: async () => {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase.from("user_roles").select("*");

      if (rolesError) throw rolesError;

      return profilesData.map((profile) => ({
        ...profile,
        roles: rolesData.filter((r) => r.user_id === profile.id).map((r) => r.role as AppRole),
      })) as UserProfile[];
    },
    enabled: isAdmin,
  });

  const filteredProfiles =
    profiles?.filter((profile) =>
      `${profile.full_name} ${profile.email}`.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  async function updateRole(userId: string, newRole: AppRole) {
    try {
      // Remove todas as roles antigas
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      // Adiciona a nova role
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });

      if (insertError) throw insertError;

      toast.success("Cargo atualizado com sucesso!");
      setEditingUserId(null);
      setEditingRole(null);
      qc.invalidateQueries({ queryKey: ["admin_users"] });
    } catch (error: any) {
      toast.error("Erro ao atualizar cargo: " + error.message);
    }
  }

  async function deleteUser(userId: string) {
    try {
      // Primeiro remove as roles
      await supabase.from("user_roles").delete().eq("user_id", userId);

      // Depois remove o perfil
      const { error: deleteError } = await supabase.from("profiles").delete().eq("id", userId);

      if (deleteError) throw deleteError;

      toast.success("Usuário removido com sucesso!");
      qc.invalidateQueries({ queryKey: ["admin_users"] });
    } catch (error: any) {
      toast.error("Erro ao remover usuário: " + error.message);
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
        <ShieldCheck className="h-12 w-12 text-muted-foreground" />
        <div>
          <h2 className="text-xl font-bold">Acesso restrito</h2>
          <p className="text-muted-foreground">Apenas administradores podem gerenciar usuários.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-blue/10 text-brand-blue">
            <UserCog className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-brand-blue">Gestão de Usuários</h2>
            <p className="text-sm text-muted-foreground">
              {filteredProfiles.length} usuário{filteredProfiles.length !== 1 ? "s" : ""} no sistema
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card className="border-border/50 shadow-sm p-4">
        <Input
          placeholder="Buscar por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-11 rounded-lg bg-muted/30 focus-visible:ring-brand-yellow"
        />
      </Card>

      {/* Users Grid */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card className="flex h-64 items-center justify-center border-border/50 shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-brand-yellow" />
          </Card>
        ) : filteredProfiles.length === 0 ? (
          <Card className="flex h-64 flex-col items-center justify-center border-border/50 shadow-sm gap-3">
            <UserCog className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">Nenhum usuário encontrado</p>
          </Card>
        ) : (
          filteredProfiles.map((user) => (
            <Card
              key={user.id}
              className="border-border/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-5 space-y-4">
                {/* User Info */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground truncate">
                      {user.full_name || "Sem nome"}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Cadastrado em {new Date(user.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>

                  {/* Current Roles */}
                  <div className="flex flex-wrap gap-2 justify-end">
                    {user.roles.length > 0 ? (
                      user.roles.map((role) => (
                        <Badge
                          key={role}
                          className={cn("border", ROLE_COLORS[role])}
                          variant="outline"
                        >
                          {ROLE_LABEL[role]}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline" className="bg-gray-50">
                        Sem cargo
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-border/30">
                  {editingUserId === user.id ? (
                    <>
                      <Select
                        value={editingRole || ""}
                        onValueChange={(value) => setEditingRole(value as AppRole)}
                      >
                        <SelectTrigger className="h-9 flex-1 rounded-lg">
                          <SelectValue placeholder="Selecionar cargo" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ROLE_LABEL).map(([role, label]) => (
                            <SelectItem key={role} value={role}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (editingRole) {
                            updateRole(user.id, editingRole);
                          }
                        }}
                        disabled={!editingRole}
                        className="h-9 bg-brand-yellow text-brand-blue hover:bg-brand-yellow/90"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Salvar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingUserId(null);
                          setEditingRole(null);
                        }}
                        className="h-9"
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingUserId(user.id);
                          setEditingRole(user.roles[0] || "consumidor");
                        }}
                        className="h-9 flex-1"
                      >
                        Editar Cargo
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Tem certeza que deseja remover ${user.full_name || user.email}?`,
                            )
                          ) {
                            deleteUser(user.id);
                          }
                        }}
                        className="h-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Role Legend */}
      <Card className="border-border/50 shadow-sm p-5 bg-muted/20">
        <h3 className="font-semibold text-foreground mb-4">Legenda de Cargos</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(ROLE_LABEL).map(([role, label]) => (
            <div key={role} className="flex items-center gap-2">
              <Badge className={cn("border", ROLE_COLORS[role as AppRole])} variant="outline">
                {label}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
