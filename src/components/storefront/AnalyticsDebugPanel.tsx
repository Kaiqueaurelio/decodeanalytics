import { useEffect, useMemo, useRef, useState } from "react";
import { Bug, ChevronDown, ChevronUp, Copy, Eraser, X } from "lucide-react";
import { subscribeAnalytics } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type Entry = {
  id: number;
  time: string;
  event: string;
  payload: Record<string, unknown>;
  expanded?: boolean;
};

const MAX = 100;
const STORAGE_KEY = "lp_debug_panel_open";

const EVENT_TONE: Record<string, string> = {
  landing_card_click: "bg-info/15 text-info border-info/30",
  landing_cta_click: "bg-success/15 text-success border-success/30",
  landing_infinite_page_view: "bg-warning/15 text-warning border-warning/30",
};

export function AnalyticsDebugPanel() {
  // Render só em dev.
  if (!import.meta.env.DEV) return null;

  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  });
  const [entries, setEntries] = useState<Entry[]>([]);
  const [filter, setFilter] = useState<string>("");
  const idRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return subscribeAnalytics((payload) => {
      const entry: Entry = {
        id: ++idRef.current,
        time: new Date().toLocaleTimeString(undefined, { hour12: false }),
        event: String((payload as { event?: string }).event ?? "event"),
        payload,
      };
      setEntries((prev) => {
        const next = [entry, ...prev];
        return next.length > MAX ? next.slice(0, MAX) : next;
      });
    });
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, open ? "1" : "0");
    }
  }, [open]);

  const filtered = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return entries;
    return entries.filter((e) => {
      if (e.event.toLowerCase().includes(term)) return true;
      return JSON.stringify(e.payload).toLowerCase().includes(term);
    });
  }, [entries, filter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const e of entries) c[e.event] = (c[e.event] ?? 0) + 1;
    return c;
  }, [entries]);

  const toggle = (id: number) =>
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, expanded: !e.expanded } : e)));

  const clear = () => setEntries([]);

  const copy = (payload: Record<string, unknown>) => {
    void navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-[9999] inline-flex items-center gap-2 rounded-full border border-surface-dark-soft bg-surface-dark px-3 py-2 text-xs font-semibold text-inverse shadow-xl hover:bg-surface-dark"
        aria-label="Abrir painel de analytics"
      >
        <Bug className="h-3.5 w-3.5" />
        Analytics
        {entries.length > 0 && (
          <Badge className="ml-1 h-5 min-w-5 rounded-full bg-warning px-1.5 text-[10px] font-bold text-foreground hover:bg-warning">
            {entries.length}
          </Badge>
        )}
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-4 left-4 z-[9999] flex w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-surface-dark-soft bg-surface-dark/95 text-surface-dark-foreground shadow-2xl backdrop-blur-md"
      style={{ maxHeight: "min(70vh, 640px)" }}
    >
      <header className="flex items-center gap-2 border-b border-surface-dark-soft bg-surface-dark/80 px-3 py-2">
        <Bug className="h-3.5 w-3.5 text-warning" />
        <span className="text-xs font-bold uppercase tracking-wider text-inverse">
          Analytics Debug
        </span>
        <span className="text-[10px] font-medium text-muted-foreground">dev only</span>
        <span className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:bg-surface-dark hover:text-inverse"
            onClick={clear}
            aria-label="Limpar eventos"
            title="Limpar eventos"
          >
            <Eraser className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:bg-surface-dark hover:text-inverse"
            onClick={() => setOpen(false)}
            aria-label="Fechar painel"
            title="Fechar"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </span>
      </header>

      <div className="flex flex-wrap items-center gap-1.5 border-b border-surface-dark-soft bg-surface-dark/60 px-3 py-2">
        {Object.entries(counts).length === 0 ? (
          <span className="text-[11px] text-muted-foreground">
            Aguardando eventos… interaja com a landing.
          </span>
        ) : (
          Object.entries(counts).map(([ev, n]) => (
            <span
              key={ev}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                EVENT_TONE[ev] ?? "border-surface-dark-soft bg-surface-dark text-surface-dark-foreground",
              )}
            >
              {ev}
              <span className="rounded-full bg-surface-dark/25 px-1.5 text-[10px]">{n}</span>
            </span>
          ))
        )}
      </div>

      <div className="border-b border-surface-dark-soft bg-surface-dark/40 px-3 py-2">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrar por evento, chave ou valor…"
          className="h-8 w-full rounded-md border border-surface-dark-soft bg-surface-dark px-2 text-xs text-surface-dark-foreground placeholder:text-muted-foreground focus:border-warning/30 focus:outline-none"
        />
      </div>

      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="divide-y divide-border/70">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-[11px] text-muted-foreground">
              Nenhum evento capturado ainda.
            </p>
          ) : (
            filtered.map((e) => (
              <article key={e.id} className="px-3 py-2 text-xs">
                <button
                  type="button"
                  onClick={() => toggle(e.id)}
                  className="flex w-full items-center gap-2 text-left"
                >
                  <span className="font-mono text-[10px] text-muted-foreground">{e.time}</span>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold",
                      EVENT_TONE[e.event] ?? "border-surface-dark-soft bg-surface-dark text-surface-dark-foreground",
                    )}
                  >
                    {e.event}
                  </span>
                  <span className="ml-auto text-muted-foreground">
                    {e.expanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </span>
                </button>
                <PreviewLine payload={e.payload} />
                {e.expanded && (
                  <div className="mt-2 rounded-md border border-surface-dark-soft bg-surface-dark p-2">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        dataLayer push
                      </span>
                      <button
                        type="button"
                        onClick={() => copy(e.payload)}
                        className="inline-flex items-center gap-1 rounded-md border border-surface-dark-soft bg-surface-dark px-1.5 py-0.5 text-[10px] font-semibold text-surface-dark-foreground hover:bg-surface-dark"
                      >
                        <Copy className="h-3 w-3" /> copiar
                      </button>
                    </div>
                    <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words font-mono text-[10.5px] leading-relaxed text-surface-dark-foreground">
                      {JSON.stringify(e.payload, null, 2)}
                    </pre>
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      </ScrollArea>

      <footer className="border-t border-surface-dark-soft bg-surface-dark/70 px-3 py-1.5 text-[10px] text-muted-foreground">
        {entries.length}/{MAX} eventos · window.dataLayer sincronizado
      </footer>
    </div>
  );
}

function PreviewLine({ payload }: { payload: Record<string, unknown> }) {
  const preview = useMemo(() => {
    const keys = [
      "card_id",
      "card_title",
      "cta_id",
      "cta_label",
      "section",
      "page",
      "infinite_page",
      "channel",
      "position",
    ];
    const bits: string[] = [];
    for (const k of keys) {
      const v = payload[k];
      if (v == null || v === "") continue;
      bits.push(`${k}=${typeof v === "string" ? v : JSON.stringify(v)}`);
      if (bits.length >= 3) break;
    }
    return bits.join(" · ");
  }, [payload]);
  if (!preview) return null;
  return <p className="mt-1 truncate font-mono text-[10.5px] text-muted-foreground">{preview}</p>;
}