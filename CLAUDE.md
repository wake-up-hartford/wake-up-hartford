# Wake Up Hartford

A civic housing-conditions app for NAACP Greater Hartford. Hartford residents use it to look up conditions at their building and in their neighborhood, and to act on what they find. The project is migrating off Lovable.

## Audience and voice

- Write for Hartford residents: plain language and active voice.
- Prefer short sentences and everyday words over housing or legal jargon.

## Brand

- Fonts: Newsreader for headlines, DM Sans for body text, JetBrains Mono for data values.
- Colors:
  - Navy `#131929`
  - Gold `#FBBC33`
  - Purple `#782897`
  - Blue `#33b4f3`

## Data

- Open Data Hartford: code enforcement records and 311 complaints.
- CT Data Collaborative: ACS and eviction data.
- Your Home's city data (`hartford_addresses`, `hartford_code_violations`, `hartford_311_complaints`) is matched by normalized street address (`norm_address`), not parcel ID. Parcel IDs have been requested from CT Data Collaborative but aren't available yet.
- These tables are saved copies, not a live feed. A nightly GitHub Actions job (`.github/workflows/refresh-city-data.yml`, running `scripts/refresh-city-data.ts`) refreshes them from data.hartford.gov: code enforcement cases are replaced in full, 311 requests are added and updated by request number, and new addresses are added. Address tidying lives in `src/lib/normalize-address.ts`, shared by the lookup and the refresh.

## Stack

- TanStack Start with server functions (in `src/lib/*.functions.ts`); routes are in `src/routes`.
- Supabase (client in `src/integrations/supabase`).
- AI text: Gemini. This replaces Lovable's AI gateway, so don't add new code that uses the gateway.
- Audio: ElevenLabs for the Story Player.
- Scripts: `npm run dev`, `npm run build`, `npm run lint`, `npm run format`.

## Migration

- The migration plan lives in `docs/MIGRATION.md`.
- Read it before any migration work.
- Tick off each step in that file as you finish it.

## Rules

- Never commit secret keys. Put them in `.env.local`, which `.gitignore` already ignores.
- The NAACP email opt-in stays unchecked by default.
- Make each change on its own branch.
- Show the diff and wait for approval before committing.

## Environment

- Development is on Windows. Use PowerShell-compatible commands and Windows paths.
