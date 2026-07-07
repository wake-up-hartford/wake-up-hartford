## Goal

Deliver a `.pptx` in `/mnt/documents/` with one slide per route, each showing the mobile (390×844) and desktop (1280×900) screenshot side by side, plus the route path and page title.

## Routes to capture

Every route file in `src/routes/`, grouped:

- **Public**: `/`, `/about`, `/auth`, `/reset-password`, `/find-help`, `/home`, `/home-actions`, `/landlord-letter`, `/life`, `/neighborhood`, `/neighborhood-actions`, `/plans`, `/profile`, `/security-deposit-letter`, `/survey`, `/plan/$planId` (using a seeded/known plan id if available, otherwise the empty-state)
- **Onboarding**: `/onboarding/address`
- **Dashboard**: `/dashboard`
- **Admin**: `/admin`, `/admin/admins`, `/admin/reporting`, `/admin/survey-results`, `/admin/surveys`

Skipped: `__root.tsx` (layout, not a URL) and `sitemap[.]xml.tsx` (non-visual).

## Auth strategy

Use the injected managed Supabase session (`LOVABLE_BROWSER_AUTH_STATUS=injected`) to sign in for authenticated + admin routes. If the current test user is not an admin, admin pages will show their access-denied state — I'll capture what actually renders and note it on the slide. If you'd rather I grant this test user the `admin` role first, say so and I'll add that to the plan.

## Capture approach (Playwright, headless Chromium)

For each route:
1. Restore the session (cookies + localStorage) at `http://localhost:8080`.
2. Set viewport to 390×844, navigate to the route, wait for `networkidle`, screenshot to `/tmp/shots/<slug>-mobile.png`.
3. Set viewport to 1280×900, repeat to `/tmp/shots/<slug>-desktop.png`.
4. On error/timeout, capture whatever rendered and log the failure into the slide notes.

All work under `/tmp/shots/`; final deck to `/mnt/documents/`.

## PPTX build

- `pptxgenjs`, 16:9, 1920×1080-equivalent (13.33"×7.5").
- Layout per slide: route path as title (top-left), page `<title>` beneath it, mobile screenshot on the left (~3" wide), desktop screenshot on the right (~8" wide), both letterboxed to preserve aspect ratio. Muted background, one accent color pulled from the app's amber/emerald palette.
- Cover slide: "Wake Up Wednesday — Page Inventory", generation date, route count.
- Table-of-contents slide listing routes with slide numbers.
- Images embedded as base64 so LibreOffice PDF QA works.

## QA

Convert the PPTX to PDF via LibreOffice, then to JPGs with `pdftoppm`, and read every slide image to check for missing screenshots, clipped titles, wrong aspect ratios, or blank pages. Iterate until clean.

## Deliverable

- `/mnt/documents/wake-up-wednesday-pages.pptx`
- Presented back via `<presentation-artifact>` with a short summary of routes captured, any that failed to load, and whether admin pages showed real content or the access-denied state.
