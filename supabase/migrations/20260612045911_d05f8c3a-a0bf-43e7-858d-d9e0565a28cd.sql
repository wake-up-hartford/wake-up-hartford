TRUNCATE TABLE public.app_usage_survey_responses;
ALTER TABLE public.app_usage_survey_responses DROP COLUMN IF EXISTS feature_awareness;
ALTER TABLE public.app_usage_survey_responses ADD COLUMN IF NOT EXISTS features_used text[] NOT NULL DEFAULT '{}';