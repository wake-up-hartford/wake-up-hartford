## Plan

1. **Save graphic to documents**: Write the stepped-progress "Small steps · steady progress" SVG (currently lines 508–547 of `src/routes/life.tsx`) as a standalone file at `/mnt/documents/small-steps-steady-progress.svg`, with the oklch colors preserved.

2. **Remove from `src/routes/life.tsx`**: Delete the entire `<div className="mt-6 overflow-hidden rounded-2xl ...">` block (lines 508–547) inside `IntroScreen`, which sits below the "Enter Here" button. No other code paths reference it.

3. **Result**: Life landing page ends at the "Enter Here" button with no graphic below it. The SVG is downloadable as an artifact.
