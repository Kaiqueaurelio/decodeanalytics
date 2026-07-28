import { useMemo, useState } from "react";
import { Plus, Trash2, X, Equal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { brl } from "@/lib/format";

type Entry = { id: string; label: string; value: number };

function toNum(v: string) {
  const n = Number(String(v ?? "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function PdvCalculator({
  open,
  onOpenChange,
  onSendToCart,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSendToCart?: (total: number, description: string) => void;
}) {
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);

  const total = useMemo(() => entries.reduce((acc, e) => acc + e.value, 0), [entries]);

  function add(sign: 1 | -1) {
    const v = toNum(value);
    if (!v) return;
    setEntries((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        label: label.trim() || (sign === 1 ? "Item" : "Desconto"),
        value: v * sign,
      },
    ]);
    setLabel("");
    setValue("");
  }

  function remove(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function clearAll() {
    setEntries([]);
    setLabel("");
    setValue("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Calculadora rápida</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-muted p-4 text-right">
            <p className="text-2xs font-black uppercase tracking-widest text-muted-foreground">
              Total acumulado
            </p>
            <p className="mt-1 text-3xl font-black text-brand-blue tabular-nums">{brl(total)}</p>
          </div>

          <div className="grid gap-2">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Descrição (opcional) — ex: corte vinil"
              className="h-11 rounded-xl"
            />
            <div className="grid grid-cols-[1fr_auto_auto] gap-2">
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                inputMode="decimal"
                placeholder="0,00"
                onKeyDown={(e) => {
                  if (e.key === "Enter") add(1);
                }}
                className="h-11 rounded-xl text-right text-lg font-black"
              />
              <Button
                type="button"
                onClick={() => add(1)}
                className="h-11 rounded-xl bg-success px-3 font-black text-inverse hover:bg-success"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                onClick={() => add(-1)}
                variant="outline"
                className="h-11 rounded-xl border-destructive/30 px-3 font-black text-destructive hover:bg-destructive/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 20, 50].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() =>
                    setEntries((prev) => [
                      ...prev,
                      { id: crypto.randomUUID(), label: `R$ ${v}`, value: v },
                    ])
                  }
                  className="h-9 rounded-xl border border-border bg-card text-sm font-black text-foreground hover:border-brand-blue hover:text-brand-blue"
                >
                  +{v}
                </button>
              ))}
            </div>
          </div>

          <div className="app-scrollbar max-h-56 overflow-y-auto rounded-2xl border border-border">
            {entries.length === 0 ? (
              <div className="grid place-items-center p-8 text-center text-sm text-muted-foreground">
                <Equal className="mb-2 h-6 w-6 text-muted-foreground" />
                Adicione valores para somar.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {entries.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-2 px-3 py-2">
                    <span className="truncate text-sm font-bold text-foreground">{e.label}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`tabular-nums text-sm font-black ${
                          e.value < 0 ? "text-destructive" : "text-foreground"
                        }`}
                      >
                        {e.value < 0 ? "-" : "+"}
                        {brl(Math.abs(e.value))}
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(e.id)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={clearAll}
            disabled={!entries.length}
          >
            Limpar
          </Button>
          {onSendToCart && (
            <Button
              type="button"
              className="rounded-xl bg-brand-blue font-black hover:bg-brand-blue-light"
              disabled={total <= 0}
              onClick={() => {
                const desc =
                  entries
                    .filter((e) => e.label && e.label !== "Item")
                    .map((e) => e.label)
                    .join(" + ") || "Serviço calculado";
                onSendToCart(total, desc);
                clearAll();
                onOpenChange(false);
              }}
            >
              Enviar p/ venda — {brl(total)}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}