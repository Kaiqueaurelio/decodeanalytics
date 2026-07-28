import { useMemo } from "react";
import { Bell } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Notification = {
  id: string;
  title: string;
  detail: string;
  to: string;
  tone: "warning" | "danger" | "info";
};

export function NotificationsBell() {
  const { data } = useQuery({
    queryKey: ["notifications-bell"],
    queryFn: async () => {
      const [ordersRes, receivablesRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id,number,title,production_status,deadline,assigned_to, clients(name)")
          .order("updated_at", { ascending: false })
          .limit(50),
        supabase
          .from("receivables")
          .select("id,amount,status,due_date,description")
          .neq("status", "pago")
          .order("due_date", { ascending: true })
          .limit(50),
      ]);
      return {
        orders: (ordersRes.data ?? []) as any[],
        receivables: (receivablesRes.data ?? []) as any[],
      };
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const notifications = useMemo<Notification[]>(() => {
    const list: Notification[] = [];
    const now = new Date();
    const orders = data?.orders ?? [];
    for (const o of orders) {
      if (["entregue", "cancelado"].includes(o.production_status)) continue;
      if (o.deadline && new Date(`${o.deadline}T23:59:59`) < now) {
        list.push({
          id: `order-late-${o.id}`,
          title: `OS #${o.number ?? "—"} em atraso`,
          detail: o.clients?.name ? `${o.clients.name} · ${o.title ?? ""}` : (o.title ?? "Prazo vencido"),
          to: "/orders",
          tone: "danger",
        });
      } else if (o.production_status === "pronto_para_retirada") {
        list.push({
          id: `order-ready-${o.id}`,
          title: `OS #${o.number ?? "—"} pronta para retirada`,
          detail: o.clients?.name ?? o.title ?? "Aguardando cliente",
          to: "/orders",
          tone: "info",
        });
      } else if (!o.assigned_to) {
        list.push({
          id: `order-unassigned-${o.id}`,
          title: `OS #${o.number ?? "—"} sem responsável`,
          detail: o.title ?? "Atribua um responsável",
          to: "/orders",
          tone: "warning",
        });
      }
    }
    const receivables = data?.receivables ?? [];
    for (const r of receivables) {
      if (r.due_date && new Date(`${r.due_date}T23:59:59`) < now) {
        list.push({
          id: `rec-${r.id}`,
          title: "A receber vencido",
          detail: `${r.description ?? "Recebível"} · R$ ${Number(r.amount ?? 0).toFixed(2)}`,
          to: "/receivables",
          tone: "danger",
        });
      }
    }
    return list.slice(0, 20);
  }, [data]);

  const count = notifications.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative hidden rounded-xl border border-border bg-card p-2.5 text-brand-blue shadow-sm transition-colors hover:bg-muted sm:block"
          aria-label="Notificações"
        >
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-brand-orange px-1 text-2xs font-black text-inverse ring-2 ring-inverse">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-black">Notificações</p>
          <p className="text-xs text-muted-foreground">
            {count > 0 ? `${count} alerta${count > 1 ? "s" : ""}` : "Nenhum alerta no momento"}
          </p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Tudo em dia por aqui. 🎉
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n) => (
                <li key={n.id}>
                  <Link
                    to={n.to}
                    className="flex items-start gap-2 px-4 py-3 hover:bg-muted"
                  >
                    <span
                      className={
                        "mt-1 h-2 w-2 shrink-0 rounded-full " +
                        (n.tone === "danger"
                          ? "bg-destructive"
                          : n.tone === "warning"
                            ? "bg-brand-orange"
                            : "bg-brand-blue")
                      }
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{n.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{n.detail}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}