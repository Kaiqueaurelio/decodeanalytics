import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getArtProof, respondArtProof } from "@/lib/api/art-proofs.functions";

export const Route = createFileRoute("/arte/$token")({
  ssr: false,
  component: ArtProofPage,
  head: () => ({
    meta: [
      { title: "Aprovação de arte — Alcateia's Produções Gráficas" },
      {
        name: "description",
        content: "Visualize a arte enviada pela Alcateia's e aprove ou peça ajustes.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

type Proof = Awaited<ReturnType<typeof getArtProof>>;

function ArtProofPage() {
  const { token } = Route.useParams();
  const load = useServerFn(getArtProof);
  const respond = useServerFn(respondArtProof);

  const [proof, setProof] = useState<Proof | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let alive = true;
    load({ data: { token } })
      .then((r) => alive && setProof(r))
      .catch(() => alive && setProof({ found: false } as Proof))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [load, token]);

  // Proteção best-effort: esconde a arte quando a aba perde foco (print/captura)
  // e bloqueia menu de contexto, arraste e PrintScreen.
  useEffect(() => {
    const onVisibility = () => setHidden(document.visibilityState !== "visible");
    const onBlur = () => setHidden(true);
    const onFocus = () => setHidden(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || ((e.ctrlKey || e.metaKey) && ["p", "s"].includes(e.key.toLowerCase()))) {
        e.preventDefault();
        setHidden(true);
        setTimeout(() => setHidden(false), 1200);
        toast.info("A arte é protegida contra cópia e captura.");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const watermark = useMemo(() => {
    if (!proof?.found) return "";
    const who = proof.clientName || "Cliente";
    return `${who} • Alcateia's • ${new Date().toLocaleDateString("pt-BR")}`;
  }, [proof]);

  const send = useCallback(
    async (approved: boolean) => {
      if (sending) return;
      if (!approved && !feedback.trim()) {
        toast.error("Conte rapidinho o que precisa ajustar.");
        return;
      }
      setSending(true);
      try {
        const res = await respond({ data: { token, approved, feedback: feedback.trim() } });
        if (!res.ok) {
          toast.error(res.message);
        } else {
          toast.success(approved ? "Arte aprovada. Obrigado!" : "Pedido de ajuste enviado.");
          setProof((p) =>
            p && p.found
              ? { ...p, status: res.status, feedback: feedback.trim() || null, respondedAt: new Date().toISOString() }
              : p,
          );
        }
      } catch {
        toast.error("Não consegui enviar sua resposta agora.");
      } finally {
        setSending(false);
      }
    },
    [feedback, respond, sending, token],
  );

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!proof?.found) {
    return (
      <div className="grid min-h-dvh place-items-center px-4">
        <Card className="max-w-md p-6 text-center">
          <h1 className="text-lg font-bold">Link indisponível</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Este link de aprovação não existe ou foi removido. Fale com a nossa equipe.
          </p>
        </Card>
      </div>
    );
  }

  const decided = proof.status !== "pendente";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-4 px-4 py-6">
      <header className="space-y-1">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-2xs font-bold uppercase tracking-widest text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" /> Arte protegida
        </span>
        <h1 className="text-xl font-black tracking-tight sm:text-2xl">{proof.title}</h1>
        {proof.note && <p className="text-sm text-muted-foreground">{proof.note}</p>}
      </header>

      <Card className="art-shield relative overflow-hidden p-2">
        {proof.url ? (
          <img
            src={proof.url}
            alt={proof.title}
            loading="lazy"
            decoding="async"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            className="w-full rounded-lg select-none"
            style={{ filter: hidden ? "blur(28px)" : undefined, transition: "filter 150ms ease" }}
          />
        ) : (
          <p className="p-6 text-center text-sm text-muted-foreground">Arte indisponível.</p>
        )}

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex flex-wrap content-center justify-center gap-8 overflow-hidden opacity-[0.16]"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="-rotate-[24deg] whitespace-nowrap text-xs font-bold uppercase tracking-widest"
            >
              {watermark}
            </span>
          ))}
        </div>

        {hidden && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-background/70 text-center text-sm font-semibold">
            Visualização pausada para proteger a arte
          </div>
        )}
      </Card>

      {decided ? (
        <Card className="p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            {proof.status === "aprovado" ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-success" /> Arte aprovada. Já seguimos para a produção.
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-destructive" /> Ajustes solicitados. Nossa equipe já foi avisada.
              </>
            )}
          </p>
          {proof.feedback && (
            <p className="mt-2 text-sm text-muted-foreground">“{proof.feedback}”</p>
          )}
        </Card>
      ) : (
        <Card className="space-y-3 p-4">
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Quer algum ajuste? Descreva aqui (opcional se for aprovar)."
            rows={3}
            maxLength={1000}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <Button onClick={() => send(true)} disabled={sending} className="h-11">
              <CheckCircle2 className="mr-2 h-4 w-4" /> Aprovar arte
            </Button>
            <Button
              variant="outline"
              onClick={() => send(false)}
              disabled={sending}
              className="h-11"
            >
              <XCircle className="mr-2 h-4 w-4" /> Pedir ajuste
            </Button>
          </div>
          <p className="text-2xs text-muted-foreground">
            Esta arte é de uso exclusivo para aprovação. Download, cópia e captura não são autorizados.
          </p>
        </Card>
      )}
    </div>
  );
}