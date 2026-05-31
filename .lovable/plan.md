# Improve Sign-In Flow

Fix the misleading "weak password" error and add the missing pieces of the auth flow. None of this requires the `wakeupwednesday.org` email domain — branded sender address can be wired up later in one pass.

## 1. Clearer signup error messages (`src/routes/auth.tsx`)

Map Supabase auth errors to plain-language messages instead of showing the raw API string:

- `weak_password` / "Password should contain..." → keep current rule hint
- `pwned` / HIBP rejection → **"This password has appeared in a known data breach. Please choose a different one."**
- `user_already_exists` → "An account with this email already exists. Try signing in."
- `invalid_credentials` (signin) → "Email or password is incorrect."
- Network / unknown → generic fallback

## 2. Forgot password flow

**`src/routes/auth.tsx`** — Add a "Forgot password?" link visible in signin mode. Clicking it reveals an inline email input + "Send reset link" button that calls:
```ts
supabase.auth.resetPasswordForEmail(email, {
  redirectTo: window.location.origin + "/reset-password"
})
```
Show a toast / inline confirmation on success.

**`src/routes/reset-password.tsx`** (new) — Public route. Renders inside `AppShell`. Shows a "Set a new password" form with one password input + confirmation. On submit calls `supabase.auth.updateUser({ password })`. On success, redirects to `/plans`. Detects the recovery token from the URL hash (Supabase sets `type=recovery` in `window.location.hash`).

## 3. Email-confirmation pending screen

After a successful signup, instead of flipping back to signin mode with a small inline message, show a dedicated "Check your email" state inside `auth.tsx`:

- Friendly headline + the email address used
- "Didn't get it?" → **Resend** button that calls `supabase.auth.resend({ type: 'signup', email })` with a 30-second cooldown
- "Use a different email" link to reset back to the signup form

## 4. Sonner toasts

Mount `<Toaster />` in `src/routes/__root.tsx` (currently not mounted) so we can use `toast.success(...)` / `toast.error(...)` for reset-link sent, password updated, resend sent, etc.

## 5. Google sign-in sanity check

Verify the Google provider is enabled via `configure_social_auth` (idempotent). If not enabled, enable it so the existing "Continue with Google" button works on first click.

## Out of scope (waits for wakeupwednesday.org email)

- Branded `from` address on auth emails
- Custom-styled HTML email templates
- Transactional email (Action Plan delivery, campaign updates)

These get wired up in one pass once DNS for `wakeupwednesday.org` is ready.

## Technical notes

- All changes are frontend-only except the `configure_social_auth` call. No DB migrations.
- `/reset-password` must be a top-level public route (not under `_authenticated`) so the recovery link works for signed-out users.
- HIBP detection: Supabase returns `error.code === 'weak_password'` with a message containing "pwned" or "compromised" when the leaked-password check rejects. Match on both code and message substring for robustness.
