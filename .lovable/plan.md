## Goal
Change the "Food access (USDA)" indicator to use the USDA Food Access Research Atlas **LILA_halfand10** measure (low-income tracts where a significant number/share of residents are >½ mile urban or >10 miles rural from the nearest supermarket) instead of the current **LILA_1and10** (1 mile / 10 miles) measure.

## Changes

1. **Regenerate `src/data/usda-food-access.json`**
   - Download the latest USDA Food Access Research Atlas tract-level dataset.
   - Filter rows where `LILA_halfand10 = 1` (instead of the current `LILA_1and10 = 1`).
   - Write the resulting list of 11-digit tract FIPS codes back to the same JSON file (same shape — a flat `string[]`), so no code that consumes it needs to change structurally.

2. **Update copy in `src/lib/tract-indicators.functions.ts`** (the only place that references the flag)
   - Change the indicator `note` for the flagged case from:
     > "USDA classifies this tract as low-income and more than 1 mile from a supermarket."
   
     to:
     > "USDA classifies this tract as low-income and more than ½ mile (urban) or 10 miles (rural) from the nearest supermarket."
   - Update the unflagged `note` to match the new threshold wording.
   - Label stays "Food access (USDA)"; severity logic (concern vs good) and the "Low-access" / "OK" values stay the same.

## Out of scope
- No UI/layout changes on the neighborhood page.
- No changes to other indicators or the Manual / resident notice docs.
- The threshold values in `tier()` for other indicators are untouched.

## Technical notes
- USDA Food Access Research Atlas dataset is published as an Excel workbook (`Food Access Research Atlas.xlsx`, sheet "Food Access Research Atlas") at ers.usda.gov. The regeneration script will fetch it, read the `LILA_halfand10` column with the `CensusTract` column, and emit the JSON.
- The current JSON has ~1k–2k entries; the ½-mile/10-mile measure flags substantially more tracts, so file size will grow modestly (still well under 100 KB).
