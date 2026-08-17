-- Revogar permissões de execução de funções internas para evitar execução direta por usuários
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_order_from_production_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_order_receivable_after() FROM PUBLIC, anon, authenticated;

-- Funções auxiliares de segurança: restringir apenas para uso interno via service_role ou RLS
-- (Apesar de estarem na public para serem usadas em RLS, não precisam ser EXECUTÁVEIS diretamente via RPC por usuários)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon, authenticated;

-- Garantir que o service_role ainda possa executá-las (triggers e processos internos)
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_order_from_production_update() TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_order_receivable_after() TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO service_role;

-- Função replace_order_items: usada pelo admin no editor de pedidos
-- Revogar de anon, permitir apenas authenticated (admin)
REVOKE EXECUTE ON FUNCTION public.replace_order_items(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.replace_order_items(uuid, jsonb) TO authenticated;

-- Reforçar segurança das funções definindo search_path explicitamente
ALTER FUNCTION public.has_role(uuid, public.app_role) SET search_path = public;
ALTER FUNCTION public.is_admin(uuid) SET search_path = public;
ALTER FUNCTION public.replace_order_items(uuid, jsonb) SET search_path = public;
