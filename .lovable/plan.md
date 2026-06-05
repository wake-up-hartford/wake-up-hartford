## Goal
Remove the helper text under the phone field and add inline validation/formatting so users can't enter a malformed number.

## Context
- The line "Use international format (e.g. +1 for US). You'll receive a code to verify." is misleading — there is no SMS verification step wired up in the profile, and the project is Hartford-focused (US numbers).
- The current `<input type="tel">` accepts any string up to 20 chars with placeholder `+15551234567`.

## Changes (src/routes/profile.tsx only)

1. **Delete** the `<p>` helper text on lines 214–216.

2. **Auto-format as US phone** as the user types:
   - Strip non-digits, take last 10 digits, render as `(555) 123-4567`.
   - Change placeholder to `(555) 123-4567`.
   - Store the formatted display value in local state; on save, normalize to E.164 (`+1XXXXXXXXXX`) before writing to the DB so existing downstream code keeps working.

3. **Inline validation:**
   - Show a red error message under the field when the value is non-empty and digit count ≠ 10.
   - Disable the Save button (or block submit + toast) when phone is invalid.
   - Mark the field with `aria-invalid` and `aria-describedby` pointing at the error for accessibility.

4. **Keep scope tight:** no schema changes, no Twilio/verification flow, no country picker. US-only formatting matches the audience; if international support is needed later it can be added behind a toggle.

## Out of scope
- Real SMS code verification (would need a backend + Twilio/Supabase Auth phone provider).
- International number support / country selector.
