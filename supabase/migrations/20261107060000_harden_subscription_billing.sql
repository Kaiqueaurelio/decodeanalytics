-- Apply the subscription billing hardening to databases that have already
-- run 20261106213000_service_billing_type_and_monthly_generation.sql.

-- 8. Prevent duplicate invoices even when the monthly billing action runs concurrently.
CREATE UNIQUE INDEX IF NOT EXISTS receivables_contract_competence_unique
  ON public.receivables (service_contract_id, competence_month)
  WHERE service_contract_id IS NOT NULL AND competence_month IS NOT NULL;

-- Ensure a cash settlement can never create a second ledger entry for the same invoice.
CREATE UNIQUE INDEX IF NOT EXISTS cash_entries_receivable_id_unique
  ON public.cash_entries (receivable_id)
  WHERE receivable_id IS NOT NULL;

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
