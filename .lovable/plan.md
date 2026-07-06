Make the anonymous-user state clearer on the Plan page and ensure anonymous users can return to their plan after signing up.

### Problem
Anonymous users currently see a "Log Out" button at the bottom of every page, which makes them think they are already signed in. They also see a "Save this plan" button on the Plan page, but it is not obvious that the plan is only saved to a temporary session. After clicking "Save this plan" and signing up, the auth page redirects them to `/dashboard` instead of back to the plan they were viewing.

### Solution
1. **Clarify the bottom action for anonymous users**  
   In `src/components/AppShell.tsx`, change the bottom "Log Out" button when the user is anonymous to read "Sign up to save this plan" and navigate to `/auth` (with the current path stored as `wuw:postAuthRedirect`). For signed-in users, keep the existing "Log Out" behavior.

2. **Add context to the Plan page save prompt**  
   In `src/routes/plan.$planId.tsx`, add a short note directly above or below the existing "Save this plan — sign up to return or share" button:  
   "This plan is saved to your current session. Create an account to keep it permanently."

3. **Fix auth redirect to support `/plan/:planId`**  
   In `src/routes/auth.tsx`, update `consumePostAuthRedirect` and `peekPostAuthRedirect` to recognize and return valid plan paths (`/plan/${planId}`), not only `/life`, `/plans`, and `/dashboard`. This lets anonymous users who sign up from a plan page land back on that plan.

### Scope
- Only touches `AppShell.tsx`, `plan.$planId.tsx`, and `auth.tsx`.
- No database or server-function changes.
- No changes to the actual save/bookmark behavior for signed-in users.

### Verification
- Preview the Plan page as an anonymous user: bottom button should say "Sign up to save this plan" and go to `/auth`.
- After signing up, the user should return to the same `/plan/:planId` URL.
- Signed-in users should still see the normal "Log Out" button and no "Save this plan" CTA.