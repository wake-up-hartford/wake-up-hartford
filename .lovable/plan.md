Change the plan page's Email button so it opens the user's own email app with a PDF of the plan already attached, instead of sending a plain link.

Approach: client-side PDF generation + native share sheet. No backend email domain is required.

## Implementation

1. Install `html2pdf.js` (client-side HTML-to-PDF library) for converting the printable plan element into a PDF blob.

2. Create a reusable `useSharePdf` hook in `src/hooks/use-share-pdf.ts` that:
   - Takes a React ref pointing to the printable DOM element (`#print-plan`).
   - Temporarily forces all plan sections to expand (reuse the existing print-expansion logic) so the PDF includes every week and task.
   - Uses `html2pdf.js` to render the element to a PDF blob.
   - Returns `{ pdf, filename, share, loading, error }`.
   - `share()` tries `navigator.share({ files: [pdfFile], title, text })` first, which on mobile opens the system share sheet and lets the user pick Mail/Gmail/etc.
   - Falls back to a `mailto:` link with the PDF as a data URI when native file sharing is unavailable.
   - Final fallback: download the PDF so the user can attach it manually.

3. Update `src/components/plan/SharePlanCard.tsx`:
   - Add a `printRef` prop.
   - Change the Email button from a `mailto:` link to an async click handler.
   - Show a loading state (e.g., "Preparing PDF…") while the PDF is generated.
   - Use `useSharePdf` to share the generated file.
   - Keep the Text button unchanged (still shares the link via SMS).

4. Update `src/routes/plan.$planId.tsx`:
   - Create a `React.RefObject<HTMLDivElement>` for the `#print-plan` wrapper.
   - Pass that ref to `SharePlanCard`.

5. Ensure the generated PDF captures the same content as the existing print view:
   - Weeks should be expanded during generation.
   - `.no-print` elements (share card, footer actions, back link, sign-up banner) should be excluded from the PDF by generating from the same `#print-plan` element the print styles already target.

6. Add basic error handling and a toast/message if PDF generation fails.

## Out of scope
- No backend email sending or email domain setup.
- The Text button continues to share the link, not a PDF.

## Verification
- Build the app and confirm no type errors.
- On mobile preview, tap Email and verify the native share sheet opens with a PDF file named like `Wake-Up-Plan-{planId}.pdf`.
- On desktop, verify fallback behavior (mailto or download) is reachable.