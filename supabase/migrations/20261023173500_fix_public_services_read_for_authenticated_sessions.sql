-- Public storefront products must remain readable for both anonymous visitors
-- and authenticated sessions. A logged-in customer still needs to see active items.
DROP POLICY IF EXISTS services_public_read ON public.services;

CREATE POLICY services_public_read
  ON public.services
  FOR SELECT
  TO anon, authenticated
  USING (active = true);
