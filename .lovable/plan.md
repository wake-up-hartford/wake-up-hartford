# Combine Branding Slides into a Single Sign-Off Slide

## Context
The deck currently has 3 separate branding slides inserted before the Approval slide:
1. **Brand Foundations — In Place** (framed as already committed)
2. **Open Branding Decisions** (needs leadership sign-off)
3. **Voice & Tone — Proposed Guardrails** (proposed)

The framing of slide 1 ("In Place") and slide 3 ("Proposed Guardrails") is misleading — leadership has expressed informal approval, but nothing has gone through a formal sign-off discussion. All of it is still pending.

## Change
Replace the 3 slides with **1 consolidated slide** titled something like **"Visual Branding — Pending Sign-Off"** that:

- Opens with a one-line framing: *"Informally approved, formally still open. Every item below needs leadership sign-off before production."*
- Groups all items under one list (no "in place" vs "open" split), covering:
  - Wordmark + logo usage
  - Color system (primary gold, navy)
  - Typography (Inter)
  - Co-branding lockup with NAACP Greater Hartford (arrangement, relative size, attribution wording)
  - Photography vs. illustration direction
  - Message tone (informational vs. advocacy-leaning)
  - Dark mode treatment
  - Print/collateral templates
  - Voice & tone guardrails (plain language, name-the-system framing, action over alarm, multilingual scope)
- Closes with a clear call to action: schedule a formal branding review with leadership before any of it is treated as locked.

## How
- Write a script at `/tmp/consolidate_branding.mjs` that:
  1. Reads the presentation, finds the 3 branding slide IDs (by their titles)
  2. Deletes them in a single `batchUpdate`
  3. Creates 1 new slide inserted at the same index (before the Approval slide), styled to match the existing deck (gold kicker bar, navy heading, Inter, body bullets)
- Run it via the Google Slides connector gateway (same pattern as the previous branding script).

## Out of scope
No changes to other slides. No changes to app code.
