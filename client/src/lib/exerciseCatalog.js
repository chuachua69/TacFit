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
 * Seed catalog — 27 foundational movements covering every body part, with
 * sports-science fatigue scores (5 = max CNS hit, 1 = trivial isolation)
 * and baseline recovery windows (72h heavy hinge/squat, 48h compounds,
 * 24h isolation/light work). Aliases map the WOD program's exercise strings
 * onto catalog entries.
 * @type {Exercise[]}
 */
export const SEED_EXERCISES = Object.freeze([
  // ── Chest ────────────────────────────────────────────────────────────────
  { id: 'bench-press', name: 'Barbell Bench Press', primary_body_part: 'Chest',
    secondary_body_parts: ['Triceps', 'Shoulders'], movement_category: 'Compound',
    equipment: 'Barbell', fatigue_score: 4, required_rest_hours: 48,
    aliases: ['Bench Press', 'Bench Press (bodyweight)', 'Min 3 — Bench Press'] },
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
    aliases: ['Strict Bodyweight Pull-Ups', 'Min 4 — Pull-Ups'] },
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
    equipment: 'Bodyweight', fatigue_score: 1, required_rest_hours: 24 },

  // ── Quads ────────────────────────────────────────────────────────────────
  { id: 'back-squat', name: 'Back Squat', primary_body_part: 'Quads',
    secondary_body_parts: ['Hamstrings', 'Core'], movement_category: 'Compound',
    equipment: 'Barbell', fatigue_score: 5, required_rest_hours: 72 },
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
    equipment: 'Barbell', fatigue_score: 5, required_rest_hours: 72 },
  { id: 'rdl', name: 'Romanian Deadlift', primary_body_part: 'Hamstrings',
    secondary_body_parts: ['Back', 'Core'], movement_category: 'Compound',
    equipment: 'Barbell', fatigue_score: 4, required_rest_hours: 48 },

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
    aliases: ['Hanging Leg Raises'] },
  { id: 'weighted-plank', name: 'Weighted Plank', primary_body_part: 'Core',
    secondary_body_parts: ['Shoulders'], movement_category: 'Isolation',
    equipment: 'Bodyweight', fatigue_score: 2, required_rest_hours: 24 },
  { id: 'farmers-carry', name: "Farmer's Carry", primary_body_part: 'Core',
    secondary_body_parts: ['Back', 'Calves'], movement_category: 'Compound',
    equipment: 'Kettlebell', fatigue_score: 3, required_rest_hours: 24 },

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
    aliases: ['Long Aerobic Run (Zone 2)'] },
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

/**
 * Find a catalog entry for a program/log exercise name. Returns null for
 * unmatched strings (warm-ups, stretches, rest rows) — those simply don't
 * contribute to recovery math.
 * @param {string} name
 * @returns {Exercise|null}
 */
export function findExercise(name) {
  const n = norm(name);
  if (!n) return null;
  for (const ex of getCatalog()) {
    if (norm(ex.name) === n) return ex;
    if ((ex.aliases || []).some(a => norm(a) === n)) return ex;
  }
  return null;
}
