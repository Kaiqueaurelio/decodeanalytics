
ALTER TABLE public.ella_sandbox_runs
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'success',
  ADD COLUMN IF NOT EXISTS inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS error_type text,
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS stack_trace text;

ALTER TABLE public.ella_sandbox_runs
  ALTER COLUMN answer DROP NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ella_sandbox_runs_status_check'
  ) THEN
    ALTER TABLE public.ella_sandbox_runs
      ADD CONSTRAINT ella_sandbox_runs_status_check
      CHECK (status IN ('success','error','pending'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ella_sandbox_runs_status_idx
  ON public.ella_sandbox_runs (status, created_at DESC);
