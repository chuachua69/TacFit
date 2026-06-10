import { useState } from 'react';
import RestTimer from './RestTimer';
import PlateSheet from './PlateSheet';
import { storage } from '../store/storage';

const SET_TYPES = ['warmup', 'normal', 'dropset'];

function getWellnessMult(wellness) {
  if (!wellness) return 1;
  let m = 1.0;
  if (wellness.fatigue >= 4 || wellness.soreness >= 4) m -= 0.15;
  else if (wellness.fatigue >= 3 || wellness.soreness >= 3) m -= 0.07;
  if (wellness.sleep < 6) m -= 0.05;
  if (wellness.fatigue <= 2 && wellness.soreness <= 2 && wellness.sleep >= 7) m += 0.05;
  return Math.max(0.75, Math.min(1.1, m));
}
const SET_TYPE_STYLE = {
  warmup:  { color: 'var(--warn)',    bg: 'var(--warn)20',    label: 'W' },
  normal:  { color: 'var(--text)',    bg: 'var(--bg-elevated)', label: 'N' },
  dropset: { color: 'var(--gym)',     bg: 'var(--gym)20',     label: 'D' },
};

function defaultSets(exercise, mult = 1) {
  const base = exercise.weight || 0;
  const adj = base > 0 ? Math.round((base * mult) / 2.5) * 2.5 : 0;
  const sets = [];
  sets.push({ type: 'warmup', reps: 10, weight: adj ? Math.round(adj * 0.6 / 2.5) * 2.5 : 0, rpe: null, done: false });
  for (let i = 0; i < (exercise.sets || 3); i++) {
    sets.push({ type: 'normal', reps: exercise.reps || 8, weight: adj, rpe: null, done: false });
  }
  return sets;
}

function SetRow({ set, index, onChange, onComplete, unit, isActive }) {
  const style = SET_TYPE_STYLE[set.type];
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '28px 32px 1fr 1fr 44px 36px',
      gap: 6, alignItems: 'center',
      padding: '0.5rem 0',
      opacity: set.done ? 0.45 : 1,
      borderBottom: '1px solid var(--border)',
      borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
      paddingLeft: isActive ? '0.4rem' : 0,
      background: isActive ? 'var(--accent)08' : 'transparent',
      borderRadius: isActive ? 4 : 0,
      transition: 'border-left-color 0.2s',
    }}>
      <button onClick={() => {
        const idx = SET_TYPES.indexOf(set.type);
        onChange({ ...set, type: SET_TYPES[(idx + 1) % SET_TYPES.length] });
      }} style={{
        width: 28, height: 28, borderRadius: 6,
        background: style.bg, color: style.color,
        fontWeight: 800, fontSize: '0.7rem', border: 'none', flexShrink: 0,
      }}>
        {style.label}
      </button>

      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        #{index + 1}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <input type="number" inputMode="decimal" value={set.weight ?? ''}
          onChange={e => onChange({ ...set, weight: Number(e.target.value) })}
          style={{ padding: '0.35rem 0.5rem', fontSize: '0.9rem', textAlign: 'center', minWidth: 0 }} />
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{unit}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <input type="number" inputMode="numeric" value={set.reps ?? ''}
          onChange={e => onChange({ ...set, reps: Number(e.target.value) })}
          style={{ padding: '0.35rem 0.5rem', fontSize: '0.9rem', textAlign: 'center', minWidth: 0 }} />
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>reps</span>
      </div>

      <input type="number" inputMode="numeric" min={1} max={10} placeholder="RPE"
        value={set.rpe ?? ''}
        onChange={e => onChange({ ...set, rpe: Number(e.target.value) })}
        style={{ padding: '0.35rem 0.4rem', fontSize: '0.8rem', textAlign: 'center', minWidth: 0 }} />

      <button onClick={() => onComplete(set)}
        style={{
          width: 36, height: 36, borderRadius: 8,
          background: set.done ? 'var(--success)20' : 'var(--bg-elevated)',
          border: `2px solid ${set.done ? 'var(--success)' : 'var(--border)'}`,
          color: set.done ? 'var(--success)' : 'var(--text-muted)',
          fontWeight: 800, fontSize: '1rem', flexShrink: 0,
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
    workout.exercises.map(ex => ({ ...ex, sets: defaultSets(ex, mult) }))
  );
  const [showTimer, setShowTimer] = useState(false);
  const [expandedEx, setExpandedEx] = useState(0);
  const [plateEx, setPlateEx] = useState(null); // which exercise's plate sheet is open

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

  const allDone = exercises.every(ex => ex.sets.filter(s => s.type !== 'warmup').every(s => s.done));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {showTimer && <RestTimer onDismiss={() => setShowTimer(false)} />}

      {/* Wellness adjustment banner */}
      {wellness && pctDiff !== 0 && (
        <div style={{
          padding: '0.6rem 1rem', borderRadius: 'var(--radius)',
          background: pctDiff < 0 ? 'var(--warn)15' : 'var(--success)15',
          border: `1px solid ${pctDiff < 0 ? 'var(--warn)40' : 'var(--success)40'}`,
          fontSize: '0.8rem', color: pctDiff < 0 ? 'var(--warn)' : 'var(--success)',
          fontWeight: 600,
        }}>
          {pctDiff < 0 ? '⚡' : '🔥'} Wellness adjustment: {pctDiff > 0 ? '+' : ''}{pctDiff}% weight
          {pctDiff < 0 && ` — ${wellness.fatigue >= 4 ? 'high fatigue' : wellness.soreness >= 4 ? 'high soreness' : 'sub-optimal recovery'}`}
        </div>
      )}

      {plateEx !== null && (
        <PlateSheet
          exercise={{
            ...exercises[plateEx],
            weight: exercises[plateEx].sets.find(s => !s.done)?.weight
              ?? exercises[plateEx].weight ?? 0,
            sets: exercises[plateEx].sets.filter(s => s.type === 'normal').length,
          }}
          barWeight={profile.barWeight}
          unit={profile.unit}
          onClose={() => setPlateEx(null)}
        />
      )}

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '28px 32px 1fr 1fr 44px 36px', gap: 6, padding: '0 0 4px' }}>
        {['Type', '#', 'Weight', 'Reps', 'RPE', '✓'].map(h => (
          <div key={h} style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>
            {h}
          </div>
        ))}
      </div>

      {exercises.map((ex, exIdx) => (
        <div key={exIdx} className="card">
          {/* Header row — two separate click zones, no nested buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: expandedEx === exIdx ? '0.75rem' : 0 }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 3 }}>{ex.name}</div>
              <button
                onClick={() => setPlateEx(exIdx)}
                style={{
                  fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 700,
                  background: 'var(--accent)15', border: '1px solid var(--accent)40',
                  borderRadius: 6, padding: '2px 8px',
                }}>
                {(exercises[exIdx].sets.find(s => !s.done)?.weight
                  ?? ex.weight ?? 0)} {ex.unit || profile.unit} — plates 🏋️
              </button>
            </div>
            <button
              onClick={() => setExpandedEx(expandedEx === exIdx ? -1 : exIdx)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: '2px 0', flexShrink: 0 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {ex.sets.filter(s => s.done).length}/{ex.sets.length}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {expandedEx === exIdx ? '▲' : '▼'}
              </span>
            </button>
          </div>

          {expandedEx === exIdx && (
            <>
              {ex.sets.map((set, setIdx) => {
                const activeIdx = ex.sets.findIndex(s => !s.done);
                return (
                  <SetRow key={setIdx} set={set} index={setIdx}
                    unit={ex.unit || profile.unit}
                    isActive={!set.done && setIdx === activeIdx}
                    onChange={(newSet) => updateSet(exIdx, setIdx, newSet)}
                    onComplete={() => completeSet(exIdx, setIdx)}
                  />
                );
              })}
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
      ))}

      <button className={`btn ${allDone ? 'btn-primary' : 'btn-secondary'}`}
        onClick={() => onSave(exercises.map(ex => ({ name: ex.name, sets: ex.sets })))}>
        {allDone ? 'Complete Session ✓' : 'Save Progress'}
      </button>
    </div>
  );
}
