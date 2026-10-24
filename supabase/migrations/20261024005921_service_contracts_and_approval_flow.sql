-- Modelos e contratos de prestação de serviço com aprovação por link privado.
-- Keep this migration independent of helper-function names in production/local schemas.
CREATE OR REPLACE FUNCTION public.set_service_contract_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.set_service_contract_updated_at() FROM PUBLIC, anon, authenticated;

CREATE SEQUENCE public.service_contract_number_seq START 1000;

CREATE TABLE public.service_contract_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL UNIQUE REFERENCES public.services(id) ON DELETE CASCADE,
  name text NOT NULL,
  body_template text NOT NULL,
  confidentiality_clause text NOT NULL DEFAULT 'CONFIDENCIALIDADE E NÃO REUTILIZAÇÃO: A CONTRATADA manterá sob sigilo as informações, arquivos e materiais confidenciais fornecidos pelo CONTRATANTE. Não reutilizará, publicará, repassará ou utilizará em favor de terceiros os materiais ou conteúdos desenvolvidos especificamente para este cliente, sem autorização expressa do CONTRATANTE. Esta obrigação não abrange conhecimentos gerais, métodos, técnicas, ferramentas ou materiais de terceiros, desde que não revelem nem reproduzam conteúdo confidencial do CONTRATANTE.',
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.service_contract_templates ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_contract_templates TO authenticated;
GRANT ALL ON public.service_contract_templates TO service_role;
CREATE POLICY "contract_templates_read_staff" ON public.service_contract_templates FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role('atendente'::public.app_role, auth.uid()) OR public.has_role('financeiro'::public.app_role, auth.uid()));
CREATE POLICY "contract_templates_insert_staff" ON public.service_contract_templates FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role('atendente'::public.app_role, auth.uid()));
CREATE POLICY "contract_templates_update_staff" ON public.service_contract_templates FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role('atendente'::public.app_role, auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role('atendente'::public.app_role, auth.uid()));
CREATE POLICY "contract_templates_delete_admin" ON public.service_contract_templates FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE TRIGGER trg_contract_templates_updated BEFORE UPDATE ON public.service_contract_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_service_contract_updated_at();

CREATE TABLE public.service_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number bigint NOT NULL UNIQUE DEFAULT nextval('public.service_contract_number_seq'),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  template_id uuid REFERENCES public.service_contract_templates(id) ON DELETE SET NULL,
  title text NOT NULL,
  billing_mode text NOT NULL DEFAULT 'mensal_fixo' CHECK (billing_mode IN ('mensal_fixo', 'por_demanda', 'misto')),
  amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  start_date date,
  end_date date,
  due_day smallint CHECK (due_day BETWEEN 1 AND 31),
  scope text NOT NULL DEFAULT '',
  notes text,
  contract_text text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'enviado', 'aprovado', 'recusado', 'suspenso', 'encerrado')),
  version integer NOT NULL DEFAULT 0 CHECK (version >= 0),
  sent_at timestamptz,
  responded_at timestamptz,
  approval_name text,
  response_reason text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);
ALTER SEQUENCE public.service_contract_number_seq OWNED BY public.service_contracts.number;
ALTER TABLE public.service_contracts ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_contracts TO authenticated;
GRANT ALL ON public.service_contracts TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.service_contract_number_seq TO authenticated, service_role;
CREATE POLICY "service_contracts_read_staff" ON public.service_contracts FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role('atendente'::public.app_role, auth.uid()) OR public.has_role('financeiro'::public.app_role, auth.uid()));
CREATE POLICY "service_contracts_insert_staff" ON public.service_contracts FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role('atendente'::public.app_role, auth.uid()));
CREATE POLICY "service_contracts_update_staff" ON public.service_contracts FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role('atendente'::public.app_role, auth.uid()) OR public.has_role('financeiro'::public.app_role, auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role('atendente'::public.app_role, auth.uid()) OR public.has_role('financeiro'::public.app_role, auth.uid()));
CREATE POLICY "service_contracts_delete_admin" ON public.service_contracts FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE TRIGGER trg_service_contracts_updated BEFORE UPDATE ON public.service_contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_service_contract_updated_at();

CREATE TABLE public.service_contract_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.service_contracts(id) ON DELETE CASCADE,
  version integer NOT NULL,
  content_snapshot text NOT NULL,
  amount numeric(12,2) NOT NULL,
  billing_mode text NOT NULL CHECK (billing_mode IN ('mensal_fixo', 'por_demanda', 'misto')),
  status text NOT NULL DEFAULT 'enviado' CHECK (status IN ('enviado', 'aprovado', 'recusado', 'substituido')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  approval_name text,
  response_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contract_id, version)
);
ALTER TABLE public.service_contract_versions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.service_contract_versions TO authenticated;
GRANT ALL ON public.service_contract_versions TO service_role;
CREATE POLICY "contract_versions_read_staff" ON public.service_contract_versions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.service_contracts c WHERE c.id = contract_id AND
    (public.is_admin(auth.uid()) OR public.has_role('atendente'::public.app_role, auth.uid()) OR public.has_role('financeiro'::public.app_role, auth.uid()))));
CREATE POLICY "contract_versions_write_staff" ON public.service_contract_versions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.service_contracts c WHERE c.id = contract_id AND
    (public.is_admin(auth.uid()) OR public.has_role('atendente'::public.app_role, auth.uid()))));
CREATE POLICY "contract_versions_update_staff" ON public.service_contract_versions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.service_contracts c WHERE c.id = contract_id AND
    (public.is_admin(auth.uid()) OR public.has_role('atendente'::public.app_role, auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.service_contracts c WHERE c.id = contract_id AND
    (public.is_admin(auth.uid()) OR public.has_role('atendente'::public.app_role, auth.uid()))));

-- Hashes live in a table unavailable to browser sessions; links are short-lived and one-use.
CREATE TABLE public.service_contract_approval_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL UNIQUE REFERENCES public.service_contract_versions(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE CHECK (length(token_hash) = 64),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.service_contract_approval_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.service_contract_approval_links FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.service_contract_approval_links TO service_role;

ALTER TABLE public.orders ADD COLUMN service_contract_id uuid REFERENCES public.service_contracts(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN performed_on date;
ALTER TABLE public.receivables ADD COLUMN service_contract_id uuid REFERENCES public.service_contracts(id) ON DELETE SET NULL;
ALTER TABLE public.receivables ADD COLUMN competence_month date;
CREATE INDEX idx_service_contracts_client_status ON public.service_contracts(client_id, status, created_at DESC);
CREATE INDEX idx_service_contract_versions_contract ON public.service_contract_versions(contract_id, version DESC);
CREATE INDEX idx_orders_service_contract ON public.orders(service_contract_id);
CREATE INDEX idx_receivables_service_contract ON public.receivables(service_contract_id, competence_month);

-- Called only by the trusted server. Public approval requests never read exposed tables.
CREATE OR REPLACE FUNCTION public.get_public_service_contract(p_token_hash text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object(
    'number', c.number, 'version', v.version, 'title', c.title,
    'client_name', cl.name, 'service_name', s.name, 'content', v.content_snapshot,
    'amount', v.amount, 'billing_mode', v.billing_mode, 'sent_at', v.sent_at
  )
  FROM public.service_contract_approval_links l
  JOIN public.service_contract_versions v ON v.id = l.version_id
  JOIN public.service_contracts c ON c.id = v.contract_id AND c.version = v.version AND c.status = 'enviado'
  JOIN public.clients cl ON cl.id = c.client_id
  JOIN public.services s ON s.id = c.service_id
  WHERE l.token_hash = p_token_hash AND l.expires_at > now() AND l.consumed_at IS NULL
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_public_service_contract(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_service_contract(text) TO service_role;

CREATE OR REPLACE FUNCTION public.respond_to_public_service_contract(
  p_token_hash text, p_decision text, p_approval_name text, p_reason text DEFAULT NULL
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  link_row public.service_contract_approval_links%ROWTYPE;
  version_row public.service_contract_versions%ROWTYPE;
  contract_row public.service_contracts%ROWTYPE;
  response_time timestamptz := now();
BEGIN
  IF p_decision NOT IN ('aprovado', 'recusado') THEN RAISE EXCEPTION 'Decisão inválida'; END IF;
  IF p_decision = 'aprovado' AND length(trim(coalesce(p_approval_name, ''))) < 2 THEN
    RAISE EXCEPTION 'Informe o nome para confirmar o aceite';
  END IF;
  SELECT l.* INTO link_row
  FROM public.service_contract_approval_links l
  JOIN public.service_contract_versions v ON v.id = l.version_id
  JOIN public.service_contracts c ON c.id = v.contract_id AND c.version = v.version AND c.status = 'enviado'
  WHERE l.token_hash = p_token_hash AND l.expires_at > response_time AND l.consumed_at IS NULL
  FOR UPDATE OF l;
  IF NOT FOUND THEN RETURN false; END IF;
  SELECT v.* INTO version_row FROM public.service_contract_versions v WHERE v.id = link_row.version_id FOR UPDATE;
  SELECT c.* INTO contract_row FROM public.service_contracts c WHERE c.id = version_row.contract_id FOR UPDATE;
  UPDATE public.service_contract_approval_links SET consumed_at = response_time WHERE id = link_row.id;
  UPDATE public.service_contract_versions SET status = p_decision, responded_at = response_time,
    approval_name = NULLIF(trim(p_approval_name), ''), response_reason = NULLIF(trim(p_reason), '')
    WHERE id = version_row.id;
  UPDATE public.service_contracts SET status = p_decision, responded_at = response_time,
    approval_name = NULLIF(trim(p_approval_name), ''), response_reason = NULLIF(trim(p_reason), '')
    WHERE id = contract_row.id AND version = version_row.version AND status = 'enviado';
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.respond_to_public_service_contract(text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_public_service_contract(text, text, text, text) TO service_role;
