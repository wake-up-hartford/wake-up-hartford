-- The live database got these permissions from Supabase's old automatic
-- defaults, which no migration recorded, so new projects lack them.
-- Row-level security policies still limit every user to their own rows.

-- Signed-in users and guests (anonymous sign-ins use this role too):
-- only what the app does with each table.
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT ON public.intake_responses TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.stabilization_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_steps TO authenticated;

-- Server code (admin pages, guest-plan transfer), matching the other tables.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.intake_responses TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stabilization_plans TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_steps TO service_role;
