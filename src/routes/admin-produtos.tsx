import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ImagePlus, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { STORE_CATEGORIES } from "@/components/storefront/tokens";

export const Route = createFileRoute("/admin-produtos")({
  head: () => ({ meta: [{ title: "Gerenciar catálogo — Administração | Decode Analytics" }] }),
  component: AdminProdutosPage,
});

type Item = { id: string; name: string; category: string | null; short_description: string | null; description?: string | null; base_price: number | string; image_url: string | null; active: boolean; slug?: string | null };
const empty = { name: "", category: "Desenvolvimento Digital", short_description: "", description: "", base_price: "0", image_url: "", active: true };

function AdminProdutosPage() {
  const { user, loading, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["admin-catalog"],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      const { data, error } = await (supabase.from("services") as any).select("id,name,category,short_description,description,base_price,image_url,active,slug").order("name");
      if (error) throw error;
      return (data ?? []) as Item[];
    },
  });

  function reset() { setForm(empty); setEditing(null); setPhoto(null); }
  function edit(item: Item) {
    setEditing(item.id);
    setPhoto(null);
    setForm({ name: item.name ?? "", category: item.category ?? "Desenvolvimento Digital", short_description: item.short_description ?? "", description: item.description ?? "", base_price: String(item.base_price ?? 0), image_url: item.image_url ?? "", active: item.active ?? true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (loading) return <Message text="Verificando acesso administrativo…" />;
  if (!user || !isAdmin) return <Message text="Acesso restrito a usuários com o perfil Administrador." />;

  async function save(e: FormEvent) {
    e.preventDefault();
    setNotice("");
    setSaving(true);
    try {
      let imageUrl = form.image_url.trim() || null;
      if (photo) {
        const safeName = photo.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "-");
        const path = `${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from("catalog-images").upload(path, photo, { upsert: false, contentType: photo.type });
        if (uploadError) throw new Error("Não foi possível enviar a foto. Confirme se o bucket catalog-images foi criado e se as permissões estão ativas.");
        const { data: publicData } = supabase.storage.from("catalog-images").getPublicUrl(path);
        imageUrl = publicData.publicUrl;
      }
      const payload = {
        name: form.name.trim(),
        category: form.category,
        short_description: form.short_description.trim() || null,
        description: form.description.trim() || null,
        base_price: Number(form.base_price) || 0,
        image_url: imageUrl,
        active: form.active,
        slug: form.name.trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        updated_at: new Date().toISOString(),
      };
      if (editing) {
        const { error } = await (supabase.from("services") as any).update(payload).eq("id", editing);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("services") as any).insert(payload);
        if (error) throw error;
      }
      await qc.invalidateQueries({ queryKey: ["admin-catalog"] });
      await qc.invalidateQueries({ queryKey: ["store-catalog"] });
      await qc.invalidateQueries({ queryKey: ["quote-catalog"] });
      setNotice(editing ? "Produto atualizado." : "Produto cadastrado.");
      reset();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Não foi possível salvar o produto. Verifique as permissões do banco.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(item: Item) {
    const { error } = await (supabase.from("services") as any).update({ active: !item.active, updated_at: new Date().toISOString() }).eq("id", item.id);
    if (error) { setNotice("Não foi possível alterar a publicação deste item."); return; }
    await qc.invalidateQueries({ queryKey: ["admin-catalog"] });
    await qc.invalidateQueries({ queryKey: ["store-catalog"] });
    await qc.invalidateQueries({ queryKey: ["quote-catalog"] });
  }

  async function remove(item: Item) {
    if (!window.confirm(`Excluir "${item.name}"? Essa ação não pode ser desfeita.`)) return;
    const { error } = await (supabase.from("services") as any).delete().eq("id", item.id);
    if (error) { setNotice("Não foi possível excluir. Se o item já estiver vinculado a pedidos, prefira desativá-lo."); return; }
    await qc.invalidateQueries({ queryKey: ["admin-catalog"] });
    setNotice("Produto excluído.");
  }

  return <div className="min-h-screen bg-[#080c16] px-4 py-8 text-white sm:px-8"><div className="mx-auto max-w-6xl">
    <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-300"><ArrowLeft className="h-4 w-4" /> Voltar à loja</Link>
    <div className="mt-6"><p className="text-xs font-bold uppercase tracking-[.2em] text-sky-300">Painel administrativo</p><h1 className="mt-1 text-3xl font-black">Gerenciar produtos</h1><p className="mt-2 text-sm text-white/60">Cadastre e atualize itens do catálogo sem precisar editar código ou mandar dados no chat.</p></div>
    <form onSubmit={save} className="mt-7 grid gap-5 rounded-2xl border border-white/10 bg-[#0D1325] p-5 sm:grid-cols-2 sm:p-7">
      <div className="sm:col-span-2 flex items-center justify-between"><h2 className="text-xl font-extrabold">{editing ? "Editar produto" : "Novo produto"}</h2>{editing && <button type="button" onClick={reset} className="text-sm font-semibold text-sky-300">Cancelar edição</button>}</div>
      <label className="text-sm font-semibold">Nome do produto *<input required maxLength={160} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#111827] px-3 font-normal outline-none focus:border-sky-400" placeholder="Nome que aparecerá na loja" /></label>
      <label className="text-sm font-semibold">Categoria<select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#111827] px-3 font-normal outline-none focus:border-sky-400">{STORE_CATEGORIES.filter((c) => c.slug !== "todos").map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}</select></label>
      <label className="text-sm font-semibold">Preço base (R$)<input type="number" min="0" step="0.01" value={form.base_price} onChange={(e) => setForm((f) => ({ ...f, base_price: e.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#111827] px-3 font-normal outline-none focus:border-sky-400" /></label>
      <label className="text-sm font-semibold">Foto do produto<input type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} className="mt-2 block min-h-11 w-full rounded-xl border border-white/10 bg-[#111827] p-2 text-xs font-normal file:mr-3 file:rounded-lg file:border-0 file:bg-sky-400 file:px-3 file:py-2 file:font-bold file:text-slate-950" />{photo && <span className="mt-1 block text-xs text-emerald-300">{photo.name}</span>}</label>
      <label className="text-sm font-semibold sm:col-span-2">Ou URL pública da imagem (opcional)<input type="url" value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#111827] px-3 font-normal outline-none focus:border-sky-400" placeholder="https://..." /></label>
      <label className="text-sm font-semibold sm:col-span-2">Descrição curta<input maxLength={280} value={form.short_description} onChange={(e) => setForm((f) => ({ ...f, short_description: e.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#111827] px-3 font-normal outline-none focus:border-sky-400" placeholder="Resumo exibido nos cartões do catálogo" /></label>
      <label className="text-sm font-semibold sm:col-span-2">Descrição completa<textarea rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="mt-2 w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2.5 font-normal outline-none focus:border-sky-400" placeholder="Detalhes, opções e informações para o cliente" /></label>
      <label className="flex items-center gap-3 text-sm font-semibold sm:col-span-2"><input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="h-4 w-4 accent-sky-400" /> Publicar no catálogo e permitir orçamento</label>
      {notice && <p role="status" className="rounded-xl bg-sky-400/10 p-3 text-sm text-sky-200 sm:col-span-2">{notice}</p>}
      <div className="flex flex-wrap gap-3 sm:col-span-2"><button disabled={saving} type="submit" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-sky-400 px-5 text-sm font-extrabold text-slate-950 disabled:opacity-50"><Save className="h-4 w-4" />{saving ? "Salvando…" : editing ? "Salvar alterações" : "Cadastrar produto"}</button>{!editing && <button type="button" onClick={reset} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/15 px-5 text-sm font-bold text-white"><Plus className="h-4 w-4" /> Limpar formulário</button>}</div>
    </form>

    <section className="mt-10"><div className="flex items-end justify-between gap-3"><div><h2 className="text-xl font-extrabold">Produtos cadastrados</h2><p className="mt-1 text-sm text-white/50">{data.length} itens no catálogo</p></div></div>
      {isLoading ? <p className="mt-4 text-sm text-white/60">Carregando produtos…</p> : isError ? <p role="alert" className="mt-4 text-sm text-red-300">Não foi possível carregar o catálogo. Verifique as permissões do banco.</p> : <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-white/5 text-xs uppercase tracking-wide text-white/50"><tr><th className="px-4 py-3">Produto</th><th className="px-4 py-3">Categoria</th><th className="px-4 py-3">Preço base</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Ações</th></tr></thead><tbody>{data.map((item) => <tr key={item.id} className="border-t border-white/10"><td className="px-4 py-3"><div className="flex items-center gap-3">{item.image_url ? <img src={item.image_url} alt="" className="h-11 w-11 rounded-lg object-cover" /> : <div className="rounded-lg bg-white/5 p-3"><ImagePlus className="h-4 w-4 text-white/40" /></div>}<span className="font-semibold text-white">{item.name}</span></div></td><td className="px-4 py-3 text-white/60">{item.category ?? "—"}</td><td className="px-4 py-3 text-white/70">{Number(item.base_price || 0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</td><td className="px-4 py-3"><button type="button" onClick={() => toggleActive(item)} className={`rounded-full px-3 py-1 text-xs font-bold ${item.active ? "bg-emerald-400/10 text-emerald-300" : "bg-white/10 text-white/50"}`}>{item.active ? "Publicado" : "Oculto"}</button></td><td className="px-4 py-3"><div className="flex gap-2"><button type="button" onClick={() => edit(item)} aria-label={`Editar ${item.name}`} className="rounded-lg border border-white/10 p-2 text-sky-300 hover:bg-white/5"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => remove(item)} aria-label={`Excluir ${item.name}`} className="rounded-lg border border-white/10 p-2 text-red-300 hover:bg-red-400/10"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></div>}
    </section>
    <p className="mt-4 text-xs leading-5 text-white/40">O envio de fotos utiliza o bucket privado/público catalog-images. A migração de segurança deve ser aplicada ao banco antes de liberar a tela para produção.</p>
  </div></div>;
}

function Message({ text }: { text: string }) { return <div className="flex min-h-screen items-center justify-center bg-[#080c16] px-5 text-center text-sm text-white/70">{text}</div>; }
