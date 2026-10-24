-- Durable, per-IP rate limiting for the public AI endpoint across server instances.
CREATE TABLE IF NOT EXISTS public.public_ai_rate_limits (
  key_hash text PRIMARY KEY,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.public_ai_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.public_ai_rate_limits FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.consume_public_ai_rate_limit(p_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_count integer;
  normalized_key text;
BEGIN
  normalized_key := md5(left(coalesce(nullif(trim(p_key), ''), 'unknown'), 256));

  INSERT INTO public.public_ai_rate_limits (key_hash, window_started_at, request_count, updated_at)
  VALUES (normalized_key, now(), 1, now())
  ON CONFLICT (key_hash) DO UPDATE
    SET window_started_at = CASE
          WHEN public.public_ai_rate_limits.window_started_at <= now() - interval '60 seconds'
            THEN now()
          ELSE public.public_ai_rate_limits.window_started_at
        END,
        request_count = CASE
          WHEN public.public_ai_rate_limits.window_started_at <= now() - interval '60 seconds'
            THEN 1
          ELSE public.public_ai_rate_limits.request_count + 1
        END,
        updated_at = now()
  RETURNING request_count INTO current_count;

  DELETE FROM public.public_ai_rate_limits
   WHERE updated_at < now() - interval '24 hours';

  RETURN current_count <= 12;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_public_ai_rate_limit(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_public_ai_rate_limit(text) TO anon, authenticated;
