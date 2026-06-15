## Goal
Replace the mock data on `/home` ("Your Home") with live data loaded from the two Hartford CSVs into Lovable Cloud, drop the Evictions and Utility Shutoffs cards, and show "Not available" for the fields the dataset doesn't cover.

## 1. Database schema (migration)

Create three tables in `public`:

- **`hartford_addresses`** — one row per normalized address
  - `norm_address` (text, PK)  — e.g. `555 MAIN ST`
  - `display_address` (text)   — best-formatted original, e.g. `555 MAIN ST`
  - `owner_name` (text, nullable) — most common Property_Owner seen for that address
- **`hartford_code_violations`**
  - `norm_address` (text, FK → hartford_addresses)
  - `case_number`, `description`, `status` (text)
  - `opened_at` (date, nullable), `closed_at` (date, nullable)
  - `dept_division`, `record_type` (text)
  - index on `(norm_address)` and `(status)`
- **`hartford_311_complaints`**
  - `norm_address` (text, FK → hartford_addresses)
  - `request_number`, `type`, `status`, `department` (text)
  - `opened_at` (date, nullable)
  - index on `(norm_address)` and `(type)`

Grants: `SELECT` to `anon` and `authenticated` (public read-only data, no PII), `ALL` to `service_role`. RLS enabled with a single `USING (true)` SELECT policy on each table.

## 2. Data load (one-time)

Write a Python script that:
1. Reads both CSVs from `/mnt/user-uploads/`.
2. Filters to Hartford rows with a non-empty address.
3. Normalizes addresses with a single shared function:
   - Uppercase, trim, collapse whitespace.
   - Drop unit/apt designators and anything after the street type so `555 MAIN STREET UNIT 4B` → `555 MAIN ST`.
   - Expand common suffix aliases (STREET→ST, AVENUE→AV, etc.) so user input and the dataset converge.
   - Drop trailing city/state/zip if present.
4. Builds the three datasets and writes them as CSV files in `/tmp/`.
5. Bulk-loads via `psql ... \\COPY` from the temp files.
6. Updates `hartford_addresses.owner_name` with the most common `Property_Owner` per address (a single SQL UPDATE using a subquery).

This is a one-shot bootstrap; the script lives in `/tmp/` and isn't checked in.

## 3. Server functions (`src/lib/address-lookup.functions.ts`)

Public (no auth) `createServerFn`s using `supabaseAdmin` loaded inside the handler:

- **`lookupAddress({ query })`** → returns either `{ status: 'not_found' }` or:
  ```ts
  {
    status: 'found',
    address: { display, normalized, owner },
    counts: { violationsOpen, violationsClosed12mo, complaints12mo, topComplaintType },
    recentViolations: Array<{ date, description, status }>, // top 5 most recent
    recent311: Array<{ date, type }>,                       // top 5 most recent
    portfolio: {
      propertiesInHartford: number,
      totalOpenViolations: number,
      totalComplaints12mo: number,
    } | null,
  }
  ```
  Implementation: normalize the query with the same function used during load, look up the address row, then run parallel aggregate queries for counts, recent rows, and (if owner present) owner portfolio rollups.

## 4. `/home` page changes (`src/routes/home.tsx`)

- Replace the `lookupAddress` import from `@/lib/mock-data` with the server-function call, using TanStack Query (`useQuery` keyed on the normalized address). Loader stays unchanged; the page is public so we won't put it in a route loader — the existing in-component pattern is fine and avoids the auth gate.
- Show a loading state and a "Not found" state when the server function returns `not_found` (offers "Try another address" → resets state).
- Remove the mock-data amber warning banner.
- Drop the `<ExpandableIndicator>` for **Evictions filed** and **Utility shutoffs** in `DetailedReport`.
- Drop the matching Evictions and Utility Shutoffs rows from `ShareSlideshow` slides, `PrintReport` HTML grid and detail sections, and the Print preview tile.
- For fields not in the dataset, show `Not available`:
  - In the blue address card: `Built — · — units` becomes "Built date and unit count not available" when missing.
  - `LandlordCard`: show owner name from data; phone/email/mailing render "Not available" with greyed style; portfolio block shows the three live metrics and "Not available" for `totalUnits` and `totalEvictions12mo`.
  - Area Report Card section in the print HTML: hide entirely (it's already only used in `PrintReport`'s header sub-line — confirm and remove if so).
- `BuildingStoryDialog`: update the prop mapping so it no longer references `evictions` or `utilityShutoffs` (and the AI prompt won't be asked to write about them). Mirror change in `src/lib/building-story.functions.ts` — drop those fields from input validator and prompt.

## 5. Cleanup

- Leave `src/lib/mock-data.ts` in place for the time being but stop importing it from `/home`. The `AddressLookup` type stays as the shape the building-story dialog and other places consume.
- `useStoredAddress` (`src/lib/address-store.ts`) is untouched; we still persist the user's last-looked-up address as a raw string.

## Technical details (for the developer view)

- All address normalization is one function shared by the Python loader and `address-lookup.functions.ts`. Suffix map: `STREET|ST., AVENUE|AVE|AV., BOULEVARD|BLVD, ROAD|RD, DRIVE|DR, LANE|LN, COURT|CT, PLACE|PL, TERRACE|TER, PARKWAY|PKWY, CIRCLE|CIR, HIGHWAY|HWY`.
- "Last 12 months" for the 311 file is the whole file (it's already current-year). For violations, filter `opened_at >= now() - interval '12 months'` only for the "closed in last year" stat; recent-list ordering is by `opened_at desc`.
- `topComplaintType` = SQL `mode() within group (order by type)` per address.
- Portfolio rollups: `count(distinct norm_address)` and `sum`/`count` joins on `owner_name` (exact match — owner strings in the CSV are messy but consistent enough for a first pass).
- Public read uses `supabaseAdmin` because we don't want anon RLS exposure of every CSV column; we shape DTOs server-side. Even though SELECT is granted to anon, accessing via the admin client keeps query shape locked down.

## Deliverable
A live `/home` lookup against ~32k violations and ~6k 311 records covering ~19k Hartford addresses, with the two requested cards removed and missing fields gracefully marked "Not available".
