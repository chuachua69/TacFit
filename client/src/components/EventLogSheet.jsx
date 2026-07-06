import { useState } from 'react';
import Stepper from './Stepper';
import { eventResult } from '../lib/scoring';

/**
 * Bottom-sheet rep logger for untimed max-rep events (bench, pull-ups).
 * Timed events use PhaseTimer instead.
 */
export default function EventLogSheet({ event, initial = 0, onSave, onClose }) {
  const [value, setValue] = useState(initial);
  const res = eventResult(event, value);

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'flex-end',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-card)', borderRadius: '20px 20px 0 0', borderTop: '1px solid var(--border)',
        padding: '1.5rem', width: '100%', maxWidth: 480, margin: '0 auto',
      }}>
        <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 999, margin: '0 auto 1.25rem' }} />

        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{event.name}</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{event.sub}</div>
        </div>

        <div style={{ margin: '1.5rem 0' }}>
          <Stepper value={value} onChange={setValue} baseline={event.baseline} big />
        </div>

        <div style={{ textAlign: 'center', marginBottom: '1.25rem', fontSize: '0.85rem', fontWeight: 700,
          color: res.met ? 'var(--success)' : 'var(--text-muted)' }}>
          {res.met
            ? `✓ baseline met · +${res.bonus} bonus point${res.bonus === 1 ? '' : 's'}`
            : `${res.toBaseline} ${event.unit} to baseline (${event.baseline})`}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => onSave(value)}>Save Result ✓</button>
        </div>
      </div>
    </div>
  );
}
