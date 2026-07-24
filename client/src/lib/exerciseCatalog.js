/**
 * Exercise catalog — enums, seed data, and name matching.
 *
 * This is the app's canonical catalog (works offline / guest mode).
 * schema.sql seeds the same rows into Supabase `exercises` so the data is
 * also queryable relationally; custom exercises created in-app are written
 * to BOTH the local store and the `exercises` table (see exerciseDb.js).
 *
 * Typed via JSDoc to stay consistent with the plain-JS codebase.
 *
 * @typedef {'Chest'|'Back'|'Quads'|'Hamstrings'|'Shoulders'|'Biceps'|'Triceps'|'Core'|'Calves'|'Cardio'} BodyPart
 * @typedef {'Compound'|'Isolation'} MovementCategory
 * @typedef {'Barbell'|'Dumbbell'|'Machine'|'Bodyweight'|'Cable'|'Kettlebell'} Equipment
 *
 * @typedef {Object} Exercise
 * @property {string}       id                   Stable slug id (uuid for custom).
 * @property {string}       name
 * @property {BodyPart}     primary_body_part
 * @property {BodyPart[]}   secondary_body_parts
 * @property {MovementCategory} movement_category
 * @property {Equipment}    equipment
 * @property {number}       fatigue_score        1–5 CNS/systemic load.
 * @property {number}       required_rest_hours  Baseline full-recovery window.
 * @property {string[]}     [aliases]            Alternate names (program strings).
 * @property {boolean}      [custom]             True for user-created exercises.
 */

export const BODY_PARTS = Object.freeze([
  'Chest', 'Back', 'Quads', 'Hamstrings', 'Shoulders',
  'Biceps', 'Triceps', 'Core', 'Calves', 'Cardio',
]);

export const MOVEMENT_CATEGORIES = Object.freeze(['Compound', 'Isolation']);

export const EQUIPMENT = Object.freeze([
  'Barbell', 'Dumbbell', 'Machine', 'Bodyweight', 'Cable', 'Kettlebell',
]);

/**
 * Seed catalog — foundational + extended movements covering every body part,
 * with sports-science fatigue scores (5 = max CNS hit, 1 = trivial isolation)
 * and baseline recovery windows (72h heavy hinge/squat, 48h compounds,
 * 24h isolation/light work). Aliases map the WOD program's exercise strings
 * (and the runner's swap-list variants) onto catalog entries.
 * The SQL seed in schema.sql is GENERATED from this array — after editing,
 * run `node scripts/gen-seed.mjs` and re-run schema.sql in Supabase.
 * @type {Exercise[]}
 */
export const SEED_EXERCISES = Object.freeze([
  // ── Chest ────────────────────────────────────────────────────────────────
  { id: 'bench-press', name: 'Barbell Bench Press', primary_body_part: 'Chest',
    secondary_body_parts: ['Triceps', 'Shoulders'], movement_category: 'Compound',
    equipment: 'Barbell', fatigue_score: 4, required_rest_hours: 48,
    aliases: ['Bench Press', 'Bench Press (bodyweight)', 'Min 3 — Bench Press', 'Floor Press'] },
  { id: 'incline-db-press', name: 'Incline Dumbbell Press', primary_body_part: 'Chest',
    secondary_body_parts: ['Shoulders', 'Triceps'], movement_category: 'Compound',
    equipment: 'Dumbbell', fatigue_score: 3, required_rest_hours: 48 },

  // ── Back ─────────────────────────────────────────────────────────────────
  { id: 'weighted-pullup', name: 'Weighted Pull-Up', primary_body_part: 'Back',
    secondary_body_parts: ['Biceps', 'Core'], movement_category: 'Compound',
    equipment: 'Bodyweight', fatigue_score: 4, required_rest_hours: 48,
    aliases: ['Weighted Pull-Ups'] },
  { id: 'pullup', name: 'Pull-Up', primary_body_part: 'Back',
    secondary_body_parts: ['Biceps', 'Core'], movement_category: 'Compound',
    equipment: 'Bodyweight', fatigue_score: 3, required_rest_hours: 48,
    aliases: ['Strict Bodyweight Pull-Ups', 'Min 4 — Pull-Ups', 'Band-Assisted Pull-Ups'] },
  { id: 'kipping-pullup', name: 'Kipping Pull-Up', primary_body_part: 'Back',
    secondary_body_parts: ['Biceps', 'Core', 'Shoulders'], movement_category: 'Compound',
    equipment: 'Bodyweight', fatigue_score: 2, required_rest_hours: 24,
    aliases: ['Kipping Pull-Up Practice'] },
  { id: 'db-row', name: 'Dumbbell Row', primary_body_part: 'Back',
    secondary_body_parts: ['Biceps', 'Core'], movement_category: 'Compound',
    equipment: 'Dumbbell', fatigue_score: 3, required_rest_hours: 48,
    aliases: ['Dumbbell Rows'] },
  { id: 'face-pull', name: 'Face Pull', primary_body_part: 'Back',
    secondary_body_parts: ['Shoulders'], movement_category: 'Isolation',
    equipment: 'Cable', fatigue_score: 1, required_rest_hours: 24,
    aliases: ['Face Pulls'] },
  { id: 'dead-hang', name: 'Dead Hang', primary_body_part: 'Back',
    secondary_body_parts: ['Core'], movement_category: 'Isolation',
    equipment: 'Bodyweight', fatigue_score: 1, required_rest_hours: 24,
    aliases: ['Active Pull-Up Hang', 'Chin-Up Hang', 'Barbell Hold (Heavy)'] },

  // ── Quads ────────────────────────────────────────────────────────────────
  { id: 'back-squat', name: 'Back Squat', primary_body_part: 'Quads',
    secondary_body_parts: ['Hamstrings', 'Core'], movement_category: 'Compound',
    equipment: 'Barbell', fatigue_score: 5, required_rest_hours: 72,
    aliases: ['Barbell Box Squat'] },
  { id: 'front-squat', name: 'Front Squat', primary_body_part: 'Quads',
    secondary_body_parts: ['Core', 'Shoulders'], movement_category: 'Compound',
    equipment: 'Barbell', fatigue_score: 4, required_rest_hours: 48 },
  { id: 'walking-lunge', name: 'Barbell Walking Lunge', primary_body_part: 'Quads',
    secondary_body_parts: ['Hamstrings', 'Core'], movement_category: 'Compound',
    equipment: 'Barbell', fatigue_score: 4, required_rest_hours: 48,
    aliases: ['Barbell Walking Lunges', 'Min 2 — Walking Lunges'] },
  { id: 'sled-push', name: 'Sled Push', primary_body_part: 'Quads',
    secondary_body_parts: ['Calves', 'Core', 'Cardio'], movement_category: 'Compound',
    equipment: 'Machine', fatigue_score: 4, required_rest_hours: 48,
    aliases: ['Sled Push (Heavy)'] },

  // ── Hamstrings ───────────────────────────────────────────────────────────
  { id: 'deadlift', name: 'Deadlift', primary_body_part: 'Hamstrings',
    secondary_body_parts: ['Back', 'Quads', 'Core'], movement_category: 'Compound',
    equipment: 'Barbell', fatigue_score: 5, required_rest_hours: 72,
    aliases: ['Trap Bar Deadlift'] },
  { id: 'rdl', name: 'Romanian Deadlift', primary_body_part: 'Hamstrings',
    secondary_body_parts: ['Back', 'Core'], movement_category: 'Compound',
    equipment: 'Barbell', fatigue_score: 4, required_rest_hours: 48,
    aliases: ['Romanian Deadlift (RDL)', 'Kettlebell Deadlift (Heavy)', 'Kettlebell Deadlift'] },

  // ── Shoulders ────────────────────────────────────────────────────────────
  { id: 'overhead-press', name: 'Overhead Press', primary_body_part: 'Shoulders',
    secondary_body_parts: ['Triceps', 'Core'], movement_category: 'Compound',
    equipment: 'Barbell', fatigue_score: 3, required_rest_hours: 48 },
  { id: 'hip-to-overhead', name: 'Hip to Overhead (Sandbag)', primary_body_part: 'Shoulders',
    secondary_body_parts: ['Hamstrings', 'Core', 'Back'], movement_category: 'Compound',
    equipment: 'Kettlebell', fatigue_score: 4, required_rest_hours: 48,
    aliases: ['Min 1 — Hip to Overhead', 'Hip to Overhead'] },
  { id: 'lateral-raise', name: 'Lateral Raise', primary_body_part: 'Shoulders',
    secondary_body_parts: [], movement_category: 'Isolation',
    equipment: 'Dumbbell', fatigue_score: 1, required_rest_hours: 24 },

  // ── Biceps ───────────────────────────────────────────────────────────────
  { id: 'bicep-curl', name: 'Bicep Curl', primary_body_part: 'Biceps',
    secondary_body_parts: [], movement_category: 'Isolation',
    equipment: 'Dumbbell', fatigue_score: 1, required_rest_hours: 24,
    aliases: ['Bicep Curls'] },
  { id: 'hammer-curl', name: 'Hammer Curl', primary_body_part: 'Biceps',
    secondary_body_parts: [], movement_category: 'Isolation',
    equipment: 'Dumbbell', fatigue_score: 1, required_rest_hours: 24,
    aliases: ['Hammer Curls'] },

  // ── Triceps ──────────────────────────────────────────────────────────────
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', primary_body_part: 'Triceps',
    secondary_body_parts: [], movement_category: 'Isolation',
    equipment: 'Cable', fatigue_score: 1, required_rest_hours: 24,
    aliases: ['Tricep Pushdowns'] },
  { id: 'dips', name: 'Dips', primary_body_part: 'Triceps',
    secondary_body_parts: ['Chest', 'Shoulders'], movement_category: 'Compound',
    equipment: 'Bodyweight', fatigue_score: 3, required_rest_hours: 48 },

  // ── Core ─────────────────────────────────────────────────────────────────
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', primary_body_part: 'Core',
    secondary_body_parts: [], movement_category: 'Isolation',
    equipment: 'Bodyweight', fatigue_score: 2, required_rest_hours: 24,
    aliases: ['Hanging Leg Raises', 'Hanging Knee Raise Hold', 'Hanging Knee Raise'] },
  { id: 'weighted-plank', name: 'Weighted Plank', primary_body_part: 'Core',
    secondary_body_parts: ['Shoulders'], movement_category: 'Isolation',
    equipment: 'Bodyweight', fatigue_score: 2, required_rest_hours: 24,
    aliases: ['Standard Plank'] },
  { id: 'farmers-carry', name: "Farmer's Carry", primary_body_part: 'Core',
    secondary_body_parts: ['Back', 'Calves'], movement_category: 'Compound',
    equipment: 'Kettlebell', fatigue_score: 3, required_rest_hours: 24,
    aliases: ["Dumbbell Farmer's Walk"] },

  // ── Calves ───────────────────────────────────────────────────────────────
  { id: 'calf-raise', name: 'Deficit Calf Raise', primary_body_part: 'Calves',
    secondary_body_parts: [], movement_category: 'Isolation',
    equipment: 'Machine', fatigue_score: 1, required_rest_hours: 24,
    aliases: ['Deficit Calf Raises'] },

  // ── Cardio ───────────────────────────────────────────────────────────────
  { id: 'loaded-shuttle', name: 'Loaded Shuttle Run', primary_body_part: 'Cardio',
    secondary_body_parts: ['Quads', 'Calves', 'Core'], movement_category: 'Compound',
    equipment: 'Bodyweight', fatigue_score: 4, required_rest_hours: 48,
    aliases: ['Loaded 25m Shuttles'] },
  { id: 'interval-run', name: 'Interval / Tempo Run', primary_body_part: 'Cardio',
    secondary_body_parts: ['Quads', 'Calves', 'Hamstrings'], movement_category: 'Compound',
    equipment: 'Bodyweight', fatigue_score: 3, required_rest_hours: 24,
    aliases: ['Hard Running (Intervals/Tempo)'] },
  { id: 'zone2-run', name: 'Zone 2 Run', primary_body_part: 'Cardio',
    secondary_body_parts: ['Calves'], movement_category: 'Compound',
    equipment: 'Bodyweight', fatigue_score: 2, required_rest_hours: 24,
    aliases: ['Long Aerobic Run (Zone 2)', 'Easy Recovery Run', 'Easy Recovery Run (Zone 1/2)'] },

  // ── Extended Database ────────────────────────────────────────────────────
  { id: 'db-bench-press', name: 'Dumbbell Bench Press', primary_body_part: 'Chest',
    secondary_body_parts: ['Triceps', 'Shoulders'], movement_category: 'Compound',
    equipment: 'Dumbbell', fatigue_score: 3, required_rest_hours: 48,
    aliases: ['Dumbbell Press'] },
  { id: 'pushup', name: 'Push-Up', primary_body_part: 'Chest',
    secondary_body_parts: ['Triceps', 'Shoulders'], movement_category: 'Compound',
    equipment: 'Bodyweight', fatigue_score: 2, required_rest_hours: 24,
    aliases: ['Push-Ups', 'Push-Ups (Weighted)', 'Pike Push-Ups'] },
  { id: 'chest-fly', name: 'Dumbbell Chest Fly', primary_body_part: 'Chest',
    secondary_body_parts: [], movement_category: 'Isolation',
    equipment: 'Dumbbell', fatigue_score: 1, required_rest_hours: 24 },
  { id: 'bb-row', name: 'Barbell Row', primary_body_part: 'Back',
    secondary_body_parts: ['Biceps', 'Core'], movement_category: 'Compound',
    equipment: 'Barbell', fatigue_score: 4, required_rest_hours: 48 },
  { id: 'lat-pulldown', name: 'Lat Pulldown', primary_body_part: 'Back',
    secondary_body_parts: ['Biceps'], movement_category: 'Compound',
    equipment: 'Machine', fatigue_score: 2, required_rest_hours: 24 },
  { id: 'cable-row', name: 'Cable Seated Row', primary_body_part: 'Back',
    secondary_body_parts: ['Biceps'], movement_category: 'Compound',
    equipment: 'Cable', fatigue_score: 2, required_rest_hours: 24 },
  { id: 'inverted-row', name: 'Inverted Row', primary_body_part: 'Back',
    secondary_body_parts: ['Biceps', 'Core'], movement_category: 'Compound',
    equipment: 'Bodyweight', fatigue_score: 1, required_rest_hours: 24 },
  { id: 'db-shoulder-press', name: 'Dumbbell Shoulder Press', primary_body_part: 'Shoulders',
    secondary_body_parts: ['Triceps'], movement_category: 'Compound',
    equipment: 'Dumbbell', fatigue_score: 3, required_rest_hours: 48,
    aliases: ['Kettlebell Press'] },
  { id: 'cable-lateral-raise', name: 'Cable Lateral Raise', primary_body_part: 'Shoulders',
    secondary_body_parts: [], movement_category: 'Isolation',
    equipment: 'Cable', fatigue_score: 1, required_rest_hours: 24 },
  { id: 'leg-press', name: 'Leg Press', primary_body_part: 'Quads',
    secondary_body_parts: ['Hamstrings', 'Calves'], movement_category: 'Compound',
    equipment: 'Machine', fatigue_score: 4, required_rest_hours: 48 },
  { id: 'goblet-squat', name: 'Goblet Squat', primary_body_part: 'Quads',
    secondary_body_parts: ['Core'], movement_category: 'Compound',
    equipment: 'Kettlebell', fatigue_score: 2, required_rest_hours: 24,
    aliases: ['Heavy Goblet Squat'] },
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', primary_body_part: 'Quads',
    // 'Glutes' isn't a BodyPart enum value — Hamstrings+Core keep the recovery
    // engine, custom-exercise validation, and SQL constraints consistent.
    secondary_body_parts: ['Hamstrings', 'Core'], movement_category: 'Compound',
    equipment: 'Dumbbell', fatigue_score: 3, required_rest_hours: 48 },
  { id: 'leg-extensions', name: 'Leg Extension', primary_body_part: 'Quads',
    secondary_body_parts: [], movement_category: 'Isolation',
    equipment: 'Machine', fatigue_score: 2, required_rest_hours: 24 },
  { id: 'db-rdl', name: 'Dumbbell Romanian Deadlift', primary_body_part: 'Hamstrings',
    secondary_body_parts: ['Back', 'Core'], movement_category: 'Compound',
    equipment: 'Dumbbell', fatigue_score: 3, required_rest_hours: 48 },
  { id: 'leg-curl', name: 'Lying Leg Curl', primary_body_part: 'Hamstrings',
    secondary_body_parts: [], movement_category: 'Isolation',
    equipment: 'Machine', fatigue_score: 2, required_rest_hours: 24 },
  { id: 'hip-thrust', name: 'Barbell Hip Thrust', primary_body_part: 'Hamstrings',
    secondary_body_parts: ['Quads'], movement_category: 'Compound',
    equipment: 'Barbell', fatigue_score: 4, required_rest_hours: 48 },
  { id: 'preacher-curl', name: 'Preacher Curl', primary_body_part: 'Biceps',
    secondary_body_parts: [], movement_category: 'Isolation',
    equipment: 'Barbell', fatigue_score: 1, required_rest_hours: 24 },
  { id: 'cable-curl', name: 'Cable Bicep Curl', primary_body_part: 'Biceps',
    secondary_body_parts: [], movement_category: 'Isolation',
    equipment: 'Cable', fatigue_score: 1, required_rest_hours: 24 },
  { id: 'overhead-tricep-ext', name: 'Overhead Tricep Extension', primary_body_part: 'Triceps',
    secondary_body_parts: [], movement_category: 'Isolation',
    equipment: 'Dumbbell', fatigue_score: 1, required_rest_hours: 24 },
  { id: 'skull-crusher', name: 'Skull Crusher', primary_body_part: 'Triceps',
    secondary_body_parts: [], movement_category: 'Isolation',
    equipment: 'Barbell', fatigue_score: 2, required_rest_hours: 24 },
  { id: 'ab-wheel', name: 'Ab Wheel Rollout', primary_body_part: 'Core',
    secondary_body_parts: [], movement_category: 'Isolation',
    equipment: 'Bodyweight', fatigue_score: 2, required_rest_hours: 24 },
  { id: 'kb-swing', name: 'Kettlebell Swing', primary_body_part: 'Cardio',
    secondary_body_parts: ['Hamstrings', 'Core'], movement_category: 'Compound',
    equipment: 'Kettlebell', fatigue_score: 3, required_rest_hours: 24 },
  { id: 'burpees', name: 'Burpee', primary_body_part: 'Cardio',
    secondary_body_parts: ['Chest', 'Quads', 'Core'], movement_category: 'Compound',
    equipment: 'Bodyweight', fatigue_score: 3, required_rest_hours: 24 },
  { id: 'zercher-squat', name: 'Zercher Squat', primary_body_part: 'Quads',
    secondary_body_parts: ['Back', 'Core'], movement_category: 'Compound',
    equipment: 'Barbell', fatigue_score: 4, required_rest_hours: 48 },
  { id: 'zercher-carry', name: 'Zercher Carry', primary_body_part: 'Core',
    secondary_body_parts: ['Back', 'Shoulders'], movement_category: 'Compound',
    equipment: 'Barbell', fatigue_score: 4, required_rest_hours: 48 },
  { id: 'zercher-deadlift', name: 'Zercher Deadlift', primary_body_part: 'Hamstrings',
    secondary_body_parts: ['Back', 'Core'], movement_category: 'Compound',
    equipment: 'Barbell', fatigue_score: 5, required_rest_hours: 72 },
  { id: 'sandbag-carry', name: 'Sandbag Bear Hug Carry', primary_body_part: 'Core',
    secondary_body_parts: ['Back', 'Chest'], movement_category: 'Compound',
    equipment: 'Bodyweight', fatigue_score: 3, required_rest_hours: 24,
    aliases: ['Sandbag Carry'] },
  { id: 'kb-snatch', name: 'Kettlebell Snatch', primary_body_part: 'Cardio',
    secondary_body_parts: ['Shoulders', 'Core'], movement_category: 'Compound',
    equipment: 'Kettlebell', fatigue_score: 3, required_rest_hours: 24 },
  { id: 'kb-goblet-carry', name: 'Kettlebell Goblet Carry', primary_body_part: 'Core',
    secondary_body_parts: ['Quads'], movement_category: 'Compound',
    equipment: 'Kettlebell', fatigue_score: 2, required_rest_hours: 24 },
  { id: 'suitcase-carry', name: 'Kettlebell Suitcase Carry', primary_body_part: 'Core',
    secondary_body_parts: ['Back'], movement_category: 'Compound',
    equipment: 'Kettlebell', fatigue_score: 2, required_rest_hours: 24,
    aliases: ['Suitcase Carry'] },
]);

const LOCAL_CUSTOM_KEY = 'tac5_custom_exercises';

/** User-created exercises stored locally (mirrored to Supabase when signed in). */
export function getLocalCustomExercises() {
  try { return JSON.parse(localStorage.getItem(LOCAL_CUSTOM_KEY) || '[]'); }
  catch { return []; }
}

export function saveLocalCustomExercise(ex) {
  const all = getLocalCustomExercises();
  const idx = all.findIndex(e => e.id === ex.id);
  if (idx >= 0) all[idx] = ex; else all.push(ex);
  localStorage.setItem(LOCAL_CUSTOM_KEY, JSON.stringify(all));
  return all;
}

export function removeLocalCustomExercise(id) {
  const all = getLocalCustomExercises().filter(e => e.id !== id);
  localStorage.setItem(LOCAL_CUSTOM_KEY, JSON.stringify(all));
  return all;
}

/** Full catalog = seed + user's custom exercises. */
export function getCatalog() {
  return [...SEED_EXERCISES, ...getLocalCustomExercises()];
}

// Name → exercise lookup (seed names + aliases + custom names), normalized.
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
// Plural-insensitive form: 'kettlebell swings' matches 'Kettlebell Swing'.
// Applied to BOTH sides, so 'Dips' vs 'Dip' still compare equal.
const deplural = (s) => s.replace(/s\b/g, '');

/**
 * Find a catalog entry for a program/log exercise name. Returns null for
 * unmatched strings (warm-ups, stretches, rest rows) — those simply don't
 * contribute to recovery math. Exact match wins; a plural-insensitive pass
 * catches swap-list variants like 'Lat Pulldowns'.
 * @param {string} name
 * @returns {Exercise|null}
 */
export function findExercise(name) {
  const n = norm(name);
  if (!n) return null;
  const catalog = getCatalog();
  for (const ex of catalog) {
    if (norm(ex.name) === n) return ex;
    if ((ex.aliases || []).some(a => norm(a) === n)) return ex;
  }
  const np = deplural(n);
  for (const ex of catalog) {
    if (deplural(norm(ex.name)) === np) return ex;
    if ((ex.aliases || []).some(a => deplural(norm(a)) === np)) return ex;
  }
  return null;
}
