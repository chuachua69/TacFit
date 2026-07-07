import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { fxCountdownTick, startAlarm, stopAlarm, fxPhaseChange, unlockAudio } from '../lib/feedback';
import { pushGuard } from '../lib/guard';

/**
 * EMOM (Every Minute On the Minute) runner. Flattens the session's minute
 * tasks across `rounds` into 60-second phases, auto-advancing and cueing each
 * minute change. Derives minute labels from the session's exercises
 * ("Min N — X" / scheme).
 */
export default function EmomTimer({ session, onClose }) {
  const rounds = session.emom?.rounds || 3;
  const phases = useMemo(() => {
    const minutes = session.exercises.map(ex => ({
      label: ex.name.replace(/^Min\s*\d+\s*—\s*/, ''),
      detail: ex.scheme,
    }));
    const out = [];
    for (let r = 0; r < rounds; r++) {
      minutes.forEach((m, mi) => out.push({
        round: r + 1, minNo: mi + 1, label: m.label, detail: m.detail, rest: /rest/i.test(m.label),
      }));
    }
    return out;
  }, [session.exercises, rounds]);

  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const idxRef = useRef(0);
  const remRef = useRef(60);
  const intervalRef = useRef(null);

  const stop = useCallback(() => { clearInterval(intervalRef.current); intervalRef.current = null; }, []);

  const advance = useCallback(() => {
    if (idxRef.current >= phases.length - 1) {
      stop(); setRunning(false); setFinished(true); startAlarm(); return;
    }
    idxRef.current += 1;
    const next = phases[idxRef.current];
    remRef.current = 60;
    setIdx(idxRef.current); setRemaining(60);
    fxPhaseChange(!next.rest);
  }, [phases, stop]);

  const startTick = useCallback(() => {
    stop();
    intervalRef.current = setInterval(() => {
      remRef.current -= 1;
      setRemaining(remRef.current);
      if (remRef.current <= 0) advance();
      else if (remRef.current <= 3) fxCountdownTick();
    }, 1000);
  }, [advance, stop]);

  const toggle = () => {
    unlockAudio();
    if (finished) return;
    if (running) { stop(); setRunning(false); }
    else { startTick(); setRunning(true); }
  };

  useEffect(() => () => { stop(); stopAlarm(); }, [stop]);
  useEffect(() => pushGuard(), []);
  const close = () => { stopAlarm(); onClose(); };

  const phase = phases[idx];
  const mins = Math.floor(remaining / 60), secs = remaining % 60;
  const R = 56, circ = 2 * Math.PI * R;
  const urgent = remaining <= 3 && running;
  const color = finished ? 'var(--success)' : phase.rest ? 'var(--run)' : 'var(--accent)';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 330, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{session.title}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {finished ? 'Complete' : `EMOM · Round ${phase.round}/${rounds}`}
          </div>
        </div>
        <button onClick={close} aria-label="Close" style={{ fontSize: '1.5rem', color: 'var(--text-muted)', lineHeight: 1, padding: '0 0.25rem' }}>✕</button>
      </div>

      {/* Ring */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '0.5rem' }}>
        <div style={{ position: 'relative', width: 160, height: 160, cursor: 'pointer' }} onClick={toggle}>
          <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="80" cy="80" r={R} fill="none" stroke="var(--border)" strokeWidth="8" />
            <circle cx="80" cy="80" r={R} fill="none" stroke={color} strokeWidth="8"
              strokeDasharray={circ} strokeDashoffset={circ * (1 - remaining / 60)} strokeLinecap="round"
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
        {/* Round progress dots */}
        <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
          {Array.from({ length: rounds }).map((_, r) => (
            <div key={r} style={{ width: 20, height: 6, borderRadius: 999, background: r < phase.round - 1 ? 'var(--success)' : r === phase.round - 1 ? 'var(--accent)' : 'var(--border)' }} />
          ))}
        </div>
      </div>

      {/* Current task */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '1.5rem', gap: 6 }}>
        {finished ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.4rem' }}>✅</div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', marginTop: 8 }}>{rounds} rounds complete</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: phase.rest ? 'var(--run)' : 'var(--accent)' }}>
              Minute {phase.minNo}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, textAlign: 'center', lineHeight: 1.1, color: phase.rest ? 'var(--run)' : 'var(--text)' }}>
              {phase.label}
            </div>
            <div style={{ fontSize: '1rem', color: 'var(--text-dim)' }}>{phase.detail}</div>
            {/* Next up */}
            {idx < phases.length - 1 && (
              <div style={{ marginTop: 18, fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                next · {phases[idx + 1].label}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '0 1.25rem calc(1.25rem + env(safe-area-inset-bottom))', display: 'flex', gap: 8 }}>
        {!finished && (
          <button className="btn btn-secondary" style={{ width: 'auto', padding: '0.85rem 1.1rem' }} onClick={toggle}>
            {running ? '⏸' : '▶'}
          </button>
        )}
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={close}>
          {finished ? 'Done ✓' : 'Close'}
        </button>
      </div>
    </div>
  );
}
