import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Full-screen phase countdown. Drives one or more phases in sequence
 * (e.g. a single 2:30 work block, or 4× [90s work / 60s rest]).
 * Low-volume tick each second, urgent ticks in the final 3s, chime on
 * phase change and completion + haptics.
 *
 *   label   string shown at top
 *   phases  [{ name, seconds, rest? }]
 */
export default function EventTimer({ label = 'Timer', phases, onClose }) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [remaining, setRemaining] = useState(phases[0].seconds);
  const [running, setRunning] = useState(true);
  const [finished, setFinished] = useState(false);

  const intervalRef = useRef(null);
  const remRef = useRef(phases[0].seconds);
  const phaseRef = useRef(0);

  // ── audio ──
  const ctxRef = useRef(null);
  const getCtx = () => {
    if (!ctxRef.current) {
      try { ctxRef.current = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  };
  const beep = useCallback((freq, dur, vol, type = 'sine') => {
    const ctx = getCtx(); if (!ctx) return;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    const t0 = ctx.currentTime;
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(t0); o.stop(t0 + dur);
  }, []);
  const tick = useCallback(urgent => beep(urgent ? 1100 : 720, urgent ? 0.06 : 0.025, urgent ? 0.07 : 0.03, 'square'), [beep]);
  const phaseChime = useCallback(() => { beep(880, 0.18, 0.12, 'triangle'); if (navigator.vibrate) navigator.vibrate(60); }, [beep]);
  const doneChime = useCallback(() => {
    [880, 1174.7, 1567.98].forEach((f, i) => setTimeout(() => beep(f, 0.22, 0.13, 'triangle'), i * 130));
    if (navigator.vibrate) navigator.vibrate([90, 60, 180]);
  }, [beep]);

  const start = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      remRef.current -= 1;
      if (remRef.current <= 0) {
        if (phaseRef.current < phases.length - 1) {
          phaseRef.current += 1;
          remRef.current = phases[phaseRef.current].seconds;
          setPhaseIdx(phaseRef.current);
          setRemaining(remRef.current);
          phaseChime();
        } else {
          clearInterval(intervalRef.current);
          setRemaining(0);
          setRunning(false);
          setFinished(true);
          doneChime();
        }
      } else {
        setRemaining(remRef.current);
        tick(remRef.current <= 3);
      }
    }, 1000);
  }, [phases, tick, phaseChime, doneChime]);

  useEffect(() => { start(); return () => clearInterval(intervalRef.current); }, []);

  const togglePause = () => {
    if (finished) return;
    if (running) { clearInterval(intervalRef.current); setRunning(false); }
    else { start(); setRunning(true); }
  };

  const skipPhase = () => {
    clearInterval(intervalRef.current);
    if (phaseRef.current < phases.length - 1) {
      phaseRef.current += 1;
      remRef.current = phases[phaseRef.current].seconds;
      setPhaseIdx(phaseRef.current);
      setRemaining(remRef.current);
      if (running) start();
    } else {
      setRemaining(0); setRunning(false); setFinished(true);
    }
  };

  const restart = () => {
    clearInterval(intervalRef.current);
    phaseRef.current = 0; remRef.current = phases[0].seconds;
    setPhaseIdx(0); setRemaining(phases[0].seconds); setFinished(false); setRunning(true);
    start();
  };

  const cur = phases[phaseIdx];
  const isRest = /rest/i.test(cur.name);
  const accent = finished ? 'var(--success)' : isRest ? 'var(--warn)' : 'var(--accent)';
  const pct = cur.seconds ? remaining / cur.seconds : 0;
  const r = 52, C = 2 * Math.PI * r;
  const mins = Math.floor(remaining / 60), secs = remaining % 60;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 220, background: 'rgba(0,0,0,0.93)', display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: '20px 20px 0 0', padding: '1.5rem', width: '100%', maxWidth: 480, margin: '0 auto', borderTop: '1px solid var(--border)' }}>
        <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 999, margin: '0 auto 1.25rem' }} />

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
            {label}
          </div>
          {phases.length > 1 && (
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: accent, marginBottom: 12 }}>
              {cur.name} · Round {Math.ceil((phaseIdx + 1) / (phases.some(p => /rest/i.test(p.name)) ? 2 : 1))}/{Math.ceil(phases.length / (phases.some(p => /rest/i.test(p.name)) ? 2 : 1))}
            </div>
          )}

          <div style={{ position: 'relative', width: 140, height: 140, margin: '8px auto 16px' }} onClick={togglePause}>
            <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="70" cy="70" r={r} fill="none" stroke="var(--border)" strokeWidth="7" />
              <circle cx="70" cy="70" r={r} fill="none" stroke={accent} strokeWidth="7"
                strokeDasharray={C} strokeDashoffset={C * (1 - pct)} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: finished ? 'var(--success)' : 'var(--text)' }}>
                {finished ? 'DONE' : `${mins}:${String(secs).padStart(2, '0')}`}
              </div>
              {!finished && (
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {running ? 'tap to pause' : '▶ paused'}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button className="btn btn-secondary" onClick={restart}>↺ Restart</button>
            {!finished && phaseIdx < phases.length - 1 && (
              <button className="btn btn-secondary" onClick={skipPhase}>Skip ⏭</button>
            )}
          </div>
        </div>

        <button className="btn btn-primary" onClick={onClose}>
          {finished ? 'Done ✓' : 'Close'}
        </button>
      </div>
    </div>
  );
}
