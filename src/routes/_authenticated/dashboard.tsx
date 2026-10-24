import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  KanbanSquare,
  Laptop,
  Plus,
  Printer,
  Receipt,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { OrderEditor } from "@/components/OrderEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { brl, fmtDate, PRODUCTION_STATUS_LABEL } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

const STATUS_COLORS: Record<string, string> = {
  orcamento: "var(--muted-foreground)",
  aguardando_aprovacao: "var(--brand-yellow)",
  aguardando_arte: "var(--brand-blue)",
  arte_em_criacao: "var(--brand-blue-light)",
  aguardando_pagamento: "var(--brand-orange)",
  aprovado: "var(--success)",
  em_producao: "var(--primary)",
  pausado: "var(--destructive)",
  pronto_para_retirada: "var(--success)",
};

function Dashboard() {
  const qc = useQueryClient();
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [newOrderSegment, setNewOrderSegment] = useState<"grafica" | "tecnologia">("grafica");
  const [segmentFilter, setSegmentFilter] = useState<"all" | "grafica" | "tecnologia">("all");
  const [periodDays, setPeriodDays] = useState<7 | 30 | 90>(7);

  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const today = new Date().toLocaleDateString("en-CA");
      const monthStart = new Date();
      monthStart.setDate(1);
      const [cashResult, ordersResult, receivablesResult, updatesResult] = await Promise.all([
        supabase.from("cash_entries").select("type,amount,entry_date"),
        supabase
          .from("orders")
          .select("*, clients(name), assignee:profiles!orders_assigned_to_fkey(id,name,email)")
          .order("updated_at", { ascending: false }),
        supabase.from("receivables").select("amount,status,due_date"),
        supabase
          .from("production_updates" as any)
          .select(
            "*, orders(number,title), author:profiles!production_updates_author_id_fkey(name,email)",
          )
          .order("created_at", { ascending: false })
          .limit(8),
      ]);

      if (ordersResult.error) throw ordersResult.error;
      const cash = cashResult.data ?? [];
      const orders = (ordersResult.data ?? []) as any[];
      const receivables = receivablesResult.data ?? [];
      const active = orders.filter(
        (order) => !["entregue", "cancelado"].includes(order.production_status),
      );
      const overdue = active.filter(
        (order) => order.deadline && new Date(`${order.deadline}T23:59:59`) < new Date(),
      );
      const stale = active.filter((order) => {
        if (!order.assigned_to) return false;
        const reference = order.last_progress_at || order.updated_at || order.created_at;
        return Date.now() - new Date(reference).getTime() > 24 * 60 * 60 * 1000;
      });
      const unassigned = active.filter((order) => !order.assigned_to);
      const ready = active.filter((order) => order.production_status === "pronto_para_retirada");
      const monthRevenue = cash
        .filter((entry) => entry.type === "entrada" && new Date(entry.entry_date) >= monthStart)
        .reduce((sum, entry) => sum + Number(entry.amount), 0);
      const receivable = receivables
        .filter((entry) => entry.status === "pendente")
        .reduce((sum, entry) => sum + Number(entry.amount), 0);
      const todayEntries = cash
        .filter((entry) => entry.type === "entrada" && entry.entry_date === today)
        .reduce((sum, entry) => sum + Number(entry.amount), 0);

      const workload = new Map<
        string,
        { name: string; count: number; totalProgress: number; tasks: any[] }
      >();
      active.forEach((order) => {
        const key = order.assigned_to || "unassigned";
        const name = order.assignee?.name || order.assignee?.email || "Sem responsável";
        const item = workload.get(key) || {
          name,
          count: 0,
          totalProgress: 0,
          tasks: [] as any[],
        };
        item.count += 1;
        item.totalProgress += Number(order.progress) || 0;
        item.tasks.push(order);
        workload.set(key, item);
      });

      return {
        orders,
        active,
        overdue,
        stale,
        unassigned,
        ready,
        monthRevenue,
        receivable,
        todayEntries,
        workload: [...workload.values()].sort((a, b) => b.count - a.count),
        updates: ((updatesResult.data ?? []) as any[]).filter((update) => {
          const authorEmail = String(update.author?.email ?? "").toLowerCase();
          const authorName = String(update.author?.name ?? "").toLowerCase();
          return !authorEmail.includes("alcateias@admin.br") &&
            !authorEmail.includes("alcateia") &&
            !authorName.includes("alcateia");
        }),
      };
    },
  });

  const visibleOrders = useMemo(
    () => (data?.orders ?? []).filter((order) =>
      segmentFilter === "all" || (order.service_segment || "grafica") === segmentFilter,
    ),
    [data?.orders, segmentFilter],
  );

  const activeOrders = useMemo(
    () => visibleOrders.filter((order) => !["entregue", "cancelado"].includes(order.production_status)),
    [visibleOrders],
  );

  const overdueOrders = useMemo(
    () => activeOrders.filter((order) => order.deadline && new Date(`${order.deadline}T23:59:59`) < new Date()),
    [activeOrders],
  );
  const staleOrders = useMemo(
    () => activeOrders.filter((order) => {
      if (!order.assigned_to) return false;
      const reference = order.last_progress_at || order.updated_at || order.created_at;
      return Date.now() - new Date(reference).getTime() > 24 * 60 * 60 * 1000;
    }),
    [activeOrders],
  );
  const unassignedOrders = useMemo(() => activeOrders.filter((order) => !order.assigned_to), [activeOrders]);
  const readyOrders = useMemo(
    () => activeOrders.filter((order) => order.production_status === "pronto_para_retirada"),
    [activeOrders],
  );

  const workload = useMemo(() => {
    const items = new Map<string, {
      name: string;
      count: number;
      totalProgress: number;
      tasks: (typeof activeOrders)[number][];
    }>();
    activeOrders.forEach((order) => {
      const key = order.assigned_to || "unassigned";
      const name = order.assignee?.name || order.assignee?.email || "Sem responsável";
      const item = items.get(key) || {
        name,
        count: 0,
        totalProgress: 0,
        tasks: [] as (typeof activeOrders)[number][],
      };
      item.count += 1;
      item.totalProgress += Number(order.progress) || 0;
      item.tasks.push(order);
      items.set(key, item);
    });
    return [...items.values()].sort((a, b) => b.count - a.count);
  }, [activeOrders]);

  const statusData = useMemo(() => {
    const totals = new Map<string, number>();
    activeOrders.forEach((order) => {
      totals.set(order.production_status, (totals.get(order.production_status) ?? 0) + 1);
    });
    return [...totals.entries()].map(([status, value]) => ({
      status,
      name: PRODUCTION_STATUS_LABEL[status] || status,
      value,
      color: STATUS_COLORS[status] || "var(--muted-foreground)",
    }));
  }, [activeOrders]);

  const weeklyData = useMemo(() => {
    return Array.from({ length: periodDays }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (periodDays - 1 - index));
      const day = date.toLocaleDateString("en-CA");
      const created = visibleOrders.filter(
        (order) => order.created_at?.slice(0, 10) === day,
      ).length;
      const moved = visibleOrders.filter(
        (order) => order.updated_at?.slice(0, 10) === day,
      ).length;
      return {
        day: periodDays === 7
          ? date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")
          : date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        abertas: created,
        movimentadas: moved,
      };
    });
  }, [visibleOrders, periodDays]);

  const attentionOrders = useMemo(
    () =>
      [...overdueOrders, ...staleOrders, ...unassignedOrders]
        .filter((order, index, rows) => rows.findIndex((item) => item.id === order.id) === index)
        .slice(0, 6),
    [overdueOrders, staleOrders, unassignedOrders],
  );

  const averageProgress = activeOrders.length
    ? Math.round(
        activeOrders.reduce((total, order) => total + (Number(order.progress) || 0), 0) /
          activeOrders.length,
      )
    : 0;
  const alertOrderCount = new Set([...overdueOrders, ...staleOrders].map((order) => order.id)).size;

  const metrics = [
    {
      label: "Ordens ativas",
      value: activeOrders.length,
      helper: `${averageProgress}% de progresso médio`,
      icon: Clock3,
      iconTone: "text-primary bg-primary/10",
      to: "/orders",
    },
    {
      label: "Produção em alerta",
      value: alertOrderCount,
      helper: "prazos ou atualizações pendentes",
      icon: AlertTriangle,
      iconTone: "text-destructive bg-destructive/10",
      to: "/orders",
    },
    {
      label: "Prontas para entrega",
      value: readyOrders.length,
      helper: "serviços finalizados",
      icon: CheckCircle2,
      iconTone: "text-success bg-success/10",
      to: "/production",
    },
    {
      label: "Faturamento no mês",
      value: brl(data?.monthRevenue ?? 0),
      helper: `${brl(data?.todayEntries ?? 0)} recebido hoje`,
      icon: TrendingUp,
      iconTone: "text-brand-blue bg-brand-blue/10",
      to: "/cash",
    },
  ] as const;

  const shortcuts = [
    { label: "Ordens de serviço", description: "Separar gráfica e tecnologia", icon: Printer, to: "/orders", tone: "text-primary bg-primary/10" },
    { label: "Quadro de produção", description: "Etapas e responsáveis", icon: KanbanSquare, to: "/production", tone: "text-brand-blue bg-brand-blue/10" },
    { label: "Orçamentos", description: "Propostas em andamento", icon: FileText, to: "/quotes", tone: "text-brand-orange bg-brand-orange/10" },
    { label: "Clientes", description: "Cadastro e relacionamento", icon: Users, to: "/clients", tone: "text-success bg-success/10" },
    { label: "Financeiro", description: "Caixa e recebimentos", icon: Wallet, to: "/cash", tone: "text-primary bg-primary/10" },
    { label: "Contas a receber", description: "Pendências e vencimentos", icon: Receipt, to: "/receivables", tone: "text-destructive bg-destructive/10" },
  ] as const;

  return (
    <div className="space-y-5 pb-8">
      <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-card px-5 py-6 text-card-foreground shadow-sm md:px-7">
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-brand-blue/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-36 w-64 rounded-full bg-brand-yellow/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-primary">
              <CalendarDays className="h-4 w-4" />
              {new Date().toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
              })}
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Painel de operações</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Acompanhe ordens, produção e financeiro em um só lugar, com os fluxos de gráfica e tecnologia separados.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/production">Abrir produção</Link>
            </Button>
            <Button variant="outline" onClick={() => { setNewOrderSegment("grafica"); setNewOrderOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Nova OS gráfica
            </Button>
            <Button onClick={() => { setNewOrderSegment("tecnologia"); setNewOrderOpen(true); }}>
              <Laptop className="mr-2 h-4 w-4" /> Nova OS tecnologia
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="overflow-hidden p-0 transition-shadow hover:shadow-md">
              <Link to={metric.to} className="block p-5 outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                  <span className={`grid h-9 w-9 place-items-center rounded-xl ${metric.iconTone}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-3 flex items-end justify-between gap-2">
                  <p className="text-2xl font-bold tracking-tight text-card-foreground">{metric.value}</p>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{metric.helper}</p>
              </Link>
            </Card>
          );
        })}
      </section>

      <section className="rounded-2xl border bg-card p-4 sm:p-5">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Visão por área</h2>
            <p className="text-xs text-muted-foreground">Filtre indicadores operacionais e o gráfico abaixo.</p>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar ordens por área">
            {([
              ["all", "Todas"],
              ["grafica", "Gráfica / Design"],
              ["tecnologia", "Tecnologia / Manutenção"],
            ] as const).map(([key, label]) => (
              <Button key={key} size="sm" variant={segmentFilter === key ? "default" : "outline"} aria-pressed={segmentFilter === key} onClick={() => setSegmentFilter(key)}>
                {label}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-medium text-muted-foreground">Período do gráfico:</span>
          {([7, 30, 90] as const).map((days) => (
            <Button key={days} size="sm" variant={periodDays === days ? "secondary" : "ghost"} aria-pressed={periodDays === days} onClick={() => setPeriodDays(days)}>
              {days} dias
            </Button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.45fr_.75fr]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
            <div>
              <h2 className="font-semibold">Movimento da produção</h2>
              <p className="text-xs text-muted-foreground">
                Ordens abertas e movimentadas nos últimos {periodDays} dias
              </p>
            </div>
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
              {segmentFilter === "all" ? "Todas as áreas" : segmentFilter === "grafica" ? "Gráfica / Design" : "Tecnologia / Manutenção"}
            </Badge>
          </div>
          <div className="h-[285px] px-2 pb-3 pt-5 md:px-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ left: -20, right: 10 }}>
                <defs>
                  <linearGradient id="productionFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-blue)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--brand-blue)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12, background: "var(--popover)", color: "var(--popover-foreground)" }}
                  labelStyle={{ color: "var(--popover-foreground)", fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="movimentadas"
                  name="Movimentadas"
                  stroke="var(--brand-blue)"
                  strokeWidth={3}
                  fill="url(#productionFill)"
                />
                <Area
                  type="monotone"
                  dataKey="abertas"
                  name="Novas OS"
                  stroke="var(--brand-yellow)"
                  strokeWidth={2}
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Distribuição das etapas</h2>
            <p className="text-xs text-muted-foreground">Onde as ordens ativas estão agora</p>
          </div>
          <div className="grid min-h-[285px] grid-cols-[1fr_1.15fr] items-center gap-1 p-4">
            <div className="relative h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    innerRadius={48}
                    outerRadius={70}
                    paddingAngle={4}
                    stroke="none"
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.status} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12, background: "var(--popover)", color: "var(--popover-foreground)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
                  <strong className="text-2xl text-foreground">{activeOrders.length}</strong>
                <span className="text-[10px] text-muted-foreground">OS ativas</span>
              </div>
            </div>
            <div className="space-y-2">
              {statusData.slice(0, 6).map((item) => (
                <div key={item.status} className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: item.color }}
                    />
                    <span className="truncate">{item.name}</span>
                  </span>
                  <strong className="text-foreground">{item.value}</strong>
                </div>
              ))}
              {!statusData.length && (
                <p className="text-xs text-muted-foreground">Nenhuma OS ativa.</p>
              )}
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_.85fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h2 className="font-semibold">Equipe em atividade</h2>
              <p className="text-xs text-muted-foreground">
                Quem está trabalhando e em quais serviços
              </p>
            </div>
            <Button size="sm" variant="ghost" asChild>
              <Link to="/production">
                Ver quadro <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-2">
            {workload.slice(0, 6).map((person) => {
              const average = person.count ? Math.round(person.totalProgress / person.count) : 0;
              return (
                <div
                  key={person.name}
                  className="rounded-2xl border bg-muted/30 p-3.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary font-bold text-primary-foreground">
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {person.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {person.count} tarefas em andamento
                        </p>
                      </div>
                    </div>
                    <strong className="text-sm text-primary">{average}%</strong>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${average}%` }}
                    />
                  </div>
                  <p className="mt-3 truncate text-xs text-muted-foreground">
                    {person.tasks[0]?.current_activity ||
                      person.tasks[0]?.title ||
                      "Aguardando atualização"}
                  </p>
                </div>
              );
            })}
            {!workload.length && (
              <div className="col-span-full py-10 text-center text-sm text-muted-foreground">
                Nenhuma tarefa em andamento.
              </div>
            )}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Resumo financeiro</h2>
            <p className="text-xs text-muted-foreground">Recebimentos e valores pendentes</p>
          </div>
          <div className="p-5">
            <div className="mb-5 rounded-2xl bg-primary p-4 text-primary-foreground">
              <div className="flex items-center justify-between text-xs text-primary-foreground/70">
                <span>Faturamento mensal</span>
                <Wallet className="h-4 w-4" />
              </div>
              <p className="mt-2 text-2xl font-bold">{brl(data?.monthRevenue ?? 0)}</p>
              <p className="mt-1 text-[11px] text-brand-yellow">
                {brl(data?.todayEntries ?? 0)} entrou hoje
              </p>
            </div>
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Contas a receber</p>
                <p className="text-xl font-bold text-foreground">{brl(data?.receivable ?? 0)}</p>
              </div>
              <Badge variant="secondary">Pendente</Badge>
            </div>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                  />
                  <Bar
                    dataKey="movimentadas"
                    fill="var(--brand-blue)"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={22}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h2 className="font-semibold">Ordens que exigem atenção</h2>
              <p className="text-xs text-muted-foreground">
                Atrasos, falta de responsável ou de atualização
              </p>
            </div>
            <Badge variant="destructive">{attentionOrders.length}</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-muted/60 text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Ordem / cliente</th>
                  <th className="px-4 py-3 font-medium">Responsável</th>
                  <th className="px-4 py-3 font-medium">Etapa</th>
                  <th className="px-5 py-3 text-right font-medium">Prazo</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {attentionOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/40">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-foreground">OS #{order.number}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.clients?.name || order.title}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      {order.assignee?.name || order.assignee?.email || "Não definido"}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant="outline" className="font-normal">
                        {PRODUCTION_STATUS_LABEL[order.production_status] ||
                          order.production_status}
                      </Badge>
                    </td>
                    <td className={`px-5 py-3.5 text-right text-xs font-medium ${order.deadline && new Date(`${order.deadline}T23:59:59`) < new Date() ? "text-destructive" : "text-muted-foreground"}`}>
                      {order.deadline ? fmtDate(order.deadline) : "Sem prazo"}
                    </td>
                  </tr>
                ))}
                {!attentionOrders.length && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-10 text-center text-sm text-muted-foreground"
                    >
                      Tudo sob controle por aqui.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Atividade recente</h2>
            <p className="text-xs text-muted-foreground">Atualizações enviadas pela equipe</p>
          </div>
          <div className="max-h-[365px] space-y-0 overflow-y-auto p-5">
            {(data?.updates ?? []).map((update, index) => (
              <div key={update.id} className="relative flex gap-3 pb-5 last:pb-0">
                {index < (data?.updates.length ?? 0) - 1 && (
                  <span className="absolute left-[15px] top-8 h-[calc(100%-20px)] w-px bg-border" />
                )}
                <div className="z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {update.activity}
                    </p>
                    <strong className="text-xs text-primary">{update.progress}%</strong>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    OS #{update.orders?.number} · {update.author?.name || update.author?.email}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(update.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
            ))}
            {!data?.updates.length && (
              <div className="py-8 text-center">
                <UserRound className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">As atualizações aparecerão aqui.</p>
              </div>
            )}
          </div>
        </Card>
      </section>

      <section>
        <div className="mb-3">
          <h2 className="font-semibold">Atalhos rápidos</h2>
          <p className="text-xs text-muted-foreground">Acesse as áreas principais sem sair do painel.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shortcuts.map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <Link key={shortcut.to} to={shortcut.to} className="group flex items-center gap-3 rounded-2xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${shortcut.tone}`}><Icon className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-card-foreground">{shortcut.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{shortcut.description}</span>
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </div>
      </section>

      <OrderEditor
        open={newOrderOpen}
        onOpenChange={setNewOrderOpen}
        initialSegment={newOrderSegment}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["dashboard"] });
          qc.invalidateQueries({ queryKey: ["orders"] });
          qc.invalidateQueries({ queryKey: ["production-board"] });
        }}
      />
    </div>
  );
}
