import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  BookOpen,
  Activity,
  HeadphonesIcon,
  GraduationCap,
  Plus,
  Pencil,
  Trash2,
  Search,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/ella-training")({
  component: EllaTrainingPage,
});

type Scope = "admin" | "public" | "both";
type Category = "comportamento" | "atendimento" | "ensino" | "geral";

type Knowledge = {
  id: string;
  title: string;
  content: string;
  scope: Scope;
  tags: string[];
  created_at: string;
  updated_at: string;
};

const CATEGORY_META: Record<
  Category,
  { label: string; description: string; icon: typeof Activity; tone: string }
> = {
  comportamento: {
    label: "Comportamento",
    description: "Como o sistema deve agir, tom de voz, regras, limites",
    icon: Activity,
    tone: "bg-purple-100 text-purple-800",
  },
  atendimento: {
    label: "Atendimento ao cliente",
    description: "Fluxos, respostas padrão, prazos, políticas de atendimento",
    icon: HeadphonesIcon,
    tone: "bg-blue-100 text-blue-800",
  },
  ensino: {
    label: "Materiais de ensino",
    description: "Produtos, técnicas, papéis, acabamentos, conhecimento gráfico",
    icon: GraduationCap,
    tone: "bg-emerald-100 text-emerald-800",
  },
  geral: {
    label: "Geral",
    description: "Outros aprendizados salvos pelo sistema",
    icon: BookOpen,
    tone: "bg-slate-100 text-slate-800",
  },
};

const CATEGORIES: Category[] = ["comportamento", "atendimento", "ensino", "geral"];

const SCOPE_LABEL: Record<Scope, string> = {
  admin: "Interno (só admin)",
  public: "Loja pública",
  both: "Ambos",
};

function getCategory(tags: string[] | null | undefined): Category {
  const t = (tags ?? []).map((x) => x.toLowerCase());
  for (const c of CATEGORIES) if (t.includes(c)) return c;
  return "geral";
}

function EllaTrainingPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<"all" | Scope>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | Category>("all");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const emptyForm = {
    id: "",
    title: "",
    content: "",
    scope: "admin" as Scope,
    category: "comportamento" as Category,
    extraTags: "",
  };
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ["ella_knowledge"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ella_knowledge" as any)
        .select("id,title,content,scope,tags,created_at,updated_at")
        .order("updated_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as Knowledge[];
    },
  });

  const filtered = useMemo(() => {
    const rows = data ?? [];
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (scopeFilter !== "all" && r.scope !== scopeFilter) return false;
      if (categoryFilter !== "all" && getCategory(r.tags) !== categoryFilter) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.content.toLowerCase().includes(q) ||
        (r.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [data, search, scopeFilter, categoryFilter]);

  const counts = useMemo(() => {
    const rows = data ?? [];
    const c: Record<Category, number> = {
      comportamento: 0,
      atendimento: 0,
      ensino: 0,
      geral: 0,
    };
    for (const r of rows) c[getCategory(r.tags)] += 1;
    return c;
  }, [data]);

  const upsert = useMutation({
    mutationFn: async () => {
      const title = form.title.trim();
      const content = form.content.trim();
      if (!title || !content) throw new Error("Título e conteúdo são obrigatórios.");
      const extras = form.extraTags
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      const tags = Array.from(new Set([form.category, ...extras]));
      const payload = { title, content, scope: form.scope, tags };
      if (form.id) {
        const { error } = await supabase
          .from("ella_knowledge" as any)
          .update(payload)
          .eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ella_knowledge" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(form.id ? "Treinamento atualizado" : "Treinamento salvo");
      setEditOpen(false);
      setForm(emptyForm);
      qc.invalidateQueries({ queryKey: ["ella_knowledge"] });
    },
    onError: (err: any) => toast.error(err.message ?? "Falha ao salvar"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ella_knowledge" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Treinamento removido");
      setDeleteId(null);
      qc.invalidateQueries({ queryKey: ["ella_knowledge"] });
    },
    onError: (err: any) => toast.error(err.message ?? "Falha ao remover"),
  });

  function openNew(category?: Category) {
    setForm({ ...emptyForm, category: category ?? "comportamento" });
    setEditOpen(true);
  }

  function openEdit(row: Knowledge) {
    const cat = getCategory(row.tags);
    const extras = (row.tags ?? []).filter((t) => t !== cat);
    setForm({
      id: row.id,
      title: row.title,
      content: row.content,
      scope: row.scope,
      category: cat,
      extraTags: extras.join(", "),
    });
    setEditOpen(true);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Regras do Sistema (Treinamento)
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Ensine o sistema de automação. Tudo que você registrar aqui vira base de conhecimento que ele
            consulta em todo processamento inteligente — no painel e na loja pública.
          </p>
        </div>
        <Button onClick={() => openNew()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo treinamento
        </Button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {CATEGORIES.map((c) => {
          const meta = CATEGORY_META[c];
          const Icon = meta.icon;
          return (
            <Card
              key={c}
              className={cn(
                "p-4 cursor-pointer transition-colors",
                categoryFilter === c ? "ring-2 ring-primary" : "hover:bg-muted/50",
              )}
              onClick={() =>
                setCategoryFilter((prev) => (prev === c ? "all" : c))
              }
            >
              <div className="flex items-start justify-between gap-2">
                <div className={cn("rounded-lg p-2", meta.tone)}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-2xl font-black">{counts[c]}</span>
              </div>
              <div className="mt-3">
                <div className="font-semibold">{meta.label}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {meta.description}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-7 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  openNew(c);
                }}
              >
                <Plus className="h-3 w-3 mr-1" /> Adicionar
              </Button>
            </Card>
          );
        })}
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título, conteúdo ou tag..."
              className="pl-9"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-xs text-muted-foreground">Escopo</label>
            <Select value={scopeFilter} onValueChange={(v: any) => setScopeFilter(v)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="admin">Interno</SelectItem>
                <SelectItem value="public">Loja pública</SelectItem>
                <SelectItem value="both">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {categoryFilter !== "all" && (
            <Button variant="outline" onClick={() => setCategoryFilter("all")}>
              Limpar categoria
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-muted-foreground">Carregando…</div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Nenhum treinamento aqui ainda. Comece cadastrando como o sistema deve se
            comportar ou uma dica de atendimento.
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((row) => {
              const cat = getCategory(row.tags);
              const meta = CATEGORY_META[cat];
              const Icon = meta.icon;
              return (
                <Card key={row.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn("rounded-lg p-2 shrink-0", meta.tone)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{row.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          {meta.label}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {SCOPE_LABEL[row.scope]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap break-words">
                        {row.content}
                      </p>
                      {(row.tags ?? []).filter((t) => t !== cat).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {row.tags
                            .filter((t) => t !== cat)
                            .map((t) => (
                              <span
                                key={t}
                                className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                              >
                                #{t}
                              </span>
                            ))}
                        </div>
                      )}
                      <div className="mt-2 text-xs text-muted-foreground">
                        Atualizado em{" "}
                        {new Date(row.updated_at).toLocaleString("pt-BR", {
                          timeZone: "America/Sao_Paulo",
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(row)}
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(row.id)}
                        aria-label="Remover"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Editar treinamento" : "Novo treinamento"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Categoria</Label>
              <Select
                value={form.category}
                onValueChange={(v: Category) => setForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_META[c].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {CATEGORY_META[form.category].description}
              </p>
            </div>
            <div className="grid gap-2">
              <Label>Título</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ex.: Tom de voz do sistema / Política de troca / Papel Couché"
                maxLength={140}
              />
            </div>
            <div className="grid gap-2">
              <Label>Conteúdo</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="Escreva com clareza — o sistema lê tudo isso ao processar. Ex.: 'Sempre cumprimente pelo nome quando souber. Nunca prometa prazos abaixo de 3 dias úteis.'"
                rows={10}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Escopo (onde o sistema pode usar)</Label>
                <Select
                  value={form.scope}
                  onValueChange={(v: Scope) => setForm((f) => ({ ...f, scope: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Interno — só no painel</SelectItem>
                    <SelectItem value="public">Loja pública — só clientes</SelectItem>
                    <SelectItem value="both">Ambos os canais</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Tags extras (opcional)</Label>
                <Input
                  value={form.extraTags}
                  onChange={(e) => setForm((f) => ({ ...f, extraTags: e.target.value }))}
                  placeholder="separadas por vírgula"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => upsert.mutate()} disabled={upsert.isPending}>
              {upsert.isPending ? "Salvando..." : form.id ? "Salvar alterações" : "Salvar treinamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover treinamento?</AlertDialogTitle>
            <AlertDialogDescription>
              O assistente deixa de considerar este conhecimento imediatamente. Essa ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && remove.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}