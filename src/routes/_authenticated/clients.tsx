import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  FileText,
  UserCheck,
  UserX,
  AlertCircle,
} from "lucide-react";
import { fmtDate } from "@/lib/format";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/clients")({ component: ClientsPage });

type ClientRow = {
  id: string;
  name: string;
  document: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  district: string | null;
  city: string | null;
  notes: string | null;
  active?: boolean;
  created_at: string;
};

function ClientsPage() {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativos" | "inativos">("ativos");
  const [editing, setEditing] = useState<Partial<ClientRow> | null>(null);
  const [open, setOpen] = useState(false);

  // Modal de conflito ao tentar excluir cliente com histórico vinculado
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    client: ClientRow | null;
    hasRecords?: boolean;
    recordsCount?: number;
    loading?: boolean;
  }>({ open: false, client: null });

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name", { ascending: true });
      if (error) {
        console.error("Erro ao buscar clientes:", error);
        throw error;
      }
      return (data ?? []).map((c: any) => ({
        ...c,
        active: c.active !== false && !c.archived_at, // ativo se não arquivado e não desativado
      })) as ClientRow[];
    },
  });

  const filtered = useMemo(() => {
    return (clients ?? []).filter((c) => {
      // Filtro de status
      if (statusFilter === "ativos" && c.active === false) return false;
      if (statusFilter === "inativos" && c.active !== false) return false;

      // Filtro de busca
      const term = search.trim().toLowerCase();
      if (!term) return true;
      return (
        c.name.toLowerCase().includes(term) ||
        (c.document ?? "").toLowerCase().includes(term) ||
        (c.whatsapp ?? "").includes(term) ||
        (c.city ?? "").toLowerCase().includes(term) ||
        (c.email ?? "").toLowerCase().includes(term)
      );
    });
  }, [clients, search, statusFilter]);

  async function save() {
    if (!editing?.name?.trim()) return toast.error("Nome é obrigatório");
    const payload: any = {
      name: editing.name.trim(),
      document: editing.document?.trim() || null,
      whatsapp: editing.whatsapp?.trim() || null,
      email: editing.email?.trim() || null,
      address: editing.address?.trim() || null,
      district: editing.district?.trim() || null,
      city: editing.city?.trim() || null,
      notes: editing.notes?.trim() || null,
      active: editing.active ?? true,
      archived_at: editing.active === false ? new Date().toISOString() : null,
    };
    let res = editing.id
      ? await supabase.from("clients").update(payload).eq("id", editing.id)
      : await supabase.from("clients").insert(payload);

    // Se der erro por falta da coluna active ou archived_at
    if (res.error && (res.error.code === "42703" || res.error.message?.includes("active") || res.error.message?.includes("archived_at"))) {
      const cleanPayload = { ...payload };
      delete cleanPayload.active;
      delete cleanPayload.archived_at;
      res = editing.id
        ? await supabase.from("clients").update(cleanPayload).eq("id", editing.id)
        : await supabase.from("clients").insert(cleanPayload);
    }

    if (res.error) return toast.error(res.error.message);
    toast.success("Cliente salvo com sucesso");
    setOpen(false);
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["clients"] });
    qc.invalidateQueries({ queryKey: ["clients-for-contract"] });
  }

  // Inicia tentativa de exclusão
  async function promptRemove(c: ClientRow) {
    setDeleteDialog({ open: true, client: c, loading: true });

    // Verifica se possui registros vinculados em orders, quotes, receivables ou contracts
    try {
      const [ordersRes, quotesRes, receivablesRes, contractsRes] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("client_id", c.id),
        supabase.from("quotes").select("id", { count: "exact", head: true }).eq("client_id", c.id),
        supabase.from("receivables").select("id", { count: "exact", head: true }).eq("client_id", c.id),
        supabase.from("service_contracts" as any).select("id", { count: "exact", head: true }).eq("client_id", c.id),
      ]);

      const count =
        (ordersRes.count ?? 0) +
        (quotesRes.count ?? 0) +
        (receivablesRes.count ?? 0) +
        (contractsRes.count ?? 0);

      setDeleteDialog({
        open: true,
        client: c,
        hasRecords: count > 0,
        recordsCount: count,
        loading: false,
      });
    } catch {
      setDeleteDialog({ open: true, client: c, hasRecords: false, recordsCount: 0, loading: false });
    }
  }

  // Helper para atualizar o status do cliente (tenta com active e fallback para archived_at)
  async function setClientStatus(clientId: string, active: boolean) {
    const nowIso = new Date().toISOString();
    // 1. Tenta atualizar active e archived_at
    let { error } = await supabase
      .from("clients")
      .update({ active, archived_at: active ? null : nowIso } as any)
      .eq("id", clientId);

    // Se a coluna active não existir ainda no banco, tenta apenas com archived_at
    if (error && (error.code === "42703" || error.message?.includes("active"))) {
      const res = await supabase
        .from("clients")
        .update({ archived_at: active ? null : nowIso } as any)
        .eq("id", clientId);
      error = res.error;
    }

    // Se archived_at não existir, tenta apenas com active
    if (error && (error.code === "42703" || error.message?.includes("archived_at"))) {
      const res = await supabase
        .from("clients")
        .update({ active } as any)
        .eq("id", clientId);
      error = res.error;
    }

    return { error };
  }

  // Executa exclusão direta ou arquivamento
  async function executeRemove(forceCascade = false) {
    const c = deleteDialog.client;
    if (!c) return;

    // 1. Tenta via RPC delete_or_archive_client se disponível
    try {
      const { data: rpcRes, error: rpcErr } = await (supabase.rpc as any)("delete_or_archive_client", {
        p_client_id: c.id,
        p_force_cascade: forceCascade,
      });

      if (!rpcErr && rpcRes) {
        toast.success(rpcRes.message || "Ação concluída com sucesso.");
        setDeleteDialog({ open: false, client: null });
        qc.invalidateQueries({ queryKey: ["clients"] });
        qc.invalidateQueries({ queryKey: ["clients-for-contract"] });
        return;
      }
    } catch {
      // Prossegue para fallback direto caso a RPC ainda não esteja implantada
    }

    // 2. Se o usuário (ou admin) solicitou exclusão forçada com limpeza de registros vinculados
    if (forceCascade) {
      try {
        // Remove registros vinculados na ordem correta para não violar chaves estrangeiras
        await supabase.from("receivables").delete().eq("client_id", c.id);
        await supabase.from("service_contracts" as any).delete().eq("client_id", c.id);
        await supabase.from("quotes").delete().eq("client_id", c.id);
        await supabase.from("orders").delete().eq("client_id", c.id);
        await supabase.from("order_files").delete().eq("client_id", c.id);
        await supabase.from("cash_entries").update({ client_id: null } as any).eq("client_id", c.id);

        const { error: delErr } = await supabase.from("clients").delete().eq("id", c.id);
        if (delErr) {
          throw delErr;
        }

        toast.success(`Cliente "${c.name}" e seus registros foram excluídos permanentemente.`);
        setDeleteDialog({ open: false, client: null });
        qc.invalidateQueries({ queryKey: ["clients"] });
        qc.invalidateQueries({ queryKey: ["clients-for-contract"] });
        return;
      } catch (err: any) {
        console.error("[forceCascade error]", err);
        // Se ainda falhar na exclusão física, desativa/arquiva
        await setClientStatus(c.id, false);
        toast.info(`Cliente desativado/arquivado com sucesso para proteger integridade.`);
        setDeleteDialog({ open: false, client: null });
        qc.invalidateQueries({ queryKey: ["clients"] });
        qc.invalidateQueries({ queryKey: ["clients-for-contract"] });
        return;
      }
    }

    // 3. Fallback: se tem registros vinculados ou usuário optou por desativar/arquivar
    if (deleteDialog.hasRecords) {
      const { error } = await setClientStatus(c.id, false);
      if (error) {
        toast.error("Erro ao desativar cliente: " + error.message);
      } else {
        toast.success(`Cliente "${c.name}" foi desativado para proteger o histórico financeiro e de OS.`);
      }
      setDeleteDialog({ open: false, client: null });
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["clients-for-contract"] });
      return;
    }

    // 4. Fallback: exclusão direta sem registros
    const { error } = await supabase.from("clients").delete().eq("id", c.id);
    if (error) {
      // Se deu erro de chave estrangeira (foreign key constraint como receivables_client_id_fkey)
      if (error.code === "23503" || error.message?.includes("foreign key")) {
        const { error: archiveError } = await setClientStatus(c.id, false);
        if (!archiveError) {
          toast.info(
            `Cliente possui histórico financeiro e não pode ser deletado do banco. Foi desativado/arquivado com sucesso.`,
          );
        } else {
          toast.error("Não foi possível excluir nem arquivar: " + archiveError.message);
        }
      } else {
        toast.error("Erro ao excluir: " + error.message);
      }
    } else {
      toast.success(`Cliente "${c.name}" excluído com sucesso.`);
    }

    setDeleteDialog({ open: false, client: null });
    qc.invalidateQueries({ queryKey: ["clients"] });
    qc.invalidateQueries({ queryKey: ["clients-for-contract"] });
  }

  // Alterna status ativo/inativo
  async function toggleActive(c: ClientRow) {
    const nextActive = !c.active;
    const { error } = await setClientStatus(c.id, nextActive);
    if (error) return toast.error(error.message);
    toast.success(nextActive ? `Cliente "${c.name}" reativado!` : `Cliente "${c.name}" desativado!`);
    qc.invalidateQueries({ queryKey: ["clients"] });
    qc.invalidateQueries({ queryKey: ["clients-for-contract"] });
  }

  return (
    <div className="min-w-0 space-y-3 sm:space-y-4">
      {/* Barra de Ações e Filtros Superior */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF/CNPJ, WhatsApp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="ativos" className="flex-1 sm:flex-initial">Ativos</TabsTrigger>
              <TabsTrigger value="todos" className="flex-1 sm:flex-initial">Todos</TabsTrigger>
              <TabsTrigger value="inativos" className="flex-1 sm:flex-initial">Inativos</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => setEditing({ active: true })}
              className="w-full sm:w-auto bg-primary shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Novo cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[92dvh] w-[calc(100%-1rem)] max-w-2xl overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>{editing?.id ? "Editar cliente" : "Novo cliente"}</DialogTitle>
              <DialogDescription>
                Preencha os dados do cliente para ordens de serviço, contratos e notas.
              </DialogDescription>
            </DialogHeader>
            <div className="grid min-w-0 grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Nome / Razão Social *</Label>
                <Input
                  placeholder="Nome do cliente ou empresa"
                  value={editing?.name ?? ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div>
                <Label>CPF / CNPJ</Label>
                <Input
                  placeholder="000.000.000-00"
                  value={editing?.document ?? ""}
                  onChange={(e) => setEditing({ ...editing, document: e.target.value })}
                />
              </div>
              <div>
                <Label>WhatsApp / Telefone</Label>
                <Input
                  placeholder="(00) 00000-0000"
                  value={editing?.whatsapp ?? ""}
                  onChange={(e) => setEditing({ ...editing, whatsapp: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  placeholder="contato@cliente.com"
                  value={editing?.email ?? ""}
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Endereço</Label>
                <Input
                  placeholder="Rua, número, complemento"
                  value={editing?.address ?? ""}
                  onChange={(e) => setEditing({ ...editing, address: e.target.value })}
                />
              </div>
              <div>
                <Label>Bairro</Label>
                <Input
                  placeholder="Bairro"
                  value={editing?.district ?? ""}
                  onChange={(e) => setEditing({ ...editing, district: e.target.value })}
                />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input
                  placeholder="Cidade"
                  value={editing?.city ?? ""}
                  onChange={(e) => setEditing({ ...editing, city: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Observações internas</Label>
                <Textarea
                  placeholder="Informações adicionais, referências, preferências..."
                  rows={3}
                  value={editing?.notes ?? ""}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter className="sticky bottom-0 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 border-t bg-background/95 p-4 backdrop-blur-sm">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={save}>Salvar cliente</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Visualização Mobile: Cards Touch-Friendly (sm:hidden) */}
      <div className="grid gap-2.5 sm:hidden">
        {filtered.map((c) => {
          const cleanPhone = c.whatsapp?.replace(/\D/g, "");
          const isInactive = c.active === false;
          return (
            <Card
              key={c.id}
              className={`p-3.5 transition-all border ${
                isInactive ? "opacity-70 bg-muted/30 border-dashed" : "hover:border-primary/40 shadow-xs"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-foreground text-base truncate">{c.name}</span>
                    {isInactive && (
                      <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">
                        Inativo
                      </Badge>
                    )}
                  </div>
                  {c.document && (
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{c.document}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    aria-label={`Editar ${c.name}`}
                    onClick={() => {
                      setEditing(c);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    aria-label={`Excluir ${c.name}`}
                    onClick={() => promptRemove(c)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Contatos e Informações Rápidas */}
              <div className="mt-2.5 space-y-1.5 pt-2 border-t border-border/60 text-xs">
                {c.whatsapp && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="w-3.5 h-3.5 text-primary" />
                      {c.whatsapp}
                    </span>
                    {cleanPhone && (
                      <a
                        href={`https://wa.me/55${cleanPhone.replace(/^55/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px] hover:bg-emerald-500/20"
                      >
                        <MessageCircle className="w-3 h-3" />
                        Conversar
                      </a>
                    )}
                  </div>
                )}
                {c.email && (
                  <div className="flex items-center gap-1.5 text-muted-foreground truncate">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                {(c.city || c.district) && (
                  <div className="flex items-center gap-1.5 text-muted-foreground truncate">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">
                      {[c.district, c.city].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {!isLoading && !filtered.length && (
          <Card className="p-8 text-center text-muted-foreground">
            <p className="font-medium">Nenhum cliente encontrado</p>
            <p className="text-xs mt-1 text-muted-foreground/80">
              {search ? "Tente buscar por outro termo." : "Cadastre novos clientes pelo botão acima."}
            </p>
          </Card>
        )}
      </div>

      {/* Visualização Desktop: Tabela Tradicional (hidden sm:block) */}
      <Card className="hidden sm:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-muted text-muted-foreground text-xs uppercase">
              <tr>
                <th className="text-left p-3">Nome / Razão</th>
                <th className="text-left p-3">WhatsApp</th>
                <th className="text-left p-3">Cidade</th>
                <th className="text-left p-3 hidden lg:table-cell">Cadastro</th>
                <th className="text-center p-3">Status</th>
                <th className="text-right p-3 w-36">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const cleanPhone = c.whatsapp?.replace(/\D/g, "");
                const isInactive = c.active === false;
                return (
                  <tr
                    key={c.id}
                    className={`border-t hover:bg-muted/30 transition-colors ${
                      isInactive ? "opacity-60 bg-muted/15" : ""
                    }`}
                  >
                    <td className="p-3 font-medium">
                      <div className="font-semibold text-foreground">{c.name}</div>
                      {c.document && (
                        <div className="text-xs text-muted-foreground font-mono">{c.document}</div>
                      )}
                    </td>
                    <td className="p-3">
                      {c.whatsapp ? (
                        <div className="flex items-center gap-1.5">
                          <span>{c.whatsapp}</span>
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/55${cleanPhone.replace(/^55/, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:text-emerald-700"
                              title="Abrir WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {[c.district, c.city].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="p-3 hidden lg:table-cell text-muted-foreground">
                      {fmtDate(c.created_at)}
                    </td>
                    <td className="p-3 text-center">
                      {isInactive ? (
                        <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">
                          Inativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300">
                          Ativo
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Editar ${c.name}`}
                          onClick={() => {
                            setEditing(c);
                            setOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10"
                          aria-label={`Excluir ${c.name}`}
                          onClick={() => promptRemove(c)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {isLoading && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-muted-foreground italic">
                    Sincronizando clientes...
                  </td>
                </tr>
              )}
              {!isLoading && !filtered.length && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-muted-foreground">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* AlertDialog de Confirmação de Exclusão / Tratamento de Vínculos */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open: false, client: null })}
      >
        <AlertDialogContent className="w-[calc(100%-1rem)] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              {deleteDialog.hasRecords ? "Cliente com Registros Vinculados" : "Excluir Cliente"}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-sm text-muted-foreground pt-1">
              {deleteDialog.loading ? (
                <span>Verificando vínculos do cliente...</span>
              ) : deleteDialog.hasRecords ? (
                <>
                  <p>
                    O cliente <strong>{deleteDialog.client?.name}</strong> possui{" "}
                    <strong>{deleteDialog.recordsCount} registro(s)</strong> vinculados (ordens de
                    serviço, orçamentos, contratos ou cobranças).
                  </p>
                  <p className="text-xs bg-amber-500/10 text-amber-900 dark:text-amber-200 p-2.5 rounded-lg border border-amber-500/20">
                    💡 <strong>Recomendado:</strong> Desative o cliente para que ele não apareça em
                    novos cadastros, mantendo intacto todo o histórico fiscal e financeiro do negócio.
                  </p>
                </>
              ) : (
                <p>
                  Deseja realmente excluir o cliente <strong>{deleteDialog.client?.name}</strong>? Esta
                  ação é permanente.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            {deleteDialog.hasRecords ? (
              <>
                <Button
                  variant="outline"
                  className="bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-200"
                  onClick={() => executeRemove(false)}
                >
                  <UserX className="w-4 h-4 mr-1.5" /> Desativar Cliente
                </Button>
                {isAdmin && (
                  <Button variant="destructive" onClick={() => executeRemove(true)}>
                    Excluir Tudo
                  </Button>
                )}
              </>
            ) : (
              <Button variant="destructive" onClick={() => executeRemove(false)}>
                Confirmar Exclusão
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
