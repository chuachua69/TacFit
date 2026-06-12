/**
 * Workout-of-the-Day library — standalone quick sessions that need no plan
 * context. One is picked deterministically per date (so everyone's "today"
 * is stable); the user can filter to a discipline, which re-picks within it.
 */
export const WODS = [
  // ── Gym / strength ──
  {
    id: 'gym-bodyweight-blitz', discipline: 'gym', name: 'Bodyweight Blitz',
    format: '4 rounds · rest 90s between', minutes: 25,
    items: ['20 Push-ups', '15 Air squats', '10 Burpees', '30s Plank'],
  },
  {
    id: 'gym-pull-power', discipline: 'gym', name: 'Pull Power',
    format: '5 rounds · rest as needed', minutes: 30,
    items: ['5 Pull-ups (or 10 rows)', '10 Deadlifts @ moderate', '15 Kettlebell swings', '40m Farmer carry'],
  },
  {
    id: 'gym-leg-day-express', discipline: 'gym', name: 'Leg Day Express',
    format: '3 rounds for quality', minutes: 25,
    items: ['12 Goblet squats', '10/leg Walking lunges', '12 Hip thrusts', '15 Calf raises'],
  },
  // ── Run ──
  {
    id: 'run-400-repeats', discipline: 'run', name: '400m Repeats',
    format: '6 × 400m · 90s jog recovery', minutes: 30,
    items: ['10 min easy warm-up', '6 × 400m @ hard pace', '90s jog between reps', '5 min cool-down'],
  },
  {
    id: 'run-tempo-20', discipline: 'run', name: '20-min Tempo',
    format: 'Steady comfortably-hard effort', minutes: 35,
    items: ['10 min easy warm-up', '20 min @ tempo (can speak ~3 words)', '5 min cool-down jog'],
  },
  {
    id: 'run-fartlek', discipline: 'run', name: 'Pyramid Fartlek',
    format: '1-2-3-2-1 min surges', minutes: 30,
    items: ['10 min easy warm-up', 'Surges: 1-2-3-2-1 min hard', 'Equal easy jog between', '5 min cool-down'],
  },
  // ── Swim ──
  {
    id: 'swim-ladder', discipline: 'swim', name: 'Swim Ladder',
    format: '50-100-150-100-50m · 30s rest', minutes: 30,
    items: ['100m easy warm-up', 'Ladder: 50-100-150-100-50m strong', '30s rest between', '100m easy cool-down'],
  },
  {
    id: 'swim-sprint-50s', discipline: 'swim', name: 'Sprint 50s',
    format: '8 × 50m · 45s rest', minutes: 25,
    items: ['200m easy warm-up', '8 × 50m @ fast pace', '45s rest between', '100m easy cool-down'],
  },
  // ── Ruck ──
  {
    id: 'ruck-hill-intervals', discipline: 'ruck', name: 'Ruck Hill Intervals',
    format: '6 × hill or stair climbs, loaded', minutes: 40,
    items: ['10 min loaded walk warm-up', '6 × 2 min uphill hard', 'Walk back down to recover', '10 min easy walk home'],
  },
  {
    id: 'ruck-steady-5k', discipline: 'ruck', name: 'Steady 5k Ruck',
    format: 'Even pace, full load', minutes: 50,
    items: ['5km loaded march @ steady pace', 'Target your baseline pace', 'Posture tall, short quick steps'],
  },
  // ── Conditioning hybrids ──
  {
    id: 'hybrid-operator-grinder', discipline: 'gym', name: 'Operator Grinder',
    format: 'AMRAP 20 min', minutes: 25,
    items: ['10 Burpees', '15 KB swings', '200m run (or 30 mountain climbers)', 'Repeat for 20 min'],
  },
  {
    id: 'hybrid-deck-of-pain', discipline: 'gym', name: 'Sandbag Circuit',
    format: '4 rounds · minimal rest', minutes: 30,
    items: ['10 Sandbag (or plate) cleans', '15 Sandbag squats', '20m Bear hug carry', '10 Sit-ups'],
  },
];

// Stable hash so the same date always picks the same WOD
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Daily pick — optionally filtered to one discipline. */
export function wodFor(dateStr, discipline = null) {
  const pool = discipline ? WODS.filter(w => w.discipline === discipline) : WODS;
  if (!pool.length) return null;
  return pool[hash(dateStr) % pool.length];
}
