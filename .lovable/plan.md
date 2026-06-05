## What
Add a visible link from the admin overview (`/admin`) to the existing admin management page (`/admin/admins`). This makes the page easier to discover and use.

## Why
The admin designation system already works (roles table + server functions + /admin/admins UI), but there is no navigation from the main admin dashboard to the admin manager.

## How
1. In `src/routes/admin.index.tsx`, add a `<Link to="/admin/admins">` (e.g. as a button or card) near the top of the page content.
2. Add the `Link` import from `@tanstack/react-router` if not already present.
3. Optionally add an icon (e.g. `Shield` or `Users` from `lucide-react`) for affordance.

## Files changed
- `src/routes/admin.index.tsx`

## Not included
- No database or server-function changes.
- No changes to how roles are stored or checked.