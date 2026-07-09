import { openDrawer } from './Drawer';

/**
 * Shared page header: hamburger (opens the drawer) + accent title + subtitle,
 * with an optional right-side slot (e.g. WOD's Tdy/Tmr/Week toggle).
 */
export default function PageHeader({ title, subtitle, right = null, titleId }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button onClick={openDrawer} aria-label="Open menu"
        style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4,
          width: 34, height: 34, flexShrink: 0, borderRadius: 8,
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          padding: '0 8px',
        }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{ display: 'block', height: 2, borderRadius: 2, background: 'var(--text-dim)' }} />
        ))}
      </button>
      <div id={titleId} style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.02em', color: 'var(--accent)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}
