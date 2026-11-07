-- ==============================================================================
-- Migration: 20261107030000_enable_user_deletion_and_cleanup.sql
-- Objetivo: Permitir exclusão completa e segura de usuários pelo administrador,
--           incluindo remoção em auth.users, public.profiles e limpeza de vínculos.
-- ==============================================================================

-- 1. Ajustar chave estrangeira de production_updates para ON DELETE SET NULL
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'production_updates_author_id_fkey'
      AND table_schema = 'public'
      AND table_name = 'production_updates'
  ) THEN
    ALTER TABLE public.production_updates DROP CONSTRAINT production_updates_author_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'production_updates'
  ) THEN
    -- Permitir que author_id seja nulo caso o autor seja excluído
    ALTER TABLE public.production_updates ALTER COLUMN author_id DROP NOT NULL;

    ALTER TABLE public.production_updates
      ADD CONSTRAINT production_updates_author_id_fkey
      FOREIGN KEY (author_id)
      REFERENCES public.profiles(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Garantir permissões de DELETE e UPDATE em public.user_roles para administradores
DROP POLICY IF EXISTS "user_roles_admin_manage" ON public.user_roles;
CREATE POLICY "user_roles_admin_manage"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

GRANT ALL ON public.user_roles TO authenticated, service_role;

-- 3. Permitir que administradores excluam registros de public.profiles
DROP POLICY IF EXISTS "profiles_admin_delete" ON public.profiles;
CREATE POLICY "profiles_admin_delete"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

GRANT DELETE ON public.profiles TO authenticated;

-- 4. Função RPC segura para excluir usuário permanentemente (auth.users + profiles + dependências)
CREATE OR REPLACE FUNCTION public.delete_user_account(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_admin_count integer := 0;
  v_user_email text;
  v_is_target_admin boolean := false;
BEGIN
  -- 1. Validação de privilégios de quem executa
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas administradores podem excluir usuários.'
      USING ERRCODE = '42501';
  END IF;

  -- 2. Impedir autoexclusão
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Por segurança, você não pode excluir a sua própria conta.'
      USING ERRCODE = '42501';
  END IF;

  -- 3. Identificar o usuário
  SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id;
  IF v_user_email IS NULL THEN
    SELECT email INTO v_user_email FROM public.profiles WHERE id = p_user_id;
  END IF;

  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado.'
      USING ERRCODE = 'P0002';
  END IF;

  -- 4. Verificar se o alvo é administrador e se é o último administrador ativo
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id
      AND role IN ('administrador'::public.app_role)
  ) INTO v_is_target_admin;

  IF NOT v_is_target_admin THEN
    SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = p_user_id
        AND role IN ('admin', 'super_admin', 'administrador')
    ) INTO v_is_target_admin;
  END IF;

  IF v_is_target_admin THEN
    -- Contar administradores ativos restantes
    SELECT count(DISTINCT user_id)::integer
      INTO v_admin_count
      FROM public.user_roles
     WHERE role = 'administrador'::public.app_role;

    IF v_admin_count <= 1 THEN
      RAISE EXCEPTION 'Não é permitido excluir o único administrador ativo do sistema.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  -- 5. Limpar vínculos antes da exclusão
  -- Desvincular author_id e assigned_to em production_updates
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'production_updates') THEN
    UPDATE public.production_updates SET author_id = NULL WHERE author_id = p_user_id;
    UPDATE public.production_updates SET assigned_to = NULL WHERE assigned_to = p_user_id;
  END IF;

  -- Desvincular atendente e criador de pedidos/orçamentos caso não tenham ON DELETE SET NULL
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    UPDATE public.orders SET attendant_id = NULL WHERE attendant_id = p_user_id;
    UPDATE public.orders SET created_by = NULL WHERE created_by = p_user_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
    UPDATE public.quotes SET attendant_id = NULL WHERE attendant_id = p_user_id;
    UPDATE public.quotes SET created_by = NULL WHERE created_by = p_user_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
    UPDATE public.clients SET created_by = NULL WHERE created_by = p_user_id;
  END IF;

  -- 6. Remover papéis do usuário
  DELETE FROM public.user_roles WHERE user_id = p_user_id;

  -- 7. Remover do perfil público
  DELETE FROM public.profiles WHERE id = p_user_id;

  -- 8. Remover do auth.users (isso encerra sessões e login permanentemente)
  DELETE FROM auth.users WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'email', v_user_email,
    'message', 'Usuário ' || v_user_email || ' foi excluído com sucesso.'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.delete_user_account(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_user_account(uuid) TO authenticated, service_role;
