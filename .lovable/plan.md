ns# Pre-demo cleanup

Quick pass on items most likely to be noticed during a live walkthrough. Scope: visible UI strings, dead links, and obvious placeholder copy only — no behavior or data changes.

## Findings worth fixing

1. **Dead "Watch how this app can help" CTA** — `src/routes/index.tsx` line 69–75
   - Link is `href="#"` and label still ends in `[add video link]`.
   - Options: (a) hide the button until a real video URL exists, (b) keep it but remove the bracketed editor note and make it a no-op/disabled button, or (c) point it at a real URL if you have one. Need your call.

2. **"Demo only — placeholder data" banner on Your Home** — `src/routes/home.tsx` line 144–146
   - Yellow banner visible to client during demo. Fine if you plan to call this out as known-mock; awkward if you want it to feel finished. Options: keep, soften wording, or hide for the demo.

3. **Quick sweep of remaining routes** for any other `[add ...]`, `TODO`, `lorem`, `coming soon`, or stray `href="#"` I might have missed — just to be safe.

4. **Console / network check at runtime** — load each top-level route (`/`, `/home`, `/neighborhood`, `/life`, `/plans`, `/profile`, `/auth`) in the preview and confirm no red errors or failed requests. Fix any that show up (likely small).

## Out of scope (not touching)

- Visual redesign, copy rewrites beyond the items above
- Data sources, server functions, auth flows
- The neighborhood map button color (already done earlier)
- The Report-a-Violation / 211 / legal-aid secondary links (already done)

## Questions before I implement

- For the "Watch how this app can help" button: **hide it**, **leave it visible but inert (no bracket text)**, or **wire it to a real URL** you'll share?
- For the "Demo only — placeholder data" banner on Your Home: **keep**, **soften**, or **hide for tomorrow**?

Once you answer those two, I'll do the sweep + runtime check and report back.
