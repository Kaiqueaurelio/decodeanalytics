import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { brl, fmtDate } from "@/lib/format";
import { toast } from "sonner";
import {
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Repeat,
  Send,
  MessageCircle,
  Copy,
  ExternalLink,
  Sparkles,
  Loader2,
  DollarSign,
  Users,
  Check,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/subscriptions")({
  component: SubscriptionsPage,
});

type StatusFilter = "todos" | "ativo" | "pendente" | "vencido";

export function SubscriptionsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [batchOpen, setBatchOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [targetMonth, setTargetMonth] = useState(currentMonth);

  // 1. Dados da empresa (PIX e WhatsApp)
  const { data: company } = useQuery({
    queryKey: ["company-settings-pix"],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_settings")
        .select("pix_key,whatsapp,company_name")
        .maybeSingle();
      return data;
    },
  });

  // 2. Contratos e assinaturas ativas com clientes
  const { data: contracts = [], isLoading: loadingContracts } = useQuery({
    queryKey: ["subscriptions-contracts"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("service_contracts" as any)
        .select(
          "*, clients(id,name,document,email,whatsapp), services(name,category)",
        )
        .order("updated_at", { ascending: false }) as any);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  // 3. Cobranças programadas / recebíveis vinculados a contratos
  const { data: receivables = [], isLoading: loadingReceivables } = useQuery({
    queryKey: ["subscriptions-receivables"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("receivables" as any)
        .select(
          "*, clients(id,name,document,email,whatsapp), service_contracts(id,title,number,amount,due_day,status)",
        )
        .not("service_contract_id", "is", null)
        .order("due_date", { ascending: true }) as any);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  // Mapear último e próximo recebível por contrato
  const contractsWithBilling = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return contracts.map((c) => {
      const contractRecs = receivables.filter((r) => r.service_contract_id === c.id);
      const pendingRecs = contractRecs.filter((r) => r.status === "pendente");
      const nextPending = pendingRecs.sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""))[0];
      const isOverdue = nextPending && nextPending.due_date && nextPending.due_date < todayStr;

      // Calcular próximo vencimento se não houver cobrança pendente lançada
      const dueDay = c.due_day || 10;
      let calculatedNextDue = "";
      const year = now.getFullYear();
      const month = now.getMonth();
      const thisMonthDue = new Date(year, month, dueDay);
      if (thisMonthDue >= now) {
        calculatedNextDue = thisMonthDue.toISOString().slice(0, 10);
      } else {
        calculatedNextDue = new Date(year, month + 1, dueDay).toISOString().slice(0, 10);
      }

      return {
        ...c,
        receivablesCount: contractRecs.length,
        nextReceivable: nextPending || null,
        nextDueDate: nextPending?.due_date || calculatedNextDue,
        isOverdue: Boolean(isOverdue),
        activeStatus: c.status === "aprovado" || c.status === "ativo" ? "ativo" : c.status,
      };
    });
  }, [contracts, receivables]);

  // Estatísticas de recorrência
  const stats = useMemo(() => {
    const active = contractsWithBilling.filter((c) => c.activeStatus === "ativo");
    const mrr = active.reduce((acc, c) => acc + Number(c.amount || 0), 0);
    const overdueCount = contractsWithBilling.filter((c) => c.isOverdue).length;
    const pendingTotal = receivables
      .filter((r) => r.status === "pendente")
      .reduce((acc, r) => acc + Number(r.amount || 0), 0);

    return {
      activeClientsCount: new Set(active.map((c) => c.client_id)).size,
      activeSubscriptionsCount: active.length,
      mrr,
      overdueCount,
      pendingTotal,
    };
  }, [contractsWithBilling, receivables]);

  // Filtragem dos clientes recorrentes
  const filteredContracts = useMemo(() => {
    return contractsWithBilling.filter((c) => {
      const matchesSearch =
        (c.clients?.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.services?.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.clients?.document || "").includes(search);

      if (!matchesSearch) return false;
      if (statusFilter === "ativo") return c.activeStatus === "ativo" && !c.isOverdue;
      if (statusFilter === "vencido") return c.isOverdue;
      if (statusFilter === "pendente") return c.activeStatus === "pendente" || c.activeStatus === "em_revisao";
      return true;
    });
  }, [contractsWithBilling, search, statusFilter]);

  // Enviar link de cobrança / PIX via WhatsApp com link pronto
  function sendPaymentLink(c: any, rec?: any) {
    const phone = String(c.clients?.whatsapp || "").replace(/\D/g, "");
    if (!phone) {
      toast.error("Cliente sem WhatsApp cadastrado. Atualize o telefone no cadastro.");
      return;
    }

    const pixKey = (company as any)?.pix_key?.trim();
    const amount = rec ? rec.amount : c.amount;
    const dueDate = rec?.due_date || c.nextDueDate;
    const formattedDue = dueDate ? fmtDate(dueDate) : "a combinar";

    const messageLines = [
      `🔔 *Cobrança Recorrente • Decode Analytics*`,
      ``,
      `Olá, *${c.clients?.name || "Cliente"}*! Tudo bem?`,
      `Sua assinatura do plano *${c.title}* está pronta para pagamento:`,
      ``,
      `💰 *Valor:* ${brl(amount)}`,
      `📅 *Vencimento:* ${formattedDue}`,
      pixKey ? `🔑 *Chave PIX:* \`${pixKey}\`` : `💳 Chave PIX informada no atendimento`,
      ``,
      `Após realizar a transferência, basta responder a esta mensagem com o comprovante.`,
      `Agradecemos pela parceria! 🚀`,
    ];

    const message = messageLines.join("\n");
    const waUrl = `https://wa.me/55${phone.replace(/^55/, "")}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
    toast.success("Mensagem com dados de pagamento preparada para o WhatsApp!");
  }

  // Copiar chave PIX
  function copyPixKey() {
    const key = (company as any)?.pix_key?.trim();
    if (!key) return toast.error("Chave PIX não configurada em Configurações.");
    navigator.clipboard.writeText(key);
    toast.success("Chave PIX copiada para a área de transferência!");
  }

  // Lançar cobranças automáticas para contratos ativos
  async function handleGenerateBatch() {
    if (!targetMonth) return toast.error("Selecione o mês de competência.");
    const [yStr, mStr] = targetMonth.split("-");
    const year = Number(yStr);
    const month = Number(mStr);

    setGenerating(true);
    try {
      const { data, error } = await (supabase.rpc as any)(
        "generate_monthly_contract_receivables",
        { p_year: year, p_month: month },
      );
      if (error) throw error;

      toast.success(
        `Cobranças geradas! ${data.created_count} nova(s) fatura(s) lançada(s) totalizando ${brl(data.total_amount)}.`,
      );
      setBatchOpen(false);
      qc.invalidateQueries({ queryKey: ["subscriptions-receivables"] });
      qc.invalidateQueries({ queryKey: ["receivables"] });
    } catch (err: any) {
      toast.error(err.message || "Falha ao gerar cobranças recorrentes.");
    } finally {
      setGenerating(false);
    }
  }

  // Baixa rápida de fatura recebida
  async function markAsPaid(rec: any) {
    if (!confirm(`Confirmar recebimento de ${brl(rec.amount)} para ${rec.clients?.name}?`)) return;

    const { error } = await (supabase.rpc as any)("settle_receivable_and_cash", {
      p_receivable_id: rec.id,
      p_payment_method: "pix",
    });

    if (error) return toast.error(error.message);
    toast.success("Cobrança baixada no caixa com sucesso!");
    qc.invalidateQueries({ queryKey: ["subscriptions-receivables"] });
    qc.invalidateQueries({ queryKey: ["receivables"] });
    qc.invalidateQueries({ queryKey: ["cash"] });
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#087CF0] to-[#7138F5] text-white shadow-lg">
              <Repeat className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                Clientes Recorrentes & Cobranças Programadas
              </h1>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Acompanhamento mensal de assinaturas ativas, próximos vencimentos e envio automático de links de pagamento.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copyPixKey}
            className="border-white/10 bg-white/5 hover:bg-white/10"
          >
            <Copy className="mr-1.5 h-3.5 w-3.5 text-cyan-400" />
            Chave PIX
          </Button>

          <Button
            onClick={() => setBatchOpen(true)}
            size="sm"
            className="bg-gradient-to-r from-[#087CF0] to-[#22D3EE] font-bold text-white shadow-md hover:brightness-110"
          >
            <Sparkles className="mr-1.5 h-4 w-4" />
            Lançar Mensalidades do Mês
          </Button>
        </div>
      </header>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="border-white/10 bg-[#0B1026] p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Receita Mensal (MRR)
            </span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-400 sm:text-3xl">
            {brl(stats.mrr)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            {stats.activeSubscriptionsCount} assinaturas ativas
          </p>
        </Card>

        <Card className="border-white/10 bg-[#0B1026] p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Clientes Ativos
            </span>
            <Users className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-cyan-400 sm:text-3xl">
            {stats.activeClientsCount}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            pagam mensalmente
          </p>
        </Card>

        <Card className="border-white/10 bg-[#0B1026] p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Faturas em Aberto
            </span>
            <Clock className="h-4 w-4 text-blue-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-white sm:text-3xl">
            {brl(stats.pendingTotal)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            a receber este mês
          </p>
        </Card>

        <Card className="border-white/10 bg-[#0B1026] p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Vencidas / Atraso
            </span>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-rose-400 sm:text-3xl">
            {stats.overdueCount}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            necessitam cobrança
          </p>
        </Card>
      </div>

      {/* Barra de Filtro e Busca */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, serviço ou documento..."
            className="pl-9 bg-background/60"
          />
        </div>

        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <TabsList className="bg-muted/60">
            <TabsTrigger value="todos">Todos ({contractsWithBilling.length})</TabsTrigger>
            <TabsTrigger value="ativo">Ativos</TabsTrigger>
            <TabsTrigger value="vencido">Com Atraso</TabsTrigger>
            <TabsTrigger value="pendente">Pendentes</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Lista de Clientes Recorrentes & Cobranças */}
      <div className="space-y-3">
        {loadingContracts || loadingReceivables ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2 text-cyan-400" />
            Carregando assinaturas e cobranças programadas...
          </div>
        ) : filteredContracts.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground border-dashed">
            <Repeat className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="font-semibold text-foreground">Nenhuma assinatura encontrada</p>
            <p className="text-xs mt-1 max-w-sm mx-auto">
              Cadastre contratos de prestação recorrente em "Contratos" ou crie serviços mensais.
            </p>
            <Link to="/contracts" className="mt-4 inline-flex items-center text-xs font-bold text-cyan-400 hover:underline">
              Ir para tela de Contratos →
            </Link>
          </Card>
        ) : (
          filteredContracts.map((c) => {
            const hasOverdue = c.isOverdue;
            const nextRec = c.nextReceivable;

            return (
              <Card
                key={c.id}
                className="overflow-hidden border-white/10 bg-[#0B1026] text-white shadow-md transition-all hover:border-[#22D3EE]/30"
              >
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Identificação do Cliente e Contrato */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-base text-white truncate">
                        {c.clients?.name || "Cliente sem nome"}
                      </h3>

                      {c.activeStatus === "ativo" ? (
                        <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Assinatura Ativa
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-500/40 text-amber-300">
                          {c.activeStatus}
                        </Badge>
                      )}

                      {hasOverdue && (
                        <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 font-bold">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Atraso no Pagamento
                        </Badge>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                      <span>Plano: <strong>{c.title}</strong></span>
                      {c.services?.name && <span>Serviço: {c.services.name}</span>}
                      {c.clients?.whatsapp && (
                        <span className="text-cyan-300">📱 {c.clients.whatsapp}</span>
                      )}
                    </div>
                  </div>

                  {/* Informações Financeiras e Próximo Vencimento */}
                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-4 border-t border-white/5 pt-3 sm:border-0 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        Valor Mensal
                      </p>
                      <p className="text-lg font-black text-cyan-400">
                        {brl(c.amount)}
                        <span className="text-xs font-normal text-slate-400">/mês</span>
                      </p>
                    </div>

                    <div className="text-left sm:text-right min-w-[120px]">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        Próximo Vencimento
                      </p>
                      <p className={`text-sm font-bold flex items-center sm:justify-end gap-1 ${hasOverdue ? "text-rose-400" : "text-white"}`}>
                        <CalendarClock className="h-3.5 w-3.5" />
                        {c.nextDueDate ? fmtDate(c.nextDueDate) : `Dia ${c.due_day || 10}`}
                      </p>
                    </div>

                    {/* Ações Rápidas */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => sendPaymentLink(c, nextRec)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow"
                        title="Enviar link e chave PIX por WhatsApp"
                      >
                        <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                        Cobrar via WhatsApp
                      </Button>

                      {nextRec && nextRec.status === "pendente" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsPaid(nextRec)}
                          className="border-white/15 bg-white/5 hover:bg-white/10 text-white"
                          title="Confirmar recebimento e lançar no caixa"
                        >
                          <Check className="h-3.5 w-3.5 text-cyan-400 mr-1" />
                          Dar Baixa
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal de Lançamento em Lote */}
      <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
        <DialogContent className="w-[calc(100%-1rem)] max-w-md bg-[#0B1026] text-white border-white/15">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Sparkles className="h-5 w-5 text-cyan-400" />
              Lançar Mensalidades em Lote
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Gera automaticamente as faturas do mês de competência para todos os contratos ativos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div>
              <Label className="text-slate-300">Mês de Competência</Label>
              <Input
                type="month"
                value={targetMonth}
                onChange={(e) => setTargetMonth(e.target.value)}
                className="mt-1 bg-white/5 border-white/15 text-white"
              />
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300 space-y-1">
              <p>• Contratos ativos elegíveis: <strong>{stats.activeSubscriptionsCount}</strong></p>
              <p>• Previsão total a faturar: <strong className="text-emerald-400">{brl(stats.mrr)}</strong></p>
              <p className="text-slate-400 text-[11px] pt-1">
                Cobranças já lançadas anteriormente para o mesmo mês serão ignoradas automaticamente para evitar duplicidade.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setBatchOpen(false)}
              className="border-white/15 bg-transparent text-white hover:bg-white/10"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGenerateBatch}
              disabled={generating}
              className="bg-gradient-to-r from-[#087CF0] to-[#22D3EE] font-bold text-white shadow hover:brightness-110"
            >
              {generating && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Confirmar e Gerar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
