-- Permanent client deletion: explicitly remove dependent financial rows before deleting client.
-- The existing RPC used the wrong receivables column name (client_id vs client_id_fk).
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
  v_orders int := 0;
  v_quotes int := 0;
  v_receivables int := 0;
  v_contracts int := 0;
  v_briefings int := 0;
  v_cash int := 0;
  v_total int := 0;
  v_name text;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Somente administrador pode excluir clientes definitivamente.';
  END IF;

  SELECT name INTO v_name FROM public.clients WHERE id = p_client_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cliente não encontrado.'; END IF;

  SELECT count(*) INTO v_orders FROM public.orders WHERE client_id = p_client_id;
  SELECT count(*) INTO v_quotes FROM public.quotes WHERE client_id = p_client_id;
  SELECT count(*) INTO v_receivables FROM public.receivables WHERE client_id_fk = p_client_id;
  SELECT count(*) INTO v_contracts FROM public.service_contracts WHERE client_id = p_client_id;
  SELECT count(*) INTO v_briefings FROM public.briefings WHERE client_id = p_client_id;
  v_total := v_orders + v_quotes + v_receivables + v_contracts + v_briefings;

  IF v_total > 0 AND NOT p_force_cascade THEN
    UPDATE public.clients SET active = false WHERE id = p_client_id;
    RETURN jsonb_build_object('action','archived','has_records',true,'records_count',v_total,
      'message','Cliente possui histórico e foi arquivado. Confirme exclusão definitiva para apagar os registros vinculados.');
  END IF;

  -- Remove dependent rows in a deterministic order. Cash entries retain their ledger entry,
  -- but the optional client link is cleared.
  DELETE FROM public.receivables WHERE client_id_fk = p_client_id;
  DELETE FROM public.service_contracts WHERE client_id = p_client_id;
  DELETE FROM public.quotes WHERE client_id = p_client_id;
  DELETE FROM public.orders WHERE client_id = p_client_id;
  DELETE FROM public.briefings WHERE client_id = p_client_id;
  UPDATE public.cash_entries SET client_id = NULL WHERE client_id = p_client_id;
  DELETE FROM public.clients WHERE id = p_client_id;

  RETURN jsonb_build_object('action','deleted_cascade','has_records',v_total > 0,
    'records_count',v_total,'message','Cliente e registros vinculados excluídos definitivamente.');
END;
$$;
REVOKE ALL ON FUNCTION public.delete_or_archive_client(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_or_archive_client(uuid, boolean) TO authenticated, service_role;
