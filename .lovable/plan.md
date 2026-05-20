## Polish Life intro + survey start

All edits in `src/routes/life.tsx`.

### 1. Gold hook on intro
Change `<strong className="text-foreground">Are you in or approaching crisis?</strong>` to use a gold color: `className="text-amber-400"` (vibrant warm gold that reads on the dark background).

### 2. Vibrant green + bolder ACTION PLAN
On the "ACTION PLAN" `<strong>` inside the survey-start block, swap `text-emerald-500` for `text-emerald-400 font-extrabold tracking-wide` so it pops more.

### 3. Move the "Survey takes 5 to 8 minutes…" block off the intro and onto the survey
- Remove the entire card (lines ~473-479) from `IntroScreen`.
- In `SurveyScreen`, render the same card only on the very first question (`sectionIdx === 0 && questionIdx === 0`), placed at the top of the returned JSX, above the progress bar. Same styling (`rounded-2xl border border-border bg-card p-5 shadow-soft mb-5`).

### 4. Larger "Begin Survey" button in display font
Update the button on `IntroScreen` to:
- `font-display` instead of default
- larger text: `text-[18px]`
- taller padding: `py-5`
- keep the gradient + arrow

No other layout or behavior changes.