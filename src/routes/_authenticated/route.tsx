import { useEffect, useState } from "react";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

/**
 * O guard roda no cliente, DEPOIS da hidratação.
 *
 * Fazer `throw redirect()` em `beforeLoad` trocava o match renderizado
 * (`/_authenticated/*` -> `/auth`) enquanto o React ainda hidratava o HTML
 * do servidor, gerando "Hydration failed" e caindo no errorComponent raiz
 * ("This page didn't load"). Renderizando um fallback estável e navegando
 * apenas dentro de useEffect, servidor e cliente concordam no primeiro render.
 */
function AuthenticatedLayout() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let active = true;

    const goToAuth = () => {
      if (active) navigate({ to: "/auth", replace: true });
    };

    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data.user) {
          goToAuth();
          return;
        }
        setAuthorized(true);
      })
      .catch((error) => {
        console.error("[auth-guard] falha ao validar a sessão", error);
        goToAuth();
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setAuthorized(false);
        goToAuth();
      }
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [navigate]);

  if (!authorized) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-background"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Verificando sua sessão…</span>
      </div>
    );
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}