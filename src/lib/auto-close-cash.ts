import { supabase } from "@/integrations/supabase/client";

// Local date helpers (Brazil timezone offset already handled by system clock)
function toIsoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(iso: string, n: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return toIsoDate(d);
}

function methodKey(pm: string | null | undefined): "cash" | "pix" | "debit" | "credit" | "other" {
  const m = String(pm || "").toLowerCase();
  if (m.includes("dinheiro")) return "cash";
  if (m.includes("pix")) return "pix";
  if (m.includes("déb") || m.includes("deb")) return "debit";
  if (m.includes("créd") || m.includes("cred")) return "credit";
  return "other";
}

type DayBucket = {
  total_in: number;
  total_out: number;
  by_method: Record<string, number>;
  entries_count: number;
};

/**
 * Fecha automaticamente todos os dias anteriores a hoje que ainda não têm
 * fechamento persistido, garantindo histórico sequencial no /closures.
 * Idempotente: só insere se a data ainda não foi fechada.
 */
export async function autoCloseMissingDays(): Promise<number> {
  const todayIso = toIsoDate(new Date());
  const yesterdayIso = addDays(todayIso, -1);

  // Reference start: dia após o último fechamento OU primeira entrada.
  const { data: lastClosure } = await supabase
    .from("cash_closures" as any)
    .select("closure_date")
    .order("closure_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  let startDate: string | null = null;
  if (lastClosure?.closure_date) {
    startDate = addDays(lastClosure.closure_date as string, 1);
  } else {
    const { data: firstEntry } = await supabase
      .from("cash_entries")
      .select("entry_date")
      .order("entry_date", { ascending: true })
      .limit(1)
      .maybeSingle();
    startDate = (firstEntry?.entry_date as string) || null;
  }

  if (!startDate || startDate > yesterdayIso) return 0;

  // Limita janela para no máximo 90 dias para não gerar histórico gigante.
  const capStart = addDays(yesterdayIso, -90);
  if (startDate < capStart) startDate = capStart;

  // Dias já fechados na janela (pode acontecer se o app foi aberto por vários usuários).
  const { data: existing } = await supabase
    .from("cash_closures" as any)
    .select("closure_date")
    .gte("closure_date", startDate)
    .lte("closure_date", yesterdayIso);
  const closed = new Set<string>((existing ?? []).map((r: any) => r.closure_date));

  // Movimento por dia na janela.
  const { data: entries } = await supabase
    .from("cash_entries")
    .select("entry_date, type, amount, payment_method")
    .gte("entry_date", startDate)
    .lte("entry_date", yesterdayIso);

  const days = new Map<string, DayBucket>();
  (entries ?? []).forEach((e: any) => {
    const d = e.entry_date as string;
    let b = days.get(d);
    if (!b) {
      b = { total_in: 0, total_out: 0, by_method: { cash: 0, pix: 0, debit: 0, credit: 0, other: 0 }, entries_count: 0 };
      days.set(d, b);
    }
    const amt = Number(e.amount || 0);
    b.entries_count += 1;
    if (e.type === "saida") {
      b.total_out += amt;
    } else {
      b.total_in += amt;
      const k = methodKey(e.payment_method);
      b.by_method[k] = (b.by_method[k] || 0) + amt;
    }
  });

  const rows: any[] = [];
  for (let d = startDate; d <= yesterdayIso; d = addDays(d, 1)) {
    if (closed.has(d)) continue;
    const b: DayBucket =
      days.get(d) ?? {
        total_in: 0,
        total_out: 0,
        by_method: { cash: 0, pix: 0, debit: 0, credit: 0, other: 0 },
        entries_count: 0,
      };
    const cashExpected = b.by_method.cash || 0;
    rows.push({
      closure_date: d,
      operator: "Automático",
      initial_amount: 0,
      expected_cash: cashExpected,
      counted_cash: cashExpected,
      difference: 0,
      total_in: b.total_in,
      total_out: b.total_out,
      by_method: b.by_method,
      entries_count: b.entries_count,
      notes: b.entries_count === 0 ? "Fechamento automático — sem movimento" : "Fechamento automático de fim de dia",
    });
  }

  if (!rows.length) return 0;

  const { error } = await supabase.from("cash_closures" as any).insert(rows);
  if (error) {
    console.error("[autoCloseMissingDays] insert failed", error);
    return 0;
  }
  return rows.length;
}