import { calcPlatesPerSide, plateColour } from '../lib/plateCalc';

export default function PlateSheet({ exercise, barWeight, unit, onClose }) {
  const plates = calcPlatesPerSide(exercise.weight, barWeight, unit);
  const totalPerSide = plates.reduce((a, b) => a + b, 0);
  const totalWeight = barWeight + totalPerSide * 2;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 150,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '20px 20px 0 0',
          padding: '1.5rem',
          width: '100%', maxWidth: 480, margin: '0 auto',
          borderTop: '1px solid var(--border)',
        }}
        onClick={e => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 999, margin: '0 auto 1.25rem' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{exercise.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {exercise.sets} × {exercise.reps} reps
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>
            {exercise.weight} {unit}
          </div>
        </div>

        {/* Bar diagram */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            Plates per side
          </div>

          {/* Visual barbell */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, overflowX: 'auto', padding: '8px 0' }}>
            {/* Left collar */}
            <div style={{ width: 10, height: 18, background: '#555', borderRadius: '3px 0 0 3px', flexShrink: 0 }} />

            {/* Left plates (reversed — outermost first visually) */}
            {[...plates].reverse().map((p, i) => {
              const h = Math.max(28, Math.min(72, p * 2.2));
              return (
                <div key={`l${i}`} style={{
                  width: 20, height: h,
                  background: plateColour(p, unit),
                  borderRadius: 3, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.5rem', fontWeight: 800, color: '#000',
                  writingMode: 'vertical-rl',
                  boxShadow: '1px 0 3px rgba(0,0,0,0.4)',
                }}>
                  {p}
                </div>
              );
            })}

            {/* Bar */}
            <div style={{
              width: 60, height: 12, background: '#888',
              borderRadius: 4, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.55rem', color: '#333', fontWeight: 700,
            }}>
              {barWeight}{unit}
            </div>

            {/* Right plates */}
            {plates.map((p, i) => {
              const h = Math.max(28, Math.min(72, p * 2.2));
              return (
                <div key={`r${i}`} style={{
                  width: 20, height: h,
                  background: plateColour(p, unit),
                  borderRadius: 3, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.5rem', fontWeight: 800, color: '#000',
                  writingMode: 'vertical-rl',
                  boxShadow: '-1px 0 3px rgba(0,0,0,0.4)',
                }}>
                  {p}
                </div>
              );
            })}

            {/* Right collar */}
            <div style={{ width: 10, height: 18, background: '#555', borderRadius: '0 3px 3px 0', flexShrink: 0 }} />
          </div>

          {plates.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 8 }}>
              Bar only
            </div>
          )}
        </div>

        {/* Breakdown list */}
        {plates.length > 0 && (
          <div className="card" style={{ background: 'var(--bg-elevated)', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Bar</span>
              <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{barWeight} {unit}</span>
            </div>
            {/* Group plates by size */}
            {Object.entries(
              plates.reduce((acc, p) => ({ ...acc, [p]: (acc[p] || 0) + 1 }), {})
            ).sort((a, b) => Number(b[0]) - Number(a[0])).map(([p, count]) => (
              <div key={p} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 14, height: 20, background: plateColour(Number(p), unit), borderRadius: 2 }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p} {unit} × {count} each side</span>
                </div>
                <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>= {Number(p) * count * 2} {unit}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700 }}>Total</span>
              <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{totalWeight} {unit}</span>
            </div>
          </div>
        )}

        <button className="btn btn-secondary" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
