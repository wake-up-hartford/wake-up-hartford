DROP POLICY IF EXISTS "Authenticated users can read addresses" ON public.hartford_addresses;
REVOKE SELECT ON public.hartford_addresses FROM authenticated, anon;
GRANT ALL ON public.hartford_addresses TO service_role;