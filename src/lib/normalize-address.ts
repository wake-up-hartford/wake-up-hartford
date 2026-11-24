// Tidies a street address into the form the city data is matched on:
// capitals, short street types, no unit. Used by both the Your Home lookup and
// the nightly city data refresh (scripts/refresh-city-data.ts), so a resident's
// search and the stored records always tidy addresses the same way.
const SUFFIX_MAP: Record<string, string> = {
  STREET: "ST", "ST.": "ST", STR: "ST",
  AVENUE: "AV", AVE: "AV", "AVE.": "AV", "AV.": "AV",
  BOULEVARD: "BLVD", "BLVD.": "BLVD",
  ROAD: "RD", "RD.": "RD",
  DRIVE: "DR", "DR.": "DR",
  LANE: "LN", "LN.": "LN",
  COURT: "CT", "CT.": "CT",
  PLACE: "PL", "PL.": "PL",
  TERRACE: "TER", "TER.": "TER", TERR: "TER",
  PARKWAY: "PKWY", "PKWY.": "PKWY",
  CIRCLE: "CIR", "CIR.": "CIR",
  HIGHWAY: "HWY", "HWY.": "HWY",
  SQUARE: "SQ", "SQ.": "SQ",
};
const UNIT_RE = /\b(UNIT|APT|APARTMENT|#|STE|SUITE|FL|FLOOR|RM|ROOM|BLDG|BUILDING)\b.*$/i;

export function normalizeAddress(addr: string): string {
  if (!addr) return "";
  let s = addr.toUpperCase().trim();
  if (!s) return "";
  s = s.split(",")[0].trim();
  s = s.replace(UNIT_RE, "").trim();
  s = s.replace(/\s+/g, " ");
  let parts = s.split(" ").filter(Boolean);
  parts = parts.map((p) => SUFFIX_MAP[p] ?? p);
  while (parts.length && !/[A-Z0-9]/.test(parts[parts.length - 1])) parts.pop();
  return parts.join(" ").trim();
}
