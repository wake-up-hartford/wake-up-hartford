## Goal

Add a short, single-page, 3-question survey reachable from a link on the Account (`/profile`) page so we can learn whether the app is actually helping users meet their stabilization goals.

## Suggested questions

Based on the app's purpose (intake → stabilization plan → weekly steps), I recommend these three. They're short, mobile-friendly, and map directly to outcomes we care about: **usefulness, progress, and barriers**.

1. **Usefulness (1–5 scale)**
   "How helpful has your plan been so far?"
   1 = Not helpful · 5 = Very helpful

2. **Progress (single choice)**
   "Since starting, how are things going overall?"
   - Better
   - About the same
   - Worse
   - Too early to tell

3. **Biggest barrier (single choice + optional "other" text)**
   "What's getting in the way most right now?"
   - Housing / money
   - Health / stress
   - Time
   - Don't know what step to take next
   - Nothing — I'm on track
   - Other: ___

Optional 4th field (not counted as a question): a single free-text box "Anything else you want us to know?" — skippable.

> If you'd rather frame the goals differently (e.g. focus on safety, family, employment, or NPS-style "would you recommend"), tell me and I'll swap the questions.

## What I'll build

1. **New route** `/survey` — one page, 3 questions stacked vertically, single Submit button, mobile-first to match the rest of the app. Shows a thank-you state after submit.
2. **Link on `/profile`** — a clearly labeled card/row near the bottom: "Quick 3-question survey — help us improve" → navigates to `/survey`.
3. **Storage** — new `survey_responses` table (user_id, helpfulness int, progress text, barrier text, other_text, comment text, created_at). RLS: users can insert/select their own rows; service_role full access. Allow multiple submissions over time (no unique constraint) so we can track changes.
4. **Server function** `submitSurvey` in `src/lib/survey.functions.ts` using `requireSupabaseAuth`, validated with Zod.
5. **Already-submitted UX** — if the user has submitted before, show their last response date and a "Take it again" button (not blocking).

## Out of scope

- Admin dashboard to view results (we can query the DB directly for now).
- Email/SMS nudges to take the survey.
- Multi-page or branching survey logic.

Confirm the question wording (or suggest edits) and I'll implement.