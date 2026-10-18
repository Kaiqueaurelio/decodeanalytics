import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Save, ArrowLeft, ShieldCheck, ImagePlus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin-marca")({
  head: () => ({ meta: [{ title: "Marca e identidade — Administração | Decode Analytics" }] }),
  component: AdminMarcaPage,
});

type Brand = { id: string; name: string | null; logo_url: string | null; whatsapp: string | null; address: string | null; instagram: string | null; primary_color: string | null; secondary_color: string | null; accent_color: string | null };

function AdminMarcaPage() {
  const { user, loading, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "Decode Analytics", logo_url: "", whatsapp: "", address: "", instagram: "", primary_color: "#2563EB", secondary_color: "#7C3AED", accent_color: "#38BDF8" });
  const [notice, setNotice] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-brand-settings"],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      const { data, error } = await (supabase.from("company_settings") as any).select("id,name,logo_url,whatsapp,address,instagram,primary_color,secondary_color,accent_color").limit(1).maybeSingle();
      if (error) throw error;
      return data as Brand | null;
    },
  });

  useEffect(() => {
    if (data) setForm({
      name: data.name ?? "Decode Analytics",
      logo_url: data.logo_url ?? "",
      whatsapp: data.whatsapp ?? "",
      address: data.address ?? "",
      instagram: data.instagram ?? "",
      primary_color: data.primary_color ?? "#2563EB",
      secondary_color: data.secondary_color ?? "#7C3AED",
      accent_color: data.accent_color ?? "#38BDF8",
    });
  }, [data]);

  if (loading) return <AdminMessage text="Verificando acesso administrativo…" />;
  if (!user || !isAdmin) return <AdminMessage text="Acesso restrito a usuários com o perfil Administrador." />;
  if (isLoading) return <AdminMessage text="Carregando configurações da marca…" />;

  async function save(e: FormEvent) {
    e.preventDefault();
    setNotice("");
    if (!data?.id) { setNotice("Não foi encontrado um registro de configuração da empresa. Crie esse registro antes de salvar."); return; }
    const { error } = await (supabase.from("company_settings") as any).update({
      name: form.name.trim(), logo_url: form.logo_url.trim() || null, whatsapp: form.whatsapp.trim(),
      address: form.address.trim() || null, instagram: form.instagram.trim() || null,
      primary_color: form.primary_color, secondary_color: form.secondary_color, accent_color: form.accent_color,
    }).eq("id", data.id);
    if (error) { setNotice("Não foi possível salvar. Confirme se a migração de identidade visual foi aplicada e se você tem permissão administrativa."); return; }
    await qc.invalidateQueries({ queryKey: ["admin-brand-settings"] });
    await qc.invalidateQueries({ queryKey: ["company_settings"] });
    setNotice("Marca atualizada com sucesso.");
  }

  function field(key: keyof typeof form, label: string, placeholder = "") {
    return <label className="block text-sm font-semibold text-white" key={key}>{label}<input value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#111827] px-3 font-normal text-white outline-none focus:border-sky-400" /></label>;
  }

  return <div className="min-h-screen bg-[#080c16] px-4 py-8 text-white sm:px-8">
    <div className="mx-auto max-w-4xl">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-300"><ArrowLeft className="h-4 w-4" /> Voltar à loja</Link>
      <div className="mt-6 flex items-start gap-4"><div className="rounded-2xl bg-sky-400/10 p-3 text-sky-300"><ShieldCheck className="h-7 w-7" /></div><div><p className="text-xs font-bold uppercase tracking-[.2em] text-sky-300">Painel administrativo</p><h1 className="mt-1 text-3xl font-black">Marca e identidade visual</h1><p className="mt-2 text-sm text-white/60">Atualize os dados institucionais sem alterar arquivos de código.</p></div></div>
      <form onSubmit={save} className="mt-8 space-y-6 rounded-2xl border border-white/10 bg-[#0D1325] p-5 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">{field("name", "Nome da marca", "Decode Analytics")}{field("whatsapp", "WhatsApp", "+55 11 99999-9999")}{field("instagram", "Instagram", "@decode.analytics")}{field("address", "Endereço", "Rua, número, bairro, cidade/UF")}</div>
        <div><label className="block text-sm font-semibold text-white">URL do logotipo<input value={form.logo_url} onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))} placeholder="https://... ou caminho público do logo" className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#111827] px-3 font-normal text-white outline-none focus:border-sky-400" /></label><p className="mt-1.5 flex items-center gap-1.5 text-xs text-white/45"><ImagePlus className="h-3.5 w-3.5" /> Use uma URL pública para que o logotipo apareça no site.</p>{form.logo_url && <img src={form.logo_url} alt="Prévia do logotipo" className="mt-3 h-20 max-w-48 rounded-lg bg-white/5 object-contain p-2" onError={(e) => { e.currentTarget.style.display = "none"; }} />}</div>
        <div><h2 className="text-lg font-bold">Paleta da marca</h2><p className="mt-1 text-xs text-white/50">Escolha as cores para a identidade visual do site.</p><div className="mt-4 grid gap-4 sm:grid-cols-3">{([["primary_color","Cor principal"],["secondary_color","Cor secundária"],["accent_color","Cor de destaque"]] as const).map(([key,label]) => <label key={key} className="flex items-center gap-3 rounded-xl border border-white/10 p-3 text-sm font-semibold"><input type="color" value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} className="h-10 w-12 cursor-pointer rounded border-0 bg-transparent" /><span>{label}<span className="block text-xs font-normal text-white/50">{form[key]}</span></span></label>)}</div></div>
        {notice && <p role="status" className={`rounded-xl p-3 text-sm ${notice.includes("sucesso") ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-200"}`}>{notice}</p>}
        <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-sky-400 px-5 text-sm font-extrabold text-slate-950 hover:bg-sky-300"><Save className="h-4 w-4" /> Salvar identidade</button>
      </form>
      <p className="mt-4 text-xs leading-5 text-white/40">A gravação das cores exige a migração de banco incluída neste commit. O acesso à tela é limitado ao perfil Administrador; as políticas do banco também precisam permitir a atualização.</p>
    </div>
  </div>;
}

function AdminMessage({ text }: { text: string }) {
  return <div className="flex min-h-screen items-center justify-center bg-[#080c16] px-5 text-center text-sm text-white/70">{text}</div>;
}
