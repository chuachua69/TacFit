import { infoFor } from '../lib/exerciseInfo';

/** Bottom-sheet with target muscles + form cues for an exercise. */
export default function ExerciseInfo({ name, onClose }) {
  const info = infoFor(name);
  if (!info) return null;

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 210,
      background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-card)', borderRadius: '20px 20px 0 0',
        padding: '1.5rem', width: '100%', maxWidth: 480, margin: '0 auto',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 999, margin: '0 auto 1.25rem' }} />

        <div style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: 4 }}>{name}</div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '1.1rem' }}>
          {info.muscles.map(m => (
            <span key={m} style={{
              fontSize: '0.7rem', fontWeight: 700, padding: '3px 9px', borderRadius: 999,
              background: 'var(--accent)18', color: 'var(--accent)', border: '1px solid var(--accent)35',
            }}>
              {m}
            </span>
          ))}
        </div>

        <div className="label">Form cues</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1.25rem' }}>
          {info.cues.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{
                flexShrink: 0, width: 20, height: 20, borderRadius: 999,
                background: 'var(--accent)20', color: 'var(--accent)',
                fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {i + 1}
              </span>
              <span style={{ fontSize: '0.88rem', lineHeight: 1.4 }}>{c}</span>
            </div>
          ))}
        </div>

        <button className="btn btn-primary" onClick={onClose}>Got it</button>
      </div>
    </div>
  );
}
