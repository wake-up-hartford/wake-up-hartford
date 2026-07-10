import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CENSUS_GEOCODER_BATCH = "https://geocoding.geo.census.gov/geocoder/geographies/addressbatch";
const BATCH_SIZE = 5000;

export type CoverageSummary = {
  total: number;
  withTract: number;
  distinctTracts: number;
};

export const getCoverageSummary = createServerFn({ method: "GET" }).handler(
  async (): Promise<CoverageSummary> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count: total } = await supabaseAdmin
      .from("hartford_addresses")
      .select("*", { count: "exact", head: true });

    const { count: withTract } = await supabaseAdmin
      .from("hartford_addresses")
      .select("*", { count: "exact", head: true })
      .not("census_tract", "is", null);

    const { data: tractRows } = await supabaseAdmin
      .from("hartford_addresses")
      .select("census_tract")
      .not("census_tract", "is", null);

    const tracts = new Set(tractRows?.map((r) => r.census_tract).filter(Boolean));

    return {
      total: total ?? 0,
      withTract: withTract ?? 0,
      distinctTracts: tracts.size,
    };
  },
);

export type RefreshResult = {
  processed: number;
  matched: number;
  remaining: number;
};

export const refreshCensusTracts = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ batchSize: z.number().min(1).max(BATCH_SIZE).optional() }).default({ batchSize: BATCH_SIZE }).parse(input),
  )
  .handler(async ({ data }): Promise<RefreshResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows } = await supabaseAdmin
      .from("hartford_addresses")
      .select("norm_address, display_address")
      .is("census_tract", null)
      .limit(data.batchSize);

    if (!rows || rows.length === 0) {
      const { count: remaining } = await supabaseAdmin
        .from("hartford_addresses")
        .select("*", { count: "exact", head: true })
        .is("census_tract", null);
      return { processed: 0, matched: 0, remaining: remaining ?? 0 };
    }

    const csv = buildBatchCsv(rows);

    const form = new FormData();
    form.append("addressFile", new Blob([csv], { type: "text/csv" }), "addresses.csv");
    form.append("benchmark", "Public_AR_Current");
    form.append("vintage", "Current_Current");

    const res = await fetch(CENSUS_GEOCODER_BATCH, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      throw new Error(`Census geocoder failed: ${res.status} ${res.statusText}`);
    }

    const text = await res.text();
    const updates = parseBatchResponse(text);

    let matched = 0;
    for (const [normAddress, tract] of updates) {
      const { error } = await supabaseAdmin
        .from("hartford_addresses")
        .update({ census_tract: tract })
        .eq("norm_address", normAddress);

      if (!error) {
        matched++;
      } else {
        console.error("Failed to update census tract for", normAddress, error);
      }
    }

    const { count: remaining } = await supabaseAdmin
      .from("hartford_addresses")
      .select("*", { count: "exact", head: true })
      .is("census_tract", null);

    return {
      processed: rows.length,
      matched,
      remaining: remaining ?? 0,
    };
  });

function buildBatchCsv(rows: { norm_address: string; display_address: string }[]): string {
  const header = "id,street address,city,state,zip";
  const lines = rows.map((r) => {
    const id = r.norm_address.replace(/,/g, "");
    const street = r.display_address.replace(/"/g, '""');
    return `${id},"${street}",Hartford,CT,`;
  });
  return [header, ...lines].join("\n");
}

function parseBatchResponse(text: string): Map<string, string> {
  const updates = new Map<string, string>();
  const lines = parseCsvLines(text);

  for (const row of lines) {
    if (row.length < 12) continue;
    const id = row[0];
    const matchStatus = row[2];
    if (matchStatus !== "Match") continue;
    const tract = row[10]; // TRACT column
    if (!id || !tract) continue;
    updates.set(id, tract);
  }

  return updates;
}

function parseCsvLines(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        current.push(field);
        field = "";
      } else if (char === '\n') {
        current.push(field);
        rows.push(current);
        current = [];
        field = "";
      } else if (char === '\r') {
        // ignore carriage return, handle newline next
      } else {
        field += char;
      }
    }
  }

  if (field || current.length > 0) {
    current.push(field);
    rows.push(current);
  }

  return rows;
}
