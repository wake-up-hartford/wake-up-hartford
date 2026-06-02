import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, display_name, language_pref, sms_alerts")
      .eq("id", userId)
      .maybeSingle();

    const [plansRes, intakesRes] = await Promise.all([
      supabase
        .from("stabilization_plans")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("intake_responses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
    ]);

    return {
      profile: profile ?? { id: userId, display_name: null, language_pref: "en", sms_alerts: false },
      stats: {
        plans: plansRes.count ?? 0,
        assessments: intakesRes.count ?? 0,
      },
    };
  });

const UpdateInput = z.object({
  display_name: z.string().trim().min(1).max(100),
  language_pref: z.string().trim().min(2).max(10),
  sms_alerts: z.boolean().optional(),
});

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        display_name: data.display_name,
        language_pref: data.language_pref,
        updated_at: new Date().toISOString(),
      });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
