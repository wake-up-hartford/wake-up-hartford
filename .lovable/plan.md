## Visual flow map of the Section 2 user journeys

Create a Mermaid flowchart diagram (`text/vnd.mermaid` artifact) saved to `/mnt/documents/user-journeys-flow.mmd`, visualizing the three tools and their journeys from the App Manual Section 2.

### Structure

A single top-down flowchart with three swimlane-style subgraphs — one per tool — so the user can see all journeys at a glance:

```
                 [ Wake Up Wednesday App ]
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
  Your Home          Your Neighborhood      Your Life
  (/home)            (/neighborhood)        (/life)
       │                   │                   │
   journeys…           journeys…            journeys…
```

Inside each subgraph, each journey is rendered as a small left-to-right chain:
`Entry → Step 1 → Step 2 → … → Success`

### Visual encoding

- **[Built]** journeys: default node style
- **[Planned]** journeys: dashed border (`classDef planned stroke-dasharray: 5 5`)
- **Entry points**: rounded rectangle with route path (e.g. `/home-actions`)
- **Success outcomes**: stadium shape (`([Success: …])`)
- External actions (`tel:`, `mailto:`, external links): noted with a small icon label

### Coverage

All journeys from the approved Section 2:
- **2.1 Your Home** — 6 journeys (4 Built, 2 Planned)
- **2.2 Your Neighborhood** — 7 journeys (all Built)
- **2.3 Your Life** — 5 journeys (all Built)

### Output

- File: `/mnt/documents/user-journeys-flow.mmd`
- Delivered inline as a `<lov-artifact mime_type="text/vnd.mermaid">` so it renders directly in chat with auto light/dark theming.
- No custom colors — let the theme handle contrast.

### One open question (default if unanswered)

- **One combined diagram, or three separate diagrams (one per tool)?** Default: **one combined** — easier to share, fits the "map" framing you used.