import { useEffect, useRef } from 'react';
import { rankFor } from '../store/character';

/**
 * Promotion celebration shown when the soldier reaches a new level.
 * Plays a short fanfare + haptic buzz on mount.
 */
export default function PromotionModal({ fromLevel, toLevel, onClose }) {
  const rank = rankFor(toLevel);
  const prevRank = rankFor(fromLevel);
  const gotNewTab = rank.tab && rank.tab !== prevRank.tab;
  const ctxRef = useRef(null);

  useEffect(() => {
    // Fanfare — ascending triad
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = ctx;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
      notes.forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.value = f;
        const t0 = ctx.currentTime + i * 0.12;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.4);
        o.connect(g); g.connect(ctx.destination);
        o.start(t0); o.stop(t0 + 0.42);
      });
    } catch { /* audio not available */ }

    if (navigator.vibrate) navigator.vibrate([40, 60, 40, 60, 120]);

    return () => { try { ctxRef.current?.close(); } catch { /* noop */ } };
  }, []);

  return (
    <div className="promo-overlay" onClick={onClose}>
      <div className="promo-card" onClick={e => e.stopPropagation()}>
        <div style={{
          fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4,
        }}>
          Promotion
        </div>

        <div className="promo-badge" style={{ color: rank.color }}>
          {gotNewTab ? '🎖️' : '⭐'}
        </div>

        <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 4 }}>
          {rank.title}
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 6 }}>
          {prevRank.title} &nbsp;→&nbsp;
          <span style={{ color: rank.color, fontWeight: 700 }}>{rank.title}</span>
        </div>

        {gotNewTab && (
          <div style={{
            marginTop: 16, padding: '0.6rem 1rem',
            background: `${rank.color}1a`,
            border: `1px solid ${rank.color}`,
            borderRadius: 12,
          }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              New Qualification
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: rank.color, marginTop: 2 }}>
              {rank.tab} Tab earned
            </div>
          </div>
        )}

        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 16 }}>
          Level {toLevel} reached. New gear unlocked in the Bunk.
        </div>

        <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={onClose}>
          Outstanding ✓
        </button>
      </div>
    </div>
  );
}
