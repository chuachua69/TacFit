/**
 * Lightweight SVG radar / spider chart.
 *   axes  [{ label, value }]  value 0–100
 */
export default function RadarChart({ axes, size = 280, color = 'var(--accent)' }) {
  const n = axes.length;
  if (n < 3) return null;
  const cx = size / 2, cy = size / 2;
  const R = size / 2 - 42;

  const ang = i => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i, r) => [cx + Math.cos(ang(i)) * r, cy + Math.sin(ang(i)) * r];
  const polyAt = r => axes.map((_, i) => pt(i, r).join(',')).join(' ');
  const dataPoly = axes.map((a, i) => pt(i, R * (Math.max(0, Math.min(100, a.value)) / 100)).join(',')).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      {/* grid rings */}
      {[0.25, 0.5, 0.75, 1].map(r => (
        <polygon key={r} points={polyAt(R * r)} fill="none" stroke="var(--border)" strokeWidth="1" />
      ))}
      {/* spokes */}
      {axes.map((_, i) => {
        const [x, y] = pt(i, R);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" strokeWidth="1" />;
      })}
      {/* data */}
      <polygon points={dataPoly} fill={color} fillOpacity="0.22" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      {axes.map((a, i) => {
        const [x, y] = pt(i, R * (Math.max(0, Math.min(100, a.value)) / 100));
        return <circle key={i} cx={x} cy={y} r="3" fill={color} />;
      })}
      {/* labels */}
      {axes.map((a, i) => {
        const [lx, ly] = pt(i, R + 18);
        const anchor = Math.abs(lx - cx) < 6 ? 'middle' : lx > cx ? 'start' : 'end';
        return (
          <text key={i} x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle"
            style={{ fontSize: '11px', fontWeight: 700, fill: 'var(--text-dim)' }}>
            {a.label}
            <tspan style={{ fill: color, fontWeight: 800 }}> {a.value}</tspan>
          </text>
        );
      })}
    </svg>
  );
}
