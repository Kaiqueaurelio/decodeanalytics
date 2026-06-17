import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  Calculator,
  CreditCard,
  ReceiptText,
  RotateCcw,
  Search,
  ShoppingCart,
  Trash2,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import {
  brl,
  CASH_IN_CATEGORIES,
  CASH_OUT_CATEGORIES,
  fmtDate,
  PAYMENT_METHODS,
} from "@/lib/format";

export const Route = createFileRoute("/_authenticated/cash")({
  beforeLoad: () => {
    throw redirect({ to: "/pdv" });
  },
  component: CashPage,
});

const today = () => new Date().toISOString().slice(0, 10);

type PosMode = "order" | "custom";

function currencyFromDisplay(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  return Number(normalized) || 0;
}

function appendDigit(current: string, digit: string) {
  if (digit === "," && current.includes(",")) return current;
  if (current === "0" && digit !== ",") return digit;
  return `${current}${digit}`;
}

function CashPage() {
  const qc = useQueryClient();
  const [mode, setMode] = useState<PosMode>("order");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [clientId, setClientId] = useState("");
  const [saleDescription, setSaleDescription] = useState("Venda balcão");
  const [saleAmount, setSaleAmount] = useState("0");
  const [receivedDisplay, setReceivedDisplay] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("Pix");
  const [saleNotes, setSaleNotes] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [expense, setExpense] = useState({
    description: "",
    amount: "",
    category: "",
    payment_method: "Pix",
    entry_date: today(),
    notes: "",
  });

  const { data: cashEntries } = useQuery({
    queryKey: ["cash"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_entries")
        .select("*, clients(name), orders(number)")
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const { data: orders } = useQuery({
    queryKey: ["cash-open-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,number,title,total,paid,payment_status,client_id,clients(name,whatsapp)")
        .order("created_at", { ascending: false })
        .limit(250);
      if (error) throw error;
      return ((data ?? []) as any[]).filter((order) => Number(order.total) > Number(order.paid));
    },
  });

  const { data: clients } = useQuery({
    queryKey: ["cash-clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id,name").order("name");
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const selectedOrder = (orders ?? []).find((order) => order.id === selectedOrderId);
  const orderRemaining = selectedOrder
    ? Math.max(0, Number(selectedOrder.total) - Number(selectedOrder.paid))
    : 0;
  const customAmount = currencyFromDisplay(saleAmount);
  const amountToCharge = mode === "order" ? orderRemaining : customAmount;
  const receivedAmount =
    paymentMethod === "Dinheiro" ? currencyFromDisplay(receivedDisplay) : amountToCharge;
  const change = Math.max(0, receivedAmount - amountToCharge);
  const missing = Math.max(0, amountToCharge - receivedAmount);

  const totals = useMemo(
    () =>
      (cashEntries ?? []).reduce(
        (acc, entry) => {
          if (entry.type === "entrada") acc.in += Number(entry.amount) || 0;
          else acc.out += Number(entry.amount) || 0;
          return acc;
        },
        { in: 0, out: 0 },
      ),
    [cashEntries],
  );

  const todaysEntries = useMemo(
    () => (cashEntries ?? []).filter((entry) => entry.entry_date === today()),
    [cashEntries],
  );
  const todayTotals = todaysEntries.reduce(
    (acc, entry) => {
      if (entry.type === "entrada") acc.in += Number(entry.amount) || 0;
      else acc.out += Number(entry.amount) || 0;
      return acc;
    },
    { in: 0, out: 0 },
  );

  const filteredOrders = (orders ?? []).filter((order) => {
    const term = orderSearch.toLowerCase();
    return (
      !term ||
      String(order.number).includes(term) ||
      String(order.title ?? "")
        .toLowerCase()
        .includes(term) ||
      String(order.clients?.name ?? "")
        .toLowerCase()
        .includes(term)
    );
  });

  function resetSale() {
    setSelectedOrderId("");
    setClientId("");
    setSaleDescription("Venda balcão");
    setSaleAmount("0");
    setReceivedDisplay("0");
    setPaymentMethod("Pix");
    setSaleNotes("");
  }

  function setExactReceived() {
    setReceivedDisplay(amountToCharge.toFixed(2).replace(".", ","));
  }

  async function chargeSale() {
    if (amountToCharge <= 0) return toast.error("Informe um valor para cobrar");
    if (mode === "order" && !selectedOrder) return toast.error("Selecione uma OS para receber");
    if (paymentMethod === "Dinheiro" && receivedAmount < amountToCharge) {
      return toast.error(`Faltam ${brl(missing)} para concluir a cobrança`);
    }
    if (mode === "custom" && !saleDescription.trim()) {
      return toast.error("Informe a descrição da venda");
    }

    const receivableId = selectedOrder ? await findReceivableId(selectedOrder.id) : null;
    const description =
      mode === "order"
        ? `Recebimento OS #${selectedOrder.number} - ${selectedOrder.clients?.name ?? "Cliente"}`
        : saleDescription.trim();

    const { error: cashError } = await supabase.from("cash_entries").insert({
      type: "entrada",
      description,
      category: mode === "order" ? "Pagamento de OS" : "Venda de serviço",
      amount: amountToCharge,
      entry_date: today(),
      payment_method: paymentMethod,
      client_id: mode === "order" ? selectedOrder.client_id : clientId || null,
      order_id: mode === "order" ? selectedOrder.id : null,
      receivable_id: receivableId,
      notes:
        paymentMethod === "Dinheiro"
          ? `${saleNotes || ""} Recebido: ${brl(receivedAmount)}. Troco: ${brl(change)}.`.trim()
          : saleNotes || null,
    });
    if (cashError) return toast.error(cashError.message);

    if (mode === "order" && selectedOrder) {
      const nextPaid = Math.min(
        Number(selectedOrder.total),
        Number(selectedOrder.paid) + amountToCharge,
      );
      const { error: orderError } = await supabase
        .from("orders")
        .update({ paid: nextPaid, payment_method: paymentMethod })
        .eq("id", selectedOrder.id);
      if (orderError) return toast.error(orderError.message);
    }

    toast.success(
      paymentMethod === "Dinheiro" && change > 0
        ? `Cobrança concluída. Troco: ${brl(change)}`
        : "Cobrança concluída",
    );
    resetSale();
    invalidateCash();
  }

  async function saveExpense() {
    const amount = Number(expense.amount);
    if (!expense.description.trim() || !amount) return toast.error("Preencha descrição e valor");
    const { error } = await supabase.from("cash_entries").insert({
      type: "saida",
      description: expense.description.trim(),
      category: expense.category || "Outros",
      amount,
      entry_date: expense.entry_date,
      payment_method: expense.payment_method || null,
      notes: expense.notes || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Saída registrada");
    setExpense({
      description: "",
      amount: "",
      category: "",
      payment_method: "Pix",
      entry_date: today(),
      notes: "",
    });
    invalidateCash();
  }

  async function remove(id: string) {
    if (!confirm("Excluir lançamento?")) return;
    const { error } = await supabase.from("cash_entries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Lançamento excluído");
    invalidateCash();
  }

  function invalidateCash() {
    qc.invalidateQueries({ queryKey: ["cash"] });
    qc.invalidateQueries({ queryKey: ["cash-open-orders"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["orders"] });
    qc.invalidateQueries({ queryKey: ["receivables"] });
  }

  async function findReceivableId(orderId: string) {
    const { data } = await supabase
      .from("receivables")
      .select("id")
      .eq("order_id", orderId)
      .neq("status", "pago")
      .limit(1)
      .maybeSingle();
    return data?.id ?? null;
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ArrowDownCircle className="h-4 w-4 text-emerald-600" /> Entradas gerais
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-600">{brl(totals.in)}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ArrowUpCircle className="h-4 w-4 text-destructive" /> Saídas gerais
          </div>
          <div className="mt-2 text-2xl font-extrabold text-destructive">{brl(totals.out)}</div>
        </Card>
        <Card className="bg-primary p-4 text-primary-foreground">
          <div className="flex items-center gap-2 text-xs text-primary-foreground/75">
            <WalletCards className="h-4 w-4" /> Saldo do caixa
          </div>
          <div className="mt-2 text-2xl font-extrabold text-gold">
            {brl(totals.in - totals.out)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ReceiptText className="h-4 w-4 text-primary" /> Movimento de hoje
          </div>
          <div className="mt-2 text-lg font-extrabold text-primary">
            {brl(todayTotals.in - todayTotals.out)}
          </div>
          <p className="text-xs text-muted-foreground">
            {brl(todayTotals.in)} entrou · {brl(todayTotals.out)} saiu
          </p>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <Card className="overflow-hidden">
          <div className="border-b bg-gradient-to-r from-primary to-brand-blue-light p-5 text-primary-foreground">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
                  PDV Alcateia's
                </p>
                <h1 className="text-2xl font-extrabold">Caixa de cobrança</h1>
                <p className="text-sm text-primary-foreground/70">
                  Receba OS em aberto, venda avulsa, calcule troco e registre tudo no caixa.
                </p>
              </div>
              <Badge className="bg-gold text-primary">Operação de hoje</Badge>
            </div>
          </div>

          <div className="p-5">
            <Tabs value={mode} onValueChange={(value) => setMode(value as PosMode)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="order">
                  <ShoppingCart className="mr-2 h-4 w-4" /> Cobrar OS
                </TabsTrigger>
                <TabsTrigger value="custom">
                  <Banknote className="mr-2 h-4 w-4" /> Venda avulsa
                </TabsTrigger>
              </TabsList>

              <TabsContent value="order" className="mt-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Buscar OS, cliente ou serviço"
                    value={orderSearch}
                    onChange={(event) => setOrderSearch(event.target.value)}
                  />
                </div>
                <div className="grid max-h-80 gap-2 overflow-y-auto pr-1">
                  {filteredOrders.map((order) => {
                    const remaining = Math.max(0, Number(order.total) - Number(order.paid));
                    const active = order.id === selectedOrderId;
                    return (
                      <button
                        key={order.id}
                        type="button"
                        onClick={() => {
                          setSelectedOrderId(order.id);
                          setReceivedDisplay(remaining.toFixed(2).replace(".", ","));
                        }}
                        className={`rounded-2xl border p-3 text-left transition-all ${
                          active
                            ? "border-gold bg-gold/12 shadow-[var(--shadow-md)]"
                            : "bg-white hover:border-gold/70"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-mono text-xs font-bold text-primary">
                              OS #{order.number}
                            </div>
                            <div className="font-bold">{order.title || order.clients?.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {order.clients?.name}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">A receber</div>
                            <div className="font-mono font-extrabold text-primary">
                              {brl(remaining)}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {!filteredOrders.length && (
                    <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                      Nenhuma OS em aberto para cobrança.
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="custom" className="mt-4 space-y-4">
                <div>
                  <Label>Descrição da venda</Label>
                  <Input
                    value={saleDescription}
                    onChange={(event) => setSaleDescription(event.target.value)}
                    placeholder="Ex.: Impressão, banner, adesivo..."
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label>Cliente opcional</Label>
                    <Select
                      value={clientId || "none"}
                      onValueChange={(value) => setClientId(value === "none" ? "" : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sem cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem cliente</SelectItem>
                        {(clients ?? []).map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Valor da venda</Label>
                    <Input
                      value={saleAmount}
                      onChange={(event) => setSaleAmount(event.target.value)}
                      inputMode="decimal"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_280px]">
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label>Forma de pagamento</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((method) => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>
                      {paymentMethod === "Dinheiro" ? "Valor recebido" : "Valor cobrado"}
                    </Label>
                    <Input
                      value={
                        paymentMethod === "Dinheiro"
                          ? receivedDisplay
                          : amountToCharge.toFixed(2).replace(".", ",")
                      }
                      onChange={(event) => setReceivedDisplay(event.target.value)}
                      disabled={paymentMethod !== "Dinheiro"}
                      inputMode="decimal"
                    />
                  </div>
                </div>

                <div>
                  <Label>Observações da cobrança</Label>
                  <Textarea
                    rows={3}
                    value={saleNotes}
                    onChange={(event) => setSaleNotes(event.target.value)}
                    placeholder="Ex.: comprovante enviado, parcelamento, condição especial..."
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <SummaryCard label="Total a cobrar" value={brl(amountToCharge)} tone="primary" />
                  <SummaryCard label="Recebido" value={brl(receivedAmount)} tone="success" />
                  <SummaryCard
                    label={missing > 0 ? "Falta" : "Troco"}
                    value={brl(missing > 0 ? missing : change)}
                    tone={missing > 0 ? "danger" : "gold"}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={chargeSale} size="lg" className="flex-1">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Finalizar cobrança
                  </Button>
                  <Button variant="outline" onClick={setExactReceived}>
                    Valor exato
                  </Button>
                  <Button variant="ghost" onClick={resetSale}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Limpar
                  </Button>
                </div>
              </div>

              <CalculatorPad
                value={paymentMethod === "Dinheiro" ? receivedDisplay : saleAmount}
                disabled={paymentMethod !== "Dinheiro" && mode === "order"}
                onChange={(value) =>
                  paymentMethod === "Dinheiro" ? setReceivedDisplay(value) : setSaleAmount(value)
                }
              />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5 text-destructive" />
            <div>
              <h2 className="font-extrabold text-primary">Registrar saída</h2>
              <p className="text-xs text-muted-foreground">Controle gastos, compras e retiradas.</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <Label>Descrição</Label>
              <Input
                value={expense.description}
                onChange={(event) => setExpense({ ...expense, description: event.target.value })}
                placeholder="Ex.: Compra de papel, tinta, entrega..."
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Valor</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={expense.amount}
                  onChange={(event) => setExpense({ ...expense, amount: event.target.value })}
                />
              </div>
              <div>
                <Label>Data</Label>
                <Input
                  type="date"
                  value={expense.entry_date}
                  onChange={(event) => setExpense({ ...expense, entry_date: event.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Categoria</Label>
              <Select
                value={expense.category || "Outros"}
                onValueChange={(value) => setExpense({ ...expense, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CASH_OUT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Forma de pagamento</Label>
              <Select
                value={expense.payment_method}
                onValueChange={(value) => setExpense({ ...expense, payment_method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                rows={3}
                value={expense.notes}
                onChange={(event) => setExpense({ ...expense, notes: event.target.value })}
              />
            </div>
            <Button variant="destructive" className="w-full" onClick={saveExpense}>
              Registrar saída
            </Button>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div>
            <h2 className="font-extrabold text-primary">Histórico do caixa</h2>
            <p className="text-xs text-muted-foreground">
              Últimos 300 lançamentos de entrada e saída.
            </p>
          </div>
          <div className="flex gap-2 text-xs">
            {CASH_IN_CATEGORIES.slice(0, 3).map((category) => (
              <Badge key={category} variant="outline">
                {category}
              </Badge>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="w-10 p-3 text-left"></th>
                <th className="p-3 text-left">Data</th>
                <th className="p-3 text-left">Descrição</th>
                <th className="hidden p-3 text-left md:table-cell">Categoria</th>
                <th className="hidden p-3 text-left lg:table-cell">Pagamento</th>
                <th className="p-3 text-right">Valor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(cashEntries ?? []).map((entry) => (
                <tr key={entry.id} className="border-t hover:bg-muted/30">
                  <td className="p-3">
                    {entry.type === "entrada" ? (
                      <ArrowDownCircle className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <ArrowUpCircle className="h-4 w-4 text-destructive" />
                    )}
                  </td>
                  <td className="whitespace-nowrap p-3">{fmtDate(entry.entry_date)}</td>
                  <td className="p-3">
                    <div className="font-medium">{entry.description}</div>
                    <div className="text-xs text-muted-foreground">
                      {entry.clients?.name}
                      {entry.orders?.number ? ` · OS #${entry.orders.number}` : ""}
                    </div>
                  </td>
                  <td className="hidden p-3 md:table-cell">
                    <Badge variant="outline">{entry.category || "Sem categoria"}</Badge>
                  </td>
                  <td className="hidden p-3 lg:table-cell">{entry.payment_method || "—"}</td>
                  <td
                    className={`p-3 text-right font-mono font-bold ${
                      entry.type === "entrada" ? "text-emerald-600" : "text-destructive"
                    }`}
                  >
                    {entry.type === "entrada" ? "+" : "-"} {brl(entry.amount)}
                  </td>
                  <td className="p-3 text-right">
                    <Button size="icon" variant="ghost" onClick={() => remove(entry.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
              {!cashEntries?.length && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Sem lançamentos no caixa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "primary" | "success" | "danger" | "gold";
}) {
  const toneClass = {
    primary: "text-primary",
    success: "text-emerald-600",
    danger: "text-destructive",
    gold: "text-gold",
  }[tone];
  return (
    <div className="rounded-2xl border bg-white p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-extrabold ${toneClass}`}>{value}</p>
    </div>
  );
}

function CalculatorPad({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const keys = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", ",", "⌫"];
  return (
    <div className={`rounded-2xl border bg-muted/40 p-3 ${disabled ? "opacity-55" : ""}`}>
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-primary">
        <Calculator className="h-4 w-4" /> Calculadora
      </div>
      <div className="mb-3 rounded-xl bg-white px-3 py-3 text-right font-mono text-2xl font-extrabold shadow-inner">
        {value || "0"}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => {
              if (key === "⌫") onChange(value.length > 1 ? value.slice(0, -1) : "0");
              else onChange(appendDigit(value || "0", key));
            }}
            className="h-12 rounded-xl bg-white text-lg font-extrabold shadow-sm transition hover:-translate-y-0.5 hover:bg-gold/15 disabled:pointer-events-none"
          >
            {key}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("0")}
          className="col-span-3 h-11 rounded-xl border border-destructive/20 bg-destructive/8 text-sm font-bold text-destructive transition hover:bg-destructive/15 disabled:pointer-events-none"
        >
          Limpar calculadora
        </button>
      </div>
    </div>
  );
}
