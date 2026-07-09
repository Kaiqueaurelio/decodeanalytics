
CREATE TYPE public.ella_scope AS ENUM ('admin', 'public', 'both');

CREATE TABLE public.ella_knowledge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  scope public.ella_scope NOT NULL DEFAULT 'both',
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ella_knowledge TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ella_knowledge TO authenticated;
GRANT ALL ON public.ella_knowledge TO service_role;

ALTER TABLE public.ella_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ella_kb_anon_read_public"
  ON public.ella_knowledge FOR SELECT TO anon
  USING (scope IN ('public','both'));

CREATE POLICY "ella_kb_auth_read"
  ON public.ella_knowledge FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "ella_kb_admin_insert"
  ON public.ella_knowledge FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "ella_kb_admin_update"
  ON public.ella_knowledge FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "ella_kb_admin_delete"
  ON public.ella_knowledge FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER ella_kb_set_updated_at
  BEFORE UPDATE ON public.ella_knowledge
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_ella_kb_scope ON public.ella_knowledge(scope);
