# AI Story of the Tract

## What you'll see

On the neighborhood page, once a tract is loaded and its indicators are showing, a new link/button appears near the top of the report — something like:

> **Read the story of this neighborhood →**  *(AI-generated)*

Clicking it opens a popup (modal dialog) with a 4–6 paragraph narrative written by AI that turns the raw indicators (poverty, income, unemployment, education, housing age, rent burden, uninsured rate, food access flag, etc.) into a plain-language story about the tract — strengths, challenges, what residents are likely experiencing, and how this tract compares to the Connecticut state averages we already fetch.

The popup will:
- Show the tract name + neighborhood as the title
- Stream the story in token-by-token so it feels alive (no long blank wait)
- Include a small **"AI-generated from public ACS census data — may contain errors"** disclaimer at the bottom
- Have a **Copy** button and a **Close** button

## How it works (technical)

1. **New server function** `generateTractStory` in `src/lib/tract-story.functions.ts`
   - Input: the same `{ state, county, tract }` we already use, plus the tract display name + neighborhood label
   - Internally: re-uses `getTractIndicators` to fetch the indicators (or accepts them as input to avoid a second API call)
   - Calls the **Lovable AI Gateway** (`https://ai.gateway.lovable.dev/v1/chat/completions`) using the auto-provisioned `LOVABLE_API_KEY` — no user setup needed
   - Default model: `google/gemini-3-flash-preview` (fast, free tier, good at narrative writing)
   - System prompt frames the AI as a community-data storyteller writing for Hartford residents at an 8th-grade reading level, grounded only in the numbers provided, no invented facts
   - Returns the streamed response body directly to the client

2. **New popup component** `TractStoryDialog.tsx`
   - Built on the existing `shadcn/ui` `Dialog` (already in the project)
   - Triggered by a button placed in `src/routes/neighborhood.tsx` right under the tract header
   - Uses fetch + ReadableStream to render tokens as they arrive (per the AI-gateway streaming pattern)
   - Handles `429` (rate-limited — show "Try again in a moment") and `402` (credits exhausted — show "AI credits depleted, contact admin") gracefully with a toast

3. **No DB changes, no new dependencies.** Lovable AI Gateway + existing UI primitives only.

## What I will NOT change

- The map, the indicator cards, the address lookup, the existing routes — all untouched
- No new data sources; the story is built from the ACS indicators already on the page

## Open questions before I build

None blocking — but a couple of things you might want to tune later:
- **Tone**: I'll default to "warm, plain-language, hopeful but honest." Say the word if you want it more clinical or more activist.
- **Length**: ~250–400 words by default. Easy to adjust.
- **Caching**: First version generates fresh each click. If costs become a concern we can cache per tract in the database.

Approve this and I'll implement it.
