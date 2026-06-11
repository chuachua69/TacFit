/**
 * Calendar helpers — turn plan sessions into editable events, then export as
 * an iCalendar (.ics) file or a Google Calendar "add event" link. Fully
 * client-side, no backend. Session times come from the user's AM/PM prefs
 * (or 07:00 / 18:00 defaults) and can be overridden per event before export.
 */
const DISC_EMOJI = { run: '🏃', swim: '🏊', ruck: '🎒', gym: '🏋️' };
export const DEFAULT_TIMES = { am: '07:00', pm: '18:00' };
const DURATION_MIN = 90;

const pad = n => String(n).padStart(2, '0');
const esc = s => String(s || '').replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');

// 'YYYY-MM-DD' + 'HH:MM' -> 'YYYYMMDDTHHMMSS' (local, floating time)
function stamp(dateStr, time) {
  const [y, mo, d] = dateStr.split('-');
  const [h, m] = (time || '07:00').split(':');
  return `${y}${mo}${d}T${pad(h)}${pad(m)}00`;
}
function endStamp(dateStr, time, durationMin) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [h, m] = (time || '07:00').split(':').map(Number);
  const dt = new Date(y, mo - 1, d, h, m + durationMin);
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

export function sessionTime(slot, profile) {
  if (slot === 'pm') return profile?.pmTime || DEFAULT_TIMES.pm;
  return profile?.amTime || DEFAULT_TIMES.am;
}

// Build an editable event object from a plan session
export function sessionToEvent(s, profile, timeOverride) {
  const emoji = DISC_EMOJI[s.discipline] || '🎯';
  const title = s.workout?.label || s.workout?.focus || 'Session';
  return {
    id: s.id,
    uid: `tacfit-${s.id}@tacfit.app`,
    discipline: s.discipline,
    date: s.date,
    slot: s.slot,
    time: timeOverride || sessionTime(s.slot, profile),
    durationMin: DURATION_MIN,
    summary: `${emoji} ${s.discipline.toUpperCase()} — ${title}`,
    description: `Week ${s.week} · ${describe(s.workout)}`,
  };
}

export function planToEvents(plan, profile) {
  return (plan?.weeks || []).flatMap(w => w.sessions).map(s => sessionToEvent(s, profile));
}

export function buildICS(events) {
  const now = new Date();
  const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TacFit//Training Plan//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:TacFit Training',
  ];
  events.forEach(ev => {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${ev.uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${stamp(ev.date, ev.time)}`,
      `DTEND:${endStamp(ev.date, ev.time, ev.durationMin)}`,
      `SUMMARY:${esc(ev.summary)}`,
      `DESCRIPTION:${esc(ev.description)}`,
      'END:VEVENT',
    );
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadICS(events, filename = 'tacfit-plan.ics') {
  const blob = new Blob([buildICS(events)], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

// One-click "Add to Google Calendar" link (opens a pre-filled event)
export function gcalLink(ev) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.summary,
    details: ev.description,
    dates: `${stamp(ev.date, ev.time)}/${endStamp(ev.date, ev.time, ev.durationMin)}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
