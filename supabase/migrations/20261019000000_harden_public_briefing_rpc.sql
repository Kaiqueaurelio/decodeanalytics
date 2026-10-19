-- Tighten the public briefing RPC's execution surface.
-- The token remains the intended capability for public access. Keep the function
-- callable only by the roles used by the public client and logged-in staff.
ALTER FUNCTION public.get_public_briefing(UUID)
  SET search_path = '';

REVOKE ALL ON FUNCTION public.get_public_briefing(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_briefing(UUID) TO anon, authenticated;
