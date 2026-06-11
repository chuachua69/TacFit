/**
 * Generate an iCalendar (.ics) file from the training plan so it can be
 * imported into Google / Apple / Outlook calendars. No backend needed.
 * Slot times default to AM 07:00 and PM 18:00 (90-min blocks); users can
 * shift individual events in their calendar app afterwards.
 */
const DISC_EMOJI = { run: '🏃', swim: '🏊', ruck: '🎒', gym: '🏋️' };
const SLOT_START = { am: { h: 7, m: 0 }, pm: { h: 18, m: 0 } };
const DURATION_MIN = 90;

const pad = n => String(n).padStart(2, '0');
const esc = s => String(s || '').replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');

function localStamp(dateStr, h, m) {
  const [y, mo, d] = dateStr.split('-');
  return `${y}${mo}${d}T${pad(h)}${pad(m)}00`;
}

function addMinutes(dateStr, h, m, add) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, mo - 1, d, h, m + add);
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
}

function describe(workout) {
  if (!workout) return '';
  if (workout.type === 'gym') return `${workout.focus} — ${(workout.exercises || []).map(e => e.name).join(', ')}`;
  if (workout.type === 'run') return workout.distance ? `${workout.distance} km @ ${workout.pace}` : 'Interval run';
  if (workout.type === 'swim') return `${workout.totalMetres} m`;
  if (workout.type === 'ruck') return `${workout.distance} km · ${workout.load}${workout.loadUnit} @ ${workout.targetPace}`;
  return '';
}

export function buildICS(plan) {
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TacFit//Training Plan//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:TacFit Training',
  ];

  const sessions = (plan?.weeks || []).flatMap(w => w.sessions);
  sessions.forEach(s => {
    const slot = SLOT_START[s.slot] || SLOT_START.am;
    const emoji = DISC_EMOJI[s.discipline] || '🎯';
    const title = s.workout?.label || s.workout?.focus || 'Session';
    lines.push(
      'BEGIN:VEVENT',
      `UID:tacfit-${s.id}@tacfit.app`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${localStamp(s.date, slot.h, slot.m)}`,
      `DTEND:${addMinutes(s.date, slot.h, slot.m, DURATION_MIN)}`,
      `SUMMARY:${esc(`${emoji} ${s.discipline.toUpperCase()} — ${title}`)}`,
      `DESCRIPTION:${esc(`Week ${s.week} · ${describe(s.workout)}`)}`,
      'END:VEVENT',
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadICS(plan, filename = 'tacfit-plan.ics') {
  const blob = new Blob([buildICS(plan)], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
