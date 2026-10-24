REVOKE ALL ON FUNCTION public.consume_public_ai_rate_limit(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_public_ai_rate_limit(text) FROM anon;
REVOKE ALL ON FUNCTION public.consume_public_ai_rate_limit(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.consume_public_ai_rate_limit(text) TO service_role;
