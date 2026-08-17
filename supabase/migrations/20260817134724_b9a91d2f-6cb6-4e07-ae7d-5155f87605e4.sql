-- 1. Alterar a FK de orders para permitir exclusão em cascata (resolvendo o erro da imagem 15)
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_client_id_fkey,
ADD CONSTRAINT orders_client_id_fkey 
  FOREIGN KEY (client_id) 
  REFERENCES public.clients(id) 
  ON DELETE CASCADE;

-- 2. Dar baixa nas contas vencidas mostradas na imagem 16 (resolvendo o pedido do usuário)
-- Clientes identificados na imagem: Korine (OS #1010), ursinhos carinhosos (OS #1009), bruxa nomade (OS #1013), periferinha coahb (OS #1014)

-- Buscar IDs das OSs para garantir precisão
WITH target_orders AS (
  SELECT id FROM public.orders 
  WHERE number IN (1009, 1010, 1013, 1014)
)
UPDATE public.receivables
SET 
  status = 'pago',
  paid_at = due_date -- Definir data de pagamento como a data de vencimento (conforme pedido)
WHERE order_id IN (SELECT id FROM target_orders)
AND status != 'pago';

-- Atualizar status das OSs correspondentes
UPDATE public.orders
SET paid = total
WHERE number IN (1009, 1010, 1013, 1014);