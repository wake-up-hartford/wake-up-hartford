# Your Home data: where it comes from now, and what we need from CTData

## Where the data comes from now (no live connection to CTData)
- **Hartford addresses** (about 10,000) are saved in the app's own database. This list powers the address search and matching.
- **City code violations** and **311 complaints** are copies of City of Hartford data saved in the app's database. They are not updated automatically. Most records are matched to a home by street name only, so results can be loose.
- **The map and address search** use OpenStreetMap.
- **The building photo** comes from Google Street View.
- **The short "story" about each building** is written by the app's built-in AI from the data above.

## What we need from CTData
Each address needs one shared ID that links all of its records together. That ID is the parcel ID.
1. **A parcel list** with parcel ID, full address, ZIP and neighborhood. This becomes the main address list.
2. **Property details** for each parcel: year built, number of units, owner or landlord name and owner mailing address, assessed value and property type.
3. **Code violations** with parcel ID, date, type and status. These replace the current copies.
4. **311 complaints** with parcel ID, date and category, covering the full time period.
5. **How updates will work**: how often the data refreshes, where we get it from (a public link or shared access), and a short guide to the fields.

**Out of scope:** evictions and utility shutoffs. We are not building these into Your Home, so they are not part of the ask to CTData.

The full list is in the spreadsheet already made for CTData (ctdata-your-home-data-points_v2.xlsx), with missing items highlighted in yellow.

## When the data arrives (optional build step)
- Load the parcel list and make the parcel ID the main way homes are matched.
- Swap the old violation and 311 copies for the CTData data.
- Add year built and number of units to the Your Home report.
- If CTData makes its files public, set up automatic updates.
