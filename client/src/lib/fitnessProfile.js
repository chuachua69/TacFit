/**
 * Derive a 6-axis fitness profile (0–100 per axis) from the user's baselines,
 * bodyweight, plan completion and operator data. Scores are indicative — mapped
 * against rough recreational→strong reference standards.
 */
const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
// linear map: input a→ya, b→yb (works for decreasing ranges too)
const lin = (x, a, b, ya, yb) => ya + ((x - a) * (yb - ya)) / (b - a);

export function computeProfile({ profile, logs = [], plan, operatorTests = [] }) {
  const bw = Number(profile?.bodyweight) || 0;
  const bl = profile?.baselines || {};

  // Strength — relative (sum of squat+dead+bench)/bodyweight, else absolute
  let strength = 0;
  const sumLifts = (bl.squat || 0) + (bl.deadlift || 0) + (bl.bench || 0);
  if (bw > 0 && sumLifts > 0) strength = clamp(lin(sumLifts / bw, 2.0, 4.75, 20, 100));
  else if (sumLifts > 0) strength = clamp(lin(sumLifts, 150, 450, 20, 100));

  // Power — overhead press relative to bodyweight
  let power = 0;
  if (bw > 0 && bl.ohp) power = clamp(lin(bl.ohp / bw, 0.45, 1.1, 20, 100));
  else if (bl.ohp) power = clamp(lin(bl.ohp, 30, 90, 20, 100));

  // Run — 2.4km time (faster = higher)
  let run = 0;
  if (bl.run2400s) run = clamp(lin(bl.run2400s, 900, 480, 20, 100));

  // Swim — 400m time
  let swim = 0;
  if (bl.swim400s) swim = clamp(lin(bl.swim400s, 720, 360, 20, 100));

  // Ruck — pace (min/km), faster = higher
  let ruck = 0;
  if (bl.ruckPaceMinKm) ruck = clamp(lin(bl.ruckPaceMinKm, 10, 6, 20, 100));

  // Consistency — plan completion
  let consistency = 0;
  if (plan) {
    const all = plan.weeks.flatMap(w => w.sessions).length;
    const done = logs.filter(l => l.status === 'done').length;
    consistency = all > 0 ? clamp((done / all) * 100) : 0;
  }

  const axes = [
    { key: 'strength', label: 'Strength', value: Math.round(strength) },
    { key: 'power', label: 'Power', value: Math.round(power) },
    { key: 'run', label: 'Run', value: Math.round(run) },
    { key: 'swim', label: 'Swim', value: Math.round(swim) },
    { key: 'ruck', label: 'Ruck', value: Math.round(ruck) },
    { key: 'consistency', label: 'Consistency', value: Math.round(consistency) },
  ];

  const rated = axes.filter(a => a.value > 0);
  const overall = rated.length ? Math.round(rated.reduce((s, a) => s + a.value, 0) / rated.length) : 0;

  return { axes, overall };
}
