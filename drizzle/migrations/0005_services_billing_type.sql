ALTER TABLE public.services ADD COLUMN IF NOT EXISTS billing_type text NOT NULL DEFAULT 'avulso';
UPDATE public.services SET billing_type = 'assinatura_mensal'
WHERE billing_type = 'avulso' AND (
  lower(category) IN ('social media','design gráfico','design grafico')
  OR slug IN ('gestao-redes-sociais','trafego-pago','pacote-artes-feed-stories','social-media')
);