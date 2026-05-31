# Section 2: Primary User Journeys — App Manual

Append a new section to the existing App Manual Google Doc (the one that holds the Plain-Language Style Guide). One section, three sub-sections — one per tool. Each journey is a lightweight step list with the entry point, 3–6 numbered steps, the success outcome, and a **[Built]** or **[Planned]** tag per journey so the manual doubles as a light roadmap.

## What gets added to the doc

**Section 2 — Primary User Journeys**

Short intro paragraph (≤3 sentences, plain-language rules):
- What a user journey is
- Why we map them (shared language for design, copy, and support)
- How to read the tags: **[Built]** = works today, **[Planned]** = in the roadmap

### 2.1 Your Home — journeys
Derived from `/home`, `/home-actions`, `/landlord-letter`.

1. **Check my address for housing concerns** — [Built]
2. **Write a complaint letter to my landlord** — [Built]
3. **Report a code violation to the city** — [Built] (tel: 311)
4. **Get free legal help as a tenant** — [Built] (tel: legal aid)
5. **Recover my security deposit** — [Planned]
6. **Document conditions with photos** — [Planned]

### 2.2 Your Neighborhood — journeys
Derived from `/neighborhood`, `/neighborhood-actions`, `/find-help`.

1. **See the data report for my census tract** — [Built]
2. **Find help near me (housing, food, health, legal, jobs)** — [Built]
3. **Take action based on my tract's red flags** — [Built]
4. **Register to vote / check registration** — [Built] (external link)
5. **Host a Wake Up Wednesday on my block** — [Built] (mailto)
6. **Become a Block Captain** — [Built] (mailto)
7. **Report what the data is missing (ground-truth)** — [Built]

### 2.3 Your Life — journeys
Derived from `/life`, `/plans`, `/plan/$planId`.

1. **Start my 30-Day Stabilization Plan** — [Built]
2. **View and revisit my saved plan** — [Built]
3. **See all my past plans** — [Built]
4. **Sign in / create an account to save plans** — [Built] (`/auth`)
5. **Reset my password** — [Built] (`/reset-password`)

Each journey uses the same micro-template:
```
Title — [Built|Planned]
Entry point: <route or screen>
Steps:
  1. …
  2. …
  3. …
Success: <one sentence describing the outcome>
```

## How it will be built

- Reuse the same Google Docs connector script pattern as Section 1.
- **Append**, don't replace: fetch the doc, find the current `endIndex`, insert Section 2 starting there.
- Build a `batchUpdate` payload with `HEADING_1` for "Section 2 — Primary User Journeys", `HEADING_2` for each tool (2.1 / 2.2 / 2.3), `HEADING_3` for each journey title, bulleted steps, and a small italic tag for `[Built]` / `[Planned]`.
- Apply plain-language style guide rules to all copy (short sentences, "you", active voice).
- Return the same shareable Google Doc link when done.

## Open questions (I'll use these defaults if you don't answer)

- **Add a persona line per journey** (e.g. "Hartford renter on a phone")? Default: **no**, to keep it lightweight as you chose.
- **Include the route path** (e.g. `/home-actions`) next to entry points? Default: **yes** — useful for the team, harmless for readers.
