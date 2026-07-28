DROP POLICY IF EXISTS clients_update ON public.clients;
CREATE POLICY clients_update ON public.clients
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'atendente'::app_role))
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'atendente'::app_role));

DROP POLICY IF EXISTS orders_update ON public.orders;
CREATE POLICY orders_update ON public.orders
  FOR UPDATE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'atendente'::app_role)
    OR public.has_role(auth.uid(), 'producao'::app_role)
    OR public.has_role(auth.uid(), 'financeiro'::app_role)
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'atendente'::app_role)
    OR public.has_role(auth.uid(), 'producao'::app_role)
    OR public.has_role(auth.uid(), 'financeiro'::app_role)
  );

DROP POLICY IF EXISTS cash_update ON public.cash_entries;
CREATE POLICY cash_update ON public.cash_entries
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'financeiro'::app_role))
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'financeiro'::app_role));