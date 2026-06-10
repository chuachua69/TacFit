import { calcPlatesPerSide, plateColour } from '../lib/plateCalc';

export default function PlateDisplay({ targetWeight, barWeight, unit }) {
  const plates = calcPlatesPerSide(targetWeight, barWeight, unit);

  if (plates.length === 0) {
    return (
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Bar only ({barWeight}{unit})
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        Plates per side · bar = {barWeight}{unit}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, overflowX: 'auto', paddingBottom: 2 }}>
        {/* Bar sleeve */}
        <div style={{
          width: 16, height: 12, borderRadius: 4,
          background: '#888', flexShrink: 0,
        }} />
        {/* Plates */}
        {plates.map((p, i) => {
          const height = Math.max(20, Math.min(60, p * 1.8));
          return (
            <div key={i} style={{
              width: 22, height,
              borderRadius: 3,
              background: plateColour(p, unit),
              flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.55rem', fontWeight: 800, color: '#000',
              writingMode: 'vertical-rl',
            }}>
              {p}
            </div>
          );
        })}
        {/* Mirror */}
        {[...plates].reverse().map((p, i) => {
          const height = Math.max(20, Math.min(60, p * 1.8));
          return (
            <div key={`r${i}`} style={{
              width: 22, height,
              borderRadius: 3,
              background: plateColour(p, unit),
              flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.55rem', fontWeight: 800, color: '#000',
              writingMode: 'vertical-rl',
            }}>
              {p}
            </div>
          );
        })}
        <div style={{
          width: 16, height: 12, borderRadius: 4,
          background: '#888', flexShrink: 0,
        }} />
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
        {plates.join(' + ')} {unit} each side
      </div>
    </div>
  );
}
