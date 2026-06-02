import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getPublicStats = createServerFn({ method: "GET" }).handler(async () => {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  const monthStart = start.toISOString();

  const [plansMonth, intakesMonth, plansTotal] = await Promise.all([
    supabaseAdmin
      .from("stabilization_plans")
      .select("id", { count: "exact", head: true })
      .gte("generated_at", monthStart),
    supabaseAdmin
      .from("intake_responses")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStart),
    supabaseAdmin
      .from("stabilization_plans")
      .select("id", { count: "exact", head: true }),
  ]);

  return {
    plansThisMonth: plansMonth.count ?? 0,
    assessmentsThisMonth: intakesMonth.count ?? 0,
    plansAllTime: plansTotal.count ?? 0,
  };
});
