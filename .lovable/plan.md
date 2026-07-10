Add a small coverage summary that tells users how many distinct 2020 U.S. Census tracts are represented by the Hartford addresses in the database.

What will be built

- Database migration: add a `census_tract` text column to `public.hartford_addresses` (nullable, no default) so each address can store its tract once it is geocoded.
- Backfill server function: `refreshCensusTracts` in `src/lib/address-lookup.functions.ts` (or a new `src/lib/coverage.functions.ts`) that geocodes every address without a tract using the free U.S. Census Geocoder API, extracts the 2020 census tract, and updates the row. It will process rows in small chunks to stay within server-function time limits.
- Summary server function: `getCoverageSummary` that returns:
  - total address count
  - number of addresses with a tract assigned
  - number of distinct census tracts covered
- UI on `/home`: a small `Card` above the lookup tabs showing the summary numbers, e.g. "10,156 addresses across 47 census tracts". It will use a TanStack Query hook with `useServerFn` and a short stale time so the numbers are fresh.

Technical details

- The Census Geocoder API endpoint is `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress` with `benchmark=Public_AR_Current` and `vintage=Current_Current` and `format=json`. No API key is required.
- The geocode response includes `Census Tracts` under `geographies`, from which we read the `GEOID` or `NAME` field.
- The backfill is idempotent: it only processes rows where `census_tract IS NULL`, so it can be re-run safely as new addresses are added.
- The summary function uses the publishable/admin client (the table is only read server-side) and counts distinct non-null `census_tract` values.
- The UI will use the existing `Card` component and match the current "Your Home" visual style (muted text, small labels, large numbers).

Out of scope

- No neighborhood boundary map or choropleth layer.
- No real-time geocoding of every address on every page load; we backfill once and keep the column updated.
- No automatic scheduled re-run beyond the manual backfill function.