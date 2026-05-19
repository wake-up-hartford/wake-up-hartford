
-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  language_pref text default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

-- auto create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- intake_responses
create table public.intake_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  survey_scores jsonb not null,
  followup jsonb not null default '{}'::jsonb,
  tract_fips text,
  created_at timestamptz not null default now()
);
alter table public.intake_responses enable row level security;
create policy "own intake all" on public.intake_responses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index on public.intake_responses (user_id, created_at desc);

-- stabilization_plans
create table public.stabilization_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  intake_id uuid references public.intake_responses(id) on delete set null,
  plan jsonb not null,
  status text not null default 'active',
  generated_at timestamptz not null default now()
);
alter table public.stabilization_plans enable row level security;
create policy "own plans all" on public.stabilization_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index on public.stabilization_plans (user_id, generated_at desc);

-- plan_steps
create table public.plan_steps (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.stabilization_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  week int not null,
  domain text not null,
  title text not null,
  detail text,
  resource_id text,
  step_order int not null default 0,
  completed_at timestamptz
);
alter table public.plan_steps enable row level security;
create policy "own steps all" on public.plan_steps for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index on public.plan_steps (plan_id, week, step_order);
