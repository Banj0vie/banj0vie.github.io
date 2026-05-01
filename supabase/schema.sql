-- HV-Fun Supabase schema
-- Run this in the Supabase SQL editor on a fresh project.

create table if not exists public.players (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists players_updated_at_idx on public.players (updated_at desc);

-- Row-level security: each user can only read/write their own row.
alter table public.players enable row level security;

drop policy if exists "players_select_own" on public.players;
create policy "players_select_own"
  on public.players
  for select
  using (auth.uid() = user_id);

drop policy if exists "players_insert_own" on public.players;
create policy "players_insert_own"
  on public.players
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "players_update_own" on public.players;
create policy "players_update_own"
  on public.players
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Optional public leaderboard view (level + xp + username from state).
-- Comment this out if you want leaderboard data private.
create or replace view public.leaderboard as
select
  user_id,
  (state->>'sandbox_username') as username,
  (state->>'sandbox_pfp')      as pfp,
  coalesce(nullif(state->>'sandbox_level','')::int, 1) as level,
  coalesce(nullif(state->>'sandbox_xp','')::bigint, 0) as xp,
  coalesce(nullif(state->>'sandbox_honey','')::bigint, 0) as honey,
  updated_at
from public.players;

grant select on public.leaderboard to anon, authenticated;
