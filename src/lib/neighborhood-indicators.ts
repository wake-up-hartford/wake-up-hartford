// Builds the plain-language neighborhood report card from the CT Data
// Collaborative dataset (2024 ACS 5-year estimates aggregated to Hartford's
// 17 neighborhoods). No network calls — the data ships with the app.
import {
  CONNECTICUT_STATS,
  HARTFORD_TOWN_STATS,
  getNeighborhoodStats,
  type GeoStats,
} from "@/data/hartford-neighborhood-data";

export type Indicator = {
  key: string;
  label: string;
  value: string;
  raw: number | null;
  severity: "good" | "watch" | "concern" | "neutral";
  note: string;
  stateAverage?: { value: string; raw: number | null; label: string } | null;
};

export type NeighborhoodIndicatorsResult = {
  name: string;
  population: number | null;
  indicators: Indicator[];
  error?: string;
};

export const DATA_SOURCE_LABEL =
  "CT Data Collaborative · 2024 American Community Survey 5-year estimates";

const fmtPct = (v: number | null, decimals = 1) =>
  v == null ? "—" : `${v.toFixed(decimals)}%`;
const fmtInt = (v: number | null) =>
  v == null ? "—" : Math.round(v).toLocaleString();
const fmtUSD = (v: number | null) =>
  v == null ? "—" : `$${Math.round(v).toLocaleString()}`;

function tier(
  v: number | null,
  good: number,
  concern: number,
  invert = false,
): Indicator["severity"] {
  if (v == null) return "neutral";
  if (invert) {
    if (v >= good) return "good";
    if (v <= concern) return "concern";
    return "watch";
  }
  if (v <= good) return "good";
  if (v >= concern) return "concern";
  return "watch";
}

function sentencePct(
  ctRaw: number | null,
  localRaw: number | null,
  opts: { subject: string; decimals?: number },
): string {
  const decimals = opts.decimals ?? 1;
  const ctStr = fmtPct(ctRaw, decimals);
  if (ctRaw == null || localRaw == null) return `Statewide, the figure is ${ctStr}.`;
  const d = localRaw - ctRaw;
  const absD = Math.abs(d);
  if (absD < 1) return `About the same as Connecticut overall (${ctStr}).`;
  const ratio = ctRaw > 0 ? localRaw / ctRaw : null;
  const higher = d > 0;
  let magnitude: string;
  let connector = "than";
  if (ratio && ratio >= 2) {
    magnitude = "more than double";
    connector = "";
  } else if (ratio && ratio >= 1.5) magnitude = `a lot ${higher ? "higher" : "lower"}`;
  else if (ratio && ratio > 0 && ratio <= 0.5) {
    magnitude = "less than half";
    connector = "";
  } else if (ratio && ratio > 0 && ratio <= 0.67) magnitude = "a lot lower";
  else if (absD >= 5) magnitude = `noticeably ${higher ? "higher" : "lower"}`;
  else magnitude = `a little ${higher ? "higher" : "lower"}`;
  const tail = connector ? `${magnitude} ${connector}` : magnitude;
  return `At ${fmtPct(localRaw, decimals)}, ${opts.subject} is ${tail} Connecticut overall (${ctStr}) — ${Math.round(absD)} points ${higher ? "above" : "below"} the state.`;
}

function incomeSentence(n: GeoStats, ct: GeoStats): string {
  const ctVal = ct.medianIncomeValue;
  if (n.medianIncomeValue == null || ctVal == null)
    return `Statewide median: ${fmtUSD(ctVal)}.`;
  const share = Math.round((n.medianIncomeValue / ctVal) * 100);
  return `Households here earn about ${share}¢ for every dollar a typical Connecticut household brings home (CT median ${fmtUSD(ctVal)}).`;
}

function avg(value: string, raw: number | null, label: string) {
  return { value, raw, label };
}

export function buildNeighborhoodIndicators(
  name: string,
): NeighborhoodIndicatorsResult {
  const n = getNeighborhoodStats(name);
  const ct = CONNECTICUT_STATS;
  if (!n) {
    return {
      name,
      population: null,
      indicators: [],
      error: `We don't have neighborhood data for "${name}".`,
    };
  }

  const indicators: Indicator[] = [
    {
      key: "population",
      label: "Total population",
      value: fmtInt(n.populationCount),
      raw: n.populationCount,
      severity: "neutral",
      note: "People living in this neighborhood (2024 ACS 5-year estimate).",
    },
    {
      key: "child_poverty",
      label: "Children in poverty",
      value: fmtPct(n.childPovertyPct),
      raw: n.childPovertyPct,
      severity: tier(n.childPovertyPct, 10, 25),
      note: "Share of children under 18 below the federal poverty line.",
      stateAverage: avg(
        fmtPct(ct.childPovertyPct),
        ct.childPovertyPct,
        sentencePct(ct.childPovertyPct, n.childPovertyPct, {
          subject: "this neighborhood's child poverty rate",
        }),
      ),
    },
    {
      key: "median_income",
      label: "of CT Median Household income",
      value:
        n.medianIncomeValue != null && ct.medianIncomeValue
          ? `${Math.round((n.medianIncomeValue / ct.medianIncomeValue) * 100)}%`
          : "—",
      raw: n.medianIncomeValue,
      severity: tier(n.medianIncomeValue, 90213, 60000, true),
      note: "This neighborhood's median household income as a share of Connecticut's median.",
      stateAverage: avg(
        fmtUSD(ct.medianIncomeValue),
        ct.medianIncomeValue,
        incomeSentence(n, ct),
      ),
    },
    {
      key: "median_income_usd",
      label: "Median household income",
      value: n.medianIncomeBand ?? fmtUSD(n.medianIncomeValue),
      raw: n.medianIncomeValue,
      severity: tier(n.medianIncomeValue, 90213, 60000, true),
      note: n.medianIncomeBand
        ? "Half of households earn more, half earn less. Reported as an income range for neighborhoods."
        : "Half of households earn more, half earn less.",
      stateAverage: avg(
        fmtUSD(ct.medianIncomeValue),
        ct.medianIncomeValue,
        `The Connecticut median is ${fmtUSD(ct.medianIncomeValue)}; the Hartford median is ${fmtUSD(HARTFORD_TOWN_STATS.medianIncomeValue)}.`,
      ),
    },
    {
      key: "unemployment",
      label: "Unemployment rate",
      value: fmtPct(n.unemploymentPct),
      raw: n.unemploymentPct,
      severity: tier(n.unemploymentPct, 4, 10),
      note: "Share of the labor force currently looking for work.",
      stateAverage: avg(
        fmtPct(ct.unemploymentPct),
        ct.unemploymentPct,
        sentencePct(ct.unemploymentPct, n.unemploymentPct, {
          subject: "joblessness in this neighborhood",
        }),
      ),
    },
    {
      key: "no_hs",
      label: "Adults without a high school diploma",
      value: fmtPct(n.noHsDiplomaPct),
      raw: n.noHsDiplomaPct,
      severity: tier(n.noHsDiplomaPct, 8, 20),
      note: "Share of adults age 25+ who never finished high school.",
      stateAverage: avg(
        fmtPct(ct.noHsDiplomaPct),
        ct.noHsDiplomaPct,
        sentencePct(ct.noHsDiplomaPct, n.noHsDiplomaPct, {
          subject: "the share of adults here without a diploma",
        }),
      ),
    },
    {
      key: "uninsured",
      label: "Uninsured residents",
      value: fmtPct(n.uninsuredPct),
      raw: n.uninsuredPct,
      severity: tier(n.uninsuredPct, 6, 15),
      note: "Share of people of all ages without health insurance.",
      stateAverage: avg(
        fmtPct(ct.uninsuredPct),
        ct.uninsuredPct,
        sentencePct(ct.uninsuredPct, n.uninsuredPct, {
          subject: "the uninsured rate here",
        }),
      ),
    },
    {
      key: "pre1960",
      label: "Old housing (pre-1960)",
      value: fmtPct(n.pre1960Pct, 0),
      raw: n.pre1960Pct,
      severity: tier(n.pre1960Pct, 20, 50),
      note: "Older homes are more likely to contain lead paint.",
      stateAverage: avg(
        fmtPct(ct.pre1960Pct, 0),
        ct.pre1960Pct,
        sentencePct(ct.pre1960Pct, n.pre1960Pct, {
          subject: "the share of pre-1960 housing here",
          decimals: 0,
        }),
      ),
    },
    {
      key: "severe_rent",
      label: "Severe rent burden",
      value: fmtPct(n.severeRentPct),
      raw: n.severeRentPct,
      severity: tier(n.severeRentPct, 15, 30),
      note: "Renters spending more than half of their income on rent.",
      stateAverage: avg(
        fmtPct(ct.severeRentPct),
        ct.severeRentPct,
        sentencePct(ct.severeRentPct, n.severeRentPct, {
          subject: "the share of severely rent-burdened renters here",
        }),
      ),
    },
    {
      key: "renter_share",
      label: "Renter share",
      value: fmtPct(n.rentersPct, 0),
      raw: n.rentersPct,
      severity: "neutral",
      note: "Share of occupied homes that are rented rather than owned.",
      stateAverage: avg(
        fmtPct(ct.rentersPct, 0),
        ct.rentersPct,
        sentencePct(ct.rentersPct, n.rentersPct, {
          subject: "the renter share here",
          decimals: 0,
        }),
      ),
    },
  ];

  return { name: n.name, population: n.populationCount, indicators };
}
