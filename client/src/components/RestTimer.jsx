import { useState, useEffect, useRef, useCallback } from 'react';
import { fxCountdownTick, startAlarm, stopAlarm, unlockAudio } from '../lib/feedback';

const PRESETS = [60, 90, 120, 180];

/** Compact rest-timer bottom sheet with a circular countdown. */
export default function RestTimer({ start = 90, title = 'Rest Timer', showPresets = true, onDismiss }) {
  const [seconds, setSeconds] = useState(start);
  const [remaining, setRemaining] = useState(start);
  const [running, setRunning] = useState(true);
  const remRef = useRef(start);
  const intervalRef = useRef(null);

  const run = useCallback((from) => {
    clearInterval(intervalRef.current);
    remRef.current = from;
    intervalRef.current = setInterval(() => {
      remRef.current -= 1;
      setRemaining(remRef.current);
      if (remRef.current <= 0) {
        clearInterval(intervalRef.current);
        setRunning(false);
        startAlarm();
      } else if (remRef.current <= 3) {
        fxCountdownTick();
      }
    }, 1000);
  }, []);

  useEffect(() => { unlockAudio(); run(start); return () => { clearInterval(intervalRef.current); stopAlarm(); }; }, [run, start]);

  const reset = (s) => { stopAlarm(); setSeconds(s); setRemaining(s); setRunning(true); run(s); };
  const dismiss = () => { stopAlarm(); onDismiss(); };
  const toggle = () => {
    if (running) { clearInterval(intervalRef.current); setRunning(false); }
    else { run(remaining); setRunning(true); }
  };

  const R = 44, circ = 2 * Math.PI * R;
  const mins = Math.floor(remaining / 60), secs = remaining % 60;
  const done = remaining <= 0;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 320, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: '20px 20px 0 0', borderTop: '1px solid var(--border)', padding: '1.5rem', width: '100%', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 999, margin: '0 auto 1.25rem' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 14 }}>{title}</div>
          <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 16px', cursor: 'pointer' }} onClick={toggle}>
            <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r={R} fill="none" stroke="var(--border)" strokeWidth="6" />
              <circle cx="60" cy="60" r={R} fill="none" stroke={done ? 'var(--success)' : 'var(--accent)'} strokeWidth="6"
                strokeDasharray={circ} strokeDashoffset={circ * (1 - remaining / seconds)} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className={done ? 'rest-done-pulse' : undefined} style={{ fontSize: '1.7rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: done ? 'var(--success)' : 'var(--text)' }}>
                {done ? 'GO' : `${mins}:${String(secs).padStart(2, '0')}`}
              </div>
              {!done && <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{running ? 'tap to pause' : '▶ paused'}</div>}
            </div>
          </div>
          {showPresets && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
              {PRESETS.map(s => (
                <button key={s} onClick={() => reset(s)}
                  style={{ padding: '0.35rem 0.75rem', borderRadius: 999, background: seconds === s ? 'color-mix(in srgb, var(--accent) 19%, transparent)' : 'var(--bg-elevated)', border: `1px solid ${seconds === s ? 'var(--accent)' : 'var(--border)'}`, fontSize: '0.8rem', fontWeight: 700, color: seconds === s ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {s >= 60 ? `${s / 60}m` : `${s}s`}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="btn btn-primary" onClick={dismiss}>{done ? 'Stop Alarm ✓' : title === 'Rest Timer' ? 'Skip Rest' : 'Done'}</button>
      </div>
    </div>
  );
}
