import { useState, useEffect } from 'react';
import RestTimer from './RestTimer';
import EmomTimer from './EmomTimer';
import ActiveSetTimer from './ActiveSetTimer';
import { parseScheme } from '../lib/wodProgram';
import { store } from '../store/profile';
import { fxCount } from '../lib/feedback';
import { pushGuard } from '../lib/guard';

const round = (v) => Math.round(v / 2.5) * 2.5;

// Function to extract time duration from a scheme string
const getSchemeDuration = (scheme) => {
  if (!scheme) return null;
  const secMatch = scheme.match(/(\d+)\s*s/i);
  if (secMatch) return parseInt(secMatch[1]);
  const minMatch = scheme.match(/(\d+)\s*min/i);
  if (minMatch) return parseInt(minMatch[1]) * 60;
  if (/max\s*time/i.test(scheme)) return 60; // default 60s for max time
  return null;
};

const RECOMMENDATIONS = {
  'Sled Push (Heavy)': ['Kettlebell Swings', 'Heavy Goblet Squat', 'Sandbag Carry', 'Leg Press'],
  'Dead Hang': ['Active Pull-Up Hang', 'Chin-Up Hang', 'Barbell Hold (Heavy)'],
  'Weighted Plank': ['Standard Plank', 'Ab Wheel Rollouts', 'Hanging Knee Raise Hold'],
  "Farmer's Carry": ['Kettlebell Suitcase Carry', 'Dumbbell Farmer\'s Walk', 'Sandbag Bear Hug Carry'],
  'Back Squat': ['Front Squat', 'Goblet Squat', 'Barbell Box Squat', 'Leg Press'],
  'Bench Press': ['Dumbbell Press', 'Floor Press', 'Push-Ups (Weighted)'],
  'Overhead Press': ['Dumbbell Shoulder Press', 'Kettlebell Press', 'Pike Push-Ups'],
  'Deadlift': ['Trap Bar Deadlift', 'Romanian Deadlift (RDL)', 'Kettlebell Deadlift (Heavy)'],
  'Weighted Pull-Ups': ['Lat Pulldowns', 'Inverted Rows', 'Band-Assisted Pull-Ups'],
  'Strict Bodyweight Pull-Ups': ['Inverted Rows', 'Band-Assisted Pull-Ups', 'Lat Pulldowns'],
};

const ALL_EXERCISES = [
  'Back Squat', 'Bench Press', 'Weighted Pull-Ups', 'Bench Press (bodyweight)',
  'Strict Bodyweight Pull-Ups', 'Tricep Pushdowns', 'Face Pulls', 'Foam Roll — full body',
  'Couch / Hip-Flexor Stretch', 'Thoracic Rotations', '90/90 Hip Switches', 'Deadlift',
  'Barbell Walking Lunges', 'Deficit Calf Raises', 'Overhead Press', 'Dumbbell Rows',
  'Hanging Leg Raises', 'Dynamic Warm-up', 'Loaded 25m Shuttles', 'Sled Push (Heavy)',
  'Weighted Plank', 'Dead Hang', "Farmer's Carry", 'Min 1 — Hip to Overhead',
  'Min 2 — Walking Lunges', 'Min 3 — Bench Press', 'Min 4 — Pull-Ups', 'Min 5 — Rest',
  'Kipping Pull-Up Practice', 'Bicep Curls', 'Hammer Curls'
].sort();

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
  const [activeTimer, setActiveTimer] = useState(null); // { name, seconds }
  const [activeSetTimer, setActiveSetTimer] = useState(null); // { ei, si, name, duration, isMaxTime }
  const [editingIdx, setEditingIdx] = useState(null); // index of exercise being swapped/edited
  const [emom, setEmom] = useState(false);
  const unit = profile.unit || 'kg';

  useEffect(() => pushGuard(), []); // warn on refresh/back while logging

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

        {session.type === 'lift' && (
          <details className="card" style={{ cursor: 'pointer', padding: '0.8rem 1rem' }}>
            <summary style={{ fontWeight: 700, outline: 'none', color: 'var(--accent)' }}>🔥 Warm-Up Protocol</summary>
            <div style={{ marginTop: '0.8rem', fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: '0.6rem', lineHeight: 1.5 }}>
              <div><strong>Set 1 (Mobility):</strong> Empty Bar × 10 reps (Deep ROM, perfect form)</div>
              <div><strong>Set 2 (Activation):</strong> 50% × 5 reps (Move fast & explosive)</div>
              <div><strong>Set 3 (Potentiating):</strong> 70% × 3 reps (Crisp, clean reps to prime CNS)</div>
              <div><strong>Set 4 (The Gateway):</strong> 85% × 1 rep (A single feeler rep)</div>
              <div style={{ marginTop: '0.4rem', fontStyle: 'italic' }}>Rest 2–3 mins before your first working set. Keep warm-ups smooth, save your true violence for the working sets, and smash it!</div>
            </div>
          </details>
        )}

        {/* Exercises */}
        {session.emom ? (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '1.25rem' }}>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: '0.6rem', marginBottom: '0.2rem' }}>
              📋 EMOM Exercises Reference
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {exercises.map((ex, ei) => (
                <div key={ei} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '0.25rem 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ex.name}
                    </span>
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Watch video demonstration"
                      style={{ fontSize: '1rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                    >
                      📺
                    </a>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                    {ex.scheme}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          exercises.map((ex, ei) => {
            const duration = getSchemeDuration(ex.scheme);
            return (
              <div key={ei} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {editingIdx === ei ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                    <select
                      value={ex.name}
                      onChange={e => {
                        const val = e.target.value;
                        setExercises(prev => prev.map((item, idx) => idx !== ei ? item : { ...item, name: val }));
                        setEditingIdx(null);
                      }}
                      style={{
                        fontSize: '0.9rem', fontWeight: 700, padding: '0.35rem 0.5rem',
                        background: 'var(--bg-elevated)', border: '1px solid var(--accent)',
                        borderRadius: 6, color: 'var(--text)', width: '100%', flex: 1,
                        cursor: 'pointer', outline: 'none'
                      }}
                      autoFocus
                    >
                      <option value="" disabled>-- Select Substitute --</option>
                      {RECOMMENDATIONS[ex.name] && (
                        <optgroup label="Recommended Substitutes">
                          {RECOMMENDATIONS[ex.name].map(alt => (
                            <option key={alt} value={alt}>{alt}</option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label="All Movements">
                        {ALL_EXERCISES.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </optgroup>
                    </select>
                    <button className="btn btn-secondary" onClick={() => setEditingIdx(null)}
                      style={{ fontSize: '0.74rem', padding: '0.35rem 0.75rem', width: 'auto', flexShrink: 0 }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</span>
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Watch video demonstration"
                      style={{ fontSize: '1rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}
                    >
                      📺
                    </a>
                    <button
                      onClick={() => setEditingIdx(ei)}
                      style={{
                        fontSize: '0.66rem', padding: '2px 6px', borderRadius: 4,
                        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                        color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', flexShrink: 0
                      }}
                    >
                      🔄 Swap
                    </button>
                  </div>
                )}

                {editingIdx !== ei && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--accent)', whiteSpace: 'nowrap' }}>{ex.scheme}</span>
                    {duration !== null && (
                      <button
                        onClick={() => setActiveTimer({ name: ex.name, seconds: duration })}
                        style={{
                          fontSize: '0.7rem', padding: '3px 8px', borderRadius: 6,
                          background: 'var(--accent)20', border: '1px solid var(--accent)50',
                          color: 'var(--accent)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        ⏱ Timer
                      </button>
                    )}
                  </div>
                )}
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
              {ex.rows.map((row, si) => {
                const isMaxTime = /max\s*time/i.test(ex.scheme) || /max\s*time/i.test(ex.name);
                const isTimeCheck = ex.kind === 'check' && duration !== null;
                return (
                  <div key={si} style={{
                    display: 'grid',
                    gridTemplateColumns: ex.kind === 'check' ? '28px 1fr 40px' : ex.kind === 'weight' ? '28px 1fr 1fr 1fr 40px' : '28px 1fr 1fr 40px',
                    gap: 8, alignItems: 'center', opacity: row.done ? 0.55 : 1,
                  }}>
                    <span style={{ fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>{si + 1}</span>
                    {ex.kind === 'check' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between', width: '100%' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontWeight: row.timeLogged ? 700 : 400 }}>
                          {row.timeLogged ? `⏱ Completed (${row.timeLogged}s)` : ex.scheme}
                        </span>
                        {duration !== null && !row.done && (
                          <button
                            onClick={() => setActiveSetTimer({ ei, si, name: ex.name, duration, isMaxTime })}
                            style={{
                              fontSize: '0.72rem', padding: '3px 8px', borderRadius: 6,
                              background: 'var(--accent)20', border: '1px solid var(--accent)50',
                              color: 'var(--accent)', fontWeight: 700, cursor: 'pointer', flexShrink: 0
                            }}
                          >
                            ⏱ Timer
                          </button>
                        )}
                      </div>
                    )}
                    {ex.kind === 'weight' && <NumCell value={row.weight} onChange={v => update(ei, si, 'weight', v)} placeholder="0" />}
                    {ex.kind !== 'check' && <NumCell value={row.reps} onChange={v => update(ei, si, 'reps', v)} placeholder={ex.kind === 'reps' ? 'max' : '0'} />}
                    {ex.kind !== 'check' && <NumCell value={row.rpe} onChange={v => update(ei, si, 'rpe', v)} placeholder="–" />}
                    <button onClick={isTimeCheck ? undefined : () => toggleDone(ei, si)} aria-label="toggle set done"
                      disabled={isTimeCheck}
                      style={{
                        width: 34, height: 34, borderRadius: 8, fontSize: '1rem', fontWeight: 800,
                        background: row.done ? 'var(--success)' : 'var(--bg-elevated)',
                        color: row.done ? '#000' : 'var(--text-muted)',
                        border: `1px solid ${row.done ? 'var(--success)' : 'var(--border)'}`,
                        opacity: isTimeCheck && !row.done ? 0.35 : 1,
                        cursor: isTimeCheck ? 'default' : 'pointer',
                      }}>✓</button>
                  </div>
                );
              })}
              </div>
            );
          })
        )}

        {resting && <RestTimer start={90} onDismiss={() => setResting(false)} />}
        {activeTimer && (
          <RestTimer
            start={activeTimer.seconds}
            title={activeTimer.name}
            showPresets={false}
            onDismiss={() => setActiveTimer(null)}
          />
        )}
        {activeSetTimer && (
          <ActiveSetTimer
            name={activeSetTimer.name}
            duration={activeSetTimer.duration}
            isMaxTime={activeSetTimer.isMaxTime}
            onClose={() => setActiveSetTimer(null)}
            onDone={(val) => {
              setExercises(prev => prev.map((ex, i) => i !== activeSetTimer.ei ? ex : {
                ...ex,
                rows: ex.rows.map((r, j) => j !== activeSetTimer.si ? r : { ...r, done: true, timeLogged: val })
              }));
              setActiveSetTimer(null);
              fxCount();
              setResting(true);
            }}
          />
        )}
        {emom && (
          <EmomTimer
            session={session}
            onClose={(wasFinished) => {
              if (wasFinished) {
                setExercises(prev => prev.map(ex => ({
                  ...ex,
                  rows: ex.rows.map(r => ({ ...r, done: true }))
                })));
              }
              setEmom(false);
            }}
          />
        )}
      </div>

      {/* Sticky footer */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg-card)', borderTop: '1px solid var(--border)', padding: `0.85rem 1.25rem calc(0.85rem + env(safe-area-inset-bottom))`, display: 'flex', gap: 8, maxWidth: 480, margin: '0 auto' }}>
        <button className="btn btn-secondary" style={{ width: 'auto', padding: '0.75rem 1rem' }} onClick={() => setResting(true)}>⏱ Rest</button>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={complete}>
          {session.emom ? 'Complete Session ✓' : `Complete Session · ${doneCount}/${totalSets}`}
        </button>
      </div>
    </div>
  );
}
