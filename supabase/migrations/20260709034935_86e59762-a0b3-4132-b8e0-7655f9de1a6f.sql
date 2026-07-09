CREATE OR REPLACE FUNCTION public.replace_order_items(_order_id uuid, _items jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
$$;

REVOKE ALL ON FUNCTION public.replace_order_items(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.replace_order_items(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.replace_order_items(uuid, jsonb) TO service_role;