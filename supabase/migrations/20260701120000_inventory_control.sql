CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  sku TEXT,
  unit TEXT NOT NULL DEFAULT 'un',
  current_quantity NUMERIC NOT NULL DEFAULT 0 CHECK (current_quantity >= 0),
  min_quantity NUMERIC NOT NULL DEFAULT 0 CHECK (min_quantity >= 0),
  cost_price NUMERIC NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  location TEXT,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(service_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_service_id ON public.inventory_items(service_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_active ON public.inventory_items(active);
CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON public.inventory_items(sku);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida', 'ajuste')),
  quantity NUMERIC NOT NULL CHECK (quantity >= 0),
  previous_quantity NUMERIC NOT NULL DEFAULT 0,
  new_quantity NUMERIC NOT NULL DEFAULT 0,
  reason TEXT,
  reference TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_item_id ON public.inventory_movements(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON public.inventory_movements(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_items TO authenticated;
GRANT SELECT, INSERT ON public.inventory_movements TO authenticated;
GRANT ALL ON public.inventory_items TO service_role;
GRANT ALL ON public.inventory_movements TO service_role;

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventory_items_read" ON public.inventory_items
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'atendente')
    OR public.has_role(auth.uid(),'financeiro') OR public.has_role(auth.uid(),'producao')
  );

CREATE POLICY "inventory_items_insert" ON public.inventory_items
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'atendente')
    OR public.has_role(auth.uid(),'financeiro')
  );

CREATE POLICY "inventory_items_update" ON public.inventory_items
  FOR UPDATE TO authenticated
  USING (
    public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'atendente')
    OR public.has_role(auth.uid(),'financeiro') OR public.has_role(auth.uid(),'producao')
  )
  WITH CHECK (
    public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'atendente')
    OR public.has_role(auth.uid(),'financeiro') OR public.has_role(auth.uid(),'producao')
  );

CREATE POLICY "inventory_items_delete" ON public.inventory_items
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'financeiro'));

CREATE POLICY "inventory_movements_read" ON public.inventory_movements
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'atendente')
    OR public.has_role(auth.uid(),'financeiro') OR public.has_role(auth.uid(),'producao')
  );

CREATE POLICY "inventory_movements_insert" ON public.inventory_movements
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'atendente')
    OR public.has_role(auth.uid(),'financeiro') OR public.has_role(auth.uid(),'producao')
  );

CREATE TRIGGER trg_inventory_items_updated BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
