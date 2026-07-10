
CREATE TABLE public.ella_sandbox_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  scope TEXT NOT NULL,
  model TEXT NOT NULL,
  provider TEXT NOT NULL,
  temperature NUMERIC(4,2),
  duration_ms INTEGER,
  trace_id TEXT,
  base_prompt_name TEXT,
  system_prompt TEXT,
  knowledge_used JSONB NOT NULL DEFAULT '[]'::jsonb,
  knowledge_total INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.ella_sandbox_runs TO authenticated;
GRANT ALL ON public.ella_sandbox_runs TO service_role;

ALTER TABLE public.ella_sandbox_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated can read sandbox runs"
  ON public.ella_sandbox_runs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated can insert sandbox runs"
  ON public.ella_sandbox_runs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE INDEX ella_sandbox_runs_created_at_idx ON public.ella_sandbox_runs (created_at DESC);
