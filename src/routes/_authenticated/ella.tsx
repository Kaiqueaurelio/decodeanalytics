import { useState, useRef, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ellaChat } from "@/lib/api/ella.functions";

export const Route = createFileRoute("/_authenticated/ella")({
  component: EllaPage,
});

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Crie um orçamento para o cliente João de 500 cartões de visita",
  "Atualize o preço do banner para R$ 80",
  "Quais pedidos estão em produção?",
  "Resumo de vendas da semana",
];

function EllaPage() {
  const chat = useServerFn(ellaChat);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Olá! Sou a Ella Ribeiro, sua assistente operacional da Alcateia. Posso ajudar com orçamentos, produtos, ordens de serviço e cobranças. O que vamos fazer hoje?",
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
      const data = await chat({ data: { message: content, conversationHistory: history } });
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", content: data.response },
      ]);
    } catch (err) {
      console.error(err);
      toast.error("Não consegui falar com a Ella agora. Tente novamente.");
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
            Assistente operacional da Alcateia
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
                "max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words",
                m.role === "user"
                  ? "bg-brand-blue text-white rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm",
              )}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Ella está pensando…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {messages.length <= 1 && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-3">
          {SUGGESTIONS.map((s) => (
            <Card
              key={s}
              onClick={() => send(s)}
              className="cursor-pointer p-3 text-sm hover:bg-muted transition-colors flex items-start gap-2"
            >
              <Sparkles className="h-4 w-4 text-brand-orange shrink-0 mt-0.5" />
              <span className="min-w-0">{s}</span>
            </Card>
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
          placeholder="Pergunte algo para a Ella…"
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