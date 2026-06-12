Replace `display_name` with `first_name` + `last_name` across the app and database.

Changes:
1. **Profile page (`src/routes/profile.tsx`)**
   - Remove the "Display name" input field and its state (`displayName` / `setDisplayName`).
   - Make "First name" the required name field for validation.
   - Update the save handlers to no longer send `display_name`.

2. **Profile server functions (`src/lib/profile.functions.ts`)**
   - Drop `display_name` from the `getMyProfile` select and the `updateMyProfile` Zod schema.
   - Remove `display_name` from the `upsert` payload.

3. **Auth page (`src/routes/auth.tsx`)**
   - Already sends `first_name` and `last_name` in signup metadata. No changes needed.

4. **Plan header greeting (`src/components/plan/PlanHeader.tsx`)**
   - Update the greeting fallback chain to prefer `first_name` from `user.user_metadata`, then `full_name`, then email prefix.

5. **Admin user list (`src/lib/admin.functions.ts`)**
   - Remove `display_name` from selects.
   - Replace `display_name` fallback with `first_name + last_name` (already partially done; finish removal).

6. **Database migration**
   - Drop the `display_name` column from `public.profiles`.
   - Update the `handle_new_user()` trigger to no longer write `display_name`.