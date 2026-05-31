# Plan: Publish the launch guide as a Google Doc

Push the existing launch guide into your Google Docs so you can share, comment, and edit it like any other Google Doc.

## Steps

1. **Connect Google Docs.** Call `standard_connectors--connect` with `google_docs` so Lovable can create a document on your behalf. You'll pick (or create) the Google account in the popup.
2. **Create a new doc.** `POST` to the gateway's `/documents` endpoint with the title **"Wake Up Wednesday — How To Launch"**. The response returns a `documentId` and the edit URL.
3. **Insert the guide content.** Send a single `batchUpdate` request that:
   - Inserts each section as text in order.
   - Applies `HEADING_1` to the document title and section headers ("1. What ready for public use means", "2. Final content pass", etc.), `HEADING_2` to sub-sections, and `NORMAL_TEXT` to body paragraphs.
   - Bullet/checkbox lists are added with `createParagraphBullets` (using `BULLET_CHECKBOX` preset for the day-of-launch checklist so you can tick items off in Google Docs).
   - Bold marks for emphasized phrases.
4. **Return the link.** Reply with the Google Docs URL so you can open it in one click.

## Notes

- This uses the Google account *you* connect — the doc lives in your Drive, not each end user's.
- Source content is the Markdown already saved at `/mnt/documents/how-to-launch-wake-up-wednesday.md`; no changes to wording.
- The original `.md` file stays available in chat as a backup.
- No app/code changes; this is a one-off script run via `code--exec`.
