CREATE TABLE public.cash_closures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  closure_date date NOT NULL DEFAULT CURRENT_DATE,
  closed_at timestamptz NOT NULL DEFAULT now(),
  opened_at timestamptz,
  operator text,
  initial_amount numeric(12,2) NOT NULL DEFAULT 0,
  expected_cash numeric(12,2) NOT NULL DEFAULT 0,
  counted_cash numeric(12,2) NOT NULL DEFAULT 0,
  difference numeric(12,2) NOT NULL DEFAULT 0,
  total_in numeric(12,2) NOT NULL DEFAULT 0,
  total_out numeric(12,2) NOT NULL DEFAULT 0,
  by_method jsonb NOT NULL DEFAULT '{}'::jsonb,
  entries_count integer NOT NULL DEFAULT 0,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_closures TO authenticated;
GRANT ALL ON public.cash_closures TO service_role;

ALTER TABLE public.cash_closures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read cash_closures" ON public.cash_closures FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert cash_closures" ON public.cash_closures FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update cash_closures" ON public.cash_closures FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete cash_closures" ON public.cash_closures FOR DELETE TO authenticated USING (true);

CREATE TRIGGER set_cash_closures_updated_at BEFORE UPDATE ON public.cash_closures
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX cash_closures_date_idx ON public.cash_closures (closure_date DESC, closed_at DESC);