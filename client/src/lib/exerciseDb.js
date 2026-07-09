/**
 * Supabase data layer for the exercise catalog + workout logs.
 *
 * Strategy: local-first. The JS seed catalog + localStorage custom exercises
 * are always available (guest/offline). When signed in, custom exercises are
 * mirrored to the `exercises` table and completed session exercises are
 * written to `workout_logs` — the relational, queryable record. All cloud
 * writes are best-effort: failures never break the workout flow.
 */
import { supabase } from './supabase';
import {
  BODY_PARTS, MOVEMENT_CATEGORIES, EQUIPMENT,
  saveLocalCustomExercise, findExercise,
} from './exerciseCatalog';

async function currentUser() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
  } catch { return null; }
}

/**
 * Validate + create a custom exercise from enum dropdown values.
 * Saves locally (instant, offline-safe) and mirrors to Supabase when signed in.
 * @returns {{ok: boolean, exercise?: object, error?: string}}
 */
export async function createCustomExercise({
  name, primary_body_part, secondary_body_parts = [],
  movement_category, equipment, fatigue_score, required_rest_hours,
}) {
  // Enum validation — the UI uses dropdowns, but never trust the caller.
  if (!name?.trim()) return { ok: false, error: 'Name is required.' };
  if (!BODY_PARTS.includes(primary_body_part)) return { ok: false, error: 'Pick a primary body part.' };
  if (secondary_body_parts.some(p => !BODY_PARTS.includes(p))) return { ok: false, error: 'Invalid secondary body part.' };
  if (!MOVEMENT_CATEGORIES.includes(movement_category)) return { ok: false, error: 'Pick Compound or Isolation.' };
  if (!EQUIPMENT.includes(equipment)) return { ok: false, error: 'Pick the equipment.' };
  const fatigue = Number(fatigue_score);
  if (!(fatigue >= 1 && fatigue <= 5)) return { ok: false, error: 'Fatigue score must be 1–5.' };
  const rest = Number(required_rest_hours);
  if (!(rest > 0)) return { ok: false, error: 'Rest hours must be positive.' };
  if (findExercise(name)) return { ok: false, error: `"${name.trim()}" already exists in the catalog.` };

  const exercise = {
    id: crypto.randomUUID(),
    name: name.trim(),
    primary_body_part,
    secondary_body_parts: secondary_body_parts.filter(p => p !== primary_body_part),
    movement_category, equipment,
    fatigue_score: fatigue,
    required_rest_hours: rest,
    custom: true,
  };

  saveLocalCustomExercise(exercise);

  // Cloud mirror — best effort.
  const user = await currentUser();
  if (user) {
    const { error } = await supabase.from('exercises').insert({
      id: exercise.id, owner: user.id, name: exercise.name,
      primary_body_part, secondary_body_parts: exercise.secondary_body_parts,
      movement_category, equipment,
      fatigue_score: fatigue, required_rest_hours: rest,
    });
    if (error) console.warn('Custom exercise cloud mirror failed:', error.message);
  }

  return { ok: true, exercise };
}

/**
 * Write one workout_logs row per catalog-matched exercise in a completed
 * session. Fire-and-forget: guests and network failures are silently fine —
 * the recovery engine reads local wodLogs, not these rows.
 * @param {{logId: string, exercises: {name: string}[], date?: string}} sessionEntry
 */
export async function logSessionToCloud(sessionEntry) {
  const user = await currentUser();
  if (!user) return;

  const rows = (sessionEntry.exercises || [])
    .map(e => ({ exLog: e, ex: findExercise(e.name) }))
    .filter(({ ex }) => ex)
    .map(({ ex }) => ({
      user_id: user.id,
      exercise_name: ex.name,
      primary_body_part: ex.primary_body_part,
      secondary_body_parts: ex.secondary_body_parts,
      movement_category: ex.movement_category,
      fatigue_score: ex.fatigue_score,
      session_id: sessionEntry.logId,
      performed_at: sessionEntry.date || new Date().toISOString(),
    }));

  if (!rows.length) return;
  const { error } = await supabase.from('workout_logs').insert(rows);
  if (error) console.warn('workout_logs write failed:', error.message);
}

/** Fetch the signed-in user's custom exercises from the cloud (device sync). */
export async function fetchCloudCustomExercises() {
  const user = await currentUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('exercises').select('*').eq('owner', user.id);
  if (error || !data) return [];
  for (const row of data) {
    saveLocalCustomExercise({
      id: row.id, name: row.name,
      primary_body_part: row.primary_body_part,
      secondary_body_parts: row.secondary_body_parts || [],
      movement_category: row.movement_category,
      equipment: row.equipment,
      fatigue_score: row.fatigue_score,
      required_rest_hours: row.required_rest_hours,
      custom: true,
    });
  }
  return data;
}
