-- Criar tabela de vendas
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total DECIMAL(10, 2) NOT NULL,
  items_count INTEGER NOT NULL,
  payment_method TEXT NOT NULL,
  customer_name TEXT,
  items JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS para tabela de vendas
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view sales" ON public.sales
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can insert sales" ON public.sales
  FOR INSERT TO authenticated WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.sales TO authenticated;
GRANT ALL ON public.sales TO service_role;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON public.sales(payment_method);
