import { useState, useEffect, useRef } from 'react';

const PRESETS = [60, 90, 120, 180];

export default function RestTimer({ onDismiss }) {
  const [seconds, setSeconds] = useState(90);
  const [remaining, setRemaining] = useState(90);
  const [running, setRunning] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) { clearInterval(intervalRef.current); setRunning(false); return 0; }
          return r - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const reset = (s) => {
    clearInterval(intervalRef.current);
    setSeconds(s);
    setRemaining(s);
    setRunning(true);
  };

  const pct = remaining / seconds;
  const r = 44;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - pct);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const done = remaining === 0;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.92)',
      display: 'flex', alignItems: 'flex-end',
    }}>
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '20px 20px 0 0',
        padding: '1.5rem',
        width: '100%', maxWidth: 480, margin: '0 auto',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 999, margin: '0 auto 1.5rem' }} />

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 16 }}>
            Rest Timer
          </div>

          {/* Circular timer */}
          <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 16px' }}>
            <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
              <circle cx="60" cy="60" r={r} fill="none"
                stroke={done ? 'var(--success)' : 'var(--accent)'}
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: done ? 'var(--success)' : 'var(--text)' }}>
                {done ? 'GO' : `${mins}:${String(secs).padStart(2, '0')}`}
              </div>
            </div>
          </div>

          {/* Presets */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
            {PRESETS.map(s => (
              <button key={s} onClick={() => reset(s)}
                style={{
                  padding: '0.35rem 0.75rem', borderRadius: 999,
                  background: seconds === s && running ? 'var(--accent)30' : 'var(--bg-elevated)',
                  border: `1px solid ${seconds === s && running ? 'var(--accent)' : 'var(--border)'}`,
                  fontSize: '0.8rem', fontWeight: 700, color: seconds === s && running ? 'var(--accent)' : 'var(--text-muted)',
                }}>
                {s >= 60 ? `${s / 60}m` : `${s}s`}
              </button>
            ))}
          </div>
        </div>

        <button className="btn btn-primary" onClick={onDismiss}>
          {done ? 'Start Next Set' : 'Skip Rest'}
        </button>
      </div>
    </div>
  );
}
