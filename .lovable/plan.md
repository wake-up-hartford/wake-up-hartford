## Goal

On `/neighborhood`, give people two equal-weight ways to choose a tract:
1. **Type an address** (existing flow)
2. **Tap a tract on the map** of the 19 NAACP Greater Hartford target tracts

Tapping a polygon highlights it and shows a small popover with the tract name + neighborhood + a "View report" button. Confirming swaps the tract in (same hook as the address lookup) and the indicators below refresh.

## The 19 target tracts (Hartford, CT — FIPS 09/003)

```
Northeast        5001, 5002, 5003, 5004, 5005, 5006
Blue Hills       5007, 5008, 5009
Upper Albany     5012, 5013, 5014, 5015
N. End adjacent  5011, 5016, 5017, 5018, 5019, 5020
```

State `09`, County `003`. Census tract IDs become 6-digit: `500100`, `500200`, …, `502000`.

## UX

Above the existing "Look Up Additional Address" panel, add a new collapsible section "**Choose your neighborhood**" with a one-paragraph intro:

> Find your tract by tapping it on the map below, or look up any address in the country. The 19 highlighted tracts are NAACP Greater Hartford's primary focus — Northeast, Blue Hills, Upper Albany, and adjacent North End neighborhoods.

Below the intro, two tabs (or stacked sections on mobile, given the 390px viewport):
- **Map** (default) — Leaflet map showing all 19 tract polygons, color-grouped by neighborhood (Northeast / Blue Hills / Upper Albany / Adjacent). Currently selected tract gets a brighter fill + thicker border.
- **Address** — the existing `CensusTractLookup` component, unchanged.

Tap flow on the map:
1. Tap polygon → that tract highlights, a small popover/sheet appears with the tract name, neighborhood, and a "View this neighborhood" button.
2. Tap the button → `handleResolved(tract)` runs (same path as address lookup), the map collapses, indicators reload.

Non-target tracts are not on this map — those are reachable via address lookup only.

## Technical approach

**Library**: Leaflet + OpenStreetMap tiles via `react-leaflet`. No API key. Bundle weight ~45kb gzipped. Already plays well with TanStack Start; load the map component with a `client:only`-style dynamic import to keep SSR clean (Leaflet touches `window` at module scope).

**Polygon data**: Bundle a single static GeoJSON file at `src/data/hartford-target-tracts.geojson` containing only the 19 tract polygons plus properties `{ tract, tractName, neighborhood, group }`. Source: US Census TIGER/Line 2022 cartographic boundary file for CT tracts, filtered to the 19 GEOIDs and simplified (mapshaper, ~5% retention) — typically 30–60 KB. I'll fetch + filter + simplify it once during the build and commit the result; no runtime Census calls needed.

**Files**:
- `src/data/hartford-target-tracts.geojson` — the bundled polygons (new)
- `src/data/hartford-target-tracts.ts` — typed list of the 19 tracts + neighborhood groupings, used by both the map and any future filters (new)
- `src/components/TargetTractMap.tsx` — Leaflet map component (new). Props: `selectedTract`, `onSelect(tract)`. Uses `react-leaflet`'s `MapContainer`, `TileLayer`, `GeoJSON`, with `style`/`onEachFeature` for color + click + popup.
- `src/routes/neighborhood.tsx` — wire the new "Choose your neighborhood" section above the existing lookup; reuse `handleResolved`.
- `package.json` — add `leaflet`, `react-leaflet`, `@types/leaflet`.

**SSR safety**: Import `TargetTractMap` via `React.lazy` + `<Suspense>` and only render it client-side (`typeof window !== "undefined"` guard or a small `useIsClient` hook), since Leaflet expects `window` at import time.

**Styling**: Four fill colors mapped to the four neighborhood groups, using existing semantic tokens (`--primary`, `--success`, `--warning`, plus one accent). Selected polygon = `--primary` fill at higher opacity + 2px border. Hover = slight opacity bump. Tract labels shown only on tap (not always-on), to keep the small map legible at 390px width.

**Map sizing**: ~280px tall, full width of the content column. Fit-bounds to the 19-tract envelope on mount. Pan/zoom enabled but bounded to Hartford so users can't drift away.

## Out of scope

- Adding tract polygons for non-target tracts.
- Persisting which tract was last viewed (already handled by `useStoredAddress`).
- Changing the indicator/report-card UI itself.
