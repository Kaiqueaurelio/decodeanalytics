
CREATE TABLE public.ai_provider_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  provider text NOT NULL,
  model text,
  endpoint text NOT NULL,
  trace_id text NOT NULL,
  status text NOT NULL,
  http_status int,
  error_type text,
  error_message text,
  duration_ms int,
  user_id uuid,
  ip text,
  extra jsonb
);

CREATE INDEX ai_provider_logs_occurred_at_idx ON public.ai_provider_logs(occurred_at DESC);
CREATE INDEX ai_provider_logs_status_idx ON public.ai_provider_logs(status);
CREATE INDEX ai_provider_logs_endpoint_idx ON public.ai_provider_logs(endpoint);

GRANT SELECT ON public.ai_provider_logs TO authenticated;
GRANT ALL ON public.ai_provider_logs TO service_role;

ALTER TABLE public.ai_provider_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read ai provider logs"
ON public.ai_provider_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'administrador'));
