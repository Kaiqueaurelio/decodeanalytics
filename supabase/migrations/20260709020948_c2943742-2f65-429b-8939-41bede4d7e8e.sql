
-- Fix mutable search_path on trigger helpers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_order_payment_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.paid <= 0 THEN NEW.payment_status := 'nao_pago';
  ELSIF NEW.paid >= NEW.total THEN NEW.payment_status := 'pago_completo';
  ELSE NEW.payment_status := 'pago_parcial';
  END IF;
  RETURN NEW;
END;
$function$;

-- Revoke EXECUTE from clients on trigger-only SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.sync_order_payment_status() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.sync_order_from_production_update() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.sync_order_receivable_after() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
