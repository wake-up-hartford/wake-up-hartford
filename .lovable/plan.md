## Goal
On `/plans`, make each completed stabilization plan card sit subtly above the dark background instead of being a bright cream card. **No other cards in the app change.**

## Visual change (scoped to plan list cards only)
- **Default:** background slightly lighter than the dark app background (~`oklch(0.23 0.06 295)`), same `border-border`.
- **Hover:** background gets lighter (~`oklch(0.28 0.06 295)`) — inverse of the current behavior.
- Text color switches from `text-card-foreground` (dark) to `text-foreground` (light) so it reads on the dark card.
- Priority tags and summary text stay otherwise unchanged.

## Out of scope
- All other `bg-card` usages across the app (Home dashboard tiles, survey options, building/neighborhood pages, etc.) remain as-is.

## Files
- `src/routes/plans.tsx` — only the `<Link>` rendered per plan in the list

## Implementation
Replace `bg-card shadow-soft hover:bg-secondary/30` on the plan card `<Link>` with inline classes that use a custom dark elevation + lighter hover, and swap text colors for dark-on-light → light-on-dark.