import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const BATCH_SIZE = 25;

export type CoverageSummary = {
  total: number;
  withNeighborhood: number;
  distinctNeighborhoods: number;
};

export const getCoverageSummary = createServerFn({ method: "GET" }).handler(
  async (): Promise<CoverageSummary> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count: total } = await supabaseAdmin
      .from("hartford_addresses")
      .select("*", { count: "exact", head: true });

    const { count: withNeighborhood } = await supabaseAdmin
      .from("hartford_addresses")
      .select("*", { count: "exact", head: true })
      .not("neighborhood", "is", null);

    const { data: rows } = await supabaseAdmin
      .from("hartford_addresses")
      .select("neighborhood")
      .not("neighborhood", "is", null);

    const set = new Set(rows?.map((r) => r.neighborhood).filter(Boolean));

    return {
      total: total ?? 0,
      withNeighborhood: withNeighborhood ?? 0,
      distinctNeighborhoods: set.size,
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
    z.object({ batchSize: z.number().min(1).max(100).default(BATCH_SIZE).optional() }).parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<RefreshResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const batchSize = data.batchSize ?? BATCH_SIZE;

    const { data: rows } = await supabaseAdmin
      .from("hartford_addresses")
      .select("norm_address, display_address")
      .is("neighborhood", null)
      .limit(batchSize);

    if (!rows || rows.length === 0) {
      return { processed: 0, matched: 0, remaining: 0 };
    }

    let matched = 0;
    for (const row of rows) {
      try {
        const url = new URL(NOMINATIM_URL);
        url.searchParams.set("street", row.display_address);
        url.searchParams.set("city", "Hartford");
        url.searchParams.set("state", "CT");
        url.searchParams.set("country", "USA");
        url.searchParams.set("format", "json");
        url.searchParams.set("addressdetails", "1");
        url.searchParams.set("limit", "1");

        const res = await fetch(url.toString(), {
          headers: { "User-Agent": "WakeUpHartford/1.0 (coverage-mapper)" },
        });
        if (!res.ok) continue;
        const json = (await res.json()) as Array<{
          address?: { neighbourhood?: string; suburb?: string; quarter?: string; city_district?: string };
        }>;
        const addr = json[0]?.address;
        const neighborhood =
          addr?.neighbourhood || addr?.suburb || addr?.quarter || addr?.city_district || null;

        if (neighborhood) {
          const { error } = await supabaseAdmin
            .from("hartford_addresses")
            .update({ neighborhood })
            .eq("norm_address", row.norm_address);
          if (!error) matched++;
        }
      } catch (e) {
        console.error("Nominatim lookup failed for", row.display_address, e);
      }
      // Nominatim usage policy: max 1 req/sec
      await new Promise((r) => setTimeout(r, 1100));
    }

    const { count: remaining } = await supabaseAdmin
      .from("hartford_addresses")
      .select("*", { count: "exact", head: true })
      .is("neighborhood", null);

    return {
      processed: rows.length,
      matched,
      remaining: remaining ?? 0,
    };
  });
