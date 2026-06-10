import { useState } from 'react';
import { storage } from '../store/storage';

export default function WellnessModal({ onClose }) {
  const [sleep, setSleep] = useState(7);
  const [fatigue, setFatigue] = useState(3);
  const [soreness, setSoreness] = useState(2);

  const submit = () => {
    const today = new Date().toISOString().split('T')[0];
    storage.addWellness({ date: today, sleep, fatigue, soreness });
    onClose();
  };

  const fatigueLabel = ['', 'Fresh', 'Good', 'Moderate', 'Tired', 'Exhausted'];
  const sorenessLabel = ['', 'None', 'Mild', 'Moderate', 'Sore', 'Very Sore'];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'flex-end',
    }}>
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '20px 20px 0 0',
        padding: '1.5rem',
        width: '100%',
        maxWidth: 480,
        margin: '0 auto',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 999, margin: '0 auto 1.25rem' }} />

        <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 4 }}>Morning Check-in</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          This tunes today's session intensity.
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="label" style={{ margin: 0 }}>Sleep last night</span>
            <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{sleep}h</span>
          </div>
          <input type="range" min={3} max={10} step={0.5} value={sleep}
            onChange={e => setSleep(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent)' }} />
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="label" style={{ margin: 0 }}>Fatigue level</span>
            <span style={{ fontWeight: 700, color: fatigue >= 4 ? 'var(--danger)' : fatigue === 3 ? 'var(--warn)' : 'var(--success)' }}>
              {fatigueLabel[fatigue]}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setFatigue(n)}
                style={{
                  flex: 1, padding: '0.5rem 0', borderRadius: 'var(--radius)',
                  background: fatigue >= n ? 'var(--accent)30' : 'var(--bg-elevated)',
                  border: `1px solid ${fatigue === n ? 'var(--accent)' : 'var(--border)'}`,
                  fontWeight: 700, fontSize: '0.9rem',
                }}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="label" style={{ margin: 0 }}>Muscle soreness</span>
            <span style={{ fontWeight: 700, color: soreness >= 4 ? 'var(--danger)' : soreness === 3 ? 'var(--warn)' : 'var(--success)' }}>
              {sorenessLabel[soreness]}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setSoreness(n)}
                style={{
                  flex: 1, padding: '0.5rem 0', borderRadius: 'var(--radius)',
                  background: soreness >= n ? 'var(--gym)30' : 'var(--bg-elevated)',
                  border: `1px solid ${soreness === n ? 'var(--gym)' : 'var(--border)'}`,
                  fontWeight: 700, fontSize: '0.9rem',
                }}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <button className="btn btn-primary" onClick={submit}>Start Day</button>
      </div>
    </div>
  );
}
