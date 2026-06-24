import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { brl, fmtDate, fmtDateTime } from "@/lib/format";
import { Printer, Wallet, ArrowDownCircle, ArrowUpCircle, AlertTriangle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/closures")({ component: ClosuresPage });

function ClosuresPage() {
  const { data } = useQuery({
    queryKey: ["cash_closures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_closures" as any)
        .select("*")
        .order("closed_at", { ascending: false })
        .limit(120);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  function printOne(c: any) {
    const m = c.by_method || {};
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Fechamento ${fmtDate(c.closure_date)}</title>
    <style>body{font-family:system-ui,-apple-system,Arial;padding:24px;max-width:480px;margin:0 auto;color:#0f172a}
    h1{font-size:18px;margin:0 0 4px}h2{font-size:13px;margin:16px 0 6px;text-transform:uppercase;letter-spacing:.08em;color:#475569}
    table{width:100%;border-collapse:collapse;font-size:13px}td{padding:6px 0;border-bottom:1px dashed #cbd5e1}
    .right{text-align:right;font-variant-numeric:tabular-nums}
    .total{font-weight:800;border-top:2px solid #0f172a;padding-top:8px}
    .diff-ok{color:#059669;font-weight:800}.diff-bad{color:#b45309;font-weight:800}
    .muted{color:#64748b;font-size:11px}@media print{button{display:none}}
    </style></head><body>
    <h1>Fechamento de Caixa</h1>
    <p class="muted">${fmtDate(c.closure_date)} · ${fmtDateTime(c.closed_at)} · Operador: ${c.operator || "—"}</p>
    <h2>Resumo</h2>
    <table>
      <tr><td>Troco inicial</td><td class="right">${brl(c.initial_amount)}</td></tr>
      <tr><td>Total de entradas</td><td class="right">${brl(c.total_in)}</td></tr>
      <tr><td>Total de saídas</td><td class="right">${brl(c.total_out)}</td></tr>
      <tr><td>Lançamentos</td><td class="right">${c.entries_count}</td></tr>
    </table>
    <h2>Por forma de pagamento</h2>
    <table>
      <tr><td>Dinheiro</td><td class="right">${brl(m.cash || 0)}</td></tr>
      <tr><td>PIX</td><td class="right">${brl(m.pix || 0)}</td></tr>
      <tr><td>Débito</td><td class="right">${brl(m.debit || 0)}</td></tr>
      <tr><td>Crédito</td><td class="right">${brl(m.credit || 0)}</td></tr>
      ${m.other ? `<tr><td>Outros</td><td class="right">${brl(m.other)}</td></tr>` : ""}
    </table>
    <h2>Conferência do dinheiro</h2>
    <table>
      <tr><td>Esperado em dinheiro</td><td class="right">${brl(c.expected_cash)}</td></tr>
      <tr><td>Contado na gaveta</td><td class="right">${brl(c.counted_cash)}</td></tr>
      <tr class="total"><td>Diferença</td><td class="right ${Math.abs(c.difference) < 0.01 ? "diff-ok" : "diff-bad"}">${brl(c.difference)}</td></tr>
    </table>
    ${c.notes ? `<h2>Observações</h2><p>${String(c.notes).replace(/</g, "&lt;")}</p>` : ""}
    <p style="margin-top:32px"><button onclick="window.print()">Imprimir</button></p>
    <script>setTimeout(()=>window.print(),300)</script>
    </body></html>`;
    const w = window.open("", "_blank", "width=520,height=720");
    if (!w) return;
    w.document.write(html);
    w.document.close();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-primary">Fechamentos de Caixa</h1>
        <p className="text-sm text-muted-foreground">Histórico dos fechamentos do PDV com totais e conferência.</p>
      </div>

      {!data?.length && (
        <Card className="p-12 text-center text-muted-foreground">
          <Wallet className="mx-auto w-10 h-10 text-slate-300 mb-2" />
          Nenhum fechamento salvo ainda. Abra e feche o caixa no PDV para gerar o primeiro.
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(data ?? []).map((c) => {
          const m = c.by_method || {};
          const ok = Math.abs(Number(c.difference || 0)) < 0.01;
          return (
            <Card key={c.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-lg">{fmtDate(c.closure_date)}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmtDateTime(c.closed_at)} · {c.operator || "—"}
                  </p>
                </div>
                <Badge variant="outline" className={ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800"}>
                  {ok ? (
                    <><CheckCircle2 className="w-3 h-3 mr-1" />Bate</>
                  ) : (
                    <><AlertTriangle className="w-3 h-3 mr-1" />Diferença</>
                  )}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-emerald-50 p-2">
                  <div className="flex items-center gap-1 text-emerald-700"><ArrowDownCircle className="w-3 h-3" />Entradas</div>
                  <p className="font-bold font-mono">{brl(c.total_in)}</p>
                </div>
                <div className="rounded-lg bg-red-50 p-2">
                  <div className="flex items-center gap-1 text-red-700"><ArrowUpCircle className="w-3 h-3" />Saídas</div>
                  <p className="font-bold font-mono">{brl(c.total_out)}</p>
                </div>
              </div>

              <div className="space-y-1 text-xs border-t pt-2">
                <Row label="Dinheiro" value={m.cash || 0} />
                <Row label="PIX" value={m.pix || 0} />
                <Row label="Débito" value={m.debit || 0} />
                <Row label="Crédito" value={m.credit || 0} />
                {m.other ? <Row label="Outros" value={m.other} /> : null}
              </div>

              <div className="border-t pt-2 space-y-1 text-xs">
                <Row label="Esperado em dinheiro" value={c.expected_cash} muted />
                <Row label="Contado" value={c.counted_cash} muted />
                <div className="flex justify-between font-bold pt-1">
                  <span>Diferença</span>
                  <span className={ok ? "text-emerald-700" : "text-amber-700"}>{brl(c.difference)}</span>
                </div>
              </div>

              {c.notes && (
                <p className="text-xs text-muted-foreground italic border-l-2 border-slate-200 pl-2">{c.notes}</p>
              )}

              <Button size="sm" variant="outline" className="w-full" onClick={() => printOne(c)}>
                <Printer className="w-4 h-4 mr-1" />
                Imprimir / PDF
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Row({ label, value, muted = false }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? "text-muted-foreground" : ""}`}>
      <span>{label}</span>
      <span className="font-mono">{brl(Number(value || 0))}</span>
    </div>
  );
}