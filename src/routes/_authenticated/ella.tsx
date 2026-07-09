import { useState, useRef, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Send, Loader2, Sparkles, Wrench, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ellaChat } from "@/lib/api/ella.functions";

export const Route = createFileRoute("/_authenticated/ella")({
  component: EllaPage,
});

type ToolActivity = { name: string; input: any; output: any };
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  tools?: ToolActivity[];
}

const SUGGESTIONS = [
  "Panorama do dia: OS ativas, cobranças pendentes e faturamento do mês",
  "Crie uma OS para Flavia — 100 cartões de visita a R$ 0,50, prazo em 5 dias",
  "Gere uma cobrança de R$ 250 para o cliente Flavia com vencimento em 7 dias",
  "Me lembra amanhã às 10h de ligar para o cliente Silva sobre a OS #1004",
  "Liste as OS em produção",
  "Quais cobranças estão pendentes?",
];

const TOOL_LABELS: Record<string, string> = {
  list_clients: "Buscando clientes",
  create_client: "Criando cliente",
  list_services: "Consultando catálogo",
  update_service_price: "Atualizando preço",
  list_orders: "Listando OS",
  get_order: "Buscando OS",
  create_order: "Criando OS",
  update_order_status: "Atualizando status da OS",
  create_receivable: "Gerando cobrança",
  list_receivables: "Listando cobranças",
  mark_receivable_paid: "Baixando cobrança",
  create_reminder: "Salvando lembrete",
  list_reminders: "Listando lembretes",
  complete_reminder: "Concluindo lembrete",
  dashboard_summary: "Compilando panorama",
};

function ToolChip({ t }: { t: ToolActivity }) {
  const [open, setOpen] = useState(false);
  const isErr = t.output && typeof t.output === "object" && (t.output as any).error;
  return (
    <div
      className={cn(
        "rounded-lg border text-xs",
        isErr ? "border-red-300 bg-red-50" : "border-border bg-background/60",
      )}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-2 py-1.5 text-left"
      >
        <Wrench className="h-3.5 w-3.5 text-brand-orange" />
        <span className="font-medium">{TOOL_LABELS[t.name] ?? t.name}</span>
        <ChevronDown
          className={cn("ml-auto h-3.5 w-3.5 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <pre className="max-h-52 overflow-auto border-t bg-muted/50 px-2 py-1.5 text-[11px] leading-snug">
{JSON.stringify({ input: t.input, output: t.output }, null, 2)}
        </pre>
      )}
    </div>
  );
}

function EllaPage() {
  const chat = useServerFn(ellaChat);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Olá! Sou a **Ella Ribeiro** 👋 — sua assistente operacional. Eu **executo** de verdade: crio OS, gero cobranças, atualizo status, cadastro clientes e guardo seus lembretes. É só me dizer o que precisa.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content };
    const history = messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const data: any = await chat({
        data: { message: content, conversationHistory: history },
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.response,
          tools: data.toolActivity,
        },
      ]);
    } catch (err) {
      console.error(err);
      toast.error("Não consegui falar com a Ella agora.");
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] sm:h-[calc(100dvh-5rem)] max-w-3xl mx-auto w-full px-3 sm:px-6 py-3 sm:py-6">
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 pb-3 sm:pb-4 border-b">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-yellow to-brand-orange text-brand-blue font-black">
          E
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg sm:text-xl font-black tracking-tight">Ella Ribeiro</h1>
          <p className="truncate text-xs sm:text-sm text-muted-foreground">
            Assistente operacional — cria OS, cobranças, lembretes e faz consultas
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[90%] sm:max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                m.role === "user"
                  ? "bg-brand-blue text-white rounded-br-sm whitespace-pre-wrap break-words"
                  : "bg-muted text-foreground rounded-bl-sm",
              )}
            >
              {m.role === "assistant" ? (
                <>
                  <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-headings:mt-2 prose-headings:mb-1 prose-table:my-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                  </div>
                  {m.tools && m.tools.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {m.tools.map((t, i) => (
                        <ToolChip key={i} t={t} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Ella está trabalhando…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {messages.length <= 1 && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-xl border p-3 text-left text-sm hover:bg-muted transition-colors flex items-start gap-2"
            >
              <Sparkles className="h-4 w-4 text-brand-orange shrink-0 mt-0.5" />
              <span className="min-w-0">{s}</span>
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 pt-2 border-t"
      >
        <Textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="Peça pra Ella criar OS, cobrança, lembrete, listar pedidos…"
          rows={1}
          disabled={loading}
          className="min-h-[44px] max-h-40 resize-none"
        />
        <Button
          type="submit"
          size="icon"
          disabled={loading || !input.trim()}
          className="h-11 w-11 shrink-0 bg-brand-yellow hover:bg-brand-yellow/90 text-brand-blue"
          aria-label="Enviar"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
