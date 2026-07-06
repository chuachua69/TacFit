import { useState } from 'react';
import BottomNav from '../components/BottomNav';
import { PROGRAM, DAY_LABEL, todayKey, dayFor, sessionLogId } from '../lib/wodProgram';
import { store } from '../store/profile';
import { fxCount } from '../lib/feedback';

const TRAINING_DAYS = PROGRAM.map(d => d.day);

export default function Wod() {
  const tk = todayKey();
  // Default to today if it's a training day, else the first training day.
  const [activeDay, setActiveDay] = useState(TRAINING_DAYS.includes(tk) ? tk : TRAINING_DAYS[0]);
  const [, setRefresh] = useState(0);
  const today = new Date().toISOString().split('T')[0];
  const day = dayFor(activeDay);

  const toggle = (slot, title) => {
    const logId = sessionLogId(today, activeDay, slot);
    store.toggleWod({ logId, day: activeDay, slot, title, dayLabel: DAY_LABEL[activeDay] });
    fxCount();
    setRefresh(r => r + 1);
  };

  return (
    <div className="screen" style={{ paddingTop: '1.25rem', paddingBottom: '6rem', gap: '1rem' }}>
      <div>
        <div style={{ fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.02em', color: 'var(--accent)' }}>WOD</div>
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Training built for the assessment</div>
      </div>

      {/* Day selector */}
      <div style={{ display: 'flex', gap: 8 }}>
        {PROGRAM.map(d => {
          const isToday = d.day === tk;
          const active = d.day === activeDay;
          return (
            <button key={d.day} onClick={() => setActiveDay(d.day)}
              style={{
                flex: 1, padding: '0.6rem 0', borderRadius: 'var(--radius)', fontWeight: 700, fontSize: '0.85rem',
                background: active ? 'var(--accent)20' : 'var(--bg-card)',
                border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                position: 'relative',
              }}>
              {DAY_LABEL[d.day]}
              {isToday && <span style={{ display: 'block', fontSize: '0.55rem', color: active ? 'var(--accent)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>today</span>}
            </button>
          );
        })}
      </div>

      {/* Sessions for the selected day */}
      {day.sessions.map(session => {
        const logId = sessionLogId(today, activeDay, session.slot);
        const done = store.isWodDone(logId);
        return (
          <div key={session.slot} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, border: `1px solid ${done ? 'var(--success)45' : 'var(--border)'}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {session.slot === 'am' ? '🌅 AM' : '🌙 PM'}
                  </span>
                </div>
                <div style={{ fontWeight: 800, marginTop: 2 }}>{session.title}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--accent)', marginTop: 1 }}>{session.focus}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {session.exercises.map((ex, i) => (
                <div key={i} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)', paddingTop: i === 0 ? 0 : 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{ex.name}</span>
                    <span style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--accent)', whiteSpace: 'nowrap' }}>{ex.scheme}</span>
                  </div>
                  {ex.note && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{ex.note}</div>}
                </div>
              ))}
            </div>

            {session.emom && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', background: 'var(--bg-elevated)', borderRadius: 8, padding: '0.6rem 0.75rem' }}>
                ⏱ EMOM · repeat the 5-minute block ×{session.emom.rounds} under fatigue
              </div>
            )}

            <button onClick={() => toggle(session.slot, session.title)}
              className={`btn ${done ? 'btn-secondary' : 'btn-primary'}`}>
              {done ? '✓ Completed — tap to undo' : 'Mark Session Done'}
            </button>
          </div>
        );
      })}

      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
        Tue · Thu · weekend = recovery. Log the actual assessment under the <strong>Test</strong> tab.
      </div>

      <BottomNav active="wod" />
    </div>
  );
}
