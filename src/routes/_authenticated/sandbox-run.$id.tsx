import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowLeft, BookOpen, Clock, Copy, Cpu, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/sandbox-run/$id")({
  component: SandboxRunDetail,
});

type KnowledgeUsed = {
  id: string;
  title: string;
  content: string;
  scope: string;
  tags?: string[];
  score: number;
  matched: string[];
};

function SandboxRunDetail() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["ella_sandbox_run", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ella_sandbox_runs" as any)
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const copyLink = () => {
    const url = `${window.location.origin}/sandbox-run/${id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado");
  };
  const copyId = () => {
    navigator.clipboard.writeText(id);
    toast.success("ID copiado");
  };

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando teste…</div>;
  }
  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl p-6 space-y-3">
        <p className="text-sm text-muted-foreground">Teste não encontrado.</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/ella-sandbox"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Link>
        </Button>
      </div>
    );
  }

  const knowledgeUsed = (data.knowledge_used ?? []) as KnowledgeUsed[];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/ella-sandbox"><ArrowLeft className="mr-2 h-4 w-4" />Sandbox</Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Evidência de teste</h1>
            <p className="text-xs text-muted-foreground">
              {new Date(data.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={copyId}>
            <Copy className="mr-2 h-4 w-4" />Copiar ID
          </Button>
          <Button size="sm" onClick={copyLink}>
            <Copy className="mr-2 h-4 w-4" />Copiar link
          </Button>
        </div>
      </div>

      <Card className="p-4 md:p-6 space-y-2">
        <div className="text-xs text-muted-foreground">ID do teste</div>
        <div className="font-mono text-sm break-all">{data.id}</div>
      </Card>

      <Card className="p-4 md:p-6 space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Pergunta</h2>
        <p className="whitespace-pre-wrap text-sm">{data.question}</p>
      </Card>

      <Card className="p-4 md:p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Resposta da Ella</h2>
          <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" /> {data.duration_ms} ms
          </span>
        </div>
        <div className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">
          {data.answer}
        </div>
        <div className="flex flex-wrap gap-2 pt-2 text-xs">
          <Badge variant="secondary" className="gap-1"><Cpu className="h-3 w-3" />{data.model}</Badge>
          <Badge variant="outline">{data.provider}</Badge>
          <Badge variant="outline">Modo: {data.scope}</Badge>
          {data.temperature != null && (
            <Badge variant="outline">temperature: {data.temperature}</Badge>
          )}
          {data.trace_id && (
            <Badge variant="outline">trace: {String(data.trace_id).slice(0, 8)}…</Badge>
          )}
        </div>
      </Card>

      <Card className="p-4 md:p-6">
        <Accordion type="multiple" defaultValue={["kb"]}>
          <AccordionItem value="kb">
            <AccordionTrigger>
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Treinamento utilizado
                <Badge variant="secondary">
                  {knowledgeUsed.length} / {data.knowledge_total}
                </Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              {knowledgeUsed.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum aprendizado recuperado.</p>
              ) : (
                <ul className="space-y-3">
                  {knowledgeUsed.map((k, i) => (
                    <li key={k.id ?? i} className="rounded-lg border p-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <span className="text-muted-foreground">#{i + 1}</span>
                        <span>{k.title}</span>
                        <Badge variant="outline" className="ml-auto">score {k.score}</Badge>
                        <Badge variant="secondary">{k.scope}</Badge>
                      </div>
                      {k.matched?.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-muted-foreground">
                          palavras-chave:
                          {k.matched.map((m) => (
                            <span key={m} className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">
                              {m}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{k.content}</p>
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
                Diretrizes aplicadas ({data.base_prompt_name})
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed">
                {data.system_prompt}
              </pre>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    </div>
  );
}
