Render `/mnt/documents/user-journeys-flow.mmd` to a PNG image and deliver it as a downloadable artifact.

### Steps
1. Use `mermaid-cli` (`mmdc` via `npx`) to render the existing `.mmd` file to PNG at high resolution (scale 2, white background for legibility).
2. Save output as `/mnt/documents/user-journeys-flow.png`.
3. QA: view the PNG to confirm all three swimlanes render, nothing is cut off, and dashed [Planned] nodes are visible. Re-render with adjusted width if needed.
4. Deliver via `<presentation-artifact>` tag with `image/png` mime type.

The `.mmd` source stays in place so the diagram can be re-rendered or edited later.