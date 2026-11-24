-- The nightly city data refresh (apply_city_refresh, run with the server key)
-- inserts into both record tables, which needs their id sequences. The server
-- role had no grant on them, so the refresh stopped with "permission denied
-- for sequence hartford_code_violations_id_seq" and rolled back.
GRANT USAGE, SELECT ON SEQUENCE public.hartford_code_violations_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.hartford_311_complaints_id_seq TO service_role;
