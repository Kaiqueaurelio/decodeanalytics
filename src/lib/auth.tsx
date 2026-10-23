import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { hasAdministratorAccess } from "@/lib/access";

export type AppRole =
  | "administrador"
  | "admin"
  | "super_admin"
  | "atendente"
  | "producao"
  | "financeiro"
  | "vendedor"
  | "aguardando_aprovacao"
  | "viewer";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  loading: boolean;
  signOut: () => Promise<void>;
  hasRole: (...r: AppRole[]) => boolean;
  isAdmin: boolean;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let roleRequest = 0;
    let deferredLoad: ReturnType<typeof setTimeout> | undefined;

    async function loadRoles(userId: string) {
      const requestId = ++roleRequest;
      setLoading(true);
      try {
        // The connected production schema stores the account role in profiles.role.
        const { data, error } = await supabase
          .from("profiles")
          .select("role,is_active")
          .eq("id", userId)
          .maybeSingle();
        if (!active || requestId !== roleRequest) return;
        if (!error && data && data.is_active !== false && data.role) {
          setRoles([data.role as AppRole]);
          return;
        }

        // Compatibility fallback for deployments whose role data is in user_roles.
        // The database still decides access; no role is inferred from the email.
        if (error) {
          console.error("[Auth] Falha ao consultar profiles.role; tentando user_roles.", error);
        }
        const { data: roleRows, error: roleError } = await (supabase as any)
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);
        if (!active || requestId !== roleRequest) return;
        if (roleError) {
          console.error("[Auth] Não foi possível carregar user_roles.", roleError);
          setRoles([]);
          return;
        }
        const validRoles = (roleRows ?? [])
          .map((row: { role?: string }) => row.role)
          .filter((role: string | undefined): role is AppRole =>
            Boolean(role && [
              "administrador", "admin", "super_admin", "atendente",
              "producao", "financeiro", "vendedor", "aguardando_aprovacao", "viewer"
            ].includes(role))
          );
        setRoles(validRoles);
      } catch (error) {
        if (!active || requestId !== roleRequest) return;
        console.error("[Auth] Falha inesperada ao carregar os papéis do usuário.", error);
        setRoles([]);
      } finally {
        if (active && requestId === roleRequest) setLoading(false);
      }
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setRoles([]);
      if (deferredLoad) clearTimeout(deferredLoad);
      if (nextSession?.user) {
        deferredLoad = setTimeout(() => {
          void loadRoles(nextSession.user.id);
        }, 0);
      } else {
        roleRequest += 1;
        setLoading(false);
      }
    });

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error("[Auth] Não foi possível recuperar a sessão.", error);
          setSession(null);
          setRoles([]);
          setLoading(false);
          return;
        }
        setSession(data.session);
        if (data.session?.user) {
          void loadRoles(data.session.user.id);
        } else {
          setRoles([]);
          setLoading(false);
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.error("[Auth] Falha inesperada ao recuperar a sessão.", error);
        setSession(null);
        setRoles([]);
        setLoading(false);
      });

    return () => {
      active = false;
      roleRequest += 1;
      if (deferredLoad) clearTimeout(deferredLoad);
      sub.subscription.unsubscribe();
    };
  }, []);

  const value: AuthCtx = {
    user: session?.user ?? null,
    session,
    roles,
    loading,
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    hasRole: (...r) => r.some((x) => roles.includes(x)),
    isAdmin: hasAdministratorAccess(roles),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export const ROLE_LABEL: Record<AppRole, string> = {
  administrador: "Administrador",
  admin: "Administrador",
  super_admin: "Administrador",
  atendente: "Atendente",
  producao: "Produção",
  financeiro: "Financeiro",
  vendedor: "Vendedor",
  aguardando_aprovacao: "Aguardando aprovação",
  viewer: "Somente leitura",
};
