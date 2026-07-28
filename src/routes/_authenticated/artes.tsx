import { useCallback, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, Copy, Image as ImageIcon, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { safeFileName } from "@/lib/briefing";

export const Route = createFileRoute("/_authenticated/artes")({
  component: ArtProofsPage,
});

type Proof = {
  id: string;
  token: string;
  title: string;
  status: "pendente" | "aprovado" | "reprovado";
  client_feedback: string | null;
  responded_at: string | null;
  viewed_at: string | null;
  created_at: string;
  clients: { name: string } | null;
};

const STATUS_META = {
  pendente: { label: "Aguardando cliente", icon: Clock, variant: "secondary" as const },
  aprovado: { label: "Aprovada", icon: CheckCircle2, variant: "success" as const },
  reprovado: { label: "Ajustes pedidos", icon: XCircle, variant: "destructive" as const },
};

function ArtProofsPage() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [clientId, setClientId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);

  const { data: clients } = useQuery({
    queryKey: ["clients-min"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id,name").order("name").limit(500);
      return data ?? [];
    },
  });

  const { data: proofs, isLoading } = useQuery({
    queryKey: ["art-proofs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("art_proofs")
        .select("id,token,title,status,client_feedback,responded_at,viewed_at,created_at,clients(name)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as Proof[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Selecione a imagem da arte.");
      if (!title.trim()) throw new Error("Dê um título para a arte.");
      if (!file.type.startsWith("image/")) throw new Error("Envie a arte como imagem (PNG, JPG ou WEBP).");
      if (file.size > 15 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 15 MB.");

      const path = `artes/${crypto.randomUUID()}-${safeFileName(file.name)}`;
      const up = await supabase.storage.from("arquivos").upload(path, file, { upsert: false });
      if (up.error) throw up.error;

      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("art_proofs")
        .insert({
          title: title.trim(),
          note: note.trim() || null,
          client_id: clientId || null,
          storage_path: path,
          mime_type: file.type,
          created_by: user.user?.id ?? null,
        })
        .select("token")
        .single();
      if (error) throw error;
      return data.token as string;
    },
    onSuccess: (token) => {
      setTitle("");
      setNote("");
      setFile(null);
      qc.invalidateQueries({ queryKey: ["art-proofs"] });
      navigator.clipboard?.writeText(`${window.location.origin}/arte/${token}`).catch(() => {});
      toast.success("Arte enviada. Link copiado para você mandar ao cliente.");
    },
    onError: (e: any) => toast.error(e?.message ?? "Não consegui enviar a arte."),
  });

  const copyLink = useCallback((token: string) => {
    const link = `${window.location.origin}/arte/${token}`;
    navigator.clipboard?.writeText(link);
    toast.success("Link copiado.");
  }, []);

  const pending = useMemo(
    () => (proofs ?? []).filter((p) => p.status === "pendente").length,
    [proofs],
  );

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-black tracking-tight md:text-3xl">Aprovação de Artes</h1>
        <p className="text-sm text-muted-foreground">
          Envie a arte por link protegido e acompanhe a aprovação do cliente. {pending} aguardando resposta.
        </p>
      </header>

      <Card className="grid gap-4 p-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="art-title">Título da arte</Label>
          <Input
            id="art-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Cartão de visita — versão 2"
          />
        </div>
        <div className="space-y-2">
          <Label>Cliente (opcional)</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger>
              <SelectValue placeholder="Vincular a um cliente" />
            </SelectTrigger>
            <SelectContent>
              {(clients ?? []).map((c: any) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="art-note">Observação para o cliente</Label>
          <Textarea
            id="art-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Ex.: confira nome, telefone e cores antes de aprovar."
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="art-file">Imagem da arte (PNG, JPG ou WEBP até 15 MB)</Label>
          <Input
            id="art-file"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="md:col-span-2">
          <Button
            onClick={() => create.mutate()}
            loading={create.isPending}
            className="h-11 w-full sm:w-auto"
          >
            <ShieldCheck className="mr-2 h-4 w-4" /> Gerar link protegido
          </Button>
        </div>
      </Card>

      <section className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando artes…</p>}
        {!isLoading && !proofs?.length && (
          <Card className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
            <ImageIcon className="h-6 w-6" />
            Nenhuma arte enviada ainda.
          </Card>
        )}
        {(proofs ?? []).map((p) => {
          const meta = STATUS_META[p.status];
          const Icon = meta.icon;
          return (
            <Card key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.title}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {p.clients?.name ?? "Sem cliente vinculado"} •{" "}
                  {new Date(p.created_at).toLocaleDateString("pt-BR")}
                  {p.viewed_at ? " • visualizada" : " • ainda não aberta"}
                </p>
                {p.client_feedback && (
                  <p className="mt-1 text-sm text-muted-foreground">“{p.client_feedback}”</p>
                )}
              </div>
              <Badge variant={meta.variant} className="w-fit gap-1">
                <Icon className="h-3.5 w-3.5" /> {meta.label}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => copyLink(p.token)}>
                <Copy className="mr-2 h-4 w-4" /> Link
              </Button>
            </Card>
          );
        })}
      </section>
    </div>
  );
}