import { useState } from 'react';
import BottomNav from '../components/BottomNav';
import SessionRunner from '../components/SessionRunner';
import { PROGRAM, DAY_LABEL, todayKey, tomorrowKey, dayFor, sessionLogId, dateForDayKey } from '../lib/wodProgram';
import { store } from '../store/profile';
import { fxCount, fxUncount } from '../lib/feedback';

const TYPE_BADGE = {
  lift: { label: 'Strength', color: 'var(--gym)' },
  conditioning: { label: 'Conditioning', color: 'var(--ruck)' },
  mobility: { label: 'Mobility', color: 'var(--swim)' },
  run: { label: 'Run', color: 'var(--run)' },
  rest: { label: 'Rest', color: 'var(--text-muted)' },
};

function SessionCard({ session, dayKey, date, onRun, onRefresh }) {
  const logId = sessionLogId(date, dayKey, session.slot);
  const done = store.isWodDone(logId);
  const badge = TYPE_BADGE[session.type] || TYPE_BADGE.lift;
  const runnable = session.exercises && session.exercises.length > 0;

  const slotTag = <span style={{ fontSize: '0.66rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
    {session.slot === 'am' ? '🌅 AM' : '🌙 PM'}{session.optional ? ' · optional' : ''}
  </span>;

  const header = (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
      <div>
        {slotTag}
        <div style={{ fontWeight: 800, marginTop: 2 }}>{session.title}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--accent)', marginTop: 1 }}>{session.focus}</div>
      </div>
      <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 8px', borderRadius: 999, background: `color-mix(in srgb, ${badge.color} 18%, transparent)`, color: badge.color, border: `1px solid color-mix(in srgb, ${badge.color} 45%, transparent)`, whiteSpace: 'nowrap' }}>
        {badge.label}
      </span>
    </div>
  );

  // Runnable session → clickable region opens the runner; done state gets an undo
  if (runnable) {
    const undo = () => { store.removeWod(logId); fxUncount(); onRefresh(); };
    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10, border: `1px solid ${done ? 'var(--success)45' : 'var(--border)'}` }}>
        <div role="button" tabIndex={0} onClick={() => onRun(session, dayKey, date)}
          style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {header}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{session.exercises.length} exercises</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: done ? 'var(--success)' : 'var(--accent)' }}>
              {done ? '✓ Logged — tap to edit' : 'Start ▶'}
            </span>
          </div>
        </div>
        {done && (
          <button onClick={undo}
            style={{ alignSelf: 'flex-end', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 999, padding: '0.3rem 0.8rem' }}>
            ✕ Undo log
          </button>
        )}
      </div>
    );
  }

  // Run session → follow-own-programme + mark done
  if (session.type === 'run') {
    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10, border: `1px solid ${done ? 'var(--success)45' : 'var(--border)'}` }}>
        {header}
        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', background: 'var(--bg-elevated)', borderRadius: 8, padding: '0.6rem 0.85rem' }}>
          🏃 Follow your own run programme
        </div>
        <button className={`btn ${done ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => { store.toggleWod({ logId, day: dayKey, slot: session.slot, title: session.title, type: 'run', dayLabel: DAY_LABEL[dayKey] }); fxCount(); onRefresh(); }}>
          {done ? '✓ Done — tap to undo' : 'Mark Done'}
        </button>
      </div>
    );
  }

  // Rest session → static
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: 0.85 }}>
      <span style={{ fontSize: '1.4rem' }}>😴</span>
      <div>
        <div style={{ fontWeight: 700 }}>{session.title}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Recover — you've earned it.</div>
      </div>
    </div>
  );
}

const isoOffset = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; };

export default function Wod() {
  const tk = todayKey();
  const tmk = tomorrowKey();
  const [view, setView] = useState('today'); // 'today' | 'tomorrow' | 'week'
  const [running, setRunning] = useState(null); // { session, dayKey, date }
  const [, setRefresh] = useState(0);
  const bump = () => setRefresh(r => r + 1);

  const openRunner = (session, dayKey, date) => setRunning({ session, dayKey, date });

  const completeSession = (result) => {
    const { session, dayKey, date } = running;
    store.saveWodSession({
      logId: sessionLogId(date, dayKey, session.slot),
      day: dayKey, slot: session.slot, title: session.title, type: session.type,
      dayLabel: DAY_LABEL[dayKey], exercises: result.exercises,
      doneCount: result.doneCount, totalSets: result.totalSets,
    });
    setRunning(null);
    bump();
  };

  const profile = store.getProfile();

  return (
    <div className="screen" style={{ paddingTop: '1.25rem', paddingBottom: '6rem', gap: '1rem' }}>
      {/* Title + Tdy / Tmr / Week toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.02em', color: 'var(--accent)' }}>WOD</div>
        <div style={{ display: 'flex', gap: 3, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 999, padding: 3 }}>
          {[['today', 'Tdy'], ['tomorrow', 'Tmr'], ['week', 'Week']].map(([v, label]) => (
            <button key={v} onClick={() => setView(v)}
              style={{
                padding: '0.4rem 0.85rem', borderRadius: 999, fontSize: '0.8rem', fontWeight: 700,
                background: view === v ? 'var(--accent)' : 'transparent',
                color: view === v ? '#000' : 'var(--text-muted)',
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'week' ? (
        PROGRAM.map(d => (
          <div key={d.day} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: d.day === tk ? 'var(--accent)' : 'var(--text)' }}>{d.label}</span>
              {d.day === tk && <span style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)' }}>today</span>}
            </div>
            {d.sessions.map(s => (
              <SessionCard key={s.slot} session={s} dayKey={d.day} date={dateForDayKey(d.day)} onRun={openRunner} onRefresh={bump} />
            ))}
          </div>
        ))
      ) : (() => {
        const dayKey = view === 'today' ? tk : tmk;
        const date = view === 'today' ? isoOffset(0) : isoOffset(1);
        const dayObj = dayFor(dayKey);
        return (
          <>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>
              {view === 'tomorrow' ? 'Tomorrow · ' : ''}{dayObj.label} · {dayObj.sessions.length} session{dayObj.sessions.length === 1 ? '' : 's'}
            </div>
            {dayObj.sessions.map(s => (
              <SessionCard key={s.slot} session={s} dayKey={dayKey} date={date} onRun={openRunner} onRefresh={bump} />
            ))}
          </>
        );
      })()}

      {running && (
        <SessionRunner
          session={running.session}
          dayLabel={DAY_LABEL[running.dayKey]}
          logId={sessionLogId(running.date, running.dayKey, running.session.slot)}
          profile={profile}
          existing={store.getWodLog(sessionLogId(running.date, running.dayKey, running.session.slot))}
          onClose={() => setRunning(null)}
          onComplete={completeSession}
        />
      )}

      <BottomNav active="wod" />
    </div>
  );
}
