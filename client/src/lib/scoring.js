/**
 * 5-Event Tactical Assessment — scoring engine.
 *
 * Rules:
 *  - Must meet the passing baseline on EVERY event or the whole test fails.
 *  - Points are earned ONLY for performance ABOVE the baseline. Hitting the
 *    baseline exactly = 0 bonus points.
 *  - Tier is decided by total accumulated bonus points (once all baselines met).
 *
 * State architecture note: baseline (pass/fail) and bonus (points) are kept
 * strictly separate — `eventResult()` returns both independently.
 */

// Event 5 — 4 rounds of 90s work / 60s rest (no rest after the final round).
const shuttlePhases = [];
for (let i = 0; i < 4; i++) {
  shuttlePhases.push({ name: `Round ${i + 1}`, seconds: 90, work: true });
  if (i < 3) shuttlePhases.push({ name: 'Rest', seconds: 60, work: false });
}

export const EVENTS = [
  {
    key: 'hipOverhead',
    n: 1,
    name: 'Hip to Overhead',
    short: 'Clean & Press',
    sub: 'Clean & Press · 2:30 · loaded',
    unit: 'reps',
    baseline: 20,
    perUnit: 1.0,
    hasLoad: true,          // uses the configurable weight-class load
    timer: [{ name: 'Clean & Press', seconds: 150, work: true }],
  },
  {
    key: 'lunges',
    n: 2,
    name: 'Lunges',
    short: 'Lunges',
    sub: '2:30 · loaded · L+R = 2 steps',
    unit: 'steps',
    baseline: 50,
    perUnit: 0.5,
    hasLoad: true,
    timer: [{ name: 'Lunges', seconds: 150, work: true }],
  },
  {
    key: 'bench',
    n: 3,
    name: 'Bench Press',
    short: 'Bench',
    sub: 'Max reps @ bodyweight',
    unit: 'reps',
    baseline: 10,
    perUnit: 1.0,
    loadIsBodyweight: true,
  },
  {
    key: 'pullups',
    n: 4,
    name: 'Weighted Pull-Ups',
    short: 'Pull-Ups',
    sub: 'Max reps · kipping allowed',
    unit: 'reps',
    baseline: 10,
    perUnit: 1.0,
    loadIsExternal: true,   // external plate-carrier load
  },
  {
    key: 'shuttles',
    n: 5,
    name: 'Shuttle Sprints',
    short: 'Shuttles',
    sub: '4 × 90s (60s rest) · loaded · 25m',
    unit: 'sprints',
    baseline: 40,
    perUnit: 2.0,
    loadIsExternal: true,
    timer: shuttlePhases,
  },
];

export const EVENT_BY_KEY = Object.fromEntries(EVENTS.map(e => [e.key, e]));

// Tier thresholds by cumulative bonus points (only when all baselines met).
// Contiguous bands — the spec's 49→50 gap is closed and the sub-20 band is
// labelled "Qualified" (a bare pass).
export const TIERS = [
  { key: 'excellent', min: 50,   label: 'Excellent',     color: 'var(--accent)',  icon: '🔥' },
  { key: 'above',     min: 37.5, label: 'Above Average', color: 'var(--run)',     icon: '🔷' },
  { key: 'passing',   min: 20,   label: 'Passing',       color: 'var(--success)', icon: '🟢' },
  { key: 'qualified', min: 0,    label: 'Qualified',     color: 'var(--success)', icon: '✅' },
];

export const FAIL_TIER = { key: 'fail', label: 'Failed', color: 'var(--danger)', icon: '⚠️', note: 'Baseline missed on an event' };

/** Per-event result: pass/fail on baseline + bonus points (kept separate). */
export function eventResult(event, value) {
  const v = Math.max(0, Number(value) || 0);
  const met = v >= event.baseline;
  const over = Math.max(0, v - event.baseline);
  const bonus = met ? +(over * event.perUnit).toFixed(1) : 0;
  const toBaseline = Math.max(0, event.baseline - v);
  return { value: v, met, over, bonus, toBaseline };
}

export function tierFor(totalBonus, allMet) {
  if (!allMet) return FAIL_TIER;
  return TIERS.find(t => totalBonus >= t.min) || TIERS[TIERS.length - 1];
}

/** Whole-assessment roll-up from a { eventKey: value } map. */
export function scoreAssessment(values = {}) {
  const events = EVENTS.map(ev => ({ ...ev, ...eventResult(ev, values[ev.key]) }));
  const totalBonus = +events.reduce((s, e) => s + e.bonus, 0).toFixed(1);
  const allMet = events.every(e => e.met);
  const tier = tierFor(totalBonus, allMet);
  // Points needed to reach the next tier up (null if already Excellent / failing)
  let toNext = null;
  if (allMet) {
    const idx = TIERS.findIndex(t => t.key === tier.key);
    if (idx > 0) toNext = +(TIERS[idx - 1].min - totalBonus).toFixed(1);
  }
  return { events, totalBonus, allMet, tier, toNext };
}
