# Section 4: Platform Operations & Ongoing Data Management

Append a new section to the App Manual Google Doc (`1qo5Tm9Xnri-EnIA-ngM0k9_z8HTUuVNElmk4nCuEdRc`), inserted after Section 3 and styled to match existing headings (Heading 1 for the section, Heading 2 for subsections, plain text + tables for body).

## Structure

**4.1 Purpose & scope**
What this section covers (post-launch ops, data refresh, support, security, analytics) and what it does not (budget/contracts, fundraising).

**4.2 The three partners — who does what**
Short narrative establishing the default split:
- **NAACP Greater Hartford** — product owner, content authority, community voice, decisions on what ships, custodian of resident trust and the privacy promises in Section 3.
- **CT Data Collaborative (CTDC)** — data steward: source indicators, validate methodology, refresh tract data, flag quality issues.
- **Farnam Associates** — technical/platform lead **through launch**, supported by a tech professional advisor. **Post-launch, platform ownership transitions to NAACP**, who will retain or hire a platform developer to maintain, duplicate, and scale the app. Farnam's role narrows to handoff support and advisory.

Include a "Transition milestone" callout describing what handoff includes (repo access, credentials inventory, runbook walk-through, 60/90-day advisory window).

**4.3 Operating cadence**
- **Monthly ops call** — all three orgs; review incidents, content updates, resident feedback themes, upcoming changes.
- **Quarterly data refresh** — CTDC pushes refreshed indicators; NAACP reviews resident-facing copy; platform team deploys.
- **Annual audit** — security review, privacy promise review against Section 3, vetted-resources sweep, accessibility check.

**4.4 Domains (each with a short narrative + RACI table)**

For each domain below: 2–4 sentences of context, then a RACI table with rows for the key activities and columns **NAACP | CTDC | Farnam / Platform dev**. RACI = Responsible, Accountable, Consulted, Informed.

1. **Hosting, uptime & incident response** — where the app runs (Lovable Cloud), who watches it, how incidents are triaged and communicated.
2. **Data refresh — tract indicators** — Census/ACS pulls, methodology notes, quarterly cadence, change log.
3. **Vetted resources & content currency** — CT resources list, link checks, partner additions/removals.
4. **Resident support & feedback intake** — feedback inbox triage, response SLAs, escalation to NAACP leadership.
5. **Security, privacy & data requests** — access reviews, RLS/role audits, handling deletion requests and law-enforcement inquiries (ties back to Section 3 promises).
6. **Analytics, reporting & evaluation** — what's measured, monthly dashboard, quarterly impact note to the board.
7. **Accessibility & plain-language QA** — annual WCAG pass, Flesch-Kincaid spot-checks tied to Section 1.

**4.5 Handoff checklist (launch → NAACP ownership)**
Bulleted checklist Farnam completes at launch: repo + admin access transferred, secrets inventory, runbook, monitoring dashboards shared, vendor list, advisory window dates, escalation contacts.

**4.6 Contacts & access matrix**
Small table: role → primary owner → backup → access level (admin, editor, viewer). Placeholders for named people NAACP can fill in.

## Technical approach

- Use the Google Docs connector (`google_docs/v1/documents/{id}:batchUpdate`) to append content at end of document.
- Two-pass insert: (1) `insertText` for the entire section as a single block with `\n`-separated paragraphs and `\t`-separated table cells marked with sentinels, then (2) `updateParagraphStyle` (HEADING_1/HEADING_2) and `createTable` requests for each RACI table.
- Match existing doc style: Calibri, sentence-case headings, no ALL CAPS, plain language (Section 1 rules apply to this section too — short sentences, "you/we", active voice).
- Headings get unique `headingId`s so they're linkable from the doc's outline.
- Do not modify Sections 1–3.

## What I will NOT include (per your answers)

- Financials, contracts, renewals, fundraising.
- Specific staff names (leave placeholders for NAACP to fill).
- Anything outside operations (no roadmap, no feature plans).

## Deliverable

The Google Doc updated in place. I'll confirm by reading back the new section's headings after the batch update completes.