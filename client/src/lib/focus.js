/**
 * Focus / priority ranking — an ordered list of disciplines the user cares
 * about most. Drives which events the Baseline test recommends re-measuring.
 */
export const DISCIPLINES = ['gym', 'run', 'swim', 'ruck'];

export const DISC_LABEL = { gym: 'Strength (Gym)', run: 'Run', swim: 'Swim', ruck: 'Ruck' };
export const DISC_EMOJI = { gym: '🏋️', run: '🏃', swim: '🏊', ruck: '🎒' };

// Default ranking seeded from the chosen primary focus
export function defaultRanking(focus) {
  const primary = { gym: 'gym', run: 'run', swim: 'swim', ruck: 'ruck', operator: 'gym', strength: 'gym' }[focus];
  if (!primary) return [...DISCIPLINES];
  return [primary, ...DISCIPLINES.filter(d => d !== primary)];
}

export function normalizeRanking(ranking) {
  const seen = new Set();
  const out = [];
  (ranking || []).forEach(d => { if (DISCIPLINES.includes(d) && !seen.has(d)) { seen.add(d); out.push(d); } });
  DISCIPLINES.forEach(d => { if (!seen.has(d)) out.push(d); });
  return out;
}

// Baseline keys to re-measure per discipline
export const DISC_TESTS = {
  gym:  ['squat', 'deadlift', 'bench', 'ohp', 'row'],
  run:  ['run2400s'],
  swim: ['swim400s'],
  ruck: ['ruckPaceMinKm', 'ruckLoadKg'],
};

// Top-N priorities the app recommends re-testing
export function recommendedDisciplines(ranking, n = 2) {
  return normalizeRanking(ranking).slice(0, n);
}
