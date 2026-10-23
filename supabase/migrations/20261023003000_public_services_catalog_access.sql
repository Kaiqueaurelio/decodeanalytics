-- Public storefront catalog should be readable by anonymous visitors while
-- protected admin screens remain restricted to authenticated staff.

-- Ensure anonymous users can read the active catalog.
GRANT SELECT ON public.services TO anon, authenticated;

-- Replace any overly restrictive default policy with explicit public catalog access.
DROP POLICY IF EXISTS "services_read" ON public.services;

CREATE POLICY "services_read_public_catalog"
  ON public.services
  FOR SELECT
  TO anon
  USING (active = true);

CREATE POLICY "services_read_authenticated"
  ON public.services
  FOR SELECT
  TO authenticated
  USING (true);

-- Keep admin write/update access intact.
CREATE POLICY "services_insert_admin"
  ON public.services
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'atendente')
  );

CREATE POLICY "services_update_admin"
  ON public.services
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'atendente')
  )
  WITH CHECK (
    public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'atendente')
  );

CREATE POLICY "services_delete_admin"
  ON public.services
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));
