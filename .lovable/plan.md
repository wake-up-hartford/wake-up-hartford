## Goal

Create a new Google Doc titled **"App Manual — Section 1: Plain-Language Style Guide"** in your connected Google Docs account (Joanne's Google Docs). This will be the first section of the App Manual and a foundation other writing rules can build on.

## Target reading level

- **Flesch-Kincaid Grade Level: 5–6** (someone who finished 5th or 6th grade can read it easily)
- **Flesch Reading Ease: 80+** (very easy)
- Average sentence length: **≤ 15 words**
- Avoid words with 3+ syllables when a shorter word works

## Document outline

1. **Purpose** — why plain language matters for this app (trust, accessibility, fewer support questions)
2. **Who we write for** — assume a busy adult reader, any background, reading on a phone
3. **Reading level target** — the numbers above + how to check (Hemingway App, free Flesch-Kincaid checkers)
4. **The 10 core rules**
   1. Use short sentences (aim for 15 words or fewer)
   2. Use short, common words (say *use* not *utilize*)
   3. Write in active voice (*"We saved your changes"* not *"Your changes have been saved"*)
   4. Speak directly to the reader — use *you*
   5. Use *we* for the app/team
   6. Avoid jargon, acronyms, and legal-speak; if you must use a term, define it once
   7. One idea per sentence, one topic per paragraph
   8. Use everyday verbs, not noun phrases (*decide* not *make a decision*)
   9. Be specific about numbers, dates, and actions
   10. Read it out loud — if you stumble, rewrite it
5. **Tone** — warm, calm, respectful, never condescending or cutesy
6. **Formatting rules** — sentence case for buttons and headings, no ALL CAPS, bullet lists over long paragraphs, bold for the one thing that matters most
7. **Words to avoid / preferred swaps** — a short table (e.g. *utilize → use*, *commence → start*, *in order to → to*, *prior to → before*, *terminate → end*, *assistance → help*)
8. **Good vs. bad examples** — 6–8 side-by-side pairs covering: a button label, an error message, an empty state, a confirmation, a help tooltip, an email subject, a privacy note, an onboarding step
9. **Checklist before shipping any text** — 5-item checklist the writer runs through
10. **How to measure** — paste text into a reading-level checker; revise until grade ≤ 6

## How it will be built

- Use the Google Docs connector (already linked) to create the document
- Build it via TipTap JSON → Google Docs `batchUpdate` so headings, bullets, and the swap table render as native Google Docs structure (not pasted HTML)
- Return the shareable Google Docs link when done

## Open question (optional — I can pick sensible defaults if you don't answer)

- Voice: should the guide use **"we"** for the app team (friendlier) or stay neutral/impersonal? Default: **"we" + "you"**.
