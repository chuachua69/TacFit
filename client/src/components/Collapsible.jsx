import { useState } from 'react';

/** Accordion card — header toggles a bordered body open/closed. */
export default function Collapsible({ title, subtitle, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0.95rem 1.1rem', background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: open ? 'var(--radius-lg) var(--radius-lg) 0 0' : 'var(--radius-lg)',
        textAlign: 'left',
      }}>
        <div>
          <div style={{ fontWeight: 700 }}>{title}</div>
          {subtitle && <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 1 }}>{subtitle}</div>}
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
      </button>
      {open && (
        <div style={{
          border: '1px solid var(--border)', borderTop: 'none',
          borderRadius: '0 0 var(--radius-lg) var(--radius-lg)', padding: '1.1rem',
          display: 'flex', flexDirection: 'column', gap: '1rem',
        }}>
          {children}
        </div>
      )}
    </div>
  );
}
