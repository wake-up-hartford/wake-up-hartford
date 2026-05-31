# Make User Journeys & Sitemap Slides Legible

## What's wrong now
Both slides embed a single very-wide PNG squeezed onto one 960×540pt slide:
- `user-journeys-flow.png` — 4768×1546 px crammed into ~760pt wide → text renders at the equivalent of 4–5pt
- `sitemap.png` — 3568×740 px crammed similarly

The text inside those raster images is well below the 8pt floor and can't be enlarged without re-authoring.

## Approach
Rebuild both slides as **native slide content** (text boxes, not images). Native text is selectable, crisp at any zoom, and font sizes are set explicitly. Split each across multiple slides so nothing falls below ~14pt (well above the 8pt minimum).

### Sitemap — split into 2 slides
Slide 1: "Sitemap & navigation — primary structure"
- Top-level 4-tab nav (Start / Neighborhood / Your Home / Your Life) rendered as 4 large columns
- Each column lists its child screens as a clean bulleted tree
- Title 24pt, column headers 16pt, leaf items 12pt

Slide 2: "Sitemap — auth, account & system pages"
- Sign in / reset password / personal plan (auth-gated) / settings / system pages
- Same type scale

### User Journeys — split into 3 slides
Group the 18 flows by pillar so each slide holds 6 journeys max as a small-multiples grid (3 columns × 2 rows). Each tile shows:
- Journey name (14pt bold)
- "Built" or "Planned" pill (10pt)
- 3–5 numbered steps as the flow (11pt)

Slide breakdown:
1. **Your Home — 6 journeys** (complaint letter, code violation, legal help, eviction help, utility shutoff help, + 1 planned: recover security deposit)
2. **Neighborhood — 6 journeys** (census data, find help, vote, Wake Up Wednesday, Block Captain, report missing data)
3. **Your Life — 6 journeys** (30-day plan, view plans, sign in, reset password, + 1 planned: document conditions with photos, + life path survey)

Legend (solid = built, dashed = planned) lives in the kicker text on each slide.

If the actual journey roster differs from the rough grouping above, I'll surface the original list from `/tmp/build-deck.mjs` (which has the canonical 16 built + 2 planned breakdown) and re-group accordingly before writing.

## Out of scope
- The embedded PNG diagrams themselves stay in `/tmp` as backup; not deleted.
- No changes to other slides (pillars, wireframes, branding, approval).

## How
One script that:
1. Deletes `sld_journeys` and `sld_sitemap`
2. Inserts 2 sitemap slides + 3 journey slides at the same position (indexes 3–4 today → 3–7 after)
3. Uses the same visual system as the rest of the deck (gold kicker bar, navy headings, Inter, gold accents). Minimum body size 11pt; nothing below the 8pt floor.

Run via the Google Slides connector gateway, then re-inspect to confirm the rendered text sizes.
