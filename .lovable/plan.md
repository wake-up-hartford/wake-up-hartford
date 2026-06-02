# Add "My Plans" home card

## Goal
On `/`, show a fourth card linking to `/plans` — but only when the user is signed in and has ≥1 stabilization plan. Returning users get a one-tap shortcut back to their plan(s).

## Behavior
- Signed out, or signed in with 0 plans → no card (home looks unchanged).
- Signed in with ≥1 plan → card appears at the **top** of the cards grid (above Neighborhood/Home/Path), so the most likely next action is first.
- Card copy:
  - Title: "My Plans"
  - Body (1 plan): "Resume your stabilization plan."
  - Body (n>1): "You have N plans. Pick up where you left off."
- Tapping the card goes to `/plans`.

## Implementation (technical)
- In `src/routes/index.tsx`:
  - Use `useServerFn(listMyPlans)` + `useQuery({ queryKey: ["my-plans"], enabled: !!user })` — same pattern as `/plans`.
  - Render a new `MyPlansCard` above the existing `DashLink` grid when `user && data?.plans.length > 0`.
- Style: reuse the existing `Card` + tone system. Add a new tone (e.g. `emerald`) or reuse `blue` so it visually reads as "yours" vs. the three exploratory cards. Icon: `ClipboardList` from lucide-react.
- Widen `DashLink`'s `to` union (or create a small dedicated `MyPlansCard` component) to allow `/plans`.
- No backend or schema changes. No new files strictly required — can live inline in `index.tsx`.

## Out of scope
- Plan progress bars (separate suggestion).
- Changes to `/plans` itself.
- Removing the `[[INTRO TEXT HERE]]` placeholder or fixing the broken "Watch" link (separate items).
