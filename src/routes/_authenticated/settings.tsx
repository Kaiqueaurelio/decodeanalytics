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
import { Loader2 } from "lucide-react";
import { DEFAULT_COMPANY_DOCUMENT } from "@/lib/format";

const DEFAULT_DOCUMENT = DEFAULT_COMPANY_DOCUMENT;

export const Route = createFileRoute("/_authenticated/settings")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const { data, isError, refetch, isFetching } = useQuery({
    queryKey: ["company_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("company_settings").select("*").limit(1).single();
      if (error) throw error;
      return data as any;
    },
  });
  const [form, setForm] = useState<any>({});
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
        logo_url: "/brand/decode-logo.png",
        default_quote_text: form.default_quote_text,
        default_order_text: form.default_order_text,
        default_deadline_days: Number(form.default_deadline_days) || 3,
        pix_key: form.pix_key?.trim() || null,
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


  if (isError) {
    return (
      <div className="mx-auto max-w-xl py-8">
        <Card className="space-y-3 p-6 text-center">
          <h2 className="font-semibold">Não foi possível carregar as configurações</h2>
          <p className="text-sm text-muted-foreground">
            Verifique sua conexão e tente carregar os dados novamente.
          </p>
          <div>
            <Button type="button" variant="outline" disabled={isFetching} onClick={() => void refetch()}>
              {isFetching ? "Carregando..." : "Tentar novamente"}
            </Button>
          </div>
        </Card>
      </div>
    );
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
            <Label>CNPJ</Label>
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
            <Label>Chave PIX para cobranças</Label>
            <Input
              value={form.pix_key ?? ""}
              onChange={(e) => setForm({ ...form, pix_key: e.target.value })}
              placeholder="Informe a chave PIX usada para receber pagamentos"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Esta chave será incluída nas mensagens de cobrança via WhatsApp.
            </p>
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
              <span className="min-w-0 flex-1 text-sm">
                <span className="font-medium">Exibir preços na landing page</span>
                <span className="mt-0.5 block text-muted-foreground">
                  Desmarque para ocultar todos os valores no site público. Os clientes verão
                  “Sob consulta” e serão direcionados ao WhatsApp para orçamento.
                </span>
              </span>
            </label>
          </div>
          <div className="md:col-span-2 rounded-xl border p-4">
            <Label>Logo da empresa</Label>
            <div className="mt-3 flex items-center gap-4">
              <img src="/brand/decode-logo.png" alt="Logo oficial Decode Analytics" className="h-20 w-20 rounded-xl bg-black object-contain p-2" />
              <p className="text-sm text-muted-foreground">Logo oficial Decode Analytics. O aplicativo não permite substituir por imagens antigas ou externas.</p>
            </div>
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
