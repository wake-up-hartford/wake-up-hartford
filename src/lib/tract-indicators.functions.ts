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
};

export type TractIndicatorsResult = {
  fips: string;
  population: number | null;
  indicators: Indicator[];
  error?: string;
};

const Input = z.object({
  state: z.string().regex(/^\d{2}$/),
  county: z.string().regex(/^\d{3}$/),
  tract: z.string().regex(/^\d{6}$/),
});

async function fetchACS(url: string): Promise<Record<string, number>> {
  const key = process.env.CENSUS_API_KEY;
  const finalUrl = key ? `${url}&key=${encodeURIComponent(key)}` : url;
  const res = await fetch(finalUrl, { redirect: "manual" });
  if (res.status === 302 || res.headers.get("x-datawebapi-keyerror")) {
    throw new Error("CENSUS_API_KEY missing or invalid. Get a free key at https://api.census.gov/data/key_signup.html and add it as a secret.");
  }
  if (!res.ok) throw new Error(`ACS ${res.status}`);
  const json = (await res.json()) as string[][];
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

export const getTractIndicators = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<TractIndicatorsResult> => {
    const { state, county, tract } = data;
    const fips = `${state}${county}${tract}`;
    const geo = `for=tract:${tract}&in=state:${state}+county:${county}`;

    try {
      const [b, s] = await Promise.all([
        fetchACS(`${ACS_BASE}?get=${B_VARS.join(",")}&${geo}`),
        fetchACS(`${ACS_SUBJECT}?get=${SUBJECT_VARS.join(",")}&${geo}`),
      ]);

      const pop = b["B01003_001E"] ?? null;

      // No HS diploma = sum 002..016
      const noHsSum = [
        "B15003_002E","B15003_003E","B15003_004E","B15003_005E","B15003_006E",
        "B15003_007E","B15003_008E","B15003_009E","B15003_010E","B15003_011E",
        "B15003_012E","B15003_013E","B15003_014E","B15003_015E","B15003_016E",
      ].reduce((sum, k) => sum + (b[k] || 0), 0);
      const noHsPct = pct(noHsSum, b["B15003_001E"]);

      const childPovPct = pct(b["B17006_002E"], b["B17006_001E"]);
      const medInc = b["B19013_001E"];
      const medIncVal = medInc > 0 ? medInc : null;
      const unempPct = pct(b["B23025_005E"], b["B23025_003E"]);
      const uninsPct = Number.isFinite(s["S2701_C05_001E"]) ? s["S2701_C05_001E"] : null;
      const preTotal = (b["B25034_009E"] || 0) + (b["B25034_010E"] || 0) + (b["B25034_011E"] || 0);
      const pre1960Pct = pct(preTotal, b["B25034_001E"]);
      const severeRentPct = pct(b["B25070_010E"], b["B25070_001E"]);
      const renterPct = pct(b["B25003_003E"], b["B25003_001E"]);
      const usdaFlag = FLAGGED.has(fips);

      const indicators: Indicator[] = [
        {
          key: "population",
          label: "Total population",
          value: fmtInt(pop),
          raw: pop,
          severity: "neutral",
          note: "People living in this census tract (ACS 5-year estimate).",
        },
        {
          key: "child_poverty",
          label: "Children in poverty",
          value: fmtPct(childPovPct),
          raw: childPovPct,
          severity: tier(childPovPct, 10, 25),
          note: "Share of children under 18 below the federal poverty line.",
        },
        {
          key: "median_income",
          label: "Median household income",
          value: fmtUSD(medIncVal),
          raw: medIncVal,
          severity: "neutral",
          note: "Half of households earn more, half earn less.",
        },
        {
          key: "unemployment",
          label: "Unemployment rate",
          value: fmtPct(unempPct),
          raw: unempPct,
          severity: tier(unempPct, 4, 10),
          note: "Share of the labor force currently looking for work.",
        },
        {
          key: "no_hs",
          label: "Adults without a high school diploma",
          value: fmtPct(noHsPct),
          raw: noHsPct,
          severity: tier(noHsPct, 8, 20),
          note: "Share of adults age 25+ who never finished high school.",
        },
        {
          key: "uninsured",
          label: "Uninsured residents",
          value: fmtPct(uninsPct),
          raw: uninsPct,
          severity: tier(uninsPct, 6, 15),
          note: "Share of people of all ages without health insurance.",
        },
        {
          key: "pre1960",
          label: "Old housing (pre-1960)",
          value: fmtPct(pre1960Pct, 0),
          raw: pre1960Pct,
          severity: tier(pre1960Pct, 20, 50),
          note: "Older homes are more likely to contain lead paint.",
        },
        {
          key: "severe_rent",
          label: "Severe rent burden",
          value: fmtPct(severeRentPct),
          raw: severeRentPct,
          severity: tier(severeRentPct, 15, 30),
          note: "Renters spending more than half of their income on rent.",
        },
        {
          key: "renter_share",
          label: "Renter share",
          value: fmtPct(renterPct, 0),
          raw: renterPct,
          severity: "neutral",
          note: "Share of occupied homes that are rented rather than owned.",
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

      return { fips, population: pop, indicators };
    } catch (err) {
      console.error("getTractIndicators failed", err);
      const msg = err instanceof Error ? err.message : String(err);
      return {
        fips,
        population: null,
        indicators: [],
        error: msg.startsWith("CENSUS_API_KEY") ? msg : "Couldn't reach the Census API. Please try again in a moment.",
      };
    }
  });
