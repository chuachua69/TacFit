import { useState, useEffect, useRef, useCallback } from 'react';
import { fxCountdownTick, startAlarm, stopAlarm, fxPhaseChange, unlockAudio } from '../lib/feedback';
import { pushGuard } from '../lib/guard';

export default function ActiveSetTimer({ name, duration, isMaxTime, onDone, onClose }) {
  const [prepRemaining, setPrepRemaining] = useState(5);
  const [phase, setPhase] = useState('prep'); // 'prep' | 'work' | 'done'
  const [elapsed, setElapsed] = useState(0); // for max time stopwatch
  const [workRemaining, setWorkRemaining] = useState(duration); // for fixed duration countdown
  const [running, setRunning] = useState(true);

  const prepIntervalRef = useRef(null);
  const workIntervalRef = useRef(null);

  // Clean up
  useEffect(() => {
    return () => {
      clearInterval(prepIntervalRef.current);
      clearInterval(workIntervalRef.current);
      stopAlarm();
    };
  }, []);

  useEffect(() => pushGuard(), []);

  // 1. Preparation Phase (5s)
  useEffect(() => {
    unlockAudio();
    prepIntervalRef.current = setInterval(() => {
      setPrepRemaining(prev => {
        if (prev <= 1) {
          clearInterval(prepIntervalRef.current);
          setPhase('work');
          fxPhaseChange(true); // start beep
          return 0;
        }
        fxCountdownTick(); // ticking sound
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(prepIntervalRef.current);
  }, []);

  // 2. Work Phase
  useEffect(() => {
    if (phase !== 'work' || !running) return;

    workIntervalRef.current = setInterval(() => {
      if (isMaxTime) {
        setElapsed(prev => prev + 1);
      } else {
        setWorkRemaining(prev => {
          if (prev <= 1) {
            clearInterval(workIntervalRef.current);
            setPhase('done');
            startAlarm();
            return 0;
          }
          if (prev <= 4) {
            fxCountdownTick();
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(workIntervalRef.current);
  }, [phase, running, isMaxTime, duration]);

  const togglePause = () => {
    setRunning(r => !r);
  };

  const finishWork = () => {
    stopAlarm();
    const finalValue = isMaxTime ? elapsed : duration;
    onDone(finalValue);
  };

  // Render
  const R = 52, circ = 2 * Math.PI * R;
  
  // Format MM:SS
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 350, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{name}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {phase === 'prep' ? 'Preparation' : isMaxTime ? 'Stopwatch' : 'Countdown'}
          </div>
        </div>
        <button onClick={onClose} aria-label="Close"
          style={{ fontSize: '1.5rem', color: 'var(--text-muted)', padding: '0 0.25rem', lineHeight: 1 }}>✕</button>
      </div>

      {/* Timer Display */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
        {phase === 'prep' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--warn)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Get Ready...</div>
            <div style={{ fontSize: '6rem', fontWeight: 900, color: 'var(--warn)', lineHeight: 1 }}>{prepRemaining}</div>
          </div>
        ) : (
          <div style={{ position: 'relative', width: 200, height: 200 }}>
            <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="100" cy="100" r={R * 1.5} fill="none" stroke="var(--border)" strokeWidth="10" />
              <circle cx="100" cy="100" r={R * 1.5} fill="none"
                stroke={phase === 'done' ? 'var(--success)' : 'var(--accent)'}
                strokeWidth="10"
                strokeDasharray={circ * 1.5}
                strokeDashoffset={isMaxTime ? 0 : circ * 1.5 * (1 - workRemaining / duration)}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '2.8rem', fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: phase === 'done' ? 'var(--success)' : 'var(--text)' }}>
                {phase === 'done' ? 'DONE' : isMaxTime ? formatTime(elapsed) : formatTime(workRemaining)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {running ? 'tap to pause' : '▶ paused'}
              </div>
            </div>
            <div onClick={togglePause} style={{ position: 'absolute', inset: 0, cursor: 'pointer', borderRadius: '50%' }} />
          </div>
        )}

        {/* Phase-specific actions */}
        {phase === 'work' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            {isMaxTime ? (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>Hanging... Tap finished when you drop!</div>
            ) : (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>Plank duration: {duration}s</div>
            )}
          </div>
        )}
      </div>

      {/* Footer action */}
      <div style={{ padding: '0 1.25rem calc(1.25rem + env(safe-area-inset-bottom))', width: '100%' }}>
        {phase === 'prep' ? (
          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => { clearInterval(prepIntervalRef.current); setPhase('work'); fxPhaseChange(true); }}>
            Skip Prep
          </button>
        ) : (
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={finishWork}>
            {phase === 'done' ? 'Done ✓' : 'Finish Set & Start Rest'}
          </button>
        )}
      </div>
    </div>
  );
}
