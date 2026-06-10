import { useState } from 'react';
import PlateDisplay from './PlateDisplay';
import RestTimer from './RestTimer';

const SET_TYPES = ['warmup', 'normal', 'dropset'];
const SET_TYPE_STYLE = {
  warmup:  { color: 'var(--warn)',    bg: 'var(--warn)20',    label: 'W' },
  normal:  { color: 'var(--text)',    bg: 'var(--bg-elevated)', label: 'N' },
  dropset: { color: 'var(--gym)',     bg: 'var(--gym)20',     label: 'D' },
};

function defaultSets(exercise) {
  const sets = [];
  // Add warmup set
  sets.push({ type: 'warmup', reps: 10, weight: exercise.weight ? Math.round(exercise.weight * 0.6) : 0, rpe: null, done: false });
  // Add prescribed working sets
  for (let i = 0; i < (exercise.sets || 3); i++) {
    sets.push({ type: 'normal', reps: exercise.reps || 8, weight: exercise.weight || 0, rpe: null, done: false });
  }
  return sets;
}

function SetRow({ set, index, onChange, onComplete, unit }) {
  const style = SET_TYPE_STYLE[set.type];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '28px 32px 1fr 1fr 44px 36px',
      gap: 6,
      alignItems: 'center',
      padding: '0.5rem 0',
      opacity: set.done ? 0.5 : 1,
      borderBottom: '1px solid var(--border)',
    }}>
      {/* Set type badge */}
      <button
        onClick={() => {
          const idx = SET_TYPES.indexOf(set.type);
          onChange({ ...set, type: SET_TYPES[(idx + 1) % SET_TYPES.length] });
        }}
        style={{
          width: 28, height: 28, borderRadius: 6,
          background: style.bg, color: style.color,
          fontWeight: 800, fontSize: '0.7rem', border: 'none',
          flexShrink: 0,
        }}>
        {style.label}
      </button>

      {/* Set number */}
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        #{index + 1}
      </span>

      {/* Weight */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <input
          type="number" inputMode="decimal"
          value={set.weight ?? ''}
          onChange={e => onChange({ ...set, weight: Number(e.target.value) })}
          style={{ padding: '0.35rem 0.5rem', fontSize: '0.9rem', textAlign: 'center', minWidth: 0 }}
        />
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{unit}</span>
      </div>

      {/* Reps */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <input
          type="number" inputMode="numeric"
          value={set.reps ?? ''}
          onChange={e => onChange({ ...set, reps: Number(e.target.value) })}
          style={{ padding: '0.35rem 0.5rem', fontSize: '0.9rem', textAlign: 'center', minWidth: 0 }}
        />
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>reps</span>
      </div>

      {/* RPE */}
      <input
        type="number" inputMode="numeric" min={1} max={10} placeholder="RPE"
        value={set.rpe ?? ''}
        onChange={e => onChange({ ...set, rpe: Number(e.target.value) })}
        style={{ padding: '0.35rem 0.4rem', fontSize: '0.8rem', textAlign: 'center', minWidth: 0 }}
      />

      {/* Done checkbox */}
      <button
        onClick={() => onComplete(set)}
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
  const [exercises, setExercises] = useState(
    workout.exercises.map(ex => ({
      ...ex,
      sets: defaultSets(ex),
      showPlates: false,
    }))
  );
  const [showTimer, setShowTimer] = useState(false);
  const [expandedEx, setExpandedEx] = useState(0);

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

  const handleSave = () => {
    onSave(exercises.map(ex => ({ name: ex.name, sets: ex.sets })));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {showTimer && <RestTimer onDismiss={() => setShowTimer(false)} />}

      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '28px 32px 1fr 1fr 44px 36px',
        gap: 6,
        padding: '0 0 4px',
      }}>
        {['Type', '#', 'Weight', 'Reps', 'RPE', '✓'].map(h => (
          <div key={h} style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>
            {h}
          </div>
        ))}
      </div>

      {exercises.map((ex, exIdx) => (
        <div key={exIdx} className="card">
          {/* Exercise header */}
          <button
            onClick={() => setExpandedEx(expandedEx === exIdx ? -1 : exIdx)}
            style={{ width: '100%', textAlign: 'left', background: 'none', padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: expandedEx === exIdx ? '0.75rem' : 0 }}>
              <div>
                <div style={{ fontWeight: 700 }}>{ex.name}</div>
                {ex.weight && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>
                    Target: {ex.weight} {ex.unit} × {ex.reps || ex.duration} {ex.reps ? 'reps' : ''}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {ex.sets.filter(s => s.done).length}/{ex.sets.length}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {expandedEx === exIdx ? '▲' : '▼'}
                </span>
              </div>
            </div>
          </button>

          {expandedEx === exIdx && (
            <>
              {/* Plate display */}
              {ex.weight && ex.sets.length > 0 && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <PlateDisplay
                    targetWeight={ex.sets.find(s => s.type === 'normal')?.weight || ex.weight}
                    barWeight={profile.barWeight}
                    unit={profile.unit}
                  />
                </div>
              )}

              {/* Sets */}
              {ex.sets.map((set, setIdx) => (
                <SetRow
                  key={setIdx}
                  set={set}
                  index={setIdx}
                  unit={ex.unit || profile.unit}
                  onChange={(newSet) => updateSet(exIdx, setIdx, newSet)}
                  onComplete={() => completeSet(exIdx, setIdx)}
                />
              ))}

              <button
                onClick={() => addSet(exIdx)}
                style={{
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

      <button
        className={`btn ${allDone ? 'btn-primary' : 'btn-secondary'}`}
        onClick={handleSave}>
        {allDone ? 'Complete Session ✓' : 'Save Progress'}
      </button>
    </div>
  );
}
