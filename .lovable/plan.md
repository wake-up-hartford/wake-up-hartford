## Goal
Create a Google Slides presentation summarizing the Define UX phase work for NAACP Greater Hartford leadership sign-off. Visuals-only focus: user journeys, sitemap, and key wireframes.

## Prerequisite
Link a **Google Slides** connection (workspace doesn't have one yet — currently only Google Docs and Sheets are connected). I'll call `standard_connectors--connect` with `connector_id: google_slides` at the start.

## Deck outline (~10 slides)

1. **Title** — "Define UX Phase: Design Decisions for Sign-Off" + NAACP Greater Hartford
2. **What you're approving** — scope of this review (journeys, IA, wireframes)
3. **Three pillars of the experience** — Your Home / Your Neighborhood / Your Life
4. **User journeys map** — embed the existing `user-journeys-flow.png` swimlane
5. **Sitemap / navigation** — new diagram of route structure (Home → Home Actions / Neighborhood → Neighborhood Actions + Find Help / Life → Plans → Plan detail / Auth)
6. **Wireframe: Home** — screenshot of `/` landing
7. **Wireframe: Neighborhood Actions + Find Help** — screenshots
8. **Wireframe: 30-Day Plan** — screenshot of `/plan/$planId`
9. **Built vs Planned** — quick legend matching the journey map (solid = built, dashed = planned)
10. **Approval & next steps** — what we're asking leadership to sign off on

## How I'll build it

1. **Connect Google Slides** via the connector tool.
2. **Capture wireframe screenshots** using browser tools against the preview URL for `/`, `/neighborhood-actions`, `/find-help`, `/plan/...` — save to `/tmp/`.
3. **Generate sitemap diagram** as a Mermaid → PNG (same `mmdc` flow used for the journey map).
4. **Create the presentation** via `POST /presentations` on the Google Slides gateway.
5. **Populate slides** with `presentations:batchUpdate` — text + image uploads (images uploaded to Drive first or hosted, then referenced by URL since Slides API requires a public URL for `createImage`).
   - Note: Slides `createImage` needs a publicly accessible URL. I'll upload screenshots to Supabase Storage (public bucket) and use those URLs.
6. **QA**: read the presentation back and confirm all 10 slides have the expected text + images.
7. **Deliver**: share the editable Google Slides URL in chat.

## What I will NOT include
- Resident feedback narrative (you confirmed: skip)
- Branding/color system deep-dive
- Roadmap/metrics (only a brief "next steps" closer)

## Open assumption
I'll use a clean, minimal slide style (white background, NAACP-appropriate navy/gold accents pulled from `styles.css` where possible). If you want a specific template or brand deck to match, tell me before I build.
