import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  FileSignature,
  LoaderCircle,
  Plus,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { brl, fmtDate } from "@/lib/format";
import { sendServiceContract } from "@/lib/api/contracts.functions";
import { OrderEditor } from "@/components/OrderEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/contracts")({ component: ContractsPage });

const DEFAULT_CONFIDENTIALITY =
  "CONFIDENCIALIDADE E NÃO REUTILIZAÇÃO: A CONTRATADA manterá sob sigilo as informações, arquivos e materiais confidenciais fornecidos pelo CONTRATANTE. Não reutilizará, publicará, repassará ou utilizará em favor de terceiros os materiais ou conteúdos desenvolvidos especificamente para este cliente sem autorização expressa do CONTRATANTE. Esta obrigação não abrange conhecimentos gerais, métodos, técnicas, ferramentas ou materiais de terceiros, desde que não revelem nem reproduzam conteúdo confidencial do CONTRATANTE.";
const DEFAULT_BODY = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS Nº {{numero}} — VERSÃO {{versao}}

CONTRATADA: {{contratada}}
Identificação / contato: {{dados_contratada}}
CONTRATANTE: {{cliente}}
Documento: {{documento_cliente}}

1. OBJETO
A CONTRATADA prestará o serviço “{{servico}}”, conforme este escopo:
{{escopo}}

2. PRAZO
Início previsto: {{inicio}}
Término previsto: {{fim}}

3. VALOR E COBRANÇA
Valor contratado: {{valor}}
Modalidade: {{modalidade}}
Vencimento mensal, quando aplicável: dia {{vencimento}}.

4. CONFIDENCIALIDADE E MATERIAIS
{{confidencialidade}}

5. ACEITE
O aceite eletrônico registrado nesta página confirma a concordância com as condições e com esta versão do contrato.`;
const BILLING: Record<string, string> = {
  mensal_fixo: "Mensalidade fixa",
  por_demanda: "Por demanda",
  misto: "Mensal + demanda",
};
const STATUS: Record<string, string> = {
  rascunho: "Rascunho",
  enviado: "Aguardando cliente",
  aprovado: "Aprovado",
  recusado: "Recusado",
  suspenso: "Suspenso",
  encerrado: "Encerrado",
};

type FormState = {
  client_id: string;
  service_id: string;
  title: string;
  billing_mode: "mensal_fixo" | "por_demanda" | "misto";
  amount: string;
  start_date: string;
  end_date: string;
  due_day: string;
  scope: string;
  notes: string;
};
const emptyForm = (): FormState => ({
  client_id: "",
  service_id: "",
  title: "",
  billing_mode: "mensal_fixo",
  amount: "",
  start_date: "",
  end_date: "",
  due_day: "",
  scope: "",
  notes: "",
});

function templateText(
  template: string,
  clause: string,
  form: FormState,
  client: any,
  service: any,
  company: any,
  number: number,
  version: number,
) {
  const details = [company?.document, company?.address, company?.whatsapp]
    .filter(Boolean)
    .join(" · ");
  const fields: Record<string, string> = {
    numero: String(number),
    versao: String(version),
    contratada: company?.name || "Decode Analytics",
    dados_contratada: details,
    cliente: client?.name || "Cliente",
    documento_cliente: client?.document || "Não informado",
    servico: service?.name || "Serviço",
    escopo:
      form.scope.trim() || "Escopo conforme solicitações de serviço vinculadas a este contrato.",
    inicio: form.start_date ? fmtDate(form.start_date) : "A combinar",
    fim: form.end_date ? fmtDate(form.end_date) : "Prazo indeterminado",
    valor: brl(Number(form.amount.replace(",", ".")) || 0),
    modalidade: BILLING[form.billing_mode],
    vencimento: form.due_day || "A combinar",
    confidencialidade: clause || DEFAULT_CONFIDENTIALITY,
  };
  return template.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_all, key: string) => fields[key] ?? "");
}

function ContractsPage() {
  const qc = useQueryClient();
  const { user, hasRole } = useAuth();
  const canManage = hasRole("administrador", "atendente");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [createOpen, setCreateOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [templateForm, setTemplateForm] = useState({
    service_id: "",
    name: "",
    body_template: DEFAULT_BODY,
    confidentiality_clause: DEFAULT_CONFIDENTIALITY,
    active: true,
  });
  const { data: rows, isLoading } = useQuery({
    queryKey: ["service-contracts"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("service_contracts" as any)
        .select("*, clients(name,email,document,whatsapp), services(name,category)")
        .order("updated_at", { ascending: false }) as any);
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: clients = [] } = useQuery({
    queryKey: ["clients-for-contract"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id,name,document,email,whatsapp")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: services = [] } = useQuery({
    queryKey: ["services-for-contract"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id,name,category,base_price,active")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: templates = [] } = useQuery({
    queryKey: ["service-contract-templates"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("service_contract_templates" as any)
        .select("*")
        .order("name") as any);
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: company } = useQuery({
    queryKey: ["company-contract-info"],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_settings")
        .select("name,document,address,whatsapp")
        .limit(1)
        .maybeSingle();
      return data;
    },
  });
  const templatesByService = useMemo(
    () =>
      new Map(
        templates.filter((item: any) => item.active).map((item: any) => [item.service_id, item]),
      ),
    [templates],
  );
  const filtered = useMemo(
    () =>
      (rows ?? []).filter((row: any) => {
        const term = search.trim().toLowerCase();
        return (
          (status === "todos" || row.status === status) &&
          (!term ||
            String(row.number).includes(term) ||
            row.title?.toLowerCase().includes(term) ||
            row.clients?.name?.toLowerCase().includes(term) ||
            row.services?.name?.toLowerCase().includes(term))
        );
      }),
    [rows, search, status],
  );

  function newContract() {
    setEditing(null);
    setForm(emptyForm());
    setCreateOpen(true);
  }
  function editContract(item: any) {
    if (["aprovado", "suspenso", "encerrado"].includes(item.status))
      return toast.error("Este contrato está bloqueado para edição.");
    setEditing(item);
    setDetailId(null);
    setForm({
      client_id: item.client_id,
      service_id: item.service_id,
      title: item.title,
      billing_mode: item.billing_mode,
      amount: String(item.amount ?? ""),
      start_date: item.start_date ?? "",
      end_date: item.end_date ?? "",
      due_day: item.due_day ? String(item.due_day) : "",
      scope: item.scope ?? "",
      notes: item.notes ?? "",
    });
    setCreateOpen(true);
  }
  async function saveContract(event: FormEvent) {
    event.preventDefault();
    const client = clients.find((item) => item.id === form.client_id),
      service = services.find((item) => item.id === form.service_id),
      template = templatesByService.get(form.service_id) as any;
    if (!client || !service || !template)
      return toast.error("Selecione cliente e serviço com modelo ativo.");
    if (!form.title.trim() || !form.scope.trim())
      return toast.error("Informe o título e o escopo do serviço.");
    if (form.end_date && form.start_date && form.end_date < form.start_date)
      return toast.error("A data final deve ser posterior ao início.");
    const version = Number(editing?.version ?? 0) + 1;
    const payload = {
      client_id: form.client_id,
      service_id: form.service_id,
      template_id: template.id,
      title: form.title.trim(),
      billing_mode: form.billing_mode,
      amount: Number(form.amount.replace(",", ".")) || 0,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      due_day: form.due_day ? Number(form.due_day) : null,
      scope: form.scope.trim(),
      notes: form.notes.trim() || null,
    };
    const textFor = (number: number) =>
      templateText(
        template.body_template,
        template.confidentiality_clause,
        form,
        client,
        service,
        company,
        number,
        version,
      );
    let savedId = editing?.id;
    if (editing) {
      const { error } = await (supabase
        .from("service_contracts" as any)
        .update({
          ...payload,
          contract_text: textFor(editing.number),
          // Editing a sent agreement invalidates its approval link until the revised version is sent.
          status: editing.status === "enviado" ? "rascunho" : editing.status,
        })
        .eq("id", editing.id) as any);
      if (error) return toast.error(error.message);
    } else {
      const { data, error } = await (supabase
        .from("service_contracts" as any)
        .insert({ ...payload, contract_text: "", created_by: user?.id })
        .select("id,number")
        .single() as any);
      if (error || !data)
        return toast.error(error?.message ?? "Não foi possível criar o contrato.");
      savedId = data.id;
      const { error: textError } = await (supabase
        .from("service_contracts" as any)
        .update({ contract_text: textFor(data.number) })
        .eq("id", data.id) as any);
      if (textError)
        return toast.error(`Contrato criado, mas falhou salvar seu texto: ${textError.message}`);
    }
    setCreateOpen(false);
    setEditing(null);
    await qc.invalidateQueries({ queryKey: ["service-contracts"] });
    if (savedId) setDetailId(savedId);
    toast.success(
      editing ? "Contrato atualizado; envie a nova versão para aprovação." : "Rascunho criado.",
    );
  }
  async function saveTemplate(event: FormEvent) {
    event.preventDefault();
    if (!templateForm.service_id || !templateForm.name.trim() || !templateForm.body_template.trim())
      return toast.error("Escolha o serviço e preencha o modelo.");
    const { error } = await (supabase
      .from("service_contract_templates" as any)
      .upsert(
        { ...templateForm, name: templateForm.name.trim(), created_by: user?.id },
        { onConflict: "service_id" },
      ) as any);
    if (error) return toast.error(error.message);
    setTemplateOpen(false);
    await qc.invalidateQueries({ queryKey: ["service-contract-templates"] });
    toast.success("Modelo salvo para este serviço.");
  }
  async function sendLink(item: any) {
    setSendingId(item.id);
    try {
      const { token } = await sendServiceContract({ data: { contractId: item.id } });
      const link = `${window.location.origin}/contract/${token}`;
      await navigator.clipboard.writeText(link);
      const phone = item.clients?.whatsapp?.replace(/\D/g, "");
      if (phone)
        window.open(
          `https://wa.me/${phone}?text=${encodeURIComponent(`Olá, ${item.clients.name}! Segue o contrato ${item.number} para análise e aprovação: ${link}`)}`,
          "_blank",
          "noopener,noreferrer",
        );
      toast.success(
        phone
          ? "Link copiado e WhatsApp aberto para envio."
          : "Link privado copiado. Envie ao cliente pelo canal combinado.",
      );
      await qc.invalidateQueries({ queryKey: ["service-contracts"] });
      await qc.invalidateQueries({ queryKey: ["service-contract-versions", item.id] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar o link.");
    } finally {
      setSendingId(null);
    }
  }

  const activeCount = rows?.filter((r: any) => r.status === "aprovado").length ?? 0;
  const waitingCount = rows?.filter((r: any) => r.status === "enviado").length ?? 0;
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Operação</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Contratos de serviço</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Modelos por serviço, aprovação do cliente por link privado e acompanhamento de cobranças
            e ordens.
          </p>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setTemplateForm({
                  service_id: "",
                  name: "",
                  body_template: DEFAULT_BODY,
                  confidentiality_clause: DEFAULT_CONFIDENTIALITY,
                  active: true,
                });
                setTemplateOpen(true);
              }}
            >
              <FileSignature className="mr-2 h-4 w-4" /> Modelos por serviço
            </Button>
            <Button onClick={newContract}>
              <Plus className="mr-2 h-4 w-4" /> Novo contrato
            </Button>
          </div>
        )}
      </header>
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric
          title="Contratos ativos"
          value={String(activeCount)}
          icon={<BadgeCheck className="h-4 w-4" />}
        />
        <Metric
          title="Aguardando cliente"
          value={String(waitingCount)}
          icon={<Send className="h-4 w-4" />}
        />
        <Metric
          title="Total registrado"
          value={String(rows?.length ?? 0)}
          icon={<FileSignature className="h-4 w-4" />}
        />
      </div>
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Cliente, serviço ou número"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Tabs value={status} onValueChange={setStatus}>
            <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:grid-cols-6">
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="rascunho">Rascunhos</TabsTrigger>
              <TabsTrigger value="enviado">Enviados</TabsTrigger>
              <TabsTrigger value="aprovado">Aprovados</TabsTrigger>
              <TabsTrigger value="recusado">Recusados</TabsTrigger>
              <TabsTrigger value="encerrado">Encerrados</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Contrato</th>
                <th className="p-3 text-left">Cliente / serviço</th>
                <th className="p-3 text-left">Cobrança</th>
                <th className="p-3 text-left">Situação</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item: any) => (
                <tr key={item.id} className="border-t hover:bg-muted/30">
                  <td className="p-3">
                    <button
                      className="text-left font-semibold text-primary hover:underline"
                      onClick={() => setDetailId(item.id)}
                    >
                      #{item.number} · {item.title}
                    </button>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Versão {item.version || 0} · {fmtDate(item.updated_at)}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{item.clients?.name}</div>
                    <div className="text-xs text-muted-foreground">{item.services?.name}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{brl(item.amount)}</div>
                    <div className="text-xs text-muted-foreground">
                      {BILLING[item.billing_mode]}
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline">{STATUS[item.status] ?? item.status}</Badge>
                    {item.approval_name && (
                      <div className="mt-1 text-xs text-muted-foreground">{item.approval_name}</div>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      {item.status === "aprovado" && (
                        <Button size="sm" variant="outline" onClick={() => setOrderId(item.id)}>
                          Nova OS
                        </Button>
                      )}
                      {canManage &&
                        !["aprovado", "suspenso", "encerrado"].includes(item.status) && (
                          <Button size="sm" variant="ghost" onClick={() => editContract(item)}>
                            Editar
                          </Button>
                        )}
                      {canManage &&
                        !["aprovado", "suspenso", "encerrado"].includes(item.status) && (
                          <Button
                            size="sm"
                            onClick={() => sendLink(item)}
                            disabled={sendingId === item.id}
                          >
                            {sendingId === item.id ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="mr-1 h-4 w-4" />
                            )}
                            {item.status === "enviado" ? "Nova versão" : "Enviar"}
                          </Button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
              {isLoading && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted-foreground">
                    Carregando…
                  </td>
                </tr>
              )}
              {!isLoading && !filtered.length && (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <FileSignature className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
                    <p className="font-medium">Nenhum contrato encontrado</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Configure um modelo para um serviço de prestação e cadastre o contrato do
                      cliente.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[92dvh] w-[calc(100%-1rem)] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing
                ? `Editar contrato #${editing.number}`
                : "Novo contrato de prestação de serviço"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={saveContract} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Cliente *</Label>
                <Select
                  value={form.client_id}
                  onValueChange={(v) => setForm({ ...form, client_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Serviço com modelo ativo *</Label>
                <Select
                  value={form.service_id}
                  onValueChange={(v) => {
                    const svc = services.find((s) => s.id === v);
                    setForm({
                      ...form,
                      service_id: v,
                      title: form.title || svc?.name || "",
                      amount: form.amount || String(svc?.base_price ?? ""),
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services
                      .filter((s) => templatesByService.has(s.id))
                      .map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} · {s.category}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Título *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Social media e design — plano mensal"
                />
              </div>
              <div>
                <Label>Tipo de cobrança</Label>
                <Select
                  value={form.billing_mode}
                  onValueChange={(v: FormState["billing_mode"]) =>
                    setForm({ ...form, billing_mode: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal_fixo">Mensalidade fixa</SelectItem>
                    <SelectItem value="por_demanda">Por demanda</SelectItem>
                    <SelectItem value="misto">Mensal + demanda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor combinado (R$)</Label>
                <Input
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0,00"
                />
              </div>
              <div>
                <Label>Início</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Término (opcional)</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Dia de vencimento</Label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={form.due_day}
                  onChange={(e) => setForm({ ...form, due_day: e.target.value })}
                  placeholder="Ex.: 10"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Escopo e entregas *</Label>
                <Textarea
                  rows={4}
                  value={form.scope}
                  onChange={(e) => setForm({ ...form, scope: e.target.value })}
                  placeholder="Entregas, quantidades, canais, revisões e limites."
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Observação interna</Label>
                <Textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              {templatesByService.has(form.service_id) && (
                <div className="sm:col-span-2 rounded-xl border bg-muted/30 p-3 text-sm">
                  <p className="flex items-center gap-2 font-medium">
                    <ShieldCheck className="h-4 w-4 text-primary" />O modelo deste serviço incluirá
                    confidencialidade e não reutilização de conteúdo específico do cliente.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar rascunho</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
        <DialogContent className="max-h-[92dvh] w-[calc(100%-1rem)] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modelo de contrato por serviço</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveTemplate} className="space-y-4">
            <div>
              <Label>Serviço de prestação *</Label>
              <Select
                value={templateForm.service_id}
                onValueChange={(v) => {
                  const current = templates.find((t: any) => t.service_id === v) as any;
                  const svc = services.find((s) => s.id === v);
                  setTemplateForm(
                    current
                      ? {
                          service_id: v,
                          name: current.name,
                          body_template: current.body_template,
                          confidentiality_clause: current.confidentiality_clause,
                          active: current.active,
                        }
                      : {
                          service_id: v,
                          name: svc?.name ?? "",
                          body_template: DEFAULT_BODY,
                          confidentiality_clause: DEFAULT_CONFIDENTIALITY,
                          active: true,
                        },
                  );
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha o serviço que terá este modelo" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} · {s.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                Configure serviços de prestação; produtos avulsos podem ficar sem modelo.
              </p>
            </div>
            <div>
              <Label>Nome do modelo *</Label>
              <Input
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Texto-base *</Label>
              <Textarea
                rows={12}
                value={templateForm.body_template}
                onChange={(e) =>
                  setTemplateForm({ ...templateForm, body_template: e.target.value })
                }
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Campos disponíveis:{" "}
                {
                  "{{numero}}, {{versao}}, {{contratada}}, {{dados_contratada}}, {{cliente}}, {{documento_cliente}}, {{servico}}, {{escopo}}, {{inicio}}, {{fim}}, {{valor}}, {{modalidade}}, {{vencimento}}, {{confidencialidade}}"
                }
                .
              </p>
            </div>
            <div>
              <Label>Confidencialidade e não reutilização</Label>
              <Textarea
                rows={5}
                value={templateForm.confidentiality_clause}
                onChange={(e) =>
                  setTemplateForm({ ...templateForm, confidentiality_clause: e.target.value })
                }
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTemplateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar modelo</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ContractDetails
        id={detailId}
        onOpenChange={(v) => {
          if (!v) setDetailId(null);
        }}
        onEdit={editContract}
        onSend={sendLink}
        sendingId={sendingId}
        onSaved={async () => {
          await qc.invalidateQueries({ queryKey: ["service-contracts"] });
          await qc.invalidateQueries({ queryKey: ["receivables"] });
        }}
        onCreateOrder={(id) => setOrderId(id)}
      />
      <OrderEditor
        open={Boolean(orderId)}
        onOpenChange={(v) => {
          if (!v) setOrderId(null);
        }}
        initialContractId={orderId}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["orders"] });
          qc.invalidateQueries({ queryKey: ["service-contract-orders", orderId] });
        }}
      />
    </div>
  );
}

function Metric({ title, value, icon }: { title: string; value: string; icon: ReactNode }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </Card>
  );
}

function ContractDetails({
  id,
  onOpenChange,
  onEdit,
  onSend,
  sendingId,
  onSaved,
  onCreateOrder,
}: {
  id: string | null;
  onOpenChange: (v: boolean) => void;
  onEdit: (c: any) => void;
  onSend: (c: any) => void;
  sendingId: string | null;
  onSaved: () => void;
  onCreateOrder: (id: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState("");
  const [month, setMonth] = useState("");
  const { data: contract } = useQuery({
    queryKey: ["service-contract", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("service_contracts" as any)
        .select("*,clients(name,whatsapp),services(name)")
        .eq("id", id!)
        .single() as any);
      if (error) throw error;
      return data;
    },
  });
  const { data: versions = [] } = useQuery({
    queryKey: ["service-contract-versions", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("service_contract_versions" as any)
        .select("*")
        .eq("contract_id", id!)
        .order("version", { ascending: false }) as any);
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: orders = [] } = useQuery({
    queryKey: ["service-contract-orders", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("orders" as any)
        .select("id,number,title,production_status,total,performed_on")
        .eq("service_contract_id", id!)
        .order("created_at", { ascending: false }) as any);
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: charges = [], refetch } = useQuery({
    queryKey: ["service-contract-receivables", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("receivables" as any)
        .select("id,amount,due_date,competence_month,status")
        .eq("service_contract_id", id!)
        .order("competence_month", { ascending: false }) as any);
      if (error) throw error;
      return data ?? [];
    },
  });
  async function addCharge(e: FormEvent) {
    e.preventDefault();
    if (!contract || !amount) return toast.error("Informe o valor.");
    const { error } = await (supabase.from("receivables" as any).insert({
      client_id: contract.client_id,
      service_contract_id: contract.id,
      amount: Number(amount.replace(",", ".")) || 0,
      due_date: due || null,
      competence_month: month ? `${month}-01` : null,
      notes: `Contrato #${contract.number} · ${contract.title}`,
      status: "pendente",
    }) as any);
    if (error) return toast.error(error.message);
    setAmount("");
    setDue("");
    setMonth("");
    toast.success("Cobrança vinculada ao contrato registrada.");
    await refetch();
    onSaved();
  }
  const open = Boolean(id);
  const canResend = contract && !["aprovado", "suspenso", "encerrado"].includes(contract.status);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94dvh] w-[calc(100%-1rem)] max-w-5xl overflow-y-auto p-4 sm:p-6">
        {contract && (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-3">
                Contrato #{contract.number} · {contract.title}
                <Badge variant="outline">{STATUS[contract.status]}</Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
              <div className="space-y-4">
                <Card className="grid gap-3 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Cliente</p>
                    <p className="font-medium">{contract.clients?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Serviço</p>
                    <p className="font-medium">{contract.services?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Valor / cobrança</p>
                    <p className="font-medium">
                      {brl(contract.amount)} · {BILLING[contract.billing_mode]}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Vigência</p>
                    <p className="font-medium">
                      {contract.start_date ? fmtDate(contract.start_date) : "A combinar"} –{" "}
                      {contract.end_date ? fmtDate(contract.end_date) : "Indeterminada"}
                    </p>
                  </div>
                  {contract.approval_name && (
                    <div className="sm:col-span-2">
                      <p className="text-xs text-muted-foreground">Resposta</p>
                      <p>
                        {contract.status === "aprovado" ? "Aceito" : "Recusado"} por{" "}
                        {contract.approval_name} · {fmtDate(contract.responded_at)}
                      </p>
                      {contract.response_reason && (
                        <p className="text-sm text-muted-foreground">
                          Motivo: {contract.response_reason}
                        </p>
                      )}
                    </div>
                  )}
                </Card>
                <Card className="p-4">
                  <div className="mb-3 flex justify-between">
                    <h2 className="font-semibold">Texto do contrato</h2>
                    <Button size="sm" variant="outline" onClick={() => window.print()}>
                      Imprimir / PDF
                    </Button>
                  </div>
                  <pre className="max-h-[34vh] overflow-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-4 font-sans text-sm leading-6">
                    {contract.contract_text}
                  </pre>
                  <p className="mt-2 text-xs text-muted-foreground">
                    O aceite eletrônico é registrado no app e não equivale a uma assinatura
                    eletrônica qualificada.
                  </p>
                </Card>
                <Card className="p-4">
                  <h2 className="mb-3 font-semibold">Versões</h2>
                  <div className="space-y-2">
                    {versions.map((v: any) => (
                      <div
                        key={v.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
                      >
                        <div>
                          <p className="font-medium">Versão {v.version}</p>
                          <p className="text-xs text-muted-foreground">
                            {fmtDate(v.sent_at)} · {brl(v.amount)}
                          </p>
                        </div>
                        <Badge variant="outline">{STATUS[v.status] ?? v.status}</Badge>
                        {v.approval_name && (
                          <span className="text-xs text-muted-foreground">
                            {v.approval_name} · {fmtDate(v.responded_at)}
                          </span>
                        )}
                      </div>
                    ))}
                    {!versions.length && (
                      <p className="text-sm text-muted-foreground">
                        Ainda não há versões enviadas.
                      </p>
                    )}
                  </div>
                </Card>
              </div>
              <div className="space-y-4">
                <Card className="space-y-3 p-4">
                  <h2 className="font-semibold">Ações</h2>
                  {canResend && (
                    <>
                      <Button
                        className="w-full"
                        onClick={() => onSend(contract)}
                        disabled={sendingId === contract.id}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {contract.status === "enviado"
                          ? "Gerar nova versão e link"
                          : "Gerar link de aprovação"}
                      </Button>
                      <Button variant="outline" className="w-full" onClick={() => onEdit(contract)}>
                        Editar rascunho
                      </Button>
                    </>
                  )}
                  {contract.status === "aprovado" && (
                    <Button
                      className="w-full"
                      onClick={() => {
                        onOpenChange(false);
                        onCreateOrder(contract.id);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Criar OS vinculada
                    </Button>
                  )}
                </Card>
                <Card className="p-4">
                  <div className="mb-3 flex justify-between">
                    <h2 className="font-semibold">Ordens de serviço</h2>
                    <span className="text-xs text-muted-foreground">{orders.length}</span>
                  </div>
                  <div className="space-y-2">
                    {orders.map((o: any) => (
                      <div
                        key={o.id}
                        className="flex justify-between gap-2 rounded-lg border p-3 text-sm"
                      >
                        <div>
                          <p className="font-medium">
                            OS #{o.number} · {o.title || "Serviço"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Realizado:{" "}
                            {o.performed_on ? fmtDate(o.performed_on) : "Data não informada"}
                          </p>
                        </div>
                        <Badge variant="outline">{o.production_status}</Badge>
                      </div>
                    ))}
                    {!orders.length && (
                      <p className="text-sm text-muted-foreground">
                        Nenhuma OS vinculada; trabalhos anteriores podem ser lançados com data
                        retroativa.
                      </p>
                    )}
                  </div>
                </Card>
                <Card className="p-4">
                  <h2 className="mb-3 font-semibold">Registrar cobrança</h2>
                  <form onSubmit={addCharge} className="space-y-3">
                    <div>
                      <Label>Competência (opcional)</Label>
                      <Input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Valor *</Label>
                        <Input
                          inputMode="decimal"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0,00"
                        />
                      </div>
                      <div>
                        <Label>Vencimento</Label>
                        <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
                      </div>
                    </div>
                    <Button className="w-full" variant="outline" type="submit">
                      Registrar cobrança
                    </Button>
                  </form>
                  <div className="mt-4 space-y-2">
                    {charges.slice(0, 8).map((c: any) => (
                      <div key={c.id} className="flex justify-between border-t pt-2 text-sm">
                        <span>
                          {c.competence_month ? fmtDate(c.competence_month) : "Sem competência"} ·{" "}
                          {brl(c.amount)}
                        </span>
                        <span className="text-muted-foreground">{c.status}</span>
                      </div>
                    ))}
                    {!charges.length && (
                      <p className="text-xs text-muted-foreground">Nenhuma cobrança registrada.</p>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
