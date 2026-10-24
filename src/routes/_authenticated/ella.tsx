import { useState, useRef, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Send,
  Loader2,
  LayoutDashboard,
  Zap,
  Wrench,
  ChevronDown,
  Paperclip,
  Mic,
  Square,
  X,
  FileText,
  FileAudio,
  FileVideo,
  Image as ImageIcon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ellaChat } from "@/lib/api/ella.functions";
import { EllaAvatar } from "@/components/EllaAvatar";

export const Route = createFileRoute("/_authenticated/ella")({
  component: EllaPage,
});

type ToolActivity = { name: string; input: any; output: any };
type Attachment = {
  name: string;
  mimeType: string;
  dataBase64: string;
  size: number;
  previewUrl?: string;
};
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  tools?: ToolActivity[];
  attachments?: { name: string; mimeType: string; previewUrl?: string }[];
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
  create_service: "Criando produto/serviço",
  update_service: "Atualizando produto/serviço",
  delete_service: "Removendo produto/serviço",
  create_inventory_item: "Criando item no estoque",
  update_inventory_quantity: "Atualizando estoque",
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
        <LayoutDashboard className="h-3.5 w-3.5 text-brand-orange" />
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
        "Olá! 👋 Sou a **Ella Ribeiro**, assistente de inteligência artificial da Decode Analytics. Posso apoiar a equipe em ordens de serviço, clientes, cobranças, lembretes e consultas. Você pode falar por **áudio** 🎤 ou anexar **arquivos** 📎 para análise. Sou uma IA; quando algo exigir decisão humana, vou deixar isso claro.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const blobToBase64 = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const idx = result.indexOf(",");
        resolve(idx >= 0 ? result.slice(idx + 1) : result);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    const MAX = 18 * 1024 * 1024;
    for (const f of list) {
      if (f.size > MAX) {
        toast.error(`"${f.name}" passou de 18MB e foi ignorado.`);
        continue;
      }
      try {
        const dataBase64 = await blobToBase64(f);
        const previewUrl = f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined;
        setAttachments((prev) => [
          ...prev,
          {
            name: f.name,
            mimeType: f.type || "application/octet-stream",
            dataBase64,
            size: f.size,
            previewUrl,
          },
        ]);
      } catch {
        toast.error(`Falha ao ler "${f.name}"`);
      }
    }
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => {
      const copy = [...prev];
      const [rem] = copy.splice(idx, 1);
      if (rem?.previewUrl) URL.revokeObjectURL(rem.previewUrl);
      return copy;
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      recordChunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size > 0 && recordChunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const type = rec.mimeType || "audio/webm";
        const blob = new Blob(recordChunksRef.current, { type });
        if (blob.size < 1024) {
          toast.error("Gravação muito curta.");
          return;
        }
        const dataBase64 = await blobToBase64(blob);
        const ext = type.includes("mp4") ? "m4a" : "webm";
        setAttachments((prev) => [
          ...prev,
          {
            name: `gravacao-${Date.now()}.${ext}`,
            mimeType: type,
            dataBase64,
            size: blob.size,
          },
        ]);
        toast.success("Áudio pronto — envie a mensagem para eu ouvir.");
      };
      mediaRecorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch (e) {
      console.error(e);
      toast.error("Não consegui acessar o microfone.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setRecording(false);
  };

  const iconFor = (mt: string) => {
    if (mt.startsWith("image/")) return <ImageIcon className="h-3.5 w-3.5" />;
    if (mt.startsWith("audio/")) return <FileAudio className="h-3.5 w-3.5" />;
    if (mt.startsWith("video/")) return <FileVideo className="h-3.5 w-3.5" />;
    return <FileText className="h-3.5 w-3.5" />;
  };

  const send = async (text: string) => {
    const content = text.trim();
    if (loading) return;
    if (!content && attachments.length === 0) return;
    const currentAtts = attachments;
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: content || "(arquivo enviado)",
      attachments: currentAtts.map((a) => ({
        name: a.name,
        mimeType: a.mimeType,
        previewUrl: a.previewUrl,
      })),
    };
    const history = messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setAttachments([]);
    setLoading(true);
    try {
      const data: any = await chat({
        data: {
          message: content || "Realize a análise técnica dos arquivos anexados.",
          conversationHistory: history,
          attachments: currentAtts.map((a) => ({
            name: a.name,
            mimeType: a.mimeType,
            dataBase64: a.dataBase64,
          })),
        },
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
      toast.error("Não consegui falar com o assistente agora.");
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
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-b pb-3 sm:pb-4">
        <EllaAvatar
          size={48}
          alt="Ella Ribeiro, assistente virtual de inteligência artificial"
          loading="eager"
          ringClassName="ring-2 ring-primary/30"
        />
        <div className="min-w-0">
          <h1 className="truncate text-lg font-black tracking-tight sm:text-xl">Ella Ribeiro</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Assistente de IA da equipe · automações, consultas e apoio operacional
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex items-end gap-2",
              m.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            {m.role === "assistant" && (
              <EllaAvatar size={30} alt="" ringClassName="ring-1 ring-border" />
            )}
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
                <>
                  {m.attachments && m.attachments.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {m.attachments.map((a, i) =>
                        a.previewUrl ? (
                          <img
                            key={i}
                            src={a.previewUrl}
                            alt={a.name}
                            className="h-16 w-16 rounded-md object-cover ring-1 ring-white/40"
                          />
                        ) : (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 text-xs"
                          >
                            {iconFor(a.mimeType)}
                            <span className="max-w-[10rem] truncate">{a.name}</span>
                          </span>
                        ),
                      )}
                    </div>
                  )}
                  {m.content}
                </>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Trabalhando…
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
              <Zap className="h-4 w-4 text-brand-orange shrink-0 mt-0.5" />
              <span className="min-w-0">{s}</span>
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 pt-2 border-t">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((a, i) => (
              <div
                key={i}
                className="group relative flex items-center gap-1.5 rounded-lg border bg-muted/50 px-2 py-1 text-xs"
              >
                {a.previewUrl ? (
                  <img src={a.previewUrl} alt={a.name} className="h-8 w-8 rounded object-cover" />
                ) : (
                  iconFor(a.mimeType)
                )}
                <span className="max-w-[10rem] truncate">{a.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="ml-1 rounded-full p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
                  aria-label="Remover"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,audio/*,video/*,application/pdf,.pdf,.mp3,.mp4,.wav,.webm,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            disabled={loading}
            onClick={() => fileInputRef.current?.click()}
            className="h-11 w-11 shrink-0"
            aria-label="Anexar arquivo"
            title="Anexar arquivo"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant={recording ? "destructive" : "outline"}
            disabled={loading}
            onClick={recording ? stopRecording : startRecording}
            className="h-11 w-11 shrink-0"
            aria-label={recording ? "Parar gravação" : "Gravar áudio"}
            title={recording ? "Parar gravação" : "Gravar áudio"}
          >
            {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Textarea
            ref={inputRef}
            aria-label="Mensagem para Ella Ribeiro"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder={
              recording
                ? "Gravando… toque no quadrado para parar."
                : "Fale, escreva ou anexe arquivos…"
            }
            rows={1}
            disabled={loading}
            className="min-h-[44px] max-h-40 resize-none"
          />
          <Button
            type="submit"
            size="icon"
            disabled={loading || (!input.trim() && attachments.length === 0)}
            className="h-11 w-11 shrink-0 bg-brand-yellow hover:bg-brand-yellow/90 text-brand-blue"
            aria-label="Enviar mensagem para Ella Ribeiro"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
}
