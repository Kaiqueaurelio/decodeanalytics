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
import { Beaker, Send, Sparkles, BookOpen, Cpu, Clock, Loader2, Copy, Link2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/ella-sandbox")({
  component: EllaSandboxPage,
});

type SandboxResult = Awaited<ReturnType<typeof ellaSandboxChat>>;

function EllaSandboxPage() {
  const [message, setMessage] = useState("");
  const [scope, setScope] = useState<"admin" | "public">("admin");
  const [result, setResult] = useState<SandboxResult | null>(null);
  const call = useServerFn(ellaSandboxChat);

  const mutation = useMutation({
    mutationFn: async () => call({ data: { message: message.trim(), scope } }),
    onSuccess: (data) => setResult(data),
    onError: (err: any) => toast.error(err?.message ?? "Falha ao consultar a Ella"),
  });

  const submit = () => {
    if (!message.trim() || mutation.isPending) return;
    mutation.mutate();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <header className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-3 text-primary">
          <Beaker className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sandbox da Ella</h1>
          <p className="text-sm text-muted-foreground">
            Teste a Ella com as diretrizes atuais e veja exatamente qual treinamento foi usado
            para responder.
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
              placeholder="Digite sua pergunta aqui para testar a Ella..."
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
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Resposta da Ella</h2>
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
                  <Sparkles className="h-4 w-4" />
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
