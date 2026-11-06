import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, ArrowDownCircle, ArrowUpCircle, Calendar } from "lucide-react";
import { toast } from "sonner";
import { brl, fmtDate, CASH_IN_CATEGORIES, CASH_OUT_CATEGORIES, PAYMENT_METHODS } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/cash")({ component: CashPage });

function CashPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ type: "entrada", description: "", category: "", amount: 0, entry_date: new Date().toISOString().slice(0, 10), payment_method: "", notes: "" });

  const { data } = useQuery({
    queryKey: ["cash"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cash_entries").select("*, clients(name)").order("entry_date", { ascending: false }).order("created_at", { ascending: false }).limit(300);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  // Calcular saldo do dia
  const today = new Date().toISOString().slice(0, 10);
  const todayData = (data ?? []).filter((e) => e.entry_date === today);
  const todayTotals = todayData.reduce(
    (acc, e) => {
      if (e.type === "entrada") acc.in += +e.amount; else acc.out += +e.amount;
      return acc;
    }, { in: 0, out: 0 },
  );

  // Calcular totais gerais
  const totals = (data ?? []).reduce(
    (acc, e) => {
      if (e.type === "entrada") acc.in += +e.amount; else acc.out += +e.amount;
      return acc;
    }, { in: 0, out: 0 },
  );

  async function save() {
    if (!form.description || !form.amount) return toast.error("Preencha descrição e valor");
    const { error } = await supabase.from("cash_entries").insert({ ...form, amount: Number(form.amount) });
    if (error) return toast.error(error.message);
    toast.success("Lançamento salvo"); setOpen(false);
    setForm({ type: "entrada", description: "", category: "", amount: 0, entry_date: new Date().toISOString().slice(0, 10), payment_method: "", notes: "" });
    qc.invalidateQueries({ queryKey: ["cash"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  }
  async function remove(id: string) {
    if (!confirm("Excluir lançamento?")) return;
    const { error } = await supabase.from("cash_entries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["cash"] });
  }

  const cats = form.type === "entrada" ? CASH_IN_CATEGORIES : CASH_OUT_CATEGORIES;

  return (
    <div className="space-y-4">
      {/* Saldo do Dia - Destaque Principal */}
      <div className="bg-linear-to-r from-brand-yellow to-brand-orange rounded-2xl p-4 sm:p-6 text-brand-blue shadow-lg border border-brand-yellow/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 opacity-75" />
              <p className="text-xs sm:text-sm font-semibold opacity-90">SALDO DO DIA</p>
            </div>
            <p className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">{brl(todayTotals.in - todayTotals.out)}</p>
          </div>
          <div className="flex sm:flex-col justify-between sm:justify-start sm:text-right gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-brand-blue/15">
            <div>
              <p className="text-xs opacity-75 mb-0.5 sm:mb-1">Entradas hoje</p>
              <p className="text-lg sm:text-2xl font-bold text-emerald-700">{brl(todayTotals.in)}</p>
            </div>
            <div>
              <p className="text-xs opacity-75 mb-0.5 sm:mb-1">Saídas hoje</p>
              <p className="text-lg sm:text-2xl font-bold text-destructive">{brl(todayTotals.out)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Totais Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground font-semibold mb-2">ENTRADAS (TOTAL)</div>
          <div className="text-2xl font-bold text-emerald-600">{brl(totals.in)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground font-semibold mb-2">SAÍDAS (TOTAL)</div>
          <div className="text-2xl font-bold text-destructive">{brl(totals.out)}</div>
        </Card>
        <Card className="p-4 bg-primary text-primary-foreground">
          <div className="text-xs text-primary-foreground/80 font-semibold mb-2">SALDO GERAL</div>
          <div className="text-2xl font-bold text-gold">{brl(totals.in - totals.out)}</div>
        </Card>
      </div>

      {/* Botão Novo Lançamento */}
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <Button onClick={() => setOpen(true)} className="bg-brand-yellow hover:bg-brand-yellow/90 text-brand-blue font-bold">
            <Plus className="w-4 h-4 mr-2" />
            Novo lançamento
          </Button>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo lançamento</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v, category: "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="entrada">Entrada</SelectItem><SelectItem value="saida">Saída</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Descrição *</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Valor *</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                <div><Label>Data</Label><Input type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Categoria</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>{cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Forma de pagto</Label>
                  <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>{PAYMENT_METHODS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista em cards touch-friendly para Mobile */}
      <div className="grid gap-2.5 sm:hidden">
        {(data ?? []).map((e) => (
          <Card key={e.id} className="p-3.5 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {e.type === "entrada" ? (
                  <ArrowDownCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <ArrowUpCircle className="w-5 h-5 text-destructive shrink-0" />
                )}
                <div>
                  <span className="font-semibold text-sm leading-tight block">{e.description}</span>
                  <span className="text-xs text-muted-foreground">{fmtDate(e.entry_date)}</span>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive shrink-0"
                aria-label="Excluir lançamento"
                onClick={() => remove(e.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {e.clients?.name && (
              <p className="text-xs text-muted-foreground">
                Cliente: <span className="text-foreground font-medium">{e.clients.name}</span>
              </p>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-border/60">
              <div className="flex flex-wrap items-center gap-1.5">
                {e.category && (
                  <Badge variant="outline" className="text-[10px]">
                    {e.category}
                  </Badge>
                )}
                {e.payment_method && (
                  <Badge variant="secondary" className="text-[10px]">
                    {e.payment_method}
                  </Badge>
                )}
              </div>
              <span
                className={`font-mono font-bold text-sm ${
                  e.type === "entrada" ? "text-emerald-600" : "text-destructive"
                }`}
              >
                {e.type === "entrada" ? "+" : "-"} {brl(e.amount)}
              </span>
            </div>
          </Card>
        ))}
        {!data?.length && (
          <Card className="p-8 text-center text-muted-foreground text-sm">
            Sem lançamentos
          </Card>
        )}
      </div>

      {/* Tabela completa para Desktop (sm:table) */}
      <Card className="hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="text-left p-3 w-10"></th>
                <th className="text-left p-3">Data</th>
                <th className="text-left p-3">Descrição</th>
                <th className="text-left p-3 hidden md:table-cell">Categoria</th>
                <th className="text-right p-3">Valor</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((e) => (
                <tr key={e.id} className="border-t hover:bg-muted/30">
                  <td className="p-3">{e.type === "entrada" ? <ArrowDownCircle className="w-4 h-4 text-emerald-600" /> : <ArrowUpCircle className="w-4 h-4 text-destructive" />}</td>
                  <td className="p-3 whitespace-nowrap">{fmtDate(e.entry_date)}</td>
                  <td className="p-3">{e.description}<div className="text-xs text-muted-foreground">{e.clients?.name}</div></td>
                  <td className="p-3 hidden md:table-cell"><Badge variant="outline">{e.category || "—"}</Badge></td>
                  <td className={`p-3 text-right font-mono ${e.type === "entrada" ? "text-emerald-600" : "text-destructive"}`}>{e.type === "entrada" ? "+" : "-"} {brl(e.amount)}</td>
                  <td className="p-3"><Button size="icon" variant="ghost" aria-label="Excluir lançamento" onClick={() => remove(e.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></td>
                </tr>
              ))}
              {!data?.length && (<tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Sem lançamentos</td></tr>)}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
