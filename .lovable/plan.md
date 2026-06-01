# Section 3: Data Privacy & Resident Data Handling Rules

## Goal

Append a new **Section 3** to the App Manual (Google Doc `1qo5Tm9X…`), right after Section 2, written in the same plain-language voice as Sections 1 & 2 (Flesch-Kincaid grade 5–6, "you" / "we", short sentences, sentence-case headings).

This section is a draft for sign-off. It states **what we collect, how we store it, who can see it, and how a resident asks us to delete it** — grounded in what the app actually does today, plus the guardrails we want to commit to.

## Source-of-truth audit (what the app actually collects today)

Before writing, this is what's in the codebase so the policy matches reality:

- **Account data** (`/auth`): email, password (hashed by Lovable Cloud auth), optional display name, optional cell phone, opt-in checkbox for NAACP updates.
- **Address**: stored locally in the browser (`localStorage` key `wuw.address`) via `useStoredAddress`. Sent to server functions for risk/indicator lookups.
- **Plans & actions**: stabilization plans, action letters, building stories, tract stories — persisted in the backend, scoped to the signed-in user via RLS.
- **No analytics SDKs, no third-party trackers** detected in the client.
- **Third parties touched**: Lovable Cloud (Supabase) for auth + storage, Google (only if user chooses "Continue with Google"), TTS provider (server-side), email provider for confirmation/reset links.

Section 3 will reflect exactly this — no more, no less — and flag the items that still need formal sign-off.

## Draft content to insert (plain language, ready for sign-off)

Headings and bullets below are the exact copy to add. Anything in *italics* is a placeholder that needs a decision before we publish.

```text
Section 3: Your Data & Your Privacy   [HEADING_1]

What this section is   [HEADING_2]
This is our promise about your personal information. It explains what
we collect, why, where it lives, who can see it, and how to get it
deleted. If anything here ever changes, we will tell you in the app
and update the "Last updated" date at the top.

Our core promises   [HEADING_2]
- We only collect what we need to help you.
- We never sell your data. Ever.
- We never share your address, plans, or contact info with landlords,
  police, ICE, or any agency without a court order.
- You can ask us to delete your account and data at any time.
- You can use most of the app without an account.

What we collect   [HEADING_2]

1. Account info (only if you create an account)   [HEADING_3]
- Your email (required)
- A password (required, stored encrypted — we never see it)
- Your name (optional)
- Your cell phone (optional, only if you want text alerts)
- Whether you opted in to NAACP campaign updates

2. Your address   [HEADING_3]
- We ask for your home address to show risks and resources near you.
- Your address stays on your phone or computer (in your browser) until
  you save a plan. Then it is saved with that plan in your account.
- If you do not sign in, your address never leaves your device.

3. Plans and actions you save   [HEADING_3]
- Your stabilization plan, action letters, building notes, and any
  other items you save are tied to your account.
- Only you can see them when you sign in.

4. Basic technical info   [HEADING_3]
- Standard info every website sees: browser type, rough location from
  IP, time of visit. We use this to keep the app working and to spot
  abuse. We do not use ad trackers or third-party analytics. [NEEDS SIGN-OFF: confirm no analytics added later]

What we do NOT collect   [HEADING_2]
- We do not collect your Social Security number, immigration status,
  income, or family details.
- We do not record your voice or read your messages.
- We do not track you across other websites.

Where your data lives   [HEADING_2]
- Account info, plans, and saved items live in our secure backend
  (Lovable Cloud, built on Supabase) hosted in the United States.
- Passwords are hashed — even our team cannot read them.
- Data is encrypted in transit (HTTPS) and at rest.
- Email confirmation and password reset links are sent through our
  email provider. They only see your email address.
- If you sign in with Google, Google sees that you used our app. We
  only receive your email and name from Google.

Who can see your data   [HEADING_2]
- You can see all of your own data when you sign in.
- A small number of GREATER HARTFORD BRANCH NAACP staff and trusted
  technical helpers can access the backend to keep the app running
  and to help you if you ask for support. They follow the rules in
  this section.
- We may share anonymous, grouped numbers (for example: "300 people
  in Hartford have used the app") with funders or in reports. These
  numbers never include names, addresses, emails, or anything that
  could point to one person.
- We will only share your personal info with anyone else if a court
  orders us to. If that happens and the law allows, we will tell you.

Consent: how we ask before collecting   [HEADING_2]
- We will only collect optional info (phone, NAACP updates) if you
  check the box or fill in the field yourself.
- The opt-in for updates is off by default for new accounts.
  [NEEDS SIGN-OFF: today the box is on by default — confirm we flip
  it to off, or keep on with clearer language.]
- You can change your mind at any time in your account settings.
  [NEEDS SIGN-OFF: build a simple account settings page that lets
  people toggle updates and update phone/name.]

How we keep your data safe   [HEADING_2]
- HTTPS on every page.
- Strong password rules (8+ characters, mix of letters, numbers,
  symbols) and a check against known leaked passwords.
- Row-level security in the database so one user cannot see another
  user's plans or saved items.
- A small access list for the backend, reviewed every 6 months.
- We will tell you within 7 days if we ever learn that your data
  was exposed.

How long we keep your data   [HEADING_2]
- Account and saved items: as long as you have an account.
- If you have not signed in for 24 months, we will email you. If you
  do not respond in 30 days, we will delete your account and data.
  [NEEDS SIGN-OFF: confirm the 24-month window.]
- Email logs (confirmations, resets): 90 days.
- Anonymous, grouped numbers: kept for reporting.

How to see, fix, or delete your data   [HEADING_2]
You have the right to:
- See what we have about you.
- Fix anything that is wrong.
- Take a copy of your data with you (export).
- Delete your account and all your data.

To make a request, email us at privacy@[NEEDS SIGN-OFF: which inbox].
Please use the same email address as your account. We will reply
within 7 business days and finish the request within 30 days.

When you ask us to delete:
- We remove your account, plans, saved items, and contact info from
  our live systems within 7 days.
- Backups are erased on a 30-day cycle.
- Anonymous, grouped numbers stay (they cannot be traced to you).

Children   [HEADING_2]
The app is for adults. We do not knowingly collect data from anyone
under 13. If you think a child has signed up, email
privacy@[NEEDS SIGN-OFF] and we will delete the account.

Changes to this policy   [HEADING_2]
If we change this section, we will:
- Update the "Last updated" date at the top of the manual.
- Show a notice in the app the next time you sign in.
- For big changes, email everyone with an account.

Questions   [HEADING_2]
Email privacy@[NEEDS SIGN-OFF] or write to:
GREATER HARTFORD BRANCH NAACP
[NEEDS SIGN-OFF: mailing address]

Items still needing formal sign-off   [HEADING_2]
- Privacy contact email address.
- Mailing address for written requests.
- Default state of the "NAACP updates" opt-in checkbox.
- Building a self-serve account settings page (toggle updates,
  update phone/name, delete account).
- 24-month inactivity window for auto-deletion.
- Confirmation that no third-party analytics will be added without
  re-opening this policy.
- Legal review (CT state law + any federal rules that apply).
```

## How it will be added

A single script will:

1. Fetch the document to find the current end index (currently `11137`).
2. Issue one `batchUpdate` to the Google Docs API with:
   - `insertText` requests appending the Section 3 copy above (with `\n` between paragraphs).
   - `updateParagraphStyle` requests to set `HEADING_1`, `HEADING_2`, `HEADING_3` on the right ranges.
   - `createParagraphBullets` for the bulleted lists.
   - `updateTextStyle` to italicize the `[NEEDS SIGN-OFF: …]` markers so they stand out for the reviewer.
3. Re-fetch the document and print the new last-heading list to confirm Section 3 landed cleanly after Section 2.

No other sections are touched. The "Last updated" date at the top is left alone until the policy is signed off.

## Out of scope (for this turn)

- No app code changes (no settings page, no consent banner) — those are listed under "Items still needing formal sign-off" so we can scope them after review.
- No legal review — this is a plain-language draft for the team to react to before counsel sees it.
