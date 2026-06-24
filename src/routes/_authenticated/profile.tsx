// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Mail, Save, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/profile")({ component: ProfilePage });

function ProfilePage() {
  const qc = useQueryClient();
  const { user, roles } = useAuth();
  const [form, setForm] = useState({ full_name: "", email: "" });

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my_profile", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    setForm({
      full_name: profile?.full_name || user?.email || "",
      email: profile?.email || user?.email || "",
    });
  }, [profile, user?.email]);

  async function saveProfile() {
    if (!user?.id) return toast.error("Sessao nao encontrada.");
    if (!form.full_name.trim()) return toast.error("Informe seu nome.");
    if (!form.email.trim()) return toast.error("Informe seu e-mail.");

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: form.full_name.trim(),
      email: form.email.trim(),
    });
    if (error) return toast.error(error.message);

    qc.invalidateQueries({ queryKey: ["my_profile", user.id] });
    toast.success("Perfil atualizado.");
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Card className="overflow-hidden">
        <div className="border-b bg-muted/45 px-5 py-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-orange">
            Minha conta
          </p>
          <h2 className="mt-1 text-2xl font-black text-foreground">Dados de perfil</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Atualize como seu nome e e-mail aparecem dentro do sistema.
          </p>
        </div>

        <div className="grid gap-5 p-5 md:grid-cols-[180px_minmax(0,1fr)]">
          <div className="flex flex-col items-center rounded-2xl border bg-muted/30 p-4 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-brand-yellow text-3xl font-black text-brand-blue">
              {(form.full_name || form.email || "A").charAt(0).toUpperCase()}
            </div>
            <p className="mt-3 text-sm font-bold">{form.full_name || "Seu nome"}</p>
            <p className="mt-1 break-all text-xs text-muted-foreground">{form.email || user?.email}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-1">
              {roles.map((role) => (
                <span key={role} className="rounded-full bg-background px-2 py-1 text-[10px] font-bold text-muted-foreground">
                  {role}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <div className="relative mt-1">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  disabled={isLoading}
                  className="pl-9"
                  value={form.full_name}
                  onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                  placeholder="Seu nome"
                />
              </div>
            </div>

            <div>
              <Label>E-mail do perfil</Label>
              <div className="relative mt-1">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  disabled={isLoading}
                  className="pl-9"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="voce@email.com"
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Esse e-mail atualiza seu cadastro interno. Login/senha continuam sendo gerenciados pela autenticacao.
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={saveProfile} className="bg-brand-blue hover:bg-brand-blue-light">
                <Save className="mr-2 h-4 w-4" />
                Salvar perfil
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
