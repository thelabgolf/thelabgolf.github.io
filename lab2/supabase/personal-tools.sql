-- Run once in Supabase SQL Editor for The Lab 2.0 development project.
create table if not exists public.golf_rounds (id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,played_on date not null,course text not null,holes integer not null check(holes in (9,18)),score integer not null check(score between 18 and 200),fairways_hit integer check(fairways_hit between 0 and 18),greens_hit integer check(greens_hit between 0 and 18),putts integer check(putts between 0 and 90),penalties integer check(penalties between 0 and 50),notes text,created_at timestamptz not null default now());
create table if not exists public.swing_notes (id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,recorded_on date not null,club text not null,miss text,observation text not null,focus text,created_at timestamptz not null default now());
alter table public.golf_rounds enable row level security;
alter table public.swing_notes enable row level security;
create policy "Golfers manage own rounds" on public.golf_rounds for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "Golfers manage own swing notes" on public.swing_notes for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

-- One private program snapshot per signed-in golfer.
create table if not exists public.golfer_programs (
 user_id uuid primary key references auth.users(id) on delete cascade,
 programs jsonb not null default '[]'::jsonb,
 updated_at timestamptz not null default now(),
 constraint golfer_programs_is_array check (jsonb_typeof(programs) = 'array')
);
alter table public.golfer_programs enable row level security;
create policy "Golfers manage own programs" on public.golfer_programs for all to authenticated
 using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
