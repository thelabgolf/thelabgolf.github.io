-- The Lab 2.0 development database. Run in a separate Supabase project.
create table public.golf_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text check (char_length(display_name)<=80),
 handicap numeric(4,1) check (handicap between -10 and 54),
 goal text check (char_length(goal)<=120),
 updated_at timestamptz not null default now()
);
create table public.training_programs (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check (char_length(title) between 1 and 120),
 plan jsonb not null default '{}'::jsonb check (jsonb_typeof(plan)='object' and pg_column_size(plan)<=65536),
 created_at timestamptz not null default now()
);
create table public.practice_sessions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 drill_id text not null check (char_length(drill_id) between 1 and 120),
 drill_title text not null check (char_length(drill_title) between 1 and 160),
 practiced_on date not null,
 attempts integer not null check (attempts between 1 and 10000),
 successes integer not null check (successes between 0 and attempts),
 notes text check (char_length(notes)<=2000),
 created_at timestamptz not null default now()
);
create index programs_owner_idx on public.training_programs(user_id,created_at desc);
create index sessions_owner_date_idx on public.practice_sessions(user_id,practiced_on desc);
alter table public.golf_profiles enable row level security;
alter table public.training_programs enable row level security;
alter table public.practice_sessions enable row level security;
create policy "Profile select" on public.golf_profiles for select to authenticated using ((select auth.uid())=user_id);
create policy "Profile insert" on public.golf_profiles for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Profile update" on public.golf_profiles for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "Profile delete" on public.golf_profiles for delete to authenticated using ((select auth.uid())=user_id);
create policy "Programs select" on public.training_programs for select to authenticated using ((select auth.uid())=user_id);
create policy "Programs insert" on public.training_programs for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Programs update" on public.training_programs for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "Programs delete" on public.training_programs for delete to authenticated using ((select auth.uid())=user_id);
create policy "Sessions select" on public.practice_sessions for select to authenticated using ((select auth.uid())=user_id);
create policy "Sessions insert" on public.practice_sessions for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Sessions update" on public.practice_sessions for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "Sessions delete" on public.practice_sessions for delete to authenticated using ((select auth.uid())=user_id);
