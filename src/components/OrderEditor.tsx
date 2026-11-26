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
import { OSStatusBadge } from "@/components/OSStatusBadge";

import { TechnicalIntake } from "@/components/TechnicalIntake";
import { emptyTechnicalData, readTechnicalData, maintenanceTotals, maintenanceValidationErrors, technicalOrderItems, type TechnicalData } from "@/lib/technical-order";

export interface OrderEditorProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orderId?: string | null;
  onSaved?: () => void;
  fromQuoteId?: string | null;
  initialSegment?: "grafica" | "tecnologia";
  initialContractId?: string | null;
}

interface Item {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  service_id?: string | null;
}

function createEmptyOrderForm(
  serviceSegment: "grafica" | "tecnologia" = "grafica",
  contractId?: string | null,
) {
  return {
    service_segment: serviceSegment,
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
    performed_on: "",
    service_contract_id: contractId ?? "",
    urgent: false,
    assigned_to: "",
    current_activity: "",
    progress: 0,
    quote_id: null,
  };
}

const PROD_STATUSES = Object.keys(PRODUCTION_STATUS_LABEL);

async function stageOrderItemsReplacement(orderId: string, items: Item[]) {
  const { data: previousItems, error: readError } = await supabase
    .from("order_items")
    .select("id,description,quantity,unit_price,subtotal,service_id")
    .eq("order_id", orderId);
  if (readError) return { error: readError.message, rollback: async () => null as string | null };

  const nextRows = items.map((item) => ({
    order_id: orderId,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    subtotal: item.subtotal,
    service_id: item.service_id ?? null,
  }));
  let insertedIds: string[] = [];
  if (nextRows.length) {
    const { data: insertedItems, error: insertError } = await supabase
      .from("order_items")
      .insert(nextRows)
      .select("id");
    if (insertError) return { error: insertError.message, rollback: async () => null as string | null };
    insertedIds = (insertedItems ?? []).map((item) => item.id);
  }

  const previousIds = (previousItems ?? []).map((item) => item.id);
  if (previousIds.length) {
    const { error: deleteError } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", orderId)
      .in("id", previousIds);
    if (deleteError) {
      if (insertedIds.length) {
        const { error: rollbackError } = await supabase
          .from("order_items")
          .delete()
          .in("id", insertedIds);
        return {
          error: rollbackError
            ? `${deleteError.message}. Também não foi possível limpar os novos itens: ${rollbackError.message}`
            : deleteError.message,
          rollback: async () => null as string | null,
        };
      }
      return { error: deleteError.message, rollback: async () => null as string | null };
    }
  }

  return {
    error: null,
    rollback: async () => {
      let rollbackMessage: string | null = null;
      let canRestorePrevious = true;
      if (insertedIds.length) {
        const { error } = await supabase.from("order_items").delete().in("id", insertedIds);
        if (error) {
          rollbackMessage = error.message;
          canRestorePrevious = false;
        }
      }
      if (canRestorePrevious && previousItems?.length) {
        const { error } = await supabase.from("order_items").insert(
          previousItems.map((item) => ({
            id: item.id,
            order_id: orderId,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.subtotal,
            service_id: item.service_id,
          }))
        );
        if (error) rollbackMessage = [rollbackMessage, error.message].filter(Boolean).join("; ");
      }
      return rollbackMessage;
    },
  };
}

function clampPayment(value: unknown, total: number): number {
  const amount = Number(value);
  const safe = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  return Math.round(Math.min(total, safe) * 100) / 100;
}

export function OrderEditor({
  open,
  onOpenChange,
  orderId,
  onSaved,
  fromQuoteId,
  initialSegment = "grafica",
  initialContractId,
}: OrderEditorProps) {
  const [step, setStep] = useState(0);
  const [technical, setTechnical] = useState<TechnicalData>(emptyTechnicalData);
  const [loading, setLoading] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [services, setServices] = useState<{ id: string; name: string; base_price: number }[]>([]);
  const [contracts, setContracts] = useState<
    {
      id: string;
      number: number;
      title: string;
      client_id: string;
      service_id: string;
      amount: number;
      billing_mode: string;
    }[]
  >([]);
  const [team, setTeam] = useState<{ id: string; name: string | null; email: string | null }[]>([]);
  const [form, setForm] = useState<any>(() => createEmptyOrderForm(initialSegment, initialContractId));
  const [items, setItems] = useState<Item[]>([]);
  const minDeadline = toIsoDate();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const needsLoad = !!orderId || !!fromQuoteId || !!initialContractId;
    setStep(0);
    setTechnical(emptyTechnicalData());
    setForm(createEmptyOrderForm(initialSegment, initialContractId));
    setItems([]);
    setLoading(false);
    setLoadingOrder(needsLoad);
    setLoadError(false);

    supabase.from("clients").select("id,name").order("name").then(({ data, error }) => {
      if (cancelled) return;
      if (error) toast.error("Não foi possível carregar os clientes.");
      else setClients(data ?? []);
    });
    supabase.from("services").select("id,name,base_price").eq("active", true).order("name").then(({ data, error }) => {
      if (cancelled) return;
      if (error) toast.error("Não foi possível carregar os serviços.");
      else setServices(data ?? []);
    });
    supabase.from("profiles").select("id,name:full_name,email").order("full_name").then(({ data, error }) => {
      if (cancelled) return;
      if (error) toast.error("Não foi possível carregar a equipe.");
      else setTeam(data ?? []);
    });
    (supabase
      .from("service_contracts" as any)
      .select("id,number,title,client_id,service_id,amount,billing_mode")
      .eq("status", "aprovado") as any
    ).then(({ data, error }: any) => {
      if (cancelled) return;
      if (error) toast.error("Não foi possível carregar os contratos.");
      else setContracts(data ?? []);
    });

    if (orderId) {
      (async () => {
        try {
          const { data: order, error: orderError } = await (supabase
            .from("orders" as any)
            .select("*")
            .eq("id", orderId)
            .single() as any);
          if (cancelled) return;
          if (orderError || !order) {
            setLoadError(true);
            toast.error(orderError?.message || "Não consegui carregar a OS. Feche e tente novamente.");
            return;
          }

          const { data: orderItems, error: itemsError } = await supabase
            .from("order_items")
            .select("*")
            .eq("order_id", orderId);
          if (cancelled) return;
          if (itemsError) {
            setLoadError(true);
            toast.error("Não foi possível carregar os itens da OS. Nenhum dado foi alterado.");
            return;
          }

          setForm({
            ...order,
            deadline: order.deadline ?? "",
            performed_on: order.performed_on ?? "",
            service_contract_id: order.service_contract_id ?? "",
          });
          const loadedTechnical = readTechnicalData(order.technical_data);
          const rawTechnical = order.technical_data as Record<string, unknown> | null;
          const hasStructuredMaintenance = !!rawTechnical &&
            typeof rawTechnical === "object" &&
            !Array.isArray(rawTechnical) &&
            (Array.isArray(rawTechnical.services) || Array.isArray(rawTechnical.parts));
          // Arrays vazios são um estado estruturado válido; só importa itens antigos quando o formato ainda não existe.
          if (!hasStructuredMaintenance) {
            loadedTechnical.services = (orderItems ?? []).map((item) => ({
              id: crypto.randomUUID(),
              description: item.description,
              quantity: Number(item.quantity) || 1,
              unit_price: Number(item.unit_price) || 0,
            }));
          }
          setTechnical(loadedTechnical);
          setItems(
            (orderItems ?? []).map((item) => ({
              id: item.id,
              description: item.description,
              quantity: Number(item.quantity) || 0,
              unit_price: Number(item.unit_price) || 0,
              subtotal: Number(item.subtotal) || 0,
              service_id: item.service_id,
            })),
          );
        } catch (error) {
          if (!cancelled) {
            setLoadError(true);
            toast.error(error instanceof Error ? error.message : "Falha ao carregar a OS.");
          }
        } finally {
          if (!cancelled) setLoadingOrder(false);
        }
      })();
    } else if (fromQuoteId) {
      (async () => {
        try {
          const { data: quote, error: quoteError } = await supabase
            .from("quotes")
            .select("*")
            .eq("id", fromQuoteId)
            .single();
          if (cancelled) return;
          if (quoteError || !quote) {
            setLoadError(true);
            toast.error(quoteError?.message || "Não foi possível carregar o orçamento.");
            return;
          }
          const { data: quoteItems, error: quoteItemsError } = await supabase
            .from("quote_items")
            .select("*")
            .eq("quote_id", fromQuoteId);
          if (cancelled) return;
          if (quoteItemsError) {
            setLoadError(true);
            toast.error("Não foi possível carregar os itens do orçamento.");
            return;
          }
          setForm((current: any) => ({
            ...current,
            client_id: quote.client_id,
            description: quote.description ?? "",
            total: Number(quote.total) || 0,
            quote_id: quote.id,
          }));
          setItems(
            (quoteItems ?? []).map((item) => ({
              description: item.description,
              quantity: Number(item.quantity) || 1,
              unit_price: Number(item.unit_price) || 0,
              subtotal: Number(item.subtotal) || 0,
              service_id: item.service_id,
            })),
          );
        } catch (error) {
          if (!cancelled) {
            setLoadError(true);
            toast.error(error instanceof Error ? error.message : "Falha ao carregar o orçamento.");
          }
        } finally {
          if (!cancelled) setLoadingOrder(false);
        }
      })();
    } else if (initialContractId) {
      (async () => {
        try {
          const { data: contract, error } = await (supabase
            .from("service_contracts" as any)
            .select("id,number,title,client_id,service_id,amount,billing_mode,scope")
            .eq("id", initialContractId)
            .eq("status", "aprovado")
            .single() as any);
          if (cancelled) return;
          if (error || !contract) {
            setLoadError(true);
            toast.error("Não consegui carregar o contrato aprovado.");
            return;
          }
          const unitPrice = contract.billing_mode === "mensal_fixo" ? 0 : Number(contract.amount) || 0;
          setForm({
            ...createEmptyOrderForm(initialSegment, contract.id),
            client_id: contract.client_id,
            title: contract.title,
            description: contract.scope ?? "",
            total: unitPrice,
          });
          setItems([{
            description: contract.title,
            quantity: 1,
            unit_price: unitPrice,
            subtotal: unitPrice,
            service_id: contract.service_id,
          }]);
        } catch (error) {
          if (!cancelled) {
            setLoadError(true);
            toast.error(error instanceof Error ? error.message : "Falha ao carregar o contrato.");
          }
        } finally {
          if (!cancelled) setLoadingOrder(false);
        }
      })();
    }

    return () => {
      cancelled = true;
    };
  }, [open, orderId, fromQuoteId, initialSegment, initialContractId]);

  function updateItem(idx: number, patch: Partial<Item>) {
    setItems((arr) => {
      const next = arr.slice();
      next[idx] = { ...next[idx], ...patch };
      next[idx].subtotal = (Number(next[idx].quantity) || 0) * (Number(next[idx].unit_price) || 0);
      return next;
    });
  }
  const isTech = form.service_segment === "tecnologia";
  const maintenance = maintenanceTotals(technical);
  const total = isTech ? maintenance.total : items.reduce((s, i) => s + (Number(i.subtotal) || 0), 0);

  async function save() {
    if (loadingOrder) return toast.error("Aguarde o carregamento dos dados.");
    if (loadError) return toast.error("Não foi possível carregar os dados. Feche a janela e tente novamente.");
    if (!form.client_id) return toast.error("Selecione um cliente");
    if (isTech && (!technical.equipment || !technical.complaint.trim())) {
      setStep(1);
      return toast.error("Informe o equipamento e o defeito relatado");
    }

    const technicalToSave = {
      ...technical,
      completed_at: technical.technical_status === "pronto"
        ? (technical.completed_at || new Date().toISOString())
        : "",
    };
    if (isTech) {
      const maintenanceErrors = maintenanceValidationErrors(technicalToSave);
      if (maintenanceErrors.length) {
        setStep(3);
        return toast.error(maintenanceErrors[0]);
      }
      const workStarted = ["em_reparo", "pronto"].includes(technicalToSave.technical_status);
      if (workStarted && maintenance.total > 0 && technicalToSave.approval_status === "aguardando") {
        setStep(3);
        return toast.error("Aguarde a aprovação do orçamento antes de iniciar o reparo.");
      }
      if (workStarted && maintenance.total > 0 && technicalToSave.approval_status === "recusado") {
        setStep(3);
        return toast.error("O orçamento foi recusado. Não é possível iniciar ou concluir o reparo.");
      }
    }

    const persistedItems = isTech ? technicalOrderItems(technicalToSave) : items;
    if (!isTech && !persistedItems.length) return toast.error("Adicione ao menos um serviço ou peça");

    setLoading(true);
    try {
      const totalToSave = Number.isFinite(total) ? Math.max(0, total) : 0;
      const paidToSave = clampPayment(form.paid, totalToSave);
      const payload = {
        service_segment: form.service_segment || "grafica",
        technical_data: JSON.parse(JSON.stringify(technicalToSave)),
        client_id: form.client_id,
        title: form.title,
        description: form.description,
        measurements: form.measurements,
        material: form.material,
        finishing: form.finishing,
        client_notes: form.client_notes,
        internal_notes: form.internal_notes,
        total: totalToSave,
        paid: paidToSave,
        payment_method: form.payment_method || null,
        production_status: form.production_status,
        deadline: form.deadline || null,
        performed_on: form.performed_on || null,
        service_contract_id: form.service_contract_id || null,
        urgent: !!form.urgent,
        quote_id: form.quote_id ?? null,
        assigned_to: form.assigned_to || null,
        current_activity: form.current_activity || null,
        progress: Math.min(100, Math.max(0, Number(form.progress) || 0)),
      };

      if (orderId) {
        const stagedItems = await stageOrderItemsReplacement(orderId, persistedItems);
        if (stagedItems.error) return toast.error(stagedItems.error);

        const { error } = await (supabase
          .from("orders" as any)
          .update(payload)
          .eq("id", orderId) as any);
        if (error) {
          const rollbackError = await stagedItems.rollback();
          return toast.error(
            rollbackError
              ? `${error.message}. Atenção: a restauração dos itens também falhou: ${rollbackError}`
              : error.message
          );
        }
      } else {
        const { data, error } = await (supabase
          .from("orders" as any)
          .insert(payload)
          .select("id")
          .single() as any);
        if (error || !data) return toast.error(error?.message || "Não foi possível criar a ordem.");
        const newOrderId = data.id as string;
        if (persistedItems.length) {
          const { error: itemsError } = await supabase.from("order_items").insert(
            persistedItems.map((item) => ({
              order_id: newOrderId,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              subtotal: item.subtotal,
              service_id: item.service_id ?? null,
            }))
          );
          if (itemsError) {
            const { error: cleanupError } = await (supabase
              .from("orders" as any)
              .delete()
              .eq("id", newOrderId) as any);
            return toast.error(
              cleanupError
                ? `A OS foi criada, mas os itens não foram salvos: ${itemsError.message}. Abra a OS ${newOrderId} e tente novamente.`
                : itemsError.message
            );
          }
        }
      }

      toast.success(orderId ? "Ordem atualizada" : "Ordem salva");
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a ordem. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function printCompletionReceipt() {
    if (loadingOrder || loadError) return toast.error("Aguarde o carregamento da OS ou feche e reabra a janela.");
    if (!isTech) return toast.error("O comprovante de conclusão está disponível para OS de informática.");
    if (!orderId) return toast.error("Salve a OS antes de gerar o comprovante");
    if (technical.technical_status !== "pronto")
      return toast.error("Marque a manutenção como pronta antes de emitir o comprovante");
    if (maintenance.total > 0 && ["aguardando", "recusado"].includes(technical.approval_status))
      return toast.error("O orçamento precisa estar aprovado ou marcado como não solicitado para emitir o comprovante.");

    try {
      const [{ data: order, error: orderError }, { data: client, error: clientError }, { data: company, error: companyError }] = await Promise.all([
        supabase.from("orders").select("*").eq("id", orderId).single(),
        supabase.from("clients").select("*").eq("id", form.client_id).single(),
        supabase.from("company_settings").select("*").limit(1).single(),
      ]);
      if (orderError || clientError || companyError || !order || !client || !company)
        return toast.error(orderError?.message || clientError?.message || companyError?.message || "Dados incompletos para o comprovante");

      const savedTechnical = readTechnicalData((order as any).technical_data);
      const currentTechnical = readTechnicalData({
        ...technical,
        completed_at: savedTechnical.completed_at,
      });
      if (JSON.stringify(savedTechnical) !== JSON.stringify(currentTechnical) ||
          Number((order as any).total) !== total ||
          Number((order as any).paid) !== clampPayment(form.paid, total)) {
        return toast.error("Salve as alterações da OS antes de emitir o comprovante.");
      }
      if (savedTechnical.technical_status !== "pronto")
        return toast.error("A OS salva ainda não está marcada como pronta.");

      const { generateTechnicalCompletionPDF } = await import("@/lib/pdf");
      await generateTechnicalCompletionPDF({
        company: company as any,
        order: order as any,
        client: client as any,
        items: technicalOrderItems(savedTechnical) as any,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar o comprovante.");
    }
  }

  async function printPDF() {
    if (loadingOrder || loadError) return toast.error("Aguarde o carregamento da OS ou feche e reabra a janela.");
    if (!orderId) return toast.error("Salve a OS antes de gerar o PDF");
    if (isTech) {
      const validationErrors = maintenanceValidationErrors(technical);
      if (validationErrors.length) {
        setStep(3);
        return toast.error(validationErrors[0]);
      }
    }

    try {
      const [{ data: order, error: orderError }, { data: client, error: clientError }, { data: itemsFromDb, error: itemsError }, { data: company, error: companyError }] = await Promise.all([
        supabase.from("orders").select("*").eq("id", orderId).single(),
        supabase.from("clients").select("*").eq("id", form.client_id).single(),
        supabase.from("order_items").select("*").eq("order_id", orderId),
        supabase.from("company_settings").select("*").limit(1).single(),
      ]);
      if (orderError || clientError || itemsError || companyError || !order || !client || !company)
        return toast.error(orderError?.message || clientError?.message || itemsError?.message || companyError?.message || "Dados incompletos para o PDF");

      if (isTech) {
        const savedTechnical = readTechnicalData((order as any).technical_data);
        const currentTechnical = readTechnicalData({
          ...technical,
          completed_at: savedTechnical.completed_at,
        });
        if (JSON.stringify(savedTechnical) !== JSON.stringify(currentTechnical) ||
            Number((order as any).total) !== total ||
            Number((order as any).paid) !== clampPayment(form.paid, total)) {
          return toast.error("Salve as alterações da OS antes de gerar o PDF.");
        }
      }

      const { generateOrderPDF } = await import("@/lib/pdf");
      await generateOrderPDF({
        company: company as any,
        order: order as any,
        client: client as any,
        items: (isTech ? technicalOrderItems(readTechnicalData((order as any).technical_data)) : itemsFromDb ?? []) as any,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar o PDF.");
    }
  }

  const steps = ["Cliente", "Equipamento", "Checklist", "Manutenção e valores"];
  function nextStep() {
    if (step === 0 && !form.client_id) return toast.error("Selecione um cliente");
    if (step === 1 && (!technical.equipment || !technical.complaint.trim()))
      return toast.error("Informe o equipamento e o defeito relatado");
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
        {loadingOrder && (
          <p className="text-sm text-muted-foreground" role="status">
            Carregando os dados da ordem. Aguarde antes de editar ou salvar.
          </p>
        )}
        {loadError && (
          <p className="text-sm text-destructive" role="alert">
            Não foi possível carregar todos os dados. Nenhuma alteração foi salva. Feche e reabra a OS para tentar novamente.
          </p>
        )}
        <div
          className="flex flex-wrap gap-2 border-b pb-3"
          role="group"
          aria-label="Segmento da ordem"
        >
          <Button
            variant={!isTech ? "default" : "outline"}
            aria-pressed={!isTech}
            disabled={loadingOrder || loadError}
            onClick={() => {
              setForm({ ...form, service_segment: "grafica" });
              setStep(0);
            }}
          >
            <Palette className="h-4 w-4" />
            Gráfica / Design
          </Button>
          <Button
            variant={isTech ? "default" : "outline"}
            aria-pressed={isTech}
            disabled={loadingOrder || loadError}
            onClick={() => {
              setForm({ ...form, service_segment: "tecnologia" });
              setStep(0);
            }}
          >
            <Laptop className="h-4 w-4" />
            Tecnologia / Manutenção
          </Button>
        </div>
        {isTech && (
          <nav aria-label="Etapas da ordem" className="grid grid-cols-2 gap-1 sm:grid-cols-4">
            {steps.map((label, index) => (
              <Button
                key={label}
                size="sm"
                variant={step === index ? "default" : "ghost"}
                onClick={() => setStep(index)}
                aria-current={step === index ? "step" : undefined}
              >
                {index + 1}. {label}
              </Button>
            ))}
          </nav>
        )}
        <div className="space-y-4">
          <div className={isTech && step !== 0 ? "hidden" : "grid md:grid-cols-3 gap-3"}>
            <div className="md:col-span-2">
              <Label>Cliente *</Label>
              <Select
                value={form.client_id}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    client_id: v,
                    service_contract_id: contracts.some(
                      (contract) =>
                        contract.id === form.service_contract_id && contract.client_id === v,
                    )
                      ? form.service_contract_id
                      : "",
                  })
                }
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
          <div className={isTech && step !== 0 ? "hidden" : "grid gap-3 sm:grid-cols-2"}>
            <div>
              <Label>Contrato aprovado (opcional)</Label>
              <Select
                value={form.service_contract_id || "nenhum"}
                onValueChange={(value) =>
                  setForm({ ...form, service_contract_id: value === "nenhum" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sem contrato vinculado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Sem contrato</SelectItem>
                  {contracts
                    .filter((contract) => contract.client_id === form.client_id)
                    .map((contract) => (
                      <SelectItem key={contract.id} value={contract.id}>
                        #{contract.number} · {contract.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data em que o serviço foi realizado</Label>
              <Input
                type="date"
                value={form.performed_on ?? ""}
                onChange={(event) => setForm({ ...form, performed_on: event.target.value })}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Permite registrar trabalhos feitos anteriormente.
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

          {isTech && step > 0 && (
            <>
              <TechnicalIntake value={technical} onChange={setTechnical} step={step} team={team} />
              {step === 3 && (
                <section className="space-y-3 rounded-lg border p-4">
                  <h3 className="font-semibold">Pagamento e recebimento</h3>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <Label>Valor total</Label>
                      <div className="rounded-md bg-muted px-3 py-2 text-lg font-bold">{brl(total)}</div>
                    </div>
                    <div>
                      <Label>Entrada / valor já pago (R$)</Label>
                      <Input type="number" min="0" max={total} step="0.01" value={form.paid ?? 0}
                        onChange={(e) => setForm({ ...form, paid: Math.min(total, Math.max(0, Number(e.target.value) || 0)) })} />
                    </div>
                    <div>
                      <Label>Forma de pagamento</Label>
                      <Select value={form.payment_method ?? ""} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{PAYMENT_METHODS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Saldo restante: {brl(Math.max(0, total - (Number(form.paid) || 0)))}</p>
                </section>
              )}
            </>
          )}
          <div className={isTech ? "hidden" : "space-y-4"}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Itens</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setItems([
                      ...items,
                      { description: "", quantity: 1, unit_price: 0, subtotal: 0 },
                    ])
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
                        {person.name || person.email}
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
                    setForm({
                      ...form,
                      progress: Math.min(100, Math.max(0, Number(e.target.value))),
                    })
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
          {isTech && step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </Button>
          )}
          {isTech && step < 3 && (
            <Button onClick={nextStep}>
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          {orderId && isTech && technical.technical_status === "pronto" && (
            <Button variant="outline" onClick={printCompletionReceipt} disabled={loading || loadingOrder || loadError}>
              <FileText className="w-4 h-4 mr-1" />
              Comprovante de conclusão
            </Button>
          )}
          {orderId && (
            <Button variant="outline" onClick={printPDF} disabled={loading || loadingOrder || loadError}>
              <FileText className="w-4 h-4 mr-1" />
              PDF
            </Button>
          )}
          <Button onClick={save} disabled={loading || loadingOrder || loadError} className={isTech && step < 3 ? "hidden" : ""}>
            {loading ? "Salvando..." : loadingOrder ? "Carregando..." : loadError ? "Falha ao carregar" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
