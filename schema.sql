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

-- ═══════════════════════════════════════════════════════════════════════════
-- EXERCISE CATALOG + WORKOUT LOGS (recovery / anti-overtraining engine)
-- Relational mirror of client/src/lib/exerciseCatalog.js. The app works
-- offline from the JS catalog; these tables make the data queryable and
-- durable across devices. Idempotent — safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════

-- 4. Exercises: global seed rows (owner NULL) + user-created custom rows ----
create table if not exists public.exercises (
  id                   uuid primary key default gen_random_uuid(),
  owner                uuid references auth.users (id) on delete cascade, -- NULL = global seed
  slug                 text,                                              -- stable id for seed rows
  name                 text not null,
  primary_body_part    text not null check (primary_body_part in
    ('Chest','Back','Quads','Hamstrings','Shoulders','Biceps','Triceps','Core','Calves','Cardio')),
  secondary_body_parts text[] not null default '{}',
  movement_category    text not null check (movement_category in ('Compound','Isolation')),
  equipment            text not null check (equipment in
    ('Barbell','Dumbbell','Machine','Bodyweight','Cable','Kettlebell')),
  fatigue_score        int  not null check (fatigue_score between 1 and 5),
  required_rest_hours  int  not null check (required_rest_hours > 0),
  created_at           timestamptz default now()
);

-- One global row per slug (lets the seed below upsert cleanly).
create unique index if not exists exercises_global_slug
  on public.exercises (slug) where owner is null;

alter table public.exercises enable row level security;

drop policy if exists "Read global and own exercises" on public.exercises;
create policy "Read global and own exercises"
  on public.exercises for select
  using (owner is null or auth.uid() = owner);

drop policy if exists "Manage own exercises" on public.exercises;
create policy "Manage own exercises"
  on public.exercises for all
  using (auth.uid() = owner) with check (auth.uid() = owner);

grant select on public.exercises to anon, authenticated;
grant all on public.exercises to authenticated;

-- 5. Workout logs: one row per completed exercise occurrence ----------------
--    Body-part/fatigue values are snapshotted so history survives later
--    edits to an exercise definition.
create table if not exists public.workout_logs (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users (id) on delete cascade,
  exercise_id          uuid references public.exercises (id) on delete set null,
  exercise_name        text not null,
  primary_body_part    text not null,
  secondary_body_parts text[] not null default '{}',
  movement_category    text not null,
  fatigue_score        int  not null,
  session_id           text,          -- app's wod logId, for traceability
  performed_at         timestamptz not null default now()
);

create index if not exists workout_logs_user_time
  on public.workout_logs (user_id, performed_at desc);

alter table public.workout_logs enable row level security;

drop policy if exists "Users manage own workout logs" on public.workout_logs;
create policy "Users manage own workout logs"
  on public.workout_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant all on public.workout_logs to authenticated;

-- 6. Seed the global catalog (mirrors SEED_EXERCISES in exerciseCatalog.js) -
insert into public.exercises
  (slug, name, primary_body_part, secondary_body_parts, movement_category, equipment, fatigue_score, required_rest_hours)
values
  ('bench-press',       'Barbell Bench Press',       'Chest',      '{Triceps,Shoulders}',        'Compound',  'Barbell',    4, 48),
  ('incline-db-press',  'Incline Dumbbell Press',    'Chest',      '{Shoulders,Triceps}',        'Compound',  'Dumbbell',   3, 48),
  ('weighted-pullup',   'Weighted Pull-Up',          'Back',       '{Biceps,Core}',              'Compound',  'Bodyweight', 4, 48),
  ('pullup',            'Pull-Up',                   'Back',       '{Biceps,Core}',              'Compound',  'Bodyweight', 3, 48),
  ('kipping-pullup',    'Kipping Pull-Up',           'Back',       '{Biceps,Core,Shoulders}',    'Compound',  'Bodyweight', 2, 24),
  ('db-row',            'Dumbbell Row',              'Back',       '{Biceps,Core}',              'Compound',  'Dumbbell',   3, 48),
  ('face-pull',         'Face Pull',                 'Back',       '{Shoulders}',                'Isolation', 'Cable',      1, 24),
  ('dead-hang',         'Dead Hang',                 'Back',       '{Core}',                     'Isolation', 'Bodyweight', 1, 24),
  ('back-squat',        'Back Squat',                'Quads',      '{Hamstrings,Core}',          'Compound',  'Barbell',    5, 72),
  ('front-squat',       'Front Squat',               'Quads',      '{Core,Shoulders}',           'Compound',  'Barbell',    4, 48),
  ('walking-lunge',     'Barbell Walking Lunge',     'Quads',      '{Hamstrings,Core}',          'Compound',  'Barbell',    4, 48),
  ('sled-push',         'Sled Push',                 'Quads',      '{Calves,Core,Cardio}',       'Compound',  'Machine',    4, 48),
  ('deadlift',          'Deadlift',                  'Hamstrings', '{Back,Quads,Core}',          'Compound',  'Barbell',    5, 72),
  ('rdl',               'Romanian Deadlift',         'Hamstrings', '{Back,Core}',                'Compound',  'Barbell',    4, 48),
  ('overhead-press',    'Overhead Press',            'Shoulders',  '{Triceps,Core}',             'Compound',  'Barbell',    3, 48),
  ('hip-to-overhead',   'Hip to Overhead (Sandbag)', 'Shoulders',  '{Hamstrings,Core,Back}',     'Compound',  'Kettlebell', 4, 48),
  ('lateral-raise',     'Lateral Raise',             'Shoulders',  '{}',                         'Isolation', 'Dumbbell',   1, 24),
  ('bicep-curl',        'Bicep Curl',                'Biceps',     '{}',                         'Isolation', 'Dumbbell',   1, 24),
  ('hammer-curl',       'Hammer Curl',               'Biceps',     '{}',                         'Isolation', 'Dumbbell',   1, 24),
  ('tricep-pushdown',   'Tricep Pushdown',           'Triceps',    '{}',                         'Isolation', 'Cable',      1, 24),
  ('dips',              'Dips',                      'Triceps',    '{Chest,Shoulders}',          'Compound',  'Bodyweight', 3, 48),
  ('hanging-leg-raise', 'Hanging Leg Raise',         'Core',       '{}',                         'Isolation', 'Bodyweight', 2, 24),
  ('weighted-plank',    'Weighted Plank',            'Core',       '{Shoulders}',                'Isolation', 'Bodyweight', 2, 24),
  ('farmers-carry',     'Farmer''s Carry',           'Core',       '{Back,Calves}',              'Compound',  'Kettlebell', 3, 24),
  ('calf-raise',        'Deficit Calf Raise',        'Calves',     '{}',                         'Isolation', 'Machine',    1, 24),
  ('loaded-shuttle',    'Loaded Shuttle Run',        'Cardio',     '{Quads,Calves,Core}',        'Compound',  'Bodyweight', 4, 48),
  ('interval-run',      'Interval / Tempo Run',      'Cardio',     '{Quads,Calves,Hamstrings}',  'Compound',  'Bodyweight', 3, 24),
  ('zone2-run',         'Zone 2 Run',                'Cardio',     '{Calves}',                   'Compound',  'Bodyweight', 2, 24)
on conflict (slug) where owner is null
do update set
  name = excluded.name,
  primary_body_part = excluded.primary_body_part,
  secondary_body_parts = excluded.secondary_body_parts,
  movement_category = excluded.movement_category,
  equipment = excluded.equipment,
  fatigue_score = excluded.fatigue_score,
  required_rest_hours = excluded.required_rest_hours;
