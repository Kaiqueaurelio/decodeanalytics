REVOKE EXECUTE ON FUNCTION public.replace_order_items(uuid, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.replace_order_items(uuid, jsonb) TO service_role;