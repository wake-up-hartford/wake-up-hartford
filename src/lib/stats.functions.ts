import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Anon client for the public endpoint — RLS applies. No service-role key here.
let _anon: ReturnType<typeof createClient<Database>> | undefined;
function getAnonClient() {
  if (_anon) return _anon;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase env not configured");
  _anon = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _anon;
}

export const getPublicStats = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getAnonClient();
  // Calls a SECURITY DEFINER RPC that returns ONLY aggregate counts.
  const { data, error } = await supabase.rpc("get_public_stats").single();
  if (error || !data) {
    console.error("get_public_stats RPC failed", error);
    return { plansThisMonth: 0, assessmentsThisMonth: 0, plansAllTime: 0 };
  }
  return {
    plansThisMonth: Number(data.plans_this_month ?? 0),
    assessmentsThisMonth: Number(data.assessments_this_month ?? 0),
    plansAllTime: Number(data.plans_all_time ?? 0),
  };
});
