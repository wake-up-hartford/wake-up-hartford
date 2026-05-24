# Project TODO / Open Decisions

A running checklist of deferred decisions and follow-ups. Check items off as they're resolved.

## Resources data

- [ ] **Decide how to manage the resources list long-term.** Current source of truth is the spreadsheet `ct-resources-review.xlsx` (51 entries, mirrors `src/data/vetted-resources.ts` + `src/data/ct-resources.json`).
  - Options:
    - **A.** Keep editing the spreadsheet and re-sync into the two source files on demand.
    - **B.** Consolidate down to a single source file in the codebase.
    - **C.** Move resources into the database with a simple admin editor (non-engineers can edit).
- [ ] Team review pass on the spreadsheet — fill in `Keep?` (yes / no / merge) and `Notes` columns.
- [ ] Resolve the ~4 cross-list duplicates flagged in yellow (Greater Hartford Legal Aid, Charter Oak, NAACP, CT Foodshare).
- [ ] After review, sync edits back into `src/data/vetted-resources.ts` and `src/data/ct-resources.json`.

## Neighborhood actions page

- [ ] Wire up "Know Your Rights card" (currently disabled / "Coming soon").
- [ ] Confirm the `mailto:` targets for Wake Up Wednesday + Block Captain + Report-what's-missing are the right inboxes.

## Find Help checklist (/find-help)

- [ ] Validate the 11 need categories with the team — anything missing or worth merging?
- [ ] Decide whether to surface distance / transit info per resource (would need geocoding).

---

_Add new items above this line. Keep entries short and actionable._
