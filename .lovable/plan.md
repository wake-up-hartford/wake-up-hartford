## Goal
Convert the two Hartford open-data CSVs into a populated copy of `wuw_code_violation_template.xlsx` so the data can be imported into the "Your Home" section.

## Approach
Write a Python script (pandas + openpyxl) that reads both CSVs, normalizes them, and writes a new file `wuw_code_violations_hartford.xlsx` to `/mnt/documents/`. The original blank template stays untouched.

## File 1 → Code_Violations sheet
Source: `Code_Enforcement_20200101_to_Current.csv`

Per-row mapping:
- `address` ← `Address` + (if `Unit` present) ` Unit <Unit>`, uppercased/trimmed
- `date` ← `Date_Opened`
- `description` ← `Record_Name` (fallback `Record_Type`) + " — " + `Dept_Division`
- `status` ← `Record_Status`
- `case_number` ← `Case_Number`
- `inspector` ← `Inspector_Name`

Filters: keep only `City` ≈ Hartford; drop rows with blank `Address`.

## File 2 → 311_Complaints sheet
Source: `Service_Request_Current_Year.csv`

Per-row mapping:
- `address` ← `USER_Address` (fallback `Match_addr`), normalized; skip rows where it's blank/whitespace (the "Information Request" rows with no address get dropped)
- `date` ← `USER_Opened_Date`
- `type` ← `USER_Application_Name` (fallback `USER_Record_Type`)
- `status` ← `USER_Record_Status`
- `request_number` ← `USER_Record_Number`
- `department` ← `USER_Dept_Division`

## Buildings sheet (auto-derived)
For every unique `address` appearing in either sheet, emit one row with:
- `address`
- `landlord` ← most common non-blank `Property_Owner` from code-enforcement rows for that address
- `violation_count` ← count from Code_Violations
- `complaint_count` ← count from 311_Complaints
- `last_violation_date`, `last_complaint_date`
- Other landlord/contact/portfolio columns left blank for you to fill in.

## Area_Report_Card sheet
Left untouched (no source data for it in these CSVs).

## QA
- Print row counts per sheet after build.
- Open the output with openpyxl and spot-check the first 5 rows of each sheet.
- Confirm address normalization is consistent across the two sheets so Buildings rollup works.

## Deliverable
`wuw_code_violations_hartford.xlsx` in `/mnt/documents/`, presented via `<presentation-artifact>`.

## Open questions before I run it
1. Scope: keep **all** code-enforcement rows back to 2020, or only the last 2 years (matches the 311 file's "current year" scope)?
2. Status filter: include rows like `Closed - No Violation` and `Closed - Violation Corrected`, or only currently-open/active cases?
3. 311 file: keep all request types, or limit to housing-related ones (Housing-Non Urgent, Building & Trades, Blight, Trash, etc.) and drop generic "Information Request" / "Snow Removal"?
