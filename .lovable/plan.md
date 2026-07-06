## Goal

After the survey, generate the plan immediately — no sign-in required. Only prompt for sign-in / sign-up when the user chooses to **Save** the plan (to return later) or **Share** it.

## Approach: Supabase anonymous sign-in

Enable anonymous auth so every visitor gets a real `auth.uid()` behind the scenes. That means:
- All existing tables (`intake_responses`, `stabilization_plans`, `plan_steps`) keep working unchanged — RLS still scopes by `user_id`.
- `generateStabilizationPlan` and `getPlan` keep using `requireSupabaseAuth` — no server changes.
- When the user later signs up with email / Google, we upgrade the same anonymous account to a permanent one, so their plan carries over automatically.

## Changes

### 1. Backend (one-time config)
- Enable anonymous sign-ins via `configure_auth` (`external_anonymous_users_enabled: true`).

### 2. Auto sign-in on entry to survey
- In `src/hooks/use-auth.ts` (or a new small helper called from `/life`): if there's no session when the survey starts, call `supabase.auth.signInAnonymously()`. Await it before the first server-fn call so the bearer is attached.
- Show a subtle "Your responses are private" note; no login UI on the survey flow.

### 3. `/life` results screen (`src/routes/life.tsx` lines 921–952)
- Remove the "Sign in to access your plan" gate. Always render `<PlanGenerator />` — the user is either anonymous or permanent, both work.
- Delete the `postAuthRedirect` round-trip logic tied to plan generation.

### 4. Plan view (`/plan/$planId`)
- Add a top action bar with two buttons:
  - **Save this plan** — only shown when `user.is_anonymous === true`. Opens a modal/route that collects email + password (or Google) and calls `supabase.auth.updateUser({ email, password })` / `linkIdentity({ provider: 'google' })`. This converts the anonymous account to permanent; the plan row is preserved because `user_id` doesn't change.
  - **Share** — same gating: if anonymous, prompt sign-in first (same modal), then reveal a share link / email-to-self action. If already permanent, show share options directly.
- If the user is permanent, hide "Save" (already saved) and just show Share.

### 5. Auth page (`/auth`)
- Keep it, but reframe copy: "Sign in to see plans you saved" instead of "sign in to generate a plan."
- On successful sign-in from `/auth` while an anonymous session exists, call `linkIdentity` / `updateUser` instead of a fresh `signInWithPassword`, so anonymous plans transfer. Fall back to normal sign-in if no anon session.

### 6. Loss-of-session safety net
- If a returning visitor lost their anonymous session (cleared storage) and lands on `/plan/$planId` they cannot read it (RLS). Show a friendly "This plan belongs to a saved account — sign in to view it" screen instead of an error.

## Out of scope
- No schema migration needed. `user_id` stays NOT NULL.
- No changes to `generateStabilizationPlan`, `getPlan`, `plan_steps` policies.

## Technical notes
- Anonymous users count against MAU; acceptable for this flow.
- `linkIdentity` for Google requires the anonymous user to have no existing identity — true by definition.
- `updateUser({ email })` sends a confirmation email; until confirmed the account still works but email is unverified. Fine for "save".
- All new UI (Save modal, Share modal) is presentation-layer only.
