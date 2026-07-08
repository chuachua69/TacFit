import { fxCount, fxUncount, fxAchievement } from '../lib/feedback';

/**
 * Rep stepper with sensory feedback. Fires an achievement cue the moment the
 * value crosses `baseline` upward (entering the bonus zone).
 */
export default function Stepper({ value, onChange, step = 1, baseline, big = false }) {
  const set = (next) => {
    const v = Math.max(0, next);
    if (v > value) {
      if (baseline != null && value < baseline && v >= baseline) fxAchievement();
      else fxCount();
    } else if (v < value) {
      fxUncount();
    }
    onChange(v);
  };

  const btn = (label, delta, aria) => (
    <button aria-label={aria} onClick={() => set(value + delta)}
      style={{
        width: big ? 64 : 44, height: big ? 64 : 44, flexShrink: 0,
        borderRadius: 12, fontSize: big ? '1.8rem' : '1.4rem', fontWeight: 800,
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        lineHeight: 1,
      }}>
      {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: big ? 16 : 10, justifyContent: 'center' }}>
      {btn('−', -step, 'decrease')}
      <input
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={e => {
          const val = Math.max(0, parseInt(e.target.value) || 0);
          set(val);
        }}
        onFocus={e => e.target.select()}
        style={{
          minWidth: big ? 96 : 64,
          width: big ? 110 : 80,
          textAlign: 'center',
          fontSize: big ? '2.8rem' : '1.8rem',
          fontWeight: 800,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          color: baseline != null && value >= baseline ? 'var(--accent)' : 'var(--text)',
          padding: '0.2rem 0',
          outline: 'none',
          fontVariantNumeric: 'tabular-nums',
        }}
      />
      {btn('+', step, 'increase')}
    </div>
  );
}
