
CREATE TABLE public.app_usage_survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  frequency text NOT NULL,
  device text NOT NULL,
  most_used text NOT NULL,
  ease integer NOT NULL CHECK (ease BETWEEN 1 AND 5),
  tech_issue text NOT NULL,
  prompt text NOT NULL,
  feature_awareness text,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.app_usage_survey_responses TO authenticated;
GRANT ALL ON public.app_usage_survey_responses TO service_role;

ALTER TABLE public.app_usage_survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own app usage survey select"
ON public.app_usage_survey_responses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "own app usage survey insert"
ON public.app_usage_survey_responses FOR INSERT
WITH CHECK (auth.uid() = user_id);
