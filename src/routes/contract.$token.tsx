import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, FileSignature, LoaderCircle, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  getPublicServiceContract,
  respondToPublicServiceContract,
} from "@/lib/api/contracts.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contract/$token")({ component: ContractApprovalPage });

function ContractApprovalPage() {
  const { token } = Route.useParams();
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [response, setResponse] = useState<"aprovado" | "recusado" | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-service-contract", token],
    queryFn: () => getPublicServiceContract({ data: { token } }),
    retry: false,
    staleTime: 0,
  });
  async function respond(decision: "aprovado" | "recusado") {
    if (decision === "aprovado" && (!confirmed || name.trim().length < 2))
      return toast.error("Leia o contrato, marque o aceite e informe seu nome.");
    setSubmitting(true);
    try {
      await respondToPublicServiceContract({ data: { token, decision, name, reason } });
      setResponse(decision);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível registrar sua resposta.",
      );
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-6 flex items-center justify-center gap-3 text-center">
          <img
            src="/brand/decode-logo.png"
            alt="Decode Analytics"
            className="h-12 w-12 rounded-xl object-contain"
          />
          <div className="text-left">
            <p className="text-sm font-bold uppercase tracking-[0.16em]">Decode Analytics</p>
            <p className="text-xs text-muted-foreground">Contrato de prestação de serviço</p>
          </div>
        </header>
        {isLoading ? (
          <Card className="grid min-h-56 place-items-center p-8">
            <div className="text-center">
              <LoaderCircle className="mx-auto h-7 w-7 animate-spin text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">Carregando contrato…</p>
            </div>
          </Card>
        ) : isError || !data ? (
          <Card className="p-8 text-center">
            <XCircle className="mx-auto h-10 w-10 text-destructive" />
            <h1 className="mt-3 text-xl font-bold">Link indisponível</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Este link expirou, já foi respondido ou não é válido. Peça à equipe um novo link.
            </p>
          </Card>
        ) : response ? (
          <Card className="p-8 text-center">
            <BadgeCheck className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-4 text-2xl font-bold">
              {response === "aprovado" ? "Contrato aprovado" : "Resposta registrada"}
            </h1>
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
              {response === "aprovado"
                ? "Sua aprovação foi registrada. A equipe da Decode Analytics dará continuidade ao serviço."
                : "Sua recusa foi registrada. A equipe da Decode Analytics foi informada."}
            </p>
            <Badge className="mt-4" variant="secondary">
              Contrato #{data.number} · versão {data.version}
            </Badge>
          </Card>
        ) : (
          <>
            <Card className="mb-5 p-5 sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                    Para sua análise
                  </p>
                  <h1 className="mt-1 text-2xl font-bold">{data.title}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Contrato #{data.number} · versão {data.version} · preparado para{" "}
                    {data.client_name}
                  </p>
                </div>
                <Badge variant="outline" className="w-fit">
                  {data.service_name}
                </Badge>
              </div>
              <div className="mt-5 rounded-xl border bg-muted/20 p-4 sm:p-6">
                <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7">
                  {data.content}
                </pre>
              </div>
              <div className="mt-4 flex gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p>
                  O contrato inclui compromisso de confidencialidade e de não reutilização do
                  conteúdo criado especificamente para seu projeto sem sua autorização.
                </p>
              </div>
              <p className="mt-3 text-sm">
                <span className="font-semibold">Valor:</span>{" "}
                {Number(data.amount).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
            </Card>
            <Card className="space-y-4 p-5 sm:p-7">
              <h2 className="flex items-center gap-2 font-semibold">
                <FileSignature className="h-4 w-4 text-primary" />
                Sua resposta
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="approval-name">Nome completo</Label>
                  <Input
                    id="approval-name"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Nome de quem está aprovando"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="decline-reason">
                    Comentário (opcional; explique se estiver recusando)
                  </Label>
                  <Textarea
                    id="decline-reason"
                    rows={2}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Comentário para a equipe"
                  />
                </div>
              </div>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(event) => setConfirmed(event.target.checked)}
                  className="mt-1 h-4 w-4 accent-primary"
                />
                <span>
                  Li o contrato acima e concordo com os termos desta versão. Entendo que esta ação
                  registra meu aceite eletrônico no sistema.
                </span>
              </label>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => respond("recusado")} disabled={submitting}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Recusar
                </Button>
                <Button
                  onClick={() => respond("aprovado")}
                  disabled={submitting || !confirmed || name.trim().length < 2}
                >
                  {submitting ? (
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <BadgeCheck className="mr-2 h-4 w-4" />
                  )}
                  Aprovar contrato
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                A resposta fica registrada com o nome informado, data e versão. Para pedir
                alterações, recuse e entre em contato com a equipe.
              </p>
            </Card>
          </>
        )}
      </div>
    </main>
  );
}
