
## Goal
Replace the current outcome-focused Quick Survey at `/survey` with one that asks only about how people use the app.

## New questions (7)
**Core usage**
1. How often do you use Wake Up Wednesday? — Daily / A few times a week / About once a week / A few times a month / First time
2. How do you usually access it? — Phone / Tablet / Computer / Doesn't matter
3. Which part do you use most? — Path / plan steps / Find Help / Take Action & surveys / Home / dashboard / Haven't explored much

**Experience**
4. How easy is it to use? — 1–5 scale
5. Any technical problems? — Slow loading / Hard to navigate / Errors or crashes / Works fine
6. What brought you here today? — Reminder notification / I use it regularly / Someone told me / Social media / Found it online

**Feature awareness (optional)**
7. Did you know Wake Up Wednesday can send you a plan, show local resources, and connect you to help? — Yes, already use it / Yes, but haven't tried / No, didn't know

Plus optional free-text comment box.

## Data model
The current `survey_responses` table uses fixed columns (helpfulness/progress/barrier) that don't match the new questions. Create a new table to keep historical data intact and avoid forcing nulls everywhere.

```sql
CREATE TABLE public.app_usage_survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  frequency text NOT NULL,        -- daily | few_week | weekly | few_month | first_time
  device text NOT NULL,           -- phone | tablet | computer | any
  most_used text NOT NULL,        -- path | find_help | take_action | home | none
  ease integer NOT NULL CHECK (ease BETWEEN 1 AND 5),
  tech_issue text NOT NULL,       -- slow | navigation | errors | none
  prompt text NOT NULL,           -- reminder | regular | referral | social | search
  feature_awareness text,         -- yes_use | yes_untried | no  (optional)
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```
With grants + RLS scoped to `auth.uid() = user_id` (insert/select only).

## Code changes
- **Migration**: create the table above with grants, RLS, and policies.
- **`src/lib/survey.functions.ts`**: replace `submitSurvey` input schema + insert to target the new table. Update `getLastSurvey` to read from it.
- **`src/routes/survey.tsx`**: rebuild the form with the 7 questions using the existing card / radio-tile styling and the same emerald→teal→blue submit button. Update intro copy ("7 quick questions. About 1 minute."). Keep the success state and back-to-account link.
- Keep `/profile` link/CTA wording as-is — it already says "Quick Survey".

## Out of scope
- No outcome questions (those will live in a future emailed survey).
- No changes to the legacy `survey_responses` table or any analytics that read it.
