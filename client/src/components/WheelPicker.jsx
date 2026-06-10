import { useRef, useEffect, useCallback } from 'react';

const ITEM_H = 40; // px height per row

/**
 * Vertical scroll-snap wheel picker.
 * Two interaction methods: drag/scroll the wheel, OR tap the ▲ / ▼ steppers.
 *
 *   values   array of numbers
 *   value    current value (snaps to nearest if not exact)
 *   onChange (newValue) => void
 *   format   (v) => string  display formatter
 *   width    px
 */
export function WheelPicker({ values, value, onChange, format = v => `${v}`, width = 60 }) {
  const scrollRef = useRef(null);
  const settleRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // nearest index to current value
  let idx = 0, best = Infinity;
  values.forEach((v, i) => { const d = Math.abs(v - value); if (d < best) { best = d; idx = i; } });

  // keep scroll position synced to selected value
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const target = idx * ITEM_H;
    if (Math.abs(el.scrollTop - target) > 2) el.scrollTop = target;
  }, [idx]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    clearTimeout(settleRef.current);
    settleRef.current = setTimeout(() => {
      const i = Math.max(0, Math.min(values.length - 1, Math.round(el.scrollTop / ITEM_H)));
      const target = i * ITEM_H;
      if (Math.abs(el.scrollTop - target) > 1) el.scrollTo({ top: target, behavior: 'smooth' });
      if (values[i] !== value) onChangeRef.current(values[i]);
    }, 100);
  }, [values, value]);

  const step = (dir) => {
    const ni = Math.max(0, Math.min(values.length - 1, idx + dir));
    if (values[ni] !== value) onChange(values[ni]);
  };

  const chevron = (dir) => (
    <button
      onClick={() => step(dir)}
      aria-label={dir < 0 ? 'increase' : 'decrease'}
      style={{
        width, height: 22, lineHeight: '22px', fontSize: '0.8rem',
        color: 'var(--text-muted)', background: 'transparent',
      }}>
      {dir < 0 ? '▲' : '▼'}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {chevron(-1)}
      <div style={{ position: 'relative', height: ITEM_H * 3, width }}>
        {/* selection band */}
        <div style={{
          position: 'absolute', top: ITEM_H, height: ITEM_H, left: 0, right: 0,
          borderTop: '1px solid var(--accent)', borderBottom: '1px solid var(--accent)',
          background: 'var(--accent)12', pointerEvents: 'none', borderRadius: 4,
        }} />
        <div
          ref={scrollRef}
          className="wheel-scroll"
          onScroll={onScroll}
          style={{
            height: '100%', overflowY: 'scroll', scrollSnapType: 'y mandatory',
            paddingTop: ITEM_H, paddingBottom: ITEM_H, WebkitOverflowScrolling: 'touch',
          }}>
          {values.map((v, i) => (
            <div key={v} style={{
              height: ITEM_H, scrollSnapAlign: 'center',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: i === idx ? 800 : 600, fontVariantNumeric: 'tabular-nums',
              fontSize: i === idx ? '1.15rem' : '1rem',
              color: i === idx ? 'var(--text)' : 'var(--text-muted)',
              opacity: i === idx ? 1 : 0.45, transition: 'opacity 0.1s, color 0.1s',
            }}>
              {format(v)}
            </div>
          ))}
        </div>
      </div>
      {chevron(1)}
    </div>
  );
}

const range = (from, to, step = 1) => {
  const out = [];
  for (let v = from; v <= to; v += step) out.push(v);
  return out;
};

const pad2 = v => String(v).padStart(2, '0');

/**
 * mm:ss time picker. Value is total seconds.
 *   seconds   number
 *   onChange  (totalSeconds) => void
 */
export function TimePicker({ seconds, onChange, maxMin = 30, secStep = 1 }) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const minutes = range(0, maxMin);
  const secsArr = range(0, 59, secStep);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      <WheelPicker values={minutes} value={m} onChange={nm => onChange(nm * 60 + s)} format={pad2} />
      <div style={{ fontSize: '1.3rem', fontWeight: 800, alignSelf: 'center', marginTop: -4 }}>:</div>
      <WheelPicker values={secsArr} value={s} onChange={ns => onChange(m * 60 + ns)} format={pad2} />
    </div>
  );
}

/** Single-value number wheel. */
export function NumberWheel({ value, onChange, from, to, step = 1, unit }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <WheelPicker values={range(from, to, step)} value={value} onChange={onChange} width={72} />
      {unit && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{unit}</span>}
    </div>
  );
}

export const fmtTime = (sec) => `${Math.floor(sec / 60)}:${pad2(Math.round(sec % 60))}`;
