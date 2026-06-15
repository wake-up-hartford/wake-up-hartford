
CREATE TABLE public.hartford_addresses (
  norm_address text PRIMARY KEY,
  display_address text NOT NULL,
  owner_name text
);
GRANT SELECT ON public.hartford_addresses TO anon, authenticated;
GRANT ALL ON public.hartford_addresses TO service_role;
ALTER TABLE public.hartford_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read addresses" ON public.hartford_addresses FOR SELECT USING (true);

CREATE TABLE public.hartford_code_violations (
  id bigserial PRIMARY KEY,
  norm_address text NOT NULL REFERENCES public.hartford_addresses(norm_address) ON DELETE CASCADE,
  case_number text,
  description text,
  status text,
  opened_at date,
  closed_at date,
  dept_division text,
  record_type text
);
CREATE INDEX hcv_norm_idx ON public.hartford_code_violations(norm_address);
CREATE INDEX hcv_status_idx ON public.hartford_code_violations(status);
CREATE INDEX hcv_opened_idx ON public.hartford_code_violations(opened_at DESC);
GRANT SELECT ON public.hartford_code_violations TO anon, authenticated;
GRANT ALL ON public.hartford_code_violations TO service_role;
ALTER TABLE public.hartford_code_violations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read violations" ON public.hartford_code_violations FOR SELECT USING (true);

CREATE TABLE public.hartford_311_complaints (
  id bigserial PRIMARY KEY,
  norm_address text NOT NULL REFERENCES public.hartford_addresses(norm_address) ON DELETE CASCADE,
  request_number text,
  type text,
  status text,
  department text,
  opened_at date
);
CREATE INDEX h311_norm_idx ON public.hartford_311_complaints(norm_address);
CREATE INDEX h311_type_idx ON public.hartford_311_complaints(type);
CREATE INDEX h311_opened_idx ON public.hartford_311_complaints(opened_at DESC);
GRANT SELECT ON public.hartford_311_complaints TO anon, authenticated;
GRANT ALL ON public.hartford_311_complaints TO service_role;
ALTER TABLE public.hartford_311_complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read 311" ON public.hartford_311_complaints FOR SELECT USING (true);
