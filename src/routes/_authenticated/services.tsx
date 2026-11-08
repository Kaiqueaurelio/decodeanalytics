import { cn } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FileSpreadsheet, Download, Upload, Repeat, Search, Layers } from "lucide-react";
import { brl, SERVICE_CATEGORIES } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/services")({ component: ServicesPage });

type S = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  base_price: number;
  unit: string | null;
  default_deadline_days: number | null;
  active: boolean;
  billing_type?: string;
};

function ServicesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Partial<S> | null>(null);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");
  const [billingFilter, setBillingFilter] = useState<"todos" | "avulso" | "assinatura">("todos");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const { data } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").order("name");
      if (error) throw error;
      return data as S[];
    },
  });

  const isRecurring = (billingType?: string | null) =>
    billingType === "assinatura_mensal" || billingType === "mensal";

  const recurringCount = (data ?? []).filter((s) => isRecurring(s.billing_type)).length;
  const avulsoCount = (data ?? []).filter((s) => !isRecurring(s.billing_type)).length;

  const filtered = useMemo(() => {
    return (data ?? []).filter((s) => {
      const term = search.trim().toLowerCase();
      const matchesSearch =
        !term ||
        s.name.toLowerCase().includes(term) ||
        s.category.toLowerCase().includes(term) ||
        (s.description ?? "").toLowerCase().includes(term);

      if (!matchesSearch) return false;

      if (billingFilter === "assinatura") return isRecurring(s.billing_type);
      if (billingFilter === "avulso") return !isRecurring(s.billing_type);
      return true;
    });
  }, [data, search, billingFilter]);

  async function save() {
    if (!edit?.name || !edit.category) return toast.error("Nome e categoria são obrigatórios");
    if (isRecurring(edit.billing_type) && !(Number(edit.base_price) > 0))
      return toast.error("Informe o valor mensal da assinatura.");
    const recurring = isRecurring(edit.billing_type);
    const payload = {
      name: edit.name,
      category: edit.category,
      description: edit.description || null,
      base_price: Number(edit.base_price) || 0,
      unit: recurring ? "mês" : edit.unit || "un",
      default_deadline_days: Number(edit.default_deadline_days) || (recurring ? 30 : 3),
      active: edit.active ?? true,
      billing_type: recurring ? "assinatura_mensal" : "avulso",
    };
    const res = edit.id
      ? await supabase.from("services").update(payload).eq("id", edit.id)
      : await supabase.from("services").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Salvo com sucesso");
    setOpen(false);
    setEdit(null);
    qc.invalidateQueries({ queryKey: ["services"] });
  }

  async function remove(id: string) {
    if (!confirm("Excluir serviço?")) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["services"] });
  }

  async function downloadTemplate() {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet([
      {
        name: "Cartão de visita 4x4",
        category: "Cartões",
        description: "Couché 300g, laminação fosca e verniz localizado",
        base_price: 80,
        unit: "milheiro",
        default_deadline_days: 3,
        billing_type: "avulso",
        active: true,
      },
      {
        name: "Gestão de Redes Sociais — Plano Pro",
        category: "Social Media",
        description: "12 posts mensais, 8 stories semanais e relatório de desempenho",
        base_price: 800,
        unit: "mês",
        default_deadline_days: 30,
        billing_type: "assinatura_mensal",
        active: true,
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produtos");
    XLSX.writeFile(wb, "modelo-produtos-servicos.xlsx");
  }

  async function exportCurrent() {
    const XLSX = await import("xlsx");
    const rows = (data ?? []).map((s) => ({
      name: s.name,
      category: s.category,
      description: s.description ?? "",
      base_price: Number(s.base_price) || 0,
      unit: s.unit ?? "un",
      billing_type: isRecurring(s.billing_type) ? "assinatura_mensal" : "avulso",
      default_deadline_days: s.default_deadline_days ?? 3,
      active: s.active,
    }));
    if (!rows.length) return toast.error("Nenhum produto para exportar");
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produtos");
    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `produtos-servicos-${stamp}.xlsx`);
    toast.success(`${rows.length} produto(s) exportado(s)`);
  }

  async function handleImportFile(file: File) {
    const XLSX = await import("xlsx");
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });
      if (!rows.length) {
        toast.error("Planilha vazia");
        return;
      }
      const payload = rows
        .map((r) => {
          const get = (...keys: string[]) => {
            for (const k of keys) {
              const found = Object.keys(r).find((x) => x.toLowerCase().trim() === k.toLowerCase());
              if (found && r[found] !== "" && r[found] != null) return r[found];
            }
            return undefined;
          };
          const name = String(get("name", "nome", "produto", "servico", "serviço") ?? "").trim();
          if (!name) return null;
          const category = String(get("category", "categoria") ?? "Outros").trim();
          const rawPrice = String(get("base_price", "preço", "preco", "valor", "price") ?? "0")
            .replace(/[^0-9,.-]/g, "")
            .replace(/\./g, "")
            .replace(",", ".");
          const rawBilling = String(get("billing_type", "tipo_cobranca", "tipo", "modalidade") ?? "").toLowerCase();
          const billing_type =
            rawBilling.includes("mensal") || rawBilling.includes("assinatura") || rawBilling.includes("recorrente")
              ? "assinatura_mensal"
              : "avulso";

          return {
            name,
            category,
            description: String(get("description", "descrição", "descricao") ?? "") || null,
            base_price: Number(rawPrice) || 0,
            unit: String(get("unit", "unidade") ?? (billing_type === "assinatura_mensal" ? "mês" : "un")) || "un",
            default_deadline_days: Number(get("default_deadline_days", "prazo", "dias")) || 3,
            billing_type,
            active: String(get("active", "ativo") ?? "true").toLowerCase() !== "false",
          };
        })
        .filter(Boolean) as any[];
      if (!payload.length) {
        toast.error("Nenhuma linha válida (precisa coluna 'nome').");
        return;
      }
      const { error } = await supabase.from("services").insert(payload);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(`${payload.length} produto(s) exportado(s)`);
      qc.invalidateQueries({ queryKey: ["services"] });
    } catch (err: any) {
      toast.error("Erro ao ler planilha: " + err.message);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-4">
      {/* Resumo visual rápido */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4 border-border/60">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Total de Serviços</p>
          <p className="mt-1 text-2xl font-bold">{data?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Catálogo geral ativo</p>
        </Card>
        <Card className="p-4 border-primary/30 bg-primary/5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase text-primary">Assinaturas Recorrentes</p>
            <Repeat className="w-4 h-4 text-primary" />
          </div>
          <p className="mt-1 text-2xl font-bold text-primary">{recurringCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Cobrança mensal fixa</p>
        </Card>
        <Card className="p-4 border-border/60">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Serviços Avulsos</p>
            <Layers className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="mt-1 text-2xl font-bold">{avulsoCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Por demanda / entrega única</p>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, categoria ou detalhes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs value={billingFilter} onValueChange={(v) => setBillingFilter(v as any)}>
            <TabsList>
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="assinatura">Assinaturas</TabsTrigger>
              <TabsTrigger value="avulso">Avulsos</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImportFile(f);
            }}
          />
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-1" /> Modelo Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportCurrent}>
            <Upload className="w-4 h-4 mr-1" /> Exportar
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={importing}>
            <FileSpreadsheet className="w-4 h-4 mr-1" /> {importing ? "Importando..." : "Importar"}
          </Button>
          <Dialog
            open={open}
            onOpenChange={(o) => {
              setOpen(o);
              if (!o) setEdit(null);
            }}
          >
            <DialogTrigger asChild>
              <Button
                size="sm"
                onClick={() =>
                  setEdit({
                    active: true,
                    billing_type: "avulso",
                    unit: "un",
                    default_deadline_days: 3,
                  })
                }
              >
                <Plus className="w-4 h-4 mr-1" /> Novo serviço
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{edit?.id ? "Editar" : "Novo"} serviço</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Nome do serviço ou pacote *</Label>
                  <Input
                    placeholder="Ex.: Gestão de Mídias Sociais ou Cartão de Visitas"
                    value={edit?.name ?? ""}
                    onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Categoria *</Label>
                  <Select
                    value={edit?.category ?? ""}
                    onValueChange={(v) => setEdit({ ...edit, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Opção de Cobrança Mensal / Assinatura Recorrente */}
                <div className="p-3.5 rounded-lg border border-border/80 bg-muted/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-medium text-sm">
                        <Repeat className="w-4 h-4 text-primary" />
                        <span>Assinatura Recorrente Mensal</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Marque se este serviço possui mensalidade fixa e gera cobrança recorrente em contratos.
                      </p>
                    </div>
                    <Switch
                      checked={isRecurring(edit?.billing_type)}
                      onCheckedChange={(checked) => {
                        const newBilling = checked ? "assinatura_mensal" : "avulso";
                        setEdit({
                          ...edit,
                          billing_type: newBilling,
                          unit: checked && (!edit?.unit || edit?.unit === "un") ? "mês" : edit?.unit,
                        });
                      }}
                    />
                  </div>
                  {isRecurring(edit?.billing_type) && (
                    <div className="pt-1">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                        ✓ Cobrança Mensal Vinculável a Contratos (/contracts)
                      </Badge>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Detalhamento do pacote contratado / Descrição</Label>
                  <Textarea
                    placeholder="Especifique o que está incluso no pacote (ex.: número de artes, entregáveis, revisões, formato, etc.)"
                    rows={3}
                    value={edit?.description ?? ""}
                    onChange={(e) => setEdit({ ...edit, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label>{isRecurring(edit?.billing_type) ? "Valor mensal *" : "Preço base *"}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={edit?.base_price ?? ""}
                      onChange={(e) => setEdit({ ...edit, base_price: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Unidade</Label>
                    <Input
                      placeholder={isRecurring(edit?.billing_type) ? "mês" : "un"}
                      value={edit?.unit ?? (isRecurring(edit?.billing_type) ? "mês" : "un")}
                      onChange={(e) => setEdit({ ...edit, unit: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Prazo (dias)</Label>
                    <Input
                      type="number"
                      value={edit?.default_deadline_days ?? 3}
                      onChange={(e) => setEdit({ ...edit, default_deadline_days: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Switch
                    checked={edit?.active ?? true}
                    onCheckedChange={(v) => setEdit({ ...edit, active: v })}
                  />
                  <Label>Serviço Ativo no Catálogo</Label>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={save}>Salvar serviço</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Mobile View: Cards responsivos */}
      <div className="grid gap-3 sm:hidden">
        {filtered.map((s) => {
          const recurring = isRecurring(s.billing_type);
          return (
            <Card key={s.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-base text-foreground leading-snug">{s.name}</h3>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded">
                      {s.category}
                    </span>
                    {recurring ? (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs flex items-center gap-1">
                        <Repeat className="w-3 h-3" /> Mensal
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground text-xs">
                        Avulso
                      </Badge>
                    )}
                    <span className={cn("text-xs font-semibold px-1.5 py-0.5 rounded", s.active ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40" : "text-muted-foreground bg-muted")}>
                      {s.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-primary text-base">
                    {brl(s.base_price)}
                  </div>
                  <span className="text-[11px] text-muted-foreground">/{s.unit || (recurring ? "mês" : "un")}</span>
                </div>
              </div>

              {s.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 bg-muted/30 p-2 rounded">
                  {s.description}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => {
                    setEdit(s);
                    setOpen(true);
                  }}
                >
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs text-destructive hover:bg-destructive/10"
                  onClick={() => remove(s.id)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                </Button>
              </div>
            </Card>
          );
        })}
        {!filtered.length && (
          <Card className="p-8 text-center text-muted-foreground">
            <p className="font-medium text-sm">Nenhum serviço encontrado</p>
            <p className="text-xs mt-1 text-muted-foreground/80">
              {search || billingFilter !== "todos"
                ? "Tente ajustar a busca ou os filtros."
                : "Cadastre novos serviços."}
            </p>
          </Card>
        )}
      </div>

      {/* Desktop View: Tabela Tradicional */}
      <Card className="hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/60 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="text-left p-3">Serviço / Pacote</th>
                <th className="text-left p-3">Categoria</th>
                <th className="text-left p-3">Tipo de Cobrança</th>
                <th className="text-right p-3">Preço Acordado</th>
                <th className="text-center p-3">Ativo</th>
                <th className="text-right p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const recurring = isRecurring(s.billing_type);
                return (
                  <tr key={s.id} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="font-semibold text-foreground">{s.name}</div>
                      {s.description ? (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 max-w-md">
                          {s.description}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground/60 italic mt-0.5">
                          Sem detalhamento adicional
                        </p>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground font-medium">{s.category}</td>
                    <td className="p-3">
                      {recurring ? (
                        <Badge
                          variant="outline"
                          className="bg-primary/10 text-primary border-primary/30 flex items-center gap-1 w-fit"
                        >
                          <Repeat className="w-3 h-3" />
                          Assinatura Mensal
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground w-fit">
                          Avulso / Demanda
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {recurring ? (
                        <div>
                          <span className="font-mono font-bold text-primary text-base">
                            {brl(s.base_price)}
                          </span>
                          <span className="text-xs font-semibold text-primary/80 ml-1">/ mês</span>
                        </div>
                      ) : (
                        <div className="font-mono font-medium">
                          {brl(s.base_price)}
                          <span className="text-xs text-muted-foreground ml-1">/ {s.unit || "un"}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {s.active ? (
                        <span className="inline-block text-emerald-600 font-bold">✓</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Editar ${s.name}`}
                        onClick={() => {
                          setEdit(s);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Excluir ${s.name}`}
                        onClick={() => remove(s.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-muted-foreground">
                    <p className="font-medium">Nenhum serviço encontrado</p>
                    <p className="text-xs mt-1 text-muted-foreground/80">
                      {search || billingFilter !== "todos"
                        ? "Tente ajustar a busca ou os filtros acima."
                        : "Cadastre novos serviços ou importe do Excel."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
