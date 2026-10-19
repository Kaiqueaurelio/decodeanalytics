import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Search, Send, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StoreShell } from "@/components/storefront/StoreShell";
import { useWaLink } from "@/hooks/useCompanyInfo";
import { resolveProductImage } from "@/components/storefront/productImages";

type QuoteItem = { name: string; quantity: number; notes: string };
type Customer = { name: string; phone: string; email: string; company: string };

const emptyCustomer: Customer = { name: "", phone: "", email: "", company: "" };

export const Route = createFileRoute("/orcamento")({ component: QuotePage });

function QuotePage() {
  const waLink = useWaLink();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, QuoteItem>>({});
  const [customer, setCustomer] = useState<Customer>(emptyCustomer);
  const [formError, setFormError] = useState("");

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["quote-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id,name,category,short_description,image_url,slug")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return (data ?? []).map((product) => ({
        ...product,
        image_url: resolveProductImage(product.image_url, product.category, product.slug),
      }));
    },
  });

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    return data.filter((product) =>
      `${product.name} ${product.category ?? ""} ${product.short_description ?? ""}`
        .toLocaleLowerCase("pt-BR")
        .includes(term),
    );
  }, [data, query]);

  const items = Object.entries(selected).filter(([, item]) => item.quantity > 0);
  const totalUnits = items.reduce((sum, [, item]) => sum + item.quantity, 0);
  const message = useMemo(() => {
    const customerLines = [
      `Nome: ${customer.name.trim()}`,
      `WhatsApp/telefone: ${customer.phone.trim()}`,
      customer.email.trim() ? `E-mail: ${customer.email.trim()}` : "",
      customer.company.trim() ? `Empresa: ${customer.company.trim()}` : "",
    ].filter(Boolean);
    const productLines = items.map(([, item]) =>
      `• ${item.name} — quantidade: ${item.quantity}${item.notes.trim() ? ` — detalhes: ${item.notes.trim()}` : ""}`,
    );
    return [
      "Olá! Gostaria de solicitar um orçamento pela Decode Analytics.",
      "",
      "DADOS DO CLIENTE",
      ...customerLines,
      "",
      "PRODUTOS",
      ...productLines,
      "",
      "Por favor, informem valores, prazos e opções disponíveis.",
    ].join("\n");
  }, [customer, items]);

  function updateCustomer(field: keyof Customer, value: string) {
    setCustomer((current) => ({ ...current, [field]: value }));
    setFormError("");
  }

  function openWhatsApp() {
    if (!customer.name.trim() || !customer.phone.trim()) {
      setFormError("Informe seu nome e telefone/WhatsApp para continuar.");
      return;
    }
    if (!items.length) {
      setFormError("Selecione pelo menos um produto para solicitar o orçamento.");
      return;
    }
    window.open(waLink(message), "_blank", "noopener,noreferrer");
  }

  return (
    <StoreShell>
      <section className="min-h-[65vh] bg-[#080C1F] px-4 py-10 text-white sm:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#22D3EE]">Atendimento personalizado</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Solicitar orçamento</h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Escolha os produtos, informe as quantidades e seus dados. O WhatsApp abrirá com a solicitação pronta para revisar e enviar.
          </p>

          <div className="mt-7 rounded-2xl border border-white/10 bg-white/[.03] p-4 sm:p-5">
            <h2 className="flex items-center gap-2 font-bold"><UserRound className="h-5 w-5 text-cyan-300" /> Seus dados</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-slate-300">Nome completo *
                <input required autoComplete="name" value={customer.name} onChange={(event) => updateCustomer("name", event.target.value)} placeholder="Como podemos te chamar?" className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-black/20 px-3 text-white outline-none focus:border-cyan-300" />
              </label>
              <label className="text-sm text-slate-300">Telefone/WhatsApp *
                <input required type="tel" autoComplete="tel" value={customer.phone} onChange={(event) => updateCustomer("phone", event.target.value)} placeholder="(11) 99999-9999" className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-black/20 px-3 text-white outline-none focus:border-cyan-300" />
              </label>
              <label className="text-sm text-slate-300">E-mail (opcional)
                <input type="email" autoComplete="email" value={customer.email} onChange={(event) => updateCustomer("email", event.target.value)} placeholder="voce@exemplo.com" className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-black/20 px-3 text-white outline-none focus:border-cyan-300" />
              </label>
              <label className="text-sm text-slate-300">Empresa (opcional)
                <input autoComplete="organization" value={customer.company} onChange={(event) => updateCustomer("company", event.target.value)} placeholder="Nome da empresa" className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-black/20 px-3 text-white outline-none focus:border-cyan-300" />
              </label>
            </div>
          </div>

          <label className="mt-6 flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4">
            <Search className="h-5 w-5 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar no catálogo…" aria-label="Buscar produtos para orçamento" className="min-h-12 w-full bg-transparent text-white outline-none placeholder:text-slate-500" />
          </label>

          {isLoading ? <p className="py-8 text-slate-300">Carregando catálogo…</p> : error ? (
            <p role="alert" className="py-8 text-amber-200">Não foi possível carregar o catálogo. Tente novamente mais tarde.</p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-slate-300">Nenhum produto encontrado. Tente outra busca.</p>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {filtered.map((product) => {
                const item = selected[product.id];
                return (
                  <article key={product.id} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[.03] p-3">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white/5">
                      {product.image_url && <img src={product.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold">{product.name}</h3>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-400">{product.short_description || product.category}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <button type="button" aria-label={`Diminuir quantidade de ${product.name}`} onClick={() => setSelected((current) => ({ ...current, [product.id]: { name: product.name, quantity: Math.max(0, (item?.quantity ?? 0) - 1), notes: item?.notes ?? "" } }))} className="h-9 w-9 rounded-lg border border-white/15 hover:bg-white/10">−</button>
                        <span className="min-w-5 text-center text-sm tabular-nums" aria-live="polite">{item?.quantity ?? 0}</span>
                        <button type="button" aria-label={`Aumentar quantidade de ${product.name}`} onClick={() => setSelected((current) => ({ ...current, [product.id]: { name: product.name, quantity: (item?.quantity ?? 0) + 1, notes: item?.notes ?? "" } }))} className="h-9 w-9 rounded-lg border border-white/15 hover:bg-white/10">+</button>
                        <span className="text-xs text-slate-400">un.</span>
                      </div>
                      {item && item.quantity > 0 && (
                        <label className="mt-2 block text-xs text-slate-400">Personalização / observações
                          <input value={item.notes} onChange={(event) => setSelected((current) => ({ ...current, [product.id]: { ...item, notes: event.target.value } }))} placeholder="Tamanho, material, detalhes…" className="mt-1 min-h-9 w-full rounded-lg border border-white/10 bg-black/20 px-2 text-xs text-white outline-none focus:border-cyan-300" />
                        </label>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="sticky bottom-3 mt-6 rounded-2xl border border-cyan-300/25 bg-[#0B1026]/95 p-4 shadow-2xl backdrop-blur">
            <p className="text-sm font-bold">{items.length} tipo(s) de produto · {totalUnits} unidade(s)</p>
            {formError && <p role="alert" className="mt-2 text-sm text-amber-200">{formError}</p>}
            <button type="button" onClick={openWhatsApp} disabled={!items.length} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#087CF0] to-[#7138F5] px-4 font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
              <MessageCircle className="h-5 w-5" /> Enviar orçamento pelo WhatsApp <Send className="h-4 w-4" />
            </button>
            <p className="mt-2 text-xs text-slate-400">Seus dados serão incluídos apenas na mensagem que você abrir para enviar pelo WhatsApp.</p>
          </div>

          <Link to="/produtos" className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-cyan-300">Ver catálogo completo →</Link>
        </div>
      </section>
    </StoreShell>
  );
}
