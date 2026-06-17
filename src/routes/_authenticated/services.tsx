import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FileSpreadsheet, Download, Upload } from "lucide-react";
import { brl, SERVICE_CATEGORIES } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/services")({ component: ServicesPage });

type S = { id: string; name: string; category: string; description: string | null; base_price: number; unit: string | null; default_deadline_days: number | null; active: boolean };

function ServicesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Partial<S> | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const { data } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").order("name");
      if (error) throw error; return data as S[];
    },
  });

  async function save() {
    if (!edit?.name || !edit.category) return toast.error("Nome e categoria são obrigatórios");
    const payload = {
      name: edit.name, category: edit.category, description: edit.description || null,
      base_price: Number(edit.base_price) || 0, unit: edit.unit || "un",
      default_deadline_days: Number(edit.default_deadline_days) || 3,
      active: edit.active ?? true,
    };
    const res = edit.id
      ? await supabase.from("services").update(payload).eq("id", edit.id)
      : await supabase.from("services").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Salvo"); setOpen(false); setEdit(null);
    qc.invalidateQueries({ queryKey: ["services"] });
  }

  async function remove(id: string) {
    if (!confirm("Excluir serviço?")) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["services"] });
  }

  function downloadTemplate() {
    const ws = XLSX.utils.json_to_sheet([
      { name: "Cartão de visita 4x4", category: "Cartões", description: "Couché 300g", base_price: 80, unit: "milheiro", default_deadline_days: 3, active: true },
      { name: "Banner Lona 440g", category: "Banners", description: "Impressão digital", base_price: 60, unit: "m²", default_deadline_days: 2, active: true },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produtos");
    XLSX.writeFile(wb, "modelo-produtos-alcateia.xlsx");
  }

  function exportCurrent() {
    const rows = (data ?? []).map((s) => ({
      name: s.name,
      category: s.category,
      description: s.description ?? "",
      base_price: Number(s.base_price) || 0,
      unit: s.unit ?? "un",
      default_deadline_days: s.default_deadline_days ?? 3,
      active: s.active,
    }));
    if (!rows.length) return toast.error("Nenhum produto para exportar");
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produtos");
    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `produtos-alcateia-${stamp}.xlsx`);
    toast.success(`${rows.length} produto(s) exportado(s)`);
  }

  async function handleImportFile(file: File) {
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });
      if (!rows.length) { toast.error("Planilha vazia"); return; }
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
          return {
            name,
            category,
            description: String(get("description", "descrição", "descricao") ?? "") || null,
            base_price: Number(rawPrice) || 0,
            unit: String(get("unit", "unidade") ?? "un") || "un",
            default_deadline_days: Number(get("default_deadline_days", "prazo", "dias")) || 3,
            active: String(get("active", "ativo") ?? "true").toLowerCase() !== "false",
          };
        })
        .filter(Boolean) as any[];
      if (!payload.length) { toast.error("Nenhuma linha válida (precisa coluna 'nome')."); return; }
      const { error } = await supabase.from("services").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success(`${payload.length} produto(s) importado(s)`);
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
      <div className="flex flex-wrap justify-end gap-2">
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
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="w-4 h-4 mr-1" /> Modelo Excel
        </Button>
        <Button variant="outline" onClick={exportCurrent}>
          <Upload className="w-4 h-4 mr-1" /> Exportar Excel
        </Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={importing}>
          <FileSpreadsheet className="w-4 h-4 mr-1" /> {importing ? "Importando..." : "Importar Excel"}
        </Button>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEdit(null); }}>
          <DialogTrigger asChild><Button onClick={() => setEdit({ active: true })}><Plus className="w-4 h-4 mr-1" /> Novo serviço</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{edit?.id ? "Editar" : "Novo"} serviço</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome *</Label><Input value={edit?.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></div>
              <div><Label>Categoria *</Label>
                <Select value={edit?.category ?? ""} onValueChange={(v) => setEdit({ ...edit, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{SERVICE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Descrição</Label><Textarea value={edit?.description ?? ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label>Preço</Label><Input type="number" step="0.01" value={edit?.base_price ?? ""} onChange={(e) => setEdit({ ...edit, base_price: Number(e.target.value) })} /></div>
                <div><Label>Unidade</Label><Input value={edit?.unit ?? "un"} onChange={(e) => setEdit({ ...edit, unit: e.target.value })} /></div>
                <div><Label>Prazo (dias)</Label><Input type="number" value={edit?.default_deadline_days ?? 3} onChange={(e) => setEdit({ ...edit, default_deadline_days: Number(e.target.value) })} /></div>
              </div>
              <div className="flex items-center gap-2"><Switch checked={edit?.active ?? true} onCheckedChange={(v) => setEdit({ ...edit, active: v })} /><Label>Ativo</Label></div>
            </div>
            <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground"><tr><th className="text-left p-3">Serviço</th><th className="text-left p-3">Categoria</th><th className="text-right p-3">Preço</th><th className="text-center p-3">Ativo</th><th></th></tr></thead>
            <tbody>
              {(data ?? []).map((s) => (
                <tr key={s.id} className="border-t hover:bg-muted/30">
                  <td className="p-3 font-medium">{s.name}</td>
                  <td className="p-3 text-muted-foreground">{s.category}</td>
                  <td className="p-3 text-right font-mono">{brl(s.base_price)}</td>
                  <td className="p-3 text-center">{s.active ? "✓" : "—"}</td>
                  <td className="p-3 text-right">
                    <Button size="icon" variant="ghost" onClick={() => { setEdit(s); setOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
              {!data?.length && (<tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum serviço cadastrado</td></tr>)}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}