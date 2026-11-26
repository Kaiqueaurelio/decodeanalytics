-- Security hardening based on the application security review.
-- Public product/profile images remain publicly readable by design; writes are admin-only.

-- 1) The authenticated services policy previously exposed inactive/internal rows
-- to every signed-in account, including accounts awaiting approval.
DROP POLICY IF EXISTS "services_read" ON public.services;
DROP POLICY IF EXISTS "services_read_staff" ON public.services;
CREATE POLICY "services_read_staff" ON public.services
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'atendente'::public.app_role)
    OR public.has_role(auth.uid(), 'producao'::public.app_role)
    OR public.has_role(auth.uid(), 'financeiro'::public.app_role)
  );

-- Company settings must never fall back to the original unrestricted policy.
DROP POLICY IF EXISTS "cs_read" ON public.company_settings;
DROP POLICY IF EXISTS "cs_read_staff" ON public.company_settings;
CREATE POLICY "cs_read_staff" ON public.company_settings
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'atendente'::public.app_role)
    OR public.has_role(auth.uid(), 'producao'::public.app_role)
    OR public.has_role(auth.uid(), 'financeiro'::public.app_role)
  );

-- 2) Earlier bucket migrations recreated permissive write policies under
-- different names. PostgreSQL combines permissive policies with OR, so simply
-- adding a stricter policy did not remove the old access path.
DROP POLICY IF EXISTS "company_assets_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "company_assets_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "company_assets_admin_delete" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload company-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update company-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete company-assets" ON storage.objects;
DROP POLICY IF EXISTS "ca_insert_admin" ON storage.objects;
DROP POLICY IF EXISTS "ca_update_admin" ON storage.objects;
DROP POLICY IF EXISTS "ca_delete_admin" ON storage.objects;

CREATE POLICY "company_assets_admin_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'company-assets' AND public.is_admin(auth.uid()));
CREATE POLICY "company_assets_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'company-assets' AND public.is_admin(auth.uid()))
  WITH CHECK (bucket_id = 'company-assets' AND public.is_admin(auth.uid()));
CREATE POLICY "company_assets_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'company-assets' AND public.is_admin(auth.uid()));

-- The bucket is public because it currently stores public catalogue imagery and
-- profile avatars. Do not place private documents in company-assets. Public
-- SELECT is intentionally retained to avoid breaking existing public image URLs.

-- 3) is_admin(uuid) was callable for arbitrary user IDs, allowing any signed-in
-- user to enumerate administrator status. RLS callers only need to check self.
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT CASE
    WHEN auth.uid() IS NULL OR _user_id IS DISTINCT FROM auth.uid() THEN false
    ELSE
      EXISTS (
        SELECT 1
        FROM public.user_roles AS ur
        WHERE ur.user_id = auth.uid()
          AND ur.role = 'administrador'::public.app_role
      )
      OR EXISTS (
        SELECT 1
        FROM public.profiles AS p
        WHERE p.id = auth.uid()
          AND p.role IN ('admin', 'super_admin', 'administrador')
          AND COALESCE(p.is_active, true) = true
      )
  END;
$function$;

REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

-- 4) Keep the existing staff UPDATE policy for operational workflows, but
-- constrain which columns finance and production roles may change.
CREATE OR REPLACE FUNCTION public.guard_order_sensitive_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_is_admin boolean := false;
  v_is_attendant boolean := false;
  v_is_finance boolean := false;
  v_is_production boolean := false;
BEGIN
  -- Trusted server-side maintenance and SECURITY DEFINER workflows (e.g.
  -- public art-review RPCs) retain their existing controlled behavior.
  IF current_user IN ('postgres', 'service_role', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória para alterar ordens.'
      USING ERRCODE = '42501';
  END IF;

  v_is_admin := public.is_admin(v_user_id);
  v_is_attendant := public.has_role(v_user_id, 'atendente'::public.app_role);
  v_is_finance := public.has_role(v_user_id, 'financeiro'::public.app_role);
  v_is_production := public.has_role(v_user_id, 'producao'::public.app_role);

  IF v_is_admin OR v_is_attendant THEN
    RETURN NEW;
  END IF;

  IF v_is_finance THEN
    IF (to_jsonb(NEW) - ARRAY['paid', 'payment_method', 'payment_status', 'updated_at'])
       IS DISTINCT FROM
       (to_jsonb(OLD) - ARRAY['paid', 'payment_method', 'payment_status', 'updated_at']) THEN
      RAISE EXCEPTION 'O perfil financeiro só pode alterar dados de pagamento; totais e dados da ordem exigem atendimento ou administração.'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF v_is_production THEN
    IF (to_jsonb(NEW) - ARRAY[
          'production_status', 'current_activity', 'progress',
          'last_progress_at', 'assigned_to', 'technical_data',
          'technical_status', 'completed_at', 'warranty_notes', 'updated_at'
        ])
       IS DISTINCT FROM
       (to_jsonb(OLD) - ARRAY[
          'production_status', 'current_activity', 'progress',
          'last_progress_at', 'assigned_to', 'technical_data',
          'technical_status', 'completed_at', 'warranty_notes', 'updated_at'
        ]) THEN
      RAISE EXCEPTION 'O perfil de produção só pode alterar dados técnicos e de andamento; valores e pagamentos exigem atendimento, financeiro ou administração.'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Seu perfil não tem permissão para alterar esta ordem.'
    USING ERRCODE = '42501';
END;
$function$;

REVOKE ALL ON FUNCTION public.guard_order_sensitive_updates() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_guard_order_sensitive_updates ON public.orders;
CREATE TRIGGER trg_guard_order_sensitive_updates
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_order_sensitive_updates();
