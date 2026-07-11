Create an internal working document for the NAACP team that lays out (1) the process for partnering with CT Data Collaborative as the data supplier for the Your Home and Your Neighborhood sections, and (2) the process for moving the site to the already-owned wakeupwednesday.org domain.

## Deliverable

A single Word document saved to `/mnt/documents/wake-up-wednesday-next-steps.docx`, delivered as a downloadable artifact in chat. Internal-facing tone: checklist + talking points, not a formal MOU.

## Document outline

**1. Purpose & context (½ page)**
- What Wake Up Wednesday is today and why we're formalizing the data pipeline.
- Current state of the two sections:
  - *Your Home* — address-level lookup (code violations, evictions, utility shutoffs, 311 complaints). Today uses a small Hartford address table we maintain.
  - *Your Neighborhood* — tract/neighborhood-level indicators (air, schools, safety, access). Today uses a static Hartford target-tracts dataset.

**2. Partnership with CT Data Collaborative**

*2a. Goals of the partnership* — CTData becomes the source of truth for both datasets; NAACP owns the product and community-facing narrative.

*2b. Data scope to confirm with CTData*
- Your Home fields: code violations, evictions, utility shutoffs, 311, plus address ↔ tract/neighborhood mapping.
- Your Neighborhood fields: current indicator set (air, schools, safety, access) + any additions CTData recommends.
- Geography: Hartford first; expansion path to other CT municipalities.
- Refresh cadence per dataset (daily / weekly / monthly / annual).
- Historical depth (how far back).

*2c. Delivery mechanism — options to discuss*
- Hosted API endpoint from CTData (preferred; simplest to keep fresh).
- Scheduled file drop (CSV/GeoJSON to shared storage).
- Direct database read access.
- Recommendation and trade-offs for each.

*2d. Legal & governance*
- Data use agreement / MOU: attribution ("Data provided by CT Data Collaborative"), redistribution terms, privacy for address-level data, liability, term & termination.
- Point of contact on each side.
- Review cadence (quarterly check-in suggested).

*2e. Suggested next-step sequence*
1. Intro / scoping call — confirm scope, cadence, delivery mechanism.
2. CTData sends sample extracts for both sections.
3. NAACP reviews samples against current UI; flags gaps.
4. Draft MOU / data use agreement.
5. Technical integration sprint (see §2f).
6. Soft launch on preview URL, joint QA.
7. Public cutover.

*2f. Technical integration notes (for our dev team)*
- Replace `hartford_addresses` table + Nominatim neighborhood backfill with CTData feed.
- Replace static `hartford-target-tracts` data with CTData tract indicators.
- Add a scheduled refresh job.
- Keep the address lookup UX unchanged; only the data source swaps.

*2g. Talking points for the CTData conversation* — short bulleted script covering mission fit, community reach, what we need, what we can offer (visibility, co-branding, feedback loop from residents).

**3. Moving the site to wakeupwednesday.org**

Domain is already owned by NAACP. Process:

*3a. Pre-move checklist*
- Confirm registrar login access.
- Decide primary host: `wakeupwednesday.org` (apex) vs `www.wakeupwednesday.org` — recommend apex as primary, www redirects.
- Inventory anywhere the current `wake-up-hartford.lovable.app` URL is referenced (print materials, social bios, QR codes, email signatures).

*3b. Connect the domain in Lovable*
1. Project Settings → Domains → Connect Domain.
2. Enter `wakeupwednesday.org`; add `www.wakeupwednesday.org` as a second entry.
3. At the NAACP registrar, add the DNS records Lovable shows:
   - A record `@` → `185.158.133.1`
   - A record `www` → `185.158.133.1`
   - TXT record `_lovable` → verification value shown in Lovable.
4. Remove any conflicting old A/CNAME records for `@` or `www`.
5. Wait for verification + automatic SSL (usually minutes; up to 72 hrs).
6. Set `wakeupwednesday.org` as Primary; `www` will redirect to it.

*3c. Post-move checklist*
- Update `og:url`, canonical URL, sitemap `BASE_URL`, and JSON-LD in the app to `https://wakeupwednesday.org`.
- Update social preview links / share copy.
- Update `robots.txt` sitemap reference.
- Keep the old `wake-up-hartford.lovable.app` URL live for at least 90 days; it will continue to serve.
- Submit new domain to Google Search Console; request re-index.
- Announce the new URL (email, social, community partners).

*3d. Email on the domain (optional)*
- If NAACP wants `hello@wakeupwednesday.org` etc., add MX/SPF/DKIM/DMARC records at the registrar — separate from the Lovable A/TXT records, does not conflict.

**4. Timeline (suggested)**
Simple table: Week 1 CTData scoping call · Weeks 2–3 sample data + MOU draft · Weeks 3–4 domain connection + DNS · Weeks 4–6 technical integration · Week 7 joint QA · Week 8 public launch on wakeupwednesday.org.

**5. Open questions / decisions needed**
- Who signs the MOU on NAACP's side?
- Attribution wording and placement in the UI.
- Whether address-level data has any redistribution restrictions.
- Analytics / reporting we owe back to CTData.

## Technical execution

- Use the docx skill: docx-js in Node, US Letter, Arial, proper Heading1/Heading2 styles, real bullet numbering (no unicode bullets), a small timeline table with DXA widths.
- Write to `/mnt/documents/wake-up-wednesday-next-steps.docx`.
- Validate the .docx, convert to PDF + images, and visually QA every page before delivering.
- Return the file with a `<presentation-artifact>` tag.

## Out of scope
- No code changes to the app in this task.
- No actual outreach email to CTData drafted (can be a follow-up).
- No MOU legal text — outline only; legal review handled separately.
