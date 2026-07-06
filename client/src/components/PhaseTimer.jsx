import { useState, useEffect, useRef, useCallback } from 'react';
import { fxCount, fxCountdownTick, fxTimerDone, fxPhaseChange, fxAchievement, unlockAudio } from '../lib/feedback';

/**
 * Full-screen interactive event timer with a large tally button.
 *  - `phases`: [{ name, seconds, work }]. Single phase = a countdown;
 *    multiple = an interval timer (e.g. 4×90s work / 60s rest) that auto-advances.
 *  - Tally only increments during `work` phases.
 *  - Fires countdown ticks (last 10s), phase-change and completion cues.
 */
export default function PhaseTimer({ event, phases, initialCount = 0, baseline, onDone, onClose }) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [remaining, setRemaining] = useState(phases[0].seconds);
  const [running, setRunning] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [finished, setFinished] = useState(false);

  const remRef = useRef(phases[0].seconds);
  const idxRef = useRef(0);
  const intervalRef = useRef(null);

  const phase = phases[phaseIdx];
  const isWork = phase.work;

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const advance = useCallback(() => {
    // Move to next phase, or finish.
    if (idxRef.current >= phases.length - 1) {
      stop();
      setRunning(false);
      setFinished(true);
      fxTimerDone();
      return;
    }
    idxRef.current += 1;
    const next = phases[idxRef.current];
    remRef.current = next.seconds;
    setPhaseIdx(idxRef.current);
    setRemaining(next.seconds);
    fxPhaseChange(next.work);
  }, [phases, stop]);

  const startTick = useCallback(() => {
    stop();
    intervalRef.current = setInterval(() => {
      remRef.current -= 1;
      setRemaining(remRef.current);
      if (remRef.current <= 0) {
        advance();
      } else if (remRef.current <= 10) {
        fxCountdownTick();
      }
    }, 1000);
  }, [advance, stop]);

  const toggle = () => {
    unlockAudio();
    if (finished) return;
    if (running) { stop(); setRunning(false); }
    else { startTick(); setRunning(true); }
  };

  const tally = () => {
    if (!isWork || finished) return;
    setCount(prev => {
      const next = prev + 1;
      if (baseline != null && prev < baseline && next >= baseline) fxAchievement();
      else fxCount();
      return next;
    });
  };

  useEffect(() => () => stop(), [stop]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = remaining / phase.seconds;
  const R = 52;
  const circ = 2 * Math.PI * R;
  const urgent = remaining <= 10 && running;
  const roundLabel = phases.length > 1 ? `${phase.name} · ${phases.filter(p => p.work).length} rounds` : phase.name;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{event.name}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{roundLabel}</div>
        </div>
        <button onClick={() => onClose()} aria-label="Close"
          style={{ fontSize: '1.5rem', color: 'var(--text-muted)', padding: '0 0.25rem', lineHeight: 1 }}>✕</button>
      </div>

      {/* Countdown ring */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '0.5rem' }}>
        <div style={{ position: 'relative', width: 150, height: 150 }} onClick={toggle}>
          <svg width="150" height="150" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="75" cy="75" r={R} fill="none" stroke="var(--border)" strokeWidth="8" />
            <circle cx="75" cy="75" r={R} fill="none"
              stroke={finished ? 'var(--success)' : isWork ? 'var(--accent)' : 'var(--run)'}
              strokeWidth="8" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className={urgent ? 'rest-done-pulse' : undefined}
              style={{ fontSize: '2.1rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: finished ? 'var(--success)' : urgent ? 'var(--danger)' : 'var(--text)' }}>
              {finished ? 'DONE' : `${mins}:${String(secs).padStart(2, '0')}`}
            </div>
            {!finished && <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2 }}>{running ? 'tap to pause' : '▶ tap to start'}</div>}
          </div>
        </div>
        {phases.length > 1 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            {phases.map((p, i) => (
              <div key={i} title={p.name} style={{
                width: p.work ? 22 : 10, height: 6, borderRadius: 999,
                background: i < phaseIdx ? 'var(--success)' : i === phaseIdx ? (p.work ? 'var(--accent)' : 'var(--run)') : 'var(--border)',
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Big tally button */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '1rem 1.25rem', gap: '1rem' }}>
        <button onClick={tally} disabled={!isWork || finished}
          style={{
            width: '100%', aspectRatio: '1.6', borderRadius: 24,
            background: isWork && !finished ? 'var(--accent)' : 'var(--bg-elevated)',
            color: isWork && !finished ? '#000' : 'var(--text-muted)',
            border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
            opacity: isWork || finished ? 1 : 0.6, transition: 'transform 0.05s',
          }}>
          <span style={{ fontSize: '4.5rem', fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {finished ? `${event.unit} logged` : isWork ? `tap to add ${event.unit.replace(/s$/, '')}` : 'rest'}
          </span>
          {baseline != null && (
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isWork && !finished ? '#00000099' : 'var(--text-muted)' }}>
              {count >= baseline ? `+${count - baseline} over baseline` : `${baseline - count} to baseline (${baseline})`}
            </span>
          )}
        </button>
      </div>

      {/* Footer actions */}
      <div style={{ display: 'flex', gap: 8, padding: '0 1.25rem calc(1.25rem + env(safe-area-inset-bottom))' }}>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setCount(c => Math.max(0, c - 1))}>− Undo</button>
        <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => onDone(count)}>
          {finished ? 'Save Result ✓' : 'Save & Close'}
        </button>
      </div>
    </div>
  );
}
