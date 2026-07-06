import { useState } from 'react';
import BottomNav from '../components/BottomNav';
import SessionRunner from '../components/SessionRunner';
import { PROGRAM, DAY_LABEL, todayKey, dayFor, sessionLogId, dateForDayKey } from '../lib/wodProgram';
import { store } from '../store/profile';
import { fxCount } from '../lib/feedback';

const TYPE_BADGE = {
  lift: { label: 'Strength', color: 'var(--gym)' },
  conditioning: { label: 'Conditioning', color: 'var(--ruck)' },
  mobility: { label: 'Mobility', color: 'var(--swim)' },
  run: { label: 'Run', color: 'var(--run)' },
  rest: { label: 'Rest', color: 'var(--text-muted)' },
};

function SessionCard({ session, dayKey, onRun, onRefresh }) {
  const date = dateForDayKey(dayKey);
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

  // Runnable session → whole card opens the workout runner
  if (runnable) {
    return (
      <button className="card" onClick={() => onRun(session, dayKey)}
        style={{ width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10, border: `1px solid ${done ? 'var(--success)45' : 'var(--border)'}` }}>
        {header}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{session.exercises.length} exercises</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: done ? 'var(--success)' : 'var(--accent)' }}>
            {done ? '✓ Logged — tap to edit' : 'Start ▶'}
          </span>
        </div>
      </button>
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

export default function Wod() {
  const tk = todayKey();
  const [view, setView] = useState('today'); // 'today' | 'week'
  const [running, setRunning] = useState(null); // { session, dayKey }
  const [, setRefresh] = useState(0);
  const bump = () => setRefresh(r => r + 1);

  const openRunner = (session, dayKey) => setRunning({ session, dayKey });

  const completeSession = (result) => {
    const { session, dayKey } = running;
    const date = dateForDayKey(dayKey);
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
  const todayDay = dayFor(tk);

  return (
    <div className="screen" style={{ paddingTop: '1.25rem', paddingBottom: '6rem', gap: '1rem' }}>
      {/* Clickable title toggles today ↔ week */}
      <button onClick={() => setView(v => (v === 'today' ? 'week' : 'today'))}
        style={{ textAlign: 'left', padding: 0, display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.02em', color: 'var(--accent)' }}>WOD</span>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {view === 'today' ? 'Today · tap for full week ›' : '‹ tap for today'}
        </span>
      </button>

      {view === 'today' ? (
        <>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>
            {todayDay.label} · {todayDay.sessions.length} session{todayDay.sessions.length === 1 ? '' : 's'}
          </div>
          {todayDay.sessions.map(s => (
            <SessionCard key={s.slot} session={s} dayKey={tk} onRun={openRunner} onRefresh={bump} />
          ))}
        </>
      ) : (
        PROGRAM.map(d => (
          <div key={d.day} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: d.day === tk ? 'var(--accent)' : 'var(--text)' }}>{d.label}</span>
              {d.day === tk && <span style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)' }}>today</span>}
            </div>
            {d.sessions.map(s => (
              <SessionCard key={s.slot} session={s} dayKey={d.day} onRun={openRunner} onRefresh={bump} />
            ))}
          </div>
        ))
      )}

      {running && (
        <SessionRunner
          session={running.session}
          dayLabel={DAY_LABEL[running.dayKey]}
          logId={sessionLogId(dateForDayKey(running.dayKey), running.dayKey, running.session.slot)}
          profile={profile}
          existing={store.getWodLog(sessionLogId(dateForDayKey(running.dayKey), running.dayKey, running.session.slot))}
          onClose={() => setRunning(null)}
          onComplete={completeSession}
        />
      )}

      <BottomNav active="wod" />
    </div>
  );
}
