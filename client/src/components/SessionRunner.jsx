import { useState } from 'react';
import RestTimer from './RestTimer';
import EmomTimer from './EmomTimer';
import { parseScheme } from '../lib/wodProgram';
import { store } from '../store/profile';
import { fxCount } from '../lib/feedback';

const round = (v) => Math.round(v / 2.5) * 2.5;

// Build initial set rows for an exercise from its scheme + weight memory.
function initExercise(ex, profile, memory) {
  const { sets, reps } = parseScheme(ex.scheme);
  const target = ex.kind === 'weight'
    ? (ex.targetPct && profile.bodyweight ? round(profile.bodyweight * ex.targetPct) : (memory[ex.name] || null))
    : null;
  return {
    ...ex,
    rows: Array.from({ length: sets }, () => ({
      weight: target, reps, rpe: null, done: false,
    })),
  };
}

function NumCell({ value, onChange, placeholder }) {
  return (
    <input type="number" inputMode="numeric" placeholder={placeholder} value={value ?? ''}
      onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
      style={{ width: '100%', padding: '0.45rem 0.25rem', fontSize: '0.9rem', textAlign: 'center', fontWeight: 600 }} />
  );
}

export default function SessionRunner({ session, dayLabel, logId, profile, existing, onClose, onComplete }) {
  const memory = store.getExMemory();
  const [exercises, setExercises] = useState(() =>
    existing?.exercises?.length
      ? existing.exercises
      : session.exercises.map(ex => initExercise(ex, profile, memory)),
  );
  const [resting, setResting] = useState(false);
  const [emom, setEmom] = useState(false);
  const unit = profile.unit || 'kg';

  const update = (ei, si, field, val) => {
    setExercises(prev => prev.map((ex, i) => i !== ei ? ex : {
      ...ex, rows: ex.rows.map((r, j) => j !== si ? r : { ...r, [field]: val }),
    }));
  };

  const toggleDone = (ei, si) => {
    const wasDone = exercises[ei].rows[si].done;
    update(ei, si, 'done', !wasDone);
    if (!wasDone) { fxCount(); if (exercises[ei].kind !== 'check') setResting(true); }
  };

  const doneCount = exercises.reduce((n, ex) => n + ex.rows.filter(r => r.done).length, 0);
  const totalSets = exercises.reduce((n, ex) => n + ex.rows.length, 0);

  const complete = () => {
    // Remember the top weight used per weighted exercise
    const weights = {};
    exercises.forEach(ex => {
      if (ex.kind === 'weight') {
        const top = Math.max(0, ...ex.rows.map(r => Number(r.weight) || 0));
        if (top > 0) weights[ex.name] = top;
      }
    });
    if (Object.keys(weights).length) store.rememberWeights(weights);
    onComplete({ logId, title: session.title, slot: session.slot, dayLabel, exercises, doneCount, totalSets });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--bg)', overflowY: 'auto' }}>
      <div className="screen" style={{ paddingTop: '1rem', paddingBottom: '7rem', gap: '1rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {dayLabel} · {session.slot === 'am' ? 'AM' : 'PM'}
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>{session.title}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent)' }}>{session.focus}</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ fontSize: '1.5rem', color: 'var(--text-muted)', lineHeight: 1, padding: '0 0.25rem' }}>✕</button>
        </div>

        {session.emom && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', background: 'var(--accent)12', border: '1px solid var(--accent)33', borderRadius: 'var(--radius)', padding: '0.6rem 0.85rem' }}>
              ⏱ EMOM — start each movement on the minute; repeat the 5-min block ×{session.emom.rounds}.
            </div>
            <button className="btn btn-primary" onClick={() => setEmom(true)}>▶ Run EMOM Timer</button>
          </div>
        )}

        {/* Exercises */}
        {exercises.map((ex, ei) => (
          <div key={ei} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontWeight: 700 }}>{ex.name}</span>
              <span style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--accent)', whiteSpace: 'nowrap' }}>{ex.scheme}</span>
            </div>
            {ex.note && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: -4, lineHeight: 1.4 }}>{ex.note}</div>}
            {ex.kind === 'weight' && ex.targetPct && profile.bodyweight > 0 && (
              <div style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 600 }}>🎯 Target ≈ {round(profile.bodyweight * ex.targetPct)} {unit}</div>
            )}

            {/* Column headers */}
            {ex.kind !== 'check' && (
              <div style={{ display: 'grid', gridTemplateColumns: ex.kind === 'weight' ? '28px 1fr 1fr 1fr 40px' : '28px 1fr 1fr 40px', gap: 8, fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, padding: '0 2px' }}>
                <span>Set</span>
                {ex.kind === 'weight' && <span style={{ textAlign: 'center' }}>{unit}</span>}
                <span style={{ textAlign: 'center' }}>Reps</span>
                <span style={{ textAlign: 'center' }}>RPE</span>
                <span />
              </div>
            )}

            {/* Set rows */}
            {ex.rows.map((row, si) => (
              <div key={si} style={{
                display: 'grid',
                gridTemplateColumns: ex.kind === 'check' ? '28px 1fr 40px' : ex.kind === 'weight' ? '28px 1fr 1fr 1fr 40px' : '28px 1fr 1fr 40px',
                gap: 8, alignItems: 'center', opacity: row.done ? 0.55 : 1,
              }}>
                <span style={{ fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>{si + 1}</span>
                {ex.kind === 'check' && <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>{ex.scheme}</span>}
                {ex.kind === 'weight' && <NumCell value={row.weight} onChange={v => update(ei, si, 'weight', v)} placeholder="0" />}
                {ex.kind !== 'check' && <NumCell value={row.reps} onChange={v => update(ei, si, 'reps', v)} placeholder={ex.kind === 'reps' ? 'max' : '0'} />}
                {ex.kind !== 'check' && <NumCell value={row.rpe} onChange={v => update(ei, si, 'rpe', v)} placeholder="–" />}
                <button onClick={() => toggleDone(ei, si)} aria-label="toggle set done"
                  style={{
                    width: 34, height: 34, borderRadius: 8, fontSize: '1rem', fontWeight: 800,
                    background: row.done ? 'var(--success)' : 'var(--bg-elevated)',
                    color: row.done ? '#000' : 'var(--text-muted)',
                    border: `1px solid ${row.done ? 'var(--success)' : 'var(--border)'}`,
                  }}>✓</button>
              </div>
            ))}
          </div>
        ))}

        {resting && <RestTimer start={90} onDismiss={() => setResting(false)} />}
        {emom && <EmomTimer session={session} onClose={() => setEmom(false)} />}
      </div>

      {/* Sticky footer */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg-card)', borderTop: '1px solid var(--border)', padding: `0.85rem 1.25rem calc(0.85rem + env(safe-area-inset-bottom))`, display: 'flex', gap: 8, maxWidth: 480, margin: '0 auto' }}>
        <button className="btn btn-secondary" style={{ width: 'auto', padding: '0.75rem 1rem' }} onClick={() => setResting(true)}>⏱ Rest</button>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={complete}>
          Complete Session · {doneCount}/{totalSets}
        </button>
      </div>
    </div>
  );
}
