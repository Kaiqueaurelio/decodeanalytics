-- 1. Adicionar tipo de cobrança (avulso ou assinatura mensal) no catálogo de serviços
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS billing_type text NOT NULL DEFAULT 'avulso'
  CHECK (billing_type IN ('avulso', 'assinatura_mensal', 'mensal'));

-- 2. Garantir suporte a status ativo/pausado/suspenso/encerrado/aprovado em service_contracts
DO $$
BEGIN
  ALTER TABLE public.service_contracts DROP CONSTRAINT IF EXISTS service_contracts_status_check;
  ALTER TABLE public.service_contracts
    ADD CONSTRAINT service_contracts_status_check
    CHECK (status IN ('rascunho', 'enviado', 'aprovado', 'ativo', 'pausado', 'suspenso', 'recusado', 'encerrado'));
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

-- 3. Atualizar política de inserção de contratos para permitir financeiro também
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'service_contracts'
  ) THEN
    DROP POLICY IF EXISTS "service_contracts_insert_staff" ON public.service_contracts;
    CREATE POLICY "service_contracts_insert_staff" ON public.service_contracts FOR INSERT TO authenticated
      WITH CHECK (
        public.is_admin(auth.uid()) OR
        public.has_role(auth.uid(), 'atendente'::public.app_role) OR
        public.has_role(auth.uid(), 'financeiro'::public.app_role)
      );
  END IF;
END $$;

-- 4. Função para geração em lote das cobranças mensais dos contratos ativos com 1 clique
CREATE OR REPLACE FUNCTION public.generate_monthly_contract_receivables(
  p_year integer,
  p_month integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_competence_date date;
  v_days_in_month integer;
  v_contract record;
  v_due_day integer;
  v_due_date date;
  v_created_count integer := 0;
  v_skipped_count integer := 0;
  v_total_amount numeric(12,2) := 0;
BEGIN
  -- Permissão: apenas administradores, financeiro ou atendentes
  IF NOT (
    public.is_admin(auth.uid()) OR
    public.has_role(auth.uid(), 'financeiro'::public.app_role) OR
    public.has_role(auth.uid(), 'atendente'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'Permissão negada para gerar mensalidades de contratos.';
  END IF;

  IF p_month < 1 OR p_month > 12 THEN
    RAISE EXCEPTION 'Mês inválido: %', p_month;
  END IF;

  v_competence_date := make_date(p_year, p_month, 1);
  v_days_in_month := EXTRACT(DAY FROM (v_competence_date + interval '1 month' - interval '1 day'))::integer;

  FOR v_contract IN
    SELECT c.*, cl.name as client_name
    FROM public.service_contracts c
    JOIN public.clients cl ON cl.id = c.client_id
    WHERE c.status IN ('aprovado', 'ativo')
      AND c.billing_mode IN ('mensal_fixo', 'misto')
      AND (c.start_date IS NULL OR c.start_date <= (v_competence_date + interval '1 month' - interval '1 day')::date)
      AND (c.end_date IS NULL OR c.end_date >= v_competence_date)
  LOOP
    IF EXISTS (
      SELECT 1 FROM public.receivables r
      WHERE r.service_contract_id = v_contract.id
        AND r.competence_month = v_competence_date
    ) THEN
      v_skipped_count := v_skipped_count + 1;
    ELSE
      v_due_day := COALESCE(v_contract.due_day, 10);
      IF v_due_day > v_days_in_month THEN
        v_due_day := v_days_in_month;
      ELSIF v_due_day < 1 THEN
        v_due_day := 1;
      END IF;
      v_due_date := make_date(p_year, p_month, v_due_day);

      INSERT INTO public.receivables (
        client_id,
        service_contract_id,
        competence_month,
        due_date,
        amount,
        status,
        notes
      ) VALUES (
        v_contract.client_id,
        v_contract.id,
        v_competence_date,
        v_due_date,
        v_contract.amount,
        'pendente'::public.receivable_status,
        'Mensalidade ' || to_char(v_competence_date, 'MM/YYYY') || ' - Contrato #' || v_contract.number || ' (' || v_contract.title || ')'
      );

      v_created_count := v_created_count + 1;
      v_total_amount := v_total_amount + v_contract.amount;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'competence_month', to_char(v_competence_date, 'YYYY-MM'),
    'created_count', v_created_count,
    'skipped_count', v_skipped_count,
    'total_amount', v_total_amount
  );
END;
$$;

REVOKE ALL ON FUNCTION public.generate_monthly_contract_receivables(integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_monthly_contract_receivables(integer, integer) TO authenticated, service_role;

-- 5. Adicionar campo active em public.clients para suportar arquivamento/desativação segura
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- 6. Atualizar política de exclusão de clientes para permitir administradores e atendentes
DROP POLICY IF EXISTS "clients_delete" ON public.clients;
CREATE POLICY "clients_delete" ON public.clients FOR DELETE TO authenticated
  USING (
    public.is_admin(auth.uid()) OR
    public.has_role(auth.uid(), 'atendente'::public.app_role)
  );

-- 7. Função para exclusão segura ou arquivamento de clientes com histórico
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
  SELECT count(*) INTO v_contracts_count FROM public.service_contracts WHERE client_id = p_client_id;
  SELECT count(*) INTO v_briefings_count FROM public.briefings WHERE client_id = p_client_id;

  v_total_records := v_orders_count + v_quotes_count + v_receivables_count + v_contracts_count + v_briefings_count;

  IF v_total_records > 0 THEN
    IF p_force_cascade AND public.is_admin(auth.uid()) THEN
      DELETE FROM public.receivables WHERE client_id = p_client_id;
      DELETE FROM public.service_contracts WHERE client_id = p_client_id;
      DELETE FROM public.quotes WHERE client_id = p_client_id;
      DELETE FROM public.orders WHERE client_id = p_client_id;
      DELETE FROM public.briefings WHERE client_id = p_client_id;
      UPDATE public.cash_entries SET client_id = NULL WHERE client_id = p_client_id;
      DELETE FROM public.clients WHERE id = p_client_id;

      RETURN jsonb_build_object(
        'action', 'deleted_cascade',
        'has_records', true,
        'records_count', v_total_records,
        'message', 'Cliente e todos os seus registros vinculados foram excluídos com sucesso.'
      );
    ELSE
      UPDATE public.clients SET active = false WHERE id = p_client_id;
      RETURN jsonb_build_object(
        'action', 'archived',
        'has_records', true,
        'records_count', v_total_records,
        'message', 'Cliente possui ' || v_total_records || ' registro(s) vinculado(s) (OS, orçamento ou financeiro) e foi desativado/arquivado com sucesso para proteger o histórico.'
      );
    END IF;
  ELSE
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


-- 8. Prevent duplicate invoices even when the monthly billing action runs concurrently.
CREATE UNIQUE INDEX IF NOT EXISTS receivables_contract_competence_unique
  ON public.receivables (service_contract_id, competence_month)
  WHERE service_contract_id IS NOT NULL AND competence_month IS NOT NULL;

-- 9. Lock eligible subscriptions and ignore a duplicate conflict as a final safety net.
CREATE OR REPLACE FUNCTION public.generate_monthly_contract_receivables(
  p_year integer,
  p_month integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_competence_date date;
  v_days_in_month integer;
  v_contract record;
  v_due_day integer;
  v_due_date date;
  v_created_count integer := 0;
  v_skipped_count integer := 0;
  v_total_amount numeric(12,2) := 0;
  v_rows integer;
BEGIN
  IF NOT (
    public.is_admin(auth.uid()) OR
    public.has_role(auth.uid(), 'financeiro'::public.app_role) OR
    public.has_role(auth.uid(), 'atendente'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'Permissão negada para gerar mensalidades de contratos.';
  END IF;

  IF p_month < 1 OR p_month > 12 THEN
    RAISE EXCEPTION 'Mês inválido: %', p_month;
  END IF;

  v_competence_date := make_date(p_year, p_month, 1);
  v_days_in_month := EXTRACT(DAY FROM (v_competence_date + interval '1 month' - interval '1 day'))::integer;

  FOR v_contract IN
    SELECT c.*
    FROM public.service_contracts c
    JOIN public.clients cl ON cl.id = c.client_id
    WHERE c.status IN ('aprovado', 'ativo')
      AND c.billing_mode IN ('mensal_fixo', 'misto')
      AND (c.start_date IS NULL OR c.start_date <= (v_competence_date + interval '1 month' - interval '1 day')::date)
      AND (c.end_date IS NULL OR c.end_date >= v_competence_date)
    ORDER BY c.id
    FOR UPDATE OF c
  LOOP
    v_due_day := LEAST(GREATEST(COALESCE(v_contract.due_day, 10)::integer, 1), v_days_in_month);
    v_due_date := make_date(p_year, p_month, v_due_day);

    INSERT INTO public.receivables (
      client_id, service_contract_id, competence_month, due_date, amount, status, notes
    ) VALUES (
      v_contract.client_id,
      v_contract.id,
      v_competence_date,
      v_due_date,
      v_contract.amount,
      'pendente'::public.receivable_status,
      'Mensalidade ' || to_char(v_competence_date, 'MM/YYYY') || ' - Contrato #' || v_contract.number || ' (' || v_contract.title || ')'
    )
    ON CONFLICT (service_contract_id, competence_month)
      WHERE service_contract_id IS NOT NULL AND competence_month IS NOT NULL
    DO NOTHING;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 1 THEN
      v_created_count := v_created_count + 1;
      v_total_amount := v_total_amount + v_contract.amount;
    ELSE
      v_skipped_count := v_skipped_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'competence_month', to_char(v_competence_date, 'YYYY-MM'),
    'created_count', v_created_count,
    'skipped_count', v_skipped_count,
    'total_amount', v_total_amount
  );
END;
$$;

-- 10. Settle the receivable and create its cash entry atomically and idempotently.
CREATE OR REPLACE FUNCTION public.settle_receivable_and_cash(
  p_receivable_id uuid,
  p_payment_method text DEFAULT 'pix'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_receivable public.receivables%ROWTYPE;
  v_contract_number bigint;
  v_contract_title text;
  v_order_number bigint;
  v_description text;
  v_category text;
BEGIN
  IF NOT (
    public.is_admin(auth.uid()) OR
    public.has_role(auth.uid(), 'financeiro'::public.app_role) OR
    public.has_role(auth.uid(), 'atendente'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'Permissão negada para baixar recebimentos.';
  END IF;

  SELECT * INTO v_receivable
  FROM public.receivables
  WHERE id = p_receivable_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cobrança não encontrada.';
  END IF;

  IF v_receivable.status = 'pago' THEN
    RETURN jsonb_build_object('already_paid', true, 'receivable_id', p_receivable_id);
  END IF;

  IF v_receivable.service_contract_id IS NOT NULL THEN
    SELECT number, title INTO v_contract_number, v_contract_title
    FROM public.service_contracts WHERE id = v_receivable.service_contract_id;
  END IF;
  IF v_receivable.order_id IS NOT NULL THEN
    SELECT number INTO v_order_number FROM public.orders WHERE id = v_receivable.order_id;
  END IF;

  v_description := CASE
    WHEN v_contract_number IS NOT NULL
      THEN 'Pagamento contrato #' || v_contract_number || COALESCE(' · ' || v_contract_title, '')
    ELSE 'Pagamento OS #' || COALESCE(v_order_number::text, '')
  END;
  v_category := CASE
    WHEN v_contract_number IS NOT NULL THEN 'Pagamento de contrato'
    ELSE 'Pagamento de OS'
  END;

  UPDATE public.receivables
  SET status = 'pago', paid_at = now(), payment_method = COALESCE(NULLIF(p_payment_method, ''), 'pix')
  WHERE id = p_receivable_id;

  IF NOT EXISTS (
    SELECT 1 FROM public.cash_entries WHERE receivable_id = p_receivable_id
  ) THEN
    INSERT INTO public.cash_entries (
      type, description, category, amount, client_id, order_id, receivable_id, payment_method
    ) VALUES (
      'entrada', v_description, v_category, v_receivable.amount,
      v_receivable.client_id, v_receivable.order_id, v_receivable.id,
      COALESCE(NULLIF(p_payment_method, ''), 'pix')
    );
  END IF;

  IF v_receivable.order_id IS NOT NULL THEN
    UPDATE public.orders SET paid = total WHERE id = v_receivable.order_id;
  END IF;

  RETURN jsonb_build_object('already_paid', false, 'receivable_id', p_receivable_id);
END;
$$;

REVOKE ALL ON FUNCTION public.settle_receivable_and_cash(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.settle_receivable_and_cash(uuid, text) TO authenticated, service_role;
