CREATE TYPE public.art_proof_status AS ENUM ('pendente','aprovado','reprovado');

CREATE TABLE public.art_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16),'hex'),
  title text NOT NULL,
  note text,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  storage_path text NOT NULL,
  mime_type text,
  status public.art_proof_status NOT NULL DEFAULT 'pendente',
  client_feedback text,
  responded_at timestamptz,
  viewed_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.art_proofs TO authenticated;
GRANT ALL ON public.art_proofs TO service_role;

ALTER TABLE public.art_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "art_proofs_staff_select" ON public.art_proofs FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'atendente'::app_role));
CREATE POLICY "art_proofs_staff_insert" ON public.art_proofs FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'atendente'::app_role));
CREATE POLICY "art_proofs_staff_update" ON public.art_proofs FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'atendente'::app_role));
CREATE POLICY "art_proofs_staff_delete" ON public.art_proofs FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE INDEX art_proofs_created_at_idx ON public.art_proofs (created_at DESC);

CREATE TRIGGER art_proofs_set_updated_at BEFORE UPDATE ON public.art_proofs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();