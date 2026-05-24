# Plan: Neighborhood "Take Action" page

## Goal
Turn the placeholder "Take action" button on `/neighborhood` into a real link that opens a new page tailored to the looked-up tract, surfacing the 3 highest-leverage actions a resident or organizer can take right now.

## New route
`src/routes/neighborhood-actions.tsx` → `/neighborhood-actions?tract=<geoid>`

- Reads the `tract` query param (and `state`/`county` if needed) so the page knows which neighborhood it's about.
- Re-uses the existing `getTractIndicators` server function to pull the same data the report card used, so action copy can reference the tract's top concerns (e.g., "Rent burden here is X% — Y points above CT").
- Shows the tract name + a small map thumbnail at the top, with a "Back to report" link.

## The 3 actions (each as a card)

### 1. Find help near me
- Header: "Get help in your neighborhood"
- Auto-prioritizes the vetted CT orgs by the tract's red/yellow indicators (e.g., if Food Access is red, surface food orgs first; if Rent Burden is red, surface housing/legal orgs first).
- Each org card: name, what they do, phone, link. Uses the same 33-org list already in the vetted resources doc — embed as a small in-code dataset (`src/data/vetted-resources.ts`).
- "See all resources" link at the bottom.

### 2. Email my state rep
- Header: "Tell your representative what's happening here"
- Generates a pre-drafted advocacy email via Lovable AI (Gemini 1.5 Flash, same pattern as the tract story) citing the tract's 2–3 worst indicators with the CT comparison.
- User picks tone: Urgent / Constructive / Personal.
- For now: shows the drafted message in a textarea with Copy + "Open in email app" (`mailto:`) buttons. A note explains that auto-lookup of the resident's specific legislator is coming soon — the user fills in the rep's email.
- New server fn: `src/lib/action-letter.functions.ts` → `draftRepLetter({ geoid, tone })`.

### 3. Share to a council member or neighbor
- Header: "Share this report"
- Two share modes:
  - **Quick share** — copies a short summary ("Tract X in Hartford: rent burden 58%, child poverty 41%. See the full report: <url>") + the deep link to `/neighborhood?tract=...`.
  - **Share to council** — same as quick share but with a pre-filled message addressed to "Dear Council Member,". User pastes the council member's email.
- Uses Web Share API on mobile when available, falls back to copy-to-clipboard.

## Wiring the button
- In `src/routes/neighborhood.tsx`, change the `<button>` inside `TakeAction` to a `<Link to="/neighborhood-actions" search={{ tract: geoid }}>`.
- Pass the current `geoid` (and state/county) into `TakeAction` as props.

## Visual style
- Match the existing neighborhood page: dark card surfaces, gold accents, status dots reused for the indicator chips at the top of each action card.
- Each action card has its own icon (HandHeart / Mail / Share2 from lucide) and a clear primary CTA button.

## Files touched
- **New:** `src/routes/neighborhood-actions.tsx`
- **New:** `src/lib/action-letter.functions.ts` (AI-drafted rep email)
- **New:** `src/data/vetted-resources.ts` (33 orgs as structured data, tagged by domain)
- **Edit:** `src/routes/neighborhood.tsx` — wire `TakeAction` to the new route, pass tract context

## Out of scope (can do next)
- Auto-lookup of the resident's specific state rep/council member from the tract (needs CT legislator GeoJSON).
- Saving sent letters to the user's account.
- Tracking which orgs the user contacted.
