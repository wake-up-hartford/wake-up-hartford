## Goal
Improve usability across Wake Up Hartford with a focused set of quick wins and trust/onboarding refinements. No backend/data model changes.

## Scope

### 1. Quick wins bundle

**Survey progress indicator** (`src/routes/survey.tsx`, `src/routes/life.tsx`)
- Add a slim progress bar + "Question X of Y" label above each question in the Life survey and the app-feedback survey.
- Uses existing shadcn `Progress` component and primary color token.

**Time estimates on Dashboard cards** (`src/routes/dashboard.tsx`)
- Add a small muted label under each card title: "~3 min" (Your Life), "~30 sec" (Your Home lookup), "~1 min" (Your Neighborhood).
- Styled with `text-xs text-muted-foreground`.

**Aria-labels on icon-only buttons**
- Audit: delete-plan button (`src/routes/plans.tsx`), share/print buttons (`src/components/plan/PlanFooterActions.tsx`), slideshow nav arrows (`src/routes/neighborhood.tsx`), close buttons on dialogs, address-clear button (`src/routes/home.tsx`).
- Add `aria-label` to each.

**Sticky mobile CTA** (`src/routes/life.tsx` intro, `src/routes/home.tsx`, `src/routes/neighborhood.tsx`)
- On mobile only (`md:hidden`), add a sticky bottom bar with the primary action for that page (e.g., "Start the survey →", "Look up an address →").
- Hides once the user has scrolled past or taken the action.

### 2. Trust & onboarding

**"What you'll get" preview before the Life survey** (`src/routes/life.tsx`)
- Add a small card above the "Begin" button listing 3 bullet outcomes: "A personalized plan", "Specific Hartford resources", "Steps you can do this week."
- Uses existing card styling + checkmark icons.

**Inline construction badge on Your Home** (`src/routes/home.tsx`)
- Replace the full-width dashed banner with a compact inline badge ("⚠ Beta — partial data") next to the page title, plus a tooltip/expandable "Learn more" that reveals the existing disclaimer text.
- Reduces visual weight on repeat visits while preserving the disclosure.

**Skip-for-now on optional Life survey questions** (`src/routes/life.tsx` survey flow)
- Add a small "Skip this question" text link under non-required questions.
- Skipped questions are recorded as `null` in the existing response payload (no schema change — the field already permits null).

## Out of scope
- No database migrations.
- No changes to plan generation logic.
- No changes to authentication or sign-in flow.
- No new routes.

## Technical notes
- All copy uses existing design tokens (`text-muted-foreground`, `bg-primary`, etc.) — no hardcoded colors.
- Sticky CTA uses `fixed bottom-0` with safe-area padding; only renders on `md:hidden`.
- Progress component already in shadcn library — no new deps.
- Aria-label pass is purely additive; no behavior changes.

## Verification
- Manually click through Life survey on mobile viewport to confirm progress bar, skip link, and sticky CTA.
- Tab through dashboard and plan pages with keyboard to confirm aria-labels announce correctly.
- Check Your Home page in both light and dark mode to confirm the inline badge is legible.
