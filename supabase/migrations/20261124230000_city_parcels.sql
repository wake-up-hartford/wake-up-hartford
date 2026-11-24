-- Adds the city's Parcels with Property Owners dataset to the nightly refresh.
-- scripts/refresh-city-data.ts loads every parcel into city_refresh_parcels,
-- and apply_city_refresh() replaces hartford_parcels and links each address
-- to its building, which gives Your Home the year built, the number of units,
-- the assessor's owner and, for organization owners, a mailing address.
--
-- How an address finds its building:
--   1. By the parcel IDs on its own code enforcement and 311 records. A record
--      can name one condo unit or the condo association; both share the
--      building's GIS_PIN, so the address gets the whole building.
--   2. If no record has a parcel ID that matches, by street address.
--   3. If neither works, the address keeps the owner from code enforcement.

-- All parcels, replaced each night.
CREATE TABLE IF NOT EXISTS public.hartford_parcels (
  parcel_number text PRIMARY KEY,
  gis_pin text,
  norm_address text,
  condo_number text,
  land_use text,
  living_units integer,
  year_built integer,
  owner_name text,
  mailing_address text
);
CREATE INDEX IF NOT EXISTS hartford_parcels_gis_pin_idx ON public.hartford_parcels (gis_pin);
CREATE INDEX IF NOT EXISTS hartford_parcels_norm_address_idx ON public.hartford_parcels (norm_address);

-- Holding table: one night's download, before it is checked and swapped in.
CREATE TABLE IF NOT EXISTS public.city_refresh_parcels (LIKE public.hartford_parcels);

ALTER TABLE public.hartford_parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_refresh_parcels ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.hartford_parcels, public.city_refresh_parcels FROM anon, authenticated;
GRANT ALL ON public.hartford_parcels, public.city_refresh_parcels TO service_role;

-- Building details on each address, filled in by apply_city_refresh().
ALTER TABLE public.hartford_addresses
  ADD COLUMN IF NOT EXISTS gis_pin text,
  ADD COLUMN IF NOT EXISTS parcel_match text,          -- 'parcel_id', 'address' or null
  ADD COLUMN IF NOT EXISTS year_built integer,
  ADD COLUMN IF NOT EXISTS living_units integer,
  ADD COLUMN IF NOT EXISTS is_condo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS owner_count integer,
  ADD COLUMN IF NOT EXISTS owner_source text,          -- 'assessor' or 'code_enforcement'
  ADD COLUMN IF NOT EXISTS owner_mailing_address text, -- organizations only
  ADD COLUMN IF NOT EXISTS code_owner_name text;       -- owner on the newest code enforcement case

-- Keep what code enforcement said, so the nightly job can fall back to it.
UPDATE public.hartford_addresses SET code_owner_name = owner_name
WHERE code_owner_name IS NULL AND owner_name IS NOT NULL;

-- True for owners that are companies, trusts, agencies and the like, whose
-- mailing address is public business information. False for people.
-- "CO" counts only on its own ("SMITH & CO"), not in "CO-TRUSTEE".
CREATE OR REPLACE FUNCTION public.is_organization_owner(name text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT coalesce(name, '') ~* (
    '\m(LLC|L L C|LLLP|LLP|LP|INC|INCORPORATED|CORP|CORPORATION|CO(?!-)|COMPANY|LTD|LIMITED|PC|PLLC'
    '|TRUST|ASSOC|ASSN|ASSOCIATES|ASSOCIATION|AUTHORITY|AGENCY|HOUSING|PARTNERS|PARTNERSHIP'
    '|PROPERTIES|PROPERTY|REALTY|HOLDINGS|HOLDING|MANAGEMENT|MGMT|GROUP|ENTERPRISES'
    '|INVESTMENTS|INVESTMENT|INVESTORS|DEVELOPMENT|REDEVELOPMENT|VENTURES|CAPITAL|FUND'
    '|FOUNDATION|SOCIETY|CHURCH|MINISTRIES|BANK|UNIVERSITY|COLLEGE|HOSPITAL|SCHOOL'
    '|CONDOMINIUM|CONDOMINIUMS|CONDO|COOPERATIVE|COOP|CITY OF|STATE OF|TOWN OF|USA)\M'
  );
$$;

-- Empties the holding tables before a new download.
CREATE OR REPLACE FUNCTION public.start_city_refresh()
RETURNS void
LANGUAGE sql
SET search_path = public
AS $$
  TRUNCATE public.city_refresh_violations, public.city_refresh_311, public.city_refresh_parcels;
$$;

-- The old two-count version is replaced by one that also checks parcels.
DROP FUNCTION IF EXISTS public.apply_city_refresh(integer, integer, numeric);

-- Checks the night's download and swaps it in, all in one transaction: if any
-- check fails, nothing changes and residents keep the last good copy.
CREATE OR REPLACE FUNCTION public.apply_city_refresh(
  expected_violations integer,
  expected_311 integer,
  expected_parcels integer,
  min_share numeric DEFAULT 0.95
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  staged_violations integer;
  staged_311 integer;
  staged_parcels integer;
  current_violations integer;
  current_parcels integer;
  new_addresses integer;
  requests_upserted integer;
  linked_by_parcel_id integer;
  linked_by_address integer;
  assessor_owners integer;
  result jsonb;
BEGIN
  SELECT count(*) INTO staged_violations FROM city_refresh_violations;
  SELECT count(*) INTO staged_311 FROM city_refresh_311;
  SELECT count(*) INTO staged_parcels FROM city_refresh_parcels;
  SELECT count(*) INTO current_violations FROM hartford_code_violations;
  SELECT count(*) INTO current_parcels FROM hartford_parcels;

  -- The holding tables must hold exactly what the script downloaded.
  IF staged_violations <> expected_violations OR staged_311 <> expected_311
     OR staged_parcels <> expected_parcels THEN
    RAISE EXCEPTION 'Holding tables are incomplete: % of % code violations, % of % 311 requests, % of % parcels',
      staged_violations, expected_violations, staged_311, expected_311, staged_parcels, expected_parcels;
  END IF;

  -- A sharp drop usually means a broken download, not a real change.
  IF staged_violations < current_violations * min_share THEN
    RAISE EXCEPTION 'Only % code violations downloaded, under % of the % on file',
      staged_violations, min_share, current_violations;
  END IF;
  IF staged_parcels < current_parcels * min_share THEN
    RAISE EXCEPTION 'Only % parcels downloaded, under % of the % on file',
      staged_parcels, min_share, current_parcels;
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

  -- The owner named on each address's most recent code enforcement case.
  UPDATE hartford_addresses h
  SET code_owner_name = o.owner_name
  FROM (
    SELECT DISTINCT ON (norm_address) norm_address, owner_name
    FROM city_refresh_violations
    WHERE owner_name IS NOT NULL AND btrim(owner_name) <> ''
    ORDER BY norm_address, opened_at DESC NULLS LAST
  ) o
  WHERE h.norm_address = o.norm_address
    AND h.code_owner_name IS DISTINCT FROM o.owner_name;

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

  -- Parcels: the city's file is complete, so it replaces ours.
  DELETE FROM hartford_parcels WHERE true;
  INSERT INTO hartford_parcels
  SELECT DISTINCT ON (parcel_number) * FROM city_refresh_parcels ORDER BY parcel_number;

  -- Link each address to one building (GIS_PIN).
  CREATE TEMP TABLE address_building ON COMMIT DROP AS
  WITH record_ids AS (
    SELECT norm_address, parcel_id FROM hartford_code_violations WHERE parcel_id IS NOT NULL
    UNION ALL
    SELECT norm_address, parcel_id FROM hartford_311_complaints WHERE parcel_id IS NOT NULL
  ),
  record_buildings AS (
    -- A record's parcel ID is usually a parcel number (a unit, a house or a
    -- condo association); now and then it is the building's GIS_PIN itself.
    SELECT r.norm_address, p.gis_pin
    FROM record_ids r
    JOIN hartford_parcels p ON p.parcel_number = r.parcel_id
    WHERE p.gis_pin IS NOT NULL
    UNION ALL
    SELECT r.norm_address, r.parcel_id
    FROM record_ids r
    WHERE NOT EXISTS (SELECT 1 FROM hartford_parcels p WHERE p.parcel_number = r.parcel_id)
      AND EXISTS (SELECT 1 FROM hartford_parcels p WHERE p.gis_pin = r.parcel_id)
  ),
  by_parcel_id AS (
    -- The building its records point to most often.
    SELECT DISTINCT ON (norm_address) norm_address, gis_pin, 'parcel_id'::text AS parcel_match
    FROM record_buildings
    GROUP BY norm_address, gis_pin
    ORDER BY norm_address, count(*) DESC, gis_pin
  ),
  by_address AS (
    -- The building with the most parcels at that street address.
    SELECT DISTINCT ON (p.norm_address) p.norm_address, p.gis_pin, 'address'::text AS parcel_match
    FROM hartford_parcels p
    WHERE p.norm_address IS NOT NULL AND p.gis_pin IS NOT NULL
    GROUP BY p.norm_address, p.gis_pin
    ORDER BY p.norm_address, count(*) DESC, p.gis_pin
  )
  SELECT h.norm_address,
         coalesce(i.gis_pin, a.gis_pin) AS gis_pin,
         coalesce(i.parcel_match, a.parcel_match) AS parcel_match
  FROM hartford_addresses h
  LEFT JOIN by_parcel_id i ON i.norm_address = h.norm_address
  LEFT JOIN by_address a ON a.norm_address = h.norm_address;

  -- What each building looks like. Condo association records (CNDASC) are
  -- the building's common areas, not a home, so they are left out of the
  -- owner and unit counts.
  CREATE TEMP TABLE building ON COMMIT DROP AS
  WITH homes AS (
    SELECT * FROM hartford_parcels
    WHERE gis_pin IS NOT NULL AND coalesce(condo_number, '') <> 'CNDASC'
  ),
  owners AS (
    SELECT gis_pin,
           count(DISTINCT owner_name)::integer AS owner_count,
           min(owner_name) AS one_owner,
           min(mailing_address) AS one_mailing
    FROM homes
    WHERE owner_name IS NOT NULL
    GROUP BY gis_pin
  ),
  shape AS (
    SELECT gis_pin,
           min(year_built) FILTER (WHERE year_built > 1600) AS year_built,
           nullif(sum(coalesce(living_units, 0)), 0)::integer AS living_units,
           (count(*) > 1 OR bool_or(land_use ILIKE '%CONDO%')) AS is_condo
    FROM homes
    GROUP BY gis_pin
  )
  SELECT s.*, coalesce(o.owner_count, 0) AS owner_count, o.one_owner, o.one_mailing
  FROM shape s
  LEFT JOIN owners o ON o.gis_pin = s.gis_pin;

  UPDATE hartford_addresses h
  SET gis_pin = ab.gis_pin,
      parcel_match = ab.parcel_match,
      year_built = b.year_built,
      living_units = b.living_units,
      is_condo = coalesce(b.is_condo, false),
      owner_count = b.owner_count,
      owner_source = CASE WHEN b.owner_count = 1 THEN 'assessor'
                          WHEN h.code_owner_name IS NOT NULL THEN 'code_enforcement' END,
      owner_name = CASE WHEN b.owner_count = 1 THEN b.one_owner
                        ELSE coalesce(h.code_owner_name, h.owner_name) END,
      owner_mailing_address = CASE WHEN b.owner_count = 1 AND is_organization_owner(b.one_owner)
                                   THEN b.one_mailing END
  FROM address_building ab
  LEFT JOIN building b ON b.gis_pin = ab.gis_pin
  WHERE h.norm_address = ab.norm_address;

  SELECT count(*) FILTER (WHERE parcel_match = 'parcel_id'),
         count(*) FILTER (WHERE parcel_match = 'address'),
         count(*) FILTER (WHERE owner_source = 'assessor')
  INTO linked_by_parcel_id, linked_by_address, assessor_owners
  FROM hartford_addresses;

  TRUNCATE city_refresh_violations, city_refresh_311, city_refresh_parcels;

  result := jsonb_build_object(
    'code_violations', staged_violations,
    'code_violations_before', current_violations,
    'requests_311_added_or_updated', requests_upserted,
    'parcels', staged_parcels,
    'new_addresses', new_addresses,
    'addresses_linked_by_parcel_id', linked_by_parcel_id,
    'addresses_linked_by_street_address', linked_by_address,
    'addresses_with_assessor_owner', assessor_owners
  );
  INSERT INTO city_refresh_runs (outcome, detail) VALUES ('applied', result);
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_city_refresh(integer, integer, integer, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_city_refresh(integer, integer, integer, numeric) TO service_role;
REVOKE ALL ON FUNCTION public.start_city_refresh() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.start_city_refresh() TO service_role;
