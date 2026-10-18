import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { MessageCircle, ShoppingBag, ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StoreShell } from "@/components/storefront/StoreShell";
import { resolveProductImage } from "@/components/storefront/productImages";
import { STORE_CONTACT } from "@/components/storefront/tokens";
import type { StoreProduct } from "@/components/storefront/ProductCard";

export const Route = createFileRoute("/orcamento")({
  head: () => ({
    meta: [
      { title: "Solicitar orçamento — Decode Analytics" },
      { name: "description", content: "Escolha os produtos e serviços do catálogo e envie sua solicitação de orçamento pelo WhatsApp." },
    ],
  }),
  component: OrcamentoPage,
});

type QuoteLine = { product: StoreProduct; quantity: number };

function OrcamentoPage() {
  const [search, setSearch] = useState("");
  const [lines, setLines] = useState<QuoteLine[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [details, setDetails] = useState("");

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["quote-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id,name,slug,category,short_description,base_price,image_url,rating,reviews_count,min_quantity,badge,specs,unit")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return (data ?? []).map((p) => ({
        ...p,
        image_url: resolveProductImage(p.image_url, p.category, p.slug),
      })) as StoreProduct[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("pt-BR");
    return data.filter((p) => !q || `${p.name} ${p.category ?? ""} ${p.short_description ?? ""}`.toLocaleLowerCase("pt-BR").includes(q));
  }, [data, search]);

  function add(product: StoreProduct) {
    setLines((current) => {
      const found = current.find((line) => line.product.id === product.id);
      return found
        ? current.map((line) => line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line)
        : [...current, { product, quantity: Math.max(1, product.min_quantity ?? 1) }];
    });
  }

  function setQuantity(id: string, quantity: number) {
    if (quantity < 1) {
      setLines((current) => current.filter((line) => line.product.id !== id));
      return;
    }
    setLines((current) => current.map((line) => line.product.id === id ? { ...line, quantity } : line));
  }

  const message = [
    "Olá! Gostaria de solicitar um orçamento pela loja Decode Analytics.",
    customerName.trim() ? `Nome: ${customerName.trim()}` : "",
    customerContact.trim() ? `Contato: ${customerContact.trim()}` : "",
    "",
    "Produtos/serviços solicitados:",
    ...lines.map(({ product, quantity }) => `• ${product.name} — quantidade: ${quantity}`),
    details.trim() ? `\nDetalhes do pedido: ${details.trim()}` : "",
  ].filter(Boolean).join("\n");

  const whatsapp = `https://wa.me/${STORE_CONTACT.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
  const canSend = lines.length > 0 && customerName.trim().length > 0;

  return (
    <StoreShell>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <Link to="/produtos" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#7DD3FC] hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Voltar ao catálogo
        </Link>
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#7DD3FC]">Atendimento personalizado</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Monte seu orçamento</h1>
          <p className="mt-3 text-sm leading-6 text-white/65">Selecione os produtos ou serviços, informe seus dados e envie a solicitação. O WhatsApp abrirá com a mensagem pronta para você revisar e enviar.</p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
          <div className="min-w-0">
            <label htmlFor="quote-search" className="mb-2 block text-sm font-semibold text-white">Adicionar do catálogo</label>
            <input id="quote-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produto ou serviço..." className="h-12 w-full rounded-xl border border-white/10 bg-[#111827] px-4 text-sm text-white outline-none focus:border-sky-400" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {isLoading && <p className="text-sm text-white/60">Carregando catálogo…</p>}
              {isError && <p role="alert" className="text-sm text-red-300">Não foi possível carregar o catálogo. Tente novamente mais tarde.</p>}
              {!isLoading && !isError && filtered.length === 0 && <p className="text-sm text-white/60">Nenhum item encontrado para essa busca.</p>}
              {filtered.map((product) => {
                const selected = lines.some((line) => line.product.id === product.id);
                return (
                  <article key={product.id} className="flex gap-3 rounded-2xl border border-white/10 bg-[#0D1325] p-3">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white/5">
                      {product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" loading="lazy" /> : <div className="flex h-full items-center justify-center"><ShoppingBag className="h-6 w-6 text-white/30" /></div>}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col items-start">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-violet-300">{product.category ?? "Catálogo"}</p>
                      <h2 className="mt-1 line-clamp-2 text-sm font-bold text-white">{product.name}</h2>
                      {product.short_description && <p className="mt-1 line-clamp-2 text-xs text-white/50">{product.short_description}</p>}
                      <button type="button" onClick={() => add(product)} className="mt-auto inline-flex min-h-9 items-center gap-1.5 pt-2 text-xs font-bold text-sky-300 hover:text-white">
                        <Plus className="h-4 w-4" /> {selected ? "Adicionar mais" : "Adicionar"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-white/10 bg-[#0D1325] p-5 sm:p-6">
            <h2 className="text-xl font-extrabold text-white">Sua solicitação</h2>
            {lines.length === 0 ? (
              <div className="my-5 rounded-xl border border-dashed border-white/15 p-6 text-center">
                <ShoppingBag className="mx-auto h-7 w-7 text-white/30" />
                <p className="mt-2 text-sm text-white/60">Adicione pelo menos um item do catálogo.</p>
              </div>
            ) : (
              <ul className="my-5 space-y-3">
                {lines.map(({ product, quantity }) => (
                  <li key={product.id} className="flex items-center gap-3 border-b border-white/10 pb-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">{product.name}</p>
                      <p className="text-xs text-white/50">Preço e condições a confirmar</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" aria-label={`Diminuir quantidade de ${product.name}`} onClick={() => setQuantity(product.id, quantity - 1)} className="rounded-lg border border-white/15 p-2 text-white hover:bg-white/10"><Minus className="h-3 w-3" /></button>
                      <span className="min-w-7 text-center text-sm font-bold text-white">{quantity}</span>
                      <button type="button" aria-label={`Aumentar quantidade de ${product.name}`} onClick={() => setQuantity(product.id, quantity + 1)} className="rounded-lg border border-white/15 p-2 text-white hover:bg-white/10"><Plus className="h-3 w-3" /></button>
                      <button type="button" aria-label={`Remover ${product.name}`} onClick={() => setQuantity(product.id, 0)} className="ml-1 rounded-lg p-2 text-red-300 hover:bg-red-400/10"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="quote-name" className="mb-1.5 block text-sm font-semibold text-white">Seu nome *</label>
                <input id="quote-name" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Como podemos chamar você?" className="h-11 w-full rounded-xl border border-white/10 bg-[#111827] px-3 text-sm text-white outline-none focus:border-sky-400" />
              </div>
              <div>
                <label htmlFor="quote-contact" className="mb-1.5 block text-sm font-semibold text-white">Telefone ou e-mail (opcional)</label>
                <input id="quote-contact" value={customerContact} onChange={(e) => setCustomerContact(e.target.value)} placeholder="Seu contato para retorno" className="h-11 w-full rounded-xl border border-white/10 bg-[#111827] px-3 text-sm text-white outline-none focus:border-sky-400" />
              </div>
              <div>
                <label htmlFor="quote-details" className="mb-1.5 block text-sm font-semibold text-white">Detalhes do pedido (opcional)</label>
                <textarea id="quote-details" rows={3} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Prazo, medidas, cores, personalizações…" className="w-full resize-y rounded-xl border border-white/10 bg-[#111827] px-3 py-2.5 text-sm text-white outline-none focus:border-sky-400" />
              </div>
              <a href={canSend ? whatsapp : undefined} target="_blank" rel="noreferrer" aria-disabled={!canSend} onClick={(e) => { if (!canSend) e.preventDefault(); }} className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-extrabold transition-colors ${canSend ? "bg-emerald-500 text-[#062014] hover:bg-emerald-400" : "cursor-not-allowed bg-white/10 text-white/35"}`}>
                <MessageCircle className="h-5 w-5" /> Enviar orçamento pelo WhatsApp
              </a>
              <p className="text-xs leading-5 text-white/45">A solicitação será aberta no WhatsApp para você revisar e enviar. Nenhuma mensagem é enviada automaticamente.</p>
            </div>
          </aside>
        </div>
      </section>
    </StoreShell>
  );
}
