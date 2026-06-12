/**
 * Derive a 5-axis fitness profile (0–100 per axis) from the user's baselines
 * and bodyweight. Each axis is scored against piecewise reference standards
 * (untrained → recreational → trained → strong → elite) rather than a single
 * linear ramp, so mid-range performers aren't crushed to the floor and elite
 * marks aren't trivially capped.
 */
const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

// Piecewise-linear interpolation through [x, score] anchor points.
// Points may be ascending or descending in x (times: lower is better).
function piecewise(x, pts) {
  const asc = pts[0][0] < pts[pts.length - 1][0];
  const p = asc ? pts : [...pts].reverse();
  if (x <= p[0][0]) return p[0][1];
  if (x >= p[p.length - 1][0]) return p[p.length - 1][1];
  for (let i = 1; i < p.length; i++) {
    if (x <= p[i][0]) {
      const [a, ya] = p[i - 1];
      const [b, yb] = p[i];
      return ya + ((x - a) * (yb - ya)) / (b - a);
    }
  }
  return p[p.length - 1][1];
}

export function computeProfile({ profile }) {
  const bw = Number(profile?.bodyweight) || 0;
  const bl = profile?.baselines || {};

  // Strength — squat+deadlift+bench total, relative to bodyweight when known.
  // Anchors: 1.5×BW untrained → 3×BW trained → 5.5×BW elite.
  let strength = 0;
  const sumLifts = (bl.squat || 0) + (bl.deadlift || 0) + (bl.bench || 0);
  if (bw > 0 && sumLifts > 0) {
    strength = piecewise(sumLifts / bw, [[1.5, 10], [2.5, 40], [3.5, 65], [4.5, 85], [5.5, 100]]);
  } else if (sumLifts > 0) {
    strength = piecewise(sumLifts, [[150, 10], [250, 40], [350, 65], [450, 85], [550, 100]]);
  }

  // Power — overhead press relative to bodyweight.
  // 0.35×BW untrained → 0.75×BW trained → 1.15×BW elite.
  let power = 0;
  if (bw > 0 && bl.ohp) {
    power = piecewise(bl.ohp / bw, [[0.35, 10], [0.55, 40], [0.75, 65], [0.95, 85], [1.15, 100]]);
  } else if (bl.ohp) {
    power = piecewise(bl.ohp, [[30, 10], [45, 40], [60, 65], [80, 85], [95, 100]]);
  }

  // Run — 2.4km time. 16:00 slow → 11:30 solid → 8:00 elite.
  let run = 0;
  if (bl.run2400s) {
    run = piecewise(bl.run2400s, [[960, 10], [810, 40], [690, 65], [570, 85], [480, 100]]);
  }

  // Swim — 400m time. 13:00 slow → 9:00 solid → 6:15 elite.
  let swim = 0;
  if (bl.swim400s) {
    swim = piecewise(bl.swim400s, [[780, 10], [660, 40], [540, 65], [450, 85], [375, 100]]);
  }

  // Ruck — loaded pace min/km. 11:00 slow → 8:15 solid → 6:00 elite.
  let ruck = 0;
  if (bl.ruckPaceMinKm) {
    ruck = piecewise(bl.ruckPaceMinKm, [[11, 10], [9.5, 40], [8.25, 65], [7, 85], [6, 100]]);
  }

  const axes = [
    { key: 'strength', label: 'Strength', value: Math.round(clamp(strength)) },
    { key: 'power', label: 'Power', value: Math.round(clamp(power)) },
    { key: 'run', label: 'Run', value: Math.round(clamp(run)) },
    { key: 'swim', label: 'Swim', value: Math.round(clamp(swim)) },
    { key: 'ruck', label: 'Ruck', value: Math.round(clamp(ruck)) },
  ];

  const rated = axes.filter(a => a.value > 0);
  const overall = rated.length ? Math.round(rated.reduce((s, a) => s + a.value, 0) / rated.length) : 0;

  return { axes, overall };
}
