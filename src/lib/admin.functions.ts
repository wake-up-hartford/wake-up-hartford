import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data, error } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { isAdmin: !!data };
  });

export const listSurveyResponses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden");

    const { data, error } = await supabaseAdmin
      .from("app_usage_survey_responses")
      .select("id, user_id, created_at, most_used, ease, tech_issue, prompt, feature_awareness, comment")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    return { responses: data ?? [] };
  });

export const getUsageStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden");

    const [profiles, intake, plans, steps, survey, appSurvey] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, created_at"),
      supabaseAdmin.from("intake_responses").select("id, user_id, created_at"),
      supabaseAdmin.from("stabilization_plans").select("id, user_id, generated_at, status"),
      supabaseAdmin.from("plan_steps").select("id, user_id, completed_at"),
      supabaseAdmin.from("survey_responses").select("id, user_id, helpfulness, progress, barrier, created_at"),
      supabaseAdmin.from("app_usage_survey_responses").select("id, user_id, created_at"),
    ]);

    const completedSteps = (steps.data ?? []).filter((s) => s.completed_at).length;
    const totalSteps = steps.data?.length ?? 0;
    const uniqueAppRespondents = new Set((appSurvey.data ?? []).map((r) => r.user_id)).size;
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const since = (rows: Array<{ created_at?: string | null }> | null | undefined, ms: number) =>
      (rows ?? []).filter((r) => r.created_at && now - new Date(r.created_at).getTime() <= ms).length;

    const helpfulnessVals = (survey.data ?? [])
      .map((s) => s.helpfulness)
      .filter((n): n is number => typeof n === "number");
    const avgHelpfulness = helpfulnessVals.length
      ? helpfulnessVals.reduce((a, b) => a + b, 0) / helpfulnessVals.length
      : null;

    const barrierCounts: Record<string, number> = {};
    const progressCounts: Record<string, number> = {};
    for (const s of survey.data ?? []) {
      if (s.barrier) barrierCounts[s.barrier] = (barrierCounts[s.barrier] ?? 0) + 1;
      if (s.progress) progressCounts[s.progress] = (progressCounts[s.progress] ?? 0) + 1;
    }

    return {
      totals: {
        users: profiles.data?.length ?? 0,
        intakeResponses: intake.data?.length ?? 0,
        plansGenerated: plans.data?.length ?? 0,
        activePlans: (plans.data ?? []).filter((p) => p.status === "active").length,
        totalSteps,
        completedSteps,
        stepCompletionRate: totalSteps ? completedSteps / totalSteps : 0,
        appSurveyResponses: appSurvey.data?.length ?? 0,
        uniqueAppRespondents,
        progressSurveys: survey.data?.length ?? 0,
        avgHelpfulness,
      },
      recent: {
        newUsers7d: since(profiles.data, 7 * day),
        newUsers30d: since(profiles.data, 30 * day),
        intake7d: since(intake.data, 7 * day),
        plans7d: since((plans.data ?? []).map((p) => ({ created_at: p.generated_at })), 7 * day),
        appSurvey7d: since(appSurvey.data, 7 * day),
      },
      barrierCounts,
      progressCounts,
    };
  });

