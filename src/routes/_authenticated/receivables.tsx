import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/receivables")({ component: Page });

type Bucket = "overdue" | "today" | "week" | "month" | "future" | "paid";

const BUCKET_META: Record<Bucket, { label: string; tone: string; icon: any; help: string }> = {
  overdue: {
    label: "Vencidas",
    tone: "border-red-200 bg-red-50 text-red-700",
    icon: AlertTriangle,
    help: "Cobrar com urgência",
  },
  today: {
    label: "Vencem hoje",
    tone: "border-amber-200 bg-amber-50 text-amber-800",
    icon: Clock,
    help: "Acompanhe o dia",
  },
  week: {
    label: "Próximos 7 dias",
    tone: "border-blue-200 bg-blue-50 text-blue-700",
    icon: CalendarClock,
    help: "Semana atual",
  },
  month: {
    label: "Este mês",
    tone: "border-violet-200 bg-violet-50 text-violet-700",
    icon: Calendar,
    help: "Vencimentos do mês",
  },
  future: {
    label: "Futuros",
    tone: "border-slate-200 bg-slate-50 text-slate-700",
    icon: Calendar,
    help: "Mais para frente",
  },
  paid: {
    label: "Recebidos",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
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

  const { data } = useQuery({
    queryKey: ["receivables"],
    queryFn: async () => {
      const { data } = await supabase
        .from("receivables")
        .select("*, clients(name, whatsapp), orders(number)")
        .order("due_date", { ascending: true });
      return (data ?? []) as any[];
    },
  });

  async function markPaid(r: any) {
    if (!confirm(`Marcar como pago e lançar ${brl(r.amount)} no caixa?`)) return;
    const updates: any[] = [
      supabase
        .from("receivables")
        .update({ status: "pago", paid_at: new Date().toISOString() })
        .eq("id", r.id),
      supabase.from("cash_entries").insert({
        type: "entrada",
        description: `Pagamento OS #${r.orders?.number ?? ""}`,
        category: "Pagamento de OS",
        amount: r.amount,
        client_id: r.client_id,
        order_id: r.order_id,
        receivable_id: r.id,
        payment_method: r.payment_method,
      }),
    ];
    if (r.order_id) {
      const { data: o } = await supabase
        .from("orders")
        .select("paid,total")
        .eq("id", r.order_id)
        .single();
      if (o) updates.push(supabase.from("orders").update({ paid: o.total }).eq("id", r.order_id) as any);
    }
    const results = await Promise.all(updates);
    const err = results.find((x: any) => x.error);
    if (err) return toast.error((err as any).error.message);
    toast.success("Marcado como pago");
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

  const totalPending = buckets.overdue.total + buckets.today.total + buckets.week.total + buckets.month.total + buckets.future.total;

  const orderedBuckets: Bucket[] = ["overdue", "today", "week", "month", "future", "paid"];

  const visibleRows = enriched.filter((r) => {
    const matchBucket = active === "all" || r.bucket === active;
    if (!matchBucket) return false;
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      String(r.clients?.name || "").toLowerCase().includes(term) ||
      String(r.orders?.number || "").includes(term)
    );
  });

  const grouped = useMemo(() => {
    const g: Record<Bucket, any[]> = { overdue: [], today: [], week: [], month: [], future: [], paid: [] };
    for (const r of visibleRows) g[r.bucket as Bucket].push(r);
    return g;
  }, [visibleRows]);

  return (
    <div className="space-y-4">
      {/* Header com totais destacados */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-5 bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wide opacity-90">Vencidas</span>
          </div>
          <p className="text-3xl font-black">{brl(buckets.overdue.total)}</p>
          <p className="text-xs mt-1 opacity-90">{buckets.overdue.rows.length} cobrança(s)</p>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wide opacity-90">A receber (total)</span>
          </div>
          <p className="text-3xl font-black">{brl(totalPending)}</p>
          <p className="text-xs mt-1 opacity-90">
            {buckets.overdue.rows.length + buckets.today.rows.length + buckets.week.rows.length + buckets.month.rows.length + buckets.future.rows.length} pendente(s)
          </p>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wide opacity-90">Já recebidas</span>
          </div>
          <p className="text-3xl font-black">{brl(buckets.paid.total)}</p>
          <p className="text-xs mt-1 opacity-90">{buckets.paid.rows.length} cobrança(s)</p>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente ou nº OS"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActive("all")}
            className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-bold transition ${
              active === "all" ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary/40"
            }`}
          >
            Todos
          </button>
          {orderedBuckets.map((b) => {
            const meta = BUCKET_META[b];
            const n = buckets[b].rows.length;
            return (
              <button
                key={b}
                onClick={() => setActive(active === b ? "all" : b)}
                className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                  active === b ? "border-primary bg-primary text-primary-foreground" : `${meta.tone} hover:brightness-95`
                }`}
              >
                {meta.label} · {n}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista agrupada */}
      <div className="space-y-4">
        {orderedBuckets.map((b) => {
          const rows = grouped[b];
          if (!rows.length) return null;
          const meta = BUCKET_META[b];
          const Icon = meta.icon;
          return (
            <section key={b}>
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border ${meta.tone}`}>
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
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {rows.map((r) => {
                  const overdueDays =
                    b === "overdue" && r.due_date
                      ? Math.round((Date.now() - new Date(`${r.due_date}T00:00:00`).getTime()) / 86400000)
                      : 0;
                  return (
                    <Card key={r.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="font-bold truncate">{r.clients?.name || "Cliente"}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.orders?.number ? `OS #${r.orders.number}` : "Sem OS vinculada"}
                          </p>
                        </div>
                        <Badge variant="outline" className={meta.tone}>
                          {b === "overdue" ? `${overdueDays}d atraso` : meta.label}
                        </Badge>
                      </div>
                      <div className="flex items-end justify-between gap-2 pt-2 border-t border-border/60">
                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Vencimento</p>
                          <p className="text-sm font-semibold">{fmtDate(r.due_date)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Valor</p>
                          <p className="text-lg font-black font-mono text-primary">{brl(r.amount)}</p>
                        </div>
                      </div>
                      {b !== "paid" && (
                        <Button
                          size="sm"
                          className="w-full mt-3"
                          onClick={() => markPaid(r)}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Receber
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
            <Wallet className="mx-auto w-10 h-10 text-slate-300 mb-2" />
            Nenhuma cobrança no filtro atual.
          </Card>
        )}
      </div>
    </div>
  );
}