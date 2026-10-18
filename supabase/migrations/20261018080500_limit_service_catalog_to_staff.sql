-- Keep inactive catalog entries hidden from pending self-registered accounts.
-- Public visitors continue to use the separate active-only anon policy.
DROP POLICY IF EXISTS "services_read" ON public.services;

CREATE POLICY "services_read_staff" ON public.services FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'atendente'::public.app_role)
    OR public.has_role(auth.uid(), 'producao'::public.app_role)
    OR public.has_role(auth.uid(), 'financeiro'::public.app_role)
  );
