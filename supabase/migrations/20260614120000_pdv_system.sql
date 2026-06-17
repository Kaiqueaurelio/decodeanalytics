-- Criar enum para status de venda
CREATE TYPE public.sale_status AS ENUM (
  'aberta',
  'finalizada',
  'cancelada'
);

-- Criar enum para status de comanda
CREATE TYPE public.comanda_status AS ENUM (
  'aberta',
  'fechada',
  'cancelada'
);

-- Tabela de vendas (transações do PDV)
CREATE TABLE public.pdv_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comanda_number integer NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  status public.sale_status DEFAULT 'aberta',
  subtotal numeric(12,2) DEFAULT 0,
  discount numeric(12,2) DEFAULT 0,
  total numeric(12,2) NOT NULL,
  payment_method text,
  paid_amount numeric(12,2) DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  finalized_at timestamp with time zone,
  finalized_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabela de itens de venda
CREATE TABLE public.pdv_sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.pdv_sales(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL,
  subtotal numeric(12,2) NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Tabela de comandas (mesas/pontos de atendimento)
CREATE TABLE public.pdv_comandas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number integer NOT NULL UNIQUE,
  name text NOT NULL,
  status public.comanda_status DEFAULT 'aberta',
  current_sale_id uuid REFERENCES public.pdv_sales(id) ON DELETE SET NULL,
  total_sales numeric(12,2) DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabela de histórico de pagamentos
CREATE TABLE public.pdv_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.pdv_sales(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  payment_method text NOT NULL,
  reference text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Índices para melhor performance
CREATE INDEX idx_pdv_sales_client_id ON public.pdv_sales(client_id);
CREATE INDEX idx_pdv_sales_created_at ON public.pdv_sales(created_at DESC);
CREATE INDEX idx_pdv_sales_status ON public.pdv_sales(status);
CREATE INDEX idx_pdv_sales_comanda ON public.pdv_sales(comanda_number);
CREATE INDEX idx_pdv_sale_items_sale_id ON public.pdv_sale_items(sale_id);
CREATE INDEX idx_pdv_comandas_status ON public.pdv_comandas(status);
CREATE INDEX idx_pdv_payments_sale_id ON public.pdv_payments(sale_id);

-- Políticas de Segurança em Nível de Linha (RLS)
ALTER TABLE public.pdv_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdv_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdv_comandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdv_payments ENABLE ROW LEVEL SECURITY;

-- Política: Admin e financeiro podem ler todas as vendas
CREATE POLICY "pdv_sales_read" ON public.pdv_sales
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrador', 'financeiro', 'vendedor')
    )
  );

-- Política: Admin e financeiro podem inserir vendas
CREATE POLICY "pdv_sales_insert" ON public.pdv_sales
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrador', 'financeiro', 'vendedor')
    )
  );

-- Política: Admin e financeiro podem atualizar vendas
CREATE POLICY "pdv_sales_update" ON public.pdv_sales
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrador', 'financeiro', 'vendedor')
    )
  );

-- Política: Admin e financeiro podem deletar vendas
CREATE POLICY "pdv_sales_delete" ON public.pdv_sales
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrador', 'financeiro')
    )
  );

-- Políticas para itens de venda
CREATE POLICY "pdv_sale_items_read" ON public.pdv_sale_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrador', 'financeiro', 'vendedor')
    )
  );

CREATE POLICY "pdv_sale_items_insert" ON public.pdv_sale_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrador', 'financeiro', 'vendedor')
    )
  );

CREATE POLICY "pdv_sale_items_update" ON public.pdv_sale_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrador', 'financeiro', 'vendedor')
    )
  );

CREATE POLICY "pdv_sale_items_delete" ON public.pdv_sale_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrador', 'financeiro')
    )
  );

-- Políticas para comandas
CREATE POLICY "pdv_comandas_read" ON public.pdv_comandas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrador', 'financeiro', 'vendedor')
    )
  );

CREATE POLICY "pdv_comandas_insert" ON public.pdv_comandas
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrador', 'financeiro')
    )
  );

CREATE POLICY "pdv_comandas_update" ON public.pdv_comandas
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrador', 'financeiro', 'vendedor')
    )
  );

-- Políticas para pagamentos
CREATE POLICY "pdv_payments_read" ON public.pdv_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrador', 'financeiro', 'vendedor')
    )
  );

CREATE POLICY "pdv_payments_insert" ON public.pdv_payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrador', 'financeiro', 'vendedor')
    )
  );

-- Função para sincronizar venda com caixa quando finalizada
CREATE OR REPLACE FUNCTION public.sync_pdv_sale_to_cash()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a venda foi finalizada, criar lançamento no caixa
  IF NEW.status = 'finalizada' AND OLD.status != 'finalizada' THEN
    INSERT INTO public.cash_entries (
      type,
      description,
      amount,
      category,
      payment_method,
      entry_date,
      created_by,
      notes
    ) VALUES (
      'entrada',
      'Venda PDV - Comanda ' || NEW.comanda_number,
      NEW.total,
      'Venda de serviço',
      NEW.payment_method,
      CURRENT_DATE,
      NEW.finalized_by,
      'Referência: Comanda ' || NEW.comanda_number || ' - ' || COALESCE(NEW.notes, '')
    );
  END IF;
  
  -- Se a venda foi cancelada, reverter lançamento no caixa se existir
  IF NEW.status = 'cancelada' AND OLD.status != 'cancelada' THEN
    INSERT INTO public.cash_entries (
      type,
      description,
      amount,
      category,
      payment_method,
      entry_date,
      created_by,
      notes
    ) VALUES (
      'saida',
      'Cancelamento PDV - Comanda ' || NEW.comanda_number,
      NEW.total,
      'Outros',
      NEW.payment_method,
      CURRENT_DATE,
      NEW.finalized_by,
      'Cancelamento da comanda ' || NEW.comanda_number
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para sincronizar venda com caixa
CREATE TRIGGER trigger_sync_pdv_sale_to_cash
AFTER UPDATE ON public.pdv_sales
FOR EACH ROW
EXECUTE FUNCTION public.sync_pdv_sale_to_cash();

-- Função para calcular subtotal dos itens de venda
CREATE OR REPLACE FUNCTION public.update_pdv_sale_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.pdv_sales
  SET 
    subtotal = COALESCE((
      SELECT SUM(subtotal) FROM public.pdv_sale_items WHERE sale_id = NEW.sale_id
    ), 0),
    total = COALESCE((
      SELECT SUM(subtotal) FROM public.pdv_sale_items WHERE sale_id = NEW.sale_id
    ), 0) - COALESCE((
      SELECT discount FROM public.pdv_sales WHERE id = NEW.sale_id
    ), 0)
  WHERE id = NEW.sale_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar totais quando itens são adicionados/removidos
CREATE TRIGGER trigger_update_pdv_sale_totals
AFTER INSERT OR UPDATE OR DELETE ON public.pdv_sale_items
FOR EACH ROW
EXECUTE FUNCTION public.update_pdv_sale_totals();
