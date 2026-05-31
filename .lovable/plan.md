# Plan: "Wake Up Wednesday — Capacity & Replicability" Google Doc

Produce a single Google Doc, written for NAACP Hartford leadership (non-technical), that explains (1) how much usage the app can handle today, and (2) what it would take to replicate it for another city or state.

## Source & destination

- **Source content**: written fresh for this doc (draws on the existing app — target tracts, vetted CT resources, 30-day plan generator, Lovable Cloud backend, AI gateway).
- **Save a Markdown copy** to `/mnt/documents/capacity-and-replicability.md` as a backup (matches the pattern we used for the launch guide).
- **Create the Google Doc** in Joanne's already-connected Google account using the same `mkdoc.mjs`-style script (markdown → `batchUpdate`).
- **Title**: "Wake Up Wednesday — Capacity & Replicability"

## Document outline

1. **What this document is** — one short paragraph framing it for NAACP Hartford.
2. **Snapshot of the current app** — plain-language description of what it does today (Hartford North End, 19 target tracts, vetted CT resources, 30-day plan, landlord letter, audio).
3. **Usage capacity (how many people can use it)**
   - Concurrent users the current setup comfortably supports
   - Monthly active users at the current cost tier
   - What costs scale with usage (AI plan generation, text-to-speech, database, hosting)
   - Soft limits to watch (AI quota, storage, bandwidth) and the warning signs
   - When you would need to upgrade and roughly what that looks like
4. **What's specific to Hartford vs. reusable**
   - **Reusable as-is**: app shell, navigation, 30-day plan engine, landlord letter generator, AI prompts, auth, design system
   - **Hartford-specific (must be swapped per city)**: target census tracts + map polygons, vetted local resources, neighborhood names/stories, branding/voice references, 2-1-1 / hotline numbers
5. **Replicating for another city or state — the process**
   - Step 1: Define the new geography (which tracts/neighborhoods, why)
   - Step 2: Build the local resource list (who vets it, what fields are needed)
   - Step 3: Swap branding (name, colors, partner org)
   - Step 4: Configure backend (new Lovable Cloud project, auth, AI access)
   - Step 5: Test with a small group, then launch
   - Rough effort estimate (small / medium / large city)
6. **Who does what** — split between the partner org (local knowledge, vetting, outreach) and the technical team (configuration, deployment, monitoring).
7. **Costs at a glance** — current monthly cost band, and how it changes for a second city (shared codebase vs. separate instance).
8. **Risks & things to decide early** — data accuracy/freshness, who owns the resource list, privacy of user plans, multi-city governance.
9. **Next steps** — checklist NAACP Hartford can use if a second city expresses interest.

## Tone & formatting

- Plain language, no jargon. Define any technical term inline the first time.
- Headings (H1 title, H2 sections, H3 sub-sections), short paragraphs, bullet lists, and a checklist at the end.
- Length target: ~4–6 pages in Google Docs.

## Deliverable

A reply with the Google Docs share link (Joanne's Drive) plus a note that the Markdown backup is in `/mnt/documents/`.
