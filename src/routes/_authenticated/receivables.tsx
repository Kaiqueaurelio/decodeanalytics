import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Check,
  AlertTriangle,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  Search,
  Wallet,
  Sparkles,
  Repeat,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/receivables")({ component: Page });

type Bucket = "overdue" | "today" | "week" | "month" | "future" | "paid";

const BUCKET_META: Record<Bucket, { label: string; tone: string; icon: any; help: string }> = {
  overdue: {
    label: "Vencidas",
    tone: "border-red-200 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
    icon: AlertTriangle,
    help: "Cobrar com urgência",
  },
  today: {
    label: "Vencem hoje",
    tone: "border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    icon: Clock,
    help: "Acompanhe o dia",
  },
  week: {
    label: "Próximos 7 dias",
    tone: "border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    icon: CalendarClock,
    help: "Semana atual",
  },
  month: {
    label: "Este mês",
    tone: "border-violet-200 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
    icon: Calendar,
    help: "Vencimentos do mês",
  },
  future: {
    label: "Futuros",
    tone: "border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800",
    icon: Calendar,
    help: "Mais para frente",
  },
  paid: {
    label: "Recebidos",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    icon: CheckCircle2,
    help: "Já pagos",
  },
};

function bucketOf(r: any): Bucket {
  if (r.status === "pago") return "paid";
  if (!r.due_date) return "future";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${r.due_date}T00:00:00`);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  if (diffDays <= 7) return "week";
  if (diffDays <= 30) return "month";
  return "future";
}

function Page() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<Bucket | "all">("all");

  // Estado da geração mensal em lote de contratos
  const [batchOpen, setBatchOpen] = useState(false);
  const [targetMonth, setTargetMonth] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [generating, setGenerating] = useState(false);

  const { data } = useQuery({
    queryKey: ["receivables"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("receivables" as any)
        .select("*, clients(name, whatsapp), orders(number), service_contracts(id, number, title, due_day)")
        .order("due_date", { ascending: true }) as any);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  // Busca contratos ativos para prévia de geração
  const { data: activeContracts = [] } = useQuery({
    queryKey: ["active-contracts-for-billing"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("service_contracts" as any)
        .select("id, number, title, amount, due_day, client_id, start_date, end_date, clients(name)")
        .in("status", ["aprovado", "ativo"])
        .in("billing_mode", ["mensal_fixo", "misto"])
        .order("number") as any);
      if (error) return [];
      return data ?? [];
    },
    enabled: batchOpen,
  });

  // Contratos que ainda não tiveram cobrança gerada para o mês selecionado
  const unbilledContracts = useMemo(() => {
    if (!activeContracts.length) return [];
    const competence = `${targetMonth}-01`;
    const existingContractIds = new Set(
      (data ?? [])
        .filter((r) => r.service_contract_id && r.competence_month?.startsWith(targetMonth))
        .map((r) => r.service_contract_id),
    );
    return activeContracts.filter((c: any) => !existingContractIds.has(c.id));
  }, [activeContracts, data, targetMonth]);

  const totalUnbilledAmount = useMemo(
    () => unbilledContracts.reduce((acc, c: any) => acc + Number(c.amount || 0), 0),
    [unbilledContracts],
  );

  async function handleGenerateBatch() {
    if (!targetMonth) return toast.error("Selecione o mês de competência.");
    setGenerating(true);

    const [yearStr, monthStr] = targetMonth.split("-");
    const p_year = parseInt(yearStr, 10);
    const p_month = parseInt(monthStr, 10);

    try {
      // 1. Tenta executar via RPC Postgres
      const { data: rpcRes, error: rpcErr } = await (supabase.rpc as any)(
        "generate_monthly_contract_receivables",
        { p_year, p_month },
      );

      if (!rpcErr && rpcRes) {
        toast.success(
          `${rpcRes.created_count} cobrança(s) mensal(is) gerada(s) para ${p_month}/${p_year}! (Total: ${brl(rpcRes.total_amount)})`,
        );
        setBatchOpen(false);
        qc.invalidateQueries({ queryKey: ["receivables"] });
        return;
      }
    } catch {
      // Prossegue para o fallback caso a RPC não esteja implantada
    }

    // 2. Fallback direto via Supabase client
    try {
      if (!unbilledContracts.length) {
        toast.info("Todos os contratos ativos já foram lançados para este mês!");
        setBatchOpen(false);
        return;
      }

      const daysInMonth = new Date(p_year, p_month, 0).getDate();
      const competenceDate = `${targetMonth}-01`;

      const inserts = unbilledContracts.map((c: any) => {
        let day = Number(c.due_day) || 10;
        if (day > daysInMonth) day = daysInMonth;
        if (day < 1) day = 1;
        const dueFormatted = `${targetMonth}-${String(day).padStart(2, "0")}`;

        return {
          client_id: c.client_id,
          service_contract_id: c.id,
          competence_month: competenceDate,
          due_date: dueFormatted,
          amount: Number(c.amount) || 0,
          status: "pendente",
          notes: `Mensalidade ${String(p_month).padStart(2, "0")}/${p_year} - Contrato #${c.number} (${c.title})`,
        };
      });

      const { error: insertErr } = await (supabase.from("receivables" as any).insert(inserts) as any);
      if (insertErr) throw insertErr;

      toast.success(
        `${inserts.length} cobrança(s) gerada(s) com sucesso para ${p_month}/${p_year}! Total: ${brl(totalUnbilledAmount)}`,
      );
      setBatchOpen(false);
      qc.invalidateQueries({ queryKey: ["receivables"] });
    } catch (err: any) {
      toast.error("Erro ao gerar mensalidades: " + err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function markPaid(r: any) {
    if (!confirm(`Confirmar recebimento de ${brl(r.amount)} e lançar baixa no caixa?`)) return;

    const contractNumber = r.service_contracts?.number;
    const contractTitle = r.service_contracts?.title;
    const description = contractNumber
      ? `Pagamento contrato #${contractNumber}${contractTitle ? ` · ${contractTitle}` : ""}`
      : `Pagamento OS #${r.orders?.number ?? ""}`;

    const category = contractNumber ? "Pagamento de contrato" : "Pagamento de OS";

    const updates: any[] = [
      supabase
        .from("receivables")
        .update({ status: "pago", paid_at: new Date().toISOString() })
        .eq("id", r.id),
      supabase.from("cash_entries").insert({
        type: "entrada",
        description,
        category,
        amount: r.amount,
        client_id: r.client_id,
        order_id: r.order_id,
        receivable_id: r.id,
        payment_method: r.payment_method || "pix",
      }),
    ];

    if (r.order_id) {
      const { data: o } = await supabase
        .from("orders")
        .select("paid,total")
        .eq("id", r.order_id)
        .single();
      if (o)
        updates.push(supabase.from("orders").update({ paid: o.total }).eq("id", r.order_id) as any);
    }

    const results = await Promise.all(updates);
    const err = results.find((x: any) => x.error);
    if (err) return toast.error((err as any).error.message);

    toast.success("Recebimento confirmado e baixado no caixa!");
    qc.invalidateQueries({ queryKey: ["receivables"] });
    qc.invalidateQueries({ queryKey: ["cash"] });
    qc.invalidateQueries({ queryKey: ["orders"] });
  }

  const enriched = useMemo(
    () =>
      (data ?? []).map((r) => ({
        ...r,
        bucket: bucketOf(r),
      })),
    [data],
  );

  const buckets = useMemo(() => {
    const acc: Record<Bucket, { rows: any[]; total: number }> = {
      overdue: { rows: [], total: 0 },
      today: { rows: [], total: 0 },
      week: { rows: [], total: 0 },
      month: { rows: [], total: 0 },
      future: { rows: [], total: 0 },
      paid: { rows: [], total: 0 },
    };
    for (const r of enriched) {
      acc[r.bucket as Bucket].rows.push(r);
      acc[r.bucket as Bucket].total += Number(r.amount || 0);
    }
    return acc;
  }, [enriched]);

  const totalPending =
    buckets.overdue.total +
    buckets.today.total +
    buckets.week.total +
    buckets.month.total +
    buckets.future.total;

  const orderedBuckets: Bucket[] = ["overdue", "today", "week", "month", "future", "paid"];

  const visibleRows = enriched.filter((r) => {
    const matchBucket = active === "all" || r.bucket === active;
    if (!matchBucket) return false;
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      String(r.clients?.name || "")
        .toLowerCase()
        .includes(term) ||
      String(r.orders?.number || "").includes(term) ||
      String(r.service_contracts?.number || "").includes(term) ||
      String(r.service_contracts?.title || "")
        .toLowerCase()
        .includes(term) ||
      String(r.notes || "")
        .toLowerCase()
        .includes(term)
    );
  });

  const grouped = useMemo(() => {
    const g: Record<Bucket, any[]> = {
      overdue: [],
      today: [],
      week: [],
      month: [],
      future: [],
      paid: [],
    };
    for (const r of visibleRows) g[r.bucket as Bucket].push(r);
    return g;
  }, [visibleRows]);

  return (
    <div className="space-y-4">
      {/* Header com Totais Destacados */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        <Card className="p-4 sm:p-5 bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wide opacity-90">Vencidas</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black">{brl(buckets.overdue.total)}</p>
          <p className="text-xs mt-1 opacity-90">{buckets.overdue.rows.length} cobrança(s)</p>
        </Card>
        <Card className="p-4 sm:p-5 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wide opacity-90">
              A receber (total pendente)
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black">{brl(totalPending)}</p>
          <p className="text-xs mt-1 opacity-90">
            {buckets.overdue.rows.length +
              buckets.today.rows.length +
              buckets.week.rows.length +
              buckets.month.rows.length +
              buckets.future.rows.length}{" "}
            pendente(s)
          </p>
        </Card>
        <Card className="p-4 sm:p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-sm sm:col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wide opacity-90">
              Já recebidas
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black">{brl(buckets.paid.total)}</p>
          <p className="text-xs mt-1 opacity-90">{buckets.paid.rows.length} cobrança(s)</p>
        </Card>
      </div>

      {/* Barra de Ações: Busca, Lançar Mensalidades e Filtros */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, OS ou contrato..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Botão de Lançar Mensalidades de Contratos com 1 Clique */}
        <Button
          onClick={() => setBatchOpen(true)}
          className="bg-primary text-primary-foreground shadow-sm flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <span>Lançar cobranças do mês</span>
        </Button>
      </div>

      {/* Filtros em Abas Touch-Friendly */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActive("all")}
          className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
            active === "all"
              ? "border-primary bg-primary text-primary-foreground"
              : "bg-card hover:border-primary/40 text-muted-foreground"
          }`}
        >
          Todos ({data?.length ?? 0})
        </button>
        {orderedBuckets.map((b) => {
          const meta = BUCKET_META[b];
          const n = buckets[b].rows.length;
          return (
            <button
              key={b}
              onClick={() => setActive(active === b ? "all" : b)}
              className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                active === b
                  ? "border-primary bg-primary text-primary-foreground"
                  : `${meta.tone} hover:brightness-95`
              }`}
            >
              {meta.label} · {n}
            </button>
          );
        })}
      </div>

      {/* Lista agrupada em cards responsivos */}
      <div className="space-y-4">
        {orderedBuckets.map((b) => {
          const rows = grouped[b];
          if (!rows.length) return null;
          const meta = BUCKET_META[b];
          const Icon = meta.icon;
          return (
            <section key={b} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border ${meta.tone}`}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm">{meta.label}</h3>
                    <p className="text-xs text-muted-foreground">{meta.help}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{rows.length} cobrança(s)</p>
                  <p className="font-bold font-mono text-sm">
                    {brl(rows.reduce((s, r) => s + Number(r.amount || 0), 0))}
                  </p>
                </div>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {rows.map((r) => {
                  const overdueDays =
                    b === "overdue" && r.due_date
                      ? Math.round(
                          (Date.now() - new Date(`${r.due_date}T00:00:00`).getTime()) / 86400000,
                        )
                      : 0;
                  const isContract = Boolean(r.service_contracts?.number);

                  return (
                    <Card
                      key={r.id}
                      className="p-3.5 sm:p-4 hover:shadow-md transition-shadow border-border/80"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="font-bold truncate text-foreground">
                            {r.clients?.name || "Cliente não informado"}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            {isContract ? (
                              <Badge
                                variant="outline"
                                className="bg-primary/10 text-primary border-primary/30 text-[10px] flex items-center gap-1"
                              >
                                <Repeat className="w-2.5 h-2.5" />
                                Contrato #{r.service_contracts.number}
                              </Badge>
                            ) : r.orders?.number ? (
                              <Badge variant="outline" className="text-[10px]">
                                OS #{r.orders.number}
                              </Badge>
                            ) : null}

                            {r.service_contracts?.title && (
                              <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                                {r.service_contracts.title}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className={`shrink-0 ${meta.tone}`}>
                          {b === "overdue" ? `${overdueDays}d atraso` : meta.label}
                        </Badge>
                      </div>

                      <div className="flex items-end justify-between gap-2 pt-2 border-t border-border/60">
                        <div>
                          {r.competence_month && (
                            <div className="mb-1">
                              <p className="text-[10px] uppercase text-muted-foreground tracking-wide font-medium">
                                Competência
                              </p>
                              <p className="text-xs font-semibold text-primary">
                                {fmtDate(r.competence_month)}
                              </p>
                            </div>
                          )}
                          <p className="text-[10px] uppercase text-muted-foreground tracking-wide font-medium">
                            Vencimento
                          </p>
                          <p className="text-sm font-semibold">{fmtDate(r.due_date)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase text-muted-foreground tracking-wide font-medium">
                            Valor
                          </p>
                          <p className="text-lg font-black font-mono text-primary">
                            {brl(r.amount)}
                          </p>
                        </div>
                      </div>

                      {b !== "paid" && (
                        <Button
                          size="sm"
                          className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                          onClick={() => markPaid(r)}
                        >
                          <Check className="w-4 h-4 mr-1.5" />
                          Dar baixa no caixa
                        </Button>
                      )}
                    </Card>
                  );
                })}
              </div>
            </section>
          );
        })}

        {!visibleRows.length && (
          <Card className="p-12 text-center text-muted-foreground">
            <Wallet className="mx-auto w-10 h-10 text-muted-foreground/40 mb-2" />
            <p className="font-medium">Nenhuma cobrança encontrada no filtro atual.</p>
          </Card>
        )}
      </div>

      {/* Modal de Lançamento em Lote de Cobranças Mensais */}
      <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
        <DialogContent className="w-[calc(100%-1rem)] max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Lançar Mensalidades de Contratos Ativos
            </DialogTitle>
            <DialogDescription>
              Gere com 1 clique todas as cobranças recorrentes dos contratos ativos para o mês de
              competência selecionado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label>Mês de Competência</Label>
              <Input
                type="month"
                value={targetMonth}
                onChange={(e) => setTargetMonth(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="rounded-xl border bg-muted/40 p-3.5 space-y-2 text-sm">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Contratos ativos cadastrados:</span>
                <span className="font-bold">{activeContracts.length}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Já gerados para este mês:</span>
                <span className="font-bold text-emerald-600">
                  {activeContracts.length - unbilledContracts.length}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t font-semibold">
                <span>Novas cobranças a lançar:</span>
                <span className="text-primary font-bold">
                  {unbilledContracts.length} ({brl(totalUnbilledAmount)})
                </span>
              </div>
            </div>

            {unbilledContracts.length > 0 && (
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Contratos que serão lançados:
                </p>
                {unbilledContracts.map((c: any) => (
                  <div
                    key={c.id}
                    className="flex justify-between text-xs p-1.5 rounded-lg bg-card border"
                  >
                    <span className="truncate max-w-[220px]">
                      #{c.number} · {c.clients?.name} ({c.title})
                    </span>
                    <span className="font-mono font-semibold text-primary">
                      {brl(c.amount)} · dia {c.due_day || 10}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setBatchOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleGenerateBatch}
              disabled={generating || unbilledContracts.length === 0}
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando cobranças...
                </>
              ) : (
                `Lançar ${unbilledContracts.length} Cobrança(s)`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
