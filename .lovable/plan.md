## Goal

Let users read and listen to the *generated* content in Spanish: tract stories, building stories, stabilization plans, and landlord/action letters, plus the audio narration. Static UI (nav, buttons, headers, onboarding) stays English for now. Vetted-resource cards stay English. This is the cheapest, lowest-maintenance step toward bilingual support.

## What the user will see

- A small **EN / ES** pill (segmented control) appears at the top of any screen that shows generated AI content: the Tract Story dialog, the Building Story dialog, the Stabilization Plan page (`/plan/$planId`), and the Landlord Letter page (`/landlord-letter`).
- Default is EN. Tapping ES re-generates that piece of content in Spanish and, if the user then taps **Listen**, the audio plays in Spanish too.
- The language choice is remembered per device (localStorage) so a Spanish-dominant user doesn't have to re-tap it every screen.
- Nothing else changes — the rest of the app stays English in Phase 1.

## Why not full UI translation right now

- The intro is still `[[INTRO TEXT HERE]]` and copy is actively churning. Translating chrome that's about to change wastes effort and creates stale-translation risk.
- Resource cards (hours, eligibility notes) aren't translated in `ct-resources.json`. A toggle that flips chrome but leaves resources English looks broken.
- The highest-value words on the app are AI-generated, and AI translation is free + always current.

## Technical approach

### 1. Language preference

- New file `src/lib/language.ts`: exports `getLanguage()`, `setLanguage("en" | "es")`, and a `useLanguage()` hook (subscribes via a tiny event emitter / `storage` event so dialogs re-render when the user toggles).
- Stored in `localStorage` under key `wuw_content_lang`.

### 2. Server functions: accept a `language` param

Update these four server functions to take an optional `language: "en" | "es"` input and pass it into the model prompt as an explicit instruction ("Respond in Spanish (es-US, plain Hartford community Spanish, 6th-grade reading level). Keep proper nouns and program names in English."):

- `src/lib/tract-story.functions.ts`
- `src/lib/building-story.functions.ts`
- `src/lib/stabilization-plan.functions.ts`
- `src/lib/action-letter.functions.ts`

No schema changes. The Spanish output is just stored alongside the English in the same TanStack Query cache, keyed by `[..., language]` so EN and ES coexist without one clobbering the other.

### 3. TTS: pick a Spanish voice when `language === "es"`

- `src/lib/tts.functions.ts` already accepts an optional `voiceId`. Add an optional `language` input.
- When `language === "es"`, default `voiceId` to a Spanish ElevenLabs voice (e.g. a warm female community-voice ID — pick from the Voice Library; multilingual v2 already supports Spanish).
- Also skip the English number-to-words spokenifier when `language === "es"` (it would mispronounce — better to let the model say digits naturally in Spanish, or add a Spanish number expander later).
- `ListenButton` passes the current language through.

### 4. UI: the EN / ES toggle

- New component `src/components/LanguageToggle.tsx` — a small segmented pill matching the existing design tokens (gold accent, rounded-full, border).
- Mounted at the top of:
  - `TractStoryDialog`
  - `BuildingStoryDialog`
  - `/plan/$planId` route
  - `/landlord-letter` route
- When toggled, the component calls `setLanguage(...)` and the dialog/page's `useQuery` re-fetches because `language` is in its query key.

### 5. Caching & invalidation

- Query keys gain a `language` segment: `["tract-story", tractId, "es"]`, `["building-story", addressId, "es"]`, etc.
- No DB migration. Generated Spanish content is cached in React Query the same way English is today.

### 6. Microcopy strings the toggle itself uses

- "EN" / "ES" labels only — no other Spanish UI strings.
- aria-label: `"Switch content language"`.

## Out of scope (deferred to Phase 2)

- react-i18next, translated nav, translated buttons, translated onboarding.
- Translated resource cards (`name_es`, `eligibility_notes_es`, etc.).
- Browser language auto-detection.
- Spanish number-to-words for TTS.
- Persisting language to the user's Supabase profile.

## Files to add / change

**Add**
- `src/lib/language.ts`
- `src/components/LanguageToggle.tsx`

**Edit (small surgical changes)**
- `src/lib/tract-story.functions.ts` — accept `language`, inject into prompt
- `src/lib/building-story.functions.ts` — same
- `src/lib/stabilization-plan.functions.ts` — same
- `src/lib/action-letter.functions.ts` — same
- `src/lib/tts.functions.ts` — accept `language`, pick Spanish voice, skip English number expander when `es`
- `src/components/TractStoryDialog.tsx` — mount toggle, include language in query key, pass to TTS
- `src/components/BuildingStoryDialog.tsx` — same
- `src/components/ListenButton.tsx` — accept/pass `language` prop
- `src/routes/plan.$planId.tsx` — mount toggle, include language in query key
- `src/routes/landlord-letter.tsx` — mount toggle, include language in query key

## Validation

- Toggle to ES on a tract story → text regenerates in Spanish within a few seconds.
- Tap Listen on the Spanish text → audio plays in a Spanish voice.
- Toggle back to EN → original English content reappears instantly (cached).
- Refresh the page → language preference persists.
- Nav, buttons, and resource cards remain English (expected).

## Estimated scope

Small — one focused build. No DB, no auth, no new dependencies.
