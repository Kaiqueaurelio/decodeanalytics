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
import { Plus, Trash2, ArrowDownCircle, ArrowUpCircle, Calendar, Pencil, LockKeyhole, Printer } from "lucide-react";
import { toast } from "sonner";
import { brl, fmtDate, CASH_IN_CATEGORIES, CASH_OUT_CATEGORIES, PAYMENT_METHODS } from "@/lib/format";
import { generateCashClosingPDF } from "@/lib/pdf";

export const Route = createFileRoute("/_authenticated/cash")({ component: CashPage });

const emptyForm = () => ({
  type: "entrada",
  description: "",
  category: "",
  amount: 0,
  entry_date: new Date().toISOString().slice(0, 10),
  payment_method: "",
  notes: "",
});

function CashPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(emptyForm());
  const [closeForm, setCloseForm] = useState({
    operator: "Operador",
    countedAmount: "",
    notes: "",
  });

  const { data } = useQuery({
    queryKey: ["cash"],
    queryFn: async () => {
      const { data } = await supabase
        .from("cash_entries")
        .select("*, clients(name)")
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(300);
      return (data ?? []) as any[];
    },
  });

  const { data: company } = useQuery({
    queryKey: ["company_settings_cash"],
    queryFn: async () => {
      const { data } = await supabase.from("company_settings").select("*").limit(1).maybeSingle();
      return data;
    },
  });

  const today = new Date().toISOString().slice(0, 10);
  const todayData = (data ?? []).filter((entry) => entry.entry_date === today);
  const todayTotals = todayData.reduce(
    (acc, entry) => {
      if (entry.type === "entrada") acc.in += Number(entry.amount || 0);
      else acc.out += Number(entry.amount || 0);
      return acc;
    },
    { in: 0, out: 0 },
  );

  const totals = (data ?? []).reduce(
    (acc, entry) => {
      if (entry.type === "entrada") acc.in += Number(entry.amount || 0);
      else acc.out += Number(entry.amount || 0);
      return acc;
    },
    { in: 0, out: 0 },
  );

  const expectedToday = todayTotals.in - todayTotals.out;
  const countedAmount = Number(String(closeForm.countedAmount || "0").replace(",", "."));
  const closeDiff = Number.isFinite(countedAmount) ? countedAmount - expectedToday : 0;
  const cats = form.type === "entrada" ? CASH_IN_CATEGORIES : CASH_OUT_CATEGORIES;
  const todaySoldItems = todayData.filter(
    (entry) => entry.category !== "Fechamento de caixa" && entry.description !== `Fechamento de caixa - ${today}`,
  );

  function parseClosingNote(note?: string | null) {
    const parts = String(note || "")
      .split("|")
      .map((part) => part.trim());
    const valueOf = (label: string) => parts.find((part) => part.startsWith(`${label}:`))?.split(":").slice(1).join(":").trim();
    const money = (value?: string) => Number(String(value || "0").replace(/[^\d,-]/g, "").replace(",", ".")) || 0;
    return {
      operator: valueOf("Operador") || "Operador",
      expected: money(valueOf("Esperado")),
      counted: money(valueOf("Contado")),
      difference: money(valueOf("Diferenca")),
      notes: parts.filter((part) => !["Operador", "Esperado", "Contado", "Diferenca"].some((label) => part.startsWith(`${label}:`))).join(" | "),
    };
  }

  function printClosingReceipt(closingEntry?: any) {
    const closingDate = closingEntry?.entry_date || today;
    const dateEntries = (data ?? []).filter((entry) => entry.entry_date === closingDate);
    const receiptItems = dateEntries.filter((entry) => entry.id !== closingEntry?.id && entry.category !== "Fechamento de caixa");
    const totalsForDate = receiptItems.reduce(
      (acc, entry) => {
        if (entry.type === "entrada") acc.in += Number(entry.amount || 0);
        else acc.out += Number(entry.amount || 0);
        return acc;
      },
      { in: 0, out: 0 },
    );
    const parsed = closingEntry
      ? parseClosingNote(closingEntry.notes)
      : {
          operator: closeForm.operator,
          expected: expectedToday,
          counted: countedAmount,
          difference: closeDiff,
          notes: closeForm.notes,
        };
    generateCashClosingPDF({
      company,
      closing: {
        date: closingDate,
        operator: parsed.operator,
        expected: parsed.expected || totalsForDate.in - totalsForDate.out,
        counted: parsed.counted || countedAmount,
        difference: parsed.difference || closeDiff,
        entriesIn: totalsForDate.in,
        entriesOut: totalsForDate.out,
        notes: parsed.notes,
      },
      items: receiptItems.map((entry) => ({
        description: entry.description,
        category: entry.category,
        payment_method: entry.payment_method,
        amount: Number(entry.amount || 0),
        type: entry.type,
        created_at: entry.created_at,
      })),
    });
  }

  async function save() {
    if (!form.description || !form.amount) return toast.error("Preencha descricao e valor");
    const payload = {
      ...form,
      amount: Number(form.amount),
      category: form.category || null,
      payment_method: form.payment_method || null,
      notes: form.notes || null,
    };
    const { error } = editingId
      ? await supabase.from("cash_entries").update(payload).eq("id", editingId)
      : await supabase.from("cash_entries").insert(payload);
    if (error) return toast.error(error.message);

    toast.success(editingId ? "Lancamento atualizado" : "Lancamento salvo");
    setOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    qc.invalidateQueries({ queryKey: ["cash"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  }

  async function remove(id: string) {
    if (!confirm("Excluir lancamento?")) return;
    const { error } = await supabase.from("cash_entries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Lancamento excluido");
    qc.invalidateQueries({ queryKey: ["cash"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setOpen(true);
  }

  function startEdit(entry: any) {
    setEditingId(entry.id);
    setForm({
      type: entry.type || "entrada",
      description: entry.description || "",
      category: entry.category || "",
      amount: Number(entry.amount || 0),
      entry_date: entry.entry_date || today,
      payment_method: entry.payment_method || "",
      notes: entry.notes || "",
    });
    setOpen(true);
  }

  async function closeCash() {
    if (!Number.isFinite(countedAmount)) return toast.error("Informe o valor contado no caixa.");
    const { error } = await supabase.from("cash_entries").insert({
      type: closeDiff < 0 ? "saida" : "entrada",
      description: `Fechamento de caixa - ${today}`,
      category: "Fechamento de caixa",
      amount: Math.abs(closeDiff),
      entry_date: today,
      payment_method: "Conferencia",
      notes: [
        `Operador: ${closeForm.operator || "Operador"}`,
        `Esperado: ${brl(expectedToday)}`,
        `Contado: ${brl(countedAmount)}`,
        `Diferenca: ${brl(closeDiff)}`,
        closeForm.notes,
      ].filter(Boolean).join(" | "),
    });
    if (error) return toast.error(error.message);

    toast.success(`Caixa fechado. Diferenca: ${brl(closeDiff)}.`);
    printClosingReceipt({
      entry_date: today,
      notes: [
        `Operador: ${closeForm.operator || "Operador"}`,
        `Esperado: ${brl(expectedToday)}`,
        `Contado: ${brl(countedAmount)}`,
        `Diferenca: ${brl(closeDiff)}`,
        closeForm.notes,
      ].filter(Boolean).join(" | "),
    });
    setCloseOpen(false);
    setCloseForm({ operator: "Operador", countedAmount: "", notes: "" });
    qc.invalidateQueries({ queryKey: ["cash"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-brand-yellow/30 bg-gradient-to-r from-brand-yellow to-brand-orange p-6 text-brand-blue shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Calendar className="h-5 w-5 opacity-75" />
              <p className="text-sm font-semibold opacity-90">SALDO DO DIA</p>
            </div>
            <p className="text-4xl font-black md:text-5xl">{brl(expectedToday)}</p>
          </div>
          <div className="text-right">
            <div className="mb-3">
              <p className="mb-1 text-sm opacity-75">Entradas</p>
              <p className="text-2xl font-bold text-emerald-700">{brl(todayTotals.in)}</p>
            </div>
            <div>
              <p className="mb-1 text-sm opacity-75">Saidas</p>
              <p className="text-2xl font-bold text-destructive">{brl(todayTotals.out)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card className="p-4">
          <div className="mb-2 text-xs font-semibold text-muted-foreground">ENTRADAS (TOTAL)</div>
          <div className="text-2xl font-bold text-emerald-600">{brl(totals.in)}</div>
        </Card>
        <Card className="p-4">
          <div className="mb-2 text-xs font-semibold text-muted-foreground">SAIDAS (TOTAL)</div>
          <div className="text-2xl font-bold text-destructive">{brl(totals.out)}</div>
        </Card>
        <Card className="bg-primary p-4 text-primary-foreground">
          <div className="mb-2 text-xs font-semibold text-primary-foreground/80">SALDO GERAL</div>
          <div className="text-2xl font-bold text-gold">{brl(totals.in - totals.out)}</div>
        </Card>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button onClick={() => setCloseOpen(true)} variant="outline" className="font-bold">
          <LockKeyhole className="mr-2 h-4 w-4" />
          Fechar caixa
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <Button onClick={startCreate} className="bg-brand-yellow font-bold text-brand-blue hover:bg-brand-yellow/90">
            <Plus className="mr-2 h-4 w-4" />
            Novo lancamento
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar lancamento" : "Novo lancamento"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value, category: "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Descricao *</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Valor *</Label>
                  <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div>
                  <Label>Data</Label>
                  <Input type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Categoria</Label>
                  <Select value={form.category || "Sem categoria"} onValueChange={(value) => setForm({ ...form, category: value === "Sem categoria" ? "" : value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sem categoria">Sem categoria</SelectItem>
                      {cats.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Forma de pagto</Label>
                  <Select value={form.payment_method || "Sem forma"} onValueChange={(value) => setForm({ ...form, payment_method: value === "Sem forma" ? "" : value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sem forma">Sem forma</SelectItem>
                      {PAYMENT_METHODS.map((method) => <SelectItem key={method} value={method}>{method}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Observacoes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={save}>{editingId ? "Salvar alteracoes" : "Salvar"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fechar caixa do dia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-sm">
              <Card className="p-3">
                <p className="text-xs text-muted-foreground">Entradas</p>
                <strong className="text-emerald-600">{brl(todayTotals.in)}</strong>
              </Card>
              <Card className="p-3">
                <p className="text-xs text-muted-foreground">Saidas</p>
                <strong className="text-destructive">{brl(todayTotals.out)}</strong>
              </Card>
              <Card className="p-3">
                <p className="text-xs text-muted-foreground">Esperado</p>
                <strong>{brl(expectedToday)}</strong>
              </Card>
            </div>
            <div>
              <Label>Operador</Label>
              <Input value={closeForm.operator} onChange={(e) => setCloseForm({ ...closeForm, operator: e.target.value })} />
            </div>
            <div>
              <Label>Valor contado no caixa *</Label>
              <Input inputMode="decimal" value={closeForm.countedAmount} onChange={(e) => setCloseForm({ ...closeForm, countedAmount: e.target.value })} placeholder="0,00" />
            </div>
            <div className={`rounded-2xl p-4 text-sm font-bold ${closeDiff < 0 ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
              Diferenca: {brl(closeDiff)}
            </div>
            <div className="rounded-2xl border bg-muted/30">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div>
                  <p className="text-sm font-black">Itens e OS vendidos hoje</p>
                  <p className="text-xs text-muted-foreground">Confira antes de confirmar o fechamento.</p>
                </div>
                <Badge variant="outline">{todaySoldItems.length} lancamentos</Badge>
              </div>
              <div className="max-h-64 overflow-y-auto p-2">
                {todaySoldItems.length ? (
                  <div className="space-y-2">
                    {todaySoldItems.map((entry) => (
                      <div key={entry.id} className="grid gap-2 rounded-xl bg-card p-3 text-sm sm:grid-cols-[minmax(0,1fr)_120px_120px] sm:items-center">
                        <div className="min-w-0">
                          <p className="truncate font-bold">{entry.description}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {entry.category || "Sem categoria"} {entry.payment_method ? `- ${entry.payment_method}` : ""}
                          </p>
                        </div>
                        <Badge className="w-fit" variant={entry.type === "entrada" ? "default" : "outline"}>
                          {entry.type === "entrada" ? "Entrada" : "Saida"}
                        </Badge>
                        <strong className={entry.type === "entrada" ? "text-emerald-600 sm:text-right" : "text-destructive sm:text-right"}>
                          {entry.type === "entrada" ? "+" : "-"} {brl(entry.amount)}
                        </strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma venda ou OS registrada hoje.</p>
                )}
              </div>
            </div>
            <div>
              <Label>Observacoes do fechamento</Label>
              <Textarea value={closeForm.notes} onChange={(e) => setCloseForm({ ...closeForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseOpen(false)}>Cancelar</Button>
            <Button variant="outline" onClick={() => printClosingReceipt()}>
              <Printer className="mr-2 h-4 w-4" />
              Previa PDF
            </Button>
            <Button className="bg-brand-blue hover:bg-brand-blue-light" onClick={closeCash}>Fechar caixa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="w-10 p-3 text-left"></th>
                <th className="p-3 text-left">Data</th>
                <th className="p-3 text-left">Descricao</th>
                <th className="hidden p-3 text-left md:table-cell">Categoria</th>
                <th className="p-3 text-right">Valor</th>
                <th className="w-24 p-3"></th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((entry) => (
                <tr key={entry.id} className="border-t hover:bg-muted/30">
                  <td className="p-3">
                    {entry.type === "entrada"
                      ? <ArrowDownCircle className="h-4 w-4 text-emerald-600" />
                      : <ArrowUpCircle className="h-4 w-4 text-destructive" />}
                  </td>
                  <td className="whitespace-nowrap p-3">{fmtDate(entry.entry_date)}</td>
                  <td className="p-3">
                    {entry.description}
                    <div className="text-xs text-muted-foreground">{entry.clients?.name}</div>
                  </td>
                  <td className="hidden p-3 md:table-cell"><Badge variant="outline">{entry.category || "-"}</Badge></td>
                  <td className={`p-3 text-right font-mono ${entry.type === "entrada" ? "text-emerald-600" : "text-destructive"}`}>
                    {entry.type === "entrada" ? "+" : "-"} {brl(entry.amount)}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      {entry.category === "Fechamento de caixa" && (
                        <Button size="icon" variant="ghost" onClick={() => printClosingReceipt(entry)} aria-label="Imprimir recibo">
                          <Printer className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => startEdit(entry)} aria-label="Editar lancamento">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(entry.id)} aria-label="Excluir lancamento">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!data?.length && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">Sem lancamentos</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
