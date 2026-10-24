import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ellaSandboxChat } from "@/lib/api/ella-sandbox.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Beaker, Send, Zap, BookOpen, Cpu, Clock, Loader2, Copy, Link2, AlertTriangle, ListChecks, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { EllaAvatar } from "@/components/EllaAvatar";

export const Route = createFileRoute("/_authenticated/ella-sandbox")({
  component: EllaSandboxPage,
});

type SandboxResult = Awaited<ReturnType<typeof ellaSandboxChat>>;

type FailureCtx = {
  run_id?: string;
  message: string;
  error_type?: string;
  stack_trace?: string | null;
  steps?: Array<{ name: string; status: "ok" | "error"; at_ms: number; duration_ms?: number; detail?: any; error?: string }>;
};

function EllaSandboxPage() {
  const [message, setMessage] = useState("");
  const [scope, setScope] = useState<"admin" | "public">("admin");
  const [result, setResult] = useState<SandboxResult | null>(null);
  const [failure, setFailure] = useState<FailureCtx | null>(null);
  const call = useServerFn(ellaSandboxChat);

  const mutation = useMutation({
    mutationFn: async () => call({ data: { message: message.trim(), scope } }),
    onSuccess: (data) => { setResult(data); setFailure(null); },
    onError: (err: any) => {
      const rawMessage = String(err?.message ?? "");
      const isAuthError = /unauthorized|invalid token|invalid api key|api key not valid/i.test(rawMessage);
      const safeMessage = isAuthError
        ? "A autenticação da sessão ou a credencial do serviço de IA foi recusada. Entre novamente no aplicativo; se persistir, o administrador deve conferir GEMINI_API_KEY nas variáveis de ambiente do servidor."
        : rawMessage && !/deserialize|stack trace|\.js:\d+:\d+/i.test(rawMessage)
          ? rawMessage
          : "Não foi possível concluir o teste da Ella. Atualize a página e tente novamente.";
      toast.error(safeMessage);
      setResult(null);
      setFailure({
        run_id: err?.run_id,
        message: safeMessage,
        error_type: isAuthError ? "auth" : err?.error_type,
        // Do not render raw server stack traces in the user-facing UI.
        stack_trace: null,
        steps: err?.steps,
      });
    },
  });

  const submit = () => {
    if (!message.trim() || mutation.isPending) return;
    mutation.mutate();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <header className="flex items-start gap-3">
        <EllaAvatar
          size={48}
          alt="Ella Ribeiro, assistente virtual de inteligência artificial"
          ringClassName="ring-2 ring-primary/30"
        />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Testar Ella Ribeiro</h1>
          <p className="text-sm text-muted-foreground">
            Teste as respostas da assistente de IA com os treinamentos atuais antes de disponibilizá-los.
          </p>
        </div>
      </header>

      <Card className="space-y-4 p-4 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">Pergunta</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua pergunta aqui para testar o sistema..."
              aria-label="Pergunta de teste para Ella Ribeiro"
              rows={4}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
              }}
            />
          </div>
          <div className="space-y-2 md:w-56">
            <label className="text-sm font-medium">Modo</label>
            <Select value={scope} onValueChange={(v) => setScope(v as "admin" | "public")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Interno (admin)</SelectItem>
                <SelectItem value="public">Loja / clientes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Sandbox não executa tools reais — apenas testa resposta + treinamento.
          </span>
          <Button onClick={submit} disabled={mutation.isPending || !message.trim()}>
            {mutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Enviar
          </Button>
        </div>
      </Card>

      {failure && (
        <Card className="space-y-4 border-destructive/40 bg-destructive/5 p-4 md:p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h2 className="text-lg font-semibold text-destructive">Falha no teste</h2>
            {failure.error_type && (
              <Badge variant="destructive" className="ml-auto">{failure.error_type}</Badge>
            )}
          </div>
          <p className="text-sm text-destructive">{failure.message}</p>
          {failure.run_id && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(failure.run_id!); toast.success("ID copiado"); }}>
                <Copy className="mr-2 h-4 w-4" />Copiar ID ({failure.run_id.slice(0, 8)}…)
              </Button>
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/sandbox-run/${failure.run_id}`); toast.success("Link copiado"); }}>
                <Link2 className="mr-2 h-4 w-4" />Copiar link
              </Button>
              <Button size="sm" variant="ghost" asChild>
                <Link to="/sandbox-run/$id" params={{ id: failure.run_id }}>Abrir evidência</Link>
              </Button>
            </div>
          )}
          <Accordion type="multiple" defaultValue={["steps", "stack"]}>
            {failure.steps && failure.steps.length > 0 && (
              <AccordionItem value="steps">
                <AccordionTrigger>
                  <span className="flex items-center gap-2"><ListChecks className="h-4 w-4" />Passos executados ({failure.steps.length})</span>
                </AccordionTrigger>
                <AccordionContent>
                  <ol className="space-y-2 text-sm">
                    {failure.steps.map((s, i) => (
                      <li key={i} className="rounded border p-2">
                        <div className="flex items-center gap-2">
                          {s.status === "ok" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-destructive" />}
                          <span className="font-mono text-xs">{s.name}</span>
                          <span className="ml-auto text-[11px] text-muted-foreground">+{s.at_ms}ms{typeof s.duration_ms === "number" ? ` · ${s.duration_ms}ms` : ""}</span>
                        </div>
                        {s.error && <div className="mt-1 text-xs text-destructive">{s.error}</div>}
                        {s.detail && (
                          <pre className="mt-1 overflow-auto rounded bg-muted/50 p-2 text-[11px]">{JSON.stringify(s.detail, null, 2)}</pre>
                        )}
                      </li>
                    ))}
                  </ol>
                </AccordionContent>
              </AccordionItem>
            )}
            {failure.stack_trace && (
              <AccordionItem value="stack">
                <AccordionTrigger>Stack trace</AccordionTrigger>
                <AccordionContent>
                  <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-xs">{failure.stack_trace}</pre>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </Card>
      )}

      {result && (
        <Card className="space-y-4 p-4 md:p-6">
          {result.run_id && (
            <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">ID do teste (compartilhável)</div>
                <div className="truncate font-mono text-sm">{result.run_id}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(result.run_id!);
                    toast.success("ID copiado");
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />Copiar ID
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const url = `${window.location.origin}/sandbox-run/${result.run_id}`;
                    navigator.clipboard.writeText(url);
                    toast.success("Link copiado");
                  }}
                >
                  <Link2 className="mr-2 h-4 w-4" />Copiar link
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <Link to="/sandbox-run/$id" params={{ id: result.run_id }}>
                    Abrir evidência
                  </Link>
                </Button>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Resposta do sistema</h2>
            <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> {result.duration_ms} ms
            </span>
          </div>
          <div className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">
            {result.answer}
          </div>

          <div className="flex flex-wrap gap-2 pt-2 text-xs">
            <Badge variant="secondary" className="gap-1">
              <Cpu className="h-3 w-3" /> {result.model}
            </Badge>
            <Badge variant="outline">{result.provider}</Badge>
            <Badge variant="outline">Modo: {result.scope}</Badge>
            <Badge variant="outline">temperature: {result.temperature}</Badge>
            <Badge variant="outline">trace: {result.trace_id.slice(0, 8)}…</Badge>
          </div>

          <Accordion type="multiple" className="pt-2">
            {result.steps && result.steps.length > 0 && (
              <AccordionItem value="steps">
                <AccordionTrigger>
                  <span className="flex items-center gap-2"><ListChecks className="h-4 w-4" />Passos executados ({result.steps.length})</span>
                </AccordionTrigger>
                <AccordionContent>
                  <ol className="space-y-2 text-sm">
                    {result.steps.map((s: any, i: number) => (
                      <li key={i} className="rounded border p-2">
                        <div className="flex items-center gap-2">
                          {s.status === "ok" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-destructive" />}
                          <span className="font-mono text-xs">{s.name}</span>
                          <span className="ml-auto text-[11px] text-muted-foreground">+{s.at_ms}ms{typeof s.duration_ms === "number" ? ` · ${s.duration_ms}ms` : ""}</span>
                        </div>
                        {s.detail && (
                          <pre className="mt-1 overflow-auto rounded bg-muted/50 p-2 text-[11px]">{JSON.stringify(s.detail, null, 2)}</pre>
                        )}
                      </li>
                    ))}
                  </ol>
                </AccordionContent>
              </AccordionItem>
            )}
            <AccordionItem value="inputs">
              <AccordionTrigger>Inputs do teste</AccordionTrigger>
              <AccordionContent>
                <pre className="max-h-[280px] overflow-auto rounded-lg border bg-muted/30 p-3 text-xs">{JSON.stringify(result.inputs, null, 2)}</pre>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="kb">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Treinamento utilizado
                  <Badge variant="secondary">
                    {result.knowledgeUsed.length} / {result.knowledgeTotal}
                  </Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                {result.knowledgeUsed.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum aprendizado da base foi recuperado para esta pergunta.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {result.knowledgeUsed.map((k, i) => (
                      <li key={k.id} className="rounded-lg border p-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <span className="text-muted-foreground">#{i + 1}</span>
                          <span>{k.title}</span>
                          <Badge variant="outline" className="ml-auto">
                            score {k.score}
                          </Badge>
                          <Badge variant="secondary">{k.scope}</Badge>
                        </div>
                        {k.matched.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-muted-foreground">
                            palavras-chave:
                            {k.matched.map((m) => (
                              <span
                                key={m}
                                className="rounded bg-primary/10 px-1.5 py-0.5 text-primary"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                          {k.content}
                        </p>
                        {k.tags && k.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {k.tags.map((t) => (
                              <Badge key={t} variant="outline" className="text-[10px]">
                                {t}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="guidelines">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Diretrizes aplicadas ({result.basePromptName})
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed">
                  {result.systemPrompt}
                </pre>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="params">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  Parâmetros de geração
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <dl className="grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
                  <div>
                    <dt className="text-xs text-muted-foreground">Modelo</dt>
                    <dd>{result.model}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Provedor</dt>
                    <dd>{result.provider}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Temperatura</dt>
                    <dd>{result.temperature}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Escopo</dt>
                    <dd>{result.scope}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Duração</dt>
                    <dd>{result.duration_ms} ms</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Trace ID</dt>
                    <dd className="break-all font-mono text-xs">{result.trace_id}</dd>
                  </div>
                </dl>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      )}
    </div>
  );
}
