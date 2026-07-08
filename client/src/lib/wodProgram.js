import { store } from '../store/profile';

/**
 * Calculates the "effective week" (1 to 6) for a specific lift, 
 * factoring in absolute calendar weeks minus skipped sessions.
 */
function getEffectiveWeek(liftKey) {
  const p = store.getProfile();
  if (!p.programStartDate) return 1;
  
  const start = new Date(p.programStartDate);
  const now = new Date();
  const diffTime = Math.abs(now - start);
  const calendarWeek = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7)) + 1;
  
  // Count skipped workouts that contained this lift to pause progression
  const logs = store.getWodLogs();
  const skippedCount = logs.filter(w => w.status === 'skipped' && w.lifts && w.lifts.includes(liftKey)).length;
  
  // Effective week is calendar week minus skipped, clamped between 1 and 6
  return Math.min(Math.max(calendarWeek - skippedCount, 1), 6);
}

/**
 * Returns progression multiplier based on effective week (1-6).
 * Week 1: 65%, Week 2: 70%, Week 3: 75%, Week 4: 80%, Week 5: 85%, Week 6: 90%
 */
function getProgressionPct(week) {
  return 0.60 + (week * 0.05); // week 1 = 65%
}

/**
 * Returns progression rep scheme based on week.
 */
function getProgressionScheme(week) {
  switch (week) {
    case 1: return '3 × 8'; // Hypertrophy base
    case 2: return '4 × 6'; // Strength endurance
    case 3: return '5 × 5'; // Strength base
    case 4: return '5 × 3'; // Power
    case 5: return '3 × 2'; // Peak
    case 6: return '1 × max'; // Test
    default: return '5 × 5';
  }
}

function generateDynamicLift(name, liftKey, note) {
  const p = store.getProfile();
  const week = getEffectiveWeek(liftKey);
  const pct = getProgressionPct(week);
  const scheme = getProgressionScheme(week);
  const oneRM = p.oneRMs[liftKey] || 0;
  
  return { 
    name, 
    scheme, 
    kind: 'weight', 
    targetWeight: Math.round(oneRM * pct), 
    note: `${note} (Wk ${week}: ${Math.round(pct*100)}% of 1RM)` 
  };
}

export const PROGRAM = [
  {
    day: 'mon', label: 'Monday',
    sessions: [
      {
        slot: 'am', type: 'lift', title: 'Full Body Heavy Strength', focus: 'Anterior & pushing absolute strength',
        liftKeys: ['squat', 'bench', 'pullup'],
        exercises: [
          generateDynamicLift('Back Squat', 'squat', 'Deep, controlled negative'),
          generateDynamicLift('Bench Press', 'bench', 'Explosive concentric'),
          { name: 'Weighted Pull-Ups', scheme: '5 × 5', kind: 'weight', note: 'Heavy, strict form' },
        ],
      },
      {
        slot: 'pm', type: 'lift', title: 'Max Rep Test Capacity', focus: 'Push your rep threshold',
        exercises: [
          { name: 'Bench Press (bodyweight)', scheme: '3 × max', kind: 'reps', note: '2 min rest between sets — aim past 10 reps' },
          { name: 'Strict Bodyweight Pull-Ups', scheme: '4 × max', kind: 'reps' },
          { name: 'Tricep Pushdowns', scheme: '3 × 15', kind: 'weight', note: 'Shoulder & lockout structural integrity' },
          { name: 'Face Pulls', scheme: '3 × 15', kind: 'weight' },
        ],
      },
    ],
  },
  {
    day: 'tue', label: 'Tuesday',
    sessions: [
      { slot: 'am', type: 'run', title: 'Hard Running (Intervals/Tempo)', focus: 'Link Strava for tracking' },
      {
        slot: 'pm', type: 'mobility', title: 'Active Recovery & Mobility', optional: true, focus: 'Loosen up & recover',
        exercises: [
          { name: 'Foam Roll — full body', scheme: '5 min', kind: 'check' },
          { name: 'Couch / Hip-Flexor Stretch', scheme: '2 × 30s/side', kind: 'check' },
          { name: 'Thoracic Rotations', scheme: '2 × 10/side', kind: 'check' },
          { name: '90/90 Hip Switches', scheme: '2 × 10', kind: 'check' },
        ],
      },
    ],
  },
  {
    day: 'wed', label: 'Wednesday',
    sessions: [
      {
        slot: 'am', type: 'lift', title: 'Heavy Posterior Power', focus: 'Deadlift & hamstring foundation',
        liftKeys: ['deadlift'],
        exercises: [
          generateDynamicLift('Deadlift', 'deadlift', 'Build the posterior chain'),
          { name: 'Barbell Walking Lunges', scheme: '3 × 12–16 total', kind: 'weight', note: 'Over-prepare for the 50-rep lunge baseline' },
          { name: 'Deficit Calf Raises', scheme: '4 × 15', kind: 'weight', note: 'Ankle resilience for sprinting' },
        ],
      },
      {
        slot: 'pm', type: 'lift', title: 'Overhead & Upper Back Stamina', focus: 'Shoulder burn tolerance',
        liftKeys: ['press'],
        exercises: [
          generateDynamicLift('Overhead Press', 'press', 'Strict shoulder power'),
          { name: 'Dumbbell Rows', scheme: '4 × 10', kind: 'weight' },
          { name: 'Hanging Leg Raises', scheme: '4 × 15', kind: 'reps' },
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
          { name: 'Sled Push (Heavy)', scheme: '6 × 20m', kind: 'check', note: 'Load to 1.5× bodyweight' },
        ],
      },
      {
        slot: 'pm', type: 'conditioning', title: 'Core & Grip Endurance', optional: true, focus: 'Bulletproof core & grip',
        exercises: [
          { name: 'Weighted Plank', scheme: '3 × 45s', kind: 'check', note: 'Use a 20kg plate' },
          { name: 'Dead Hang', scheme: '3 × max time', kind: 'check' },
          { name: "Farmer's Carry", scheme: '3 × 40m', kind: 'check', note: 'Heavy load (e.g. 32kg/hand)' },
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
          { name: 'Min 1 — Hip to Overhead', scheme: '8–10 reps', kind: 'check', note: 'Use your prescribed Weight Class (e.g. 40kg sandbag)' },
          { name: 'Min 2 — Walking Lunges', scheme: '16 steps', kind: 'check', note: 'Use your prescribed Weight Class (e.g. 40kg sandbag)' },
          { name: 'Min 3 — Bench Press', scheme: '8 reps', kind: 'check', note: 'Bodyweight load' },
          { name: 'Min 4 — Pull-Ups', scheme: '10 reps', kind: 'check', note: 'Bodyweight' },
          { name: 'Min 5 — Rest', scheme: '—', kind: 'check', note: 'Repeat the 5-min block ×3 under fatigue' },
        ],
      },
      {
        slot: 'pm', type: 'lift', title: 'Technical Kipping & Arm Pump', focus: 'Grip endurance & tendon health',
        exercises: [
          { name: 'Kipping Pull-Up Practice', scheme: '4 × 10–15', kind: 'reps', note: 'Momentum & fluid hips — save your grip' },
          { name: 'Bicep Curls', scheme: '4 × 12', kind: 'weight', note: 'Forearm strength to prevent tendonitis' },
          { name: 'Hammer Curls', scheme: '4 × 12', kind: 'weight' },
        ],
      },
    ],
  },
  {
    day: 'sat', label: 'Saturday',
    sessions: [
      { slot: 'am', type: 'run', title: 'Long Aerobic Run (Zone 2)', focus: 'Link Strava for tracking' },
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

export function todayKey(d = new Date()) {
  return DAY_ORDER[(d.getDay() + 6) % 7]; 
}

export function tomorrowKey() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return todayKey(d);
}

export function dayFor(key) {
  // Using a getter function to rebuild PROGRAM so dynamic percentages update based on current week
  // (In a real React app, a hook is better, but this bridges the legacy static array)
  return PROGRAM.find(d => d.day === key) || null;
}

export function getFullProgram() {
  return PROGRAM;
}

export function dateForDayKey(key, base = new Date()) {
  const todayIdx = (base.getDay() + 6) % 7;
  const targetIdx = DAY_ORDER.indexOf(key);
  const d = new Date(base);
  d.setDate(d.getDate() + (targetIdx - todayIdx));
  return d.toISOString().split('T')[0];
}

export function sessionLogId(date, day, slot) {
  return `wod-${date}-${day}-${slot}`;
}

export function parseScheme(scheme = '') {
  const setsM = scheme.match(/(\d+)\s*×/);
  const sets = setsM ? Number(setsM[1]) : 1;
  const repsM = scheme.match(/×\s*(\d+)/);
  const reps = repsM ? Number(repsM[1]) : null;
  return { sets: Math.min(sets, 8), reps };
}
