import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TECH_ISSUE = ["slow", "navigation", "errors", "none"] as const;
const PROMPT = ["reminder", "regular", "referral", "social", "search", "qr", "other"] as const;
const FEATURE = ["plan", "address", "neighborhood", "resource", "none"] as const;

const SubmitInput = z.object({
  ease: z.number().int().min(1).max(5),
  tech_issue: z.enum(TECH_ISSUE),
  prompt: z.enum(PROMPT),
  features_used: z.array(z.enum(FEATURE)).default([]),
  comment: z.string().trim().max(2000).optional().nullable(),
});

export const submitSurvey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SubmitInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("app_usage_survey_responses").insert({
      user_id: userId,
      most_used: "none",
      ease: data.ease,
      tech_issue: data.tech_issue,
      prompt: data.prompt,
      features_used: data.features_used,
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
      .from("app_usage_survey_responses")
      .select("id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return { last: data ?? null };
  });
