# Plan: "How To Launch This App" guide

Create a single Markdown document at `/mnt/documents/how-to-launch-wake-up-wednesday.md` (downloadable from the chat) that walks a non-developer through every step needed to take the current Wake Up Wednesday app from preview to a real, public, installable web app.

## Audience & tone
- Reader: a novice — assumes no coding background, no Supabase/Cloudflare knowledge.
- Style: short numbered steps, plain language, "click here, then this happens" phrasing, callouts for common gotchas.
- Lovable-first: describe everything in Lovable's UI (Publish button, Connectors, Cloud, Settings). Never mention Supabase dashboard or raw infra.

## Sections the document will cover

1. **What "ready for public use" means** — a one-paragraph checklist preview.
2. **Final content pass** — replace `[[INTRO TEXT HERE]]` placeholder on the home page, proofread copy, confirm logo and favicon look right.
3. **Test the app yourself**
   - Walk through each module (Home, Neighborhood, Life survey, Find Help, Plans).
   - Try the survey end-to-end, including "Save & finish later → sign in".
   - Open on a phone via the preview URL and confirm it looks good.
4. **Turn on authentication properly**
   - In Lovable Cloud → Auth, decide whether to require email confirmation (recommended ON for public launch).
   - Enable Google sign-in if desired.
   - Add a real "From" email domain (Cloud → Emails) so confirmation emails don't come from a generic address.
5. **Check the backend is safe**
   - Run the built-in Security scan from the Lovable sidebar; fix anything flagged.
   - Confirm Row Level Security is on for any table holding user data.
6. **Set up a custom domain**
   - Publish the app (Publish button → Public).
   - Connect a domain in Project Settings → Domains; follow the DNS instructions.
7. **Make it installable (PWA basics already in place)**
   - Confirm `manifest.webmanifest`, `icon-192.png`, `icon-512.png` exist and the icons reflect the new logo.
   - Test "Add to Home Screen" on iPhone and Android.
   - Note: full offline mode is not enabled (and shouldn't be without explicit work).
8. **SEO & sharing polish**
   - Confirm each route has a unique title/description and an og:image.
   - Use Lovable's SEO panel to clear any findings.
9. **Analytics & feedback**
   - Optional: add a simple analytics connector.
   - Confirm the "Report what's missing" mailto links go to a real inbox (also flagged in `TODO.md`).
10. **Open items from `TODO.md`** — short reminder list (resources data source decision, Know Your Rights card, Find Help categories review).
11. **Day-of-launch checklist** — one-page tick-box summary the user can print.
12. **After launch: how to keep updating** — edits in Lovable auto-deploy on Publish; how to roll back; where to read logs.

## Deliverable
- One file: `/mnt/documents/how-to-launch-wake-up-wednesday.md`
- Emitted as a `<presentation-artifact>` so the user can preview and download it.
- No code or app changes — documentation only.
