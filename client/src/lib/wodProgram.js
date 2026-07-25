import { store } from '../store/profile';

// Local-midnight copy of a date, so week/day math never depends on the
// stored time-of-day (start dates are saved at local noon or wall-clock).
const atMidnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/**
 * Calculates the "effective week" (1 to 6) for a specific lift,
 * factoring in absolute calendar weeks minus skipped sessions.
 * Exported so SessionRunner shares this exact logic (no duplicates).
 */
export function getEffectiveWeek(liftKey) {
  const p = store.getProfile();
  if (!p.programStartDate) return 1;

  // Normalize both ends to local midnight: week boundaries flip at midnight,
  // not at whatever time the start date was stored.
  const start = atMidnight(new Date(p.programStartDate));
  const now = atMidnight(new Date());
  if (now < start) return 1;

  const diffTime = now - start;
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
 * Exported for SessionRunner (shared single implementation).
 */
export function getProgressionPct(week) {
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

function generateDynamicLift(name, liftKey, note, p = store.getProfile()) {
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

export const PROGRAM = [];

export const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const DAY_LABEL = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };

export function getCustomProgram(profile) {
  const schedule = profile.customSchedule || {
    runDays: ['tue', 'sat'],
    runTypes: { tue: 'intervals', sat: 'zone2' }
  };
  
  const prog = DAY_ORDER.map(day => ({
    day,
    label: DAY_LABEL[day],
    sessions: []
  }));

  const runSessions = {
    // Coaching cues, not integration promises — Strava was dropped, so copy
    // telling the user to "link Strava" pointed at a feature that isn't there.
    intervals: { slot: 'am', type: 'run', title: 'Hard Running (Intervals/Tempo)', focus: 'Hard efforts, full recovery between' },
    zone2: { slot: 'am', type: 'run', title: 'Long Aerobic Run (Zone 2)', focus: 'Conversational pace — steady and easy' },
    easy: { slot: 'am', type: 'run', title: 'Easy Recovery Run', focus: 'Zone 1/2 nasal breathing only' }
  };

  const block1 = [
    generateDynamicLift('Back Squat', 'squat', 'Deep, controlled negative', profile),
    generateDynamicLift('Bench Press', 'bench', 'Explosive concentric', profile),
    { name: 'Weighted Pull-Ups', scheme: '5 × 5', kind: 'weight', note: 'Heavy, strict form' }
  ];
  const block1_pm = [
    { name: 'Bench Press (bodyweight)', scheme: '3 × max', kind: 'reps', note: '2 min rest between sets — aim past 10 reps' },
    { name: 'Strict Bodyweight Pull-Ups', scheme: '4 × max', kind: 'reps' },
    { name: 'Tricep Pushdowns', scheme: '3 × 15', kind: 'weight', note: 'Shoulder & lockout structural integrity' },
    { name: 'Face Pulls', scheme: '3 × 15', kind: 'weight' }
  ];

  const block2 = [
    generateDynamicLift('Deadlift', 'deadlift', 'Build the posterior chain', profile),
    { name: 'Barbell Walking Lunges', scheme: '3 × 12–16 total', kind: 'weight', note: 'Over-prepare for the 50-rep lunge baseline' },
    { name: 'Deficit Calf Raises', scheme: '4 × 15', kind: 'weight', note: 'Ankle resilience for sprinting' }
  ];
  const block2_pm = [
    generateDynamicLift('Overhead Press', 'press', 'Strict shoulder power', profile),
    { name: 'Dumbbell Rows', scheme: '4 × 10', kind: 'weight' },
    { name: 'Hanging Leg Raises', scheme: '4 × 15', kind: 'reps' }
  ];

  const block3 = [
    { name: 'Dynamic Warm-up', scheme: '5 min', kind: 'check' },
    { name: 'Loaded 25m Shuttles', scheme: '4 × 90s / 60s rest', kind: 'check', note: '@ 10 kg — max shuttles per round (mirrors the test)' },
    { name: 'Sled Push (Heavy)', scheme: '6 × 20m', kind: 'check', note: 'Load to 1.5x bodyweight' }
  ];
  const block3_pm = [
    { name: 'Weighted Plank', scheme: '3 × 45s', kind: 'check', note: 'Use a 20kg plate' },
    { name: 'Dead Hang', scheme: '3 × max time', kind: 'check' },
    { name: "Farmer's Carry", scheme: '3 × 40m', kind: 'check', note: 'Heavy load (e.g. 32kg/hand)' }
  ];

  const block4 = [
    { name: 'Min 1 — Hip to Overhead', scheme: '8–10 reps', kind: 'check', note: 'Use your prescribed Weight Class (e.g. 40kg sandbag)' },
    { name: 'Min 2 — Walking Lunges', scheme: '16 steps', kind: 'check', note: 'Use your prescribed Weight Class (e.g. 40kg sandbag)' },
    { name: 'Min 3 — Bench Press', scheme: '8 reps', kind: 'check', note: 'Bodyweight load' },
    { name: 'Min 4 — Pull-Ups', scheme: '10 reps', kind: 'check', note: 'Bodyweight' },
    { name: 'Min 5 — Rest', scheme: '—', kind: 'check', note: 'Repeat the 5-min block ×3 under fatigue' }
  ];
  const block4_pm = [
    { name: 'Kipping Pull-Up Practice', scheme: '4 × 10–15', kind: 'reps', note: 'Momentum & fluid hips — save your grip' },
    { name: 'Bicep Curls', scheme: '4 × 12', kind: 'weight', note: 'Forearm strength to prevent tendonitis' },
    { name: 'Hammer Curls', scheme: '4 × 12', kind: 'weight' }
  ];

  const coreBlocks = [
    { title: 'Full Body Heavy Strength', focus: 'Anterior & pushing absolute strength', liftKeys: ['squat', 'bench', 'pullup'], am: block1, pm: block1_pm, type: 'lift' },
    { title: 'Heavy Posterior Power', focus: 'Deadlift & hamstring foundation', liftKeys: ['deadlift'], am: block2, pm: block2_pm, type: 'lift' },
    { title: 'Loaded Shuttle Sprint Intervals', focus: 'Event 5 speed-endurance', am: block3, pm: block3_pm, type: 'conditioning' },
    { title: 'Complex Testing & Work Capacity', focus: '15-min EMOM · repeat ×3', emom: { rounds: 3 }, am: block4, pm: block4_pm, type: 'conditioning' }
  ];

  // 1. Assign runs to selected days
  schedule.runDays.forEach(day => {
    const type = schedule.runTypes[day] || 'easy';
    const dayObj = prog.find(d => d.day === day);
    if (dayObj) {
      dayObj.sessions.push({ ...runSessions[type], slot: 'am' });
    }
  });

  // 2. Distribute core blocks to remaining slots
  let blockIdx = 0;

  // First pass: Fill days that have absolutely no runs
  DAY_ORDER.forEach(day => {
    if (blockIdx >= coreBlocks.length) return;
    if (schedule.runDays.includes(day)) return; // skip run days on first pass

    // Sunday is full rest
    if (day === 'sun') return;

    const dayObj = prog.find(d => d.day === day);
    const block = coreBlocks[blockIdx++];
    
    // Add AM session
    dayObj.sessions.push({
      slot: 'am',
      type: block.type,
      title: block.title,
      focus: block.focus,
      liftKeys: block.liftKeys,
      emom: block.emom,
      exercises: block.am
    });

    // Add PM session
    dayObj.sessions.push({
      slot: 'pm',
      type: block.type,
      title: block.type === 'lift' ? 'Max Rep Test Capacity' : 'Core & Grip Endurance',
      focus: block.type === 'lift' ? 'Push your rep threshold' : 'Bulletproof core & grip',
      exercises: block.pm
    });
  });

  // Second pass: If we still have blocks (user chose lots of run days), stack them on run days as PM sessions
  DAY_ORDER.forEach(day => {
    if (blockIdx >= coreBlocks.length) return;
    if (day === 'sun') return; // keep Sunday pure rest

    const dayObj = prog.find(d => d.day === day);
    // If it has a run but no PM session
    if (dayObj.sessions.length === 1 && dayObj.sessions[0].type === 'run') {
      const block = coreBlocks[blockIdx++];
      dayObj.sessions.push({
        slot: 'pm',
        type: block.type,
        title: block.title,
        focus: block.focus,
        liftKeys: block.liftKeys,
        emom: block.emom,
        exercises: block.am // Stack AM exercises as a PM session
      });
    }
  });

  // 3. Fill in Mobility and Rest for empty slots
  prog.forEach(dayObj => {
    if (dayObj.sessions.length === 0) {
      if (dayObj.day === 'sun') {
        dayObj.sessions.push({ slot: 'am', type: 'rest', title: 'Full Rest & Recovery' });
      } else {
        // Mobility day
        dayObj.sessions.push({
          slot: 'am', type: 'mobility', title: 'Active Recovery & Mobility', optional: true, focus: 'Loosen up & recover',
          exercises: [
            { name: 'Foam Roll — full body', scheme: '5 min', kind: 'check' },
            { name: 'Couch / Hip-Flexor Stretch', scheme: '2 × 30s/side', kind: 'check' },
            { name: 'Thoracic Rotations', scheme: '2 × 10/side', kind: 'check' },
            { name: '90/90 Hip Switches', scheme: '2 × 10', kind: 'check' }
          ]
        });
      }
    } else if (dayObj.sessions.length === 1 && dayObj.sessions[0].type === 'run') {
      // Add a PM rest or mobility
      if (dayObj.day === 'sat') {
        dayObj.sessions.push({ slot: 'pm', type: 'rest', title: 'Rest' });
      } else {
        dayObj.sessions.push({
          slot: 'pm', type: 'mobility', title: 'Active Recovery & Mobility', optional: true, focus: 'Loosen up & recover',
          exercises: [
            { name: 'Foam Roll — full body', scheme: '5 min', kind: 'check' },
            { name: 'Couch / Hip-Flexor Stretch', scheme: '2 × 30s/side', kind: 'check' }
          ]
        });
      }
    }
  });

  return prog;
}

export function loadProgramFromProfile() {
  const profile = store.getProfile();
  PROGRAM.length = 0;
  const custom = getCustomProgram(profile);
  custom.forEach(item => PROGRAM.push(item));
}

// Initial build
loadProgramFromProfile();

export function todayKey(d = new Date()) {
  return DAY_ORDER[(d.getDay() + 6) % 7]; 
}

export function tomorrowKey() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return todayKey(d);
}

export function dayFor(key) {
  // Always reload program to ensure it's up to date with profile changes
  loadProgramFromProfile();
  return PROGRAM.find(d => d.day === key) || null;
}

export function getFullProgram() {
  loadProgramFromProfile();
  return PROGRAM;
}

/** yyyy-mm-dd in LOCAL time. Session logIds must use the local calendar date —
 *  toISOString() is UTC, which made a session's id change mid-morning for any
 *  timezone east of UTC (completed sessions "un-completed" after 8am SGT). */
export function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function dateForDayKey(key, base = new Date()) {
  const todayIdx = (base.getDay() + 6) % 7;
  const targetIdx = DAY_ORDER.indexOf(key);
  const d = new Date(base);
  d.setDate(d.getDate() + (targetIdx - todayIdx));
  return localDateStr(d);
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
