CREATE TABLE public.survey_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  helpfulness integer NOT NULL,
  progress text NOT NULL,
  barrier text NOT NULL,
  other_text text,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT helpfulness_range CHECK (helpfulness BETWEEN 1 AND 5)
);

GRANT SELECT, INSERT ON public.survey_responses TO authenticated;
GRANT ALL ON public.survey_responses TO service_role;

ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own survey select" ON public.survey_responses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "own survey insert" ON public.survey_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_survey_responses_user ON public.survey_responses(user_id, created_at DESC);