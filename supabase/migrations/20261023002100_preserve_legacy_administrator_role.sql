-- Keep legacy administrator profiles fully authorized in the live schema.
-- The earlier hardening migration used only admin/super_admin aliases, while
-- existing production profiles can still store the legacy value 'administrador'.

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
      AND p.role IN ('admin', 'super_admin', 'administrador')
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
      AND p.role IN ('admin', 'super_admin', 'administrador', 'viewer')
      AND COALESCE(p.is_active, true) = true
  );
$function$;

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
  v_actor_role text;
  v_old_role text;
  v_old_active boolean;
  v_admin_count integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.current_user_is_admin() THEN
    RAISE EXCEPTION 'Apenas um administrador ativo pode gerenciar acessos.'
      USING ERRCODE = '42501';
  END IF;

  SELECT p.role
    INTO v_actor_role
    FROM public.profiles AS p
   WHERE p.id = (SELECT auth.uid())
     AND COALESCE(p.is_active, true) = true;

  IF _user_id IS NULL OR _is_active IS NULL THEN
    RAISE EXCEPTION 'Usuário e status de acesso são obrigatórios.'
      USING ERRCODE = '22023';
  END IF;

  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'Por segurança, não é permitido alterar o próprio acesso.'
      USING ERRCODE = '42501';
  END IF;

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

  IF v_actor_role <> 'super_admin'
     AND (v_role = 'super_admin' OR v_old_role = 'super_admin') THEN
    RAISE EXCEPTION 'Somente um super administrador pode conceder ou alterar o cargo de super administrador.'
      USING ERRCODE = '42501';
  END IF;

  IF v_old_role IN ('admin', 'super_admin', 'administrador')
     AND v_old_active
     AND (v_role NOT IN ('admin', 'super_admin') OR NOT _is_active) THEN
    SELECT count(*)::integer
      INTO v_admin_count
      FROM public.profiles AS p
     WHERE p.role IN ('admin', 'super_admin', 'administrador')
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
