import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { FileUp, Loader2 } from "lucide-react";
import { safeFileName } from "@/lib/briefing";
import { DEFAULT_COMPANY_DOCUMENT } from "@/lib/format";

const DEFAULT_DOCUMENT = "";

export const Route = createFileRoute("/_authenticated/settings")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["company_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("company_settings").select("*").limit(1).single();
      if (error) throw error;
      return data as any;
    },
  });
  const [form, setForm] = useState<any>({});
  const [uploadingLogo, setUploadingLogo] = useState(false);
  useEffect(() => {
    if (data) setForm({ ...data, document: data.document?.trim() || DEFAULT_DOCUMENT });
  }, [data]);

  async function save() {
    const { error } = await supabase
      .from("company_settings")
      .update({
        name: form.name,
        whatsapp: form.whatsapp,
        instagram: form.instagram,
        address: form.address,
        document: form.document?.trim() || DEFAULT_DOCUMENT,
        logo_url: form.logo_url,
        default_quote_text: form.default_quote_text,
        default_order_text: form.default_order_text,
        default_deadline_days: Number(form.default_deadline_days) || 3,
        show_prices: form.show_prices !== false,
        hero_title: form.hero_title,
        hero_subtitle: form.hero_subtitle,
        hero_cta_primary: form.hero_cta_primary,
        hero_cta_secondary: form.hero_cta_secondary,
        bento_kicker: form.bento_kicker,
        bento_title: form.bento_title,
        bento_description: form.bento_description,
        how_it_works_title: form.how_it_works_title,
        contact_title: form.contact_title,
        contact_description: form.contact_description,
      })
      .eq("id", form.id);
    if (error) return toast.error(error.message);
    toast.success("Configurações salvas");
    qc.invalidateQueries({ queryKey: ["company_settings"] });
  }

  async function uploadLogo(file?: File) {
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !["png", "pdf", "cdr", "svg"].includes(extension)) {
      return toast.error("Envie a logo em PNG, PDF, CDR ou SVG.");
    }
    setUploadingLogo(true);
    const path = `logos/${Date.now()}-${safeFileName(file.name)}`;
    const { error } = await supabase.storage.from("company-assets").upload(path, file);
    if (error) {
      setUploadingLogo(false);
      return toast.error(error.message);
    }
    const { data: signedData, error: signedError } = await supabase.storage
      .from("company-assets")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (signedError || !signedData) {
      setUploadingLogo(false);
      return toast.error(signedError?.message ?? "Não foi possível gerar URL da logo");
    }
    const logoUrl = signedData.signedUrl;
    const { error: updateError } = await supabase
      .from("company_settings")
      .update({ logo_url: logoUrl })
      .eq("id", form.id);
    setUploadingLogo(false);
    if (updateError) return toast.error(updateError.message);
    setForm({ ...form, logo_url: logoUrl });
    toast.success("Logo enviada e salva.");
  }

  return (
    <div className="max-w-3xl">
      <Card className="p-6 space-y-4">
        <h2 className="font-semibold text-primary">Dados da empresa</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <Label>Nome</Label>
            <Input
              value={form.name ?? ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label>WhatsApp</Label>
            <Input
              value={form.whatsapp ?? ""}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            />
          </div>
          <div>
            <Label>Instagram</Label>
            <Input
              value={form.instagram ?? ""}
              onChange={(e) => setForm({ ...form, instagram: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <Label>Endereço</Label>
            <Input
              value={form.address ?? ""}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div>
            <Label>Documento fiscal (opcional)</Label>
            <Input
              value={form.document ?? DEFAULT_DOCUMENT}
              onChange={(e) => setForm({ ...form, document: e.target.value })}
            />
          </div>
          <div>
            <Label>Prazo padrão (dias)</Label>
            <Input
              type="number"
              value={form.default_deadline_days ?? 3}
              onChange={(e) => setForm({ ...form, default_deadline_days: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <Label>Preços na loja online</Label>
            <label className="mt-1 flex cursor-pointer items-start gap-3 rounded-xl border p-4">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 shrink-0 accent-primary"
                checked={form.show_prices !== false}
                onChange={(e) => setForm({ ...form, show_prices: e.target.checked })}
              />
              <span className="min-w-0 text-sm">
                <span className="font-medium">Exibir preços na landing page</span>
                <span className="mt-0.5 block text-muted-foreground">
                  Desmarque para ocultar todos os valores no site público. Os clientes verão
                  “Sob consulta” e serão direcionados ao WhatsApp para orçamento.
                </span>
              </span>
            </label>
          </div>
          <div className="md:col-span-2">
            <Label>Logo da empresa</Label>
            <div className="mt-1 grid gap-3 rounded-xl border border-dashed p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div className="min-w-0">
                <p className="text-sm font-medium">Enviar logo em PNG, PDF, CDR ou SVG</p>
                <p className="text-xs text-muted-foreground">
                  PNG e SVG permitem pré-visualização. Arquivos técnicos ficam armazenados para
                  download e uso futuro.
                </p>
                {form.logo_url && (
                  <a
                    href={form.logo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block truncate text-xs text-primary underline"
                  >
                    {form.logo_url}
                  </a>
                )}
              </div>
              <label>
                <Button type="button" variant="outline" asChild disabled={uploadingLogo}>
                  <span>
                    {uploadingLogo ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileUp className="mr-2 h-4 w-4" />
                    )}
                    {uploadingLogo ? "Enviando..." : "Selecionar logo"}
                  </span>
                </Button>
                <input
                  type="file"
                  className="hidden"
                  accept=".png,.pdf,.cdr,.svg"
                  onChange={(e) => uploadLogo(e.target.files?.[0])}
                />
              </label>
            </div>
            {form.logo_url && /\.(png|svg)(\?|$)/i.test(form.logo_url) && (
              <img
                src={form.logo_url}
                alt="Logo atual"
                className="mt-3 h-32 max-w-full rounded-xl border bg-white object-contain p-3"
              />
            )}
          </div>
          <div className="md:col-span-2">
            <Label>Texto padrão do orçamento</Label>
            <Textarea
              value={form.default_quote_text ?? ""}
              onChange={(e) => setForm({ ...form, default_quote_text: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <Label>Texto padrão da OS</Label>
            <Textarea
              value={form.default_order_text ?? ""}
              onChange={(e) => setForm({ ...form, default_order_text: e.target.value })}
            />
          </div>
        </div>

        <h2 className="font-semibold text-primary pt-6">Textos da Landing Page</h2>
        <div className="space-y-6">
          <Card className="p-4 bg-muted/30">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 opacity-70">Seção Hero (Topo)</h3>
            <div className="grid gap-4">
              <div>
                <Label>Título Principal (Aceita HTML como &lt;br /&gt;)</Label>
                <Input
                  value={form.hero_title ?? ""}
                  onChange={(e) => setForm({ ...form, hero_title: e.target.value })}
                />
              </div>
              <div>
                <Label>Subtítulo</Label>
                <Textarea
                  value={form.hero_subtitle ?? ""}
                  onChange={(e) => setForm({ ...form, hero_subtitle: e.target.value })}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label>Botão Principal (CTA)</Label>
                  <Input
                    value={form.hero_cta_primary ?? ""}
                    onChange={(e) => setForm({ ...form, hero_cta_primary: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Botão Secundário</Label>
                  <Input
                    value={form.hero_cta_secondary ?? ""}
                    onChange={(e) => setForm({ ...form, hero_cta_secondary: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-muted/30">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 opacity-70">Seção Mais Pedidos (Bento)</h3>
            <div className="grid gap-4">
              <div>
                <Label>Kicker (Texto pequeno acima do título)</Label>
                <Input
                  value={form.bento_kicker ?? ""}
                  onChange={(e) => setForm({ ...form, bento_kicker: e.target.value })}
                />
              </div>
              <div>
                <Label>Título da Seção</Label>
                <Input
                  value={form.bento_title ?? ""}
                  onChange={(e) => setForm({ ...form, bento_title: e.target.value })}
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={form.bento_description ?? ""}
                  onChange={(e) => setForm({ ...form, bento_description: e.target.value })}
                />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-muted/30">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 opacity-70">Como Funciona & Contato</h3>
            <div className="grid gap-4">
              <div>
                <Label>Título "Como Funciona"</Label>
                <Input
                  value={form.how_it_works_title ?? ""}
                  onChange={(e) => setForm({ ...form, how_it_works_title: e.target.value })}
                />
              </div>
              <div className="border-t pt-4 mt-2">
                <Label>Título Seção de Contato</Label>
                <Input
                  value={form.contact_title ?? ""}
                  onChange={(e) => setForm({ ...form, contact_title: e.target.value })}
                />
              </div>
              <div>
                <Label>Descrição Contato</Label>
                <Textarea
                  value={form.contact_description ?? ""}
                  onChange={(e) => setForm({ ...form, contact_description: e.target.value })}
                />
              </div>
            </div>
          </Card>
        </div>

        <Button onClick={save} className="w-full md:w-auto h-12 px-8">Salvar Alterações</Button>
      </Card>
    </div>
  );
}
