import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import usdaFlagged from "@/data/usda-food-access.json";

const FLAGGED = new Set<string>(usdaFlagged as string[]);

const ACS_YEAR = "2022";
const ACS_BASE = `https://api.census.gov/data/${ACS_YEAR}/acs/acs5`;
const ACS_SUBJECT = `https://api.census.gov/data/${ACS_YEAR}/acs/acs5/subject`;

// All B-table variables we need in a single call.
const B_VARS = [
  "B01003_001E", // total pop
  "B17006_001E",
  "B17006_002E", // children in poverty
  "B19013_001E", // median household income
  "B23025_003E",
  "B23025_005E", // unemployment
  // Educational attainment — no HS diploma = vars 002..016
  "B15003_001E",
  "B15003_002E",
  "B15003_003E",
  "B15003_004E",
  "B15003_005E",
  "B15003_006E",
  "B15003_007E",
  "B15003_008E",
  "B15003_009E",
  "B15003_010E",
  "B15003_011E",
  "B15003_012E",
  "B15003_013E",
  "B15003_014E",
  "B15003_015E",
  "B15003_016E",
  // Year built — pre-1960 buckets are 009 (1950-59), 010 (1940-49), 011 (1939 or earlier)
  "B25034_001E",
  "B25034_009E",
  "B25034_010E",
  "B25034_011E",
  // Rent as % income — severe = 010 (50%+)
  "B25070_001E",
  "B25070_010E",
  // Tenure
  "B25003_001E",
  "B25003_002E",
  "B25003_003E",
];

const SUBJECT_VARS = ["S2701_C05_001E"]; // % uninsured (all ages)

export type Indicator = {
  key: string;
  label: string;
  value: string;
  raw: number | null;
  severity: "good" | "watch" | "concern" | "neutral";
  note: string;
  stateAverage?: { value: string; raw: number | null; label: string } | null;
};

export type TractIndicatorsResult = {
  fips: string;
  population: number | null;
  indicators: Indicator[];
  error?: string;
};

export type GeocodedTractResult = {
  address: string;
  state: string;
  county: string;
  tract: string;
  tractName: string;
  neighborhood?: string;
  error?: string;
};

const Input = z.object({
  state: z.string().regex(/^\d{2}$/),
  county: z.string().regex(/^\d{3}$/),
  tract: z.string().regex(/^\d{6}$/),
});

const GeocodeInput = z.object({
  address: z.string().trim().min(5).max(200),
});

async function fetchACS(url: string): Promise<Record<string, number>> {
  const key = process.env.CENSUS_API_KEY;
  const finalUrl = key ? `${url}&key=${encodeURIComponent(key)}` : url;
  const res = await fetch(finalUrl, { redirect: "manual" });
  if (res.status === 302 || res.headers.get("x-datawebapi-keyerror")) {
    throw new Error("CENSUS_API_KEY missing or invalid. Get a free key at https://api.census.gov/data/key_signup.html and add it as a secret.");
  }
  if (!res.ok) throw new Error(`ACS ${res.status}`);
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(`ACS empty response from ${url.split("?")[0]}`);
  }
  let json: string[][];
  try {
    json = JSON.parse(text) as string[][];
  } catch {
    throw new Error(`ACS returned non-JSON: ${text.slice(0, 120)}`);
  }
  if (!Array.isArray(json) || json.length < 2) throw new Error("ACS empty");
  const headers = json[0];
  const row = json[1];
  const out: Record<string, number> = {};
  headers.forEach((h, i) => {
    const v = Number(row[i]);
    out[h] = Number.isFinite(v) ? v : NaN;
  });
  return out;
}

function pct(numer: number, denom: number): number | null {
  if (!Number.isFinite(numer) || !Number.isFinite(denom) || denom <= 0) return null;
  return (numer / denom) * 100;
}

function fmtPct(v: number | null, digits = 1): string {
  return v == null ? "—" : `${v.toFixed(digits)}%`;
}

function fmtUSD(v: number | null): string {
  if (v == null || v < 0) return "—";
  return `$${Math.round(v).toLocaleString()}`;
}

function fmtInt(v: number | null): string {
  return v == null ? "—" : Math.round(v).toLocaleString();
}

function tier(
  v: number | null,
  good: number,
  concern: number,
  invert = false,
): "good" | "watch" | "concern" | "neutral" {
  if (v == null) return "neutral";
  if (invert) {
    // higher is better (e.g. homeownership) — not used here, but kept for clarity
    if (v >= good) return "good";
    if (v <= concern) return "concern";
    return "watch";
  }
  if (v <= good) return "good";
  if (v >= concern) return "concern";
  return "watch";
}

export const geocodeAddressToTract = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => GeocodeInput.parse(input))
  .handler(async ({ data }): Promise<GeocodedTractResult> => {
    try {
      const url = new URL("https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress");
      url.searchParams.set("address", data.address);
      url.searchParams.set("benchmark", "Public_AR_Current");
      url.searchParams.set("vintage", "Current_Current");
      url.searchParams.set("layers", "Census Tracts");
      url.searchParams.set("format", "json");

      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error(`Geocoder ${res.status}`);
      }

      const json = await res.json() as {
        result?: {
          addressMatches?: Array<{
            matchedAddress?: string;
            geographies?: {
              [key: string]: Array<{
                STATE?: string | number;
                COUNTY?: string | number;
                TRACT?: string | number;
                NAME?: string;
                BASENAME?: string;
              }>;
            };
          }>;
        };
      };

      const match = json?.result?.addressMatches?.[0];
      if (!match) {
        return {
          address: data.address,
          state: "",
          county: "",
          tract: "",
          tractName: "",
          error: "No match found. Try a more complete US street address.",
        };
      }

      const tract = match.geographies?.["Census Tracts"]?.[0];
      if (!tract?.STATE || !tract?.COUNTY || !tract?.TRACT) {
        return {
          address: match.matchedAddress ?? data.address,
          state: "",
          county: "",
          tract: "",
          tractName: "",
          error: "Address matched but no census tract was returned.",
        };
      }

      return {
        address: match.matchedAddress ?? data.address,
        state: String(tract.STATE).padStart(2, "0"),
        county: String(tract.COUNTY).padStart(3, "0"),
        tract: String(tract.TRACT).padStart(6, "0"),
        tractName: tract.NAME ?? tract.BASENAME ?? String(tract.TRACT),
        neighborhood: (match.matchedAddress ?? data.address).split(",").slice(1, 2).join(",").trim() || undefined,
      };
    } catch (err) {
      console.error("geocodeAddressToTract failed", err);
      return {
        address: data.address,
        state: "",
        county: "",
        tract: "",
        tractName: "",
        error: "Couldn't reach the Census geocoder. Please try again.",
      };
    }
  });

// CT switched from counties to planning regions in 2022 ACS. Old county FIPS
// (001-015) no longer return data. Try the new planning region codes in order.
const CT_PLANNING_REGIONS = ["110", "120", "130", "140", "150", "160", "170", "180", "190"];

async function resolveCtCounty(state: string, county: string, tract: string): Promise<string> {
  if (state !== "09") return county;
  // Old CT county codes are 001-015 (odd). Planning regions are 110-190.
  const n = Number(county);
  if (n >= 110) return county; // already a planning region
  for (const pr of CT_PLANNING_REGIONS) {
    try {
      const url = `${ACS_BASE}?get=B01003_001E&for=tract:${tract}&in=state:09+county:${pr}`;
      const res = await fetchACS(url);
      if (Number.isFinite(res["B01003_001E"])) return pr;
    } catch {
      // try next
    }
  }
  return county;
}

export const getTractIndicators = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<TractIndicatorsResult> => {
    const { state, tract } = data;
    const county = await resolveCtCounty(state, data.county, tract);
    const fips = `${state}${county}${tract}`;
    const geo = `for=tract:${tract}&in=state:${state}+county:${county}`;
    const ctGeo = `for=state:09`;

    const safeFetch = async (url: string): Promise<Record<string, number>> => {
      try {
        return await fetchACS(url);
      } catch (err) {
        console.warn("ACS sub-fetch failed", url, err);
        return {};
      }
    };

    try {
      const [b, s, bCT, sCT] = await Promise.all([
        fetchACS(`${ACS_BASE}?get=${B_VARS.join(",")}&${geo}`),
        safeFetch(`${ACS_SUBJECT}?get=${SUBJECT_VARS.join(",")}&${geo}`),
        fetchACS(`${ACS_BASE}?get=${B_VARS.join(",")}&${ctGeo}`),
        safeFetch(`${ACS_SUBJECT}?get=${SUBJECT_VARS.join(",")}&${ctGeo}`),
      ]);

      const derive = (b: Record<string, number>, s: Record<string, number>) => {
        const noHsSum = [
          "B15003_002E","B15003_003E","B15003_004E","B15003_005E","B15003_006E",
          "B15003_007E","B15003_008E","B15003_009E","B15003_010E","B15003_011E",
          "B15003_012E","B15003_013E","B15003_014E","B15003_015E","B15003_016E",
        ].reduce((sum, k) => sum + (b[k] || 0), 0);
        const preTotal = (b["B25034_009E"] || 0) + (b["B25034_010E"] || 0) + (b["B25034_011E"] || 0);
        const medInc = b["B19013_001E"];
        return {
          pop: b["B01003_001E"] ?? null,
          childPovPct: pct(b["B17006_002E"], b["B17006_001E"]),
          medIncVal: medInc > 0 ? medInc : null,
          unempPct: pct(b["B23025_005E"], b["B23025_003E"]),
          noHsPct: pct(noHsSum, b["B15003_001E"]),
          uninsPct: Number.isFinite(s["S2701_C05_001E"]) ? s["S2701_C05_001E"] : null,
          pre1960Pct: pct(preTotal, b["B25034_001E"]),
          severeRentPct: pct(b["B25070_010E"], b["B25070_001E"]),
          renterPct: pct(b["B25003_003E"], b["B25003_001E"]),
        };
      };

      const t = derive(b, s);
      const ct = derive(bCT, sCT);
      const usdaFlag = FLAGGED.has(fips);

      const cmpPct = (ctRaw: number | null, tractRaw: number | null): string => {
        if (ctRaw == null || tractRaw == null) return "";
        const d = tractRaw - ctRaw;
        if (Math.abs(d) <= 0.5) return " — about the same";
        return ` — ${Math.abs(d).toFixed(1)} pts ${d > 0 ? "above" : "below"} CT`;
      };
      const cmpUSD = (ctRaw: number | null, tractRaw: number | null): string => {
        if (ctRaw == null || tractRaw == null) return "";
        const d = tractRaw - ctRaw;
        if (Math.abs(d) < 500) return " — about the same";
        return ` — $${Math.abs(Math.round(d)).toLocaleString()} ${d > 0 ? "above" : "below"} CT`;
      };

      const avgPct = (raw: number | null) => ({ value: fmtPct(raw), raw, label: `CT average: ${fmtPct(raw)}` });
      const avgPct0 = (raw: number | null) => ({ value: fmtPct(raw, 0), raw, label: `CT average: ${fmtPct(raw, 0)}` });
      const avgUSD = (raw: number | null) => ({ value: fmtUSD(raw), raw, label: `CT average: ${fmtUSD(raw)}` });

      const indicators: Indicator[] = [
        {
          key: "population",
          label: "Total population",
          value: fmtInt(t.pop),
          raw: t.pop,
          severity: "neutral",
          note: "People living in this census tract (ACS 5-year estimate).",
        },
        {
          key: "child_poverty",
          label: "Children in poverty",
          value: fmtPct(t.childPovPct),
          raw: t.childPovPct,
          severity: tier(t.childPovPct, 10, 25),
          note: "Share of children under 18 below the federal poverty line.",
          stateAverage: { ...avgPct(ct.childPovPct), label: `CT average: ${fmtPct(ct.childPovPct)}${cmpPct(ct.childPovPct, t.childPovPct)}` },
        },
        {
          key: "median_income",
          label: "Median household income",
          value: fmtUSD(t.medIncVal),
          raw: t.medIncVal,
          severity: tier(t.medIncVal, 90213, 60000, true),
          note: "Half of households earn more, half earn less.",
          stateAverage: { ...avgUSD(ct.medIncVal), label: `CT median: ${fmtUSD(ct.medIncVal)}${cmpUSD(ct.medIncVal, t.medIncVal)}` },
        },
        {
          key: "unemployment",
          label: "Unemployment rate",
          value: fmtPct(t.unempPct),
          raw: t.unempPct,
          severity: tier(t.unempPct, 4, 10),
          note: "Share of the labor force currently looking for work.",
          stateAverage: { ...avgPct(ct.unempPct), label: `CT average: ${fmtPct(ct.unempPct)}${cmpPct(ct.unempPct, t.unempPct)}` },
        },
        {
          key: "no_hs",
          label: "Adults without a high school diploma",
          value: fmtPct(t.noHsPct),
          raw: t.noHsPct,
          severity: tier(t.noHsPct, 8, 20),
          note: "Share of adults age 25+ who never finished high school.",
          stateAverage: { ...avgPct(ct.noHsPct), label: `CT average: ${fmtPct(ct.noHsPct)}${cmpPct(ct.noHsPct, t.noHsPct)}` },
        },
        {
          key: "uninsured",
          label: "Uninsured residents",
          value: fmtPct(t.uninsPct),
          raw: t.uninsPct,
          severity: tier(t.uninsPct, 6, 15),
          note: "Share of people of all ages without health insurance.",
          stateAverage: { ...avgPct(ct.uninsPct), label: `CT average: ${fmtPct(ct.uninsPct)}${cmpPct(ct.uninsPct, t.uninsPct)}` },
        },
        {
          key: "pre1960",
          label: "Old housing (pre-1960)",
          value: fmtPct(t.pre1960Pct, 0),
          raw: t.pre1960Pct,
          severity: tier(t.pre1960Pct, 20, 50),
          note: "Older homes are more likely to contain lead paint.",
          stateAverage: { ...avgPct0(ct.pre1960Pct), label: `CT average: ${fmtPct(ct.pre1960Pct, 0)}${cmpPct(ct.pre1960Pct, t.pre1960Pct)}` },
        },
        {
          key: "severe_rent",
          label: "Severe rent burden",
          value: fmtPct(t.severeRentPct),
          raw: t.severeRentPct,
          severity: tier(t.severeRentPct, 15, 30),
          note: "Renters spending more than half of their income on rent.",
          stateAverage: { ...avgPct(ct.severeRentPct), label: `CT average: ${fmtPct(ct.severeRentPct)}${cmpPct(ct.severeRentPct, t.severeRentPct)}` },
        },
        {
          key: "renter_share",
          label: "Renter share",
          value: fmtPct(t.renterPct, 0),
          raw: t.renterPct,
          severity: "neutral",
          note: "Share of occupied homes that are rented rather than owned.",
          stateAverage: { ...avgPct0(ct.renterPct), label: `CT average: ${fmtPct(ct.renterPct, 0)}${cmpPct(ct.renterPct, t.renterPct)}` },
        },
        {
          key: "food_access",
          label: "Food access (USDA)",
          value: usdaFlag ? "Low-access" : "OK",
          raw: usdaFlag ? 1 : 0,
          severity: usdaFlag ? "concern" : "good",
          note: usdaFlag
            ? "USDA classifies this tract as low-income and more than 1 mile from a supermarket."
            : "Not classified as a low-income, low-supermarket-access tract.",
        },
      ];

      return { fips, population: t.pop, indicators };
    } catch (err) {
      console.error("getTractIndicators failed", err);
      const msg = err instanceof Error ? err.message : String(err);
      return {
        fips,
        population: null,
        indicators: [],
        error: msg.startsWith("CENSUS_API_KEY") ? msg : `Couldn't load Census data: ${msg}`,
      };
    }
  });
