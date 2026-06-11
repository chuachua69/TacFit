/**
 * Replace the final Deload week with a tapered, grouped multi-day test block.
 * Events are split across days so nothing is maxed under fatigue:
 *   2 taper/light days → then grouped test days → leftover days = rest.
 * Test-day sessions link out to the Operator / Baseline logging pages.
 */
export const TEST_DAYS = {
  operator: [
    { title: 'Test Day 1 · Power', events: ['Hip to Overhead (Clean & Press) — 2:30', 'Alternate Leg Lunges — 2:30'] },
    { title: 'Test Day 2 · Upper Max', events: ['Bench Press @ bodyweight — max reps', 'Weighted Pull-Ups — max reps'] },
    { title: 'Test Day 3 · Conditioning', events: ['Shuttle Sprints — 4 × 90s (60s rest)'] },
  ],
  baseline: [
    { title: 'Test Day 1 · Lower', events: ['Back Squat — heavy single/triple', 'Deadlift — heavy single/triple'] },
    { title: 'Test Day 2 · Upper', events: ['Bench Press', 'Overhead Press', 'Bent-over Row', 'Pull-ups — max'] },
    { title: 'Test Day 3 · Cardio', events: ['2.4km Run', '400m Swim', 'Ruck pace check'] },
  ],
};

export function scheduleTestBlock(plan, kind) {
  const days = TEST_DAYS[kind] || TEST_DAYS.operator;
  const link = kind === 'operator' ? '/operator' : '/baseline';
  const weeks = plan.weeks.map(w => ({ ...w, sessions: w.sessions.map(s => ({ ...s })) }));
  const wk = weeks[weeks.length - 1]; // Deload = last week

  // distinct calendar days (in date order) that have a slot
  const seen = new Set();
  const dayDates = [];
  [...wk.sessions].sort((a, b) => a.date.localeCompare(b.date)).forEach(s => {
    if (!seen.has(s.date)) { seen.add(s.date); dayDates.push({ date: s.date, day: s.day }); }
  });

  const testCount = days.length;
  const taperCount = Math.max(0, Math.min(2, dayDates.length - testCount));

  const sessions = dayDates.map((dd, i) => {
    const base = { id: `w${wk.week}t${i}`, week: wk.week, day: dd.day, slot: 'am', date: dd.date, discipline: 'test', status: 'pending' };
    if (i < taperCount) {
      return { ...base, workout: { type: 'test', phase: 'taper', title: 'Taper / Light', notes: 'Easy movement, mobility & good sleep — keep it light before testing.' } };
    }
    const di = i - taperCount;
    if (di < testCount) {
      const d = days[di];
      return { ...base, workout: { type: 'test', phase: 'test', testKind: kind, title: d.title, events: d.events, link } };
    }
    return { ...base, workout: { type: 'test', phase: 'rest', title: 'Rest', notes: 'Recover before/after testing.' } };
  });

  wk.name = kind === 'operator' ? 'Operator Test' : 'Baseline Test';
  wk.sessions = sessions;
  return { ...plan, weeks };
}
