## Goal
Build an alternative landing-page version of the homepage at `/preview` and add a small in-app switcher so you can toggle between `/` (current) and `/preview` (new landing) without breaking navigation.

## What gets built

1. **New route `src/routes/preview.tsx`**
   - A landing-page styled version of the homepage: hero with headline + subhead + primary CTA, a few feature/value sections, social proof / closing CTA.
   - Reuses existing design tokens from `src/styles.css` (no new color system).
   - Own `head()` meta (title/description) so it's a real, indexable page.
   - Does NOT touch `src/routes/index.tsx` — current homepage keeps working exactly as-is.

2. **Version switcher component `src/components/VersionSwitcher.tsx`**
   - Small floating pill in the bottom-right corner, fixed position, low-key styling.
   - Two segments: "v1" (links to `/`) and "v2" (links to `/preview`), with the active one highlighted based on current route.
   - Uses TanStack `<Link>` so navigation stays type-safe and preloaded.
   - Only renders in development OR for everyone until you remove it — see question below.

3. **Mount the switcher**
   - Add `<VersionSwitcher />` once in `src/routes/__root.tsx` so it appears on both `/` and `/preview` (and anywhere else, if we keep it global).
   - No changes to existing nav, header, or routes.

## What does NOT change
- `/` homepage content and behavior
- Auth, profile, admin routes
- Any existing links or buttons

## Removing it later
When you pick a winner: either delete `src/routes/preview.tsx` (keep `/`), or copy its contents into `src/routes/index.tsx` and delete `preview.tsx`. Then remove `VersionSwitcher`. Clean and reversible.

## One thing to confirm
Should the switcher be **visible to everyone** (fine for a pre-launch preview), or **only visible to you / admins** (so real visitors never see it)? I'll default to visible-to-everyone unless you say otherwise, since you're not published yet.
