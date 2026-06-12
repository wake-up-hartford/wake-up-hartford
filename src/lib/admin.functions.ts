import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const GrantAdminInput = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email").max(320),
});
const RevokeAdminInput = z.object({
  userId: z.string().uuid("userId must be a UUID"),
});
const DeleteUserInput = z.object({
  userId: z.string().uuid("userId must be a UUID"),
});

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

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
    return { isAdmin: !!data, userId };
  });

export const listSignedUpUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, first_name, last_name, created_at")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);

    const emails = new Map<string, string>();
    let page = 1;
    while (page < 20) {
      const { data: u } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      for (const user of u?.users ?? []) emails.set(user.id, user.email ?? "");
      if (!u || u.users.length < 1000) break;
      page += 1;
    }

    return {
      users: (profiles ?? []).map((p) => ({
        id: p.id,
        name:
          [p.first_name, p.last_name].filter(Boolean).join(" ") || "—",
        email: emails.get(p.id) ?? "",
        createdAt: p.created_at,
      })),
    };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => DeleteUserInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    if (data.userId === context.userId) {
      throw new Error("You can't delete your own account.");
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listSurveyResponses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
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
    await assertAdmin(context.userId);

    const [profiles, intake, plans, steps, survey, appSurvey, events] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, created_at, phone"),
      supabaseAdmin.from("intake_responses").select("id, user_id, created_at, tract_fips"),
      supabaseAdmin.from("stabilization_plans").select("id, user_id, generated_at, status"),
      supabaseAdmin.from("plan_steps").select("id, user_id, completed_at"),
      supabaseAdmin.from("survey_responses").select("id, user_id, helpfulness, progress, barrier, created_at"),
      supabaseAdmin.from("app_usage_survey_responses").select("id, user_id, created_at"),
      supabaseAdmin.from("user_events").select("user_id, event_name"),
    ]);

    const phoneUsers = new Set<string>(
      (profiles.data ?? []).filter((p) => p.phone && p.phone.trim()).map((p) => p.id),
    );


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
      funnel: (() => {
        const signedUp = new Set((profiles.data ?? []).map((p) => p.id));
        const uniqueByEvent = (name: string) =>
          new Set((events.data ?? []).filter((e) => e.event_name === name).map((e) => e.user_id));
        const neighborhoodAddress = uniqueByEvent("neighborhood_address_submit");
        const neighborhoodMap = uniqueByEvent("neighborhood_map_tract_click");
        const homeAddress = uniqueByEvent("home_address_submit");
        const homeMap = uniqueByEvent("home_map_address_click");
        const lifeSurveyStart = uniqueByEvent("life_survey_start");
        const intakeCompleted = new Set((intake.data ?? []).map((i) => i.user_id));
        const planGenerated = new Set((plans.data ?? []).map((p) => p.user_id));
        const stepsByUser = new Map<string, { total: number; done: number }>();
        for (const s of steps.data ?? []) {
          const cur = stepsByUser.get(s.user_id) ?? { total: 0, done: 0 };
          cur.total += 1;
          if (s.completed_at) cur.done += 1;
          stepsByUser.set(s.user_id, cur);
        }
        const startedStep = new Set(
          Array.from(stepsByUser.entries()).filter(([, v]) => v.done > 0).map(([k]) => k),
        );
        const completedAll = new Set(
          Array.from(stepsByUser.entries())
            .filter(([, v]) => v.total > 0 && v.done === v.total)
            .map(([k]) => k),
        );
        return [
          { label: "Signed up", count: signedUp.size },
          { label: "Entered Phone # in profile", count: Array.from(phoneUsers).filter((id) => signedUp.has(id)).length },
          { label: "Entered address in Neighborhood Lookup", count: neighborhoodAddress.size },
          { label: "Clicked a tract on Neighborhood map", count: neighborhoodMap.size },
          { label: "Entered address in Your Home Lookup", count: homeAddress.size },
          { label: "Clicked an address on Your Home map", count: homeMap.size },
          { label: "Started Life Survey", count: lifeSurveyStart.size },
          { label: "Completed Life Survey", count: intakeCompleted.size },
          { label: "Plan generated", count: planGenerated.size, baseLabel: "Completed Life Survey" },
          { label: "Started a step", count: startedStep.size, baseLabel: "Completed Life Survey" },
          { label: "Completed all steps", count: completedAll.size, baseLabel: "Completed Life Survey" },
        ];

      })(),
    };
  });

// ----- Admin management -----

async function findUserByEmail(email: string): Promise<{ id: string; email: string } | null> {
  const target = email.trim().toLowerCase();
  let page = 1;
  const perPage = 1000;
  while (page < 20) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);
    const match = (data?.users ?? []).find((u) => (u.email ?? "").toLowerCase() === target);
    if (match) return { id: match.id, email: match.email ?? "" };
    if (!data || data.users.length < perPage) return null;
    page += 1;
  }
  return null;
}

export const listAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data: roles, error } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, created_at")
      .eq("role", "admin")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    const ids = (roles ?? []).map((r) => r.user_id);
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

    // Fetch emails via admin auth listing (single page for typical scale)
    const emails = new Map<string, string>();
    let page = 1;
    while (page < 20) {
      const { data: u } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      for (const user of u?.users ?? []) emails.set(user.id, user.email ?? "");
      if (!u || u.users.length < 1000) break;
      page += 1;
    }

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    return {
      admins: (roles ?? []).map((r) => {
        const p = profileMap.get(r.user_id);
        const name =
          [p?.first_name, p?.last_name].filter(Boolean).join(" ") || "—";
        return {
          userId: r.user_id,
          createdAt: r.created_at,
          email: emails.get(r.user_id) ?? "",
          name,
          isSelf: r.user_id === context.userId,
        };
      }),
    };
  });

export const grantAdminByEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => GrantAdminInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const user = await findUserByEmail(data.email);
    if (!user) {
      throw new Error(
        `No account found for ${data.email}. Ask them to sign up first, then invite again.`,
      );
    }
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: user.id, role: "admin" });
    if (error && !/duplicate|unique/i.test(error.message)) {
      throw new Error(error.message);
    }
    return { ok: true, userId: user.id, email: user.email };
  });

export const revokeAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => RevokeAdminInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    if (data.userId === context.userId) {
      throw new Error("You can't revoke your own admin access.");
    }
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", "admin");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ----- Reporting -----

export const getReportingData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);

    const sinceDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const [profiles, intake, plans, steps] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, created_at, language_pref, sms_alerts"),
      supabaseAdmin
        .from("intake_responses")
        .select("id, created_at, tract_fips"),
      supabaseAdmin
        .from("stabilization_plans")
        .select("id, generated_at"),
      supabaseAdmin
        .from("plan_steps")
        .select("id, completed_at, resource_id"),
    ]);

    const dayKey = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : null);
    const bucket = (
      rows: Array<{ created_at?: string | null; generated_at?: string | null; completed_at?: string | null }> | null,
      field: "created_at" | "generated_at" | "completed_at",
    ) => {
      const m: Record<string, number> = {};
      for (const r of rows ?? []) {
        const v = (r as Record<string, string | null>)[field];
        if (!v) continue;
        if (new Date(v) < new Date(sinceDate)) continue;
        const k = dayKey(v);
        if (k) m[k] = (m[k] ?? 0) + 1;
      }
      return m;
    };

    const signups = bucket(profiles.data, "created_at");
    const intakes = bucket(intake.data, "created_at");
    const plansBucket = bucket(plans.data, "generated_at");
    const stepsDone = bucket(steps.data, "completed_at");

    const allDates = new Set<string>([
      ...Object.keys(signups),
      ...Object.keys(intakes),
      ...Object.keys(plansBucket),
      ...Object.keys(stepsDone),
    ]);
    const series = Array.from(allDates)
      .sort()
      .map((date) => ({
        date,
        signups: signups[date] ?? 0,
        intakes: intakes[date] ?? 0,
        plans: plansBucket[date] ?? 0,
        stepsCompleted: stepsDone[date] ?? 0,
      }));

    // Geographic
    const tractCounts: Record<string, number> = {};
    for (const r of intake.data ?? []) {
      if (!r.tract_fips) continue;
      tractCounts[r.tract_fips] = (tractCounts[r.tract_fips] ?? 0) + 1;
    }
    const geo = Object.entries(tractCounts)
      .map(([tract_fips, count]) => ({ tract_fips, count }))
      .sort((a, b) => b.count - a.count);

    // Language
    const language: Record<string, number> = {};
    let smsOptIn = 0;
    for (const p of profiles.data ?? []) {
      const lang = p.language_pref ?? "en";
      language[lang] = (language[lang] ?? 0) + 1;
      if (p.sms_alerts) smsOptIn += 1;
    }

    // Resource engagement
    const resourceCounts: Record<string, number> = {};
    for (const s of steps.data ?? []) {
      if (!s.resource_id) continue;
      resourceCounts[s.resource_id] = (resourceCounts[s.resource_id] ?? 0) + 1;
    }
    const resources = Object.entries(resourceCounts)
      .map(([resource_id, count]) => ({ resource_id, count }))
      .sort((a, b) => b.count - a.count);

    return {
      series,
      geo,
      language,
      smsOptIn,
      totalProfiles: profiles.data?.length ?? 0,
      resources,
    };
  });
