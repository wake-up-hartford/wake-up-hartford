-- Supabase blocks a DELETE with no WHERE clause (its safeupdate guard), so the
-- first refresh rolled back at "DELETE FROM hartford_code_violations". Same
-- function as 20261124190000_city_data_refresh.sql, with "WHERE true" added to
-- that one line. A DELETE, unlike TRUNCATE, lets residents keep reading the
-- old rows until the swap commits.
CREATE OR REPLACE FUNCTION public.apply_city_refresh(
  expected_violations integer,
  expected_311 integer,
  min_share numeric DEFAULT 0.95
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  staged_violations integer;
  staged_311 integer;
  current_violations integer;
  new_addresses integer;
  owners_updated integer;
  requests_upserted integer;
  result jsonb;
BEGIN
  SELECT count(*) INTO staged_violations FROM city_refresh_violations;
  SELECT count(*) INTO staged_311 FROM city_refresh_311;
  SELECT count(*) INTO current_violations FROM hartford_code_violations;

  -- The holding tables must hold exactly what the script downloaded.
  IF staged_violations <> expected_violations OR staged_311 <> expected_311 THEN
    RAISE EXCEPTION 'Holding tables are incomplete: % of % code violations, % of % 311 requests',
      staged_violations, expected_violations, staged_311, expected_311;
  END IF;

  -- A sharp drop usually means a broken download, not a real change.
  IF staged_violations < current_violations * min_share THEN
    RAISE EXCEPTION 'Only % code violations downloaded, under % of the % on file',
      staged_violations, min_share, current_violations;
  END IF;

  -- New addresses first: both record tables point at hartford_addresses.
  INSERT INTO hartford_addresses (norm_address, display_address)
  SELECT DISTINCT norm_address, norm_address
  FROM (
    SELECT norm_address FROM city_refresh_violations
    UNION ALL
    SELECT norm_address FROM city_refresh_311
  ) a
  ON CONFLICT (norm_address) DO NOTHING;
  GET DIAGNOSTICS new_addresses = ROW_COUNT;

  -- Owner = the owner named on the address's most recent code enforcement case.
  UPDATE hartford_addresses h
  SET owner_name = o.owner_name
  FROM (
    SELECT DISTINCT ON (norm_address) norm_address, owner_name
    FROM city_refresh_violations
    WHERE owner_name IS NOT NULL AND btrim(owner_name) <> ''
    ORDER BY norm_address, opened_at DESC NULLS LAST
  ) o
  WHERE h.norm_address = o.norm_address
    AND h.owner_name IS DISTINCT FROM o.owner_name;
  GET DIAGNOSTICS owners_updated = ROW_COUNT;

  -- The city's code enforcement file covers 2020 to now, so it replaces ours.
  DELETE FROM hartford_code_violations WHERE true;
  INSERT INTO hartford_code_violations
    (norm_address, case_number, description, status, opened_at, closed_at, dept_division, record_type, parcel_id)
  SELECT norm_address, case_number, description, status, opened_at, closed_at, dept_division, record_type, parcel_id
  FROM city_refresh_violations;

  -- 311 files are yearly: add new requests and update existing ones.
  -- Older years stay in our table.
  INSERT INTO hartford_311_complaints
    (norm_address, request_number, type, status, department, opened_at, parcel_id)
  SELECT DISTINCT ON (request_number)
    norm_address, request_number, type, status, department, opened_at, parcel_id
  FROM city_refresh_311
  ORDER BY request_number
  ON CONFLICT (request_number) DO UPDATE SET
    norm_address = EXCLUDED.norm_address,
    type = EXCLUDED.type,
    status = EXCLUDED.status,
    department = EXCLUDED.department,
    opened_at = EXCLUDED.opened_at,
    parcel_id = EXCLUDED.parcel_id;
  GET DIAGNOSTICS requests_upserted = ROW_COUNT;

  TRUNCATE city_refresh_violations, city_refresh_311;

  result := jsonb_build_object(
    'code_violations', staged_violations,
    'code_violations_before', current_violations,
    'requests_311_added_or_updated', requests_upserted,
    'new_addresses', new_addresses,
    'owners_updated', owners_updated
  );
  INSERT INTO city_refresh_runs (outcome, detail) VALUES ('applied', result);
  RETURN result;
END;
$$;

-- CREATE OR REPLACE keeps the existing grants; restated here to be safe.
REVOKE ALL ON FUNCTION public.apply_city_refresh(integer, integer, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_city_refresh(integer, integer, numeric) TO service_role;
