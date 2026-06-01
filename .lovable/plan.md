## Goal

Create a new Google Doc titled **"Wake Up Wednesday — Measuring Success & Analytics Plan"** that answers two linked questions:
1. How do we measure success across the 4 categories (Engagement, Outcomes, Advocacy Impact, Community Reach)?
2. What analytics events should the app capture?

The doc is meant to be a working draft GHB NAACP can edit, share with CTDC, and use to spec the analytics instrumentation later.

## Deliverable structure

**1. Purpose** — one short paragraph: WUW measures success by whether Hartford residents in the 24 target tracts actually move from awareness → action → stability, and whether the app surfaces patterns that strengthen advocacy.

**2. Measurement framework — the 4 categories**

For each category: definition, 3–5 KPIs, data source, review cadence.

- **Engagement** — Is the app being used meaningfully (not just opened)?
  KPIs: monthly active users in target tracts, survey completion rate, plan-generation rate, return-visit rate within 30 days, avg. session depth, listen-to-audio rate.
- **Outcomes** — Are users getting unstuck on housing, food, income, legal, etc.?
  KPIs: % of plan steps marked complete at 7/30/60 days, self-reported "this helped" rate, referral connection rate (user contacted resource), eviction-letter generations, crisis-flag follow-through.
- **Advocacy Impact** — Is WUW data shifting policy & funder conversations?
  KPIs: # of tract-level briefs shared with electeds, citations of WUW data in council/legislative testimony, press mentions, # of partner orgs using WUW data, funder meetings sourced from app insights.
- **Community Reach** — Are we reaching the right people, not just the easy-to-reach?
  KPIs: % of users from the 19 PA 23-205 tracts vs 5 next-highest, language distribution (EN/ES/other), referral-source mix (church, school, library, social), unique addresses looked up, repeat users per tract.

**3. Analytics events to capture**

A table of every event, with: event name, trigger, properties, which KPI(s) it feeds.

Events grouped by surface:
- **Onboarding / auth**: `signup_started`, `signup_completed`, `signin`, `signout`
- **Neighborhood / map**: `tract_viewed` (tract_fips), `tract_story_opened`, `address_lookup` (geocoded tract), `map_zoomed`, `target_tract_clicked`
- **Home section**: `building_lookup` (address hash), `building_story_opened`, `landlord_letter_generated`, `landlord_letter_downloaded`
- **Your Path Survey → Plan**: `survey_started`, `survey_step_completed` (step #), `survey_completed`, `followup_completed`, `plan_generated` (priority_domains, plan_id), `plan_viewed`, `plan_step_toggled` (week, domain, done/undone), `plan_step_completion_rate_snapshot` (7/30/60-day cron)
- **Find Help / resources**: `resource_viewed` (resource_id, domain), `resource_phone_clicked`, `resource_website_clicked`, `resource_directions_clicked`, `referral_outcome_reported` (connected / no answer / not eligible / helped)
- **Take Action**: `take_action_clicked` (action_type), `neighborhood_action_started`, `home_action_started`, `share_clicked` (channel)
- **Audio / accessibility**: `listen_started` (surface, content_id), `listen_completed`, `language_changed`
- **Advocacy export**: `tract_brief_exported`, `data_snapshot_downloaded` (for partners/electeds)

**4. Privacy & ethics guardrails**
- Hash addresses; never store raw address with user_id.
- Aggregate to tract level for any external reporting; never publish counts <5.
- Self-reported outcome questions are always optional, plain-language, no shame framing.
- All analytics stored in Lovable Cloud (Supabase) under RLS; no third-party trackers without explicit consent.

**5. Reporting cadence**
- Weekly internal dashboard (engagement + plan completion)
- Quarterly community report (all 4 categories, plain-language, shared with target-tract residents)
- Annual impact report (advocacy + funder facing)

**6. Open questions for GHB NAACP**
- Who owns the analytics dashboard internally?
- Do we want self-reported outcome check-ins by email/SMS at 7/30 days, or only in-app?
- Should referral-outcome reporting be incentivized (raffle, gift card) or kept purely voluntary?
- Which 3 KPIs go on a public-facing "WUW impact" page on the app itself?

## Mechanics

In build mode I'll create a new Google Doc via the existing Google Docs connector (`POST /documents` + a single `batchUpdate`), populate it with the structure above as headings + paragraphs + a small events table, and return the doc URL. I will not modify any other doc.
