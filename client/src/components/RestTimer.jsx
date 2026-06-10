import { useState, useEffect, useRef, useCallback } from 'react';

const PRESETS = [60, 90, 120, 180];

export default function RestTimer({ onDismiss }) {
  const [seconds, setSeconds] = useState(90);
  const [remaining, setRemaining] = useState(90);
  const [running, setRunning] = useState(true);
  const [muted, setMuted] = useState(false);
  const intervalRef = useRef(null);
  const remainingRef = useRef(90);

  // ── Audio (Web Audio API — no asset files needed) ──
  const ctxRef = useRef(null);
  const mutedRef = useRef(false);
  mutedRef.current = muted;

  const getCtx = () => {
    if (!ctxRef.current) {
      try { ctxRef.current = new (window.AudioContext || window.webkitAudioContext)(); }
      catch { return null; }
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  };

  const beep = useCallback((freq, dur, vol, type = 'sine') => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    const t0 = ctx.currentTime;
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(t0); o.stop(t0 + dur);
  }, []);

  // Low-volume tick each second; sharper for the final 3s countdown
  const tick = useCallback((urgent) => {
    beep(urgent ? 1100 : 720, urgent ? 0.06 : 0.025, urgent ? 0.07 : 0.03, 'square');
  }, [beep]);

  // Rising 3-note chime + haptic on completion
  const playDone = useCallback(() => {
    [880, 1174.7, 1567.98].forEach((f, i) =>
      setTimeout(() => beep(f, 0.22, 0.13, 'triangle'), i * 130));
    if (navigator.vibrate) navigator.vibrate([90, 60, 180]);
  }, [beep]);

  // keep latest callbacks reachable from the stable interval closure
  const tickRef = useRef(tick); tickRef.current = tick;
  const doneRef = useRef(playDone); doneRef.current = playDone;

  const startInterval = useCallback((initial) => {
    clearInterval(intervalRef.current);
    remainingRef.current = initial;
    intervalRef.current = setInterval(() => {
      remainingRef.current -= 1;
      setRemaining(remainingRef.current);
      if (remainingRef.current <= 0) {
        clearInterval(intervalRef.current);
        setRunning(false);
        doneRef.current();
      } else if (remainingRef.current <= 3) {
        tickRef.current(true);
      } else {
        tickRef.current(false);
      }
    }, 1000);
  }, []);

  useEffect(() => {
    startInterval(90);
    return () => clearInterval(intervalRef.current);
  }, []);

  const reset = (s) => {
    setSeconds(s);
    setRemaining(s);
    setRunning(true);
    startInterval(s);
  };

  const togglePause = () => {
    if (running) {
      clearInterval(intervalRef.current);
      setRunning(false);
    } else {
      startInterval(remaining);
      setRunning(true);
    }
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Rest Timer
            </div>
            <button
              onClick={() => setMuted(m => !m)}
              aria-label={muted ? 'Unmute' : 'Mute'}
              style={{
                fontSize: '0.95rem', lineHeight: 1, padding: '2px 6px', borderRadius: 8,
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                color: muted ? 'var(--text-muted)' : 'var(--accent)',
              }}>
              {muted ? '🔕' : '🔔'}
            </button>
          </div>

          <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 16px' }}
            onClick={togglePause}>
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
              cursor: 'pointer',
            }}>
              <div
                className={done ? 'rest-done-pulse' : undefined}
                style={{ fontSize: '1.8rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: done ? 'var(--success)' : 'var(--text)' }}>
                {done ? 'GO' : `${mins}:${String(secs).padStart(2, '0')}`}
              </div>
              {!done && (
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {running ? 'tap to pause' : '▶ paused'}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
            {PRESETS.map(s => (
              <button key={s} onClick={() => reset(s)}
                style={{
                  padding: '0.35rem 0.75rem', borderRadius: 999,
                  background: seconds === s ? 'var(--accent)30' : 'var(--bg-elevated)',
                  border: `1px solid ${seconds === s ? 'var(--accent)' : 'var(--border)'}`,
                  fontSize: '0.8rem', fontWeight: 700,
                  color: seconds === s ? 'var(--accent)' : 'var(--text-muted)',
                }}>
                {s >= 60 ? `${s / 60}m` : `${s}s`}
              </button>
            ))}
          </div>
        </div>

        <button className="btn btn-primary" onClick={onDismiss}>
          {done ? 'Start Next Set ✓' : 'Skip Rest'}
        </button>
      </div>
    </div>
  );
}
