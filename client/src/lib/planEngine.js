// 6-week periodisation engine
// Phases: Build (wk1-2), Intensify (wk3-4), Peak (wk5), Deload (wk6)

const PHASES = [
  { week: 1, name: 'Build',     volumeMult: 0.75, intensityMult: 0.70 },
  { week: 2, name: 'Build',     volumeMult: 0.85, intensityMult: 0.75 },
  { week: 3, name: 'Intensify', volumeMult: 0.90, intensityMult: 0.82 },
  { week: 4, name: 'Intensify', volumeMult: 1.00, intensityMult: 0.88 },
  { week: 5, name: 'Peak',      volumeMult: 0.95, intensityMult: 0.95 },
  { week: 6, name: 'Deload',    volumeMult: 0.60, intensityMult: 0.70 },
];

const DAYS_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

// Discipline rotation by sessions count (capped at 14 for AM+PM full week)
const BASE_DISCIPLINES = ['gym', 'run', 'swim', 'gym', 'ruck', 'run', 'swim', 'gym', 'ruck', 'run', 'gym', 'swim', 'ruck', 'run'];

const ROTATION_DISCIPLINES = ['gym', 'run', 'swim', 'ruck'];

function buildRotation(sessionsCount, focus) {
  const base = BASE_DISCIPLINES.slice(0, sessionsCount);
  // 'operator' biases towards extra gym work
  if (focus === 'operator') {
    const counts = {};
    base.forEach(d => { counts[d] = (counts[d] || 0) + 1; });
    const least = Object.entries(counts).sort((a, b) => a[1] - b[1])[0]?.[0];
    if (least && least !== 'gym') base[base.lastIndexOf(least)] = 'gym';
    return base;
  }
  if (!focus || focus === 'balanced' || !ROTATION_DISCIPLINES.includes(focus)) return base;
  // Replace one occurrence of the least-represented discipline with focus
  const counts = {};
  base.forEach(d => { counts[d] = (counts[d] || 0) + 1; });
  const least = Object.entries(counts).sort((a, b) => a[1] - b[1])[0]?.[0];
  if (!least || least === focus) return base;
  const idx = base.lastIndexOf(least);
  const updated = [...base];
  updated[idx] = focus;
  return updated;
}

// Get ordered list of (day, slot, dateOffset) from schedule
function getScheduleSlots(schedule) {
  const slots = [];
  DAYS_ORDER.forEach((day, dayIdx) => {
    if (schedule[day]?.am) slots.push({ day, slot: 'am', dayOffset: dayIdx });
    if (schedule[day]?.pm) slots.push({ day, slot: 'pm', dayOffset: dayIdx });
  });
  return slots;
}

// Get the Monday of a given week (defaults to current week)
function mondayOf(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function getThisMonday() {
  return mondayOf(new Date());
}

// Anchor Monday for the plan: from profile.startDate if set, else this week.
function getAnchorMonday(profile) {
  if (profile?.startDate) {
    // startDate is 'YYYY-MM-DD'; parse as local date
    const [y, m, dd] = profile.startDate.split('-').map(Number);
    if (y && m && dd) return mondayOf(new Date(y, m - 1, dd));
  }
  return getThisMonday();
}

function slotDate(monday, weekIndex, dayOffset) {
  const d = new Date(monday);
  d.setDate(monday.getDate() + weekIndex * 7 + dayOffset);
  return d.toISOString().split('T')[0];
}

// --- Gym workout generator ---
function gymSession(profile, phase, gymIndex) {
  const { baselines, unit } = profile;
  const u = unit === 'lbs' ? 'lbs' : 'kg';
  const i = phase.intensityMult;
  const v = phase.volumeMult;

  const workingWeight = (oneRM, pct) => Math.round((oneRM * pct) / 2.5) * 2.5;
  const sets = Math.max(2, Math.round(3 * v));
  const reps = phase.name === 'Peak' ? 5 : phase.name === 'Deload' ? 10 : 8;

  const isLower = gymIndex % 2 === 0;

  if (isLower) {
    return {
      type: 'gym', focus: 'Lower',
      exercises: [
        { name: 'Back Squat',       sets, reps, weight: workingWeight(baselines.squat, i),            unit: u },
        { name: 'Romanian Deadlift',sets, reps, weight: workingWeight(baselines.deadlift, i * 0.85),  unit: u },
        { name: 'Bent-over Row',    sets, reps, weight: workingWeight(baselines.row, i),              unit: u },
        { name: 'Plank',            sets: 3, reps: null, duration: Math.round(45 * v) + 's',         unit: null },
      ],
    };
  } else {
    return {
      type: 'gym', focus: 'Upper',
      exercises: [
        { name: 'Deadlift',       sets: Math.max(2, sets - 1), reps: phase.name === 'Peak' ? 3 : 5, weight: workingWeight(baselines.deadlift, i), unit: u },
        { name: 'Bench Press',    sets, reps, weight: workingWeight(baselines.bench, i),            unit: u },
        { name: 'Overhead Press', sets, reps, weight: workingWeight(baselines.ohp, i),              unit: u },
        { name: 'Pull-ups',       sets, reps: Math.round(reps * 0.75), weight: null,                unit: null },
      ],
    };
  }
}

// --- Operator-prep gym generator (builds toward the 5-event test) ---
function operatorGymSession(profile, phase, gymIndex) {
  const { baselines, unit } = profile;
  const u = unit === 'lbs' ? 'lbs' : 'kg';
  const i = phase.intensityMult;
  const v = phase.volumeMult;
  const ww = (oneRM, pct) => Math.round((oneRM * pct) / 2.5) * 2.5;
  const sets = Math.max(2, Math.round(3 * v));
  const reps = phase.name === 'Peak' ? 5 : phase.name === 'Deload' ? 10 : 8;

  const isPower = gymIndex % 2 === 0;
  if (isPower) {
    return {
      type: 'gym', focus: 'Operator Power',
      exercises: [
        { name: 'Clean & Press',  sets, reps, weight: ww(baselines.ohp, i),            unit: u },
        { name: 'Walking Lunges', sets, reps, weight: ww(baselines.squat, i * 0.5),    unit: u },
        { name: 'Farmer Carry',   sets: 3, reps: null, duration: Math.round(40 * v) + 's', unit: null },
        { name: 'Plank',          sets: 3, reps: null, duration: Math.round(45 * v) + 's', unit: null },
      ],
    };
  }
  return {
    type: 'gym', focus: 'Operator Strength',
    exercises: [
      { name: 'Bench Press',       sets, reps, weight: ww(baselines.bench, i),         unit: u },
      { name: 'Weighted Pull-ups', sets, reps: Math.round(reps * 0.7), weight: null,   unit: null },
      { name: 'Bent-over Row',     sets, reps, weight: ww(baselines.row, i),           unit: u },
      { name: 'Hanging Leg Raise', sets: 3, reps: 12, weight: null,                    unit: null },
    ],
  };
}

// --- Run session generator ---
function runSession(profile, phase) {
  const pacePerKm = profile.baselines.run2400s / 2.4;
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}/km`;
  const v = phase.volumeMult;

  if (phase.name === 'Deload') return {
    type: 'run', label: 'Easy Run',
    distance: Math.round(3 * v * 10) / 10,
    pace: fmt(pacePerKm * 1.25),
    notes: 'Conversational pace. Focus on form.',
  };
  if (phase.name === 'Peak') return {
    type: 'run', label: 'Interval Run',
    intervals: [{ reps: 6, distance: '400m', targetPace: fmt(pacePerKm * 0.88), rest: '90s' }],
    warmup: '1km easy', cooldown: '1km easy',
  };
  if (phase.name === 'Intensify') return {
    type: 'run', label: 'Tempo Run',
    distance: Math.round(5 * v * 10) / 10,
    pace: fmt(pacePerKm * (1 / phase.intensityMult)),
    notes: 'Comfortably hard.',
  };
  return {
    type: 'run', label: 'Base Run',
    distance: Math.round(4 * v * 10) / 10,
    pace: fmt(pacePerKm * 1.15),
    notes: 'Easy aerobic effort.',
  };
}

// --- Swim session generator ---
function swimSession(profile, phase) {
  const pacePer100 = profile.baselines.swim400s / 4;
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}/100m`;
  const totalMetres = Math.round(1200 * phase.volumeMult / 100) * 100;

  return {
    type: 'swim',
    label: phase.name === 'Deload' ? 'Recovery Swim' : 'Endurance Swim',
    totalMetres,
    sets: [
      { desc: `${Math.round(totalMetres * 0.15)}m warm-up`,  pace: fmt(pacePer100 * 1.3) },
      { desc: `${Math.round(totalMetres * 0.70)}m main set`, pace: fmt(pacePer100 * (1 / phase.intensityMult)) },
      { desc: `${Math.round(totalMetres * 0.15)}m cool-down`,pace: fmt(pacePer100 * 1.3) },
    ],
  };
}

// --- Ruck session generator ---
function ruckSession(profile, phase) {
  const { ruckPaceMinKm, ruckLoadKg } = profile.baselines;
  const distance = Math.round(6 * phase.volumeMult * 10) / 10;
  const load = phase.name === 'Peak' ? Math.round(ruckLoadKg * 1.1)
    : phase.name === 'Deload' ? Math.round(ruckLoadKg * 0.7)
    : ruckLoadKg;
  const paceTarget = ruckPaceMinKm * (phase.name === 'Peak' ? 0.92 : 1.0);
  const fmt = (m) => `${Math.floor(m)}:${String(Math.round((m % 1) * 60)).padStart(2, '0')}/km`;

  return {
    type: 'ruck',
    label: phase.name === 'Deload' ? 'Recovery Ruck' : phase.name === 'Peak' ? 'Peak Ruck' : 'Loaded March',
    distance, load,
    loadUnit: profile.unit === 'lbs' ? 'lbs' : 'kg',
    targetPace: fmt(paceTarget),
  };
}

// --- Main generator ---
export function generatePlan(profile) {
  const schedule = profile.schedule || {
    mon: { am: true, pm: false }, tue: { am: false, pm: false },
    wed: { am: true, pm: false }, thu: { am: false, pm: false },
    fri: { am: true, pm: false }, sat: { am: false, pm: false },
    sun: { am: false, pm: false },
  };

  const slots = getScheduleSlots(schedule);
  const sessionsPerWeek = slots.length;
  const rotation = buildRotation(sessionsPerWeek, profile.focus);
  const monday = getAnchorMonday(profile);

  let gymIdx = 0;
  const weeks = [];

  PHASES.forEach((phase) => {
    const sessions = slots.map((slot, slotIdx) => {
      const discipline = rotation[slotIdx % rotation.length];
      let workout;
      if (discipline === 'gym')  workout = profile.focus === 'operator' ? operatorGymSession(profile, phase, gymIdx++) : gymSession(profile, phase, gymIdx++);
      else if (discipline === 'run')  workout = runSession(profile, phase);
      else if (discipline === 'swim') workout = swimSession(profile, phase);
      else if (discipline === 'ruck') workout = ruckSession(profile, phase);

      return {
        id: `w${phase.week}s${slotIdx + 1}`,
        week: phase.week,
        day: slot.day,
        slot: slot.slot,
        date: slotDate(monday, phase.week - 1, slot.dayOffset),
        discipline,
        workout,
        status: 'pending',
      };
    });

    weeks.push({ ...phase, sessions });
  });

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    profile,
    weeks,
  };
}

export function rebuildFromToday(plan, fromSessionId) {
  const allSessions = plan.weeks.flatMap(w => w.sessions);
  const idx = allSessions.findIndex(s => s.id === fromSessionId);
  if (idx < 0) return plan;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get the schedule slots to know the day offsets
  const slots = getScheduleSlots(plan.profile.schedule || {});
  const monday = new Date(today);
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);

  // Re-date remaining sessions from this week's Monday
  const remaining = allSessions.slice(idx);
  const weeksNeeded = Math.ceil(remaining.length / slots.length);
  let sessionI = 0;
  for (let w = 0; w < weeksNeeded; w++) {
    for (let s = 0; s < slots.length && sessionI < remaining.length; s++, sessionI++) {
      const slot = slots[s];
      const d = new Date(monday);
      d.setDate(monday.getDate() + w * 7 + slot.dayOffset);
      remaining[sessionI].date = d.toISOString().split('T')[0];
    }
  }

  storage.setPlan(plan);
  return plan;
}
