// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { chatWithElla, getEllaHistory } from "@/lib/api/ella.functions";
import { useAuth } from "@/lib/auth";
import { Loader2, Send, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/ella")({ component: EllaPage });

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_COMMANDS = [
  "Listar serviços",
  "Mudar preço do Banner para 50",
  "Adicionar serviço: Cartão de Visita, Papelaria, 100",
  "Como estão os orçamentos hoje?",
];

function EllaPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isLoading]);

  async function loadHistory() {
    try {
      const history = await getEllaHistory();
      if (history && history.length > 0) {
        setMessages(history.map((h) => ({ role: h.role as any, content: h.content })));
      } else {
        setMessages([
          {
            role: "assistant",
            content:
              "Olá! Sou a Ella Ribeiro, sua assistente virtual. Como posso te ajudar com a gestão da Alcateia's hoje?",
          },
        ]);
      }
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      setMessages([
        { role: "assistant", content: "Olá! Sou a Ella Ribeiro. Como posso te ajudar hoje?" },
      ]);
    } finally {
      setIsInitialLoading(false);
    }
  }

  async function handleSend(text?: string) {
    const messageToSend = text || input;
    if (!messageToSend.trim() || isLoading || !user) return;

    const userMessage = messageToSend.trim();
    if (!text) setInput("");

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const result = await chatWithElla({
        data: {
          message: userMessage,
          userId: user.id,
        },
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.message || "Ação executada com sucesso." },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Desculpe, tive um problema ao processar sua solicitação. Pode tentar novamente?",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-5 pb-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-blue to-brand-blue/80 px-5 py-6 text-white shadow-xl md:px-7">
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-brand-yellow/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-36 w-64 rounded-full bg-brand-yellow/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-brand-yellow">
              <Sparkles className="h-4 w-4" />
              Assistente Virtual
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Ella Ribeiro</h1>
            <p className="mt-1 max-w-2xl text-sm text-white/65">
              Sua assistente inteligente para gerenciar serviços, orçamentos e operações da
              Alcateia's. Peça qualquer coisa e deixe a Ella trabalhar para você.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
            <Avatar className="h-12 w-12 border-2 border-brand-yellow/50">
              <AvatarImage src="/brand/ella-avatar.png" />
              <AvatarFallback>ER</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-bold leading-none">Ella Ribeiro</p>
              <p className="text-[10px] font-medium text-brand-yellow">
                Online • Pronta para ajudar
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="flex flex-col overflow-hidden border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">Chat com a Ella</h2>
              <p className="text-xs text-muted-foreground">
                Converse com sua assistente virtual para gerenciar a operação
              </p>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4" viewportRef={scrollRef}>
            {isInitialLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-brand-yellow" />
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex max-w-[85%] flex-col gap-1",
                      msg.role === "user" ? "ml-auto items-end" : "items-start",
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                        msg.role === "user"
                          ? "bg-brand-blue text-white rounded-tr-none"
                          : "bg-muted text-foreground rounded-tl-none",
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-brand-yellow" />
                    <span className="text-xs font-medium">Ella está processando...</span>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <div className="border-t bg-muted/20 p-4 space-y-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Peça algo para a Ella..."
                className="h-11 rounded-xl bg-white shadow-sm focus-visible:ring-brand-yellow"
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="h-11 w-11 shrink-0 rounded-xl bg-brand-yellow p-0 text-brand-blue shadow-md hover:bg-brand-yellow/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="overflow-hidden border-slate-200/80 shadow-sm">
            <div className="border-b px-5 py-4">
              <h3 className="font-semibold text-slate-900">Comandos rápidos</h3>
              <p className="text-xs text-muted-foreground">Clique para executar</p>
            </div>
            <div className="flex flex-col gap-2 p-4">
              {QUICK_COMMANDS.map((cmd, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(cmd)}
                  disabled={isLoading}
                  className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-brand-yellow hover:bg-brand-yellow/5 hover:text-brand-blue disabled:opacity-50"
                >
                  <Zap className="h-3 w-3 text-brand-yellow" />
                  <span className="text-left">{cmd}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden border-slate-200/80 shadow-sm">
            <div className="border-b px-5 py-4">
              <h3 className="font-semibold text-slate-900">Sobre a Ella</h3>
            </div>
            <div className="space-y-3 p-4 text-xs text-muted-foreground">
              <p>A Ella é sua assistente inteligente para gerenciar a Alcateia's. Ela pode:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Listar e gerenciar serviços</li>
                <li>Atualizar preços de produtos</li>
                <li>Adicionar novos serviços</li>
                <li>Responder sobre a operação</li>
              </ul>
              <p className="pt-2 text-[10px] text-muted-foreground/70">
                Dica: Use linguagem natural e seja específico em suas solicitações para melhores
                resultados.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
