# Memo to CTData: what we have, and what we still need

A one-to-two page Word memo (`ctdata-memo.docx`, saved in Files) from Wake Up Hartford to CT Data Collaborative. It will use the Wake Up Hartford logo and brand colors, and I will check every page before sharing it.

## Memo outline

**1. Purpose.** A thank-you and a short summary: Your Neighborhood now runs on CTData data. Your Home still needs data.

**2. What we have from CTData**
- Neighborhood data for Hartford's 17 neighborhoods (2024 Census survey estimates), with its README
- The guide that matches census tracts to neighborhoods (41 tracts)
- The neighborhood map boundaries
- How we use it: Your Neighborhood report cards, map, stories and action pages switched from census tracts to neighborhoods
- Note: this is a one-time download. The GitHub repository is private, so the app can't update automatically.

**3. What we still need**
- **Your Neighborhood:** public access to the repository (or shared access), and a note on how often the data is refreshed
- **Your Home**, linked by parcel ID:
  1. Parcel list: parcel ID, full address, ZIP, neighborhood
  2. Property details: year built, number of units, owner or landlord name and mailing address, assessed value, property type
  3. Code violations: parcel ID, date, type, status
  4. 311 complaints: parcel ID, date, category, for the full time period
  5. Update plan: how often it refreshes, how we get it, and a short guide to the fields

**4. Out of scope.** Evictions and utility shutoffs are not part of this request.

**5. Next steps.** Review the attached spreadsheet (`ctdata-your-home-data-points_v2.xlsx`), confirm what's available and when, and set up a short call. Contact lines will be left blank for you to fill in.

## Technical details
- Built with python-docx in /tmp; each page converted to an image to check for layout problems.
- No app changes.
