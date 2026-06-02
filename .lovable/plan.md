## Goal

Refactor `src/routes/plan.$planId.tsx` (476 lines) into small, focused pieces. Zero behavior change — same UI, same interactions, same data flow.

## New files

**Hooks** (`src/hooks/`)
- `use-bookmark-plan.ts` — `isBookmarked`, `bookmarkCount`, `toggleBookmark` (wraps the `bookmarkedPlans` localStorage logic)
- `use-week-due-dates.ts` — `dueOverrides`, `setWeekDueDate`, plus a `getWeekDueDate(week, generatedAt)` helper (wraps `planDueDates:{planId}` localStorage logic)
- `use-auto-collapse-weeks.ts` — owns `collapsedWeeks`, `toggleWeekCollapse`, and the auto-collapse `useEffect`

**Components** (`src/components/plan/`)
- `PlanHeader.tsx` — title, bookmark button, created date, greeting + summary, progress bar, sign-in CTA
- `CrisisFlags.tsx` — the red "Right now" block
- `WeekCard.tsx` — one week container: header (toggle, due-date pill, done counter), date editor row, steps list. Receives week meta, steps, due date, collapsed state, callbacks
- `StepItem.tsx` — one checkbox row with confetti trigger + the resource sub-card
- `DueDateEditor.tsx` — the inline date input + reset/done buttons
- `SharePlanCard.tsx` — text/email/native share block (moves the IIFE out)
- `PlanFooterActions.tsx` — print button + "view all saved plans" link

**Utilities** (`src/lib/`)
- `confetti.ts` — move `fireConfetti` + the lazy `confettiPromise` out of the route file

## What stays in `plan.$planId.tsx`

- `Route` definition + `head()`
- Auth gate + redirect `useEffect`
- `useQuery` for plan data + `useMutation` for toggleStep
- Loading / error returns
- Top-level layout: `<AppShell>`, back link, then composing the components above

Target: route file under ~120 lines.

## Types

Shared types (`StepRow`, `PlanShape`) move to `src/lib/plan-types.ts` so both the route and the new components import from one place.

## Implementation order

1. Create `src/lib/plan-types.ts` and `src/lib/confetti.ts`
2. Create the three hooks
3. Create the leaf components (`StepItem`, `DueDateEditor`, `CrisisFlags`)
4. Create the composite components (`WeekCard`, `PlanHeader`, `SharePlanCard`, `PlanFooterActions`)
5. Rewrite `plan.$planId.tsx` to compose them
6. Verify in preview: bookmark toggle, step completion + confetti, due-date editor, auto-collapse, share buttons, print

## Non-goals

- No styling/visual changes
- No new features
- No changes to server functions, queries, or storage keys
