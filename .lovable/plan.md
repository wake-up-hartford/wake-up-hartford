## Goal

Produce a single visual flow chart the team can use as a reference for the current prototype — every page, its purpose in one line, and the links that connect them.

## Deliverable

A Mermaid diagram saved to `/mnt/documents/wakeup-wednesday-flow.mmd`, embedded in chat as a `lov-artifact` so it renders inline and is downloadable. No app code changes.

## Pages to include (from `src/routes/`)

| Route | Title on page | What's on it |
|---|---|---|
| `/` (`index.tsx`) | **See It. Name It. Fix It.** (Home) | 3 dashboard cards → Neighborhood / Home / Life, event card, Sign In / Log Out |
| `/auth` | **Sign in / Sign up** | Email+password, Google OAuth, redirects to `/plans` |
| `/neighborhood` | **Your Neighborhood** | Tract report card: indicators, map to find tract, PDF/share, CTA → Take Action |
| `/neighborhood-actions` | **Take action for your neighborhood** | Action cards: Find help, 30-Day Plan, Landlord letter, Voter reg, KYR card, Host WUW, Block Captain, Report what's missing |
| `/find-help` | **Find Help** (checklist) | Need checkboxes → filtered vetted CT resources |
| `/home` | **Your Home** | Address lookup, code violations, evictions, utility shutoffs, 311, landlord card, PDF/share, CTA → Home Actions |
| `/home-actions` | **Take Action on Your Home** | Action list: landlord letter, call inspector, legal aid, document conditions, etc. |
| `/landlord-letter` | **Letter of Complaint to Your Landlord** | Form (tenant info, landlord info, issues) → generated letter |
| `/life` | **Your Path / Stabilization Survey** | Multi-step survey → completion → creates a plan |
| `/plans` | **Your plans** | List of saved 30-day plans (auth required) |
| `/plan/$planId` | **Your 30-Day Plan** | Week-by-week stabilization plan detail |
| 404 / Error | **Not found / Error** | Root-level fallbacks |

## Connections to draw

- Home `/` → Neighborhood, Home, Life, Auth
- Auth → Plans (post-login)
- Neighborhood → Neighborhood Actions (+ back to Home)
- Neighborhood Actions → Find Help, Life (30-day plan), Landlord Letter, external (voter reg, mailto)
- Home → Home Actions (+ back to Home page `/`)
- Home Actions → Landlord Letter, external (legal aid, inspector)
- Life (survey complete) → Plan detail
- Plans → Plan detail
- All sub-pages → back to their parent

## Diagram style

- Top-down flowchart, grouped into subgraphs: **Entry**, **Neighborhood flow**, **Home flow**, **Life / Plans flow**, **Shared tools**, **System**.
- Color-code by section so the team can see the three pillars (Neighborhood / Home / Life) at a glance.
- Each node shows the route path + short page title + 1-line description.

## Output

1. Write Mermaid source to `/mnt/documents/wakeup-wednesday-flow.mmd`.
2. Embed via `<lov-artifact …mime_type="text/vnd.mermaid">` so it renders in chat.
3. Brief note in chat pointing to the artifact and how to edit (it's plain text — team can tweak boxes/labels directly, or tell me what to add/remove).

No source code in the app is modified.