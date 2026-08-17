// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Banknote,
  Calculator,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  ReceiptText,
  Minus,
  Pencil,
  Plus,
  QrCode,
  Search,
  ShoppingCart,
  Trash2,
  WalletCards,
  UserPlus,
  Settings2,
  X,
  Zap,
  Target,
  Monitor,
  Printer,
  ChevronRight,
  User,
  Star,
  Package,
  ArrowRight,
  Contact,
  FileText,
  Tags,
  Flag,
  Shirt,
  Coffee,
  Gift,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { brl } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PdvCalculator } from "@/components/pdv/PdvCalculator";

export const Route = createFileRoute("/_authenticated/pdv")({ component: PDVPage });

function buildClosureReceiptHtml(c: any, items: any[]) {
  const m = c.by_method || {};
  const ok = Math.abs(Number(c.difference || 0)) < 0.01;
  const fmtBrl = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v || 0));
  const date = new Date(c.closure_date + "T12:00:00").toLocaleDateString("pt-BR");
  const closedAt = c.closed_at
    ? new Date(c.closed_at).toLocaleString("pt-BR")
    : new Date().toLocaleString("pt-BR");

  const rows = (items || [])
    .map((it) => {
      const time = new Date(it.created_at).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const sign = it.type === "saida" ? "-" : "+";
      const cls = it.type === "saida" ? "out" : "in";
      const desc = String(it.description || it.category || "Lançamento").replace(/</g, "&lt;");
      const pm = String(it.payment_method || "").replace(/</g, "&lt;");
      return `<tr><td>${time}</td><td>${desc}<div class="muted">${pm}</div></td><td class="right ${cls}">${sign}${fmtBrl(it.amount)}</td></tr>`;
    })
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"><title>Fechamento ${date}</title>
<style>
body{font-family:system-ui,-apple-system,Arial;padding:20px;max-width:520px;margin:0 auto;color:#0f172a}
h1{font-size:18px;margin:0 0 2px}h2{font-size:12px;margin:14px 0 6px;text-transform:uppercase;letter-spacing:.08em;color:#475569}
table{width:100%;border-collapse:collapse;font-size:12px}
td{padding:5px 0;border-bottom:1px dashed #cbd5e1;vertical-align:top}
.right{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.in{color:#059669;font-weight:700}.out{color:#dc2626;font-weight:700}
.total{font-weight:800;border-top:2px solid #0f172a;padding-top:6px}
.diff-ok{color:#059669;font-weight:800}.diff-bad{color:#b45309;font-weight:800}
.muted{color:#64748b;font-size:10px}
.brand{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #0f172a;padding-bottom:6px;margin-bottom:6px}
.brand strong{font-size:14px}.tag{font-size:10px;color:#64748b}
.badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:800}
.ok{background:#d1fae5;color:#065f46}.bad{background:#fef3c7;color:#92400e}
@media print{button{display:none}}
</style></head><body>
<div class="brand"><strong>Alcateia Produções Gráficas</strong><span class="tag">Fechamento de caixa</span></div>
<h1>Recibo de Fechamento</h1>
<p class="muted">${date} · Fechado em ${closedAt} · Operador: ${c.operator || "—"} · <span class="badge ${ok ? "ok" : "bad"}">${ok ? "Caixa bate" : "Com diferença"}</span></p>

<h2>Resumo</h2>
<table>
  <tr><td>Troco inicial</td><td class="right">${fmtBrl(c.initial_amount)}</td></tr>
  <tr><td>Entradas</td><td class="right in">${fmtBrl(c.total_in)}</td></tr>
  <tr><td>Saídas</td><td class="right out">${fmtBrl(c.total_out)}</td></tr>
  <tr class="total"><td>Saldo do dia</td><td class="right">${fmtBrl(Number(c.total_in) - Number(c.total_out))}</td></tr>
  <tr><td>Lançamentos</td><td class="right">${c.entries_count}</td></tr>
</table>

<h2>Por forma de pagamento</h2>
<table>
  <tr><td>Dinheiro</td><td class="right">${fmtBrl(m.cash || 0)}</td></tr>
  <tr><td>PIX</td><td class="right">${fmtBrl(m.pix || 0)}</td></tr>
  <tr><td>Débito</td><td class="right">${fmtBrl(m.debit || 0)}</td></tr>
  <tr><td>Crédito</td><td class="right">${fmtBrl(m.credit || 0)}</td></tr>
  ${m.other ? `<tr><td>Outros</td><td class="right">${fmtBrl(m.other)}</td></tr>` : ""}
</table>

<h2>Conferência do dinheiro</h2>
<table>
  <tr><td>Esperado em dinheiro</td><td class="right">${fmtBrl(c.expected_cash)}</td></tr>
  <tr><td>Contado na gaveta</td><td class="right">${fmtBrl(c.counted_cash)}</td></tr>
  <tr class="total"><td>Diferença</td><td class="right ${ok ? "diff-ok" : "diff-bad"}">${fmtBrl(c.difference)}</td></tr>
</table>

${items?.length ? `<h2>Vendas e lançamentos do dia (${items.length})</h2>
<table>${rows}</table>` : ""}

${c.notes ? `<h2>Observações</h2><p style="font-size:12px">${String(c.notes).replace(/</g, "&lt;")}</p>` : ""}

<p style="margin-top:24px;text-align:center"><button onclick="window.print()" style="padding:8px 18px;border-radius:8px;border:1px solid #0f172a;background:#0f172a;color:#fff;font-weight:700;cursor:pointer">Imprimir / Salvar PDF</button></p>
<script>setTimeout(()=>window.print(),350)</script>
</body></html>`;
}

function openClosureReceipt(c: any, items: any[]) {
  const html = buildClosureReceiptHtml(c, items);
  const w = window.open("", "_blank", "width=560,height=760");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

const QUICK_PRODUCTS = [
  {
    id: "quick-card",
    name: "Cartão de Visita",
    category: "Impressão",
    price: 59.9,
    detail: "4x4 cores • Couchê 300g",
    imageUrl: undefined,
    image: "linear-gradient(135deg,#ede9fe,#6d28d9)",
  },
  {
    id: "quick-flyer",
    name: "Panfleto",
    category: "Impressão",
    price: 129.9,
    detail: "15x21cm • Couchê 90g",
    imageUrl: undefined,
    image: "linear-gradient(135deg,#f3f4f6,#7c3aed)",
  },
  {
    id: "quick-banner",
    name: "Banner",
    category: "Banners",
    price: 89.9,
    detail: "60x90cm • Lona 440g",
    imageUrl: undefined,
    image: "linear-gradient(135deg,#ddd6fe,#312e81)",
  },
  {
    id: "quick-mug",
    name: "Caneca Personalizada",
    category: "Canecas",
    price: 49.9,
    detail: "Cerâmica • 325ml",
    imageUrl: undefined,
    image: "linear-gradient(135deg,#fafafa,#a78bfa)",
  },
  {
    id: "quick-shirt",
    name: "Camiseta Personalizada",
    category: "Camisetas",
    price: 59.9,
    detail: "Poliéster • Sublimação",
    imageUrl: undefined,
    image: "linear-gradient(135deg,#fff,#8b5cf6)",
  },
  {
    id: "quick-sticker",
    name: "Adesivo",
    category: "Adesivos",
    price: 8.9,
    detail: "Personalizado • Vinil",
    imageUrl: undefined,
    image: "linear-gradient(135deg,#fef3c7,#6d28d9)",
  },
];

const CATEGORIES = [
  { slug: "Todos", label: "Todos", Icon: Package },
  { slug: "Impressão", label: "Impressão", Icon: FileText },
  { slug: "Canecas", label: "Canecas", Icon: Coffee },
  { slug: "Camisetas", label: "Camisetas", Icon: Shirt },
  { slug: "Adesivos", label: "Adesivos", Icon: Tags },
  { slug: "Banners", label: "Banners", Icon: Flag },
  { slug: "Cartões", label: "Cartões", Icon: Contact },
  { slug: "Outros", label: "Outros", Icon: Gift },
];
const PAYMENT_OPTIONS = [
  { id: "PIX QR Code", label: "PIX QR", icon: QrCode },
  { id: "PIX maquininha", label: "PIX máquina", icon: QrCode },
  { id: "Cartão de débito", label: "Débito", icon: CreditCard },
  { id: "Cartão de crédito", label: "Crédito", icon: WalletCards },
  { id: "Dinheiro", label: "Dinheiro", icon: Banknote },
];

const SESSION_KEY = "alcateia_pdv_session";
const MACHINE_PAYMENT_OPTIONS = [
  "Cartão de débito",
  "Cartão de crédito",
  "PIX maquininha",
] as const;
const FAVORITE_TERMS = [
  "impress",
  "banner",
  "adesivo",
  "caneca",
  "camiseta",
  "cart",
  "panfleto",
  "folder",
];

function today() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString(), day: today() };
}

function toNumber(value: unknown) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function PDVPage() {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [cart, setCart] = useState<any[]>([]);
  const [discount, setDiscount] = useState(0);
  const [clientName, setClientName] = useState("");
  const [clientId, setClientId] = useState("");
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", whatsapp: "", notes: "" });
  const [saleNote, setSaleNote] = useState("");
  const [saleDate, setSaleDate] = useState(today());
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [showOrderPicker, setShowOrderPicker] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [showFastSale, setShowFastSale] = useState(false);
  const [showSquareMeter, setShowSquareMeter] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showMachineEntry, setShowMachineEntry] = useState(false);
  const [showOpenCash, setShowOpenCash] = useState(false);
  const [showCloseCash, setShowCloseCash] = useState(false);
  const [fastSale, setFastSale] = useState({ description: "", value: "" });
  const [squareMeter, setSquareMeter] = useState({
    description: "Adesivo personalizado",
    widthCm: "",
    heightCm: "",
    quantity: "1",
    pricePerSquareMeter: "100",
  });
  const [payments, setPayments] = useState([{ method: "PIX QR Code", amount: "" }]);
  const [machineEntry, setMachineEntry] = useState({
    date: today(),
    method: "Cartão de débito",
    amount: "",
    description: "Vendas da maquininha",
    notes: "",
  });
  const [cashSession, setCashSession] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch {
      return null;
    }
  });
  const [sessionForm, setSessionForm] = useState({
    operator: "Operador",
    initialAmount: "0",
    informedCash: "0",
    notes: "",
  });

  const { data: services = [] } = useQuery({
    queryKey: ["pdv_services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, category, base_price, description, image_url, active")
        .eq("active", true)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((s: any) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        price: Number(s.base_price || 0),
        detail: s.description || "",
        imageUrl: s.image_url,
      }));
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["pdv_clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, whatsapp")
        .order("name", { ascending: true })
        .limit(300);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: openOrders = [] } = useQuery({
    queryKey: ["pdv_open_orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, number, title, total, paid, payment_status, client_id, clients(name, whatsapp)",
        )
        .order("created_at", { ascending: false })
        .limit(250);
      if (error) throw error;
      return (data ?? []).filter((order) => Number(order.total) > Number(order.paid));
    },
  });

  const { data: todayEntries = [], error: todayEntriesError } = useQuery({
    queryKey: ["pdv_cash_entries_today"],
    queryFn: async () => {
      const range = todayRange();
      const { data, error } = await supabase
        .from("cash_entries")
        .select("*")
        .or(
          `entry_date.eq.${range.day},and(created_at.gte.${range.start},created_at.lt.${range.end})`,
        )
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data ?? [];
    },
  });

  async function deleteEntry(entry: any) {
    if (!entry?.id) return;
    const label = entry.description || entry.category || "lançamento";
    if (!confirm(`Excluir "${label}" de ${brl(Number(entry.amount || 0))}? Esta ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from("cash_entries").delete().eq("id", entry.id);
    if (error) return toast.error(error.message);
    toast.success("Lançamento excluído");
    qc.invalidateQueries({ queryKey: ["pdv_cash_entries_today"] });
    qc.invalidateQueries({ queryKey: ["cash_entries"] });
  }

  async function editEntry(entry: any) {
    if (!entry?.id) return;
    const rawAmount = prompt(
      `Novo valor para "${entry.description || entry.category || "lançamento"}" (use ponto para decimais):`,
      String(entry.amount ?? ""),
    );
    if (rawAmount === null) return;
    const amount = Number(String(rawAmount).replace(",", "."));
    if (!Number.isFinite(amount) || amount < 0) return toast.error("Valor inválido");
    const description = prompt("Descrição:", entry.description || "") ?? entry.description;
    const { error } = await supabase
      .from("cash_entries")
      .update({ amount, description })
      .eq("id", entry.id);
    if (error) return toast.error(error.message);
    toast.success("Lançamento atualizado");
    qc.invalidateQueries({ queryKey: ["pdv_cash_entries_today"] });
    qc.invalidateQueries({ queryKey: ["cash_entries"] });
  }

  const products = useMemo(() => {
    const serviceProducts = services.map((service) => ({
      ...service,
      image: "linear-gradient(135deg,#f3f4f6,#080c16)", // fallback solid gradient
    }));
    return serviceProducts.length ? serviceProducts : QUICK_PRODUCTS;
  }, [services]);

  const filteredProducts = products.filter((product) => {
    const matchesQuery = `${product.name} ${product.detail}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesCategory = category === "Todos" || product.category === category;
    return matchesQuery && matchesCategory;
  });
  const favoriteProducts = products
    .filter((product) => {
      const text = `${product.name} ${product.category} ${product.detail}`.toLocaleLowerCase(
        "pt-BR",
      );
      return FAVORITE_TERMS.some((term) => text.includes(term));
    })
    .slice(0, 8);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = Math.max(subtotal - discount, 0);
  const paidTotal = payments.reduce((acc, payment) => acc + toNumber(payment.amount), 0);
  const change = paidTotal - total;
  const squareMeterWidth = toNumber(squareMeter.widthCm) / 100;
  const squareMeterHeight = toNumber(squareMeter.heightCm) / 100;
  const squareMeterQuantity = Math.max(0, toNumber(squareMeter.quantity));
  const squareMeterUnitArea = squareMeterWidth * squareMeterHeight;
  const squareMeterTotalArea = squareMeterUnitArea * squareMeterQuantity;
  const squareMeterTotal = squareMeterTotalArea * toNumber(squareMeter.pricePerSquareMeter);
  const selectedOrder = openOrders.find((order) => order.id === selectedOrderId);
  const filteredOrders = openOrders.filter((order) => {
    const term = orderSearch.trim().toLocaleLowerCase("pt-BR");
    return (
      !term ||
      String(order.number).includes(term) ||
      String(order.title ?? "")
        .toLocaleLowerCase("pt-BR")
        .includes(term) ||
      String(order.clients?.name ?? "")
        .toLocaleLowerCase("pt-BR")
        .includes(term)
    );
  });

  const salesToday = todayEntries.filter((entry) => entry.type === "entrada");
  const expensesToday = todayEntries.filter((entry) => entry.type === "saida");
  const totalToday = salesToday.reduce((acc, entry) => acc + Number(entry.amount || 0), 0);
  const expenseTotal = expensesToday.reduce((acc, entry) => acc + Number(entry.amount || 0), 0);
  const dayBalance = totalToday - expenseTotal;
  const paymentTotals = salesToday.reduce(
    (totals, entry) => {
      const method = String(entry.payment_method || "").toLocaleLowerCase("pt-BR");
      const amount = Number(entry.amount || 0);
      if (method.includes("débito") || method.includes("debito")) totals.debit += amount;
      else if (method.includes("crédito") || method.includes("credito")) totals.credit += amount;
      else if (method.includes("pix")) totals.pix += amount;
      else if (method.includes("dinheiro")) totals.cash += amount;
      else totals.other += amount;
      return totals;
    },
    { cash: 0, pix: 0, debit: 0, credit: 0, other: 0 },
  );
  const latestTodayEntries = todayEntries.slice(0, 8);
  function addToCart(product: any) {
    if (selectedOrderId) {
      toast.error("Conclua ou limpe a cobrança da OS antes de adicionar outros itens.");
      return;
    }
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...current, { ...product, quantity: 1 }];
    });
  }

  function changeQty(productId: string, delta: number) {
    if (selectedOrderId && productId === `order-${selectedOrderId}`) {
      if (delta > 0) return;
      setSelectedOrderId("");
    }
    setCart((current) =>
      current
        .map((item) =>
          item.id === productId ? { ...item, quantity: Math.max(item.quantity + delta, 0) } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function clearSale() {
    setCart([]);
    if (selectedOrderId) {
      setClientId("");
      setClientName("");
    }
    setSelectedOrderId("");
    setSaleNote("");
  }

  function addFastSale() {
    if (selectedOrderId) {
      toast.error("Conclua ou limpe a cobrança da OS antes de criar uma venda rápida.");
      return;
    }
    const value = toNumber(fastSale.value);
    if (!fastSale.description.trim() || value <= 0) {
      toast.error("Informe descrição e valor da venda rápida.");
      return;
    }
    addToCart({
      id: `fast-${Date.now()}`,
      name: fastSale.description.trim(),
      category: "Outros",
      price: value,
      detail: "Venda rápida",
    });
    setFastSale({ description: "", value: "" });
    setShowFastSale(false);
    toast.success("Venda rápida adicionada ao carrinho.");
  }

  function addSquareMeterSale() {
    if (selectedOrderId) {
      toast.error("Conclua ou limpe a cobrança da OS antes de calcular outro item.");
      return;
    }
    if (
      !squareMeter.description.trim() ||
      squareMeterWidth <= 0 ||
      squareMeterHeight <= 0 ||
      squareMeterQuantity <= 0 ||
      toNumber(squareMeter.pricePerSquareMeter) <= 0
    ) {
      toast.error("Preencha descrição, medidas, quantidade e preço por m².");
      return;
    }

    addToCart({
      id: `m2-${Date.now()}`,
      name: squareMeter.description.trim(),
      category: "Venda por m²",
      price: squareMeterTotal,
      quantity: 1,
      detail: `${squareMeter.widthCm} x ${squareMeter.heightCm} cm • ${squareMeterQuantity} un. • ${squareMeterTotalArea.toFixed(4).replace(".", ",")} m²`,
    });
    setShowSquareMeter(false);
    toast.success("Cálculo por m² adicionado ao carrinho.");
  }

  function loadOrder(order: any) {
    const remaining = Math.max(0, Number(order.total) - Number(order.paid));
    if (remaining <= 0) return toast.error("Esta OS já está totalmente paga.");
    setSelectedOrderId(order.id);
    setClientId(order.client_id);
    setClientName(order.clients?.name || "");
    setCart([
      {
        id: `order-${order.id}`,
        name: `OS #${order.number} - ${order.title || "Serviço"}`,
        category: "Ordem de Serviço",
        price: remaining,
        quantity: 1,
        detail: `${order.clients?.name || "Cliente"} • saldo pendente`,
      },
    ]);
    setDiscount(0);
    setSaleNote(`Recebimento vinculado à OS #${order.number}`);
    setShowOrderPicker(false);
    toast.success(`OS #${order.number} adicionada ao caixa.`);
  }

  function openCash() {
    const session = {
      operator: sessionForm.operator || "Operador",
      initialAmount: toNumber(sessionForm.initialAmount),
      openedAt: new Date().toISOString(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setCashSession(session);
    setShowOpenCash(false);
    toast.success("Caixa aberto.");
  }

  async function closeCashAndSave() {
    try {
      const counted = toNumber(sessionForm.informedCash);
      const expectedCash = paymentTotals.cash + Number(cashSession?.initialAmount || 0);
      const diff = counted - expectedCash;
      const payload = {
        closure_date: today(),
        opened_at: cashSession?.openedAt || null,
        operator: cashSession?.operator || sessionForm.operator || "Operador",
        initial_amount: Number(cashSession?.initialAmount || 0),
        expected_cash: expectedCash,
        counted_cash: counted,
        difference: diff,
        total_in: totalToday,
        total_out: expenseTotal,
        by_method: {
          cash: paymentTotals.cash,
          pix: paymentTotals.pix,
          debit: paymentTotals.debit,
          credit: paymentTotals.credit,
          other: paymentTotals.other,
        },
        entries_count: todayEntries.length,
        notes: sessionForm.notes || null,
      };
      const { error } = await supabase.from("cash_closures" as any).insert(payload);
      if (error) {
        console.error("[closeCashAndSave] insert error", error);
        toast.error(`Não consegui fechar o caixa: ${error.message}`);
        return;
      }
      localStorage.removeItem(SESSION_KEY);
      setCashSession(null);
      setShowCloseCash(false);
      qc.invalidateQueries({ queryKey: ["cash_closures"] });
      openClosureReceipt({ ...payload, closed_at: new Date().toISOString() }, todayEntries);
      toast.success(
        Math.abs(diff) < 0.01
          ? "Caixa fechado certinho!"
          : `Caixa fechado. Diferença: ${brl(diff)}.`,
      );
    } catch (err: any) {
      console.error("[closeCashAndSave] unexpected", err);
      toast.error(err?.message || "Falha inesperada ao fechar o caixa.");
    }
  }

  async function registerMachineEntry() {
    const amount = toNumber(machineEntry.amount);
    if (!machineEntry.date) return toast.error("Informe a data da venda.");
    if (amount <= 0) return toast.error("Informe um valor maior que zero.");
    const { error } = await supabase.from("cash_entries").insert({
      type: "entrada",
      description: machineEntry.description.trim() || "Vendas da maquininha",
      amount,
      entry_date: machineEntry.date,
      payment_method: machineEntry.method,
      category: "Ajuste maquininha",
      notes: machineEntry.notes.trim() || "Lançamento manual de fechamento",
    });
    if (error) return toast.error(error.message);
    setMachineEntry({
      date: today(),
      method: "Cartão de débito",
      amount: "",
      description: "Vendas da maquininha",
      notes: "",
    });
    setShowMachineEntry(false);
    qc.invalidateQueries({ queryKey: ["pdv_cash_entries_today"] });
    qc.invalidateQueries({ queryKey: ["cash_entries"] });
    toast.success("Valor da maquininha registrado no caixa.");
  }

  async function finalizeSale() {
    if (!cart.length) return toast.error("Adicione pelo menos um item.");
    if (total <= 0) return toast.error("O total da venda deve ser maior que zero.");
    if (!saleDate) return toast.error("Informe a data da venda.");
    if (!payments.length || paidTotal < total)
      return toast.error("Pagamento insuficiente para finalizar.");

    const saleDescription = `PDV - ${cart.map((item) => `${item.quantity}x ${item.name}`).join(", ")}`;
    const mainMethod =
      payments.length > 1
        ? `Misto (${payments.map((payment) => `${payment.method}: ${brl(toNumber(payment.amount))}`).join(" + ")})`
        : payments[0].method;

    const receivableId = selectedOrder ? await findReceivableId(selectedOrder.id) : null;
    const { data: cashEntry, error } = await supabase
      .from("cash_entries")
      .insert({
        type: "entrada",
        description: saleDescription,
        amount: total,
        entry_date: saleDate,
        payment_method: mainMethod,
        category: selectedOrder ? "Pagamento de OS" : "Venda PDV",
        client_id: clientId || null,
        order_id: selectedOrder?.id || null,
        receivable_id: receivableId,
        notes: [
          clientName ? `Cliente: ${clientName}` : "",
          saleNote,
          discount ? `Desconto: ${brl(discount)}` : "",
        ]
          .filter(Boolean)
          .join(" | "),
      })
      .select("id")
      .single();

    if (error) {
      toast.error(error.message);
      return;
    }

    if (selectedOrder) {
      const nextPaid = Math.min(Number(selectedOrder.total), Number(selectedOrder.paid) + total);
      const fullyPaid = nextPaid >= Number(selectedOrder.total);
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          paid: nextPaid,
          payment_method: mainMethod,
          payment_status: fullyPaid ? "pago_completo" : "pago_parcial",
        })
        .eq("id", selectedOrder.id);
      if (orderError) {
        if (cashEntry?.id) await supabase.from("cash_entries").delete().eq("id", cashEntry.id);
        return toast.error(`A cobrança não foi concluída: ${orderError.message}`);
      }

      if (fullyPaid && receivableId) {
        await supabase
          .from("receivables")
          .update({
            status: "pago",
            paid_at: new Date(`${saleDate}T12:00:00`).toISOString(),
            payment_method: mainMethod,
          })
          .eq("id", receivableId);
      }
    }

    setCart([]);
    setDiscount(0);
    setClientName("");
    setClientId("");
    setSaleNote("");
    setSaleDate(today());
    setSelectedOrderId("");
    setPayments([{ method: "PIX QR Code", amount: "" }]);
    setShowCheckout(false);
    qc.invalidateQueries({ queryKey: ["pdv_cash_entries_today"] });
    qc.invalidateQueries({ queryKey: ["cash_entries"] });
    qc.invalidateQueries({ queryKey: ["pdv_open_orders"] });
    qc.invalidateQueries({ queryKey: ["orders"] });
    qc.invalidateQueries({ queryKey: ["receivables"] });
    toast.success("Venda finalizada e registrada no caixa.");
  }

  async function createClient() {
    if (!newClient.name.trim()) return toast.error("Informe o nome do cliente.");
    const { data, error } = await supabase
      .from("clients")
      .insert({
        name: newClient.name.trim(),
        whatsapp: newClient.whatsapp.trim() || null,
        notes: newClient.notes.trim() || null,
      })
      .select("id, name")
      .single();
    if (error) return toast.error(error.message);
    setClientId(data.id);
    setClientName(data.name);
    setNewClient({ name: "", whatsapp: "", notes: "" });
    setShowNewClient(false);
    qc.invalidateQueries({ queryKey: ["pdv_clients"] });
    toast.success("Cliente cadastrado e selecionado.");
  }

  function setExactPayment(method: string) {
    setPayments([{ method, amount: String(total.toFixed(2)) }]);
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
    <div className="min-h-[calc(100vh-8rem)] max-w-full overflow-x-hidden bg-[#f8fafc] text-slate-950 p-4 md:p-6 [zoom:0.9] xl:[zoom:1]">
      {/* Header Alinhado com a Marca */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#080c16] font-black text-brand-yellow shadow-lg shadow-black/5">
            A
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-[#080c16]">PDV Alcateia Produções Gráficas</h2>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Terminal de Vendas Ativo
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 border border-slate-200 shadow-sm">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-600">{new Date().toLocaleDateString("pt-BR")}</span>
          </div>

          <div className={cn(
            "flex items-center gap-2 rounded-xl px-3 py-2 border shadow-sm transition-colors",
            cashSession ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-amber-50 border-amber-100 text-amber-700"
          )}>
            <Banknote className="h-4 w-4" />
            <span className="text-xs font-bold">{cashSession ? "Caixa Aberto" : "Caixa Fechado"}</span>
          </div>

          {!cashSession ? (
            <Button
              size="sm"
              className="h-9 rounded-xl bg-[#080c16] hover:bg-[#1a202c] font-bold text-white shadow-md transition-all active:scale-95"
              onClick={() => setShowOpenCash(true)}
            >
              Abrir Caixa
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-9 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-white shadow-md transition-all active:scale-95"
              onClick={() => {
                setSessionForm((current) => ({
                  ...current,
                  informedCash: (paymentTotals.cash + Number(cashSession?.initialAmount || 0)).toFixed(2),
                }));
                setShowCloseCash(true);
              }}
            >
              Fechar Caixa
            </Button>
          )}
        </div>
      </div>
      {/* Saldo em Destaque - Visual Premium */}
      <div className="mb-8 grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-[1.5rem] bg-[#080c16] p-4 text-white shadow-xl">
          <div className="relative z-10">
            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white/40">Saldo</p>
            <p className="mt-0.5 text-xl font-black text-brand-yellow tabular-nums">{brl(dayBalance)}</p>
          </div>
          <Zap className="absolute -right-2 -bottom-2 h-12 w-12 opacity-10" />
        </div>

        <div className="rounded-[1.5rem] border border-slate-100 bg-white/60 p-4 backdrop-blur-xl shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">Entradas</p>
          <p className="mt-0.5 text-xl font-black text-emerald-600 tabular-nums">{brl(totalToday)}</p>
        </div>

        <div className="rounded-[1.5rem] border border-slate-100 bg-white/60 p-4 backdrop-blur-xl shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">Saídas</p>
          <p className="mt-0.5 text-xl font-black text-rose-600 tabular-nums">{brl(expenseTotal)}</p>
        </div>

        <div className="hidden lg:block rounded-[1.5rem] border border-slate-100 bg-white/60 p-4 backdrop-blur-xl shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">Operador</p>
          <p className="mt-0.5 text-base font-black text-[#080c16] truncate">{cashSession?.operator || "Sessão Inativa"}</p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Lado Esquerdo: Navegação e Produtos */}
        <section className="min-w-0 space-y-6">
          <div className="space-y-4">
            {/* Barra de Busca Premium */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-[#080c16] transition-colors" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-14 w-full rounded-2xl border-slate-200 bg-white pl-12 text-base shadow-sm ring-offset-background transition-all focus:border-[#080c16] focus:ring-2 focus:ring-[#080c16]/5 focus:shadow-md"
                placeholder="Pesquisar produto, código ou serviço..."
              />
            </div>

            {/* Área de Venda Rápida Integrada - Tablet First */}
            <div className="grid gap-4 sm:grid-cols-[1fr_120px_auto]">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#080c16] transition-colors">
                  <Zap className="h-5 w-5" />
                </div>
                <Input
                  value={fastSale.description}
                  onChange={(e) => setFastSale(prev => ({ ...prev, description: e.target.value }))}
                  className="h-14 w-full rounded-2xl border-slate-200 bg-white pl-12 text-base shadow-sm focus:border-[#080c16] focus:ring-2 focus:ring-[#080c16]/5"
                  placeholder="Venda rápida: Descrição do item..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && fastSale.description && fastSale.value) {
                      addToCart({
                        id: `fast-${Date.now()}`,
                        name: fastSale.description,
                        price: toNumber(fastSale.value),
                        category: "Venda Rápida",
                        detail: "Item avulso",
                        image: "linear-gradient(135deg,#ede9fe,#6d28d9)",
                      });
                      setFastSale({ description: "", value: "" });
                    }
                  }}
                />
              </div>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">R$</span>
                <Input
                  value={fastSale.value}
                  onChange={(e) => setFastSale(prev => ({ ...prev, value: e.target.value }))}
                  className="h-14 w-full rounded-2xl border-slate-200 bg-white pl-9 text-base font-black shadow-sm focus:border-[#080c16] focus:ring-2 focus:ring-[#080c16]/5"
                  placeholder="0,00"
                  inputMode="decimal"
                />
              </div>
              <Button
                disabled={!fastSale.description || !fastSale.value}
                className="h-14 rounded-2xl bg-[#080c16] px-6 font-black text-brand-yellow shadow-lg shadow-black/5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => {
                  addToCart({
                    id: `fast-${Date.now()}`,
                    name: fastSale.description,
                    price: toNumber(fastSale.value),
                    category: "Venda Rápida",
                    detail: "Item avulso",
                    image: "linear-gradient(135deg,#ede9fe,#6d28d9)",
                  });
                  setFastSale({ description: "", value: "" });
                }}
              >
                <Plus className="mr-2 h-5 w-5" /> ADICIONAR
              </Button>
            </div>

            {/* Ações Secundárias */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="h-10 rounded-xl border-slate-200 bg-white px-4 font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
                onClick={() => setShowSquareMeter(true)}
              >
                <Calculator className="mr-2 h-4 w-4 text-slate-400" /> Calcular m²
              </Button>
              <Button
                variant="outline"
                className="h-10 rounded-xl border-slate-200 bg-white px-4 font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
                onClick={() => setShowOrderPicker(true)}
              >
                <ClipboardList className="mr-2 h-4 w-4 text-slate-400" /> Cobrar O.S
              </Button>
              <Button
                variant="outline"
                className="h-10 rounded-xl border-slate-200 bg-white px-4 font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
                onClick={() => setShowCalculator(true)}
              >
                <Monitor className="mr-2 h-4 w-4 text-slate-400" /> Calculadora
              </Button>
            </div>
          </div>

          {/* Categorias Estilo Storefront */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Categorias</h3>
            <div className="app-scrollbar flex gap-3 overflow-x-auto pb-2">
              {CATEGORIES.map((item) => {
                const Icon = item.Icon;
                const isActive = category === item.slug;
                return (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => setCategory(item.slug)}
                    className={cn(
                      "flex min-w-[100px] flex-col items-center gap-2 rounded-[1.5rem] border-2 p-3 transition-all active:scale-95",
                      isActive
                        ? "border-[#080c16] bg-[#080c16] text-brand-yellow shadow-lg shadow-black/10"
                        : "border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:text-[#080c16]"
                    )}
                  >
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                      isActive ? "bg-white/10" : "bg-slate-50"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid de Produtos Moderno */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="group overflow-hidden rounded-[2rem] border-2 border-slate-100 bg-white p-0 shadow-sm transition-all hover:-translate-y-1 hover:border-[#080c16]/20 hover:shadow-xl"
              >
                <div
                  className="relative h-32 w-full bg-slate-50"
                  style={{
                    background: (product as any).imageUrl ? undefined : (product as any).image,
                    backgroundImage: (product as any).imageUrl ? `url(${(product as any).imageUrl})` : (product as any).image,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{product.category}</span>
                    <h3 className="line-clamp-1 text-sm font-black text-[#080c16]">{product.name}</h3>
                    <p className="line-clamp-1 text-[10px] font-bold text-slate-400">{product.detail}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-base font-black text-[#080c16]">{brl(product.price)}</span>
                    <Button
                      size="icon"
                      className="h-9 w-9 rounded-xl bg-[#080c16] shadow-md transition-all hover:bg-[#1a202c] active:scale-90"
                      onClick={() => addToCart(product)}
                    >
                      <Plus className="h-4 w-4 text-brand-yellow" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Carrinho / Receipt Sidebar */}
        <aside className="relative">
          <div className="sticky top-6 flex flex-col gap-4">
            <div className="overflow-hidden rounded-[2rem] border-2 border-[#080c16] bg-[#080c16] p-1 shadow-2xl">
              <div className="rounded-[1.8rem] bg-white p-6 shadow-inner">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-[#080c16]">Cupom Atual</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Checkout Terminal</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                    onClick={clearSale}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Limpar
                  </Button>
                </div>

                <div className="app-scrollbar max-h-[400px] space-y-4 overflow-y-auto pr-2">
                  {cart.length ? (
                    cart.map((item) => (
                      <div
                        key={item.id}
                        className="group flex items-start gap-3 rounded-2xl border border-slate-50 p-3 transition-colors hover:bg-slate-50"
                      >
                        <div className="flex flex-col items-center gap-1.5 rounded-xl bg-slate-100 p-1.5 min-w-[36px]">
                          <button
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[#080c16] shadow-sm hover:bg-slate-50 active:scale-90"
                            onClick={() => changeQty(item.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <span className="text-sm font-black text-[#080c16]">{item.quantity}</span>
                          <button
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[#080c16] shadow-sm hover:bg-slate-50 active:scale-90"
                            onClick={() => changeQty(item.id, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex-1 min-w-0 py-0.5">
                          <p className="truncate text-sm font-black text-[#080c16]">{item.name}</p>
                          <p className="truncate text-[10px] font-bold text-slate-400">{item.detail}</p>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-sm font-black text-[#080c16]">{brl(item.price * item.quantity)}</span>
                            <button
                              className="text-[10px] font-black uppercase text-rose-500 opacity-0 transition-opacity group-hover:opacity-100 p-1"
                              onClick={() => changeQty(item.id, -999)}
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-slate-300">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
                        <ShoppingCart className="h-8 w-8" />
                      </div>
                      <p className="text-sm font-black text-slate-400">Carrinho Vazio</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Aguardando itens...</p>
                    </div>
                  )}
                </div>

                <div className="mt-8 space-y-4 border-t border-dashed border-slate-200 pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subtotal</span>
                    <span className="text-sm font-black text-[#080c16]">{brl(subtotal)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Desconto</span>
                    <div className="relative w-24">
                      <Input
                        value={discount}
                        type="number"
                        min="0"
                        step="0.01"
                        onChange={(e) => setDiscount(toNumber(e.target.value))}
                        className="h-8 rounded-lg border-slate-100 bg-slate-50 text-right text-xs font-black focus:border-[#080c16] focus:ring-0"
                      />
                    </div>
                  </div>

                  <div className="flex items-end justify-between pt-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#080c16]">Total Geral</span>
                      <p className="text-3xl font-black text-[#080c16] tracking-tighter">{brl(total)}</p>
                    </div>
                    <CheckCircle2 className="mb-1 h-8 w-8 text-[#080c16] opacity-10" />
                  </div>

                  <Button
                    disabled={!cart.length}
                    className="group relative h-14 w-full overflow-hidden rounded-2xl bg-[#080c16] text-sm font-black text-brand-yellow shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
                    onClick={() => {
                      setPayments([{ method: "PIX QR Code", amount: String(total.toFixed(2)) }]);
                      setShowCheckout(true);
                    }}
                  >
                    <div className="relative z-10 flex items-center justify-center gap-2">
                      <span>FINALIZAR VENDA</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  </Button>
                </div>

                <div className="mt-6 space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Atalhos de Pagamento</p>
                  <div className="grid grid-cols-3 gap-2">
                    {PAYMENT_OPTIONS.slice(0, 3).map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.id}
                          disabled={!cart.length}
                          onClick={() => {
                            setExactPayment(option.id);
                            setShowCheckout(true);
                          }}
                          className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-100 bg-white p-2 transition-all hover:border-[#080c16] hover:shadow-md active:scale-95 disabled:opacity-40"
                        >
                          <Icon className="h-4 w-4 text-slate-400" />
                          <span className="text-[8px] font-black uppercase tracking-wider text-slate-600">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Printer className="h-3.5 w-3.5" />
              <span>Conectado à Impressora</span>
            </div>
          </div>
        </aside>
      </div>
      <div className="mt-8 space-y-6">
        {/* Lançamentos Rápidos / Favoritos */}
        {favoriteProducts.length > 0 && (
          <div className="rounded-[2rem] border border-white bg-white/60 p-6 backdrop-blur-xl shadow-sm border-slate-100">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Atalhos</p>
                <h3 className="text-sm font-black text-[#080c16]">Produtos mais vendidos</h3>
              </div>
              <Activity className="h-5 w-5 text-[#080c16] opacity-10" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {favoriteProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addToCart(product)}
                  className="group flex flex-col gap-1 rounded-2xl border border-slate-100 bg-white p-3 text-left transition-all hover:border-[#080c16] hover:shadow-md active:scale-95"
                >
                  <p className="line-clamp-1 text-xs font-black text-[#080c16]">{product.name}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">{brl(product.price)}</span>
                    <Plus className="h-3 w-3 text-[#080c16] opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lançamentos do Dia */}
        <Card className="overflow-hidden rounded-[2rem] border-0 bg-white shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between border-b border-slate-50 px-6 py-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#080c16]">Fluxo de Caixa</p>
              <p className="text-xs font-bold text-slate-400">Movimentações registradas hoje</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-[10px] font-black text-slate-600">
              {todayEntries.length} REGISTROS
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto p-4 app-scrollbar">
            {todayEntriesError ? (
              <div className="rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-600">
                Falha ao carregar registros: {todayEntriesError.message}
              </div>
            ) : latestTodayEntries.length ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {latestTodayEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="group relative flex flex-col justify-between gap-3 rounded-[1.5rem] border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-white hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-black text-[#080c16]">
                          {entry.description || entry.category || "Lançamento"}
                        </p>
                        <p className="truncate text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          {entry.payment_method || "Geral"} · {new Date(entry.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[8px] font-black uppercase",
                        entry.type === "saida" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                      )}>
                        {entry.type === "saida" ? "Saída" : "Entrada"}
                      </span>
                    </div>
                    <div className="flex items-end justify-between">
                      <p className={cn(
                        "text-lg font-black tracking-tight",
                        entry.type === "saida" ? "text-rose-600" : "text-emerald-600"
                      )}>
                        {entry.type === "saida" ? "-" : "+"}{brl(Number(entry.amount || 0))}
                      </p>
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button onClick={() => editEntry(entry)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#080c16]">
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button onClick={() => deleteEntry(entry)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-300">
                <ClipboardList className="mb-2 h-8 w-8 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">Nenhuma movimentação</p>
              </div>
            )}
          </div>
        </Card>
      </div>
      <PdvCalculator
        open={showCalculator}
        onOpenChange={setShowCalculator}
        onSendToCart={(total, desc) => {
          addToCart({
            id: `calc-${Date.now()}`,
            name: desc,
            category: "Outros",
            price: total,
            detail: "Calculadora",
          });
          toast.success("Valor enviado ao carrinho.");
        }}
      />
      <Dialog open={showFastSale} onOpenChange={setShowFastSale}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Venda rápida</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Descrição</Label>
              <Input
                value={fastSale.description}
                onChange={(e) => setFastSale({ ...fastSale, description: e.target.value })}
                placeholder="Ex: Impressão A4"
              />
            </div>
            <div>
              <Label>Valor</Label>
              <Input
                autoFocus
                inputMode="decimal"
                value={fastSale.value}
                onChange={(e) => setFastSale({ ...fastSale, value: e.target.value })}
                placeholder="0,00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button className="bg-brand-blue hover:bg-brand-blue-light" onClick={addFastSale}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showSquareMeter} onOpenChange={setShowSquareMeter}>
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle>Calculadora por metro quadrado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Produto ou serviço</Label>
              <Input
                value={squareMeter.description}
                onChange={(event) =>
                  setSquareMeter({ ...squareMeter, description: event.target.value })
                }
                placeholder="Ex: Adesivo personalizado"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label>Largura (cm)</Label>
                <Input
                  autoFocus
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={squareMeter.widthCm}
                  onChange={(event) =>
                    setSquareMeter({ ...squareMeter, widthCm: event.target.value })
                  }
                  placeholder="20"
                />
              </div>
              <div>
                <Label>Altura (cm)</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={squareMeter.heightCm}
                  onChange={(event) =>
                    setSquareMeter({ ...squareMeter, heightCm: event.target.value })
                  }
                  placeholder="3"
                />
              </div>
              <div>
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  value={squareMeter.quantity}
                  onChange={(event) =>
                    setSquareMeter({ ...squareMeter, quantity: event.target.value })
                  }
                />
              </div>
              <div>
                <Label>Preço do m²</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={squareMeter.pricePerSquareMeter}
                  onChange={(event) =>
                    setSquareMeter({
                      ...squareMeter,
                      pricePerSquareMeter: event.target.value,
                    })
                  }
                  placeholder="100"
                />
              </div>
            </div>
            <Card className="rounded-3xl border-blue-100 bg-blue-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-blue">
                Cálculo automático
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                {squareMeterWidth.toLocaleString("pt-BR", { maximumFractionDigits: 4 })} ×{" "}
                {squareMeterHeight.toLocaleString("pt-BR", { maximumFractionDigits: 4 })} ×{" "}
                {squareMeterQuantity.toLocaleString("pt-BR")} ×{" "}
                {brl(toNumber(squareMeter.pricePerSquareMeter))}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Área total</p>
                  <p className="text-xl font-black text-brand-blue">
                    {squareMeterTotalArea.toLocaleString("pt-BR", {
                      minimumFractionDigits: 4,
                      maximumFractionDigits: 4,
                    })}{" "}
                    m²
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-xs text-slate-500">Total calculado</p>
                  <p className="text-2xl font-black text-brand-blue">{brl(squareMeterTotal)}</p>
                </div>
              </div>
            </Card>
            <div className="grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
              <p>90 × 100 cm, 1 un., R$ 105/m² = R$ 94,50</p>
              <p>20 × 3 cm, 2 un., R$ 100/m² = R$ 1,20</p>
              <p>50 × 50 cm, 1 un., R$ 105/m² = R$ 26,25</p>
              <p>5 × 5 cm, 100 un., R$ 100/m² = R$ 25,00</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSquareMeter(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-brand-blue hover:bg-brand-blue-light"
              onClick={addSquareMeterSale}
            >
              Adicionar ao carrinho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle>Finalizar venda</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <div className="space-y-3">
              <div>
                <Label>Data da venda *</Label>
                <Input
                  type="date"
                  value={saleDate}
                  max={today()}
                  onChange={(e) => setSaleDate(e.target.value || today())}
                />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <Label>Cliente (opcional)</Label>
                  <button
                    type="button"
                    className="text-xs font-bold text-brand-blue"
                    onClick={() => setShowNewClient(true)}
                  >
                    Novo cliente
                  </button>
                </div>
                <Select
                  value={clientId || "sem-cliente"}
                  onValueChange={(value) => {
                    if (value === "sem-cliente") {
                      setClientId("");
                      setClientName("");
                      return;
                    }
                    const client = clients.find((item) => item.id === value);
                    setClientId(value);
                    setClientName(client?.name || "");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Consumidor não identificado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sem-cliente">Consumidor não identificado</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Observação</Label>
                <Textarea
                  value={saleNote}
                  onChange={(e) => setSaleNote(e.target.value)}
                  placeholder="Detalhes da venda"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Pagamento</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPayments([...payments, { method: "PIX QR Code", amount: "" }])
                    }
                  >
                    Pagamento misto
                  </Button>
                </div>
                {payments.map((payment, index) => (
                  <div key={index} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_140px_auto]">
                    <Select
                      value={payment.method}
                      onValueChange={(method) =>
                        setPayments(payments.map((p, i) => (i === index ? { ...p, method } : p)))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_OPTIONS.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      inputMode="decimal"
                      value={payment.amount}
                      onChange={(e) =>
                        setPayments(
                          payments.map((p, i) =>
                            i === index ? { ...p, amount: e.target.value } : p,
                          ),
                        )
                      }
                      placeholder="0,00"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPayments(payments.filter((_, i) => i !== index))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <Card className="rounded-3xl bg-slate-950 p-4 text-white">
              <p className="text-sm text-white/60">Total da venda</p>
              <p className="text-3xl font-black">{brl(total)}</p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Recebido</span>
                  <strong>{brl(paidTotal)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>{change >= 0 ? "Troco" : "Falta"}</span>
                  <strong className={change >= 0 ? "text-emerald-300" : "text-red-300"}>
                    {brl(Math.abs(change))}
                  </strong>
                </div>
              </div>
              <Button
                className="mt-5 w-full rounded-2xl bg-white text-slate-950 hover:bg-white/90"
                onClick={() =>
                  setPayments([{ method: "Dinheiro", amount: String(total.toFixed(2)) }])
                }
              >
                Valor exato
              </Button>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>
              Cancelar
            </Button>
            <Button className="bg-brand-blue hover:bg-brand-blue-light" onClick={finalizeSale}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Confirmar venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showOrderPicker} onOpenChange={setShowOrderPicker}>
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle>Cobrar Ordem de Serviço</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              autoFocus
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              className="pl-9"
              placeholder="Buscar número da OS, cliente ou serviço..."
            />
          </div>
          <div className="app-scrollbar max-h-[420px] space-y-2 overflow-y-auto">
            {filteredOrders.map((order) => {
              const remaining = Math.max(0, Number(order.total) - Number(order.paid));
              return (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => loadOrder(order)}
                  className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-brand-blue hover:bg-blue-50"
                >
                  <span className="min-w-0">
                    <span className="block text-xs font-black uppercase tracking-wide text-brand-blue">
                      OS #{order.number}
                    </span>
                    <span className="block truncate font-black">
                      {order.title || "Ordem de Serviço"}
                    </span>
                    <span className="block truncate text-sm text-slate-500">
                      {order.clients?.name || "Cliente"}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-xs text-slate-500">Saldo</span>
                    <strong className="text-lg text-brand-blue">{brl(remaining)}</strong>
                  </span>
                </button>
              );
            })}
            {!filteredOrders.length && (
              <p className="py-10 text-center text-sm text-slate-500">
                Nenhuma OS pendente encontrada.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showMachineEntry} onOpenChange={setShowMachineEntry}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle>Lançar vendas esquecidas da maquininha</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Use o total mostrado na maquininha para registrar débito, crédito ou PIX que não entrou
            no PDV durante o dia.
          </p>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Data da venda *</Label>
                <Input
                  type="date"
                  max={today()}
                  value={machineEntry.date}
                  onChange={(event) =>
                    setMachineEntry({ ...machineEntry, date: event.target.value })
                  }
                />
              </div>
              <div>
                <Label>Forma de pagamento *</Label>
                <Select
                  value={machineEntry.method}
                  onValueChange={(method) => setMachineEntry({ ...machineEntry, method })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MACHINE_PAYMENT_OPTIONS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Valor total *</Label>
              <Input
                autoFocus
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={machineEntry.amount}
                onChange={(event) =>
                  setMachineEntry({ ...machineEntry, amount: event.target.value })
                }
                placeholder="0,00"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                value={machineEntry.description}
                onChange={(event) =>
                  setMachineEntry({ ...machineEntry, description: event.target.value })
                }
              />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={machineEntry.notes}
                onChange={(event) =>
                  setMachineEntry({ ...machineEntry, notes: event.target.value })
                }
                placeholder="Ex: total conferido no relatório da máquina"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMachineEntry(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-brand-blue hover:bg-brand-blue-light"
              onClick={registerMachineEntry}
            >
              Registrar no caixa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showNewClient} onOpenChange={setShowNewClient}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Cadastrar cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome *</Label>
              <Input
                autoFocus
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
              />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input
                inputMode="tel"
                value={newClient.whatsapp}
                onChange={(e) => setNewClient({ ...newClient, whatsapp: e.target.value })}
              />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={newClient.notes}
                onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button className="bg-brand-blue hover:bg-brand-blue-light" onClick={createClient}>
              Cadastrar e usar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showOpenCash} onOpenChange={setShowOpenCash}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Abrir caixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Operador</Label>
              <Input
                value={sessionForm.operator}
                onChange={(e) => setSessionForm({ ...sessionForm, operator: e.target.value })}
              />
            </div>
            <div>
              <Label>Valor inicial</Label>
              <Input
                inputMode="decimal"
                value={sessionForm.initialAmount}
                onChange={(e) => setSessionForm({ ...sessionForm, initialAmount: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button className="bg-brand-blue hover:bg-brand-blue-light" onClick={openCash}>
              Abrir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showCloseCash} onOpenChange={setShowCloseCash}>
        <DialogContent className="max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fechar caixa — confira antes de salvar</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-2xl bg-brand-blue p-4 text-white">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-200">
                Resultado do dia
              </p>
              <p className="mt-1 text-3xl font-black">{brl(dayBalance)}</p>
              <p className="mt-1 text-xs text-blue-100">
                {brl(totalToday)} em entradas e {brl(expenseTotal)} em saídas.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-slate-100 p-3">
                <span className="block text-xs text-slate-500">Dinheiro</span>
                <strong>{brl(paymentTotals.cash)}</strong>
              </div>
              <div className="rounded-xl bg-slate-100 p-3">
                <span className="block text-xs text-slate-500">PIX</span>
                <strong>{brl(paymentTotals.pix)}</strong>
              </div>
              <div className="rounded-xl bg-slate-100 p-3">
                <span className="block text-xs text-slate-500">Débito</span>
                <strong>{brl(paymentTotals.debit)}</strong>
              </div>
              <div className="rounded-xl bg-slate-100 p-3">
                <span className="block text-xs text-slate-500">Crédito</span>
                <strong>{brl(paymentTotals.credit)}</strong>
              </div>
              {paymentTotals.other > 0 && (
                <div className="col-span-2 rounded-xl bg-slate-100 p-3">
                  <span className="block text-xs text-slate-500">Outros ou mistos</span>
                  <strong>{brl(paymentTotals.other)}</strong>
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-dashed border-slate-200 p-3 text-xs text-slate-600">
              <p className="font-bold text-slate-700 mb-1">Conferência do dinheiro físico</p>
              <p>
                Esperado em dinheiro:{" "}
                <strong>{brl(paymentTotals.cash + Number(cashSession?.initialAmount || 0))}</strong>
                {cashSession?.initialAmount ? (
                  <span className="block text-[11px] text-slate-500">
                    (inclui troco inicial de {brl(Number(cashSession.initialAmount))})
                  </span>
                ) : null}
              </p>
            </div>
            <div>
              <Label>Valor contado na gaveta</Label>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="0,00"
                value={sessionForm.informedCash}
                onChange={(e) => setSessionForm({ ...sessionForm, informedCash: e.target.value })}
              />
            </div>
            <div
              className={`rounded-2xl p-4 text-sm font-bold ${
                Math.abs(
                  toNumber(sessionForm.informedCash) -
                    (paymentTotals.cash + Number(cashSession?.initialAmount || 0)),
                ) < 0.01
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-800"
              }`}
            >
              Diferença:{" "}
              {brl(
                toNumber(sessionForm.informedCash) -
                  (paymentTotals.cash + Number(cashSession?.initialAmount || 0)),
              )}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                <p className="text-xs font-black uppercase tracking-wider text-brand-blue">
                  Vendas e lançamentos do dia ({todayEntries.length})
                </p>
                <span className="text-xs text-slate-500">{brl(totalToday)} entrada · {brl(expenseTotal)} saída</span>
              </div>
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                {todayEntries.length ? (
                  todayEntries.map((entry) => (
                    <div key={entry.id} className="flex items-start justify-between gap-3 px-3 py-2 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-bold">{entry.description || entry.category || "Lançamento"}</p>
                        <p className="truncate text-[11px] text-slate-500">
                          {new Date(entry.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          {entry.payment_method ? ` · ${entry.payment_method}` : ""}
                        </p>
                      </div>
                      <span className={`shrink-0 font-black ${entry.type === "saida" ? "text-red-600" : "text-emerald-600"}`}>
                        {entry.type === "saida" ? "-" : "+"}{brl(Number(entry.amount || 0))}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="px-3 py-6 text-center text-sm text-slate-500">Nenhum lançamento hoje.</p>
                )}
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                placeholder="Ex: faltou troco, sangria não registrada..."
                value={sessionForm.notes}
                onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setShowCloseCash(false)}>
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const counted = toNumber(sessionForm.informedCash);
                const expectedCash = paymentTotals.cash + Number(cashSession?.initialAmount || 0);
                openClosureReceipt(
                  {
                    closure_date: today(),
                    closed_at: new Date().toISOString(),
                    operator: cashSession?.operator || sessionForm.operator || "Operador",
                    initial_amount: Number(cashSession?.initialAmount || 0),
                    expected_cash: expectedCash,
                    counted_cash: counted,
                    difference: counted - expectedCash,
                    total_in: totalToday,
                    total_out: expenseTotal,
                    by_method: { cash: paymentTotals.cash, pix: paymentTotals.pix, debit: paymentTotals.debit, credit: paymentTotals.credit, other: paymentTotals.other },
                    entries_count: todayEntries.length,
                    notes: sessionForm.notes || null,
                  },
                  todayEntries,
                );
              }}
            >
              Imprimir prévia
            </Button>
            <Button className="bg-brand-blue hover:bg-brand-blue-light" onClick={closeCashAndSave}>
              Fechar e salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
