/**
 * Weekly training program — tailored to prepare for the 5-event assessment.
 * A fixed Mon/Wed/Fri split with AM + PM sessions. Each exercise carries a
 * scheme (sets×reps) and an optional coaching note. Rest days are implicit
 * (any day without sessions).
 */

export const PROGRAM = [
  {
    day: 'mon', label: 'Monday',
    sessions: [
      {
        slot: 'am', title: 'Heavy Push/Pull Strength',
        focus: 'Raw pressing & pulling power',
        exercises: [
          { name: 'Bench Press', scheme: '5 × 5', note: 'Work up to 85–90% bodyweight so 77 kg feels light' },
          { name: 'Weighted Pull-Ups', scheme: '5 × 5', note: 'Heavy, strict form — build raw pulling power' },
          { name: 'Incline Dumbbell Press', scheme: '3 × 8' },
          { name: 'Weighted Dips', scheme: '3 × 8–10' },
        ],
      },
      {
        slot: 'pm', title: 'Max Rep Test Capacity',
        focus: 'Push your rep threshold',
        exercises: [
          { name: 'Bench Press (bodyweight)', scheme: '3 × max', note: '2 min rest between sets — aim past 10 reps' },
          { name: 'Strict Bodyweight Pull-Ups', scheme: '4 × max' },
          { name: 'Tricep Pushdowns & Face Pulls', scheme: '3 × 15', note: 'Shoulder & lockout structural integrity' },
        ],
      },
    ],
  },
  {
    day: 'wed', label: 'Wednesday',
    sessions: [
      {
        slot: 'am', title: 'Heavy Lower Body Power',
        focus: 'Posterior chain foundation',
        exercises: [
          { name: 'Back Squat or Deadlift', scheme: '4 × 5', note: 'Build the posterior chain' },
          { name: 'Barbell Walking Lunges', scheme: '3 × 12–16 total', note: 'Over-prepare for the 50-rep lunge baseline' },
          { name: 'Deficit Calf Raises', scheme: '4 × 15', note: 'Ankle resilience for sprinting' },
        ],
      },
      {
        slot: 'pm', title: 'Overhead & Upper Back Stamina',
        focus: 'Shoulder burn tolerance',
        exercises: [
          { name: 'Clean & Press (Hip to Overhead)', scheme: '4 × 6–8', note: 'Quick, explosive hip pop' },
          { name: 'Dumbbell Rows', scheme: '4 × 10' },
          { name: 'Push Press', scheme: '3 × 10', note: 'Build shoulder burn tolerance' },
          { name: 'Hanging Leg Raises / Heavy Planks', scheme: '4 × to failure' },
        ],
      },
    ],
  },
  {
    day: 'fri', label: 'Friday',
    sessions: [
      {
        slot: 'am', title: 'Complex Testing & Work Capacity',
        focus: '15-min EMOM · repeat ×3 blocks',
        emom: {
          rounds: 3,
          minutes: [
            { min: 1, label: '8–10 Hip to Overhead' },
            { min: 2, label: '16 Walking Lunges' },
            { min: 3, label: '8 Bench Press' },
            { min: 4, label: '10 Pull-Ups' },
            { min: 5, label: 'Rest' },
          ],
        },
        exercises: [
          { name: 'Min 1 — Hip to Overhead', scheme: '8–10 reps' },
          { name: 'Min 2 — Walking Lunges', scheme: '16 steps' },
          { name: 'Min 3 — Bench Press', scheme: '8 reps' },
          { name: 'Min 4 — Pull-Ups', scheme: '10 reps' },
          { name: 'Min 5 — Rest', scheme: '—', note: 'Repeat the 5-min block ×3 under fatigue' },
        ],
      },
      {
        slot: 'pm', title: 'Technical Kipping & Arm Pump',
        focus: 'Grip endurance & tendon health',
        exercises: [
          { name: 'Kipping / Butterfly Pull-Up Practice', scheme: '4 × 10–15', note: 'Momentum & fluid hips — save your grip' },
          { name: 'Bicep Curls & Hammer Curls', scheme: '4 × 12', note: 'Forearm strength to prevent tendonitis' },
          { name: "Farmer's Carries", scheme: '3 × 50 m', note: 'Heavy load — bulletproof grip' },
        ],
      },
    ],
  },
];

export const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const DAY_LABEL = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };

/** Today's weekday key (mon..sun). */
export function todayKey(d = new Date()) {
  return DAY_ORDER[(d.getDay() + 6) % 7]; // JS: 0=Sun → shift so Mon=0
}

export function dayFor(key) {
  return PROGRAM.find(d => d.day === key) || null;
}

/** Stable id for a session log: `wod-<date>-<day>-<slot>`. */
export function sessionLogId(date, day, slot) {
  return `wod-${date}-${day}-${slot}`;
}
