/**
 * Operator Physical Fitness Program — 5-event assessment scoring.
 * Encodes the official protocol: every event has a baseline pass score and a
 * bonus-point structure. Must meet baseline on EVERY event AND accumulate the
 * required cumulative bonus points to classify.
 */

// 4 rounds of 90s work / 60s rest (no rest after the final round)
const shuttlePhases = [];
for (let i = 0; i < 4; i++) {
  shuttlePhases.push({ name: `Work ${i + 1}`, seconds: 90 });
  if (i < 3) shuttlePhases.push({ name: 'Rest', seconds: 60 });
}

export const EVENTS = [
  {
    key: 'hipOverhead',
    n: 1,
    name: 'Hip to Overhead',
    sub: 'Clean & Press · 2 min 30 sec · 40/30/20 kg',
    unit: 'reps',
    baseline: 20,
    perUnit: 1.0,
    hasLoad: true,
    loadOptions: [40, 30, 20],
    timer: [{ name: 'Clean & Press', seconds: 150 }],
  },
  {
    key: 'lunges',
    n: 2,
    name: 'Alternate Leg Lunges',
    sub: '2 min 30 sec · 40/30/20 kg · each step = 1',
    unit: 'steps',
    baseline: 50,
    perUnit: 0.5,
    hasLoad: true,
    loadOptions: [40, 30, 20],
    timer: [{ name: 'Lunges', seconds: 150 }],
  },
  {
    key: 'bench',
    n: 3,
    name: 'Bench Press',
    sub: 'Max reps @ 100% bodyweight',
    unit: 'reps',
    baseline: 10,
    perUnit: 1.0,
    loadIsBodyweight: true,
  },
  {
    key: 'pullups',
    n: 4,
    name: 'Weighted Pull-Ups',
    sub: 'Max reps · kipping allowed',
    unit: 'reps',
    baseline: 10,
    perUnit: 1.0,
    hasLoad: true,
  },
  {
    key: 'shuttles',
    n: 5,
    name: 'Shuttle Sprints w/ Load',
    sub: '4 × 90s (60s rest) · 10 kg · 25 m lengths',
    unit: 'sprints',
    baseline: 40,
    perUnit: 2.0,
    timer: shuttlePhases,
  },
];

export function scoreEvent(event, value) {
  const v = Number(value) || 0;
  const met = v >= event.baseline;
  const bonus = met ? +(Math.max(0, v - event.baseline) * event.perUnit).toFixed(1) : 0;
  return { value: v, met, bonus };
}

// Tier from cumulative bonus points (per protocol classification)
export function tierFor(totalBonus, allMet) {
  if (!allMet) return { key: 'fail', label: 'Disqualified', color: '#e05252', icon: '⚠️', note: 'Missed a baseline event' };
  if (totalBonus >= 50) return { key: 'excellent', label: 'Excellent', color: '#e0a052', icon: '🔥' };
  if (totalBonus >= 37.5) return { key: 'above', label: 'Above Average', color: '#52a8e0', icon: '🔵' };
  if (totalBonus >= 25) return { key: 'pass', label: 'Passing', color: '#52c878', icon: '🟢' };
  if (totalBonus >= 20) return { key: 'min', label: 'Qualified (Minimum)', color: '#52c878', icon: '✅' };
  return { key: 'fail', label: 'Insufficient Points', color: '#e05252', icon: '⚠️', note: 'Need 20+ bonus points' };
}

export function scoreAssessment(values) {
  const events = EVENTS.map(ev => ({ ...ev, ...scoreEvent(ev, values[ev.key]) }));
  const totalBonus = +events.reduce((s, e) => s + e.bonus, 0).toFixed(1);
  const allMet = events.every(e => e.met);
  const tier = tierFor(totalBonus, allMet);
  return { events, totalBonus, allMet, tier };
}
