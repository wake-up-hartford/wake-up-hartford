import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PROGRESS = ["better", "same", "worse", "too_early"] as const;
const BARRIER = ["housing_money", "health_stress", "time", "next_step", "on_track", "other"] as const;

const SubmitInput = z.object({
  helpfulness: z.number().int().min(1).max(5),
  progress: z.enum(PROGRESS),
  barrier: z.enum(BARRIER),
  other_text: z.string().trim().max(500).optional().nullable(),
  comment: z.string().trim().max(2000).optional().nullable(),
});

export const submitSurvey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SubmitInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("survey_responses").insert({
      user_id: userId,
      helpfulness: data.helpfulness,
      progress: data.progress,
      barrier: data.barrier,
      other_text: data.other_text?.trim() ? data.other_text.trim() : null,
      comment: data.comment?.trim() ? data.comment.trim() : null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getLastSurvey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("survey_responses")
      .select("id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return { last: data ?? null };
  });
