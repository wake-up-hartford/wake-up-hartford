## Goal

Replace the current broad collaboration proposal with a stripped-down **Data Hosting & Refresh Agreement** between GHB NAACP and CT Data Collaborative, scoped strictly to CTDC housing and refreshing the three datasets the Wake Up Wednesday app actually needs, plus mutual NDA / IP-protection language so the model can be replicated at larger scale without leaking the design.

## Deliverable

A new Google Doc (created via the Google Docs connector in build mode) titled **"Data Hosting & Refresh Agreement — Wake Up Wednesday / CT Data Collaborative"**, with this structure:

1. **Parties & Purpose** — GHB NAACP owns and operates the Wake Up Wednesday app; CTDC's role is limited to hosting and refreshing the agreed datasets.
2. **Scope of CTDC Services** — narrow, dataset-by-dataset (see below). Explicitly excludes app design, indicator selection, community testing, story development, co-promotion, and the "joint work" framing in the current draft.
3. **Datasets, Sources & Refresh Cadence** (table):
   | # | Dataset | Source(s) | Refresh |
   |---|---|---|---|
   | 1 | Hartford target-tract indicators (24 tracts: 19 PA 23-205 + 5 next-highest poverty) — demographics, education, income, housing, workforce, mobility, civic | ACS 5-yr, CSDE, Opportunity Atlas, SOTS voter file | **Annual** |
   | 2 | Building/eviction data for "Your Home" — SOTS ownership records, eviction filings, housing code violations, 311 complaints, Fair Rent / Fair Housing filings, utility shutoffs (where available) | CT Judicial, Hartford Open Data, SOTS, HUD | **Quarterly** |
   | 3 | Vetted CT resources list — name, services, phone, address, hours, languages, eligibility, URL | Curated by GHB NAACP; CTDC validates URLs/phones each cycle | **Quarterly** |
   USDA food-access flags are explicitly **out of scope**.
4. **Delivery format** — flat JSON / CSV at a stable CTDC-hosted URL the app reads at build/runtime; schema versioned; change notice ≥ 14 days before breaking changes.
5. **Data quality & QA** — CTDC cleans, dedupes, validates against prior cycle, flags anomalies before publishing.
6. **Confidentiality & NDA** — mutual NDA covering: the app concept, UX, indicator/story design, prompt/AI-generation logic, source code, unreleased datasets, roadmap, funder conversations. Survives termination 3 years. Permitted disclosures: legal compulsion, pre-approved press, aggregated impact metrics.
7. **Intellectual property** — GHB NAACP retains all rights in the app, brand "Wake Up Wednesday," indicator selection, narrative design, code, and the right to replicate the model in other cities. CTDC retains rights in its underlying cleaned datasets; grants GHB NAACP a perpetual, royalty-free license to use them in WUW and successor/replicated deployments. No CTDC co-branding or co-promotion required or implied.
8. **Cost & funding** — GHB NAACP supports the cost of CTDC's hosting/refresh work, scoped annually; either party may pause work if funding lapses.
9. **Term, termination & data portability** — 1-year initial term, auto-renew, 60-day termination for convenience; on termination CTDC delivers final dataset snapshots and ceases use of confidential materials.
10. **Signatures**.

## Open questions (need 1 quick answer before I draft)

A few small choices that shape the doc — I'll ask in the next turn via a short multi-choice question:

- **NDA strength**: mutual + 3-yr survival (recommended), or one-way protecting only GHB NAACP IP?
- **Additional datasets worth considering** (your "are there others?" question) — my picks, ranked:
  1. **CT Judicial small-claims / housing-court calendar by tract** — pairs naturally with evictions, shows pre-eviction pressure.
  2. **DEEP environmental-justice block-group flags** — overlays cleanly on target tracts, strong policy hook.
  3. **CT DOL unemployment-insurance claims by ZIP, monthly** — leading indicator, refreshes faster than ACS.
  4. **Hartford blight / vacant-property registry** — complements code violations in "Your Home."
  5. **CT Voices for Children child-poverty tract estimates** — sharper than ACS 5-yr for the "make poverty visible" frame.
  I'd recommend adding #1 and #4 to scope now (both quarterly, both already in CTDC's wheelhouse) and leaving #2–#5 as a "future additions" appendix.

## Out of scope (explicitly removed from current draft)

- Co-design of look & feel, indicator selection, gamification.
- Community consultation / testing process (GHB NAACP runs this).
- Joint fundraising language.
- CTDC web-site companion display, evictions explorer integration, co-promotion.
- Timelines for tool launch, story development, beta dates.
- App components #1/#2/#3 narrative descriptions (kept only as a one-paragraph context blurb).

## Mechanics

In build mode I'll: (1) re-confirm the Google Docs connection is linked, (2) create a new doc via `POST /documents`, (3) populate it with a single `batchUpdate` call, (4) return the new doc URL. I will **not** modify the original doc.
