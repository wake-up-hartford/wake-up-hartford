import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { normalizeAddress } from "@/lib/normalize-address";

export { normalizeAddress };

function fmtDate(d: string | null | undefined): string {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

export type LookupResult =
  | { status: "not_found"; query: string; normalized: string }
  | {
      status: "found";
      address: { display: string; normalized: string; owner: string | null };
      counts: {
        violationsOpen: number;
        violationsClosed12mo: number;
        complaints12mo: number;
        topComplaintType: string | null;
      };
      recentViolations: { date: string; description: string; status: "Open" | "Closed" }[];
      recent311: { date: string; type: string }[];
      portfolio: {
        propertiesInHartford: number;
        totalOpenViolations: number;
        totalComplaints12mo: number;
      } | null;
    };

export const lookupHartfordAddress = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ query: z.string().min(1) }).parse(input))
  .handler(async ({ data }): Promise<LookupResult> => {
    const normalized = normalizeAddress(data.query);
    if (!normalized) return { status: "not_found", query: data.query, normalized: "" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: addr } = await supabaseAdmin
      .from("hartford_addresses")
      .select("norm_address, display_address, owner_name")
      .eq("norm_address", normalized)
      .maybeSingle();

    if (!addr) return { status: "not_found", query: data.query, normalized };

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const cutoff = oneYearAgo.toISOString().slice(0, 10);

    const [openViolRes, closedViolRes, recentViolRes, complaintsRes, recent311Res] =
      await Promise.all([
        supabaseAdmin
          .from("hartford_code_violations")
          .select("id", { count: "exact", head: true })
          .eq("norm_address", normalized)
          .not("status", "ilike", "Closed%"),
        supabaseAdmin
          .from("hartford_code_violations")
          .select("id", { count: "exact", head: true })
          .eq("norm_address", normalized)
          .ilike("status", "Closed%")
          .gte("closed_at", cutoff),
        supabaseAdmin
          .from("hartford_code_violations")
          .select("description, status, opened_at")
          .eq("norm_address", normalized)
          .order("opened_at", { ascending: false, nullsFirst: false })
          .limit(5),
        // Complaint count and top category cover the last 12 months only.
        supabaseAdmin
          .from("hartford_311_complaints")
          .select("type", { count: "exact" })
          .eq("norm_address", normalized)
          .gte("opened_at", cutoff),
        supabaseAdmin
          .from("hartford_311_complaints")
          .select("type, opened_at")
          .eq("norm_address", normalized)
          .order("opened_at", { ascending: false, nullsFirst: false })
          .limit(5),
      ]);

    // top complaint type
    const typeCounts = new Map<string, number>();
    for (const c of complaintsRes.data ?? []) {
      const t = (c.type ?? "").trim();
      if (!t) continue;
      typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1);
    }
    let top: string | null = null;
    let topN = 0;
    for (const [t, n] of typeCounts) if (n > topN) { top = t; topN = n; }

    // Portfolio rollup
    type Portfolio = { propertiesInHartford: number; totalOpenViolations: number; totalComplaints12mo: number };
    let portfolio: Portfolio | null = null;
    if (addr.owner_name) {
      const { data: ownerAddrs } = await supabaseAdmin
        .from("hartford_addresses")
        .select("norm_address")
        .eq("owner_name", addr.owner_name);
      const norms = (ownerAddrs ?? []).map((r) => r.norm_address);
      if (norms.length) {
        const [openCt, compCt] = await Promise.all([
          supabaseAdmin
            .from("hartford_code_violations")
            .select("id", { count: "exact", head: true })
            .in("norm_address", norms)
            .not("status", "ilike", "Closed%"),
          supabaseAdmin
            .from("hartford_311_complaints")
            .select("id", { count: "exact", head: true })
            .in("norm_address", norms)
            .gte("opened_at", cutoff),
        ]);
        portfolio = {
          propertiesInHartford: norms.length,
          totalOpenViolations: openCt.count ?? 0,
          totalComplaints12mo: compCt.count ?? 0,
        };
      }
    }

    return {
      status: "found",
      address: {
        display: addr.display_address,
        normalized: addr.norm_address,
        owner: addr.owner_name,
      },
      counts: {
        violationsOpen: openViolRes.count ?? 0,
        violationsClosed12mo: closedViolRes.count ?? 0,
        complaints12mo: complaintsRes.count ?? 0,
        topComplaintType: top,
      },
      recentViolations: (recentViolRes.data ?? []).map((v) => ({
        date: fmtDate(v.opened_at),
        description: v.description ?? "",
        status: /closed/i.test(v.status ?? "") ? "Closed" : "Open",
      })),
      recent311: (recent311Res.data ?? []).map((c) => ({
        date: fmtDate(c.opened_at),
        type: c.type ?? "",
      })),
      portfolio,
    };
  });

// What the city data covers: the year of the oldest record and the opening
// date of the newest, for code violations and 311 complaints. The nightly
// refresh moves these on, and the Your Home page shows them to residents.
export type CityDataDates = {
  violationsFrom: string;
  violationsThrough: string;
  complaintsFrom: string;
  complaintsThrough: string;
};

export const getCityDataDates = createServerFn({ method: "GET" }).handler(
  async (): Promise<CityDataDates> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const edge = async (
      table: "hartford_code_violations" | "hartford_311_complaints",
      ascending: boolean,
    ) => {
      const { data } = await supabaseAdmin
        .from(table)
        .select("opened_at")
        .not("opened_at", "is", null)
        .order("opened_at", { ascending })
        .limit(1);
      return data?.[0]?.opened_at ?? "";
    };
    const longDate = (d: string) =>
      d
        ? new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            timeZone: "UTC",
          })
        : "";
    const [vFirst, vLast, cFirst, cLast] = await Promise.all([
      edge("hartford_code_violations", true),
      edge("hartford_code_violations", false),
      edge("hartford_311_complaints", true),
      edge("hartford_311_complaints", false),
    ]);
    return {
      violationsFrom: vFirst.slice(0, 4),
      violationsThrough: longDate(vLast),
      complaintsFrom: cFirst.slice(0, 4),
      complaintsThrough: longDate(cLast),
    };
  },
);

export const suggestHartfordAddresses = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ query: z.string() }).parse(input))
  .handler(async ({ data }): Promise<{ display: string; normalized: string }[]> => {
    const q = data.query.trim();
    if (q.length < 2) return [];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const norm = normalizeAddress(q);
    const tokens = norm.split(" ").filter(Boolean);
    if (tokens.length === 0) return [];

    // Use prefix match on normalized address for fast, intuitive ordering.
    // Fall back to ilike for partial street name matches.
    let query = supabaseAdmin
      .from("hartford_addresses")
      .select("norm_address, display_address")
      .ilike("norm_address", `${norm}%`)
      .order("norm_address", { ascending: true })
      .limit(8);

    let { data: rows } = await query;

    if (!rows || rows.length === 0) {
      // Try contains match (for typing street name without number)
      const res = await supabaseAdmin
        .from("hartford_addresses")
        .select("norm_address, display_address")
        .ilike("norm_address", `%${norm}%`)
        .order("norm_address", { ascending: true })
        .limit(8);
      rows = res.data ?? [];
    }

    return (rows ?? []).map((r) => ({
      display: r.display_address,
      normalized: r.norm_address,
    }));
  });
