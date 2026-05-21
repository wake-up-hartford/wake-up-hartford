## Goal

Flip column B (`FALSE` → `TRUE`) on **Gantt Chart** rows whose subtasks are already implemented in the current Wake Up Wednesday PWA codebase. No code changes; no edits to text, owners, or dates; phase header rows and parent task rows left alone (only leaf subtask rows are checked).

## Method

Use the Google Sheets connector (`values.batchUpdate`, `valueInputOption=USER_ENTERED`) to write `TRUE` to specific `B{row}` cells on the "Gantt Chart" tab. Single batched call, fully reversible.

## Rows I plan to mark TRUE

Each item is grounded in a file already in the repo. Conservative — anything ambiguous stays FALSE.

**Phase 1 — Foundation**
- B51 — Provision cloud hosting *(Lovable Cloud is live)*
- B53 — Staging + production environments *(preview + published deployments)*
- B55 — Auth + encrypted data handling *(Supabase auth + RLS in use)*
- B58 — Address entry with autocomplete *(`src/routes/building.tsx`, `BuildingAddressMap`)*
- B59 — Geocoding API integration *(Mapbox)*
- B60 — Coverage across the 19 target tracts *(`hartford-target-tracts.geojson`)*
- B64 — Ingest tract boundary shapefiles *(same geojson)*
- B65 — Point-in-polygon tract lookup *(`TargetTractMap` / address store)*
- B66 — Link tract ID to narrative + data pull *(`tract-indicators.functions.ts`)*

**Phase 2 — Your Home**
- B72 — Mobile-first address search + results layout *(`building.tsx`)*

**Phase 3 — Your Neighborhood**
- B109 — Render 19 tract boundaries *(`TargetTractMap`)*
- B110 — Click-to-select tract w/ summary *(neighborhood route)*
- B111 — Auto-highlight tract from address *(address-store → tract lookup)*
- B112 — Link tract to Neighborhood Story + metrics *(neighborhood report)*
- B113 — Mobile-touch + accessible map *(current implementation)*
- B114 — Define core metrics *(poverty rate, % of CT median income, median income $, etc. in `tract-indicators`)*
- B115 — Source metrics from ACS / CT data *(Census API calls)*
- B116 — Card-based mobile dashboard for each metric *(report card view)*
- B117 — Benchmark comparisons vs CT average *(`cmpPct` logic)*

**Phase 4 — Your Life**
- B130 — Intake question flow (housing/food/health/legal/etc.) *(`life.tsx` + survey schema)*
- B132 — Mobile-first multi-step form w/ progress *(`life.tsx`)*
- B136 — Cross-reference intake against local data *(filtered CT resource list)*
- B137 — Rank unmet needs by urgency *(domain scoring in stabilization plan)*
- B138 — AI personalized plain-language summary *(`stabilization-plan.functions.ts`, Gemini)*
- B141 — Ranked problem list *(plan weeks 1→4)*
- B142 — Each step includes action + resource link/phone *(plan_steps + ct-resources)*
- B143 — Mobile checklist format *(`plan.$planId.tsx`)*
- B145 — Auto-update on step completion *(`toggleStep`)*
- B152 — Checklist with progress indicator *(plan view)*
- B156 — Resident can update situation → recalc *(re-run intake creates new plan)*

**Phase 5 — Integration**
- B162 — Address persists across tools *(`src/lib/address-store.ts`)*

That's **30 rows** flipped to TRUE. Everything else (Phase 0 governance work, admin panel, PDF exports, heat map, 5-year projection engine, partner SLA portal, beta testing, launch, etc.) stays FALSE because it isn't built yet.

## What I will NOT do

- Won't touch column A, C, D (Owner), E/F (dates), or G (Wks).
- Won't add comments, formatting, or new rows.
- Won't mark partial items as done (e.g., "role-based admin access" is only partly true — left FALSE).
- Won't modify any source files in the PWA.

## After

I'll report the exact list of rows updated so you can spot-check. If any of my "built" calls are wrong, tell me which ones and I'll flip them back.
