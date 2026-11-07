-- Migration: Fix client deletion and cascading foreign keys, active and archived_at columns
-- Resolve o erro "update or delete on table clients violates foreign key constraint receivables_client_id_fkey on table receivables"

-- 1. Assegurar que as colunas active e archived_at existam em public.clients
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_clients_active
  ON public.clients (active);

CREATE INDEX IF NOT EXISTS idx_clients_archived_at
  ON public.clients (archived_at);

-- 2. Garantir compatibilidade de sobrecarga para public.has_role em ambas as ordens de parâmetro:
-- has_role(uuid, app_role) e has_role(app_role, uuid)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = _user_id
     AND EXISTS (
       SELECT 1
         FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
     );
$$;

CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = _user_id
     AND EXISTS (
       SELECT 1
         FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
     );
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role, uuid) TO authenticated, service_role;

-- 3. Atualizar foreign key de receivables para ON DELETE CASCADE
-- Quando o administrador ou sistema remove um cliente (ou exclui em lote),
-- as contas a receber associadas a esse cliente são removidas automaticamente,
-- sem travar ou violar a constraint "receivables_client_id_fkey".
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'receivables_client_id_fkey'
      AND table_schema = 'public'
      AND table_name = 'receivables'
  ) THEN
    ALTER TABLE public.receivables DROP CONSTRAINT receivables_client_id_fkey;
  END IF;

  ALTER TABLE public.receivables
    ADD CONSTRAINT receivables_client_id_fkey
    FOREIGN KEY (client_id)
    REFERENCES public.clients(id)
    ON DELETE CASCADE;
END $$;

-- 4. Atualizar foreign key de orders para ON DELETE CASCADE quando necessário
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'orders_client_id_fkey'
      AND table_schema = 'public'
      AND table_name = 'orders'
  ) THEN
    ALTER TABLE public.orders DROP CONSTRAINT orders_client_id_fkey;
  END IF;

  ALTER TABLE public.orders
    ADD CONSTRAINT orders_client_id_fkey
    FOREIGN KEY (client_id)
    REFERENCES public.clients(id)
    ON DELETE CASCADE;
END $$;

-- 5. Atualizar foreign key de quotes para ON DELETE CASCADE
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'quotes_client_id_fkey'
      AND table_schema = 'public'
      AND table_name = 'quotes'
  ) THEN
    ALTER TABLE public.quotes DROP CONSTRAINT quotes_client_id_fkey;
  END IF;

  ALTER TABLE public.quotes
    ADD CONSTRAINT quotes_client_id_fkey
    FOREIGN KEY (client_id)
    REFERENCES public.clients(id)
    ON DELETE CASCADE;
END $$;

-- 6. Atualizar foreign key de service_contracts para ON DELETE CASCADE
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'service_contracts_client_id_fkey'
      AND table_schema = 'public'
      AND table_name = 'service_contracts'
  ) THEN
    ALTER TABLE public.service_contracts DROP CONSTRAINT service_contracts_client_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'service_contracts'
  ) THEN
    ALTER TABLE public.service_contracts
      ADD CONSTRAINT service_contracts_client_id_fkey
      FOREIGN KEY (client_id)
      REFERENCES public.clients(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- 7. Criar/Atualizar a RPC segura delete_or_archive_client
CREATE OR REPLACE FUNCTION public.delete_or_archive_client(
  p_client_id uuid,
  p_force_cascade boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_orders_count int := 0;
  v_quotes_count int := 0;
  v_receivables_count int := 0;
  v_contracts_count int := 0;
  v_briefings_count int := 0;
  v_total_records int := 0;
  v_client_name text;
BEGIN
  IF NOT (
    public.is_admin(auth.uid()) OR
    public.has_role(auth.uid(), 'atendente'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'Permissão negada para excluir clientes.';
  END IF;

  SELECT name INTO v_client_name FROM public.clients WHERE id = p_client_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cliente não encontrado.';
  END IF;

  SELECT count(*) INTO v_orders_count FROM public.orders WHERE client_id = p_client_id;
  SELECT count(*) INTO v_quotes_count FROM public.quotes WHERE client_id = p_client_id;
  SELECT count(*) INTO v_receivables_count FROM public.receivables WHERE client_id = p_client_id;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_contracts') THEN
    SELECT count(*) INTO v_contracts_count FROM public.service_contracts WHERE client_id = p_client_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'briefings') THEN
    SELECT count(*) INTO v_briefings_count FROM public.briefings WHERE client_id = p_client_id;
  END IF;

  v_total_records := v_orders_count + v_quotes_count + v_receivables_count + v_contracts_count + v_briefings_count;

  IF v_total_records > 0 THEN
    IF p_force_cascade AND public.is_admin(auth.uid()) THEN
      -- Exclusão completa solicitada pelo administrador
      DELETE FROM public.receivables WHERE client_id = p_client_id;
      
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_contracts') THEN
        DELETE FROM public.service_contracts WHERE client_id = p_client_id;
      END IF;

      DELETE FROM public.quotes WHERE client_id = p_client_id;
      DELETE FROM public.orders WHERE client_id = p_client_id;

      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'briefings') THEN
        DELETE FROM public.briefings WHERE client_id = p_client_id;
      END IF;

      UPDATE public.cash_entries SET client_id = NULL WHERE client_id = p_client_id;
      DELETE FROM public.clients WHERE id = p_client_id;

      RETURN jsonb_build_object(
        'action', 'deleted_cascade',
        'has_records', true,
        'records_count', v_total_records,
        'message', 'Cliente e todos os seus registros vinculados foram excluídos com sucesso.'
      );
    ELSE
      -- Desativação/Arquivamento seguro
      UPDATE public.clients
         SET active = false,
             archived_at = COALESCE(archived_at, now())
       WHERE id = p_client_id;

      RETURN jsonb_build_object(
        'action', 'archived',
        'has_records', true,
        'records_count', v_total_records,
        'message', 'Cliente possui ' || v_total_records || ' registro(s) vinculado(s) e foi desativado/arquivado com sucesso para proteger o histórico.'
      );
    END IF;
  ELSE
    -- Sem registros: exclusão direta permanente
    DELETE FROM public.clients WHERE id = p_client_id;
    RETURN jsonb_build_object(
      'action', 'deleted',
      'has_records', false,
      'records_count', 0,
      'message', 'Cliente excluído com sucesso.'
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_or_archive_client(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_or_archive_client(uuid, boolean) TO authenticated, service_role;
