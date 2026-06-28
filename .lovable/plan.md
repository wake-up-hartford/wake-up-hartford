## Fix mobile header jump from rotating messages

The rotating civic-message banner in `src/components/AppShell.tsx` changes height between messages on mobile — some wrap to 2 lines, others stay on 1 line — causing the sticky header to push/pull the page content.

### Plan

1. Inspect the message container
   - The current markup has no fixed height; it relies on text content + padding (`py-2.5`).
   - Text size is `text-[15px]` on mobile and `text-[14px]` on desktop (`sm:text-[14px]`).

2. Fix the mobile banner height
   - Set a fixed height on the message container below `sm` that accommodates exactly 2 lines of the 15px italic text.
   - Center the text vertically inside that fixed height (`flex items-center justify-center`).
   - Apply `line-clamp-2` or equivalent so any longer message never grows beyond 2 lines.

3. Keep desktop untouched
   - Leave the `sm:` layout at its current height and font size; the problem is specifically mobile.

4. Verify visually
   - Cycle through the rotating messages in a mobile viewport to confirm the header height stays constant and no text is clipped or overflows.

### Implementation detail
- File: `src/components/AppShell.tsx` only.
- No new dependencies.
- No behavior changes beyond preventing layout shift.

