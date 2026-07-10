
DROP POLICY IF EXISTS "authenticated can read sandbox runs" ON public.ella_sandbox_runs;

CREATE POLICY "owner or admin can read sandbox runs"
  ON public.ella_sandbox_runs FOR SELECT
  TO authenticated
  USING (
    auth.uid() = created_by
    OR public.has_role(auth.uid(), 'administrador'::app_role)
  );
