import { useState } from "react";
import { ArrowDown, ArrowRight, Code2, Laptop, MessageCircle, PenTool, Share2, Sparkles, Workflow, Zap, Printer, Palette, Globe, BadgeCheck, Clock3, ShieldCheck, ShoppingBag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type StoreProduct } from "@/components/storefront/ProductCard";
import { resolveProductImage } from "@/components/storefront/productImages";
import { useWaLink } from "@/hooks/useCompanyInfo";

const solutions = [
  {
    id: "tech",
    number: "01",
    title: "Suporte e manutenção",
    short: "Tecnologia funcionando sem complicação.",
    detail: "Diagnóstico, manutenção e suporte para computadores e ambientes digitais, com atendimento próximo e orientação clara.",
    Icon: Laptop,
    color: "from-[#087CF0] to-[#22D3EE]",
  },
  {
    id: "social",
    number: "02",
    title: "Social media",
    short: "Presença digital com intenção.",
    detail: "Planejamento e criação de conteúdo para fortalecer sua marca, conversar com seu público e manter seus canais ativos.",
    Icon: Share2,
    color: "from-[#22D3EE] to-[#7138F5]",
  },
  {
    id: "design",
    number: "03",
    title: "Design gráfico",
    short: "Uma marca que comunica com clareza.",
    detail: "Identidade visual e peças criativas alinhadas ao seu negócio, pensadas para funcionar em todos os pontos de contato.",
    Icon: PenTool,
    color: "from-[#7138F5] to-[#087CF0]",
  },
  {
    id: "dev",
    number: "04",
    title: "Programação",
    short: "Soluções digitais feitas para você.",
    detail: "Sites, ferramentas e automações planejadas para simplificar processos e abrir novas possibilidades para sua empresa.",
    Icon: Code2,
    color: "from-[#075BB5] to-[#6532C6]",
  },
];

export function DecodeLanding() {
  const [active, setActive] = useState(solutions[0]);
  const waLink = useWaLink();

  return (
    <div className="overflow-hidden bg-[#05070D] text-[#F8FAFC]">
      <section className="relative isolate mx-auto flex min-h-[650px] max-w-[1440px] items-center px-4 py-20 sm:px-8 lg:min-h-[760px] lg:px-16 lg:py-28">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -right-28 top-8 h-[28rem] w-[28rem] rounded-full bg-[#087CF0]/20 blur-[110px]" />
          <div className="absolute -left-40 bottom-0 h-[30rem] w-[30rem] rounded-full bg-[#7138F5]/20 blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(rgba(248,250,252,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(248,250,252,.4) 1px, transparent 1px)", backgroundSize: "56px 56px", maskImage: "linear-gradient(to bottom, black, transparent 85%)" }} />
        </div>
        <div className="grid w-full items-center gap-14 lg:grid-cols-[1.05fr_.95fr] lg:gap-20">
          <div className="max-w-3xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-semibold tracking-wide text-white/80 backdrop-blur">
              <Sparkles aria-hidden="true" className="h-4 w-4 text-[#22D3EE]" />
              Decode Analytics · Design & Soluções
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Boas ideias merecem
              <span className="mt-2 block bg-gradient-to-r from-[#22D3EE] via-[#087CF0] to-[#9C7BFF] bg-clip-text text-transparent">soluções à altura.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Tecnologia, design e comunicação conectados para ajudar seu negócio a dar o próximo passo — com clareza, criatividade e parceria.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href={waLink("Olá! Quero conversar sobre uma solução para o meu negócio.")} target="_blank" rel="noopener noreferrer" className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#075BB5] to-[#6532C6] px-6 text-sm font-bold text-white shadow-[0_12px_36px_rgba(8,124,240,.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_42px_rgba(113,56,245,.34)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#22D3EE]">
                Vamos conversar <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a href="#sobre" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 text-sm font-semibold text-white transition hover:border-[#22D3EE]/60 hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#22D3EE]">
                Conheça a Decode <ArrowDown aria-hidden="true" className="h-4 w-4 text-[#22D3EE]" />
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-xs font-medium text-slate-400">
              <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#22D3EE]" />Atendimento próximo</span>
              <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#087CF0]" />Soluções sob medida</span>
              <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#7138F5]" />Do planejamento à entrega</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[510px]">
            <div aria-hidden="true" className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-[#087CF0]/30 via-transparent to-[#7138F5]/30 blur-2xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#05070D] p-5 shadow-2xl sm:p-7">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300"><span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#22D3EE] shadow-[0_0_12px_#22D3EE]" /> Ideias em movimento</div>
                <span className="font-mono text-[10px] tracking-widest text-slate-500">DECODE ANALYTICS</span>
              </div>
              <div className="grid min-h-[330px] place-items-center py-7">
                <img src="/brand/decode-logo.png" alt="Decode Analytics — Design & Soluções" className="brand-logo h-auto max-h-[330px] w-full max-w-[390px] object-contain" />
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-xs text-slate-400">Criatividade com propósito.</span>
                <div aria-hidden="true" className="flex gap-1.5"><span className="h-1.5 w-7 rounded-full bg-[#087CF0]" /><span className="h-1.5 w-4 rounded-full bg-[#22D3EE]" /><span className="h-1.5 w-3 rounded-full bg-[#7138F5]" /></div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-2xl border border-white/10 bg-[#10162E] px-4 py-3 shadow-xl sm:flex">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#075BB5] to-[#6532C6]"><Workflow aria-hidden="true" className="h-5 w-5" /></span>
              <span><span className="block text-xs font-bold">Uma equipe, várias soluções</span><span className="mt-1 block text-[10px] text-slate-400">Tecnologia + criatividade</span></span>
            </div>
          </div>
        </div>
      </section>

            <section aria-label="Vantagens Decode Analytics" className="border-y border-white/10 bg-[#0B1026] px-4 py-7 sm:px-8 lg:px-16">
        <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-5 md:grid-cols-4">
          {[{ Icon: Clock3, title: "Atendimento direto", text: "Converse com nossa equipe" }, { Icon: BadgeCheck, title: "Qualidade profissional", text: "Atenção aos detalhes" }, { Icon: ShieldCheck, title: "Orçamento transparente", text: "Escopo combinado antes" }, { Icon: Zap, title: "Soluções integradas", text: "Design, gráfica e tecnologia" }].map(({ Icon, title, text }) => <div key={title} className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#22D3EE]/20 bg-[#22D3EE]/10 text-[#22D3EE]"><Icon className="h-5 w-5" /></span><div><h2 className="text-sm font-bold text-white">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-400">{text}</p></div></div>)}
        </div>
      </section>
      <section aria-labelledby="categorias-rapidas" className="bg-[#080C1F] px-4 py-12 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-[1280px]"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[.22em] text-[#22D3EE]">Explore por categoria</p><h2 id="categorias-rapidas" className="mt-2 text-2xl font-black text-white sm:text-3xl">Encontre sua solução</h2></div><a href="/produtos" className="text-sm font-bold text-[#22D3EE]">Ver catálogo completo →</a></div>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[{ title: "Gráfica rápida", category: "Cartões", Icon: Printer, color: "#22D3EE" }, { title: "Informática & TI", category: "Manutenção de Computadores", Icon: Laptop, color: "#087CF0" }, { title: "Social Media", category: "Social Media", Icon: Share2, color: "#7138F5" }, { title: "Design & marcas", category: "Design Gráfico", Icon: Palette, color: "#22D3EE" }, { title: "Sites & sistemas", category: "Programação", Icon: Globe, color: "#087CF0" }].map(({ title, category, Icon, color }) => <a key={title} href={`/produtos?cat=${encodeURIComponent(category)}`} className="group flex min-h-36 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center transition hover:-translate-y-1 hover:border-[#22D3EE]/50"><span className="grid h-14 w-14 place-items-center rounded-full border-2 bg-[#0B1026]" style={{ borderColor: color, color }}><Icon className="h-6 w-6" /></span><span className="mt-3 text-sm font-bold text-white">{title}</span><span className="mt-1 text-[11px] text-slate-400">Explorar catálogo</span></a>)}
          </div>
        </div>
      </section>

      <section id="sobre" aria-labelledby="sobre-title" className="scroll-mt-20 border-y border-white/[0.06] bg-[#0A0E1A] px-4 py-20 sm:px-8 lg:px-16 lg:py-28">
        <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-center lg:gap-20">
          <div>
            <p className="mb-3 text-xs font-extrabold uppercase tracking-[.24em] text-[#22D3EE]">Quem somos</p>
            <h2 id="sobre-title" className="font-display max-w-xl text-4xl font-bold leading-tight sm:text-5xl">A gente conecta pontos para revelar novos caminhos.</h2>
          </div>
          <div className="max-w-2xl">
            <p className="text-lg leading-8 text-slate-200">A Decode Analytics reúne serviços criativos e tecnológicos em um só parceiro. Entendemos o momento de cada negócio e aproximamos as frentes certas para transformar necessidades em soluções práticas.</p>
            <p className="mt-5 text-sm leading-7 text-slate-400">Da manutenção de computadores à presença nas redes, do design à programação: cada trabalho começa ouvindo você e buscando o que faz sentido para sua realidade.</p>
            <a href="#solucoes" className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#22D3EE] transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#22D3EE]">Explore nossas soluções <ArrowRight aria-hidden="true" className="h-4 w-4" /></a>
          </div>
        </div>
      </section>

      <section id="solucoes" aria-labelledby="solucoes-title" className="scroll-mt-20 bg-[#05070D] px-4 py-20 sm:px-8 lg:px-16 lg:py-28">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="mb-3 text-xs font-extrabold uppercase tracking-[.24em] text-[#087CF0]">O que fazemos</p>
              <h2 id="solucoes-title" className="font-display max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">Um parceiro para cada próximo passo.</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-400">Escolha uma solução e descubra como podemos ajudar seu negócio a avançar.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-[.9fr_1.1fr]">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {solutions.map(({ id, number, title, short, Icon }) => (
                <button key={id} type="button" onClick={() => setActive(solutions.find((item) => item.id === id)!)} aria-pressed={active.id === id} className={`group flex min-h-[92px] items-center gap-4 rounded-2xl border p-4 text-left transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22D3EE] ${active.id === id ? "border-[#087CF0]/55 bg-[#121A2D] shadow-[0_12px_32px_rgba(8,124,240,.12)]" : "border-white/10 bg-white/[0.025] hover:border-[#22D3EE]/35 hover:bg-white/[0.05]"}`}>
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${solutions.find((item) => item.id === id)!.color} text-white shadow-lg`}><Icon aria-hidden="true" className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-[10px] font-bold tracking-[.18em] text-slate-400">{number}</span><span className="mt-1 block text-sm font-extrabold text-white sm:text-base">{title}</span><span className="mt-1 block text-xs text-slate-400">{short}</span></span>
                  <ArrowRight aria-hidden="true" className={`h-4 w-4 shrink-0 transition ${active.id === id ? "translate-x-0 text-[#22D3EE]" : "-translate-x-1 text-slate-500 group-hover:translate-x-0"}`} />
                </button>
              ))}
            </div>
            <div aria-live="polite" className="relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0B1026] p-7 text-white sm:p-10">
              <div aria-hidden="true" className={`absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br ${active.color} opacity-25 blur-3xl transition-colors`} />
              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.18em] text-[#22D3EE]"><Zap aria-hidden="true" className="h-3.5 w-3.5" /> Solução {active.number}</span>
                <h3 className="font-display mt-7 text-3xl font-bold sm:text-4xl">{active.title}</h3>
                <p className="mt-4 max-w-lg text-sm leading-7 text-slate-300">{active.detail}</p>
              </div>
              <a href={waLink(`Olá! Quero saber mais sobre ${active.title.toLowerCase()}.`)} target="_blank" rel="noopener noreferrer" className="relative mt-8 inline-flex min-h-12 w-fit items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 text-sm font-bold transition hover:border-[#22D3EE]/60 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#22D3EE]">Falar sobre esta solução <ArrowRight aria-hidden="true" className="h-4 w-4 text-[#22D3EE]" /></a>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" aria-labelledby="processo-title" className="scroll-mt-20 border-y border-white/[0.06] bg-[#0A0E1A] px-4 py-20 sm:px-8 lg:px-16 lg:py-24">
        <div className="mx-auto grid max-w-[1280px] gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div><p className="mb-3 text-xs font-extrabold uppercase tracking-[.24em] text-[#7138F5]">Como trabalhamos</p><h2 id="processo-title" className="font-display text-4xl font-bold leading-tight sm:text-5xl">Do primeiro papo ao resultado.</h2><p className="mt-5 max-w-md text-sm leading-7 text-slate-400">A gente entende o seu momento, constrói a solução junto com você e acompanha cada etapa.</p></div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { n: "01", title: "Conte sua ideia", text: "Entendemos seus objetivos e desafios.", Icon: MessageCircle },
              { n: "02", title: "Desenhamos o caminho", text: "Definimos prioridades e próximos passos.", Icon: PenTool },
              { n: "03", title: "Tiramos do plano", text: "Colocamos a solução em prática com você.", Icon: Workflow },
            ].map(({ n, title, text, Icon }) => <article key={n} className="rounded-2xl border border-white/10 bg-[#101626] p-5 transition hover:-translate-y-1 hover:border-[#087CF0]/40 hover:shadow-lg"><span className="flex items-center justify-between"><span className="font-mono text-xs font-bold tracking-widest text-[#22D3EE]">{n}</span><Icon aria-hidden="true" className="h-5 w-5 text-[#9C7BFF]" /></span><h3 className="mt-8 text-base font-extrabold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-300">{text}</p></article>)}
          </div>
        </div>
      </section>

      <section aria-labelledby="vitrine-title" className="bg-[#0B1026] px-4 py-14 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-[1280px]"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[.22em] text-[#22D3EE]">Vitrine Decode</p><h2 id="vitrine-title" className="mt-2 text-2xl font-black text-white sm:text-3xl">Produtos e soluções em destaque</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Veja opções do nosso catálogo e solicite um orçamento para o que você precisa.</p></div><a href="/produtos" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-bold text-white hover:border-[#22D3EE]/60">Catálogo completo <ArrowRight className="h-4 w-4 text-[#22D3EE]" /></a></div><FeaturedProducts /></div>
      </section>
      
      <section aria-labelledby="catalogo-title" className="bg-[#05070D] px-4 py-16 sm:px-8 lg:px-16 lg:py-20">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-6 rounded-[1.75rem] border border-white/10 bg-gradient-to-r from-[#0D1424] via-[#10152A] to-[#171333] p-7 sm:p-10 md:flex-row md:items-center">
          <div><p className="mb-3 text-xs font-extrabold uppercase tracking-[.24em] text-[#22D3EE]">Conheça também</p><h2 id="catalogo-title" className="font-display text-3xl font-bold leading-tight sm:text-4xl">Produtos para levar suas ideias adiante.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Explore o catálogo disponível e encontre opções para o que você está planejando.</p></div>
          <a href="/produtos" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-5 text-sm font-bold text-white transition hover:border-[#22D3EE]/60 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#22D3EE]">Ver produtos <ArrowRight aria-hidden="true" className="h-4 w-4 text-[#22D3EE]" /></a>
        </div>
      </section>

      <section id="contato" aria-labelledby="contato-title" className="scroll-mt-20 px-4 pb-20 pt-4 sm:px-8 lg:px-16 lg:pb-28">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-8 rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-[#10162E] via-[#111A38] to-[#21154A] p-7 sm:p-10 md:flex-row md:items-center lg:p-14">
          <div><p className="mb-3 text-xs font-extrabold uppercase tracking-[.24em] text-[#22D3EE]">Vamos construir juntos</p><h2 id="contato-title" className="font-display max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">Seu próximo passo começa com uma conversa.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">Conte o que você precisa. Vamos encontrar a solução certa para o seu momento.</p></div>
          <a href={waLink("Olá! Quero conversar sobre os serviços da Decode Analytics.")} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-14 shrink-0 items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#075BB5] to-[#6532C6] px-6 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#22D3EE]">Fale com a Decode <MessageCircle aria-hidden="true" className="h-4 w-4" /></a>
        </div>
      </section>
    </div>
  );
}

function FeaturedProducts() {
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["store-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("id,name,slug,category,short_description,base_price,image_url,rating,reviews_count,min_quantity,badge,specs,unit").eq("active", true).order("reviews_count", { ascending: false }).limit(4);
      if (error) throw error;
      return (data ?? []).map((p) => ({ ...p, image_url: resolveProductImage(p.image_url, p.category, p.slug) })) as StoreProduct[];
    },
    staleTime: 60_000,
  });
  if (isLoading) return <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-4">{[0,1,2,3].map((n) => <div key={n} className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/5" />)}</div>;
  if (isError) return <div className="mt-7 rounded-xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-300">Não foi possível carregar a vitrine agora. <a href="/produtos" className="font-bold text-[#22D3EE]">Abrir catálogo</a></div>;
  if (!data.length) return <div className="mt-7 rounded-xl border border-dashed border-white/15 p-6 text-sm text-slate-300"><ShoppingBag className="mb-3 h-7 w-7 text-[#22D3EE]" />Estamos preparando nosso catálogo. Entre em contato para solicitar um orçamento.</div>;
  return <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-4">{data.map((product) => <ProductCard key={product.id} product={product} />)}</div>;
}
