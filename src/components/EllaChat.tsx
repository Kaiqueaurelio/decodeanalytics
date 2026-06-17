// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { chatWithElla, getEllaHistory } from "@/lib/api/ella.functions";
import { useAuth } from "@/lib/auth";
import { Loader2, Send, Sparkles, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function EllaChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadHistory();
    }
  }, [isOpen]);

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
              "Olá! Sou a Ella Ribeiro. Como posso te ajudar com a gestão da Alcateia's hoje?",
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
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full bg-brand-blue p-0 shadow-2xl transition-all hover:scale-110 hover:bg-brand-blue/90",
          isOpen && "scale-0 opacity-0",
        )}
      >
        <div className="relative">
          <Avatar className="h-12 w-12 border-2 border-brand-yellow shadow-inner">
            <AvatarImage src="/brand/ella-avatar.png" />
            <AvatarFallback>ER</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 rounded-full bg-brand-yellow p-1 text-brand-blue shadow-sm">
            <Sparkles className="h-3 w-3" />
          </div>
        </div>
      </Button>

      <Card
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-[600px] w-[380px] flex-col overflow-hidden border-border/50 bg-white/95 shadow-2xl backdrop-blur-sm transition-all duration-300 sm:w-[420px]",
          !isOpen && "pointer-events-none translate-y-10 scale-95 opacity-0",
        )}
      >
        <div className="flex items-center justify-between bg-brand-blue px-4 py-3 text-white">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border-2 border-brand-yellow/50">
              <AvatarImage src="/brand/ella-avatar.png" />
              <AvatarFallback>ER</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-bold leading-none">Ella Ribeiro</p>
              <p className="text-[10px] font-medium text-brand-yellow">
                Assistente Virtual • Online
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4" viewportRef={scrollRef}>
          {isInitialLoading && isOpen ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand-yellow" />
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex max-w-[90%] flex-col gap-1",
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
          <div className="flex flex-wrap gap-2">
            {QUICK_COMMANDS.map((cmd, i) => (
              <button
                key={i}
                onClick={() => handleSend(cmd)}
                className="flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-brand-yellow hover:text-brand-blue"
              >
                <Zap className="h-3 w-3 text-brand-yellow" />
                {cmd}
              </button>
            ))}
          </div>

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
    </>
  );
}
