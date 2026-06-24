// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Banknote,
  Calculator,
  CheckCircle2,
  ClipboardList,
  Copy,
  CreditCard,
  Lock,
  Minus,
  Plus,
  QrCode,
  Search,
  ShoppingCart,
  Star,
  Trash2,
  UserPlus,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { brl } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/pdv")({ component: PDVPage });

const SESSION_KEY = "alcateia_pdv_session";
const HISTORY_KEY = "alcateia_calc_history";
const BASE_CATEGORIES = ["Todos", "Impressão", "Cartões", "Adesivos", "Banners", "Calendários", "Canecas", "Personalizados", "Outros"];
const FAVORITE_TERMS = ["cart", "impress", "banner", "adesivo", "caneca", "calend"];
const QUICK_PRODUCTS = [
  { id: "quick-card", name: "Cartão de Visita", category: "Cartões", price: 45, detail: "Glossy 300g", image: "linear-gradient(135deg,#eef2ff,#0b4bff)" },
  { id: "quick-a4-color", name: "Impressão A4 Color", category: "Impressão", price: 2.5, detail: "Papel Couche 150g", image: "linear-gradient(135deg,#e0f2fe,#22c55e)" },
  { id: "quick-a4-pb", name: "Impressão A4 P&B", category: "Impressão", price: 2, detail: "Preto e branco", image: "linear-gradient(135deg,#f8fafc,#475569)" },
  { id: "quick-sticker", name: "Adesivo Recortado", category: "Adesivos", price: 8, detail: "Vinil personalizado", image: "linear-gradient(135deg,#fdf2f8,#db2777)" },
  { id: "quick-banner-1", name: "Banner 1x1m", category: "Banners", price: 35, detail: "Lona 440g", image: "linear-gradient(135deg,#dbeafe,#2563eb)" },
  { id: "quick-banner-2", name: "Banner 2x1m", category: "Banners", price: 70, detail: "Lona 440g", image: "linear-gradient(135deg,#cffafe,#0284c7)" },
  { id: "quick-mug", name: "Caneca Personalizada", category: "Canecas", price: 28, detail: "Cerâmica 325ml", image: "linear-gradient(135deg,#ffffff,#94a3b8)" },
  { id: "quick-calendar", name: "Calendário Personalizado", category: "Calendários", price: 15, detail: "Mesa ou parede", image: "linear-gradient(135deg,#fff7ed,#f97316)" },
];
const PAYMENT_OPTIONS = [
  { id: "PIX QR Code", label: "PIX QR", icon: QrCode },
  { id: "PIX maquininha", label: "PIX máquina", icon: QrCode },
  { id: "Cartão de débito", label: "Débito", icon: CreditCard },
  { id: "Cartão de crédito", label: "Crédito", icon: WalletCards },
  { id: "Dinheiro", label: "Dinheiro", icon: Banknote },
];

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString(), day: today() };
}
function toNumber(value: unknown) {
  const n = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
function formatCalc(value: number) {
  return Number(value.toFixed(8)).toString().replace(".", ",");
}
function safeCalculate(expression: string) {
  const clean = expression.trim().replace(/,/g, ".").replace(/(\d+(?:\.\d+)?)%/g, "($1/100)");
  if (!clean || !/^[0-9+\-*/().\s%]+$/.test(clean)) throw new Error("invalid");
  const result = Function(`"use strict"; return (${clean})`)();
  const numeric = Number(result);
  if (!Number.isFinite(numeric)) throw new Error("invalid");
  return numeric;
}

function PDVPage() {
  const qc = useQueryClient();
  const searchRef = useRef<HTMLInputElement | null>(null);
  const calcRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [cart, setCart] = useState<any[]>([]);
  const [discount, setDiscount] = useState(0);
  const [surcharge, setSurcharge] = useState(0);
  const [clientName, setClientName] = useState("");
  const [clientId, setClientId] = useState("");
  const [saleNote, setSaleNote] = useState("");
  const [saleDate, setSaleDate] = useState(today());
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [payments, setPayments] = useState([{ method: "PIX QR Code", amount: "" }]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [showFastSale, setShowFastSale] = useState(false);
  const [showOrderPicker, setShowOrderPicker] = useState(false);
  const [showOpenCash, setShowOpenCash] = useState(false);
  const [showCloseCash, setShowCloseCash] = useState(false);
  const [showSquareMeter, setShowSquareMeter] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", whatsapp: "", notes: "" });
  const [fastSale, setFastSale] = useState({ description: "", value: "" });
  const [orderSearch, setOrderSearch] = useState("");
  const [calcExpression, setCalcExpression] = useState("");
  const [calcResult, setCalcResult] = useState(0);
  const [calcTab, setCalcTab] = useState("basic");
  const [calcHistory, setCalcHistory] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
  });
  const [changeCalc, setChangeCalc] = useState({ purchase: "", received: "" });
  const [bannerCalc, setBannerCalc] = useState({ width: "", height: "", price: "35" });
  const [squareMeter, setSquareMeter] = useState({ description: "Adesivo personalizado", widthCm: "", heightCm: "", quantity: "1", pricePerSquareMeter: "100" });
  const [cashSession, setCashSession] = useState(() => {
    if (typeof window === "undefined") return null;
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; }
  });
  const [sessionForm, setSessionForm] = useState({ operator: "Operador", initialAmount: "0", informedCash: "0", notes: "" });

  const { data: services = [] } = useQuery({ queryKey: ["pdv_services"], queryFn: async () => {
    const { data, error } = await supabase.from("services").select("id, name, category, base_price, description, image_url, active").eq("active", true).order("name", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }});
  const { data: clients = [] } = useQuery({ queryKey: ["pdv_clients"], queryFn: async () => {
    const { data, error } = await supabase.from("clients").select("id, name, whatsapp").order("name", { ascending: true }).limit(300);
    if (error) throw error;
    return data ?? [];
  }});
  const { data: openOrders = [] } = useQuery({ queryKey: ["pdv_open_orders"], queryFn: async () => {
    const { data, error } = await supabase.from("orders").select("id, number, title, total, paid, payment_status, client_id, clients(name, whatsapp)").order("created_at", { ascending: false }).limit(250);
    if (error) throw error;
    return (data ?? []).filter((order) => Number(order.total) > Number(order.paid));
  }});
  const { data: todayEntries = [] } = useQuery({ queryKey: ["pdv_cash_entries_today"], queryFn: async () => {
    const range = todayRange();
    const { data, error } = await supabase.from("cash_entries").select("*").or(`entry_date.eq.${range.day},and(created_at.gte.${range.start},created_at.lt.${range.end})`).order("created_at", { ascending: false }).limit(1000);
    if (error) throw error;
    return data ?? [];
  }});

  const products = useMemo(() => {
    const serviceProducts = services.map((service) => ({
      id: service.id,
      name: service.name,
      category: service.category || "Outros",
      price: Number(service.base_price || 0),
      detail: service.description || service.category || "Serviço gráfico",
      imageUrl: service.image_url && !service.image_url.includes("__l5e") ? service.image_url : undefined,
    }));
    return serviceProducts.length ? serviceProducts : QUICK_PRODUCTS;
  }, [services]);
  const categoryCounts = useMemo(() => products.reduce((acc: Record<string, number>, product) => {
    const key = product.category || "Outros";
    acc[key] = (acc[key] || 0) + 1;
    acc.Todos = (acc.Todos || 0) + 1;
    return acc;
  }, { Todos: 0 }), [products]);
  const categories = useMemo(() => Array.from(new Set([...BASE_CATEGORIES, ...products.map((p) => p.category).filter(Boolean)])), [products]);
  const filteredProducts = products.filter((product) => {
    const text = [product.name, product.category, product.detail, product.id].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
    return text.includes(query.toLocaleLowerCase("pt-BR")) && (category === "Todos" || product.category === category);
  });
  const favoriteProducts = products.filter((product) => FAVORITE_TERMS.some((term) => `${product.name} ${product.category} ${product.detail}`.toLocaleLowerCase("pt-BR").includes(term))).slice(0, 6);
  const subtotal = cart.reduce((acc, item) => acc + Number(item.price || 0) * Number(item.quantity || 0), 0);
  const total = Math.max(subtotal - discount + surcharge, 0);
  const paidTotal = payments.reduce((acc, payment) => acc + toNumber(payment.amount), 0);
  const change = paidTotal - total;
  const salesToday = todayEntries.filter((entry) => entry.type === "entrada");
  const expensesToday = todayEntries.filter((entry) => entry.type === "saida");
  const totalToday = salesToday.reduce((acc, entry) => acc + Number(entry.amount || 0), 0);
  const expenseTotal = expensesToday.reduce((acc, entry) => acc + Number(entry.amount || 0), 0);
  const dayBalance = totalToday - expenseTotal;
  const pdvSalesToday = salesToday.filter((entry) => String(entry.category || "").toLocaleLowerCase("pt-BR").includes("venda"));
  const ordersToday = salesToday.filter((entry) => entry.order_id).length;
  const averageTicket = pdvSalesToday.length ? totalToday / pdvSalesToday.length : 0;
  const itemsSoldToday = pdvSalesToday.reduce((acc, entry) => acc + (String(entry.description || "").match(/\d+x/g)?.reduce((sum, item) => sum + Number(item.replace("x", "")), 0) || 1), 0);
  const clientsServedToday = new Set(salesToday.map((entry) => entry.client_id).filter(Boolean)).size;
  const selectedOrder = openOrders.find((order) => order.id === selectedOrderId);
  const filteredOrders = openOrders.filter((order) => {
    const term = orderSearch.trim().toLocaleLowerCase("pt-BR");
    return !term || String(order.number).includes(term) || String(order.title ?? "").toLocaleLowerCase("pt-BR").includes(term) || String(order.clients?.name ?? "").toLocaleLowerCase("pt-BR").includes(term);
  });
  const squareMeterWidth = toNumber(squareMeter.widthCm) / 100;
  const squareMeterHeight = toNumber(squareMeter.heightCm) / 100;
  const squareMeterQuantity = Math.max(0, toNumber(squareMeter.quantity));
  const squareMeterTotalArea = squareMeterWidth * squareMeterHeight * squareMeterQuantity;
  const squareMeterTotal = squareMeterTotalArea * toNumber(squareMeter.pricePerSquareMeter);
  const bannerArea = toNumber(bannerCalc.width) * toNumber(bannerCalc.height);
  const bannerTotal = bannerArea * toNumber(bannerCalc.price);

  function runCalc() {
    try {
      const result = safeCalculate(calcExpression);
      const row = `${calcExpression} = ${formatCalc(result)}`;
      setCalcResult(result);
      setCalcHistory((items) => [row, ...items.filter((item) => item !== row)].slice(0, 10));
    } catch { toast.error("Não consegui calcular essa expressão."); }
  }
  function appendCalc(value: string) { setCalcExpression((current) => `${current}${value}`); }
  function applyCalc(target: "discount" | "surcharge" | "payment") {
    const value = Math.max(0, calcResult);
    if (target === "discount") setDiscount(value);
    if (target === "surcharge") setSurcharge(value);
    if (target === "payment") { setPayments([{ method: "Dinheiro", amount: value.toFixed(2) }]); setShowCheckout(true); }
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const typingInField = tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable;
      if (event.key === "F2") { event.preventDefault(); searchRef.current?.focus(); return; }
      if (event.key === "F3") { event.preventDefault(); clearSale(); return; }
      if (event.key === "F4") { event.preventDefault(); setShowNewClient(true); return; }
      if (event.key === "F5") { event.preventDefault(); setShowCheckout(true); return; }
      if (event.key === "F6") { event.preventDefault(); setCalcTab("basic"); calcRef.current?.focus(); return; }
      if (typingInField) return;
      if (/^[0-9+\-*/.,()%]$/.test(event.key)) { event.preventDefault(); setCalcTab("basic"); appendCalc(event.key); return; }
      if (event.key === "Enter" && calcTab === "basic") { event.preventDefault(); runCalc(); return; }
      if (event.key === "Backspace" && calcTab === "basic") { event.preventDefault(); setCalcExpression((v) => v.slice(0, -1)); return; }
      if (event.key === "Escape") { event.preventDefault(); setQuery(""); setCalcExpression(""); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [calcExpression, calcTab]);
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem(HISTORY_KEY, JSON.stringify(calcHistory.slice(0, 10))); }, [calcHistory]);

  function addToCart(product: any) {
    if (selectedOrderId) return toast.error("Conclua ou limpe a cobrança da OS antes de adicionar outros itens.");
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, { ...product, quantity: product.quantity || 1, note: "" }];
    });
  }
  function changeQty(id: string, delta: number) {
    if (selectedOrderId && id === `order-${selectedOrderId}` && delta > 0) return;
    setCart((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.max(Number(item.quantity || 0) + delta, 0) } : item).filter((item) => item.quantity > 0));
    if (selectedOrderId && id === `order-${selectedOrderId}` && delta < 0) setSelectedOrderId("");
  }
  function updateCartItem(id: string, patch: Record<string, unknown>) { setCart((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item)); }
  function duplicateCartItem(item: any) { setCart((current) => [...current, { ...item, id: `${item.id}-copy-${Date.now()}`, quantity: 1 }]); }
  function clearSale() { setCart([]); setDiscount(0); setSurcharge(0); setSaleNote(""); setSelectedOrderId(""); setClientId(""); setClientName(""); }
  function addFastSale() {
    const value = toNumber(fastSale.value);
    if (!fastSale.description.trim() || value <= 0) return toast.error("Informe descrição e valor da venda rápida.");
    addToCart({ id: `fast-${Date.now()}`, name: fastSale.description.trim(), category: "Outros", price: value, detail: "Venda rápida" });
    setFastSale({ description: "", value: "" }); setShowFastSale(false);
  }
  function addSquareMeterSale() {
    if (!squareMeter.description.trim() || squareMeterTotal <= 0) return toast.error("Preencha descrição, medidas, quantidade e preço por m².");
    addToCart({ id: `m2-${Date.now()}`, name: squareMeter.description.trim(), category: "Venda por m²", price: squareMeterTotal, quantity: 1, detail: `${squareMeter.widthCm} x ${squareMeter.heightCm} cm • ${squareMeterQuantity} un.` });
    setShowSquareMeter(false);
  }
  function loadOrder(order: any) {
    const remaining = Math.max(0, Number(order.total) - Number(order.paid));
    if (remaining <= 0) return toast.error("Esta OS já está totalmente paga.");
    setSelectedOrderId(order.id); setClientId(order.client_id); setClientName(order.clients?.name || "");
    setCart([{ id: `order-${order.id}`, name: `OS #${order.number} - ${order.title || "Serviço"}`, category: "Ordem de Serviço", price: remaining, quantity: 1, detail: `${order.clients?.name || "Cliente"} • saldo pendente` }]);
    setDiscount(0); setSurcharge(0); setSaleNote(`Recebimento vinculado à OS #${order.number}`); setShowOrderPicker(false);
  }
  function setExactPayment(method: string) { setPayments([{ method, amount: total.toFixed(2) }]); setShowCheckout(true); }
  function openCash() {
    const session = { operator: sessionForm.operator || "Operador", initialAmount: toNumber(sessionForm.initialAmount), openedAt: new Date().toISOString() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session)); setCashSession(session); setShowOpenCash(false); toast.success("Caixa aberto.");
  }
  async function closeCash() {
    const informed = toNumber(sessionForm.informedCash); const diff = informed - dayBalance;
    const { error } = await supabase.from("cash_entries").insert({ type: diff < 0 ? "saida" : "entrada", description: `Fechamento de caixa - ${today()}`, amount: Math.abs(diff), entry_date: today(), payment_method: "Conferencia", category: "Fechamento de caixa", notes: `Esperado: ${brl(dayBalance)} | Contado: ${brl(informed)} | Diferença: ${brl(diff)} | ${sessionForm.notes}` });
    if (error) return toast.error(error.message);
    localStorage.removeItem(SESSION_KEY); setCashSession(null); setShowCloseCash(false); qc.invalidateQueries({ queryKey: ["pdv_cash_entries_today"] }); toast.success("Caixa fechado.");
  }
  async function createClient() {
    if (!newClient.name.trim()) return toast.error("Informe o nome do cliente.");
    const { data, error } = await supabase.from("clients").insert({ name: newClient.name.trim(), whatsapp: newClient.whatsapp.trim() || null, notes: newClient.notes.trim() || null }).select("id,name").single();
    if (error) return toast.error(error.message);
    setClientId(data.id); setClientName(data.name); setNewClient({ name: "", whatsapp: "", notes: "" }); setShowNewClient(false); qc.invalidateQueries({ queryKey: ["pdv_clients"] });
  }
  async function findReceivableId(orderId: string) {
    const { data } = await supabase.from("receivables").select("id").eq("order_id", orderId).neq("status", "pago").order("due_date", { ascending: true }).limit(1).maybeSingle();
    return data?.id ?? null;
  }
  async function finalizeSale() {
    if (!cart.length) return toast.error("Adicione pelo menos um item.");
    if (total <= 0) return toast.error("O total da venda deve ser maior que zero.");
    if (!payments.length || paidTotal < total) return toast.error("Pagamento insuficiente para finalizar.");
    const mainMethod = payments.length > 1 ? `Misto (${payments.map((p) => `${p.method}: ${brl(toNumber(p.amount))}`).join(" + ")})` : payments[0].method;
    const receivableId = selectedOrder ? await findReceivableId(selectedOrder.id) : null;
    const { error } = await supabase.from("cash_entries").insert({ type: "entrada", description: `PDV - ${cart.map((item) => `${item.quantity}x ${item.name}`).join(", ")}`, amount: total, entry_date: saleDate, payment_method: mainMethod, category: selectedOrder ? "Pagamento de OS" : "Venda PDV", client_id: clientId || null, order_id: selectedOrder?.id || null, receivable_id: receivableId, notes: [clientName ? `Cliente: ${clientName}` : "", saleNote, discount ? `Desconto: ${brl(discount)}` : "", surcharge ? `Acréscimo: ${brl(surcharge)}` : ""].filter(Boolean).join(" | ") });
    if (error) return toast.error(error.message);
    if (selectedOrder) {
      const nextPaid = Math.min(Number(selectedOrder.total), Number(selectedOrder.paid) + total);
      const fullyPaid = nextPaid >= Number(selectedOrder.total);
      await supabase.from("orders").update({ paid: nextPaid, payment_method: mainMethod, payment_status: fullyPaid ? "pago_completo" : "pago_parcial" }).eq("id", selectedOrder.id);
      if (fullyPaid && receivableId) await supabase.from("receivables").update({ status: "pago", paid_at: new Date(`${saleDate}T12:00:00`).toISOString(), payment_method: mainMethod }).eq("id", receivableId);
    }
    clearSale(); setSaleDate(today()); setPayments([{ method: "PIX QR Code", amount: "" }]); setShowCheckout(false);
    qc.invalidateQueries({ queryKey: ["pdv_cash_entries_today"] }); qc.invalidateQueries({ queryKey: ["pdv_open_orders"] }); qc.invalidateQueries({ queryKey: ["cash_entries"] }); toast.success("Venda finalizada e registrada no caixa.");
  }

  const calcDisplay = calcExpression || String(formatCalc(calcResult || 0));

  return (
    <div className="-m-2 min-h-[calc(100vh-5rem)] overflow-x-hidden bg-[#061a33] p-2 text-[#071a3a] sm:-m-3 sm:p-3 lg:-m-4 lg:p-4">
      <div className="grid min-w-0 gap-3 2xl:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="min-w-0 rounded-2xl bg-[#071d3d] p-3 text-white shadow-2xl">
          <div className="mb-4 flex items-center gap-3 px-1"><ShoppingCart className="h-9 w-9" /><div><h2 className="text-2xl font-black">PDV</h2><p className="text-sm text-white/70">Frente de Caixa</p></div></div>
          <p className="mb-2 px-2 text-xs font-black uppercase text-white/70">Categorias</p>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-1">
            {categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={cn("flex min-h-11 items-center justify-between rounded-xl px-3 text-left text-sm font-black transition", category === item ? "bg-blue-600 text-white" : "bg-white/7 text-white/85 hover:bg-white/12")}><span className="truncate">{item}</span><span className="rounded-lg bg-white/12 px-2 py-1 text-xs">{categoryCounts[item] || 0}</span></button>)}
          </div>
          <div ref={calcRef} tabIndex={0} className="mt-4 rounded-2xl bg-[#04142b] p-3 outline-none ring-blue-400/0 focus:ring-2">
            <div className="mb-3 flex items-center justify-between"><strong>Calculadora</strong><Calculator className="h-4 w-4" /></div>
            <div className="mb-2 grid grid-cols-4 gap-1 text-xs">{[["basic","Básica"],["change","Troco"],["graphic","Gráfica"],["history","Histórico"]].map(([id,label]) => <button key={id} onClick={() => setCalcTab(id)} className={cn("rounded-lg px-2 py-2 font-bold", calcTab === id ? "bg-blue-600" : "bg-white/8")}>{label}</button>)}</div>
            {calcTab === "basic" && <><div className="mb-2 rounded-xl bg-[#071d3d] p-3 text-right text-3xl font-black">{calcDisplay}</div><div className="grid grid-cols-4 gap-1.5">{["AC","⌫","%","/","7","8","9","*","4","5","6","-","1","2","3","+","0",",","="].map((key) => <button key={key} onClick={() => key === "AC" ? setCalcExpression("") : key === "⌫" ? setCalcExpression((v) => v.slice(0,-1)) : key === "=" ? runCalc() : appendCalc(key)} className={cn("min-h-10 rounded-lg font-black", key === "=" ? "bg-green-600" : key === "AC" ? "bg-red-500/80" : "bg-white/12")}>{key}</button>)}</div><div className="mt-2 grid gap-1 text-xs"><button onClick={() => applyCalc("discount")} className="rounded-lg bg-white/10 py-2 font-bold">Enviar para desconto</button><button onClick={() => applyCalc("surcharge")} className="rounded-lg bg-white/10 py-2 font-bold">Enviar para acréscimo</button></div></>}
            {calcTab === "change" && <div className="space-y-2"><Input placeholder="Valor da compra" value={changeCalc.purchase} onChange={(e) => setChangeCalc({...changeCalc, purchase:e.target.value})}/><Input placeholder="Valor recebido" value={changeCalc.received} onChange={(e) => setChangeCalc({...changeCalc, received:e.target.value})}/><div className="rounded-xl bg-green-600 p-3 font-black">Troco: {brl(Math.max(0, toNumber(changeCalc.received)-toNumber(changeCalc.purchase)))}</div></div>}
            {calcTab === "graphic" && <div className="space-y-2"><Input placeholder="Largura m" value={bannerCalc.width} onChange={(e) => setBannerCalc({...bannerCalc, width:e.target.value})}/><Input placeholder="Altura m" value={bannerCalc.height} onChange={(e) => setBannerCalc({...bannerCalc, height:e.target.value})}/><Input placeholder="Valor m²" value={bannerCalc.price} onChange={(e) => setBannerCalc({...bannerCalc, price:e.target.value})}/><div className="rounded-xl bg-blue-600 p-3 font-black">Área {bannerArea.toLocaleString("pt-BR")} m² • {brl(bannerTotal)}</div></div>}
            {calcTab === "history" && <div className="space-y-1 text-xs">{calcHistory.length ? calcHistory.map((row) => <button className="block w-full rounded-lg bg-white/10 p-2 text-left" key={row}>{row}</button>) : <p className="text-white/60">Sem histórico.</p>}</div>}
          </div>
        </aside>
        <main className="min-w-0 rounded-2xl bg-white p-2 shadow-2xl sm:p-3">
          <div className="grid min-w-0 gap-3 2xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="min-w-0 space-y-3">
              <div className="grid gap-3 lg:grid-cols-[230px_minmax(0,1fr)]"><Card className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-4 text-white"><p className="text-xs font-black uppercase">Saldo do caixa</p><p className="mt-1 text-3xl font-black">{brl(dayBalance)}</p></Card><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Entradas" value={brl(totalToday)} tone="green"/><Metric label="Saídas" value={brl(expenseTotal)} tone="red"/><Metric label="Sangrias" value={brl(expenseTotal)} tone="orange"/><Metric label="Vendas hoje" value={brl(totalToday)} tone="blue"/></div></div>
              <div className="flex flex-wrap gap-2"><QuickButton icon={Plus} label="Nova Venda" onClick={clearSale}/><QuickButton icon={UserPlus} label="Cliente" onClick={() => setShowNewClient(true)}/><QuickButton icon={ClipboardList} label="Pedido" onClick={() => setShowOrderPicker(true)}/><QuickButton icon={Banknote} label="Pagamento" onClick={() => setShowCheckout(true)}/><QuickButton icon={Lock} label="Abrir Caixa" onClick={() => setShowOpenCash(true)}/><QuickButton icon={Lock} label="Fechar Caixa" danger onClick={() => setShowCloseCash(true)}/></div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5"><Metric label="Vendas hoje" value={brl(totalToday)} /><Metric label="Pedidos hoje" value={ordersToday} /><Metric label="Ticket médio" value={brl(averageTicket)} /><Metric label="Itens vendidos" value={itemsSoldToday} /><Metric label="Clientes atendidos" value={clientsServedToday} /></div>
              <div className="relative"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"/><Input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} className="h-14 rounded-2xl pl-12 pr-14" placeholder="Buscar por nome, SKU, código ou código de barras..."/><span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg bg-blue-50 px-2 py-1 text-xs font-black text-blue-600">F2</span></div>
              <Card className="rounded-2xl p-3"><div className="mb-2 flex items-center justify-between"><h3 className="font-black">Mais Vendidos</h3><span className="text-xs text-slate-500">Atualizado agora</span></div><div className="grid gap-2 lg:grid-cols-3">{["Mais Vendidos Hoje","Mais Vendidos da Semana","Favoritos do Operador"].map((title, idx) => <div key={title} className={cn("rounded-2xl border p-3", idx===0 && "bg-red-50", idx===2 && "bg-amber-50")}><p className="mb-2 text-xs font-black text-slate-700">{idx===2 ? "⭐" : "🔥"} {title}</p>{favoriteProducts.slice(0,3).map((p) => <button key={`${title}-${p.id}`} onClick={() => addToCart(p)} className="mb-2 flex w-full items-center justify-between rounded-xl bg-white p-2 text-left shadow-sm"><span><strong className="block text-xs">{p.name}</strong><small>{brl(p.price)}</small></span><Plus className="h-4 w-4 text-blue-600"/></button>)}</div>)}</div></Card>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 min-[1800px]:grid-cols-4">{filteredProducts.map((product) => <Card key={product.id} className="overflow-hidden rounded-2xl p-0 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><div className="h-24 bg-slate-100 sm:h-28" style={{ background: product.imageUrl ? undefined : product.image, backgroundImage: product.imageUrl ? `url(${product.imageUrl})` : product.image, backgroundSize:"cover", backgroundPosition:"center" }}/><div className="p-3"><div className="mb-2 flex justify-between gap-2"><div><p className="font-black">{product.name}</p><p className="text-xs text-slate-500">{product.category}</p></div><Star className="h-4 w-4 text-slate-300"/></div><div className="flex items-center justify-between"><strong className="text-lg text-blue-700">{brl(product.price)}</strong><Button size="icon" className="rounded-xl bg-blue-600" onClick={() => addToCart(product)}><Plus className="h-5 w-5"/></Button></div></div></Card>)}</div>
            </section>
            <aside className="flex min-h-[520px] min-w-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm 2xl:max-h-[calc(100vh-8rem)]"><div className="flex items-center justify-between border-b p-4"><h3 className="font-black">Venda Atual</h3><button onClick={clearSale} className="text-red-500"><Trash2 className="h-4 w-4"/></button></div><div className="flex-1 space-y-3 overflow-y-auto p-4">{cart.length ? cart.map((item) => <div key={item.id} className="rounded-2xl border p-3"><div className="flex justify-between gap-2"><div><p className="font-black">{item.name}</p><p className="text-xs text-slate-500">{item.detail}</p></div><strong>{brl(item.price * item.quantity)}</strong></div><div className="mt-3 grid grid-cols-[96px_1fr] gap-2"><div className="flex rounded-xl border"><button className="w-8" onClick={() => changeQty(item.id,-1)}>-</button><span className="grid w-8 place-items-center border-x font-black">{item.quantity}</span><button className="w-8" onClick={() => changeQty(item.id,1)}>+</button></div><Input value={Number(item.price || 0)} type="number" step="0.01" onChange={(e) => updateCartItem(item.id,{price:toNumber(e.target.value)})} className="h-10 text-right"/></div><Input value={item.note || ""} onChange={(e) => updateCartItem(item.id,{note:e.target.value})} placeholder="Observação do item" className="mt-2 h-9 text-xs"/><div className="mt-2 flex gap-2"><Button variant="outline" size="sm" className="h-8 flex-1" onClick={() => duplicateCartItem(item)}><Copy className="mr-1 h-3 w-3"/>Duplicar</Button><Button variant="outline" size="sm" className="h-8 text-red-600" onClick={() => changeQty(item.id,-999)}>Remover</Button></div></div>) : <div className="grid h-full place-items-center rounded-2xl border border-dashed text-center text-slate-400"><div><ShoppingCart className="mx-auto mb-2 h-10 w-10"/><p className="font-bold">Carrinho vazio</p></div></div>}</div><div className="border-t p-4"><Textarea value={saleNote} onChange={(e) => setSaleNote(e.target.value)} placeholder="Observações da venda" className="mb-3"/><Summary label="Subtotal" value={brl(subtotal)}/><MoneyInput label="Desconto" value={discount} setValue={setDiscount} negative/><MoneyInput label="Acréscimo" value={surcharge} setValue={setSurcharge}/><div className="mt-4 flex items-end justify-between border-t pt-4"><span className="font-black">Total Final</span><strong className="text-3xl font-black text-blue-800">{brl(total)}</strong></div><div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[110px_1fr] 2xl:grid-cols-1"><Button variant="outline" className="h-14 rounded-2xl border-red-200 text-red-600" onClick={clearSale}>Limpar</Button><Button disabled={!cart.length} className="h-14 rounded-2xl bg-green-600 text-lg font-black uppercase hover:bg-green-700" onClick={() => { setPayments([{method:"PIX QR Code", amount:total.toFixed(2)}]); setShowCheckout(true); }}><Banknote className="mr-2 h-6 w-6"/>Finalizar Venda</Button></div></div></aside>
          </div>
        </main>
      </div>
      <div className="mt-3 hidden flex-wrap items-center gap-4 rounded-2xl bg-[#04142b] px-5 py-3 text-sm text-white lg:flex"><Shortcut k="F2" label="Buscar"/><Shortcut k="ESC" label="Limpar"/><Shortcut k="F3" label="Nova venda"/><Shortcut k="F4" label="Cliente"/><Shortcut k="F5" label="Pagamento"/><Shortcut k="F6" label="Calculadora"/><Shortcut k="0-9 + - * / Enter" label="Teclado da calculadora"/></div>

      <Dialog open={showCheckout} onOpenChange={setShowCheckout}><DialogContent className="max-w-2xl rounded-3xl"><DialogHeader><DialogTitle>Finalizar venda</DialogTitle></DialogHeader><div className="grid gap-4 md:grid-cols-[1fr_220px]"><div className="space-y-3"><Label>Data da venda</Label><Input type="date" value={saleDate} max={today()} onChange={(e) => setSaleDate(e.target.value || today())}/><Label>Cliente</Label><Select value={clientId || "sem-cliente"} onValueChange={(value) => { if(value === "sem-cliente") { setClientId(""); setClientName(""); return; } const c = clients.find((item) => item.id === value); setClientId(value); setClientName(c?.name || ""); }}><SelectTrigger><SelectValue placeholder="Consumidor não identificado"/></SelectTrigger><SelectContent><SelectItem value="sem-cliente">Consumidor não identificado</SelectItem>{clients.map((client) => <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>)}</SelectContent></Select><div className="space-y-2"><div className="flex justify-between"><Label>Pagamento</Label><Button variant="outline" size="sm" onClick={() => setPayments([...payments,{method:"PIX QR Code", amount:""}])}>Pagamento misto</Button></div>{payments.map((payment,index) => <div key={index} className="grid gap-2 sm:grid-cols-[1fr_140px_auto]"><Select value={payment.method} onValueChange={(method) => setPayments(payments.map((p,i) => i===index ? {...p,method} : p))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{PAYMENT_OPTIONS.map((option) => <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>)}</SelectContent></Select><Input value={payment.amount} onChange={(e) => setPayments(payments.map((p,i) => i===index ? {...p, amount:e.target.value} : p))} placeholder="0,00"/><Button variant="ghost" size="icon" onClick={() => setPayments(payments.filter((_,i) => i!==index))}><X className="h-4 w-4"/></Button></div>)}</div></div><Card className="rounded-3xl bg-slate-950 p-4 text-white"><p>Total</p><p className="text-3xl font-black">{brl(total)}</p><Summary label="Recebido" value={brl(paidTotal)}/><Summary label={change >= 0 ? "Troco" : "Falta"} value={brl(Math.abs(change))}/>{PAYMENT_OPTIONS.map((option) => <Button key={option.id} variant="outline" className="mt-2 w-full bg-white/10 text-white" onClick={() => setExactPayment(option.id)}>{option.label}</Button>)}</Card></div><DialogFooter><Button variant="outline" onClick={() => setShowCheckout(false)}>Cancelar</Button><Button className="bg-green-600" onClick={finalizeSale}><CheckCircle2 className="mr-2 h-4 w-4"/>Confirmar venda</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={showNewClient} onOpenChange={setShowNewClient}><DialogContent><DialogHeader><DialogTitle>Cadastrar cliente</DialogTitle></DialogHeader><Label>Nome</Label><Input value={newClient.name} onChange={(e) => setNewClient({...newClient,name:e.target.value})}/><Label>WhatsApp</Label><Input value={newClient.whatsapp} onChange={(e) => setNewClient({...newClient,whatsapp:e.target.value})}/><Label>Observações</Label><Textarea value={newClient.notes} onChange={(e) => setNewClient({...newClient,notes:e.target.value})}/><DialogFooter><Button onClick={createClient}>Cadastrar e usar</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={showFastSale} onOpenChange={setShowFastSale}><DialogContent><DialogHeader><DialogTitle>Venda rápida</DialogTitle></DialogHeader><Label>Descrição</Label><Input value={fastSale.description} onChange={(e) => setFastSale({...fastSale,description:e.target.value})}/><Label>Valor</Label><Input value={fastSale.value} onChange={(e) => setFastSale({...fastSale,value:e.target.value})}/><DialogFooter><Button onClick={addFastSale}>Adicionar</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={showOrderPicker} onOpenChange={setShowOrderPicker}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Cobrar OS</DialogTitle></DialogHeader><Input value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} placeholder="Buscar OS, cliente ou serviço"/><div className="max-h-96 space-y-2 overflow-y-auto">{filteredOrders.map((order) => { const remaining = Math.max(0, Number(order.total)-Number(order.paid)); return <button key={order.id} onClick={() => loadOrder(order)} className="flex w-full justify-between rounded-2xl border p-3 text-left"><span><strong>OS #{order.number}</strong><small className="block">{order.title || "Ordem de Serviço"}</small></span><strong>{brl(remaining)}</strong></button>; })}</div></DialogContent></Dialog>
      <Dialog open={showOpenCash} onOpenChange={setShowOpenCash}><DialogContent><DialogHeader><DialogTitle>Abrir caixa</DialogTitle></DialogHeader><Label>Operador</Label><Input value={sessionForm.operator} onChange={(e) => setSessionForm({...sessionForm, operator:e.target.value})}/><Label>Valor inicial</Label><Input value={sessionForm.initialAmount} onChange={(e) => setSessionForm({...sessionForm, initialAmount:e.target.value})}/><DialogFooter><Button onClick={openCash}>Abrir caixa</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={showCloseCash} onOpenChange={setShowCloseCash}><DialogContent><DialogHeader><DialogTitle>Fechar caixa</DialogTitle></DialogHeader><Card className="bg-blue-950 p-4 text-white"><p>Saldo esperado</p><p className="text-3xl font-black">{brl(dayBalance)}</p></Card><Label>Saldo total conferido</Label><Input value={sessionForm.informedCash} onChange={(e) => setSessionForm({...sessionForm, informedCash:e.target.value})}/><p className="font-black">Diferença: {brl(toNumber(sessionForm.informedCash)-dayBalance)}</p><DialogFooter><Button onClick={closeCash}>Fechar caixa</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={showSquareMeter} onOpenChange={setShowSquareMeter}><DialogContent><DialogHeader><DialogTitle>Calculadora por m²</DialogTitle></DialogHeader><Label>Produto</Label><Input value={squareMeter.description} onChange={(e) => setSquareMeter({...squareMeter, description:e.target.value})}/><div className="grid gap-2 sm:grid-cols-4"><Input placeholder="Largura cm" value={squareMeter.widthCm} onChange={(e) => setSquareMeter({...squareMeter,widthCm:e.target.value})}/><Input placeholder="Altura cm" value={squareMeter.heightCm} onChange={(e) => setSquareMeter({...squareMeter,heightCm:e.target.value})}/><Input placeholder="Qtd" value={squareMeter.quantity} onChange={(e) => setSquareMeter({...squareMeter,quantity:e.target.value})}/><Input placeholder="Valor m²" value={squareMeter.pricePerSquareMeter} onChange={(e) => setSquareMeter({...squareMeter,pricePerSquareMeter:e.target.value})}/></div><Card className="p-4">Total: <strong>{brl(squareMeterTotal)}</strong></Card><DialogFooter><Button onClick={addSquareMeterSale}>Adicionar ao carrinho</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

function Metric({ label, value, tone = "blue" }: { label: string; value: any; tone?: string }) {
  const colors = { green: "text-green-600", red: "text-red-600", orange: "text-orange-600", blue: "text-blue-700" };
  return <Card className="rounded-2xl p-3 sm:p-4"><p className="text-xs font-black uppercase text-slate-500">{label}</p><p className={cn("mt-1 text-lg font-black sm:text-xl", colors[tone] || colors.blue)}>{value}</p></Card>;
}
function QuickButton({ icon: Icon, label, onClick, danger = false }: any) {
  return <Button variant="outline" className={cn("h-11 rounded-2xl bg-white text-xs font-black sm:h-12 sm:text-sm", danger && "border-red-200 text-red-600")} onClick={onClick}><Icon className="mr-2 h-4 w-4"/>{label}</Button>;
}
function Summary({ label, value }: { label: string; value: any }) { return <div className="flex justify-between text-sm"><span>{label}</span><strong>{value}</strong></div>; }
function MoneyInput({ label, value, setValue, negative = false }: any) { return <div className="mt-2 grid grid-cols-[1fr_120px] items-center gap-3"><Label>{label}</Label><Input type="number" step="0.01" min="0" value={value} onChange={(e) => setValue(toNumber(e.target.value))} className={cn("text-right", negative && "text-red-600")}/></div>; }
function Shortcut({ k, label }: { k: string; label: string }) { return <span className="inline-flex items-center gap-2"><kbd className="rounded bg-white/15 px-2 py-1 font-black">{k}</kbd>{label}</span>; }
