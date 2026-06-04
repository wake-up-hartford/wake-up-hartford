## Goal

Stand up a real Admin section so multiple people (not just the current admin) can view analytics, with richer reporting beyond the existing survey-results page.

## 1. Admin layout & navigation

Create `src/routes/admin.tsx` as a layout route with a sidebar (shadcn `Sidebar`). All admin pages become children:

- `src/routes/admin.index.tsx` — Overview (current stat cards + funnel, lifted from `admin.survey-results.tsx`)
- `src/routes/admin.reporting.tsx` — New reporting page (charts, geo, language, resources)
- `src/routes/admin.surveys.tsx` — Existing survey table + filters (moved from `admin.survey-results.tsx`)
- `src/routes/admin.admins.tsx` — Manage admin users

The layout gates access via `checkIsAdmin`; non-admins see the existing "Admins only" message. Sidebar links: Overview, Reporting, Surveys, Admins. `noindex` on all admin routes. Keep `/admin/survey-results` as a redirect to `/admin/surveys` so existing bookmarks work.

## 2. Admin management (invite by email)

New server functions in `src/lib/admin.functions.ts`:

- `listAdmins()` — returns admin users (joined with `profiles` for display name + `auth.users` email via `supabaseAdmin.auth.admin.listUsers()` or a single targeted lookup).
- `grantAdminByEmail({ email })` — looks up user by email via `supabaseAdmin.auth.admin.listUsers` (paginated search), inserts into `user_roles` with role `admin`. Returns clear error if no user found ("Ask them to sign up first, then invite again").
- `revokeAdmin({ userId })` — deletes the admin row. Block revoking yourself to prevent lockout.

All three require existing admin (reuse the role check pattern already in `listSurveyResponses`). UI on `/admin/admins`: table of current admins (name, email, granted date, Revoke button) + email input form to grant.

No schema changes needed — `user_roles` already exists with the `admin` enum value and unique `(user_id, role)`.

## 3. Reporting page (`/admin/reporting`)

New server function `getReportingData()` (admin-only) returning aggregates from existing tables. Charts via Recharts (already common in shadcn stack — add if missing).

**Time-series** (last 90 days, daily buckets, toggle 7d/30d/90d):
- Signups (`profiles.created_at`)
- Intake responses (`intake_responses.created_at`)
- Plans generated (`stabilization_plans.generated_at`)
- Steps completed (`plan_steps.completed_at`)
Rendered as a stacked/multi-line area chart.

**Geographic breakdown**:
- Group `intake_responses.tract_fips` counts; join against `src/data/hartford-target-tracts.ts` for human-readable tract/neighborhood names.
- Horizontal bar chart of top tracts + "Other".

**Language & accessibility**:
- Pie/bar of `profiles.language_pref` distribution.
- `profiles.sms_alerts` opt-in rate.
- TTS usage: not currently logged. Plan notes this is a gap; if the user wants it tracked, we add a lightweight `tts_events` table in a follow-up (out of scope for this turn unless they want it now).

**Resource engagement**:
- Count of `plan_steps.resource_id` occurrences (which vetted resources show up most in generated plans).
- Top 10 bar chart joined against `src/data/vetted-resources.ts` for titles.
- Action-letter usage: count of plans whose steps reference landlord/security-deposit letter resources.

CSV export button per section.

## 4. Files touched

**New**
- `src/routes/admin.tsx` (layout + auth gate + sidebar)
- `src/routes/admin.index.tsx`
- `src/routes/admin.reporting.tsx`
- `src/routes/admin.surveys.tsx`
- `src/routes/admin.admins.tsx`
- `src/components/admin/AdminSidebar.tsx`
- `src/components/admin/charts/*` (TimeSeriesChart, GeoBarChart, LanguagePieChart, ResourceBarChart)

**Edited**
- `src/lib/admin.functions.ts` — add `listAdmins`, `grantAdminByEmail`, `revokeAdmin`, `getReportingData`
- `src/routes/admin.survey-results.tsx` — replace with redirect to `/admin/surveys` (keeps old URL working)

**No DB migration required** (uses existing `user_roles`, `profiles`, `intake_responses`, `stabilization_plans`, `plan_steps`).

## Technical notes

- All new server fns use `requireSupabaseAuth` + role check via `has_role(auth.uid(), 'admin')` (matches existing pattern).
- Email lookup for invites uses `supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 })` then in-memory email match — fine at current user counts.
- Revoke self-protection: compare `userId` against `context.userId`.
- Recharts: `bun add recharts` if not already installed.

## Out of scope (flag for follow-up)

- Logging TTS / Listen button usage (needs new table + client instrumentation).
- Audit log of admin grants/revokes.
- Per-resource click tracking on Find Help page.
