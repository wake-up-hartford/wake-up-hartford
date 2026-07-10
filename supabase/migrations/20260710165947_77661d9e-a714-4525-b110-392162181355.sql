ALTER TABLE public.hartford_addresses ADD COLUMN census_tract text;

-- Ensure the service role can still manage the table fully after the schema change
GRANT ALL ON public.hartford_addresses TO service_role;