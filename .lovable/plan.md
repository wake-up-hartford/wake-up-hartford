
# Hybrid Neighborhood Data: CTData Primary, Census Fallback

## Goal
Transition all ~830 CT census tracts to a Supabase-backed store sourced from CT Data Collaborative. This will dramatically improve speed and reliability compared to live Census API calls.

## Architecture
- **CT Tracts**: Pulled from `tract_indicators` table (Supabase).
- **Non-CT Tracts**: Fallback to live Census/USDA API.
- **State Averages**: Stored in a dedicated single-row table to avoid re-computation.

## Supabase Schema Sketch (for CT Data Collaborative)
This is the suggested schema for the data feed. We store raw numeric values to keep formatting and "severity" logic in the application.

```sql
-- Main indicator table (indexed by FIPS)
create table public.tract_indicators (
  fips                  text primary key,           -- 11-char GEOID
  state_fips            text not null,              -- '09' for CT
  county_fips           text not null,              -- Planning region (110–190)
  tract_name            text not null,              -- e.g., '5011.00'
  town                  text,                       -- e.g., 'Hartford'
  neighborhood          text,                       -- Local neighborhood name if available

  -- ACS 5-Year Indicators
  population            integer,
  child_poverty_pct     numeric(5,2),
  median_household_income integer,                  -- USD
  unemployment_pct      numeric(5,2),
  no_hs_diploma_pct     numeric(5,2),
  uninsured_pct         numeric(5,2),
  pre_1960_housing_pct  numeric(5,2),
  severe_rent_burden_pct numeric(5,2),
  renter_share_pct      numeric(5,2),

  -- External Flags
  usda_low_access       boolean,                    -- Food desert flag

  -- Potential CTData Exclusives
  eviction_filing_rate  numeric(6,2),
  lead_risk_index       numeric(5,2),

  source_vintage        text not null,              -- e.g., 'ACS 2018-2022'
  updated_at            timestamptz default now()
);

-- Pre-computed statewide averages
create table public.ct_state_averages (
  id                    smallint primary key default 1 check (id = 1),
  child_poverty_pct     numeric(5,2),
  median_household_income integer,
  unemployment_pct      numeric(5,2),
  no_hs_diploma_pct     numeric(5,2),
  uninsured_pct         numeric(5,2),
  pre_1960_housing_pct  numeric(5,2),
  severe_rent_burden_pct numeric(5,2),
  renter_share_pct      numeric(5,2),
  updated_at            timestamptz default now()
);

-- Grants
grant select on public.tract_indicators to anon, authenticated;
grant select on public.ct_state_averages to anon, authenticated;
```

## Implementation Steps
1. **Migrations**: Create the tables and enable RLS (public read, service_role write).
2. **Refresh Job**: Create a server route `/api/public/hooks/refresh-indicators` to ingest CTData updates via `pg_cron`.
3. **App Logic**: Update `src/lib/tract-indicators.functions.ts` to check Supabase first for CT tracts before falling back to Census.
