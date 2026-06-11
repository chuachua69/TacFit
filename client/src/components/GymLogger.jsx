import { useState } from 'react';
import RestTimer from './RestTimer';
import PlateSheet from './PlateSheet';
import ExerciseInfo from './ExerciseInfo';
import { storage } from '../store/storage';

const SET_TYPES = ['warmup', 'normal', 'dropset'];

const SET_TYPE_STYLE = {
  warmup:  { color: 'var(--warn)', bg: 'var(--warn)20',     label: 'W' },
  normal:  { color: 'var(--text)', bg: 'var(--bg-elevated)', label: 'N' },
  dropset: { color: 'var(--gym)',  bg: 'var(--gym)20',      label: 'D' },
};

const round2_5 = v => Math.round(v / 2.5) * 2.5;

// ── Exercise classification ─────────────────────────────────────────────
// weighted   = load × reps (barbell/DB lifts) → plates apply
// bodyweight = reps, optional added load (pull-ups, push-ups)
// timed      = held/duration effort in seconds (planks, carries)
function kindOf(ex) {
  if (ex.kind) return ex.kind;
  if (ex.duration != null) return 'timed';
  if (ex.weight == null) return 'bodyweight';
  return 'weighted';
}

function parseSeconds(d) {
  if (typeof d === 'number') return d;
  if (!d) return 45;
  const mmss = String(d).match(/(\d+):(\d+)/);
  if (mmss) return +mmss[1] * 60 + +mmss[2];
  const s = String(d).match(/(\d+)\s*s/i); if (s) return +s[1];
  const m = String(d).match(/(\d+)\s*m/i); if (m) return +m[1] * 60;
  const n = parseInt(d, 10); return isNaN(n) ? 45 : n;
}

// ── Swap catalogue (by movement pattern) ────────────────────────────────
const SWAP_GROUPS = [
  { pattern: 'squat',    items: [['Back Squat', 'weighted'], ['Front Squat', 'weighted'], ['Goblet Squat', 'weighted'], ['Bulgarian Split Squat', 'weighted'], ['Leg Press', 'weighted']] },
  { pattern: 'deadlift', items: [['Deadlift', 'weighted'], ['Romanian Deadlift', 'weighted'], ['Trap-Bar Deadlift', 'weighted'], ['Hip Thrust', 'weighted'], ['Good Morning', 'weighted']] },
  { pattern: 'bench',    items: [['Bench Press', 'weighted'], ['Incline Bench Press', 'weighted'], ['DB Bench Press', 'weighted'], ['Push-ups', 'bodyweight'], ['Dips', 'bodyweight']] },
  { pattern: 'press',    items: [['Overhead Press', 'weighted'], ['Push Press', 'weighted'], ['DB Shoulder Press', 'weighted'], ['Arnold Press', 'weighted'], ['Pike Push-ups', 'bodyweight']] },
  { pattern: 'row',      items: [['Bent-over Row', 'weighted'], ['Pendlay Row', 'weighted'], ['DB Row', 'weighted'], ['Seated Cable Row', 'weighted'], ['Inverted Row', 'bodyweight']] },
  { pattern: 'pull',     items: [['Pull-ups', 'bodyweight'], ['Chin-ups', 'bodyweight'], ['Weighted Pull-ups', 'bodyweight'], ['Lat Pulldown', 'weighted']] },
  { pattern: 'plank',    items: [['Plank', 'timed'], ['Side Plank', 'timed'], ['Hollow Hold', 'timed'], ['Hanging Leg Raise', 'bodyweight'], ['Dead Bug', 'timed']] },
  { pattern: 'lunge',    items: [['Walking Lunges', 'weighted'], ['Alternating Lunges', 'weighted'], ['Reverse Lunges', 'weighted'], ['Step-ups', 'weighted']] },
  { pattern: 'carry',    items: [['Farmer Carry', 'timed'], ['Suitcase Carry', 'timed'], ['Sandbag Carry', 'timed']] },
];

function altsFor(name) {
  const lc = name.toLowerCase();
  let g = SWAP_GROUPS.find(grp => grp.items.some(it => it[0].toLowerCase() === lc));
  if (!g) g = SWAP_GROUPS.find(grp => lc.includes(grp.pattern));
  if (!g) g = SWAP_GROUPS.find(grp => grp.items.some(it => lc.includes(it[0].toLowerCase().split(' ')[0])));
  const list = g ? g.items : [];
  return list.filter(it => it[0].toLowerCase() !== lc).map(([n, k]) => ({ name: n, kind: k }));
}

function getWellnessMult(wellness) {
  if (!wellness) return 1;
  let m = 1.0;
  if (wellness.fatigue >= 4 || wellness.soreness >= 4) m -= 0.15;
  else if (wellness.fatigue >= 3 || wellness.soreness >= 3) m -= 0.07;
  if (wellness.sleep < 6) m -= 0.05;
  if (wellness.fatigue <= 2 && wellness.soreness <= 2 && wellness.sleep >= 7) m += 0.05;
  return Math.max(0.75, Math.min(1.1, m));
}

function defaultSets(ex, mult = 1) {
  const kind = kindOf(ex);
  const count = ex.sets || 3;
  const out = [];
  if (kind === 'weighted') {
    const base = ex.weight || 0;
    const adj = base > 0 ? round2_5(base * mult) : 0;
    out.push({ type: 'warmup', reps: 10, weight: adj ? round2_5(adj * 0.6) : 0, rpe: null, done: false });
    for (let i = 0; i < count; i++) out.push({ type: 'normal', reps: ex.reps || 8, weight: adj, rpe: null, done: false });
  } else if (kind === 'bodyweight') {
    for (let i = 0; i < count; i++) out.push({ type: 'normal', reps: ex.reps || 8, addedWeight: 0, rpe: null, done: false });
  } else {
    const secs = parseSeconds(ex.duration);
    for (let i = 0; i < count; i++) out.push({ type: 'normal', seconds: secs, rpe: null, done: false });
  }
  return out;
}

const GRID = {
  weighted:   '40px 1fr 1fr 50px 38px',
  bodyweight: '40px 1fr 1fr 50px 38px',
  timed:      '40px 1fr 50px 38px',
};

function headersFor(kind, unit) {
  if (kind === 'timed') return ['Set', 'Seconds', 'RPE', ''];
  if (kind === 'bodyweight') return ['Set', 'Reps', `+${unit}`, 'RPE', ''];
  return ['Set', unit, 'Reps', 'RPE', ''];
}

function Field({ value, onChange, inputMode = 'numeric', step, placeholder = '0', max }) {
  return (
    <input type="number" inputMode={inputMode} step={step} max={max} placeholder={placeholder}
      value={value ?? ''}
      onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
      style={{ width: '100%', padding: '0.5rem 0.3rem', fontSize: '0.95rem', textAlign: 'center', fontWeight: 600 }} />
  );
}

function SetRow({ set, index, kind, onChange, onComplete, isActive }) {
  const style = SET_TYPE_STYLE[set.type];
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: GRID[kind], gap: 8, alignItems: 'center',
      padding: '0.5rem 0', opacity: set.done ? 0.5 : 1,
      borderBottom: '1px solid var(--border)',
      borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
      paddingLeft: isActive ? '0.45rem' : 0,
      background: isActive ? 'var(--accent)08' : 'transparent',
      borderRadius: isActive ? 4 : 0, transition: 'border-left-color 0.2s',
    }}>
      <button onClick={() => {
        const idx = SET_TYPES.indexOf(set.type);
        onChange({ ...set, type: SET_TYPES[(idx + 1) % SET_TYPES.length] });
      }} title="Tap to change set type" style={{
        height: 32, borderRadius: 6, background: style.bg, color: style.color,
        fontWeight: 800, fontSize: '0.72rem', border: 'none',
      }}>
        {style.label}{index + 1}
      </button>

      {kind === 'weighted' && (
        <>
          <Field value={set.weight} inputMode="decimal" step="2.5" onChange={v => onChange({ ...set, weight: v })} />
          <Field value={set.reps} onChange={v => onChange({ ...set, reps: v })} />
        </>
      )}
      {kind === 'bodyweight' && (
        <>
          <Field value={set.reps} onChange={v => onChange({ ...set, reps: v })} />
          <Field value={set.addedWeight} inputMode="decimal" step="2.5" onChange={v => onChange({ ...set, addedWeight: v })} />
        </>
      )}
      {kind === 'timed' && (
        <Field value={set.seconds} onChange={v => onChange({ ...set, seconds: v })} />
      )}

      <Field value={set.rpe} max={10} placeholder="–" onChange={v => onChange({ ...set, rpe: v })} />

      <button onClick={() => onComplete(set)} style={{
        height: 36, borderRadius: 8,
        background: set.done ? 'var(--success)20' : 'var(--bg-elevated)',
        border: `2px solid ${set.done ? 'var(--success)' : 'var(--border)'}`,
        color: set.done ? 'var(--success)' : 'var(--text-muted)',
        fontWeight: 800, fontSize: '1rem',
      }}>
        {set.done ? '✓' : '○'}
      </button>
    </div>
  );
}

export default function GymLogger({ workout, profile, onSave }) {
  const wellness = storage.getTodayWellness();
  const mult = getWellnessMult(wellness);
  const pctDiff = Math.round((mult - 1) * 100);

  const [exercises, setExercises] = useState(
    workout.exercises.map(ex => {
      const kind = kindOf(ex);
      return { ...ex, kind, plannedSets: ex.sets || 3, sets: defaultSets(ex, mult) };
    })
  );
  const [showTimer, setShowTimer] = useState(false);
  const [expandedEx, setExpandedEx] = useState(0);
  const [plateEx, setPlateEx] = useState(null);
  const [swapFor, setSwapFor] = useState(null);
  const [infoName, setInfoName] = useState(null);

  const updateSet = (exIdx, setIdx, newSet) => {
    setExercises(exs => exs.map((ex, i) =>
      i !== exIdx ? ex : { ...ex, sets: ex.sets.map((s, j) => j === setIdx ? newSet : s) }
    ));
  };

  const completeSet = (exIdx, setIdx) => {
    updateSet(exIdx, setIdx, { ...exercises[exIdx].sets[setIdx], done: true });
    setShowTimer(true);
  };

  const addSet = (exIdx) => {
    setExercises(exs => exs.map((ex, i) => {
      if (i !== exIdx) return ex;
      const last = ex.sets[ex.sets.length - 1];
      return { ...ex, sets: [...ex.sets, { ...last, done: false }] };
    }));
  };

  const swapExercise = (exIdx, alt) => {
    setExercises(exs => exs.map((ex, i) => {
      if (i !== exIdx) return ex;
      const proto = {
        kind: alt.kind,
        sets: ex.plannedSets || 3,
        reps: alt.kind === 'timed' ? null : (ex.reps || 8),
        weight: alt.kind === 'weighted' ? (ex.weight || 0) : null,
        duration: alt.kind === 'timed' ? (ex.duration || '45s') : null,
      };
      return { ...ex, name: alt.name, kind: alt.kind, reps: proto.reps, weight: proto.weight, duration: proto.duration, sets: defaultSets(proto, mult) };
    }));
    setSwapFor(null);
  };

  const allDone = exercises.every(ex => ex.sets.filter(s => s.type !== 'warmup').every(s => s.done));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {showTimer && <RestTimer onDismiss={() => setShowTimer(false)} />}
      {infoName && <ExerciseInfo name={infoName} onClose={() => setInfoName(null)} />}

      {wellness && pctDiff !== 0 && (
        <div style={{
          padding: '0.6rem 1rem', borderRadius: 'var(--radius)',
          background: pctDiff < 0 ? 'var(--warn)15' : 'var(--success)15',
          border: `1px solid ${pctDiff < 0 ? 'var(--warn)40' : 'var(--success)40'}`,
          fontSize: '0.8rem', color: pctDiff < 0 ? 'var(--warn)' : 'var(--success)', fontWeight: 600,
        }}>
          {pctDiff < 0 ? '⚡' : '🔥'} Wellness adjustment: {pctDiff > 0 ? '+' : ''}{pctDiff}% load
          {pctDiff < 0 && ` — ${wellness.fatigue >= 4 ? 'high fatigue' : wellness.soreness >= 4 ? 'high soreness' : 'sub-optimal recovery'}`}
        </div>
      )}

      {plateEx !== null && (
        <PlateSheet
          exercise={{
            ...exercises[plateEx],
            weight: exercises[plateEx].sets.find(s => !s.done)?.weight ?? exercises[plateEx].weight ?? 0,
            sets: exercises[plateEx].sets.filter(s => s.type === 'normal').length,
          }}
          barWeight={profile.barWeight}
          unit={profile.unit}
          onClose={() => setPlateEx(null)}
        />
      )}

      {exercises.map((ex, exIdx) => {
        const kind = ex.kind;
        const activeIdx = ex.sets.findIndex(s => !s.done);
        return (
          <div key={exIdx} className="card" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: expandedEx === exIdx ? '0.75rem' : 0 }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 3 }}>{ex.name}</div>
                {kind === 'weighted' ? (
                  <button onClick={() => setPlateEx(exIdx)} style={{
                    fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 700,
                    background: 'var(--accent)15', border: '1px solid var(--accent)40',
                    borderRadius: 6, padding: '2px 8px',
                  }}>
                    {(ex.sets.find(s => !s.done)?.weight ?? ex.weight ?? 0)} {ex.unit || profile.unit} — plates 🏋️
                  </button>
                ) : (
                  <span style={{
                    fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600,
                    background: 'var(--bg-elevated)', borderRadius: 6, padding: '2px 8px',
                  }}>
                    {kind === 'timed' ? `⏱ Timed hold` : `💪 Bodyweight`}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                {/* 3-dot swap menu */}
                <button
                  aria-label="Exercise options"
                  onClick={() => setSwapFor(swapFor === exIdx ? null : exIdx)}
                  style={{ padding: '2px 6px', fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1 }}>
                  ⋮
                </button>
                <button
                  onClick={() => setExpandedEx(expandedEx === exIdx ? -1 : exIdx)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: '2px 0' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {ex.sets.filter(s => s.done).length}/{ex.sets.length}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {expandedEx === exIdx ? '▲' : '▼'}
                  </span>
                </button>
              </div>
            </div>

            {/* Swap dropdown */}
            {swapFor === exIdx && (
              <>
                <div onClick={() => setSwapFor(null)}
                  style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
                <div style={{
                  position: 'absolute', right: 12, top: 44, zIndex: 31,
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: 6, minWidth: 200,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                }}>
                  <button onClick={() => { setInfoName(ex.name); setSwapFor(null); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                      padding: '0.5rem 0.5rem', borderRadius: 6, textAlign: 'left', fontSize: '0.88rem',
                      borderBottom: '1px solid var(--border)', marginBottom: 4,
                    }}>
                    ⓘ <span>Form &amp; cues</span>
                  </button>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', padding: '4px 8px' }}>
                    Swap exercise
                  </div>
                  {altsFor(ex.name).length === 0 && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '6px 8px' }}>No alternatives</div>
                  )}
                  {altsFor(ex.name).map(alt => (
                    <button key={alt.name} onClick={() => swapExercise(exIdx, alt)}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%',
                        padding: '0.5rem 0.5rem', borderRadius: 6, textAlign: 'left', fontSize: '0.88rem',
                      }}>
                      <span>{alt.name}</span>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        {alt.kind === 'timed' ? '⏱' : alt.kind === 'bodyweight' ? '💪' : '🏋️'}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {expandedEx === exIdx && (
              <>
                {/* Column header (per-exercise so labels match the metric) */}
                <div style={{ display: 'grid', gridTemplateColumns: GRID[kind], gap: 8, padding: '0 0 2px' }}>
                  {headersFor(kind, ex.unit || profile.unit).map((h, i) => (
                    <div key={i} style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.03em' }}>
                      {h}
                    </div>
                  ))}
                </div>
                {ex.sets.map((set, setIdx) => (
                  <SetRow key={setIdx} set={set} index={setIdx} kind={kind}
                    isActive={!set.done && setIdx === activeIdx}
                    onChange={(newSet) => updateSet(exIdx, setIdx, newSet)}
                    onComplete={() => completeSet(exIdx, setIdx)}
                  />
                ))}
                <button onClick={() => addSet(exIdx)} style={{
                  marginTop: '0.75rem', width: '100%', padding: '0.5rem',
                  borderRadius: 'var(--radius)', border: '1px dashed var(--border)',
                  color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600,
                }}>
                  + Add Set
                </button>
              </>
            )}
          </div>
        );
      })}

      <button className={`btn ${allDone ? 'btn-primary' : 'btn-secondary'}`}
        onClick={() => onSave(exercises.map(ex => ({ name: ex.name, kind: ex.kind, sets: ex.sets })))}>
        {allDone ? 'Complete Session ✓' : 'Save Progress'}
      </button>
    </div>
  );
}
