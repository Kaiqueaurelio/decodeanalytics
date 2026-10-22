import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2, Plus, FileText, Laptop, Palette, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { brl, PAYMENT_METHODS, PRODUCTION_STATUS_LABEL, toIsoDate } from "@/lib/format";
import { generateOrderPDF } from "@/lib/pdf";
import { OSStatusBadge } from "@/components/OSStatusBadge";

import { TechnicalIntake } from "@/components/TechnicalIntake";
import { emptyTechnicalData, readTechnicalData, type TechnicalData } from "@/lib/technical-order";

export interface OrderEditorProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orderId?: string | null;
  onSaved?: () => void;
  fromQuoteId?: string | null;
}

interface Item {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  service_id?: string | null;
}

const PROD_STATUSES = Object.keys(PRODUCTION_STATUS_LABEL);

export function OrderEditor({
  open,
  onOpenChange,
  orderId,
  onSaved,
  fromQuoteId,
}: OrderEditorProps) {
  const [step, setStep] = useState(0);
  const [technical, setTechnical] = useState<TechnicalData>(emptyTechnicalData);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [services, setServices] = useState<{ id: string; name: string; base_price: number }[]>([]);
  const [team, setTeam] = useState<
    { id: string; full_name: string | null; email: string | null }[]
  >([]);
  const [form, setForm] = useState<any>({
    service_segment: "grafica",
    client_id: "",
    title: "",
    description: "",
    measurements: "",
    material: "",
    finishing: "",
    client_notes: "",
    internal_notes: "",
    total: 0,
    paid: 0,
    payment_method: "",
    production_status: "aguardando_arte",
    deadline: "",
    urgent: false,
    assigned_to: "",
    current_activity: "",
    progress: 0,
  });
  const [items, setItems] = useState<Item[]>([]);
  const minDeadline = toIsoDate();

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setTechnical(emptyTechnicalData());
    supabase
      .from("clients")
      .select("id,name")
      .order("name")
      .then(({ data }) => setClients(data ?? []));
    supabase
      .from("services")
      .select("id,name,base_price")
      .eq("active", true)
      .order("name")
      .then(({ data }) => setServices(data ?? []));
    supabase
      .from("profiles")
      .select("id,full_name,email")
      .order("full_name")
      .then(({ data }) => setTeam(data ?? []));
    if (orderId) {
      (async () => {
        const { data: o, error: oErr } = await supabase.from("orders").select("*").eq("id", orderId).single();
        if (oErr || !o) {
          toast.error("Não consegui carregar a OS. Feche e tente novamente.");
          return;
        }
        const { data: its } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", orderId);
        setForm({ ...o, deadline: o.deadline ?? "" });
        setTechnical(readTechnicalData(o.technical_data));
        setItems(
          (its ?? []).map((i: any) => ({
            id: i.id,
            description: i.description,
            quantity: +i.quantity,
            unit_price: +i.unit_price,
            subtotal: +i.subtotal,
            service_id: i.service_id,
          })),
        );
      })();
    } else if (fromQuoteId) {
      (async () => {
        const { data: q } = await supabase
          .from("quotes")
          .select("*")
          .eq("id", fromQuoteId)
          .single();
        const { data: qi } = await supabase
          .from("quote_items")
          .select("*")
          .eq("quote_id", fromQuoteId);
        if (q)
          setForm((f: any) => ({
            ...f,
            client_id: q.client_id,
            description: q.description ?? "",
            total: +q.total,
            quote_id: q.id,
          }));
        setItems(
          (qi ?? []).map((i: any) => ({
            description: i.description,
            quantity: +i.quantity,
            unit_price: +i.unit_price,
            subtotal: +i.subtotal,
            service_id: i.service_id,
          })),
        );
      })();
    } else {
      setForm({
        service_segment: "grafica",
    client_id: "",
        title: "",
        description: "",
        measurements: "",
        material: "",
        finishing: "",
        client_notes: "",
        internal_notes: "",
        total: 0,
        paid: 0,
        payment_method: "",
        production_status: "aguardando_arte",
        deadline: "",
        urgent: false,
        assigned_to: "",
        current_activity: "",
        progress: 0,
      });
      setItems([]);
    }
  }, [open, orderId, fromQuoteId]);

  function updateItem(idx: number, patch: Partial<Item>) {
    setItems((arr) => {
      const next = arr.slice();
      next[idx] = { ...next[idx], ...patch };
      next[idx].subtotal = (Number(next[idx].quantity) || 0) * (Number(next[idx].unit_price) || 0);
      return next;
    });
  }
  const total = items.reduce((s, i) => s + (Number(i.subtotal) || 0), 0);

  async function save() {
    if (!form.client_id) return toast.error("Selecione um cliente");
    if (form.service_segment === "tecnologia" && (!technical.equipment || !technical.complaint.trim())) { setStep(1); return toast.error("Informe o equipamento e o defeito relatado"); }
    if (!items.length) return toast.error("Adicione ao menos um item");
    setLoading(true);
    const payload = {
      service_segment: form.service_segment || "grafica",
      technical_data: JSON.parse(JSON.stringify(technical)),
      client_id: form.client_id,
      title: form.title,
      description: form.description,
      measurements: form.measurements,
      material: form.material,
      finishing: form.finishing,
      client_notes: form.client_notes,
      internal_notes: form.internal_notes,
      total,
      paid: Number(form.paid) || 0,
      payment_method: form.payment_method || null,
      production_status: form.production_status,
      deadline: form.deadline || null,
      urgent: !!form.urgent,
      quote_id: form.quote_id ?? null,
      assigned_to: form.assigned_to || null,
      current_activity: form.current_activity || null,
      progress: Number(form.progress) || 0,
    };
    let id = orderId;
    if (id) {
      const { error } = await supabase.from("orders").update(payload).eq("id", id);
      if (error) {
        setLoading(false);
        return toast.error(error.message);
      }
      // Substitui itens atomicamente via RPC (evita OS sem itens em caso de falha).
      const { error: rpcErr } = await (supabase as any).rpc("replace_order_items", {
        _order_id: id,
        _items: items.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price,
          subtotal: i.subtotal,
          service_id: i.service_id ?? null,
        })),
      });
      setLoading(false);
      if (rpcErr) return toast.error(rpcErr.message);
      toast.success("Ordem salva");
      onOpenChange(false);
      onSaved?.();
      return;
    } else {
      const { data, error } = await supabase.from("orders").insert(payload).select("id").single();
      if (error || !data) {
        setLoading(false);
        return toast.error(error?.message || "Erro");
      }
      id = data.id;
    }
    const { error: e2 } = await supabase.from("order_items").insert(
      items.map((i) => ({
        order_id: id,
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price,
        subtotal: i.subtotal,
        service_id: i.service_id ?? null,
      })),
    );
    setLoading(false);
    if (e2) return toast.error(e2.message);
    toast.success("Ordem salva");
    onOpenChange(false);
    onSaved?.();
  }

  async function printPDF() {
    if (!orderId) return toast.error("Salve a OS antes de gerar o PDF");
    const [{ data: o }, { data: c }, { data: its }, { data: comp }] = await Promise.all([
      supabase.from("orders").select("*").eq("id", orderId).single(),
      supabase.from("clients").select("*").eq("id", form.client_id).single(),
      supabase.from("order_items").select("*").eq("order_id", orderId),
      supabase.from("company_settings").select("*").limit(1).single(),
    ]);
    if (!o || !c || !comp) return toast.error("Dados incompletos");
    generateOrderPDF({
      company: comp as any,
      order: o as any,
      client: c as any,
      items: (its ?? []) as any,
    });
  }

  const isTech = form.service_segment === "tecnologia";
  const steps = ["Cliente", "Equipamento", "Checklist", "Finalização"];
  function nextStep() {
    if (step === 0 && !form.client_id) return toast.error("Selecione um cliente");
    if (step === 1 && (!technical.equipment || !technical.complaint.trim())) return toast.error("Informe o equipamento e o defeito relatado");
    setStep(Math.min(3, step + 1));
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1rem)] max-w-4xl max-h-[92dvh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{orderId ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}</span>
            {orderId && (
              <OSStatusBadge status={form.production_status} className="px-3 py-1 text-xs" />
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap gap-2 border-b pb-3" role="group" aria-label="Segmento da ordem">
          <Button variant={!isTech ? "default" : "outline"} aria-pressed={!isTech} onClick={() => {setForm({...form,service_segment:"grafica"}); setStep(0);}}><Palette className="h-4 w-4"/>Gráfica / Design</Button>
          <Button variant={isTech ? "default" : "outline"} aria-pressed={isTech} onClick={() => {setForm({...form,service_segment:"tecnologia"});setStep(0);}}><Laptop className="h-4 w-4"/>Tecnologia / Manutenção</Button>
        </div>
        {isTech && <nav aria-label="Etapas da ordem" className="grid grid-cols-2 gap-1 sm:grid-cols-4">{steps.map((label,index)=><Button key={label} size="sm" variant={step===index?"default":"ghost"} onClick={()=>setStep(index)} aria-current={step===index?"step":undefined}>{index+1}. {label}</Button>)}</nav>}
        <div className="space-y-4">
          <div className={isTech && step !== 0 ? "hidden" : "grid md:grid-cols-3 gap-3"}>
            <div className="md:col-span-2">
              <Label>Cliente *</Label>
              <Select
                value={form.client_id}
                onValueChange={(v) => setForm({ ...form, client_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prazo</Label>
              <Input
                type="date"
                min={minDeadline}
                value={form.deadline ?? ""}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Você pode definir o prazo para hoje ou para uma data futura.
              </p>
            </div>
          </div>
          <div className={isTech && step !== 0 ? "hidden" : "grid md:grid-cols-2 gap-3"}>
            <div>
              <Label>Título / Serviço</Label>
              <Input
                value={form.title ?? ""}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div hidden={isTech}>
              <Label>Material</Label>
              <Input
                value={form.material ?? ""}
                onChange={(e) => setForm({ ...form, material: e.target.value })}
              />
            </div>
            <div hidden={isTech}>
              <Label>Medidas</Label>
              <Input
                value={form.measurements ?? ""}
                onChange={(e) => setForm({ ...form, measurements: e.target.value })}
              />
            </div>
            <div hidden={isTech}>
              <Label>Acabamento</Label>
              <Input
                value={form.finishing ?? ""}
                onChange={(e) => setForm({ ...form, finishing: e.target.value })}
              />
            </div>
          </div>
          <div hidden={isTech && step !== 0}>
            <Label>Descrição detalhada</Label>
            <Textarea
              rows={2}
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {isTech && step > 0 && <TechnicalIntake value={technical} onChange={setTechnical} step={step} team={team}/>}
          <div className={isTech && step !== 3 ? "hidden" : "space-y-4"}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Itens</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setItems([...items, { description: "", quantity: 1, unit_price: 0, subtotal: 0 }])
                }
              >
                <Plus className="w-3 h-3 mr-1" />
                Adicionar
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-end bg-muted/30 p-2 rounded"
                >
                  <div className="col-span-12 md:col-span-5">
                    <Select
                      value={it.service_id ?? ""}
                      onValueChange={(v) => {
                        const s = services.find((x) => x.id === v);
                        updateItem(idx, {
                          service_id: v,
                          description: s?.name ?? it.description,
                          unit_price: s?.base_price ?? it.unit_price,
                        });
                      }}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Serviço (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      className="mt-1"
                      placeholder="Descrição"
                      value={it.description}
                      onChange={(e) => updateItem(idx, { description: e.target.value })}
                    />
                  </div>
                  <div className="col-span-3 md:col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Qtd"
                      value={it.quantity}
                      onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Unit."
                      value={it.unit_price}
                      onChange={(e) => updateItem(idx, { unit_price: Number(e.target.value) })}
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2 text-right font-mono text-sm">
                    {brl(it.subtotal)}
                  </div>
                  <div className="col-span-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Remover item"
                      onClick={() => setItems(items.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {!items.length && (
                <div className="text-sm text-muted-foreground italic">Sem itens.</div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-2 text-right">
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="text-2xl font-bold text-primary">{brl(total)}</div>
            </div>
            <div>
              <Label>Entrada / Pago</Label>
              <Input
                type="number"
                step="0.01"
                value={form.paid}
                onChange={(e) => setForm({ ...form, paid: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Forma de pagto</Label>
              <Select
                value={form.payment_method ?? ""}
                onValueChange={(v) => setForm({ ...form, payment_method: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-3 items-end">
            <div>
              <Label>Status produção</Label>
              <Select
                value={form.production_status}
                onValueChange={(v) => setForm({ ...form, production_status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROD_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {PRODUCTION_STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={!!form.urgent}
                onCheckedChange={(v) => setForm({ ...form, urgent: v })}
              />
              <Label>Marcar como urgente</Label>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <Label>{isTech ? "Técnico responsável" : "Responsável pela produção"}</Label>
              <Select
                value={form.assigned_to || "unassigned"}
                onValueChange={(v) =>
                  setForm({ ...form, assigned_to: v === "unassigned" ? "" : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sem responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Sem responsável</SelectItem>
                  {team.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.full_name || person.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Atividade atual</Label>
              <Input
                value={form.current_activity ?? ""}
                onChange={(e) => setForm({ ...form, current_activity: e.target.value })}
                placeholder="Ex.: Criando arte do Instagram"
              />
            </div>
            <div>
              <Label>Progresso inicial (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.progress ?? 0}
                onChange={(e) =>
                  setForm({ ...form, progress: Math.min(100, Math.max(0, Number(e.target.value))) })
                }
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>Observações do cliente</Label>
              <Textarea
                rows={2}
                value={form.client_notes ?? ""}
                onChange={(e) => setForm({ ...form, client_notes: e.target.value })}
              />
            </div>
            <div>
              <Label>Observações internas</Label>
              <Textarea
                rows={2}
                value={form.internal_notes ?? ""}
                onChange={(e) => setForm({ ...form, internal_notes: e.target.value })}
              />
            </div>
          </div>
          </div>
        </div>
        <DialogFooter className="sticky bottom-0 gap-2 border-t bg-background py-3">
          {isTech && step > 0 && <Button variant="outline" onClick={()=>setStep(step-1)}><ChevronLeft className="h-4 w-4"/>Voltar</Button>}
          {isTech && step < 3 && <Button onClick={nextStep}>Próximo<ChevronRight className="h-4 w-4"/></Button>}
          {orderId && (
            <Button variant="outline" onClick={printPDF}>
              <FileText className="w-4 h-4 mr-1" />
              PDF
            </Button>
          )}
          <Button onClick={save} disabled={loading} className={isTech && step < 3 ? "hidden" : ""}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
