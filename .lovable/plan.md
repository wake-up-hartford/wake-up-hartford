## Update Life survey intro copy

Replace the italic subtitle on the Life Stabilization Survey intro screen with the user-approved version.

**File:** `src/routes/life.tsx` (intro `<p>` directly under the H1, around line 469-471)

**New copy:**
> Are you in or approaching crisis? This 5-minute survey turns your answers into a personalized 30-day Action Plan with next steps and CT resources matched to your top priorities.

**Styling notes:**
- Drop the `italic` class — at this length italics hurt readability on mobile.
- Keep the existing muted-foreground color and relaxed leading.
- Lead sentence ("Are you in or approaching crisis?") gets emphasized as a bold opener so the hook reads first, then the explanation flows in normal weight.

No other copy, layout, or section changes.