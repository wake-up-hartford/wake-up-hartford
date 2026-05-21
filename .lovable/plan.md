## Goal
Create a new Google Doc that mirrors the Tasks/Subtasks in the Gantt Chart sheet, with plain-language, step-by-step guidance for contributors who are new to PWA development, civic-data work, and the project's workflow.

## Approach

1. **Read the Gantt Chart sheet** via the Google Sheets connector to pull the full task/subtask hierarchy (including the ~30 rows already marked done plus everything still outstanding). Capture: phase headings, task name, subtask name, owner/role if listed, and current status.

2. **Generate detailed explanations** for each subtask using Lovable AI (Gemini). For every subtask, produce:
   - **What it means** — 1–2 sentence plain-English description
   - **Why it matters** — how it fits the larger project
   - **How to do it** — concrete steps a newcomer can follow
   - **Tools / links** — relevant tool, file, or resource (e.g., Lovable editor, Supabase dashboard, Google Sheet, specific routes in this app)
   - **Done when** — clear definition of done
   - Cross-references to already-completed work where relevant, so new contributors see what's already in place vs. what they're picking up.

3. **Create the Google Doc** via the Google Docs connector (same Google account that now has edit access on the sheet). Structure:
   - Title + short project orientation (what the PWA is, who it serves, key concepts: PWA, Supabase/Lovable Cloud, routes, tracts, etc.)
   - "How to use this guide" section
   - One H1 per phase, H2 per task, H3 per subtask, with the explanation blocks above
   - Status badges inline (Done / In progress / To do) pulled from the Gantt sheet so the doc stays a live-ish snapshot
   - Appendix: glossary of terms (PWA, RLS, route, tract, GeoJSON, etc.) and links to the sheet + preview URL

4. **Share the link** back in chat once the doc is created.

## What I need from you before I build

- **Confirm Google account / sharing**: the doc will be created in the Google account currently connected (the same one that can now edit the sheet). Is that the account you want to own it, or should I create it elsewhere and share?
- **Audience depth**: should explanations assume *zero* technical background (explain what a browser tab is) or *some* background (knows how to use Google Workspace, but new to dev/data)? I'll default to the second unless you say otherwise.
- **Scope**: include *all* rows (done + outstanding) so it works as a full reference, or only the outstanding work going forward?
- **Length tolerance**: detailed guide could easily be 30–60 pages. OK, or do you want a tighter version (~15 pages) with links out to deeper material for selected subtasks?

Once you answer these I'll generate the doc in one pass.

## Technical notes (for the build step)

- Read sheet: `GET .../spreadsheets/{id}/values/'Gantt Chart'!A1:Z200`
- Generate prose: `/tmp/lovable_ai.py` with Gemini, batched per subtask
- Create doc: `POST .../documents` then `batchUpdate` with insertText + updateParagraphStyle (HEADING_1/2/3) requests
- No app code changes — this is a one-off artifact, not a feature in the PWA.
