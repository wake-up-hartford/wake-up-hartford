## Goal
Show a real photo of the looked-up address as the background of each slide in the `ShareSlideshow` on `/home`.

## Feasibility: yes
Google Maps Platform has two good options, both reachable through the Lovable Google Maps connector (gateway). The connector isn't linked yet — that's step 1 whichever option we pick.

### Option A — Street View Static Image (recommended)
- One HTTPS image URL per address, e.g. `/maps/api/streetview?location=65+AMITY+ST,Hartford,CT&size=800x600`.
- Load it as a normal `<img>` behind the slide text, dim with a dark overlay so the text stays readable.
- Best fit for "photo of the address." Works on every address Google has street coverage for (very high in Hartford).

### Option B — Places API (New) photos
- Two calls: `places:searchText` to get a `place_id`, then `places/{id}/photos/...`.
- More variety (business photos, exterior shots) but many residential addresses have no place photos, so it falls back to Street View anyway. More complexity, not clearly better here.

Recommend A, with a graceful fallback to the current gradient card when no imagery is returned.

## What it entails
1. **Connect Google Maps Platform** via `standard_connectors--connect` (`google_maps`). No cost to link. Uses the Lovable-managed key.
2. **Add a tiny server function** `getAddressStreetViewUrl({ address })` in `src/lib/street-view.functions.ts` that:
   - Calls the gateway `metadata` endpoint first to confirm imagery exists at that address (`/maps/api/streetview/metadata`). Returns `null` if `status !== "OK"`.
   - Returns a short-lived signed image URL string (or streams the JPEG back and returns a `data:` URL). Simpler: return the gateway image URL with auth headers set server-side — but the browser can't send `X-Connection-Api-Key`, so we either:
     - **(a) proxy the image** through a small server route `/api/street-view?address=...` that streams the JPEG from the gateway, or
     - **(b) fetch on the server, base64 it, and hand a `data:` URL to the client.**
   - Recommend (a) — proxy route. Cleaner, browser-cacheable via `Cache-Control: public, max-age=…`.
3. **Update `ShareSlideshow` in `src/routes/home.tsx`**:
   - `useQuery` for the street-view URL keyed on the normalized address.
   - Render `<img>` absolutely positioned inside the slide with `object-cover`, plus a dark gradient overlay for text contrast.
   - Fall back to the current colored card when the query returns `null`.

## Efficiency impact
Small and bounded:
- **Bandwidth:** one JPEG per address, ~40–120 KB at 800×600. Fetched once, cached by the browser and the server proxy.
- **Latency:** metadata check + image fetch happen on the server in parallel with the rest of the report. The image loads lazily with `loading="lazy"` and doesn't block slide navigation.
- **Runtime cost:** negligible CPU; just a fetch + stream. No image processing on the Worker.
- **Quotas / cost:** Street View Static is $7 per 1,000 requests after the free monthly credit. Because we cache per address, real usage is one call per unique address lookup — very low for this app's traffic.
- **No impact on** the address lookup, the AI story, or the plan flow — this is additive, behind a single query.

## Risks / caveats
- Not every address returns imagery (rural, private drives, blurred houses). Handled by the metadata pre-check + gradient fallback.
- Privacy: Google already blurs faces/plates, but some residents may not want their home imagery highlighted. Easy switch to a wider zoom or a neighborhood-level pull-back if desired.
- Custom domain: the browser never touches the key (we proxy server-side), so the `*.lovable.app` referrer restriction on the managed key is fine.

## Out of scope for this plan
- The `/neighborhood` slideshow (already slated for video replacement per the `[[to be replaced]]` note).
- Places API photo fallback (can add later if street coverage feels thin).

## Summary
Yes, connectable via the Google Maps connector, ~1 new server function + 1 proxy route + ~15 lines in `ShareSlideshow`. Efficiency hit is negligible with caching. Recommended if you want the visual upgrade — say the word and I'll implement Option A.