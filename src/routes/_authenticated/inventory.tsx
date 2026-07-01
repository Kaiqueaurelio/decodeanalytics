import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Boxes,
  CheckCircle2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { brl } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/inventory")({
  component: InventoryPage,
});

type ServiceOption = {
  id: string;
  name: string;
  category: string;
  unit: string | null;
  base_price: number;
};

type InventoryItem = {
  id: string;
  service_id: string | null;
  name: string;
  sku: string | null;
  unit: string;
  current_quantity: number;
  min_quantity: number;
  cost_price: number;
  location: string | null;
  notes: string | null;
  active: boolean;
  updated_at: string;
  services?: {
    name: string;
    category: string;
    base_price: number;
  } | null;
};

type InventoryMovement = {
  id: string;
  inventory_item_id: string;
  type: "entrada" | "saida" | "ajuste";
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string | null;
  reference: string | null;
  created_at: string;
  inventory_items?: {
    name: string;
    sku: string | null;
  } | null;
};

type ItemForm = {
  id?: string;
  service_id: string;
  name: string;
  sku: string;
  unit: string;
  current_quantity: string;
  min_quantity: string;
  cost_price: string;
  location: string;
  notes: string;
  active: boolean;
};

const EMPTY_ITEM: ItemForm = {
  service_id: "none",
  name: "",
  sku: "",
  unit: "un",
  current_quantity: "0",
  min_quantity: "0",
  cost_price: "0",
  location: "",
  notes: "",
  active: true,
};

const EMPTY_MOVEMENT = {
  itemId: "",
  type: "entrada" as "entrada" | "saida" | "ajuste",
  quantity: "",
  reason: "",
  reference: "",
};

function toNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  return Number(String(value ?? "0").replace(",", ".")) || 0;
}

function formatQty(value: number, unit: string) {
  return `${Number(value || 0).toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
  })} ${unit || "un"}`;
}

function InventoryPage() {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"todos" | "baixo" | "zerado" | "ok">("todos");
  const [itemOpen, setItemOpen] = useState(false);
  const [movementOpen, setMovementOpen] = useState(false);
  const [itemForm, setItemForm] = useState<ItemForm>(EMPTY_ITEM);
  const [movement, setMovement] = useState(EMPTY_MOVEMENT);

  const { data: services = [] } = useQuery({
    queryKey: ["inventory_services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, category, unit, base_price")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data as ServiceOption[];
    },
  });

  const {
    data: items = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["inventory_items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items" as any)
        .select("*, services(name, category, base_price)")
        .order("name");
      if (error) throw error;
      return (data ?? []) as unknown as InventoryItem[];
    },
  });

  const { data: movements = [] } = useQuery({
    queryKey: ["inventory_movements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_movements" as any)
        .select("*, inventory_items(name, sku)")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as unknown as InventoryMovement[];
    },
  });

  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesTerm = !term
        || [item.name, item.sku, item.location, item.services?.category]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      const isZero = Number(item.current_quantity) <= 0;
      const isLow = Number(item.current_quantity) <= Number(item.min_quantity);
      const matchesStatus =
        status === "todos"
        || (status === "zerado" && isZero)
        || (status === "baixo" && isLow && !isZero)
        || (status === "ok" && !isLow && !isZero);
      return matchesTerm && matchesStatus;
    });
  }, [items, query, status]);

  const summary = useMemo(() => {
    const totalItems = items.length;
    const lowItems = items.filter(
      (item) => Number(item.current_quantity) <= Number(item.min_quantity) && Number(item.current_quantity) > 0,
    ).length;
    const zeroItems = items.filter((item) => Number(item.current_quantity) <= 0).length;
    const totalValue = items.reduce(
      (sum, item) => sum + Number(item.current_quantity || 0) * Number(item.cost_price || 0),
      0,
    );
    return { totalItems, lowItems, zeroItems, totalValue };
  }, [items]);

  function openNewItem() {
    setItemForm(EMPTY_ITEM);
    setItemOpen(true);
  }

  function editItem(item: InventoryItem) {
    setItemForm({
      id: item.id,
      service_id: item.service_id || "none",
      name: item.name,
      sku: item.sku || "",
      unit: item.unit || "un",
      current_quantity: String(item.current_quantity ?? 0),
      min_quantity: String(item.min_quantity ?? 0),
      cost_price: String(item.cost_price ?? 0),
      location: item.location || "",
      notes: item.notes || "",
      active: item.active,
    });
    setItemOpen(true);
  }

  function openMovement(item?: InventoryItem, type: "entrada" | "saida" | "ajuste" = "entrada") {
    setMovement({
      ...EMPTY_MOVEMENT,
      itemId: item?.id || "",
      type,
    });
    setMovementOpen(true);
  }

  async function saveItem() {
    if (!itemForm.name.trim()) return toast.error("Informe o nome do item.");
    const payload = {
      service_id: itemForm.service_id === "none" ? null : itemForm.service_id,
      name: itemForm.name.trim(),
      sku: itemForm.sku.trim() || null,
      unit: itemForm.unit.trim() || "un",
      current_quantity: Math.max(0, toNumber(itemForm.current_quantity)),
      min_quantity: Math.max(0, toNumber(itemForm.min_quantity)),
      cost_price: Math.max(0, toNumber(itemForm.cost_price)),
      location: itemForm.location.trim() || null,
      notes: itemForm.notes.trim() || null,
      active: itemForm.active,
    };

    const { data: userData } = await supabase.auth.getUser();
    const result = itemForm.id
      ? await supabase.from("inventory_items" as any).update(payload).eq("id", itemForm.id)
      : await supabase.from("inventory_items" as any).insert({
          ...payload,
          created_by: userData.user?.id ?? null,
        });

    if (result.error) return toast.error(result.error.message);
    toast.success("Item de estoque salvo.");
    setItemOpen(false);
    setItemForm(EMPTY_ITEM);
    qc.invalidateQueries({ queryKey: ["inventory_items"] });
  }

  async function deleteItem(item: InventoryItem) {
    if (!confirm(`Excluir "${item.name}" do estoque?`)) return;
    const { error } = await supabase.from("inventory_items" as any).delete().eq("id", item.id);
    if (error) return toast.error(error.message);
    toast.success("Item removido do estoque.");
    qc.invalidateQueries({ queryKey: ["inventory_items"] });
    qc.invalidateQueries({ queryKey: ["inventory_movements"] });
  }

  async function applyMovement() {
    const item = items.find((current) => current.id === movement.itemId);
    if (!item) return toast.error("Selecione um item.");
    const quantity = toNumber(movement.quantity);
    if (quantity < 0 || (!quantity && movement.type !== "ajuste")) {
      return toast.error("Informe uma quantidade valida.");
    }

    const previous = Number(item.current_quantity || 0);
    const next =
      movement.type === "entrada"
        ? previous + quantity
        : movement.type === "saida"
          ? previous - quantity
          : quantity;

    if (next < 0) return toast.error("A saida deixaria o estoque negativo.");

    const { data: userData } = await supabase.auth.getUser();
    const update = await supabase
      .from("inventory_items" as any)
      .update({ current_quantity: next })
      .eq("id", item.id);
    if (update.error) return toast.error(update.error.message);

    const insert = await supabase.from("inventory_movements" as any).insert({
      inventory_item_id: item.id,
      type: movement.type,
      quantity: movement.type === "ajuste" ? Math.abs(next - previous) : quantity,
      previous_quantity: previous,
      new_quantity: next,
      reason: movement.reason.trim() || null,
      reference: movement.reference.trim() || null,
      created_by: userData.user?.id ?? null,
    });
    if (insert.error) return toast.error(insert.error.message);

    toast.success("Movimento registrado.");
    setMovementOpen(false);
    setMovement(EMPTY_MOVEMENT);
    qc.invalidateQueries({ queryKey: ["inventory_items"] });
    qc.invalidateQueries({ queryKey: ["inventory_movements"] });
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Itens no estoque" value={String(summary.totalItems)} icon={Boxes} />
        <SummaryCard label="Estoque baixo" value={String(summary.lowItems)} icon={AlertTriangle} tone="amber" />
        <SummaryCard label="Zerados" value={String(summary.zeroItems)} icon={RefreshCcw} tone="red" />
        <SummaryCard label="Valor em estoque" value={brl(summary.totalValue)} icon={CheckCircle2} tone="green" />
      </section>

      <Card className="overflow-hidden border-border/80">
        <div className="flex flex-col gap-3 border-b p-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-orange">
              Controle de estoque
            </p>
            <h2 className="text-xl font-extrabold text-brand-blue">Materiais e produtos</h2>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => openMovement()}>
              <SlidersHorizontal className="h-4 w-4" /> Movimentar
            </Button>
            <Button onClick={openNewItem}>
              <Plus className="h-4 w-4" /> Novo item
            </Button>
          </div>
        </div>

        <div className="grid gap-3 border-b p-3 lg:grid-cols-[minmax(0,1fr)_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-9"
              placeholder="Buscar por item, SKU, local ou categoria..."
            />
          </div>
          <Select value={status} onValueChange={(value: any) => setStatus(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="baixo">Estoque baixo</SelectItem>
              <SelectItem value="zerado">Zerados</SelectItem>
              <SelectItem value="ok">Saudaveis</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error ? (
          <div className="p-6 text-sm font-semibold text-destructive">
            Nao consegui carregar o estoque. Confirme se a migration de estoque ja foi aplicada no Supabase.
          </div>
        ) : isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Carregando estoque...</div>
        ) : filteredItems.length ? (
          <div className="grid gap-3 p-3 md:grid-cols-2 2xl:grid-cols-3">
            {filteredItems.map((item) => (
              <InventoryCard
                key={item.id}
                item={item}
                onEdit={() => editItem(item)}
                onDelete={() => deleteItem(item)}
                onMove={(type) => openMovement(item, type)}
              />
            ))}
          </div>
        ) : (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Nenhum item encontrado. Cadastre o primeiro item do estoque.
          </div>
        )}
      </Card>

      <Card className="overflow-hidden border-border/80">
        <div className="border-b p-3">
          <h3 className="font-extrabold text-brand-blue">Historico recente</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Data</th>
                <th className="p-3 text-left">Item</th>
                <th className="p-3 text-left">Tipo</th>
                <th className="p-3 text-right">Anterior</th>
                <th className="p-3 text-right">Novo</th>
                <th className="p-3 text-left">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((move) => (
                <tr key={move.id} className="border-t">
                  <td className="p-3 text-muted-foreground">
                    {new Date(move.created_at).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="p-3 font-semibold">{move.inventory_items?.name || "Item"}</td>
                  <td className="p-3">
                    <MovementBadge type={move.type} />
                  </td>
                  <td className="p-3 text-right">{move.previous_quantity}</td>
                  <td className="p-3 text-right font-bold">{move.new_quantity}</td>
                  <td className="p-3 text-muted-foreground">{move.reason || move.reference || "-"}</td>
                </tr>
              ))}
              {!movements.length && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    Nenhuma movimentacao registrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={itemOpen} onOpenChange={setItemOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{itemForm.id ? "Editar item" : "Novo item de estoque"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Produto/servico vinculado</Label>
              <Select
                value={itemForm.service_id}
                onValueChange={(value) => {
                  const service = services.find((current) => current.id === value);
                  setItemForm({
                    ...itemForm,
                    service_id: value,
                    name: service && !itemForm.name ? service.name : itemForm.name,
                    unit: service?.unit || itemForm.unit || "un",
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem vinculo</SelectItem>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nome *</Label>
              <Input value={itemForm.name} onChange={(event) => setItemForm({ ...itemForm, name: event.target.value })} />
            </div>
            <div>
              <Label>SKU / Codigo</Label>
              <Input value={itemForm.sku} onChange={(event) => setItemForm({ ...itemForm, sku: event.target.value })} />
            </div>
            <div>
              <Label>Quantidade atual</Label>
              <Input inputMode="decimal" value={itemForm.current_quantity} onChange={(event) => setItemForm({ ...itemForm, current_quantity: event.target.value })} />
            </div>
            <div>
              <Label>Estoque minimo</Label>
              <Input inputMode="decimal" value={itemForm.min_quantity} onChange={(event) => setItemForm({ ...itemForm, min_quantity: event.target.value })} />
            </div>
            <div>
              <Label>Unidade</Label>
              <Input value={itemForm.unit} onChange={(event) => setItemForm({ ...itemForm, unit: event.target.value })} />
            </div>
            <div>
              <Label>Custo unitario</Label>
              <Input inputMode="decimal" value={itemForm.cost_price} onChange={(event) => setItemForm({ ...itemForm, cost_price: event.target.value })} />
            </div>
            <div>
              <Label>Localizacao</Label>
              <Input value={itemForm.location} onChange={(event) => setItemForm({ ...itemForm, location: event.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Observacoes</Label>
              <Textarea value={itemForm.notes} onChange={(event) => setItemForm({ ...itemForm, notes: event.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemOpen(false)}>Cancelar</Button>
            <Button onClick={saveItem}>Salvar item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={movementOpen} onOpenChange={setMovementOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Movimentar estoque</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Item</Label>
              <Select value={movement.itemId} onValueChange={(value) => setMovement({ ...movement, itemId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um item" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} - {formatQty(item.current_quantity, item.unit)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={movement.type} onValueChange={(value: any) => setMovement({ ...movement, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saida</SelectItem>
                    <SelectItem value="ajuste">Ajuste</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{movement.type === "ajuste" ? "Nova quantidade" : "Quantidade"}</Label>
                <Input inputMode="decimal" value={movement.quantity} onChange={(event) => setMovement({ ...movement, quantity: event.target.value })} />
              </div>
            </div>
            <div>
              <Label>Motivo</Label>
              <Input value={movement.reason} onChange={(event) => setMovement({ ...movement, reason: event.target.value })} placeholder="Compra, venda, perda, conferencia..." />
            </div>
            <div>
              <Label>Referencia</Label>
              <Input value={movement.reference} onChange={(event) => setMovement({ ...movement, reference: event.target.value })} placeholder="NF, OS, fornecedor..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovementOpen(false)}>Cancelar</Button>
            <Button onClick={applyMovement}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: string;
  icon: typeof Boxes;
  tone?: "blue" | "amber" | "red" | "green";
}) {
  const tones = {
    blue: "bg-blue-50 text-brand-blue",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    green: "bg-emerald-50 text-emerald-700",
  };
  return (
    <Card className="flex min-w-0 items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 truncate text-2xl font-black text-brand-blue">{value}</p>
      </div>
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", tones[tone])}>
        <Icon className="h-5 w-5" />
      </span>
    </Card>
  );
}

function InventoryCard({
  item,
  onEdit,
  onDelete,
  onMove,
}: {
  item: InventoryItem;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (type: "entrada" | "saida" | "ajuste") => void;
}) {
  const current = Number(item.current_quantity || 0);
  const min = Number(item.min_quantity || 0);
  const low = current <= min;
  const zero = current <= 0;
  const fill = min > 0 ? Math.min(100, Math.round((current / Math.max(min, 1)) * 100)) : 100;
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-extrabold text-brand-blue">{item.name}</h3>
            {zero ? (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700">Zerado</span>
            ) : low ? (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">Baixo</span>
            ) : (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">OK</span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {item.sku ? `SKU ${item.sku}` : item.services?.category || "Sem categoria"}
            {item.location ? ` - ${item.location}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-muted-foreground">Atual</span>
          <p className="text-xl font-black">{formatQty(current, item.unit)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Minimo</span>
          <p className="text-xl font-black">{formatQty(min, item.unit)}</p>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", low ? "bg-amber-500" : "bg-emerald-500")}
          style={{ width: `${fill}%` }}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => onMove("entrada")}>
          <ArrowUpCircle className="h-4 w-4" /> Entrada
        </Button>
        <Button size="sm" variant="outline" onClick={() => onMove("saida")}>
          <ArrowDownCircle className="h-4 w-4" /> Saida
        </Button>
        <Button size="sm" variant="outline" onClick={() => onMove("ajuste")}>
          <RefreshCcw className="h-4 w-4" /> Ajuste
        </Button>
      </div>
    </div>
  );
}

function MovementBadge({ type }: { type: InventoryMovement["type"] }) {
  const className =
    type === "entrada"
      ? "bg-emerald-50 text-emerald-700"
      : type === "saida"
        ? "bg-red-50 text-red-700"
        : "bg-blue-50 text-brand-blue";
  return (
    <span className={cn("rounded-full px-2 py-1 text-xs font-bold", className)}>
      {type === "entrada" ? "Entrada" : type === "saida" ? "Saida" : "Ajuste"}
    </span>
  );
}
