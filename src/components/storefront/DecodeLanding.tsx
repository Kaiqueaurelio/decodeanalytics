import { ArrowDown, ArrowRight, ArrowUpRight, Code2, Database, Laptop, MessageCircle, PenTool, Smartphone, Sparkles, Workflow, Zap, Layers3, ShieldCheck, Compass, Printer, Palette, Globe, BadgeCheck, Clock3, ShoppingBag } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { resolveProductImage } from "@/components/storefront/productImages";
import { brl, STORE_CATEGORIES } from "@/components/storefront/tokens";
import { useWaLink } from "@/hooks/useCompanyInfo";

const technology = [
  { title: "Criação de sites", description: "Presença digital responsiva, pensada para apresentar sua marca e facilitar o contato.", Icon: Code2, query: "Criação de Sites", tag: "WEB" },
  { title: "Criação de aplicativos", description: "Aplicações digitais alinhadas ao seu projeto, às pessoas que vão usar e aos seus objetivos.", Icon: Smartphone, query: "Criação de Apps", tag: "MOBILE" },
  { title: "Suporte para computadores", description: "Formatação com ou sem backup para computadores e notebooks.", Icon: Laptop, query: "Formatação de Computadores", tag: "SUPORTE" },
  { title: "Formatação Android e iOS", description: "Serviços de sistema para celulares, com escopo combinado antes do atendimento.", Icon: ShieldCheck, query: "Formatação de Android", tag: "MOBILE CARE" },
  { title: "Office 365", description: "Licença de produtividade apresentada no catálogo. Consulte disponibilidade e condições.", Icon: Database, query: "Office 365", tag: "SOFTWARE" },
  { title: "Produtos digitais e templates", description: "Planners, materiais de estudo e templates digitais para organizar projetos e rotinas.", Icon: Workflow, query: "Template", tag: "DIGITAL" },
];

const creative = [
  { title: "Design & identidade visual", description: "Uma identidade coerente, reconhecível e preparada para os diferentes pontos de contato.", Icon: PenTool },
  { title: "Conteúdo e social media", description: "Planejamento e peças criativas para marcas que querem comunicar com intenção.", Icon: Layers3 },
  { title: "Produtos personalizados", description: "Canecas, copos térmicos, camisetas, adesivos, cartões, convites e materiais impressos.", Icon: Sparkles },
];

const steps = [
  { n: "01", title: "Entendemos o contexto", text: "Escutamos sua ideia, seu desafio e o que precisa melhorar." },
  { n: "02", title: "Desenhamos a solução", text: "Alinhamos escopo, prioridades e o caminho mais adequado." },
  { n: "03", title: "Construímos com propósito", text: "Transformamos o plano em uma entrega clara, útil e consistente." },
];

export function DecodeLanding() {
  const waLink = useWaLink();

  return (
    <div className="overflow-hidden bg-[#080C1F] text-[#F8FAFC]">
      <section aria-label="Vantagens Decode Analytics" className="border-y border-white/10 bg-[#0B1026] px-4 py-6 sm:px-8">
        <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-5 md:grid-cols-4">
          {[{ Icon: Clock3, title: "Atendimento direto", text: "Converse com nossa equipe" }, { Icon: BadgeCheck, title: "Qualidade profissional", text: "Atenção aos detalhes" }, { Icon: Zap, title: "Soluções integradas", text: "Design, impressão e TI" }, { Icon: ShieldCheck, title: "Orçamento transparente", text: "Escopo combinado antes" }].map(({ Icon, title, text }) => <div key={title} className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#22D3EE]/20 bg-[#22D3EE]/10 text-[#22D3EE]"><Icon className="h-5 w-5" /></span>
            <div><h2 className="text-sm font-bold text-white">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-400">{text}</p></div>
          </div>)}
        </div>
      </section>
      <section className="bg-[#080C1F] px-4 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-[1280px]">
          <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-[#22D3EE]">Explore por categoria</p><h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Encontre sua solução</h2></div><Link to="/produtos" className="text-sm font-bold text-[#22D3EE]">Ver todas →</Link></div>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[{ title: "Gráfica rápida", category: "Impressão e Acabamentos", Icon: Printer, color: "#22D3EE" }, { title: "Informática & TI", category: "Suporte Técnico", Icon: Laptop, color: "#087CF0" }, { title: "Social media", category: "Design e Marketing", Icon: Layers3, color: "#7138F5" }, { title: "Design & marcas", category: "Design e Marketing", Icon: Palette, color: "#22D3EE" }, { title: "Sites & sistemas", category: "Desenvolvimento Digital", Icon: Globe, color: "#087CF0" }].map(({ title, category, Icon, color }) => <Link key={title} to="/produtos" search={{ cat: category }} className="group flex min-h-36 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center transition hover:-translate-y-1 hover:border-[#22D3EE]/50">
              <span className="grid h-14 w-14 place-items-center rounded-full border-2 bg-[#0B1026] text-[#22D3EE]" style={{ borderColor: color, color }}><Icon className="h-6 w-6" /></span><span className="mt-3 text-sm font-bold text-white">{title}</span><span className="mt-1 text-[11px] text-slate-400">Explorar catálogo</span>
            </Link>)}
          </div>
        </div>
      </section>
      <FeaturedCatalog />

      <section className="relative isolate px-4 pb-16 pt-14 sm:px-8 sm:pb-20 sm:pt-20 lg:px-16 lg:pb-24 lg:pt-24">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -right-28 top-8 h-[28rem] w-[28rem] rounded-full bg-[#087CF0]/20 blur-[110px]" />
          <div className="absolute -left-40 bottom-0 h-[30rem] w-[30rem] rounded-full bg-[#7138F5]/20 blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(rgba(248,250,252,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(248,250,252,.4) 1px, transparent 1px)", backgroundSize: "56px 56px", maskImage: "linear-gradient(to bottom, black, transparent 85%)" }} />
        </div>
        <div className="mx-auto grid w-full max-w-[1280px] items-center gap-12 lg:grid-cols-[1.1fr_.9fr] lg:gap-16">
          <div className="max-w-3xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-semibold tracking-wide text-white/80 backdrop-blur">
              <Sparkles className="h-4 w-4 text-[#22D3EE]" /> Decode Analytics · Design & soluções digitais
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Do conceito
              <span className="mt-2 block bg-gradient-to-r from-[#22D3EE] via-[#087CF0] to-[#9C7BFF] bg-clip-text text-transparent">ao código.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Unimos tecnologia, dados e criatividade para transformar ideias em experiências digitais úteis — e marcas em presenças que fazem sentido.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href={waLink("Olá! Quero conversar sobre uma solução para meu negócio com a Decode Analytics.")} target="_blank" rel="noopener noreferrer" className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#087CF0] to-[#7138F5] px-6 text-sm font-bold text-white shadow-[0_12px_36px_rgba(8,124,240,.28)] transition duration-300 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#22D3EE]">
                Vamos conversar <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a href="#tecnologia" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 text-sm font-semibold text-white transition hover:border-[#22D3EE]/60 hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#22D3EE]">
                Explore as soluções <ArrowDown className="h-4 w-4 text-[#22D3EE]" />
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-xs font-medium text-slate-400">
              <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE]" />Tecnologia com propósito</span>
              <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#087CF0]" />Soluções sob medida</span>
              <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#7138F5]" />Do planejamento à entrega</span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[500px]">
            <div aria-hidden="true" className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-[#087CF0]/30 via-transparent to-[#7138F5]/30 blur-2xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#05060B] p-5 shadow-2xl sm:p-7">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300"><span className="h-2 w-2 rounded-full bg-[#22D3EE] shadow-[0_0_12px_#22D3EE]" /> Decode Studio</div>
                <span className="font-mono text-[10px] tracking-widest text-slate-500">IDEA → IMPACT</span>
              </div>
              <div className="grid min-h-[280px] place-items-center py-7 sm:min-h-[330px]">
                <img src="/brand/decode-logo.svg" alt="Decode Analytics — Design & Soluções" className="brand-logo h-auto max-h-[280px] w-full max-w-[390px] object-contain sm:max-h-[330px]" />
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-xs text-slate-400">Sua ideia. Nossa tecnologia. Resultados reais.</span>
                <div className="flex gap-1.5"><span className="h-1.5 w-7 rounded-full bg-[#087CF0]" /><span className="h-1.5 w-4 rounded-full bg-[#22D3EE]" /><span className="h-1.5 w-3 rounded-full bg-[#7138F5]" /></div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-2xl border border-white/10 bg-[#10162E] px-4 py-3 shadow-xl sm:flex">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#087CF0] to-[#7138F5]"><Workflow className="h-5 w-5" /></span>
              <span><span className="block text-xs font-bold">Uma ideia, muitos caminhos</span><span className="mt-1 block text-[10px] text-slate-400">Tecnologia + criatividade</span></span>
            </div>
          </div>
        </div>
      </section>

      <section id="tecnologia" className="scroll-mt-24 border-y border-white/[0.07] bg-[#0B1026] px-4 py-16 sm:px-8 sm:py-20 lg:px-16 lg:py-24">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="mb-3 text-xs font-extrabold uppercase tracking-[.24em] text-[#22D3EE]">Comece por aqui · tecnologia em primeiro lugar</p>
              <h2 className="font-display max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">Soluções digitais para tirar ideias do papel.</h2>
            </div>
            <a href="/produtos?cat=Desenvolvimento%20Digital" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#7DD3FC] transition hover:text-white">Ver catálogo completo <ArrowUpRight className="h-4 w-4" /></a>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {technology.map(({ title, description, Icon, query, tag }, index) => (
              <article key={title} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#111A38] to-[#0B1026] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#22D3EE]/40 hover:shadow-[0_18px_50px_rgba(8,124,240,.12)] sm:p-6">
                <div aria-hidden="true" className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#087CF0]/10 blur-2xl transition group-hover:bg-[#7138F5]/20" />
                <div className="relative flex items-start justify-between gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-xl border border-[#22D3EE]/20 bg-[#22D3EE]/10 text-[#67E8F9]"><Icon className="h-5 w-5" /></span>
                  <span className="font-mono text-[10px] tracking-[.18em] text-slate-500">{tag} / 0{index + 1}</span>
                </div>
                <h3 className="relative mt-6 text-lg font-extrabold text-white">{title}</h3>
                <p className="relative mt-2 min-h-[66px] text-sm leading-6 text-slate-300">{description}</p>
                <a href={`/produtos?q=${encodeURIComponent(query)}`} className="relative mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#7DD3FC] transition group-hover:text-white">Explorar solução <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></a>
              </article>
            ))}
          </div>
          <p className="mt-5 text-xs leading-5 text-slate-500">Os serviços são apresentados por categoria; escopo, disponibilidade e valores são confirmados no atendimento.</p>
        </div>
      </section>

      <section id="sobre" className="scroll-mt-24 px-4 py-16 sm:px-8 sm:py-20 lg:px-16 lg:py-28">
        <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-center lg:gap-16">
          <div>
            <p className="mb-3 text-xs font-extrabold uppercase tracking-[.24em] text-[#9C7BFF]">Quem somos</p>
            <h2 className="font-display text-4xl font-bold leading-tight sm:text-5xl">Tecnologia é ferramenta. <span className="text-[#22D3EE]">Impacto é o objetivo.</span></h2>
          </div>
          <div className="space-y-5 text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">
            <p>A <strong className="text-white">Decode Analytics</strong> é uma marca de design e soluções digitais que conecta programação, tecnologia, dados e comunicação. Acreditamos que uma boa solução começa ouvindo, entendendo o contexto e escolhendo a ferramenta certa — não complicando o que pode ser simples.</p>
            <p>Trabalhamos do conceito à execução: sites e aplicativos, suporte de sistemas, experiências visuais, conteúdo para marcas e produtos digitais. Cada projeto tem um propósito diferente; por isso, buscamos construir caminhos claros, funcionais e adequados a quem vai usar.</p>
            <div className="grid gap-3 pt-2 sm:grid-cols-3">
              {[{ title: "Clareza", text: "Comunicação direta e escopo alinhado." }, { title: "Intenção", text: "Design e tecnologia a serviço de uma necessidade." }, { title: "Evolução", text: "Soluções pensadas para crescer com você." }].map((item) => <div key={item.title} className="rounded-xl border border-white/10 bg-white/[0.035] p-4"><h3 className="text-sm font-extrabold text-white">{item.title}</h3><p className="mt-1 text-xs leading-5 text-slate-400">{item.text}</p></div>)}
            </div>
          </div>
        </div>
      </section>

      <section id="criatividade" className="scroll-mt-24 bg-[#F3F6FC] px-4 py-16 text-[#0B1026] sm:px-8 sm:py-20 lg:px-16 lg:py-24">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-9 max-w-2xl">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-[.24em] text-[#087CF0]">Além da tecnologia</p>
            <h2 className="font-display text-3xl font-bold leading-tight sm:text-4xl">Criatividade que conversa com o mundo real.</h2>
            <p className="mt-4 text-sm leading-6 text-slate-600">Design, comunicação e personalização completam o ecossistema de soluções da Decode.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {creative.map(({ title, description, Icon }) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#E7F4FF] text-[#087CF0]"><Icon className="h-5 w-5" /></span><h3 className="mt-5 text-lg font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></article>)}
          </div>
          <div className="mt-7 flex flex-col justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
            <div><p className="font-extrabold">Explore o catálogo oficial</p><p className="mt-1 text-sm text-slate-600">Confira produtos, materiais digitais e serviços publicados.</p></div>
            <a href="https://wa.me/c/5511939223885" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#087CF0] px-5 text-sm font-extrabold text-white transition hover:bg-[#0666C8]">Abrir catálogo <ArrowUpRight className="h-4 w-4" /></a>
          </div>
        </div>
      </section>

      <section id="processo" className="scroll-mt-24 px-4 py-16 sm:px-8 sm:py-20 lg:px-16 lg:py-24">
        <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div><p className="mb-3 text-xs font-extrabold uppercase tracking-[.24em] text-[#22D3EE]">Como trabalhamos</p><h2 className="font-display text-4xl font-bold leading-tight sm:text-5xl">Do primeiro papo ao próximo passo.</h2><p className="mt-5 max-w-md text-sm leading-7 text-slate-300">Um processo simples, com expectativas alinhadas e espaço para construir a solução junto com você.</p></div>
          <div className="grid gap-3 sm:grid-cols-3">
            {steps.map((step) => <article key={step.n} className="rounded-2xl border border-white/10 bg-[#10162E] p-5 transition hover:-translate-y-1 hover:border-[#087CF0]/50"><span className="font-mono text-xs font-bold tracking-widest text-[#22D3EE]">{step.n}</span><h3 className="mt-7 text-base font-extrabold text-white">{step.title}</h3><p className="mt-2 text-sm leading-6 text-slate-300">{step.text}</p></article>)}
          </div>
        </div>
      </section>

      <section id="contato" className="scroll-mt-24 px-4 pb-20 pt-4 sm:px-8 lg:px-16 lg:pb-28">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-8 rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-[#10162E] via-[#111A38] to-[#21154A] p-7 sm:p-10 md:flex-row md:items-center lg:p-14">
          <div><p className="mb-3 text-xs font-extrabold uppercase tracking-[.24em] text-[#22D3EE]">Sua ideia começa aqui</p><h2 className="font-display max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">Sua ideia. Nossa tecnologia. Resultados reais.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">Conte o que você quer criar, resolver ou melhorar. Vamos conversar sobre o caminho certo para o seu projeto.</p></div>
          <a href={waLink("Olá! Quero conversar sobre um projeto com a Decode Analytics.")} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-14 shrink-0 items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#087CF0] to-[#7138F5] px-6 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#22D3EE]">Fale com a Decode <MessageCircle className="h-4 w-4" /></a>
        </div>
      </section>
    </div>
  );
}

function FeaturedCatalog() {
  const { data = [], isLoading } = useQuery({ queryKey: ["homepage-featured-catalog"], queryFn: async () => { const { data, error } = await supabase.from("services").select("id,name,slug,category,short_description,base_price,image_url,reviews_count,active").eq("active", true).order("reviews_count", { ascending: false }).limit(8); if (error) throw error; return (data ?? []).map((p: any) => ({ ...p, image_url: resolveProductImage(p.image_url, p.category, p.slug) })); }, staleTime: 60_000 });
  return <section className="bg-[#0B1026] px-4 py-14 sm:px-8"><div className="mx-auto max-w-[1280px]"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-[#22D3EE]">Vitrine Decode</p><h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Produtos e soluções em destaque</h2><p className="mt-2 text-sm text-slate-400">Explore o catálogo e solicite um orçamento para seu projeto.</p></div><Link to="/produtos" className="text-sm font-bold text-[#22D3EE]">Catálogo completo →</Link></div>
    {isLoading ? <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-4">{[0,1,2,3].map(i => <div key={i} className="h-64 animate-pulse rounded-2xl bg-white/5" />)}</div> : data.length ? <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-4">{data.map((p: any) => <article key={p.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#080C1F] transition hover:border-[#22D3EE]/40"><Link to="/produtos" search={{ q: p.name }} className="block"><div className="relative aspect-[4/3] overflow-hidden bg-white/5">{p.image_url ? <img src={p.image_url} alt={p.name} loading="lazy" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><ShoppingBag className="h-9 w-9 text-[#22D3EE]" /></div>}<span className="absolute left-3 top-3 rounded-full bg-[#080C1F]/90 px-2 py-1 text-[10px] font-bold text-[#22D3EE]">{p.category || "Solução"}</span></div><div className="p-4"><h3 className="line-clamp-2 min-h-10 text-sm font-bold text-white">{p.name}</h3><p className="mt-2 line-clamp-2 min-h-9 text-xs text-slate-400">{p.short_description || "Consulte detalhes e opções disponíveis."}</p><p className="mt-3 text-xs font-semibold text-slate-300">{Number(p.base_price || 0) > 0 ? brl(Number(p.base_price)) : "Preço sob consulta"}</p></div></Link><div className="px-4 pb-4"><Link to="/orcamento" className="flex min-h-10 items-center justify-center rounded-lg bg-gradient-to-r from-[#087CF0] to-[#7138F5] px-3 text-xs font-extrabold text-white">Solicitar orçamento</Link></div></article>)}</div> : <div className="mt-7 rounded-2xl border border-dashed border-white/15 p-8 text-center"><ShoppingBag className="mx-auto h-8 w-8 text-[#22D3EE]" /><p className="mt-3 text-sm font-semibold text-white">Cadastre produtos para exibi-los nesta vitrine.</p><Link to="/admin-produtos" className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-[#087CF0] px-4 text-sm font-bold text-white">Cadastrar produtos</Link></div>}
  </div></section>;
}
