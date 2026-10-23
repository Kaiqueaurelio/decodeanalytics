-- The live Decode Analytics project stores authorization in profiles.role.
-- Enforce a single source of truth and prevent profile self-promotion through the Data API.

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles AS p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('admin', 'super_admin')
      AND COALESCE(p.is_active, true) = true
  );
$function$;

CREATE OR REPLACE FUNCTION public.current_user_can_view_all_profiles()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles AS p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('admin', 'super_admin', 'viewer')
      AND COALESCE(p.is_active, true) = true
  );
$function$;

-- RLS does not protect against TRUNCATE and cannot substitute for table grants.
-- The browser only needs profile reads; all privilege changes go through an RPC.
REVOKE ALL PRIVILEGES ON TABLE public.profiles FROM anon, authenticated;
GRANT SELECT ON TABLE public.profiles TO authenticated;

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

REVOKE ALL ON FUNCTION public.current_user_is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated;
REVOKE ALL ON FUNCTION public.current_user_can_view_all_profiles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_can_view_all_profiles() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_profile_access(
  _user_id uuid,
  _role text,
  _is_active boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_role text := lower(btrim(COALESCE(_role, '')));
  v_old_role text;
  v_old_active boolean;
  v_admin_count integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.current_user_is_admin() THEN
    RAISE EXCEPTION 'Apenas um administrador ativo pode gerenciar acessos.'
      USING ERRCODE = '42501';
  END IF;

  IF _user_id IS NULL OR _is_active IS NULL THEN
    RAISE EXCEPTION 'Usuário e status de acesso são obrigatórios.'
      USING ERRCODE = '22023';
  END IF;

  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'Por segurança, não é permitido alterar o próprio acesso.'
      USING ERRCODE = '42501';
  END IF;

  -- Preserve compatibility with the old display label without storing a second admin role.
  IF v_role = 'administrador' THEN
    v_role := 'admin';
  END IF;

  IF v_role NOT IN (
    'admin', 'super_admin', 'atendente', 'producao', 'financeiro',
    'vendedor', 'viewer', 'user', 'aguardando_aprovacao'
  ) THEN
    RAISE EXCEPTION 'Cargo inválido.'
      USING ERRCODE = '22023';
  END IF;

  -- Serialize access changes so two concurrent requests cannot remove the last administrator.
  PERFORM pg_catalog.pg_advisory_xact_lock(20261023, 501);

  SELECT p.role, COALESCE(p.is_active, true)
    INTO v_old_role, v_old_active
    FROM public.profiles AS p
   WHERE p.id = _user_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil não encontrado.'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_old_role IN ('admin', 'super_admin')
     AND v_old_active
     AND (v_role NOT IN ('admin', 'super_admin') OR NOT _is_active) THEN
    SELECT count(*)::integer
      INTO v_admin_count
      FROM public.profiles AS p
     WHERE p.role IN ('admin', 'super_admin')
       AND COALESCE(p.is_active, true) = true;

    IF v_admin_count <= 1 THEN
      RAISE EXCEPTION 'Não é possível remover ou desativar o último administrador ativo.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  UPDATE public.profiles
     SET role = v_role,
         is_active = _is_active
   WHERE id = _user_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_update_profile_access(uuid, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_profile_access(uuid, text, boolean) TO authenticated;

-- This function is a trigger target, not a public RPC endpoint.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
