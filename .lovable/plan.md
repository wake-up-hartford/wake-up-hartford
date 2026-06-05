## Combine Report Card + Detailed into one expandable view on /home

The /home page currently has 4 tabs: **Report Card**, **Detailed**, **Share**, **Print**. Report Card shows a compact 2×2 grid of the four indicators (Code violations, Evictions, Utility shutoffs, 311 complaints) with value + severity pill. Detailed shows the same four indicators as full cards with icon, description, item lists, and a "Plain Language" callout.

### Changes (all in `src/routes/home.tsx`)

1. **Remove the Report Card tab.** Drop the `<TabsTrigger value="card">` and `<TabsContent value="card">`. Update `TabsList` to `grid-cols-3`, change `defaultValue` to `"story"`, and update the heading to "3 ways to view Home data".

2. **Rebuild `DetailedReport`** as a list of collapsible cards. Each card's collapsed header shows the same compact summary the old Report Card showed (big value, label, sub-line, severity pill) plus a chevron. Expanding reveals the existing detail content (icon + description, list of violations/complaints, `PlainLanguage` callout, etc.).

3. **Delete the now-unused `ReportCard` component.**

### Technical details

- Use shadcn's existing `Collapsible` primitive (`@/components/ui/collapsible`, already in the project via Radix); add it to the project if not present. Each indicator becomes one `<Collapsible>` wrapping a `<Card>`, with `<CollapsibleTrigger asChild>` on the header row and `<CollapsibleContent>` for the detail body.
- Header row layout: left = value + label + sub (same typography as today's ReportCard tiles), right = `SeverityPill` + `ChevronDown` that rotates 180° when open (`data-[state=open]:rotate-180 transition-transform`).
- First card (Code violations) defaults to open so users immediately see one expanded example; others start collapsed.
- Keep the existing severity logic, copy, icons, and PlainLanguage blocks exactly as they are — only the wrapper/layout changes.
- Share and Print tabs are not modified.

### Out of scope

- `/neighborhood` also has a "Report Card" tab but its content already is the detailed view (single tab labeled "Report Card"), so no change there unless you also want it restructured — let me know.
