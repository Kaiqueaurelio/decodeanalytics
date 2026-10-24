-- SECURITY DEFINER helpers are only intended for authenticated permission checks.
-- Remove the default PUBLIC execute privilege and grant only to authenticated sessions.
REVOKE ALL ON FUNCTION public.has_role(public.app_role, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(public.app_role, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
