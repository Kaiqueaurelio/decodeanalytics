-- 1) cash_closures: restringir a admin/financeiro
DROP POLICY IF EXISTS "auth read cash_closures" ON public.cash_closures;
DROP POLICY IF EXISTS "auth insert cash_closures" ON public.cash_closures;
DROP POLICY IF EXISTS "auth update cash_closures" ON public.cash_closures;
DROP POLICY IF EXISTS "auth delete cash_closures" ON public.cash_closures;

CREATE POLICY "cc_read" ON public.cash_closures FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'financeiro'::app_role));
CREATE POLICY "cc_insert" ON public.cash_closures FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'financeiro'::app_role));
CREATE POLICY "cc_update" ON public.cash_closures FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'financeiro'::app_role))
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'financeiro'::app_role));
CREATE POLICY "cc_delete" ON public.cash_closures FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- 2) production_updates: leitura restrita a staff, inserção exige author_id = auth.uid()
DROP POLICY IF EXISTS "Authenticated insert production updates" ON public.production_updates;
DROP POLICY IF EXISTS "Authenticated read production updates" ON public.production_updates;

CREATE POLICY "pu_read" ON public.production_updates FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'atendente'::app_role)
    OR public.has_role(auth.uid(), 'producao'::app_role)
    OR public.has_role(auth.uid(), 'financeiro'::app_role)
  );

CREATE POLICY "pu_insert" ON public.production_updates FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND (
      public.is_admin(auth.uid())
      OR public.has_role(auth.uid(), 'atendente'::app_role)
      OR public.has_role(auth.uid(), 'producao'::app_role)
    )
  );

-- 3) ella_knowledge: autenticado só lê public/both, interno só admin
DROP POLICY IF EXISTS "ella_kb_auth_read" ON public.ella_knowledge;
CREATE POLICY "ella_kb_auth_read" ON public.ella_knowledge FOR SELECT TO authenticated
  USING (
    scope = ANY (ARRAY['public'::ella_scope, 'both'::ella_scope])
    OR public.is_admin(auth.uid())
  );

-- 4) Storage: bucket `arquivos`
DROP POLICY IF EXISTS "arquivos_read" ON storage.objects;
DROP POLICY IF EXISTS "arquivos_insert" ON storage.objects;
DROP POLICY IF EXISTS "arquivos_update" ON storage.objects;
DROP POLICY IF EXISTS "arquivos_delete" ON storage.objects;

CREATE POLICY "arquivos_read" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'arquivos'
    AND (
      public.is_admin(auth.uid())
      OR public.has_role(auth.uid(), 'atendente'::app_role)
      OR public.has_role(auth.uid(), 'financeiro'::app_role)
      OR public.has_role(auth.uid(), 'producao'::app_role)
    )
  );
CREATE POLICY "arquivos_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'arquivos'
    AND (
      public.is_admin(auth.uid())
      OR public.has_role(auth.uid(), 'atendente'::app_role)
      OR public.has_role(auth.uid(), 'producao'::app_role)
    )
  );
CREATE POLICY "arquivos_update" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'arquivos'
    AND (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'atendente'::app_role))
  )
  WITH CHECK (
    bucket_id = 'arquivos'
    AND (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'atendente'::app_role))
  );
CREATE POLICY "arquivos_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'arquivos' AND public.is_admin(auth.uid()));

-- 5) Storage: bucket `briefing-files`
DROP POLICY IF EXISTS "Auth read briefing-files" ON storage.objects;
DROP POLICY IF EXISTS "Auth write briefing-files" ON storage.objects;
DROP POLICY IF EXISTS "Auth update briefing-files" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete briefing-files" ON storage.objects;

CREATE POLICY "briefing_read" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'briefing-files'
    AND (
      public.is_admin(auth.uid())
      OR public.has_role(auth.uid(), 'atendente'::app_role)
      OR public.has_role(auth.uid(), 'producao'::app_role)
    )
  );
CREATE POLICY "briefing_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'briefing-files'
    AND (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'atendente'::app_role))
  );
CREATE POLICY "briefing_update" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'briefing-files'
    AND (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'atendente'::app_role))
  )
  WITH CHECK (
    bucket_id = 'briefing-files'
    AND (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'atendente'::app_role))
  );
CREATE POLICY "briefing_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'briefing-files' AND public.is_admin(auth.uid()));

-- 6) Storage: bucket `company-assets` — leitura pública, escrita apenas admin
DROP POLICY IF EXISTS "Authenticated upload company-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update company-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete company-assets" ON storage.objects;

CREATE POLICY "ca_insert_admin" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'company-assets' AND public.is_admin(auth.uid()));
CREATE POLICY "ca_update_admin" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'company-assets' AND public.is_admin(auth.uid()))
  WITH CHECK (bucket_id = 'company-assets' AND public.is_admin(auth.uid()));
CREATE POLICY "ca_delete_admin" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'company-assets' AND public.is_admin(auth.uid()));

-- 7) SECURITY DEFINER: remover EXECUTE de usuários finais em triggers/handlers
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_order_from_production_update() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_order_receivable_after() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_order_payment_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- has_role / is_admin são usados nas RLS -> autenticados precisam executar
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

-- 8) replace_order_items: checar papel dentro da função (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.replace_order_items(_order_id uuid, _items jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'atendente'::app_role)
  ) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE id = _order_id) THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  DELETE FROM public.order_items WHERE order_id = _order_id;
  INSERT INTO public.order_items (order_id, description, quantity, unit_price, subtotal, service_id)
  SELECT
    _order_id,
    (i->>'description')::text,
    COALESCE((i->>'quantity')::numeric, 0),
    COALESCE((i->>'unit_price')::numeric, 0),
    COALESCE((i->>'subtotal')::numeric, 0),
    NULLIF(i->>'service_id','')::uuid
  FROM jsonb_array_elements(_items) AS i;
END;
$function$;

REVOKE ALL ON FUNCTION public.replace_order_items(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.replace_order_items(uuid, jsonb) TO authenticated, service_role;