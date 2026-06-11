
# Ongoing Costs & Operations Document — Wake Up Hartford

I'll generate a polished client-facing document (saved as both **DOCX** and **PDF** in `/mnt/documents/`) that explains what it costs and what it takes to keep the site running after launch. It will be written in plain language for a non-technical client (NAACP Greater Hartford Branch), with cost ranges rather than false precision.

## Document Structure

### 1. Executive Summary
One-paragraph overview: the site runs on Lovable Cloud (hosting + database + auth + AI), plus a custom domain. Expected steady-state cost range and the few decisions that drive it (traffic, AI usage, SMS).

### 2. Recurring Cost Categories

| Category | What it covers | Typical monthly range |
|---|---|---|
| **Lovable workspace plan** | Hosting, preview, publishing, agent edits for future changes | Free tier possible; Pro ~$25/mo if active editing continues |
| **Lovable Cloud (backend)** | Database, auth, storage, edge functions, bandwidth | $0–$25/mo free credit, then usage-based |
| **Lovable AI Gateway** | Plan generation, building/tract story summaries, TTS | $1 free credit/mo, then per-call usage |
| **Custom domain** | wakeup-hartford.org (or similar) registration + DNS | $12–$20/yr |
| **Email (optional)** | Transactional email if added (password resets are covered) | $0–$15/mo |
| **SMS alerts (optional, if enabled)** | Twilio per-message fees | $0.0079/SMS + number ~$1/mo |
| **Third-party data refreshes** | Census/ACS, resource list curation — staff time, not cash | — |

Each row gets a short plain-language explanation in the document.

### 3. What Drives Cost Up or Down
- Number of residents generating plans (AI calls = biggest variable)
- Whether building/tract story dialogs are cached vs. regenerated
- SMS opt-ins (if turned on)
- Map tile usage (currently free OpenStreetMap)
- Storage growth from user uploads (currently minimal)

### 4. One-Time / Annual Costs
- Domain renewal
- Optional: branded email domain setup
- Optional: paid map tiles if OSM traffic grows

### 5. Maintenance & Operations (beyond dollars)
- **Content upkeep**: vetted resource list (`src/data/vetted-resources.ts`, `ct-resources.json`) — recommend quarterly review with NAACP
- **Tract/ACS data refresh**: yearly when new Census ACS releases
- **Security**: dependency updates, RLS policy review, periodic security scan
- **Backups**: confirm Lovable Cloud backup retention; export schedule
- **Admin user management**: who can grant/revoke admin access
- **Accessibility & translation review**: keep ES/EN parity as content changes
- **Monitoring**: who watches errors and usage (admin dashboard already built)

### 6. Recommended Governance
- Single point of contact at NAACP for content updates
- Quarterly review meeting (usage stats + resource accuracy)
- Annual budget line item with the ranges above
- Process for handling resident-reported issues (contact email)

### 7. Risks & Things to Plan For
- Federal funding (SLFRP0128) ends — who absorbs ongoing cost?
- Key-person risk on the developer side — recommend documentation handoff
- AI provider pricing changes
- If usage grows 10×, what the cost curve looks like

### 8. Recommended Next Steps for the Client
A short checklist: confirm domain ownership, designate content steward, approve annual budget, decide on SMS, schedule first quarterly review.

## Format
- Branded with Wake Up Hartford header
- Tables for cost ranges
- ~3–4 pages, designed to be readable by a board member, not a developer
- Delivered as `WakeUp_Hartford_Ongoing_Costs_v1.docx` and `.pdf` in `/mnt/documents/`

## What I'd like to confirm before drafting
- **Currency / audience**: USD and US non-technical board audience — correct?
- **SMS**: include as "optional / not currently enabled," or omit entirely?
- **Anything else to add**: e.g., a data privacy / FERPA-style section, or a "what happens if the project sunsets" section?

If you'd rather I just proceed with sensible defaults (USD, SMS as optional, include sunset section), say "go" and I'll build it.
