import { useState } from 'react';
import { storage } from '../store/storage';
import { sessionToEvent, downloadICS, gcalLink } from '../lib/icsExport';

const DISC_EMOJI = { run: '🏃', swim: '🏊', ruck: '🎒', gym: '🏋️' };

/** Review & adjust a week's session times, then export to calendar. */
export default function WeekExport({ week, onClose }) {
  const profile = storage.getProfile();
  const [events, setEvents] = useState(() =>
    week.sessions.map(s => sessionToEvent(s, profile)));

  const setTime = (id, time) => setEvents(evs => evs.map(e => (e.id === id ? { ...e, time } : e)));
  const fmtDate = d => new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 240, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: '20px 20px 0 0', padding: '1.5rem', width: '100%', maxWidth: 480, margin: '0 auto', borderTop: '1px solid var(--border)', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 999, margin: '0 auto 1.25rem' }} />

        <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 2 }}>Export Week {week.week}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Adjust each session's time, then download the week (.ics) or add events to Google Calendar.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1rem' }}>
          {events.map(ev => (
            <div key={ev.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '0.6rem 0.75rem', background: 'var(--bg-elevated)',
              border: '1px solid var(--border)', borderRadius: 10,
            }}>
              <span style={{ fontSize: '1.2rem' }}>{DISC_EMOJI[ev.discipline] || '🎯'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ev.summary.replace(/^[^ ]+ /, '')}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{fmtDate(ev.date)} · {ev.slot === 'pm' ? 'Evening' : 'Morning'}</div>
              </div>
              <input type="time" value={ev.time} onChange={e => setTime(ev.id, e.target.value)}
                style={{ width: 96, padding: '0.35rem 0.4rem', fontSize: '0.85rem' }} />
              <a href={gcalLink(ev)} target="_blank" rel="noreferrer"
                title="Add to Google Calendar"
                style={{ flexShrink: 0, fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)', border: '1px solid var(--accent)55', borderRadius: 8, padding: '0.35rem 0.5rem', textDecoration: 'none' }}>
                ＋ GCal
              </a>
            </div>
          ))}
        </div>

        <button className="btn btn-primary" onClick={() => downloadICS(events, `tacfit-week-${week.week}.ics`)}>
          📅 Download Week (.ics)
        </button>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '8px 0 4px', textAlign: 'center' }}>
          “＋ GCal” opens a pre-filled Google event for one session · the .ics imports the whole week.
        </div>
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
