// TacFit demo state for Play Store screenshots.
// Today is Sat 2026-07-25. Programme started Mon 2026-06-29 => week 4 of 6.
// Bonus points below are computed with the REAL scoring rules from
// lib/scoring.js (perUnit: hipOverhead 1, lunges 0.5, bench 1, pullups 1,
// shuttles 2; tiers: qualified 0 / passing 20 / above 37.5 / excellent 50)
// so nothing on screen contradicts the app's own arithmetic.

const iso = (d, h = 18) => new Date(`${d}T${String(h).padStart(2, '0')}:00:00`).toISOString();
const DAY_LABEL = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };

localStorage.setItem('dev_bypass', '1');

// ── profile ────────────────────────────────────────────────────────────────
// runDays tue+thu (instead of the default tue+sat) so Saturday — today —
// carries a real training session rather than a rest/run day.
localStorage.setItem('tac5_profile', JSON.stringify({
  setupComplete: true,
  tutorialSeen: true,                       // suppresses the driver.js tour
  programStartDate: iso('2026-06-29', 12),  // local noon, like the wizard writes
  oneRMs: { squat: 145, deadlift: 185, bench: 105, press: 68 },
  bodyweight: 77,
  loadClass: 40,
  externalLoad: 10,
  unit: 'kg',
  muted: false,
  customSchedule: {
    runDays: ['tue', 'thu'],
    runTypes: { tue: 'intervals', thu: 'easy' },
  },
}));

// ── full 5-event assessments ───────────────────────────────────────────────
// Baseline test the day before the block started, then a mid-block retest.
const mkAttempt = (date, values, totalBonus, tier) => ({
  id: new Date(iso(date)).getTime(), date: iso(date), values, totalBonus, allMet: true, tier,
});
localStorage.setItem('tac5_attempts', JSON.stringify([
  // 1 + 2 + 1 + 1 + 2 = 7.0  -> Qualified
  mkAttempt('2026-06-28', { hipOverhead: 21, lunges: 54, bench: 11, pullups: 11, shuttles: 41 },
    7.0, { key: 'qualified', label: 'Qualified' }),
  // 6 + 8 + 6 + 5 + 14 = 39.0 -> Above Average
  mkAttempt('2026-07-19', { hipOverhead: 26, lunges: 66, bench: 16, pullups: 15, shuttles: 47 },
    39.0, { key: 'above', label: 'Above Average' }),
]));

// ── single-event logs ──────────────────────────────────────────────────────
const mkEvent = (date, eventKey, name, value, bonus) => ({
  id: new Date(iso(date)).getTime(), date: iso(date), eventKey, name, value, met: true, bonus,
});
localStorage.setItem('tac5_events', JSON.stringify([
  mkEvent('2026-07-07', 'bench', 'Bench Press', 13, 3),
  mkEvent('2026-07-09', 'pullups', 'Weighted Pull-Ups', 12, 2),
  mkEvent('2026-07-14', 'shuttles', 'Shuttle Sprints', 44, 8),
  mkEvent('2026-07-16', 'lunges', 'Lunges', 60, 5),
  mkEvent('2026-07-21', 'hipOverhead', 'Hip to Overhead', 24, 4),
  mkEvent('2026-07-23', 'bench', 'Bench Press', 15, 5),
]));

// ── completed WOD sessions ─────────────────────────────────────────────────
// Weights climb week over week so the personal-best section shows real growth.
const W = (a) => a;                       // [w1, w2, w3, w4]
const LOADS = {
  'Back Squat': W([95, 102.5, 110, 117.5]),
  'Bench Press': W([70, 75, 77.5, 82.5]),
  'Weighted Pull-Ups': W([10, 12.5, 15, 17.5]),
  'Deadlift': W([120, 130, 137.5, 145]),
  'Barbell Walking Lunges': W([40, 45, 50, 55]),
  'Deficit Calf Raises': W([60, 65, 70, 75]),
  'Overhead Press': W([45, 47.5, 50, 52.5]),
  'Dumbbell Rows': W([30, 32.5, 35, 37.5]),
};
const lift = (name, wk, sets, reps) => ({
  name, kind: 'weight',
  rows: Array.from({ length: sets }, () => ({
    weight: LOADS[name][wk - 1], reps, rpe: null, done: true,
  })),
});
const checks = (names) => names.map(name => ({
  name, kind: 'check', rows: [{ weight: null, reps: null, rpe: null, done: true }],
}));

// day -> the sessions the generated programme puts on it (runDays tue+thu)
const PLAN = {
  mon: [
    { slot: 'am', type: 'lift', title: 'Full Body Heavy Strength', lifts: ['squat', 'bench', 'pullup'],
      ex: (wk) => [lift('Back Squat', wk, 5, 5), lift('Bench Press', wk, 5, 5), lift('Weighted Pull-Ups', wk, 5, 5)] },
    { slot: 'pm', type: 'lift', title: 'Max Rep Test Capacity', lifts: [],
      ex: () => checks(['Bench Press (bodyweight)', 'Strict Bodyweight Pull-Ups', 'Tricep Pushdowns', 'Face Pulls']) },
  ],
  // Runs mirror markDone(): a one-exercise session with no `rows`.
  tue: [{ slot: 'am', type: 'run', title: 'Hard Running (Intervals/Tempo)', lifts: [],
          ex: () => [{ name: 'Hard Running (Intervals/Tempo)' }] }],
  wed: [
    { slot: 'am', type: 'lift', title: 'Heavy Posterior Power', lifts: ['deadlift'],
      ex: (wk) => [lift('Deadlift', wk, 5, 5), lift('Barbell Walking Lunges', wk, 3, 14), lift('Deficit Calf Raises', wk, 4, 15)] },
    { slot: 'pm', type: 'lift', title: 'Max Rep Test Capacity', lifts: ['press'],
      ex: (wk) => [lift('Overhead Press', wk, 5, 5), lift('Dumbbell Rows', wk, 4, 10), ...checks(['Hanging Leg Raises'])] },
  ],
  thu: [{ slot: 'am', type: 'run', title: 'Easy Recovery Run', lifts: [],
          ex: () => [{ name: 'Easy Recovery Run' }] }],
  fri: [
    { slot: 'am', type: 'conditioning', title: 'Loaded Shuttle Sprint Intervals', lifts: [],
      ex: () => checks(['Dynamic Warm-up', 'Loaded 25m Shuttles', 'Sled Push (Heavy)']) },
    { slot: 'pm', type: 'conditioning', title: 'Core & Grip Endurance', lifts: [],
      ex: () => checks(['Weighted Plank', 'Dead Hang', "Farmer's Carry"]) },
  ],
  sat: [
    { slot: 'am', type: 'conditioning', title: 'Complex Testing & Work Capacity', lifts: [],
      ex: () => checks(['Min 1 — Hip to Overhead', 'Min 2 — Walking Lunges', 'Min 3 — Bench Press', 'Min 4 — Pull-Ups', 'Min 5 — Rest']) },
    { slot: 'pm', type: 'conditioning', title: 'Core & Grip Endurance', lifts: [],
      ex: () => checks(['Kipping Pull-Up Practice', 'Bicep Curls', 'Hammer Curls']) },
  ],
};

// Mondays of each programme week, and how far into the week to log.
const WEEKS = [
  { wk: 1, mon: '2026-06-29', through: 'sat' },
  { wk: 2, mon: '2026-07-06', through: 'sat' },
  { wk: 3, mon: '2026-07-13', through: 'sat' },
  // Today is Sat 25th. Stop at Thu so nothing heavy sits in yesterday's slot:
  // a >7 fatigue total on Friday makes Saturday a global recovery-cap day and
  // buries the exercise library under identical red warnings.
  { wk: 4, mon: '2026-07-20', through: 'thu' },
];
const ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
// A couple of honestly-skipped sessions; an unbroken 38/38 looks fake.
const SKIP = new Set(['wod-2026-07-09-thu-am', 'wod-2026-07-18-sat-pm']);

const wod = [];
for (const { wk, mon, through } of WEEKS) {
  const monDate = new Date(`${mon}T12:00:00`);
  const limit = ORDER.indexOf(through);
  ORDER.forEach((day, i) => {
    if (i > limit) return;
    const d = new Date(monDate); d.setDate(monDate.getDate() + i);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    for (const s of PLAN[day]) {
      const logId = `wod-${ds}-${day}-${s.slot}`;
      const exercises = s.ex(wk);
      const totalSets = exercises.reduce((n, e) => n + (e.rows?.length || 0), 0);
      wod.push({
        status: SKIP.has(logId) ? 'skipped' : 'done',
        logId, day, slot: s.slot, dayLabel: DAY_LABEL[day],
        title: s.title, type: s.type, lifts: s.lifts,
        exercises, doneCount: totalSets, totalSets,
        id: new Date(iso(ds, s.slot === 'am' ? 7 : 18)).getTime(),
        date: iso(ds, s.slot === 'am' ? 7 : 18),
      });
    }
  });
}
localStorage.setItem('tac5_wod', JSON.stringify(wod));

// ── last-used weights (pre-fills the runner) ───────────────────────────────
localStorage.setItem('tac5_exmem', JSON.stringify(
  Object.fromEntries(Object.entries(LOADS).map(([k, v]) => [k, v[3]]))
));

({
  startDate: '2026-06-29 (Mon) — week 4 of 6',
  wodSessions: wod.length,
  done: wod.filter(w => w.status === 'done').length,
  skipped: wod.filter(w => w.status === 'skipped').length,
  attempts: 2,
  eventLogs: 6,
  todayIsALiftDay: 'sat = Complex Testing & Work Capacity (EMOM) + Core & Grip',
})
