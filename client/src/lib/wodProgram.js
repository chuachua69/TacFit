/**
 * Weekly training program — tailored to prepare for the 5-event assessment.
 * Mon–Sat, two sessions per day (PM often optional). Runs are user-owned
 * ("Follow Own run programme"). Sunday is full rest.
 *
 * Session `type`: lift | conditioning | mobility | run | rest.
 * Exercise `kind`: weight (weight+reps+RPE) | reps (reps+RPE) | check (done toggle).
 */

export const PROGRAM = [
  {
    day: 'mon', label: 'Monday',
    sessions: [
      {
        slot: 'am', type: 'lift', title: 'Heavy Push/Pull Strength', focus: 'Raw pressing & pulling power',
        exercises: [
          { name: 'Bench Press', scheme: '5 × 5', kind: 'weight', targetPct: 0.87, note: 'Work up to 85–90% bodyweight so 77 kg feels light' },
          { name: 'Weighted Pull-Ups', scheme: '5 × 5', kind: 'weight', note: 'Heavy, strict form — build raw pulling power' },
          { name: 'Incline Dumbbell Press', scheme: '3 × 8', kind: 'weight' },
          { name: 'Weighted Dips', scheme: '3 × 8–10', kind: 'weight' },
        ],
      },
      {
        slot: 'pm', type: 'lift', title: 'Max Rep Test Capacity', focus: 'Push your rep threshold',
        exercises: [
          { name: 'Bench Press (bodyweight)', scheme: '3 × max', kind: 'reps', note: '2 min rest between sets — aim past 10 reps' },
          { name: 'Strict Bodyweight Pull-Ups', scheme: '4 × max', kind: 'reps' },
          { name: 'Tricep Pushdowns & Face Pulls', scheme: '3 × 15', kind: 'weight', note: 'Shoulder & lockout structural integrity' },
        ],
      },
    ],
  },
  {
    day: 'tue', label: 'Tuesday',
    sessions: [
      { slot: 'am', type: 'run', title: 'Hard Running (Intervals/Tempo)', focus: 'Follow your own run programme' },
      {
        slot: 'pm', type: 'mobility', title: 'Active Recovery & Mobility', optional: true, focus: 'Loosen up & recover',
        exercises: [
          { name: 'Foam Roll — full body', scheme: '5 min', kind: 'check' },
          { name: 'Couch / Hip-Flexor Stretch', scheme: '2 × 30s/side', kind: 'check' },
          { name: 'Thoracic Rotations', scheme: '2 × 10/side', kind: 'check' },
          { name: '90/90 Hip Switches', scheme: '2 × 10', kind: 'check' },
          { name: 'Easy Walk or Bike (Zone 1)', scheme: '15 min', kind: 'check' },
        ],
      },
    ],
  },
  {
    day: 'wed', label: 'Wednesday',
    sessions: [
      {
        slot: 'am', type: 'lift', title: 'Heavy Lower Body Power', focus: 'Posterior chain foundation',
        exercises: [
          { name: 'Back Squat or Deadlift', scheme: '4 × 5', kind: 'weight', note: 'Build the posterior chain' },
          { name: 'Barbell Walking Lunges', scheme: '3 × 12–16 total', kind: 'weight', note: 'Over-prepare for the 50-rep lunge baseline' },
          { name: 'Deficit Calf Raises', scheme: '4 × 15', kind: 'weight', note: 'Ankle resilience for sprinting' },
        ],
      },
      {
        slot: 'pm', type: 'lift', title: 'Overhead & Upper Back Stamina', focus: 'Shoulder burn tolerance',
        exercises: [
          { name: 'Clean & Press (Hip to Overhead)', scheme: '4 × 6–8', kind: 'weight', note: 'Quick, explosive hip pop' },
          { name: 'Dumbbell Rows', scheme: '4 × 10', kind: 'weight' },
          { name: 'Push Press', scheme: '3 × 10', kind: 'weight', note: 'Build shoulder burn tolerance' },
          { name: 'Hanging Leg Raises / Heavy Planks', scheme: '4 × to failure', kind: 'check' },
        ],
      },
    ],
  },
  {
    day: 'thu', label: 'Thursday',
    sessions: [
      {
        slot: 'am', type: 'conditioning', title: 'Loaded Shuttle Sprint Intervals', focus: 'Event 5 speed-endurance',
        exercises: [
          { name: 'Dynamic Warm-up', scheme: '5 min', kind: 'check' },
          { name: 'Loaded 25m Shuttles', scheme: '4 × 90s / 60s rest', kind: 'check', note: '@ 10 kg — max shuttles per round (mirrors the test)' },
          { name: 'Hill Sprints or Sled Push', scheme: '6 × 20m', kind: 'check' },
          { name: 'Hanging Knee Raises', scheme: '3 × 15', kind: 'reps' },
        ],
      },
      {
        slot: 'pm', type: 'conditioning', title: 'Core & Grip Endurance', optional: true, focus: 'Bulletproof core & grip',
        exercises: [
          { name: 'Weighted Plank', scheme: '3 × 45s', kind: 'check' },
          { name: 'Dead Hang', scheme: '3 × max time', kind: 'check' },
          { name: "Farmer's Carry", scheme: '3 × 40m', kind: 'check', note: 'Heavy load' },
          { name: 'Hanging Leg Raises', scheme: '3 × 12', kind: 'reps' },
        ],
      },
    ],
  },
  {
    day: 'fri', label: 'Friday',
    sessions: [
      {
        slot: 'am', type: 'conditioning', title: 'Complex Testing & Work Capacity', focus: '15-min EMOM · repeat ×3',
        emom: { rounds: 3 },
        exercises: [
          { name: 'Min 1 — Hip to Overhead', scheme: '8–10 reps', kind: 'check' },
          { name: 'Min 2 — Walking Lunges', scheme: '16 steps', kind: 'check' },
          { name: 'Min 3 — Bench Press', scheme: '8 reps', kind: 'check' },
          { name: 'Min 4 — Pull-Ups', scheme: '10 reps', kind: 'check' },
          { name: 'Min 5 — Rest', scheme: '—', kind: 'check', note: 'Repeat the 5-min block ×3 under fatigue' },
        ],
      },
      {
        slot: 'pm', type: 'lift', title: 'Technical Kipping & Arm Pump', focus: 'Grip endurance & tendon health',
        exercises: [
          { name: 'Kipping / Butterfly Pull-Up Practice', scheme: '4 × 10–15', kind: 'reps', note: 'Momentum & fluid hips — save your grip' },
          { name: 'Bicep Curls & Hammer Curls', scheme: '4 × 12', kind: 'weight', note: 'Forearm strength to prevent tendonitis' },
          { name: "Farmer's Carries", scheme: '3 × 50 m', kind: 'check', note: 'Heavy load — bulletproof grip' },
        ],
      },
    ],
  },
  {
    day: 'sat', label: 'Saturday',
    sessions: [
      { slot: 'am', type: 'run', title: 'Long Aerobic Run (Zone 2)', focus: 'Follow your own run programme' },
      { slot: 'pm', type: 'rest', title: 'Rest' },
    ],
  },
  {
    day: 'sun', label: 'Sunday',
    sessions: [
      { slot: 'am', type: 'rest', title: 'Full Rest & Recovery' },
    ],
  },
];

export const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const DAY_LABEL = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };

/** Today's weekday key (mon..sun). */
export function todayKey(d = new Date()) {
  return DAY_ORDER[(d.getDay() + 6) % 7]; // JS: 0=Sun → shift so Mon=0
}

/** Tomorrow's weekday key. */
export function tomorrowKey() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return todayKey(d);
}

export function dayFor(key) {
  return PROGRAM.find(d => d.day === key) || null;
}

/** ISO date (YYYY-MM-DD) for a weekday key within the current (Mon-based) week. */
export function dateForDayKey(key, base = new Date()) {
  const todayIdx = (base.getDay() + 6) % 7;
  const targetIdx = DAY_ORDER.indexOf(key);
  const d = new Date(base);
  d.setDate(d.getDate() + (targetIdx - todayIdx));
  return d.toISOString().split('T')[0];
}

/** Stable id for a session log: `wod-<date>-<day>-<slot>`. */
export function sessionLogId(date, day, slot) {
  return `wod-${date}-${day}-${slot}`;
}

/** Parse a scheme string like "5 × 5", "3 × 8–10", "4 × max" → { sets, reps }.
 * No "N ×" pattern (e.g. "5 min", "—") means a single set. */
export function parseScheme(scheme = '') {
  const setsM = scheme.match(/(\d+)\s*×/);
  const sets = setsM ? Number(setsM[1]) : 1;
  const repsM = scheme.match(/×\s*(\d+)/);
  const reps = repsM ? Number(repsM[1]) : null;
  return { sets: Math.min(sets, 8), reps };
}
