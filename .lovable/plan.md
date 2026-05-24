## Rotating advocacy messages in the header

Add a rotating ticker of civil-rights messages to the `AppShell` header, visible on every route **except** the home page (`/`).

### Where it goes

In `src/components/AppShell.tsx`, inside the existing sticky `<header>`, add a thin second row directly **below** the current logo row. It only renders when `pathname !== "/"`.

Layout:
```
┌─────────────────────────────────────────────┐
│  [logo]  NAACP Greater Hartford             │ ← existing row
│  "Poverty by ZIP code is a civil rights…"   │ ← new rotating line
└─────────────────────────────────────────────┘
```

### Behavior

- The 6 messages cycle one at a time (not a marquee), ~5 seconds each.
- Cross-fade between messages (200ms fade-out → swap → fade-in), implemented with a simple `useState` + `setInterval` and a CSS opacity transition. No new dependencies.
- Respects `prefers-reduced-motion`: if reduced motion is set, swap without fading.
- Single line, truncates with ellipsis if it overflows on 390px width (full text still readable on most messages at this size; the longest one — "These neighborhoods do not need pity…" — will likely truncate on the narrowest phones, which is acceptable for a ticker).

### Visual style

- Font: a distinctive serif to feel editorial/quote-like and stand out from the sans-serif UI. Load **Instrument Serif** (italic) from Google Fonts by appending it to the existing `<link>` in `src/routes/__root.tsx`. It's a free, expressive display serif that pairs well with Unbounded + Inter.
- Size: `text-[12px]` with `leading-snug`, italic, slight letter-spacing.
- Color: `text-muted-foreground` so it sits quietly under the logo without competing.
- Container: full-width strip, `border-t border-border/60`, `py-1.5`, centered text, same `max-w-xl` as the rest of the header.

### Files changed

1. **`src/components/AppShell.tsx`**
   - Add a `RotatingMessages` subcomponent (messages array, interval, fade state).
   - Render it inside `<header>` below the logo row, gated by `pathname !== "/"`.

2. **`src/routes/__root.tsx`**
   - Extend the existing Google Fonts `<link>` href to also load `Instrument+Serif:ital@0;1`.

3. **`src/styles.css`**
   - Add a `--font-serif-display: "Instrument Serif", Georgia, serif;` token under `@theme inline` so the ticker can use a semantic class (`font-[var(--font-serif-display)]` or a small utility).

No route changes, no backend, no new packages.

### Open question

Confirm that the home page (`/`) should be the only excluded route. The `AppShell` also wraps Neighborhood, Home (building), and Life — the ticker will appear on all three. If you'd rather exclude additional routes (e.g. `/auth`), say which.
