import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity, AlertTriangle, CheckCircle2, RefreshCw, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/ai-logs")({
  component: AiLogsPage,
});

type LogRow = {
  id: string;
  occurred_at: string;
  provider: string;
  model: string | null;
  endpoint: string;
  trace_id: string;
  status: "success" | "error";
  http_status: number | null;
  error_type: string | null;
  error_message: string | null;
  duration_ms: number | null;
  ip: string | null;
  extra: any;
};

const ERROR_LABELS: Record<string, string> = {
  timeout: "Timeout",
  network: "Conexão",
  auth: "Autenticação",
  rate_limit: "Rate limit",
  credit: "Créditos",
  validation: "Validação",
  upstream: "Provedor",
  unknown: "Desconhecido",
};

function AiLogsPage() {
  const [statusFilter, setStatusFilter] = useState<"all" | "error" | "success">("all");
  const [endpointFilter, setEndpointFilter] = useState<"all" | "/ella" | "/assistente">("all");
  const [health, setHealth] = useState<null | { status: number; ok: boolean }>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["ai_provider_logs", statusFilter, endpointFilter],
    queryFn: async () => {
      let q = supabase
        .from("ai_provider_logs" as any)
        .select(
          "id,occurred_at,provider,model,endpoint,trace_id,status,http_status,error_type,error_message,duration_ms,ip,extra",
        )
        .order("occurred_at", { ascending: false })
        .limit(200);
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      if (endpointFilter !== "all") q = q.eq("endpoint", endpointFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as LogRow[];
    },
  });

  const stats = useMemo(() => {
    const rows = data ?? [];
    const total = rows.length;
    const errors = rows.filter((r) => r.status === "error").length;
    const avg =
      rows.filter((r) => r.duration_ms != null).reduce((s, r) => s + (r.duration_ms ?? 0), 0) /
      Math.max(1, rows.filter((r) => r.duration_ms != null).length);
    return { total, errors, success: total - errors, avg: Math.round(avg) };
  }, [data]);

  async function runHealthCheck() {
    setCheckingHealth(true);
    try {
      const res = await fetch("/api/public/ai-health", { method: "GET", cache: "no-store" });
      setHealth({ status: res.status, ok: res.ok });
      if (res.ok) toast.success("Gateway respondeu 200 OK");
      else toast.error(`Gateway respondeu ${res.status}`);
    } catch (e: any) {
      setHealth({ status: 0, ok: false });
      toast.error(`Falha de rede: ${e?.message ?? e}`);
    } finally {
      setCheckingHealth(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-black tracking-tight sm:text-2xl md:text-3xl">
            <Activity className="h-6 w-6 text-primary" />
            Logs do Assistente
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitoramento de chamadas e falhas do Lovable AI Gateway.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={runHealthCheck}
            disabled={checkingHealth}
          >
            <Activity className="h-4 w-4 mr-2" />
            {checkingHealth ? "Verificando…" : "Health check"}
          </Button>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")} />
            Recarregar
          </Button>
        </div>
      </header>

      {health && (
        <Card className="p-4 flex items-center gap-3">
          {health.ok ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-destructive" />
          )}
          <div className="text-sm">
            <strong>/api/public/ai-health</strong>{" "}
            → HTTP {health.status || "sem resposta"} {health.ok ? "(gateway disponível)" : "(indisponível)"}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total (200 últimos)" value={stats.total} />
        <StatCard label="Sucesso" value={stats.success} tone="ok" />
        <StatCard label="Falhas" value={stats.errors} tone={stats.errors ? "err" : "ok"} />
        <StatCard label="Latência média" value={`${stats.avg} ms`} />
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="grid gap-1">
            <label className="text-xs text-muted-foreground">Status</label>
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="error">Somente falhas</SelectItem>
                <SelectItem value="success">Somente sucessos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <label className="text-xs text-muted-foreground">Endpoint</label>
            <Select value={endpointFilter} onValueChange={(v: any) => setEndpointFilter(v)}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="/ella">/ella (admin)</SelectItem>
                <SelectItem value="/assistente">/assistente (público)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground border-b">
              <tr>
                <th className="py-2 pr-3">Quando</th>
                <th className="py-2 pr-3">Endpoint</th>
                <th className="py-2 pr-3">Provedor / Modelo</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Tipo</th>
                <th className="py-2 pr-3">HTTP</th>
                <th className="py-2 pr-3">Latência</th>
                <th className="py-2 pr-3">Trace</th>
                <th className="py-2 pr-3">Mensagem</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={9} className="py-6 text-center text-muted-foreground">Carregando…</td></tr>
              )}
              {!isLoading && (data ?? []).length === 0 && (
                <tr><td colSpan={9} className="py-6 text-center text-muted-foreground">Nenhum registro.</td></tr>
              )}
              {(data ?? []).map((r) => (
                <tr key={r.id} className="border-b last:border-0 align-top">
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {new Date(r.occurred_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs">{r.endpoint}</td>
                  <td className="py-2 pr-3">
                    <div className="text-xs">{r.provider}</div>
                    <div className="text-xs text-muted-foreground">{r.model ?? "—"}</div>
                  </td>
                  <td className="py-2 pr-3">
                    {r.status === "success" ? (
                      <Badge variant="secondary" className="bg-success/10 text-success border-0">
                        sucesso
                      </Badge>
                    ) : (
                      <Badge variant="destructive">falha</Badge>
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    {r.error_type ? ERROR_LABELS[r.error_type] ?? r.error_type : "—"}
                  </td>
                  <td className="py-2 pr-3">{r.http_status ?? "—"}</td>
                  <td className="py-2 pr-3">{r.duration_ms != null ? `${r.duration_ms} ms` : "—"}</td>
                  <td className="py-2 pr-3">
                    <button
                      className="font-mono text-xs text-primary hover:underline inline-flex items-center gap-1"
                      onClick={() => {
                        navigator.clipboard.writeText(r.trace_id);
                        toast.success("Trace ID copiado");
                      }}
                      title={r.trace_id}
                    >
                      {r.trace_id.slice(0, 8)}… <Copy className="h-3 w-3" />
                    </button>
                  </td>
                  <td className="py-2 pr-3 max-w-[420px]">
                    <div className="text-xs whitespace-pre-wrap break-words text-muted-foreground">
                      {r.error_message ?? "—"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: "ok" | "err";
}) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={cn(
          "text-2xl font-black mt-1",
          tone === "ok" && "text-success",
          tone === "err" && "text-destructive",
        )}
      >
        {value}
      </div>
    </Card>
  );
}