import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  AlertTriangle,
  Eye,
  EyeOff,
  X,
  Clock,
  CalendarClock,
  CalendarX,
  Play,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  addIsoDays,
  brl,
  fmtDate,
  PRODUCTION_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  toIsoDate,
} from "@/lib/format";
import { OrderEditor } from "@/components/OrderEditor";
import { OSStatusBadge } from "@/components/OSStatusBadge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({
    meta: [
      { title: "Ordens de serviço | Decode Analytics" },
      {
        name: "description",
        content: "Gestão de ordens de gráfica e manutenção de equipamentos da Decode Analytics.",
      },
      { property: "og:title", content: "Ordens de serviço | Decode Analytics" },
      {
        property: "og:description",
        content: "Atendimento, checklist e acompanhamento de serviços gráficos e técnicos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const qc = useQueryClient();
  const [segment, setSegment] = useState("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [productionStatus, setProductionStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [deadlineFilter, setDeadlineFilter] = useState("all");
  const [responsibleFilter, setResponsibleFilter] = useState("all");
  const [lifecycleTab, setLifecycleTab] = useState<
    "todas" | "producao" | "concluidas" | "arquivadas"
  >("todas");

  const { data: rawOrders } = useQuery({
    queryKey: ["orders", showCompleted, lifecycleTab],
    queryFn: async () => {
      let q = supabase
        .from("orders" as any)
        .select(
          "*, clients(name), assignee:profiles!orders_assigned_to_fkey(name,email), service_contracts(number,title)",
        )
        .order("created_at", { ascending: false })
        .limit(200) as any;
      // If a lifecycle tab targets concluídas/arquivadas we must include them
      const forceAll = lifecycleTab !== "todas" && lifecycleTab !== "producao";
      if (!showCompleted && !forceAll) {
        q = q.not("production_status", "in", "(entregue,cancelado)");
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const { data: team } = useQuery({
    queryKey: ["profiles-team"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id,name,email").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const rows = rawOrders ?? [];
    const term = search.trim().toLowerCase();
    const todayIso = toIsoDate();
    const nextWeekIso = addIsoDays(todayIso, 7);

    return rows.filter((r: any) => {
      const matchesSearch =
        !term ||
        (r.clients?.name ?? "").toLowerCase().includes(term) ||
        String(r.number).includes(term);
      const matchesProd = productionStatus === "all" || r.production_status === productionStatus;
      const matchesPay = paymentStatus === "all" || r.payment_status === paymentStatus;
      const matchesResp =
        responsibleFilter === "all" ||
        (responsibleFilter === "unassigned" ? !r.assigned_to : r.assigned_to === responsibleFilter);

      let matchesDeadline = true;
      if (deadlineFilter === "hoje") {
        matchesDeadline = r.deadline === todayIso;
      } else if (deadlineFilter === "atrasado") {
        matchesDeadline = isOverdue(r);
      } else if (deadlineFilter === "proximos7") {
        matchesDeadline =
          typeof r.deadline === "string" && r.deadline >= todayIso && r.deadline <= nextWeekIso;
      } else if (deadlineFilter === "no_prazo") {
        // Has a deadline, not overdue, and OS still open
        matchesDeadline =
          !!r.deadline &&
          !isOverdue(r) &&
          r.production_status !== "entregue" &&
          r.production_status !== "cancelado";
      } else if (deadlineFilter === "sem_prazo") {
        matchesDeadline = !r.deadline;
      }

      let matchesLifecycle = true;
      if (lifecycleTab === "producao") {
        matchesLifecycle =
          r.production_status !== "entregue" &&
          r.production_status !== "cancelado" &&
          r.production_status !== "pausado";
      } else if (lifecycleTab === "concluidas") {
        matchesLifecycle = r.production_status === "entregue";
      } else if (lifecycleTab === "arquivadas") {
        matchesLifecycle = r.production_status === "cancelado" || r.production_status === "pausado";
      }

      return (
        (segment === "all" || (r.service_segment || "grafica") === segment) &&
        matchesSearch &&
        matchesProd &&
        matchesPay &&
        matchesResp &&
        matchesDeadline &&
        matchesLifecycle
      );
    });
  }, [
    rawOrders,
    segment,
    search,
    productionStatus,
    paymentStatus,
    deadlineFilter,
    responsibleFilter,
    lifecycleTab,
  ]);

  const counts = useMemo(() => {
    const rows = rawOrders ?? [];
    return {
      todas: rows.length,
      producao: rows.filter(
        (r: any) =>
          r.production_status !== "entregue" &&
          r.production_status !== "cancelado" &&
          r.production_status !== "pausado",
      ).length,
      concluidas: rows.filter((r: any) => r.production_status === "entregue").length,
      arquivadas: rows.filter(
        (r: any) => r.production_status === "cancelado" || r.production_status === "pausado",
      ).length,
    };
  }, [rawOrders]);

  const deadlineCounts = useMemo(() => {
    const rows = rawOrders ?? [];
    const openOs = rows.filter(
      (r: any) => r.production_status !== "entregue" && r.production_status !== "cancelado",
    );
    return {
      atrasado: openOs.filter((r: any) => isOverdue(r)).length,
      no_prazo: openOs.filter((r: any) => !!r.deadline && !isOverdue(r)).length,
      sem_prazo: openOs.filter((r: any) => !r.deadline).length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawOrders]);

  const activeChips: { key: string; label: string; onClear: () => void }[] = [];
  if (lifecycleTab !== "todas") {
    const map = {
      producao: "Em produção",
      concluidas: "Concluídas",
      arquivadas: "Arquivadas",
    } as const;
    activeChips.push({
      key: "lifecycle",
      label: map[lifecycleTab],
      onClear: () => setLifecycleTab("todas"),
    });
  }
  if (productionStatus !== "all") {
    activeChips.push({
      key: "prod",
      label: `Status: ${PRODUCTION_STATUS_LABEL[productionStatus] ?? productionStatus}`,
      onClear: () => setProductionStatus("all"),
    });
  }
  if (paymentStatus !== "all") {
    activeChips.push({
      key: "pay",
      label: `Pagamento: ${PAYMENT_STATUS_LABEL[paymentStatus] ?? paymentStatus}`,
      onClear: () => setPaymentStatus("all"),
    });
  }
  if (deadlineFilter !== "all") {
    const map: Record<string, string> = {
      hoje: "Prazo: hoje",
      proximos7: "Prazo: próximos 7 dias",
      atrasado: "Prazo: atrasado",
      no_prazo: "Prazo: no prazo",
      sem_prazo: "Prazo: sem prazo",
    };
    activeChips.push({
      key: "deadline",
      label: map[deadlineFilter] ?? deadlineFilter,
      onClear: () => setDeadlineFilter("all"),
    });
  }
  if (responsibleFilter !== "all") {
    const name =
      responsibleFilter === "unassigned"
        ? "Sem responsável"
        : (team ?? []).find((m: any) => m.id === responsibleFilter)?.name ||
          (team ?? []).find((m: any) => m.id === responsibleFilter)?.email ||
          "Responsável";
    activeChips.push({
      key: "resp",
      label: `Resp.: ${name}`,
      onClear: () => setResponsibleFilter("all"),
    });
  }
  if (search.trim()) {
    activeChips.push({
      key: "search",
      label: `Busca: "${search.trim()}"`,
      onClear: () => setSearch(""),
    });
  }

  async function remove(id: string, number: number) {
    if (!confirm(`Excluir OS #${number}? Esta ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluída");
    qc.invalidateQueries({ queryKey: ["orders"] });
  }

  async function quickStatus(id: string, number: number, status: string, label: string) {
    const { error } = await supabase
      .from("orders")
      .update({ production_status: status as any })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`OS #${number} ${label}`);
    qc.invalidateQueries({ queryKey: ["orders"] });
  }

  function isOverdue(o: any) {
    return (
      typeof o.deadline === "string" &&
      o.deadline < toIsoDate() &&
      o.production_status !== "entregue" &&
      o.production_status !== "cancelado"
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row gap-2 justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente ou nº"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCompleted((v) => !v)}
              title={
                showCompleted ? "Ocultar entregues/cancelados" : "Mostrar entregues/cancelados"
              }
            >
              {showCompleted ? (
                <EyeOff className="w-4 h-4 mr-1" />
              ) : (
                <Eye className="w-4 h-4 mr-1" />
              )}
              {showCompleted ? "Ocultar concluídas" : "Mostrar concluídas"}
            </Button>
            <Button
              onClick={() => {
                setEditId(null);
                setOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Nova OS
            </Button>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Select value={productionStatus} onValueChange={setProductionStatus}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Status produção" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {Object.entries(PRODUCTION_STATUS_LABEL).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={paymentStatus} onValueChange={setPaymentStatus}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Status pagamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os pagamentos</SelectItem>
              {Object.entries(PAYMENT_STATUS_LABEL).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={deadlineFilter} onValueChange={setDeadlineFilter}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Prazo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer prazo</SelectItem>
              <SelectItem value="atrasado">Atrasadas</SelectItem>
              <SelectItem value="no_prazo">No prazo</SelectItem>
              <SelectItem value="hoje">Para hoje</SelectItem>
              <SelectItem value="proximos7">Próximos 7 dias</SelectItem>
              <SelectItem value="sem_prazo">Sem prazo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os responsáveis</SelectItem>
              <SelectItem value="unassigned">Sem responsável</SelectItem>
              {(team ?? []).map((m: any) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name || m.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar segmento">
        {[
          ["all", "Todos os segmentos"],
          ["tecnologia", "Tecnologia / Manutenção"],
          ["grafica", "Gráfica / Design"],
        ].map(([id, label]) => (
          <Button
            key={id}
            size="sm"
            variant={segment === id ? "default" : "outline"}
            aria-pressed={segment === id}
            onClick={() => setSegment(id)}
          >
            {label}
          </Button>
        ))}
      </div>
      <Tabs value={lifecycleTab} onValueChange={(v) => setLifecycleTab(v as any)}>
        <TabsList className="w-full sm:w-auto flex flex-wrap gap-1">
          <TabsTrigger value="todas" className="text-xs">
            Todas <span className="ml-1 text-muted-foreground">({counts.todas})</span>
          </TabsTrigger>
          <TabsTrigger value="producao" className="text-xs">
            Em produção <span className="ml-1 text-muted-foreground">({counts.producao})</span>
          </TabsTrigger>
          <TabsTrigger value="concluidas" className="text-xs">
            Concluídas <span className="ml-1 text-muted-foreground">({counts.concluidas})</span>
          </TabsTrigger>
          <TabsTrigger value="arquivadas" className="text-xs">
            Arquivadas <span className="ml-1 text-muted-foreground">({counts.arquivadas})</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Prazo:</span>
        {(
          [
            {
              key: "all",
              label: "Todos",
              icon: null,
              tone: "bg-muted text-foreground border-transparent",
              activeTone: "bg-primary text-primary-foreground",
            },
            {
              key: "atrasado",
              label: `Atrasadas${deadlineCounts.atrasado ? ` (${deadlineCounts.atrasado})` : ""}`,
              icon: <AlertTriangle className="w-3.5 h-3.5" />,
              tone: "bg-red-50 text-red-700 border-red-200",
              activeTone: "bg-red-600 text-white border-red-600",
            },
            {
              key: "no_prazo",
              label: `No prazo${deadlineCounts.no_prazo ? ` (${deadlineCounts.no_prazo})` : ""}`,
              icon: <Clock className="w-3.5 h-3.5" />,
              tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
              activeTone: "bg-emerald-600 text-white border-emerald-600",
            },
            {
              key: "hoje",
              label: "Para hoje",
              icon: <CalendarClock className="w-3.5 h-3.5" />,
              tone: "bg-amber-50 text-amber-700 border-amber-200",
              activeTone: "bg-amber-600 text-white border-amber-600",
            },
            {
              key: "proximos7",
              label: "Próximos 7 dias",
              icon: <CalendarClock className="w-3.5 h-3.5" />,
              tone: "bg-blue-50 text-blue-700 border-blue-200",
              activeTone: "bg-blue-600 text-white border-blue-600",
            },
            {
              key: "sem_prazo",
              label: `Sem prazo${deadlineCounts.sem_prazo ? ` (${deadlineCounts.sem_prazo})` : ""}`,
              icon: <CalendarX className="w-3.5 h-3.5" />,
              tone: "bg-slate-50 text-slate-600 border-slate-200",
              activeTone: "bg-slate-700 text-white border-slate-700",
            },
          ] as const
        ).map((opt) => {
          const active = deadlineFilter === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setDeadlineFilter(opt.key)}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                active ? opt.activeTone : `${opt.tone} hover:brightness-95`
              }`}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground mr-1">Filtros ativos:</span>
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.onClear}
              className="inline-flex items-center gap-1 rounded-full border bg-muted/50 hover:bg-muted px-2.5 py-1 text-xs transition-colors"
              aria-label={`Remover filtro ${chip.label}`}
            >
              <span>{chip.label}</span>
              <X className="w-3 h-3 opacity-70" />
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setLifecycleTab("todas");
              setProductionStatus("all");
              setPaymentStatus("all");
              setDeadlineFilter("all");
              setResponsibleFilter("all");
              setSearch("");
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline ml-1"
          >
            Limpar todos
          </button>
        </div>
      )}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="text-left p-3">Nº</th>
                <th className="text-left p-3">Cliente</th>
                <th className="text-left p-3 hidden md:table-cell">Prazo</th>
                <th className="text-left p-3 hidden md:table-cell">Status</th>
                <th className="text-left p-3 hidden xl:table-cell">Responsável / atividade</th>
                <th className="text-left p-3 hidden lg:table-cell">Pagamento</th>
                <th className="text-right p-3">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(filtered ?? []).map((o: any) => (
                <tr key={o.id} className="border-t hover:bg-muted/30">
                  <td className="p-3 font-mono">#{o.number}</td>
                  <td className="p-3 font-medium">
                    <div className="flex flex-wrap items-center gap-2">
                      {o.clients?.name}
                      <Badge variant="outline">
                        {o.service_segment === "tecnologia" ? "Tecnologia" : "Gráfica"}
                      </Badge>
                      <OSStatusBadge
                        status={o.production_status}
                        className="text-[10px] px-2 py-0.5"
                      />
                      {o.service_contracts?.number && (
                        <Badge variant="secondary" className="text-[10px]">
                          Contrato #{o.service_contracts.number}
                        </Badge>
                      )}
                      {o.urgent && (
                        <Badge className="bg-destructive text-destructive-foreground">
                          Urgente
                        </Badge>
                      )}
                      {isOverdue(o) && <AlertTriangle className="w-3 h-3 text-destructive" />}
                    </div>
                  </td>
                  <td className="p-3 hidden md:table-cell">{fmtDate(o.deadline)}</td>
                  <td className="p-3 hidden md:table-cell">
                    <Badge variant="outline">{PRODUCTION_STATUS_LABEL[o.production_status]}</Badge>
                  </td>
                  <td className="p-3 hidden xl:table-cell max-w-[260px]">
                    <div className="font-medium text-xs">
                      {o.assignee?.name || o.assignee?.email || "Sem responsável"}
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-1">
                      {o.current_activity || "Atividade não informada"}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gold" style={{ width: `${o.progress || 0}%` }} />
                      </div>
                      <span className="text-[10px]">{o.progress || 0}%</span>
                    </div>
                  </td>
                  <td className="p-3 hidden lg:table-cell">
                    <Badge variant="outline">{PAYMENT_STATUS_LABEL[o.payment_status]}</Badge>
                  </td>
                  <td className="p-3 text-right font-mono">{brl(o.total)}</td>
                  <td className="p-3 text-right">
                    {o.production_status !== "em_producao" &&
                      o.production_status !== "entregue" &&
                      o.production_status !== "cancelado" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Avançar para Em produção"
                          onClick={() =>
                            quickStatus(o.id, o.number, "em_producao", "movida para produção")
                          }
                        >
                          <Play className="w-4 h-4 text-blue-600" />
                        </Button>
                      )}
                    {o.production_status !== "entregue" && o.production_status !== "cancelado" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Marcar como concluída"
                        onClick={() => {
                          if (!confirm(`Concluir OS #${o.number}?`)) return;
                          quickStatus(o.id, o.number, "entregue", "marcada como concluída");
                        }}
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Editar"
                      onClick={() => {
                        setEditId(o.id);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Excluir"
                      onClick={() => remove(o.id, o.number)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
              {!filtered?.length && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Nenhuma OS cadastrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <OrderEditor
        open={open}
        onOpenChange={setOpen}
        orderId={editId}
        onSaved={() => qc.invalidateQueries({ queryKey: ["orders"] })}
      />
    </div>
  );
}
