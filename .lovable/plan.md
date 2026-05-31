## Accessibility fix pass (WCAG AA)

Scope: presentation-only edits. No logic, data, or routing changes.

### 1. Label all icon-only buttons
Add `aria-label` to icon-only `<button>`s:
- `src/routes/neighborhood.tsx` — carousel prev/next arrows, close button
- `src/components/BuildingStoryDialog.tsx` — close button
- `src/components/TractStoryDialog.tsx` — close button
- `src/components/TargetTractMap.tsx` — interactive button
- `src/routes/life.tsx` — +/− steppers ("Decrease", "Increase")

### 2. Replace raw colors with design tokens
Swap hardcoded Tailwind colors for semantic tokens so contrast is consistent with the cream theme:
- `src/routes/life.tsx` — `from-blue-600 to-indigo-600 text-white` → `bg-primary text-primary-foreground`; `bg-slate-700 text-[#f5efe0]` steppers → `bg-secondary text-secondary-foreground`
- `src/routes/neighborhood.tsx` — `text-white` and `bg-white/15` chips → token-based equivalents that maintain ≥4.5:1 contrast
- Add any missing tokens to `src/styles.css` if needed

### 3. Bump tap target sizes
- `src/routes/life.tsx` steppers: `h-5 w-5` → `min-h-11 min-w-11` (WCAG 2.2 SC 2.5.8)
- Audit other custom buttons for <24×24 hit areas

### 4. Add focus-visible rings to custom buttons
Append `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` to the custom `<button>` elements in `life.tsx`, `neighborhood.tsx`, and the story dialogs.

### 5. Mark rotating banner as polite live region
`src/components/AppShell.tsx` — add `aria-live="polite"` and `aria-atomic="true"` to the rotating message `<p>` (or `aria-hidden="true"` if we'd rather not announce it).

### 6. Spot fixes
- Swap any `h-screen` → `h-dvh` for full-height layouts on mobile
- Verify heading order on each route (h1 → h2 → h3, no skips)

### Out of scope
- Map (Leaflet) keyboard polish — would require pulling in a Leaflet a11y plugin; flag for later
- AAA-level changes (7:1 contrast, etc.)

### Verification
After edits: re-grep for `text-white`, `bg-slate-`, `from-blue-`, `aria-label` on icon buttons; visually confirm preview still looks right at 1003×853 and mobile widths.
