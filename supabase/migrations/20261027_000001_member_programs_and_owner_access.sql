-- The Lab: initial authenticated member storage and owner-only access.
-- Apply using a trusted Supabase SQL editor / migration runner.
-- Never expose the service_role key in the browser.
create extension if not exists pgcrypto;

create table if not exists public.member_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 70),
  weeks integer not null check (weeks between 1 and 52),
  sessions_per_week integer not null check (sessions_per_week between 1 and 7),
  skills jsonb not null default '[]'::jsonb check (jsonb_typeof(skills) = 'array'),
  plan jsonb not null default '[]'::jsonb check (jsonb_typeof(plan) = 'array'),
  completed_sessions integer not null default 0 check (completed_sessions >= 0),
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists member_programs_owner_idx on public.member_programs(user_id, updated_at desc);
create unique index if not exists member_programs_one_primary_idx on public.member_programs(user_id) where is_primary;

alter table public.member_programs enable row level security;
alter table public.member_programs force row level security;
revoke all on public.member_programs from public, anon;
grant select, insert, update, delete on public.member_programs to authenticated;

drop policy if exists member_programs_select_self on public.member_programs;
create policy member_programs_select_self on public.member_programs for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists member_programs_insert_self on public.member_programs;
create policy member_programs_insert_self on public.member_programs for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists member_programs_update_self on public.member_programs;
create policy member_programs_update_self on public.member_programs for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists member_programs_delete_self on public.member_programs;
create policy member_programs_delete_self on public.member_programs for delete to authenticated using (user_id = (select auth.uid()));

-- A membership record must be provisioned ONLY by a trusted administrator.
-- Never expose insert/update/delete permissions or an API that accepts user-provided owner IDs.
create table if not exists public.lab_owner_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.lab_owner_accounts enable row level security;
alter table public.lab_owner_accounts force row level security;
revoke all on public.lab_owner_accounts from public, anon, authenticated;
grant select on public.lab_owner_accounts to authenticated;
drop policy if exists lab_owner_accounts_self on public.lab_owner_accounts;
create policy lab_owner_accounts_self on public.lab_owner_accounts for select to authenticated using (user_id = (select auth.uid()));

-- Keep private curriculum in a restricted database table, never a public repo/static file.
create table if not exists public.owner_rebuild_content (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  content jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.owner_rebuild_content enable row level security;
alter table public.owner_rebuild_content force row level security;
revoke all on public.owner_rebuild_content from public, anon, authenticated;
grant select on public.owner_rebuild_content to authenticated;
drop policy if exists owner_rebuild_read on public.owner_rebuild_content;
create policy owner_rebuild_read on public.owner_rebuild_content for select to authenticated
using (exists (select 1 from public.lab_owner_accounts a where a.user_id = (select auth.uid())));

-- No client-side INSERT/UPDATE/DELETE privileges for owner-only curriculum.
-- Admin provisioning and curriculum publishing must use trusted server-side credentials.
