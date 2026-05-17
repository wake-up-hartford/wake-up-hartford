## Goal

Bring the Detailed tab in line with the new Report Card style (large colored dot on the left instead of a text pill), and where it makes sense, show how each tract value compares to the Connecticut statewide average.

## Changes

### 1. Fetch CT statewide values alongside the tract

In `src/lib/tract-indicators.functions.ts`:
- Inside `getTractIndicators`, add a third `fetchACS` call in the same `Promise.all` for `for=state:09` (B-vars) and a fourth for the S-table — so we get the same metrics computed for all of Connecticut.
- Compute the same derived percentages (`childPovPct`, `medIncVal`, `unempPct`, `noHsPct`, `uninsPct`, `pre1960Pct`, `severeRentPct`, `renterPct`) for CT.
- Extend each `Indicator` with an optional `stateAverage` field:
  ```ts
  stateAverage?: { value: string; raw: number | null; label: string }
  ```
  populated for every indicator except `population` and `food_access` (no meaningful state-wide comparison for those).
- The `label` is the pre-formatted comparison string ("CT average: 12.4%" or "CT average: $86,200").

### 2. Update the Detailed tab UI

In `src/routes/neighborhood.tsx`, `NeighborhoodDetailed`:
- Replace the right-side `SeverityPill` with the same left-side colored dot used in `IndicatorRow` (reuse `dotClass`).
- Under the indicator's `note`, when `stateAverage` is present, render a small comparison line:
  - Shows "CT average: {value}"
  - When both raw numbers are numeric, append a short delta like "— 4.2 pts above" / "5.1 pts below" / "about the same" (≤0.5 pts).
  - For median income, use dollar delta instead of "pts" (e.g. "$12,400 below").
- Keep the existing "Where this comes from" card; update the copy to note comparisons are vs. the Connecticut statewide ACS figure.

### 3. No other tabs change

Report Card, Share, and Print tabs stay as they are. (Print could later include the CT average column, but that's out of scope unless you want it.)

## Technical notes

- CT-level ACS calls use the same endpoints (`acs/acs5` and `acs/acs5/subject`) with `for=state:09` — one extra round trip each, parallelized, so latency impact is minimal and the existing 1-hour query cache covers it.
- Severity tiers stay tract-based (unchanged); the CT average is informational only.
- `population` and `food_access` indicators intentionally skip the comparison line.

## Open question

Want the comparison delta shown as plain text (default above), or as a tiny colored chip (green if better than CT, red if worse)?
