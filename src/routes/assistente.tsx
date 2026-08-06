import { useState, useRef, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Send, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ellaPublicChat } from "@/lib/api/ella-public.functions";
import { StoreShell } from "@/components/storefront/StoreShell";
import { Bot } from "lucide-react";

export const Route = createFileRoute("/assistente")({
  component: AssistantePage,
  head: () => ({
    meta: [
      { title: "Assistente virtual — Alcateia's Produções Gráficas" },
      {
        name: "description",
        content:
          "Fale com nosso assistente virtual: ele te ajuda a escolher o produto gráfico ideal (cartão, banner, adesivo, brindes e mais).",
      },
      { property: "og:title", content: "Assistente virtual — Alcateia's Produções Gráficas" },
      {
        property: "og:description",
        content: "Tire dúvidas sobre impressos, acabamentos, prazos e orçamentos com nosso assistente virtual.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Quero cartão de visita com acabamento premium",
  "Preciso de banner grande para evento — o que recomenda?",
  "Quais adesivos vocês fazem?",
  "Faço uniformes personalizados com vocês?",
];

function AssistantePage() {
  const chat = useServerFn(ellaPublicChat);
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Oi! 👋 Sou o assistente virtual da Alcateia's. Me conta o que você precisa imprimir e eu te ajudo a escolher a melhor opção — papel, acabamento, quantidade e prazo. 🎨",
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
    const history = messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));
    setMessages((p) => [...p, { id: `u-${Date.now()}`, role: "user", content }]);
    setInput("");
    setLoading(true);
    try {
      const data: any = await chat({ data: { message: content, conversationHistory: history } });
      setMessages((p) => [
        ...p,
        { id: `a-${Date.now()}`, role: "assistant", content: data.response },
      ]);
    } catch (err) {
      console.error(err);
      toast.error("Não consegui falar com a Ella agora.");
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <StoreShell>
      <div className="mx-auto flex max-w-3xl flex-col px-3 sm:px-6 py-6 min-h-[70vh]">
        <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 pb-4 border-b border-[var(--store-border)]">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--store-primary)] text-white ring-2 ring-[var(--store-secondary)]">
            <Bot className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-black tracking-tight text-[var(--store-primary)]">
              Assistente virtual
            </h1>
            <p className="truncate text-sm text-[var(--store-text-muted)]">
              Alcateia's Produções Gráficas — te ajuda a escolher o produto ideal
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
                    ? "bg-[var(--store-primary)] text-white rounded-br-sm whitespace-pre-wrap break-words"
                    : "bg-[var(--store-surface-soft)] text-[var(--store-text)] rounded-bl-sm",
                )}
              >
                {m.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[var(--store-surface-soft)] rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-2 text-sm text-[var(--store-text-muted)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Pensando…
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
                className="rounded-xl border border-[var(--store-border)] bg-white p-3 text-left text-sm hover:bg-[var(--store-surface-soft)] transition-colors flex items-start gap-2"
              >
                <Sparkles className="h-4 w-4 text-[var(--store-primary)] shrink-0 mt-0.5" />
                <span className="min-w-0">{s}</span>
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 pt-2 border-t border-[var(--store-border)]"
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
            placeholder="Ex.: quero 500 cartões de visita coloridos..."
            rows={1}
            disabled={loading}
            className="min-h-[44px] max-h-40 resize-none"
          />
          <Button
            type="submit"
            size="icon"
            disabled={loading || !input.trim()}
            className="h-11 w-11 shrink-0 bg-[var(--store-primary)] hover:bg-[var(--store-primary-light)] text-white"
            aria-label="Enviar"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </StoreShell>
  );
}