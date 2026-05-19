
## Goal

When someone finishes the Life Stabilization Survey, generate a personalized **30-day stabilization plan**: prioritized domains, week-by-week actions, and real CT referrals from a curated library. Save plans per user so they can return, check off steps, and re-generate later.

## What the user will experience

1. Finish the survey → see their red/yellow/green snapshot (already built).
2. Answer 4–6 short follow-up questions (household, transportation, language, hours/week available, plus already-enrolled benefits).
3. Click **"Generate my 30-day plan"** → loading state → personalized plan appears.
4. Plan shows: priority summary, Week 1 / 2 / 3 / 4 sections, each with 2–4 checkable action steps, each step linked to a specific local resource (name, phone, address, what to ask for).
5. Sign in (email + Google) to save the plan, check off steps, and come back later. Without login, they can still view/print but it won't persist.

## Build steps

### 1. Enable Lovable Cloud
Needed for auth, database, and the AI gateway. One click; we set it up.

### 2. Auth + minimal profile
- Email/password + Google sign-in
- `profiles` table (id, display_name, language_pref) auto-created on signup
- Reset-password page

### 3. Curated CT resource library
- New file `src/data/ct-resources.json` (seeded with ~80–120 entries to start; expandable)
- Each entry: `{ id, name, domain, services[], phone, address, town, county, hours, languages, eligibility_notes, url, source }`
- Domains map 1:1 to the 8 survey categories (housing, food, income, health, childcare, transportation, legal, social)
- Initial seed: 211ct.org top results per domain, CT food bank network, CT legal services, Husky/Access Health CT, CT DOL CTHires, CT shelter network, Care 4 Kids, etc. We start with statewide + the most populated counties; you can expand later.

### 4. Database schema (Lovable Cloud)
- `intake_responses` — survey scores + follow-up answers (jsonb), user_id, tract fips, created_at
- `stabilization_plans` — user_id, intake_id, generated_at, plan jsonb (the AI output), status
- `plan_steps` — plan_id, week (1–4), domain, title, detail, resource_id, order, completed_at
- RLS: users see only their own rows; resources table is public-read

### 5. Follow-up intake step (after survey, before plan)
New section on `/life` after submit:
- Household: adults / children / ages buckets
- Hours/week available for "plan work" (slider 1–15)
- Transportation: car / bus only / walking only / none
- Language preference
- Benefits already enrolled (multi-select: SNAP, HUSKY, WIC, Section 8, Care 4 Kids, none)
- Optional: biggest worry right now (free text, 1 sentence)

### 6. Plan-generation server function
`src/lib/stabilization-plan.functions.ts` (`createServerFn` + `requireSupabaseAuth`):
- Inputs: intake_id
- Loads intake + filters `ct-resources.json` to entries matching the user's red/yellow domains, county, and language
- Calls Lovable AI (`google/gemini-3-flash-preview`) with structured output (Zod schema) that forces:
  - `priority_summary` (3–4 sentences, plain language, 6th-grade reading level)
  - `weeks: [{ week, focus, steps: [{ domain, title, detail, resource_id, est_time_minutes }] }]`
- AI is constrained to only pick `resource_id`s from the provided list (no hallucinated phone numbers)
- Saves to `stabilization_plans` + `plan_steps`

### 7. Plan UI (`/plan/$planId`)
- Header: "Your 30-day plan" + priority summary + regenerate button
- 4 week cards, each collapsible, with checkable steps
- Each step expands to show: what to do, who to call (real referral card with phone/address), why it matters
- Print / share buttons
- "My plans" list at `/plans`

### 8. Safety + tone guardrails (system prompt)
- Plain language, no jargon, no shame
- Never promise outcomes ("you will get…"); use "you can apply for…"
- Always include 211 as a fallback option per domain
- Flag legal/immigration issues with "talk to a lawyer first" rather than steps
- Crisis triggers (housing eviction <7 days, food today, DV) → top of plan with hotline numbers, not a 30-day step

## Technical notes

- Resource list lives in source control (JSON) so updates are reviewable. Later, can move to a `resources` table for editing in-app.
- AI calls run in TanStack server functions (no Edge Functions needed).
- Plan generation typically 8–15 seconds — show a friendly loading screen with "we're building your plan…" + tips.
- Cost per plan ≈ small (Gemini 3 Flash, ~3–5k input tokens with retrieved resources, ~1.5k structured output).
- The plan jsonb is the source of truth; `plan_steps` rows are denormalized for fast checkbox writes.

## Out of scope (good follow-ups, not now)

- Caseworker/coach view of multiple clients
- SMS reminders
- Pulling live 211ct.org API (requires partnership)
- Re-assessment cadence / progress charts
- Spanish/Portuguese translation of the UI itself (we will generate plan content in the user's chosen language, but the app chrome stays English for v1)

## Open questions before I build

1. Do you have an existing resource list / spreadsheet I should seed from, or should I assemble the initial ~100 entries from public CT sources?
2. Should non-signed-in users be able to generate a plan at all (view-only, no save), or require login first?
