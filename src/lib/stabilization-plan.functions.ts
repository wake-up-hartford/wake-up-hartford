import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import resources from "@/data/ct-resources.json";

type Resource = (typeof resources)[number];

const DOMAIN_KEYS = [
  "housing",
  "food",
  "health",
  "income",
  "childcare",
  "transportation",
  "legal",
  "social",
] as const;

const ScoreSchema = z.object({
  scores: z.record(z.string(), z.enum(["high", "moderate", "stable"])),
  priorities: z.array(z.string()).default([]),
});

const FollowupSchema = z.object({
  adults: z.number().int().min(1).max(20).default(1),
  children: z.number().int().min(0).max(20).default(0),
  hoursPerWeek: z.number().int().min(1).max(40).default(5),
  transport: z.enum(["car", "bus", "walking", "none"]).default("bus"),
  language: z.string().default("en"),
  benefits: z.array(z.string()).default([]),
  worry: z.string().max(280).default(""),
  county: z.string().default("Hartford"),
});

const Input = z.object({
  survey: ScoreSchema,
  followup: FollowupSchema,
  tractFips: z.string().optional(),
});

const PlanStep = z.object({
  domain: z.string(),
  title: z.string(),
  detail: z.string(),
  resource_id: z.string().nullable().optional(),
  est_time_minutes: z.number().int().min(5).max(240).optional(),
});

const PlanWeek = z.object({
  week: z.number().int().min(1).max(4),
  focus: z.string(),
  steps: z.array(PlanStep).min(1).max(5),
});

const PlanShape = z.object({
  priority_summary: z.string(),
  crisis_flags: z.array(z.object({ note: z.string(), hotline: z.string() })).default([]),
  weeks: z.array(PlanWeek).length(4),
});

function pickResourcesFor(survey: z.infer<typeof ScoreSchema>, followup: z.infer<typeof FollowupSchema>): Resource[] {
  const reds = new Set<string>();
  for (const k of DOMAIN_KEYS) {
    const s = survey.scores[k];
    if (s === "high" || s === "moderate") reds.add(k);
  }
  // Always include general 211 + safety
  const picked: Resource[] = [];
  for (const r of resources as Resource[]) {
    if (r.domain === "general") picked.push(r);
    else if (reds.has(r.domain)) {
      // prefer county match or statewide
      const c = r.county?.toLowerCase() ?? "";
      if (c === "all" || c.includes(followup.county.toLowerCase())) picked.push(r);
    }
  }
  // Cap to keep prompt small
  return picked.slice(0, 30);
}

const SYSTEM_PROMPT = `You are a trauma-informed community navigator helping a Connecticut resident build a realistic 30-day stabilization plan. Write at a 6th-grade reading level. Be warm, never preachy, never shame. Use "you can" not "you must". Never promise outcomes. If the user reports a crisis (eviction in <7 days, no food today, domestic violence, suicide risk), put it in crisis_flags with the right hotline at the top.

Plan structure rules:
- 4 weeks. Week 1 = most urgent / quickest wins. Week 4 = longer-term setup.
- Each week 2–4 steps, sized to the user's available hours per week.
- Every step MUST set resource_id to an id from the provided RESOURCES list, OR null if it's a personal task (e.g. "gather your documents"). NEVER invent resource ids or phone numbers.
- Respect transportation: don't send someone with no car to an in-person office across the state.
- Respect language: prefer resources matching the user's language.
- Don't suggest benefits the user already has.
- Cover the user's red/yellow domains first.`;

export const generateStabilizationPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway not configured");

    const picked = pickResourcesFor(data.survey, data.followup);
    const resourceList = picked.map((r) => ({
      id: r.id,
      name: r.name,
      domain: r.domain,
      services: r.services,
      phone: r.phone,
      town: r.town,
      languages: r.languages,
      eligibility: r.eligibility_notes,
    }));

    const userPrompt = `SURVEY RESULTS (per domain): ${JSON.stringify(data.survey.scores)}
USER STATED PRIORITIES: ${data.survey.priorities.join("; ") || "(none stated)"}
HOUSEHOLD: ${data.followup.adults} adult(s), ${data.followup.children} child(ren)
HOURS PER WEEK AVAILABLE: ${data.followup.hoursPerWeek}
TRANSPORTATION: ${data.followup.transport}
LANGUAGE: ${data.followup.language}
ALREADY ENROLLED: ${data.followup.benefits.join(", ") || "none reported"}
BIGGEST WORRY: ${data.followup.worry || "(not stated)"}
COUNTY: ${data.followup.county}

RESOURCES (pick resource_id values ONLY from this list):
${JSON.stringify(resourceList, null, 2)}

Generate the 30-day plan as JSON matching this shape:
{
  "priority_summary": "3-4 plain sentences",
  "crisis_flags": [{"note": "...", "hotline": "..."}],
  "weeks": [
    {"week": 1, "focus": "...", "steps": [{"domain": "housing", "title": "...", "detail": "...", "resource_id": "uniteCT-rentalhelp", "est_time_minutes": 45}]},
    {"week": 2, ...},
    {"week": 3, ...},
    {"week": 4, ...}
  ]
}
Return ONLY valid JSON, no markdown.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error("AI gateway error", aiRes.status, txt);
      if (aiRes.status === 429) throw new Error("Too many requests — please try again in a minute.");
      if (aiRes.status === 402) throw new Error("AI credits exhausted — contact the site admin.");
      throw new Error("Couldn't generate plan. Please try again.");
    }
    const aiJson = await aiRes.json();
    const raw = aiJson?.choices?.[0]?.message?.content;
    if (!raw) throw new Error("AI returned an empty plan.");

    let parsed: z.infer<typeof PlanShape>;
    try {
      parsed = PlanShape.parse(JSON.parse(raw));
    } catch (e) {
      console.error("Plan parse failed", e, raw);
      throw new Error("AI returned an invalid plan. Try again.");
    }

    // Save intake
    const { data: intake, error: intakeErr } = await supabase
      .from("intake_responses")
      .insert({
        user_id: userId,
        survey_scores: data.survey,
        followup: data.followup,
        tract_fips: data.tractFips ?? null,
      })
      .select("id")
      .single();
    if (intakeErr || !intake) throw new Error("Couldn't save your responses.");

    // Save plan
    const { data: plan, error: planErr } = await supabase
      .from("stabilization_plans")
      .insert({
        user_id: userId,
        intake_id: intake.id,
        plan: parsed,
      })
      .select("id")
      .single();
    if (planErr || !plan) throw new Error("Couldn't save your plan.");

    // Save steps (denormalized for fast checkboxes)
    const stepRows = parsed.weeks.flatMap((w) =>
      w.steps.map((s, i) => ({
        plan_id: plan.id,
        user_id: userId,
        week: w.week,
        domain: s.domain,
        title: s.title,
        detail: s.detail ?? null,
        resource_id: s.resource_id ?? null,
        step_order: i,
      })),
    );
    if (stepRows.length > 0) {
      const { error: stepsErr } = await supabase.from("plan_steps").insert(stepRows);
      if (stepsErr) console.error("Step insert failed", stepsErr);
    }

    return { planId: plan.id };
  });

export const getPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ planId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: plan, error } = await supabase
      .from("stabilization_plans")
      .select("id, plan, generated_at, status")
      .eq("id", data.planId)
      .single();
    if (error || !plan) throw new Error("Plan not found.");

    const { data: steps } = await supabase
      .from("plan_steps")
      .select("id, week, domain, title, detail, resource_id, step_order, completed_at")
      .eq("plan_id", data.planId)
      .order("week")
      .order("step_order");

    return { plan, steps: steps ?? [] };
  });

export const toggleStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ stepId: z.string().uuid(), done: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("plan_steps")
      .update({ completed_at: data.done ? new Date().toISOString() : null })
      .eq("id", data.stepId);
    if (error) throw new Error("Couldn't update step.");
    return { ok: true };
  });

export const listMyPlans = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("stabilization_plans")
      .select("id, generated_at, status, plan")
      .order("generated_at", { ascending: false });
    if (error) throw new Error("Couldn't load plans.");
    return {
      plans: (data ?? []).map((p) => ({
        id: p.id,
        generated_at: p.generated_at,
        status: p.status,
        summary: (p.plan as { priority_summary?: string })?.priority_summary ?? "",
      })),
    };
  });
