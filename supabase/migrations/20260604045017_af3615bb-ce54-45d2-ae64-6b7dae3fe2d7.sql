CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS TABLE(plans_this_month bigint, assessments_this_month bigint, plans_all_time bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT count(*) FROM public.stabilization_plans WHERE generated_at >= date_trunc('month', now())),
    (SELECT count(*) FROM public.intake_responses WHERE created_at >= date_trunc('month', now())),
    (SELECT count(*) FROM public.stabilization_plans);
$$;

GRANT EXECUTE ON FUNCTION public.get_public_stats() TO anon, authenticated;