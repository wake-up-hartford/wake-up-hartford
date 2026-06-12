Yes — and most of the pieces are already in place. The `profiles` table already has `first_name`, `last_name`, `phone`, and `sms_alerts` columns; the signup form already collects a single name, phone, and an email opt-in. We just need to split the name field, add a distinct SMS-consent checkbox, and actually persist these into `profiles` on signup (today only `display_name` gets written by the `handle_new_user` trigger).

## Changes

1. **Signup form (`src/routes/auth.tsx`)**
   - Replace the single "Your name" input with two side-by-side inputs: **First name** and **Last name** (both optional, matching current tone).
   - Keep the existing **phone** input, relabel placeholder to "Cell phone (optional)".
   - Keep the existing email-updates checkbox as-is.
   - Add a **second checkbox** below it (unchecked by default, since SMS consent should be explicit opt-in):
     > "It's OK to text me follow-ups about my plan and Hartford updates. Msg/data rates may apply."
   - Pass `first_name`, `last_name`, `phone`, `opt_in_updates`, and `sms_alerts` into `supabase.auth.signUp({ options: { data: ... } })`. `display_name` continues to be derived (`${first} ${last}`.trim() or email prefix).

2. **Profile persistence (DB migration)**
   - Update the `handle_new_user()` trigger function so that when a new auth user is created, the row inserted into `public.profiles` also copies `first_name`, `last_name`, `phone`, and `sms_alerts` from `raw_user_meta_data` (with safe defaults: `sms_alerts` only true when both the checkbox was checked AND a phone number was provided).
   - No schema additions needed — the columns already exist.

3. **No texting infrastructure in this change.** This only captures consent + contact info. Actually sending SMS would be a follow-up (Twilio connector or similar) and is out of scope here.

## Technical notes

- Google OAuth signups won't go through this form, so they'll keep getting just `display_name` from Google — that's fine; they can fill in phone/SMS consent later from the profile page if/when we add that.
- SMS consent is stored as the boolean `profiles.sms_alerts`; the email opt-in (`opt_in_updates`) is currently only passed as auth metadata and not mirrored to a profile column — I'll leave that as-is unless you want it persisted too.
- Phone is stored as free text (not validated to E.164) to match current behavior. We can tighten validation later if needed.

## Open question

Should the SMS-consent checkbox be **disabled until a phone number is entered** (clearer UX, prevents meaningless opt-ins), or just left always-clickable? I'd recommend disabling it until a phone is present — let me know if you'd prefer otherwise.