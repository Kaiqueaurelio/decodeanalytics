import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Camera, Loader2, Save, LockKeyhole, UserRound } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Meu perfil — Decode Analytics" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, isAdmin } = useAuth();
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? ""));
    setAvatarUrl(String(user.user_metadata?.avatar_url ?? ""));
    setEmail(user.email ?? "");
  }, [user]);

  async function saveProfile() {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Perfil atualizado com sucesso.");
  }

  async function uploadAvatar(file?: File) {
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) return toast.error("Escolha um arquivo de imagem.");
    if (file.size > 5 * 1024 * 1024) return toast.error("A foto deve ter no máximo 5 MB.");
    setUploading(true);
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `avatars/${user.id}/profile.${extension}`;
    const { error } = await supabase.storage.from("company-assets").upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      setUploading(false);
      return toast.error("Não foi possível enviar a foto. Verifique as permissões do armazenamento.");
    }
    // O bucket company-assets é público; use uma URL pública estável em vez
    // de uma URL assinada que expira e faria a foto desaparecer do perfil.
    const { data } = supabase.storage.from("company-assets").getPublicUrl(path);
    if (!data?.publicUrl) {
      setUploading(false);
      return toast.error("A foto foi enviada, mas não foi possível obter seu endereço.");
    }
    const { error: profileError } = await supabase.auth.updateUser({ data: { avatar_url: data.publicUrl } });
    setUploading(false);
    if (profileError) return toast.error(profileError.message);
    setAvatarUrl(data.publicUrl);
    toast.success("Foto de perfil atualizada.");
  }

  async function changePassword() {
    if (password.length < 8) return toast.error("A senha deve ter pelo menos 8 caracteres.");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) return toast.error(error.message);
    setPassword("");
    toast.success("Senha alterada com sucesso.");
  }

  return <div className="mx-auto max-w-3xl space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="text-2xl font-bold tracking-tight">Meu perfil</h2><p className="mt-1 text-sm text-muted-foreground">Gerencie sua foto, seus dados e a senha da sua conta.</p></div>
      {isAdmin && <img src="/brand/decode-logo.png" alt="Decode Analytics" className="h-12 w-auto max-w-[180px] object-contain self-start sm:self-auto" />}
    </div>
    <Card className="space-y-6 p-5 sm:p-7">
      <div className="flex flex-col items-center gap-4 border-b pb-6 sm:flex-row">
        <div className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full border bg-muted text-muted-foreground">
          {avatarUrl ? <img src={avatarUrl} alt="Foto de perfil" className="h-full w-full object-cover" /> : <UserRound className="h-12 w-12" />}
          {uploading && <div className="absolute inset-0 grid place-items-center bg-black/50 text-white"><Loader2 className="h-6 w-6 animate-spin" /></div>}
        </div>
        <div className="text-center sm:text-left"><h3 className="font-semibold">Foto de perfil</h3><p className="mt-1 text-sm text-muted-foreground">Imagem JPG, PNG ou WEBP, até 5 MB.</p>
          <label className="mt-3 inline-flex cursor-pointer"><Button type="button" variant="outline" disabled={uploading} asChild><span><Camera className="mr-2 h-4 w-4" />{uploading ? "Enviando..." : "Escolher foto"}</span></Button><input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={uploading} onChange={(e) => { void uploadAvatar(e.currentTarget.files?.[0]); e.currentTarget.value = ""; }} /></label>
        </div>
      </div>
      <div className="space-y-4">
        <div><Label htmlFor="profile-name">Nome completo</Label><Input id="profile-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className="mt-1" /></div>
        <div><Label htmlFor="profile-email">E-mail da conta</Label><Input id="profile-email" value={email} readOnly disabled className="mt-1" /><p className="mt-1 text-xs text-muted-foreground">O e-mail de acesso não pode ser alterado nesta tela.</p></div>
        <Button onClick={() => void saveProfile()} disabled={saving || !name.trim()}><Save className="mr-2 h-4 w-4" />Salvar perfil</Button>
      </div>
    </Card>
    <Card className="space-y-4 p-5 sm:p-7">
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><LockKeyhole className="h-5 w-5" /></span><div><h3 className="font-semibold">Segurança da conta</h3><p className="text-sm text-muted-foreground">Defina uma nova senha de acesso.</p></div></div>
      <div><Label htmlFor="new-password">Nova senha</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo de 8 caracteres" className="mt-1" /></div>
      <Button variant="outline" onClick={() => void changePassword()} disabled={saving || password.length < 8}>Alterar senha</Button>
    </Card>
  </div>;
}
