# Section 3 rewrite + separate resident-facing privacy notice

## Why

Section 3 currently reads like a privacy policy shown to a resident ("we collect *your* email"). Sections 1 and 2 of the Manual are written **to the client/owner** (the NAACP team) — third-person about residents, with decisions and sign-off items called out. Section 3 should match that voice. The resident-facing notice belongs in its own document that can eventually be linked from a `/privacy` page in the app.

## Deliverable 1 — Rewrite Section 3 in the Manual (owner voice)

Same Google Doc (`1qo5Tm9X…`). Replace the current Section 3 content with an owner-voice version. Structure stays the same so nothing the team already reviewed gets lost — only the voice changes.

Voice rules applied throughout:
- "The app" / "We" (the NAACP, as operators) instead of "we" addressed to the reader.
- "Residents" / "a resident" instead of "you" / "your".
- Each subsection ends with a short **Owner decision** line where a sign-off is needed (replacing the inline `[NEEDS SIGN-OFF: …]` markers, which read awkwardly in owner voice).
- Same plain-language grade level as Sections 1 & 2.

Sample tone shift:

```text
Before (resident voice):
"We ask for your home address to show risks and resources near you.
 Your address stays on your phone or computer until you save a plan."

After (owner voice):
"The app asks each resident for a home address so it can show
 nearby risks and resources. Until the resident saves a plan, the
 address stays only in their browser — it never reaches our backend.
 Once a plan is saved, the address is stored with that plan under
 the resident's account."
```

Section 3 outline (owner voice), keeping the same subsections as today:

- **3.1 What this section is** — purpose of the section for the owner, when to revisit it.
- **3.2 Our core promises to residents** — the commitments the NAACP is making (no selling, no sharing without court order, right to delete, account-optional use).
- **3.3 What the app collects** — account info, address, saved plans/actions, basic technical info. Each item describes *what the app does today*.
- **3.4 What the app does NOT collect** — SSN, immigration status, voice, cross-site tracking.
- **3.5 Where resident data lives** — Lovable Cloud (US), hashed passwords, HTTPS, RLS, email provider, Google sign-in.
- **3.6 Who can see resident data** — the resident themself, a small NAACP/technical staff list, anonymous grouped numbers for reporting, court orders.
- **3.7 How consent is collected** — only opt-in fields are collected; updates checkbox state; settings page.
- **3.8 How resident data is protected** — HTTPS, password rules, RLS, 6-month access list review, 7-day breach notice.
- **3.9 How long resident data is kept** — active account, inactivity window, email logs, anonymous numbers.
- **3.10 How residents see, fix, or delete their data** — rights, request channel, timelines, deletion mechanics (live systems vs backups vs anonymous data).
- **3.11 Children** — under-13 policy.
- **3.12 Changes to this policy** — how the team will communicate updates.
- **3.13 Owner decisions still needed** — consolidated checklist of every sign-off item (replaces scattered inline markers). Items:
  - Privacy contact inbox
  - Mailing address for written requests
  - Default state of "NAACP updates" opt-in (currently on by default)
  - Building a self-serve account settings page
  - 24-month inactivity auto-deletion window
  - Commitment to no third-party analytics without re-opening this section
  - Legal review (CT state law + applicable federal rules)

How it's applied:
1. Script fetches the doc, finds the start/end index of the current Section 3.
2. One `batchUpdate` deletes the current Section 3 range and inserts the rewritten copy.
3. Re-applies `HEADING_1` / `HEADING_2` / `HEADING_3` styles and bullet lists.
4. Italicizes the "Owner decision:" leader on each decision line and the items in 3.13 so they stand out.
5. Re-fetches and prints the new heading list to confirm structure.

## Deliverable 2 — New Google Doc: resident-facing privacy notice

Create a new Doc titled **"Where Y'all Live — Privacy Notice for Residents"**. This is the plain-language, second-person version intended to be shown to end users (eventually linked from a `/privacy` page in the app).

Content is a tightened version of the current Section 3 text (which is already in resident voice), with these adjustments:
- Add a "Last updated" date at the top.
- Drop the internal "Items still needing formal sign-off" section (that's an owner concern).
- Inline placeholders (`[privacy inbox]`, `[mailing address]`) stay in the resident doc as TBDs — they get filled in once the owner signs off in Section 3.13.
- Add a short header explaining who runs the app (GREATER HARTFORD BRANCH NAACP) and how to reach them.

How it's applied:
1. Script calls `POST /documents` to create the new doc with the title.
2. `batchUpdate` inserts the resident-facing copy with the right heading levels and bullets.
3. Returns the new doc URL so the team can review it next to the Manual.

A reference to this new doc is added at the end of Section 3.1 in the Manual ("The plain-language version shown to residents lives in a separate document: [link]") so the owner can find it from the Manual.

## Out of scope (for this turn)

- No app code (no `/privacy` route, no settings page, no consent banner). Those stay listed under 3.13 as owner decisions.
- No legal review.
- The "Last updated" date in the Manual itself is not touched until the policy is signed off.
