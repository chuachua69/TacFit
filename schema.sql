-- TacFit — Supabase schema for cloud sync.
-- Run this ONCE in the Supabase SQL editor (Dashboard → SQL Editor → New query → paste → Run).
-- Safe to run again: everything is idempotent (won't error if it already exists).
--
-- The app (client/src/store/profile.js) keeps one row per user in `profiles`,
-- storing the whole app state as a JSON blob:
--   syncToSupabase(): upsert { id, data, updated_at }
--   fetchProfile():   select data where id = auth.uid()

-- 1. Table -----------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  data       jsonb,
  updated_at timestamptz default now()
);

-- 2. Row-level security: each user can read/write ONLY their own row --------
alter table public.profiles enable row level security;

drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile"
  on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 3. Grants: without these you get "permission denied for table profiles" ---
--    RLS decides WHICH rows; grants decide whether the role may touch the
--    table at all. Logged-in users are the `authenticated` role.
grant usage on schema public to anon, authenticated;
grant all on public.profiles to authenticated;
