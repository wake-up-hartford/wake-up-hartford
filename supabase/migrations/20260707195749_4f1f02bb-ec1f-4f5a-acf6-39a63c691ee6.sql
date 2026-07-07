ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS street_address text,
  ADD COLUMN IF NOT EXISTS zip_code text;