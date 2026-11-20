# Moving Wake Up Hartford Off Lovable: How-To Guide

Nov 16, 2026 · @Jojo

## Summary for the team

Wake Up Hartford is moving from Lovable to a permanent home that the project owns. Expect roughly 35–60 hours of hands-on work, plus a few built-in waiting periods (noted below) that no amount of extra hours can shorten. The current site stays live the whole time, so residents and partners see no interruption.

**Why we're moving.** Today the code, data and hosting all sit inside Lovable. After the move, the project will own each piece directly:

- **Code** in GitHub
- **Data and logins** in Supabase
- **Website** on a standard web host

This makes it easier to:

- automate the housing data updates
- bring in volunteer developers
- control costs
- hand the tool off or replicate it with partners

**What happens, in order (estimated times):**

1. **Prepare** (3–5 hours). Decide who owns each account and set up GitHub, Supabase and hosting accounts. *Waiting: getting sign-off from NAACP on account ownership.*
2. **Take stock and copy the code** (3–4 hours). List everything the app uses and copy the code to GitHub.
3. **Set up the new editing tool** (3–5 hours). Switch from Lovable's editor to Claude Code for future changes.
4. **Move the data** (14–26 hours). Rebuild the database in Supabase, copy over the city data, and set up sign-in and server functions. *Waiting: Lovable emails the data export when it's ready, and allows only one export per 24 hours.*
5. **Put the new copy online** (2–4 hours). Publish it at a temporary web address, then at its permanent address on wakeupwednesday.org. *Waiting: a new web address can take up to 48 hours to work everywhere, so set it up early.*
6. **Test side by side** (6–10 hours, plus about 1 hour per volunteer). Compare the new copy with the current site, feature by feature. *Waiting: scheduling volunteer testers.*
7. **Switch over** (3–5 hours, including a 1–2 hour window when the site is quiet). Do a final data sync and point the link on wakeupwednesday.org to the new site.
8. **Wrap up** (2–3 hours). Close Lovable down. *Waiting: keep Lovable as a backup for 2–4 weeks first.*

**What we need from the team:**

- A decision on which accounts are held by NAACP Greater Hartford
- 2–4 volunteers for an hour of testing in step 6
- A heads-up to admins and testers that they'll sign up again on the new site, because today's accounts are test accounts and don't move

Hours are estimates, and working full-time compresses the calendar but not the waiting periods. Step 4 is the most likely to run long, depending on how much data and how many user accounts the app holds.

## Before you start

This guide moves Wake Up Hartford to four new places, each owned by the project:

| Piece | Moves from | Moves to | Cost for a pilot |
| --- | --- | --- | --- |
| Code | Lovable | GitHub (private repository) | Free |
| Database, logins, files, server functions | Lovable Cloud | Supabase (managed) | Free tier to start |
| Website hosting | lovable.app | Netlify (or Cloudflare Pages) | Free tier to start |
| Editing tool | Lovable editor | Claude Code (desktop app) | Included in a Claude subscription |

Gemini (AI text), ElevenLabs (audio) and Google Maps usage are separate, usage-based costs, likely a few dollars a month at pilot scale. The web address costs nothing, since NAACP already owns wakeupwednesday.org.

**What the inventory found (November 19).** The app is a TanStack Start app with server functions, running on Lovable Cloud.

- **Data:** 11 database tables, about 49,000 rows, mostly city data.
- **Sign-in:** email and password, Google (through Lovable's sign-in library), and guest sessions.
- **AI text:** Gemini, through Lovable's AI gateway.
- **Story Player audio:** ElevenLabs, called from the app's server.
- **Not present:** Supabase Edge Functions and scheduled jobs. The one storage bucket isn't used by the app.

**Decisions made:**

- Use Gemini directly.
- Move Google sign-in from Lovable's library to Supabase's own Google sign-in.
- Move only the city data: addresses, code violations and 311 complaints. Every account, plan, survey response and usage event on the Lovable site is test data, and the site isn't promoted to residents before the move, so none of it comes across. Admins sign up again on the new site.

### Decisions to make first

1. **Who owns the accounts.** The recommended setup:
   - Create a GitHub organization (for example, `wake-up-hartford`) owned by NAACP Greater Hartford, with you as an admin.
   - Put the Supabase project and the hosting account under a shared project email, not a personal one. NAACP Greater Hartford doesn't use organization email addresses, so create a dedicated one (for example, a new Gmail account for the project) and share the login with an NAACP leader.
   - This lets the project outlast any one person's involvement.
2. **Web address.** Use a subdomain of wakeupwednesday.org, which NAACP already owns, such as `hartford.wakeupwednesday.org`.
   - A subdomain takes one DNS record and doesn't affect the main site.
   - Avoid a path such as `wakeupwednesday.org/hartford`. It would need the main site's host to forward traffic, which is much harder to set up.
   - Keep using `wake-up-hartford.lovable.app` until cut-over.
3. **Hosting provider.** Netlify and Cloudflare Pages both have free tiers that suit an organization's site. Vercel also works, but check its terms first: its free tier is meant for personal, non-commercial projects.
4. **Cut-over window.** Pick a quiet 1–2 hour window for the final switch. New sign-ups or form submissions should pause during it.

### Accounts to create

- [x] Dedicated project email, such as a new Gmail account, with the login shared with an NAACP leader. Use it for every account below.
- [x] GitHub account for you, plus the project's GitHub organization ([github.com](https://github.com)), created from your existing account with the project email as its contact address
- [ ] An NAACP person invited as a second Owner of the GitHub organization, using their own GitHub account
- [ ] Supabase account and organization ([supabase.com](https://supabase.com))
- [ ] Netlify account ([netlify.com](https://www.netlify.com))
- [ ] Claude subscription that includes Claude Code, plus the Claude desktop app ([claude.com/download](https://claude.com/download))
- [ ] Google Cloud account under the project email, with billing set up, for the Gemini API key, the Google Maps key and Google sign-in. Also an ElevenLabs account under the project email, if it's currently under a personal login.
- [ ] Access to the DNS settings for wakeupwednesday.org, or the name of the person who manages them. The steps depend on where that site is hosted, such as Squarespace, Wix or GoDaddy.

### What to install on your computer

Claude Code can install and run most of these for you. You just approve each step.

- [ ] **Claude desktop app.** It includes Claude Code, with no separate install.
- [ ] **Node.js 22.** Needed to run the site on your computer ([nodejs.org](https://nodejs.org)).
- [ ] **Git and the GitHub CLI.** Used to copy the code and open pull requests.
- [ ] **PostgreSQL client tools with zstd support.** Needed only to restore the database export in Phase 4. Ask Claude Code to install these when you get there.

### Keep a migration notebook

Open a private note, not in the repository, to record what you collect along the way:

- account logins
- the Supabase project URL and keys
- API key names
- dates of each export

Never paste secret keys into the repository or into a shared doc.

## Phase 1: Take stock of the current app (about 3 hours)

The goal is a complete list of everything the app depends on, so nothing is left behind. Do this inside Lovable.

**Step 1. Ask Lovable for an inventory.** Paste this into the Lovable project chat:

> List everything this project depends on, as a table: (1) which stack it uses, older React + Vite or TanStack Start; (2) every database table and roughly how many rows each has; (3) every storage bucket; (4) every Edge Function and what it does; (5) every secret or API key name, without the values; (6) any scheduled jobs; (7) any Lovable AI features, AI gateway calls or app connectors; (8) how users sign in, if at all. Don't change any code.

**Step 2. Check its answer yourself.** Lovable's list can miss things.

- **Database:** open **More → Database** and note each table.
- **Storage:** open **More → Storage** and note each bucket, such as Story Player audio files.
- **Secrets:** open the Cloud secrets page and list each key name.
- **Stack:** open **Code → package.json**. If you see `@tanstack/react-start`, it's TanStack Start. Otherwise it's React + Vite.

**Step 3. Record it in your notebook.** Use this table:

| Item | Example | Where it goes | Done |
| --- | --- | --- | --- |
| Tables | email sign-ups, saved addresses | Supabase database |  |
| Storage buckets | audio files | Supabase storage |  |
| Edge Functions | none in this app; its server code lives in `src/lib` | Nothing to move |  |
| Secrets | GEMINI\_API\_KEY, ELEVENLABS\_API\_KEY | `.env.local` and Netlify environment variables |  |
| AI calls through Lovable | the AI gateway calls for stories, letters and plans | Replace with your own Gemini key |  |
| Sign-in methods | email, Google | Supabase Authentication |  |
| Scheduled jobs | data refreshes | Recreate in Supabase |  |
| Outside data sources | Open Data Hartford, CT Data Collaborative | No change, confirm they still load |  |

**Watch for one thing.** If the app's AI features run through Lovable's built-in AI (the "AI gateway"), they stop working once you leave Lovable. They need your own Gemini API key in place. Flag any such feature now, because it adds a small code change in Phase 4.

## Phase 2: Copy the code to GitHub (1 hour)

Lovable's Git sync copies the code to a private GitHub repository and keeps the two in step. This is safe to do at any time, and it changes nothing about the live site.

1. **Prepare GitHub.** Sign in to GitHub and create the project's organization, if you haven't already.
2. **Connect Lovable to GitHub.**
   - In Lovable, open **Project settings → Git → GitHub**.
   - Authorize the Lovable GitHub app.
   - Choose the project organization, not your personal account, as the place for the repository.
3. **Create the repository.** Click **Connect**. Lovable creates a new private repository and starts two-way sync.
4. **Check it worked.** Open the repository on GitHub. You should see these folders:
   - `src/` (the app, including its server functions in `src/lib`)
   - `supabase/migrations/` (the database structure)
   - `drizzle/migrations/` (one later change to the database structure, covered in 4.2)

   There's no `supabase/functions/` folder, because the app has no Supabase Edge Functions.
5. **Don't rename, move or delete the repository** while Lovable is still connected. Renaming is supported in current versions, but it isn't worth the risk mid-migration.

**Good to know:**

- The repository holds code and the database *structure*. It doesn't hold your data, stored files or secret keys. Those move in Phase 4.
- While sync is on, edits in Lovable appear in GitHub, and changes pushed to GitHub appear in Lovable.
- **Pick one editor at a time.** Editing in Lovable and Claude Code on the same day causes conflicts. Lovable then pushes its work to a separate `lovable-sync` branch, and the two versions have to be reconciled.

## Phase 3: Set up Claude Code as your editor (3–5 hours)

Claude Code becomes the tool you use to change the site, and to run the technical steps in the rest of this guide. You describe what you want in plain language. Claude Code shows you each change or command, and you approve it.

1. **Install and sign in.**
   - Download the Claude desktop app from [claude.com/download](https://claude.com/download) and sign in.
   - Open the **Code** tab. If it asks to install supporting tools, approve them.
2. **Get a copy of the code on your computer.**
   - Start a new local session and pick a folder, such as `Documents\Wake-Up-Hartford`. The clone goes into a `wake-up-hartford` folder inside it.
   - Then type:

     > Sign me in to GitHub, then clone the wake-up-hartford repository from our GitHub organization into this folder.
3. **Give Claude Code the project background.** Ask it to create a `CLAUDE.md` file. It reads this file at the start of every session.

   > Create a CLAUDE.md for this project. It's Wake Up Hartford, a civic housing-conditions app for NAACP Greater Hartford. Audience: Hartford residents, so plain language and active voice. Brand fonts: Newsreader (headlines), DM Sans (body), JetBrains Mono (data values). Colors: navy #131929, gold #FBBC33, purple #782897, blue #33b4f3. Data: Open Data Hartford code enforcement, CT Data Collaborative (ACS and eviction data), matched to parcel IDs. Rules: never commit secret keys; email opt-in stays unchecked by default; make each change on its own branch and show me the diff before committing.
4. **Run the site on your computer.**

   > Install the dependencies, start the dev server and show it to me in Preview.

   **Caution:** at this stage the local copy still talks to the *live* Lovable database. Look around, but don't submit forms or sign up test users until Phase 4 points it at the new database.
5. **Learn the edit loop on something harmless.** Try a small fix, such as a typo, using this loop:
   - **Ask** for the change.
   - **Review** the diff.
   - **Approve** it.
   - **Commit and open a pull request** (Claude Code will offer).
   - **Merge** it on GitHub.

   Because Lovable is still synced, the change also appears in Lovable. That's a quick way to confirm everything is wired up.
6. **Freeze Lovable edits.** From here until cut-over, make changes only in Claude Code. If a feature change can wait until after the move, hold it.

**Working away from your computer:** Claude Code also runs in the browser at [claude.ai/code](https://claude.ai/code) and in the Claude mobile app, working straight from the GitHub repository. Use it for small fixes. Use the desktop app for the migration steps, which need your computer.

## Phase 4: Move the backend to Supabase (14–26 hours)

This phase builds a full copy of the backend in a Supabase project the organization owns. That copy holds the database, user accounts, stored files and server functions. The live site keeps running on Lovable Cloud the whole time. You're building a copy and testing it, not moving anything yet.

### 4.1 Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**, under the organization's Supabase account.
2. Fill in the form:
   - **Name:** `wake-up-hartford`
   - **Region:** East US
   - **Database password:** a strong one, saved in your notebook
3. Wait about 2 minutes for it to start.
4. From the project settings, copy these into your notebook:
   - **Project URL** (`https://<id>.supabase.co`)
   - **Project ID**
   - **Publishable (anon) key**
   - **Database connection string** (from the **Connect** button)

### 4.2 Rebuild the database structure

The tables, access rules and storage buckets are defined in two places in your repository:

- **`supabase/migrations/`** holds 25 migrations from Lovable. They build all 11 tables and the `deck-assets` bucket.
- **`drizzle/migrations/`** holds one migration from November 16. It turns off public read access to the code-violation and 311 tables, and removes the `deck-assets` storage rules. `supabase db push` doesn't run Drizzle migrations, so without the next step the new database would leave those two tables open to the public.

**Table permissions also need their own migration.** The live database got its table permissions from Supabase's old automatic defaults, which no migration recorded, and new Supabase projects don't add them. Without them, signed-in users and guests can't read or save their own profile, Life survey answers or plans, and the admin reports and guest-plan transfer fail. The migration `supabase/migrations/20261119204401_grant_account_table_permissions.sql` grants them:

- **Signed-in users and guests** get only what the app does with each account table. Row-level security still limits each person to their own rows.
- **The server** gets full access to every table.
- **Visitors who aren't signed in** get nothing.

It's already in `supabase/migrations/`, so step 2 pushes it with the others.

1. **Copy the Drizzle migration into `supabase/migrations/`.** In Claude Code:

   > Recreate drizzle/migrations/0000\_lock\_down\_city\_data\_and\_storage.sql as a new file in supabase/migrations, named with a timestamp later than every existing migration there. Keep the SQL unchanged. Make the change on its own branch and show me the diff.

   Commit it and merge the pull request before you push the migrations.
2. **Push the migrations.** In Claude Code:

   > Use the Supabase CLI to log in, link this repo to Supabase project \<project ID>, and push the migrations in supabase/migrations. Show me each command before running it.

   Behind the scenes this runs `npx supabase login`, `npx supabase link --project-ref <id>` and `npx supabase db push`.
3. **Check the result.**
   - Open the Supabase **Table Editor** and confirm every table from your Phase 1 list is there, still empty.
   - Under **Authentication → Policies**, confirm `hartford_code_violations` and `hartford_311_complaints` have no "public read" policy.
   - Check the table permissions. In Claude Code:

     > Run a read-only check of what the anon, authenticated and service\_role roles can do on every table in the public schema, and show it as a table.

     Expect this result:

     | Role | Should be able to |
     | --- | --- |
     | `anon` (not signed in) | nothing on any table |
     | `authenticated` (signed in, including guests) | read, add and change `profiles`; read and add `intake_responses`; read, add and delete `stabilization_plans`; read, add, change and delete `plan_steps`; read and add `survey_responses`, `app_usage_survey_responses` and `user_events`; read `user_roles`; nothing on the three city-data tables |
     | `service_role` (the server) | read, add, change and delete on all 11 tables |

### 4.3 Export the data from Lovable

1. In Lovable, go to **More → Database → Manage → Settings**.
2. Under **Export project data**, click **Export data**.
3. In the **Database** card, click **Export**, then **Start export**.
4. Lovable emails you when it's ready. Download the file from **More → Storage** and keep it somewhere private.

This is your **practice export**. You'll take a final one at cut-over, and Lovable allows only one export every 24 hours. Note how long the export and restore take, because that sets the length of the cut-over pause. The export includes residents' contact details and addresses, so keep it private and delete local copies once the move is verified.

### 4.4 Restore the data into Supabase

The export is a compressed PostgreSQL backup file, not something you paste into a web page. It holds the whole Lovable database, including test accounts, Supabase's internal tables and Lovable's stored secrets. Only the city data comes across:

| Table | Rows (November 19 export) |
| --- | --- |
| `hartford_addresses` | 10,156 |
| `hartford_code_violations` | 32,348 |
| `hartford_311_complaints` | 6,186 |

Everything else stays behind: accounts, profiles, plans, intake answers, survey responses, usage events, admin roles, sign-in sessions and history, storage records, and Lovable's secrets.

In Claude Code:

> Install PostgreSQL client tools with zstd support. Then inspect the Lovable export at \<file path> with pg\_restore --list. Restore only the data for hartford\_addresses, hartford\_code\_violations and hartford\_311\_complaints, addresses first, plus their two id sequences, into our Supabase database. Restore data only, in a single transaction, and don't use --clean. Use the database password from .env.local without printing it. Explain your plan before running anything, and delete any temporary SQL file afterward.

Then check the restore:

- [x] Row counts match the export for each of the three tables.
- [x] Every code violation and 311 complaint links to an address that exists.
- [x] Each id sequence is at or above its table's highest id.
- [x] The account tables are still empty, and the code-violation and 311 tables still can't be read publicly.

### 4.5 Set up sign-in

The app uses three kinds of sign-in: email and password, Google, and guest sessions. In Supabase:

1. Open **Authentication → Sign In / Providers**.
   - Turn on **Email**.
   - Turn on **anonymous sign-ins**. Guests building a 30-day plan depend on this. If it's off, the guest flow breaks. It also lets anyone create unlimited guest accounts, so CAPTCHA protection follows after launch (Phase 8).
2. **Set up Google sign-in with your own credentials**, because Lovable's don't transfer.
   - In the Google Cloud console, under the project email, create an OAuth client of type **Web application**.
   - Add the callback URL that Supabase shows on its Google provider page.
   - Paste the client ID and secret into that page.
   - Claude Code can walk you through this.
3. In **Authentication → URL Configuration**, add `http://localhost:8080` (or whatever port your Preview uses) to the redirect URLs.
4. **Google sign-in moves off Lovable.** Today the sign-in page sends Google sign-ins through Lovable's sign-in library. In 4.9, it switches to Supabase's own Google sign-in, using the credentials from step 2. No accounts move from Lovable (see 4.4), so everyone, Google users included, signs up again on the new site.
5. **Give admins their role again.** Admin roles don't move either. Once each admin has signed up on the new site, ask Claude Code:

   > Give the account with email \<email> the admin role in the new Supabase project. Show me the change before running it.

### 4.6 Save the storage files

The only storage bucket, `deck-assets`, holds 7 presentation screenshots that the app doesn't use. Download them in Lovable (**More → Storage**) and save them in the project's Google Drive. There's nothing to copy into Supabase.

### 4.7 Get the API keys

Secret keys never come across in an export, and two of these need new accounts. Create each one under the project email:

- **Gemini API key**, from [Google AI Studio](https://aistudio.google.com).
  - Use the **paid tier**, so residents' intake answers aren't used by Google to improve its products.
  - Add a monthly budget alert in Google Cloud.
- **Google Maps browser key**, from the Google Cloud console.
  - Enable the Maps JavaScript API.
  - Restrict the key to `localhost`, your Netlify address and `hartford.wakeupwednesday.org`.
  - Google requires a billing account. The free monthly allowance should cover this site.
- **ElevenLabs API key**, from the ElevenLabs account under the project email.
- **Supabase service role key**, from the new Supabase project's API settings.
  - The app uses it to transfer guest plans and for admin reports.
  - It must never appear in browser code.

Save all four in your notebook. They go into `.env.local` in 4.10, and into Netlify in Phase 5.

### 4.8 Server functions: nothing extra to do

The app's server code runs inside the app itself and goes live with it on Netlify in Phase 5. That code covers the AI text, the Story Player audio and the guest-plan transfer. There are no Supabase Edge Functions or scheduled jobs to deploy.

### 4.9 Replace the Lovable-only pieces

In Claude Code:

> Make these changes on one branch and show me the diff. (1) In src/lib/tract-story.functions.ts, building-story.functions.ts, stabilization-plan.functions.ts and action-letter.functions.ts, replace calls to Lovable's AI gateway with direct calls to the Google Gemini API, using a GEMINI\_API\_KEY environment variable. Switch from gemini-3-flash-preview to the current stable Gemini Flash model, and keep the prompts unchanged. (2) In src/components/AddressStreetView.tsx, read the Google Maps browser key from VITE\_GOOGLE\_MAPS\_BROWSER\_KEY and the tracking ID from VITE\_GOOGLE\_MAPS\_TRACKING\_ID, instead of the Lovable connector variables VITE\_LOVABLE\_CONNECTOR\_GOOGLE\_MAPS\_BROWSER\_KEY and VITE\_LOVABLE\_CONNECTOR\_GOOGLE\_MAPS\_TRACKING\_ID. (3) In src/routes/auth.tsx, switch Google sign-in from Lovable's library (lovable.auth.signInWithOAuth) to Supabase's own Google sign-in (supabase.auth.signInWithOAuth). Then remove src/integrations/lovable and the @lovable.dev/cloud-auth-js package. (4) Remove src/integrations/supabase/previewAuthStorage.ts, which only handles sign-ins inside Lovable's editor, and have the Supabase client use the browser's standard storage. (5) Replace every hard-coded lovable.app address, both wake-up-hartford.lovable.app and wake-up-hartford-guide.lovable.app, with a single site address setting, VITE\_SITE\_URL. That covers page metadata and canonical links in src/routes, the sitemap, the plan PDF and the README. If a file can't read the setting, such as public/robots.txt, list it. (6) Search for any other Lovable-only service and list what you find. Leave the build package, @lovable.dev/vite-tanstack-config, for Phase 5.

**The code uses two lovable.app addresses, and this step replaces both with `VITE_SITE_URL`.**

- `wake-up-hartford.lovable.app` is the live address. Set `VITE_SITE_URL` to `https://wake-up-hartford.lovable.app` until cut-over.
- `wake-up-hartford-guide.lovable.app` is an old address that's no longer used. Some pages still point to it, so this step also fixes them.

**Lovable-hosted images.** Images added through Lovable's editor live on Lovable's own hosting, not in the repository. The code points to them through `src/assets/*.png.asset.json` files with a `/__l5e/assets-v1/...` address that only lovable.app serves, so they break everywhere else. Do this first, while Lovable still serves them: download each image into `src/assets`, import it directly, and delete its `.asset.json` file. On November 20 this covered two images: the Wake Up Hartford logo (`wake-up-hartford.png`) and the Wake Up Movement image on the sign-in page (`wake-up-movement.png`).

Then compare a few neighborhood stories, a building story, an advocacy letter and a 30-day plan against the Lovable site. It's the same model family, so they should read about the same.

### 4.10 Point your local copy at the new backend

In Claude Code:

> Create a .env.local file, not committed to git, that points the app at the new Supabase project and holds the API keys from 4.7, the Google Maps tracking ID and VITE\_SITE\_URL, then restart Preview.

You'll give it the Supabase values and the keys from 4.7. Now the local site uses the new database. You can safely sign up test users and submit test forms.

### 4.11 Review who can see and change what

Turning on anonymous sign-ins (4.5) matters for security: a guest gets the same database role as a signed-in user, so every rule written for signed-in users applies to guests too. Review the access rules once the backend is in place. In Claude Code:

> Review the row-level security policies, table permissions and database functions on all tables in the new Supabase project, plus the app's server functions that use the service role key. Tell me in plain language what a signed-in user or guest can read and change, and flag anything that would let someone see or edit another user's data or read admin-only tables. Don't change anything.

The first review, on November 19, found:

- **The access rules themselves are sound.** Each person can read and change only their own profile, Life survey answers, plans and survey responses. Only admins can read everyone's usage events and app surveys, and no one can make themselves an admin. Every admin page checks the caller's session and admin role on the server.
- **Missing table permissions.** These would have broken the app. Fixed by the permissions migration in 4.2.
- **The guest-plan transfer could give one person's plan to someone else.** When a guest signs in to an existing account, the app moves the guest's plan and Life survey answers onto that account. It accepted any guest's ID, so the next person to sign in on a shared computer could receive a previous resident's plan. The fix, in pull request #7, requires the guest's own sign-in token, accepted for 15 minutes, instead of an ID. Merge it only after it's type-checked and the guest sign-in flow passes on the local copy (Phase 6 has the check).
- **Server functions had no CSRF protection.** Found on November 20, when the local copy first ran: TanStack Start warned that another website could call the app's server functions with a visitor's session. Fixed by adding TanStack Start's CSRF middleware in `src/start.ts`, which rejects server-function calls from other sites with "403 Forbidden".
- **Two smaller notes:**
  - A guest who leaves a shared computer without signing out leaves their session in the browser. Phase 7 adds a "This isn't my computer / Start over" button for this.
  - Any signed-in user can check whether a given account ID is an admin. Nothing else is revealed, and IDs are random.

Run the review again after any change to the database's access rules, and before cut-over.

## Phase 5: Put the new copy online (2–4 hours)

Netlify builds the site from GitHub and republishes it automatically every time a change is merged. At the end of this phase, the new copy is live at a temporary `something.netlify.app` address. That copy runs on the new Supabase backend.

1. **Add the hosting settings to the code.** In Claude Code:

   > This is a TanStack Start app with server functions. Its build comes from Lovable's @lovable.dev/vite-tanstack-config package, which sets up the Vite plugins for Cloudflare. Replace it with a standard vite.config.ts that sets up the plugins the app needs directly, keeps the server entry at src/server.ts, and drops Lovable's editor-only plugins. Remove the package. Then configure the app to build and deploy on Netlify with Node 22, including its server functions, and check that the build works locally. Open a pull request.

   Review and merge it. If Netlify proves difficult, Cloudflare Workers is the fallback, since the project already has a Cloudflare configuration file.
2. **Connect the repository.**
   - In Netlify, choose **Add new site → Import an existing project → GitHub**.
   - Authorize Netlify and pick the `wake-up-hartford` repository.
   - Choose `main` as the branch to deploy.
3. **Set the environment variables** before the first build, under **Site configuration → Environment variables**. Use the *new* values. Mark the ones labeled "(secret)" as secret.

   | Variable | Value |
   | --- | --- |
   | `VITE_SUPABASE_URL` and `SUPABASE_URL` | `https://<new id>.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_PUBLISHABLE_KEY` | new publishable key |
   | `VITE_SUPABASE_PROJECT_ID` and `SUPABASE_PROJECT_ID` | new project ID |
   | `VITE_GOOGLE_MAPS_BROWSER_KEY` | your Google Maps key |
   | `VITE_GOOGLE_MAPS_TRACKING_ID` | the Google Maps tracking ID |
   | `VITE_SITE_URL` | `https://wake-up-hartford.lovable.app` until cut-over |
   | `SUPABASE_SERVICE_ROLE_KEY` | new service role key (secret) |
   | `GEMINI_API_KEY` | your Gemini key (secret) |
   | `ELEVENLABS_API_KEY` | your ElevenLabs key (secret) |

   Netlify's values override the old ones still in the repository's `.env` file, so the live Lovable site isn't affected.
4. **Deploy.** Click **Deploy site**. Your temporary address appears when the build finishes. You can rename it under **Site configuration**, for example to `wake-up-hartford.netlify.app`.
5. **Allow the new address.**
   - In Supabase, go to **Authentication → URL Configuration** and add the Netlify address to the redirect URLs.
   - Add the Netlify address to the Google Maps key's allowed websites too.

**Useful extra:** Netlify builds a private preview link for every pull request. You and reviewers can then check a change before it goes live.

**Set up the permanent address now.** In Netlify, open **Domain management → Add a domain** and enter the subdomain, for example `hartford.wakeupwednesday.org`. Have the wakeupwednesday.org DNS manager add the CNAME record Netlify shows you, and leave the main site's existing records alone. Netlify sets up HTTPS automatically. Then, in Supabase, add the subdomain to the redirect URLs. Doing this now means the address is working long before cut-over, with no DNS wait on the day.

**Optional:** ask Claude Code to add a "Back to Wake Up Wednesday" link in the app's header or footer, so visitors can move between the two sites.

## Phase 6: Test side by side (6–10 hours)

Open the Lovable site and the Netlify copy in two browser windows. Walk through each item on both. The new copy passes when every item behaves the same on both sites.

### Your own pass (2–3 hours)

- [ ] Home page loads with the right fonts and colors, on desktop and phone.
- [ ] **Your Home:** an address search returns the right parcel, code violations, 311 complaints and Street View image.
- [ ] **My Neighborhood:** neighborhood data loads for several Hartford neighborhoods.
- [ ] **AI text:** a neighborhood story, a building story and an advocacy letter all generate, and read in plain language.
- [ ] **Story Player:** audio plays in English and Spanish.
- [ ] **Guest 30-day plan:** take the Life survey without signing in, get a plan, then sign up. The plan should still be there.
- [ ] **Guest plan, existing account:** as a guest, make a plan, then sign in to an existing account with a password, and again with Google. The plan should move to that account each time. Then, as a new guest, make a plan and start a sign-in without finishing it. If someone else signs in on that browser more than 15 minutes later, they shouldn't receive the guest's plan (4.11).
- [ ] **Sign-in:** a new account can sign up and sign in with a password, Google sign-in works, and password reset sends an email.
- [ ] **Admin:** an admin who signed up again and got the role back (4.5) can open the admin pages and reports.
- [ ] New users are sent to address onboarding, and the NAACP opt-in box is unchecked by default.
- [ ] Opening a deep link directly, then refreshing, doesn't show a 404.
- [ ] Netlify's function logs and the browser console show no errors while you test.

### Volunteer pass (about 1 hour each)

Ask 2–4 people to use the Netlify address on their own phones. Choose people who match the site's audience. Give them three tasks:

1. Look up an address they know.
2. Explore their neighborhood.
3. Play a story.

Ask them to note anything broken, slow or confusing in a shared form or doc. Testers should use made-up details for any sign-up, and you'll delete those test records before cut-over.

### Fixing problems

For each issue, open a Claude Code session and describe it:

> On the Netlify copy, the neighborhood map doesn't load and the console shows \<error>. Find the cause and fix it.

Each fix goes through a pull request and a Netlify preview, then merges. Re-test the item on the Netlify site once it's live.

**Exit test:** every box above is ticked, and you've used the new site for a few days without surprises. Then schedule the cut-over.

## Phase 7: Switch over (3–5 hours, including a 1–2 hour window)

Cut-over copies the latest data across one final time and points the public at the new site.

### A few days before

- [ ] **Confirm the subdomain works** over HTTPS. If you didn't set it up in Phase 5, do that now and allow up to 48 hours for it to work everywhere.
- [ ] **Allow sign-in from the subdomain.** In Supabase, go to **Authentication → URL Configuration**. Set the **Site URL** to the subdomain and confirm it's in the redirect URLs.
- [ ] **Check where the Wake Up Wednesday link points.** Note whether the link on wakeupwednesday.org goes to the lovable.app address today, and who can edit that page.
- [ ] **Check the export timing.** At least 24 hours must have passed since your last Lovable database export.
- [ ] **Tell the team the window.** Ask partners not to send people to the site during that time.
- [ ] **Clear out test data.** List the test accounts and test records in Supabase that need deleting.
- [ ] **Add a "This isn't my computer / Start over" button.** Residents often use shared computers, and a guest who walks away leaves their plan open in the browser for the next person (4.11). The button signs the visitor out, clears the guest session and anything the app saved in the browser, and returns to the start. Build it with Claude Code on its own branch, then test it on the pull request's Netlify preview before cut-over.
- [ ] **Create a privacy policy page**, for example at `/privacy`, and link to it from the footer and the sign-up form. Google sign-in needs its address (next item). The app has no privacy page yet. The About page has a short "Privacy & Data Use" section to borrow the tone from, but it can't be reused as written:
    - It says addresses aren't stored, but address onboarding saves the street address and ZIP code to each profile.
    - It leaves out names, phone numbers, text-alert choices, saved Life survey answers, usage events and app survey responses.
    - It doesn't name the outside services: Google Gemini writes plans from Life survey answers, ElevenLabs reads stories aloud, and Google Maps, Street View and Google sign-in load from Google.

    Ask Claude Code to draft the page from what the app actually collects and shares, then have an NAACP leader review it. Update the About page section to match, or link it to the new page.
- [ ] **Publish the Google sign-in app in Google Cloud.** Until then it stays in Testing, and only listed test users can use Google sign-in. Do this once the subdomain and the privacy page are live. In the Google Cloud console, under the project email, open **Google Auth Platform**:
    1. On the **Branding** page, set the app home page to `https://hartford.wakeupwednesday.org`, add the privacy policy link, and add `wakeupwednesday.org` to **Authorized domains**.
    2. Click **Publish app** (on the **Audience** page in current versions of the console).
    3. Sign in with Google from an account that isn't a test user, to confirm it works.
- [ ] **Raise the Supabase anonymous sign-in rate limit before any group event at a shared location.** Under **Authentication → Rate Limits**, anonymous sign-ins are limited to 30 per hour per IP address. At a library, school or community event, everyone shares one IP address, so the 31st guest in an hour can't start a plan. Raise it a day ahead, and lower it again afterward.
- [ ] **Consider a daily cap on Google Maps loads.** Under **Google Maps Platform → Quotas**, set a per-day limit on map loads for the Maps JavaScript API, so a traffic spike or misuse of the key can't run up the bill. Set it comfortably above normal use, so maps don't stop loading on a busy day.

### Cut-over window

1. **Stop new writes on the old site.** Turn off any scheduled jobs on Lovable Cloud. During the window, avoid promoting the site.
2. **Take the final export** in Lovable (**More → Database → Manage → Settings → Export data**) and download it.
3. **Reload the new database.** In Claude Code:

   > Empty hartford\_311\_complaints, hartford\_code\_violations and hartford\_addresses in the new Supabase project, in that order, then restore those three tables from the final Lovable export at \<file path>, the same way as the practice restore in 4.4. Leave every other table alone, so accounts and plans made on the new site stay. Reset the two id sequences, then compare row counts against the export.
4. **Copy any files** added to storage since your practice copy.
5. **Turn on scheduled jobs** in Supabase.
6. **Point the repository at the new backend.** In Claude Code:

   > Update .env and supabase/config.toml to the new Supabase project's URL, project ID and publishable key, then commit and push to main.

   Because Lovable is still synced, the Lovable copy now uses the new backend too. Click **Publish** in Lovable once, so `wake-up-hartford.lovable.app` also runs on the new data. From then on, both addresses show the same live data.
7. **Change the site address setting.** In Netlify, set `VITE_SITE_URL` to `https://hartford.wakeupwednesday.org`, then redeploy, because `VITE_` values are baked in at build time. Update `.env.local` to match. If 4.9 listed any file that can't read the setting, such as `public/robots.txt`, ask Claude Code to update its address too.
8. **Point the Wake Up Wednesday link at the new site.** Change the link on wakeupwednesday.org to the subdomain.
9. **Test from the Wake Up Wednesday page.** Click through the link and repeat a short version of the Phase 6 checklist: address search, neighborhood, story, sign-up and sign-in.

Visitors who still reach the lovable.app address see the same live data, so nothing breaks for anyone using an old link.

### If something goes wrong

The old Lovable Cloud backend is untouched until Phase 8.

1. Revert the step 6 commit, which points the code back at the old backend.
2. Publish in Lovable.
3. Point the Wake Up Wednesday link back to the lovable.app address.

Any records written to the new database during the window would need copying back, which is one more reason to keep the window short.

## Phase 8: Wrap up and retire Lovable (2–3 hours, after a 2–4 week safety period)

Keep Lovable as a safety net until the new site has run cleanly for a few weeks. Then close it down in this order. Some of these steps are permanent.

### Right after cut-over

- [ ] Update any QR codes, flyers, social posts or emails that point straight at the lovable.app address, so they use the subdomain or the Wake Up Wednesday page.
- [ ] Delete test accounts and test records from Supabase.
- [ ] Confirm backup coverage on your Supabase plan. Free plans include limited backups. Upgrade before you rely on the site for anything you can't afford to lose.
- [ ] Turn on CAPTCHA protection for sign-ins, including anonymous sign-ins. With anonymous sign-ins on, anyone can create unlimited guest accounts, and Supabase recommends CAPTCHA to stop automated abuse. Pick a provider (hCaptcha or Cloudflare Turnstile), add its keys under **Authentication → Attack Protection**, and ask Claude Code to add the CAPTCHA widget to the sign-in page and the guest flow. Until then, keep Supabase's default rate limits on.

### After 2–4 clean weeks

1. **Archive the last Lovable export and storage files.** Download them, check they open, and store them in the organization's Google Drive.
2. **Retire the lovable.app address.** Optionally, publish a short "We've moved" page there first. Then **unpublish** the site in Lovable.
3. **Remove the Lovable Cloud database.** This is permanent, and it also deletes any exports saved in Lovable storage. Do step 1 first.
4. **Disconnect Git sync** in **Project settings → Git**. The GitHub repository stays and becomes the only copy that matters.
5. **Change or cancel the Lovable subscription.** Moving the site doesn't cancel billing on its own.
6. **Replace any API keys** that were ever stored in Lovable with new ones, then update them in Supabase.

### How changes work from now on

| Task | How |
| --- | --- |
| Change text, layout or features | Describe it in Claude Code → review the diff → pull request → check the Netlify preview → merge. Live in a few minutes. |
| Update data pipelines | Ask Claude Code to write or adjust the scripts and scheduled jobs in the repository. |
| Undo a bad change | Revert the pull request on GitHub, or roll back to an earlier deploy in Netlify with one click. |
| Add a volunteer developer | Invite them to the GitHub organization. No Lovable seat needed. |
| Monthly check (30 minutes) | Ask Claude Code to update dependencies and fix anything they break. Review Supabase, Netlify, Google Cloud (Gemini and Maps) and ElevenLabs usage. |

### Hand-off basics

Ask Claude Code to write a `README.md` explaining how to run, change and deploy the site. Keep the `CLAUDE.md` from Phase 3 current. Together, these let anyone the organization brings in pick up the project without you.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| A page shows "404" when opened directly or refreshed | Missing index.html rewrite | Check the rewrite in `netlify.toml` (Phase 5, step 1). |
| Netlify site loads, but no data appears | Environment variables missing or still pointing at the old backend | Check the three `VITE_SUPABASE_` values in Netlify, then redeploy. These values are baked in at build time. |
| Sign-in fails with a redirect error | New address not allowed in Supabase | Add it under **Authentication → URL Configuration**. |
| AI text or story audio doesn't appear | Missing key in Netlify, or the code still calls Lovable's AI gateway | Check the keys in Netlify's environment variables and its function logs, then revisit 4.9. |
| Restore errors about objects that "already exist" | Restoring structure over the structure already pushed | Restore data only. Never add `--clean` without understanding it. |
| Lovable says it and GitHub have "diverged" | Edits made in both places | Stop editing in Lovable, and have Claude Code reconcile the `lovable-sync` branch. |
| Supabase project seems paused | Free-tier projects can pause after a period of inactivity | Restore it from the Supabase dashboard. Consider a paid plan once the site is public. |

When stuck, paste the exact error into Claude Code and ask what it means and how to fix it.

## Sources

- [Lovable: Deploying and hosting outside Lovable](https://docs.lovable.dev/tips-tricks/external-deployment-hosting)
- [Lovable: Deployment, hosting and ownership options](https://docs.lovable.dev/tips-tricks/deployment-hosting-ownership)
- [Lovable: Connect to GitHub](https://docs.lovable.dev/integrations/github)
- [Lovable: Git sync overview](https://docs.lovable.dev/integrations/git-sync-overview)
- [Claude Code desktop quickstart](https://code.claude.com/docs/en/desktop-quickstart)
- [Claude Code on the web quickstart](https://code.claude.com/docs/en/web-quickstart)
- [Supabase: migrating auth users between projects](https://supabase.com/docs/guides/troubleshooting/migrating-auth-users-between-projects)

Lovable's steps and menus change often. Check the first source before Phases 4 and 7.
