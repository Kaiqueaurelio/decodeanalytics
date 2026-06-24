DROP POLICY IF EXISTS "cash_delete" ON public.cash_entries;

CREATE POLICY "cash_delete" ON public.cash_entries
FOR DELETE TO authenticated
USING (
  public.is_admin(auth.uid())
  OR public.has_role(auth.uid(), 'financeiro')
);

DROP POLICY IF EXISTS "cash_update" ON public.cash_entries;

CREATE POLICY "cash_update" ON public.cash_entries
FOR UPDATE TO authenticated
USING (
  public.is_admin(auth.uid())
  OR public.has_role(auth.uid(), 'financeiro')
)
WITH CHECK (
  public.is_admin(auth.uid())
  OR public.has_role(auth.uid(), 'financeiro')
);
