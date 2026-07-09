import { Link, useRouterState } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import ellaAvatar from "@/assets/ella-avatar.png";
import { cn } from "@/lib/utils";

/**
 * Botão flutuante (FAB) que leva administradores direto para a Ella.
 * - Aparece apenas para admins.
 * - Oculto quando o usuário já está na rota /ella.
 * - Canto inferior direito, acima da bottom bar em mobile.
 */
export function EllaFab() {
  const { isAdmin } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });

  if (!isAdmin) return null;
  if (path.startsWith("/ella")) return null;

  return (
    <Link
      to="/ella"
      aria-label="Abrir Ella — assistente de IA"
      title="Perguntar à Ella"
      className={cn(
        "group fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full",
        "bg-brand-blue/95 pl-1.5 pr-4 py-1.5 text-white shadow-2xl ring-2 ring-brand-yellow/70",
        "backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_60px_-10px_rgba(23,37,84,0.55)]",
        "animate-fade-in md:bottom-6 md:right-6",
      )}
    >
      <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-2 ring-brand-yellow">
        <img
          src={ellaAvatar}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <span
          aria-hidden
          className="absolute inset-0 rounded-full ring-2 ring-brand-yellow/60 animate-[soft-pulse_2.4s_ease-in-out_infinite]"
        />
      </span>
      <span className="hidden pr-1 text-left leading-tight sm:block">
        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-yellow">
          <Sparkles className="h-3 w-3" /> IA
        </span>
        <span className="block text-sm font-extrabold">Perguntar à Ella</span>
      </span>
    </Link>
  );
}