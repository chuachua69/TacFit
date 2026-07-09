import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Simple pub/sub so any header's hamburger can open the single app drawer.
let openDrawerFn = null;
export function openDrawer() { openDrawerFn?.(); }

const ITEMS = [
  { icon: '📚', label: 'Exercise Library', sub: 'Catalog, recovery status, custom exercises', path: '/exercises' },
  { icon: '🗓️', label: 'Workout History', sub: 'Everything you\'ve logged', path: '/history' },
  { icon: '👤', label: 'Profile', sub: 'Account & program', path: '/profile' },
  { icon: '⚙️', label: 'Settings', sub: 'Loads, lifts, sound', path: '/settings' },
];

/**
 * Left slide-out navigation drawer. Secondary surfaces only — the bottom
 * nav keeps WOD/Test/Progress/Settings. Opens via hamburger (PageHeader)
 * or an edge-swipe from the left 24px of the screen.
 */
export default function Drawer() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    openDrawerFn = () => setOpen(true);
    return () => { openDrawerFn = null; };
  }, []);

  // Edge-swipe right to open; swipe left anywhere on the panel to close.
  useEffect(() => {
    let startX = null, startY = null, fromEdge = false;
    const onStart = (e) => {
      const t = e.touches[0];
      startX = t.clientX; startY = t.clientY;
      fromEdge = t.clientX <= 24;
    };
    const onMove = (e) => {
      if (startX == null) return;
      const t = e.touches[0];
      const dx = t.clientX - startX, dy = Math.abs(t.clientY - startY);
      if (dy > 60) { startX = null; return; }        // vertical scroll, not a swipe
      if (!open && fromEdge && dx > 60) { setOpen(true); startX = null; }
      if (open && dx < -60) { setOpen(false); startX = null; }
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
    };
  }, [open]);

  const go = useCallback((path) => { setOpen(false); navigate(path); }, [navigate]);

  return (
    <>
      {/* Overlay */}
      <div onClick={() => setOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 90,
          background: 'rgba(0,0,0,0.6)',
          opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity .25s',
        }} />

      {/* Panel */}
      <aside style={{
        position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 91,
        width: 'min(78vw, 300px)',
        background: 'var(--bg-card)', borderRight: '1px solid var(--border)',
        transform: open ? 'translateX(0)' : 'translateX(-102%)',
        transition: 'transform .25s ease', display: 'flex', flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top)',
      }}>
        <div style={{ padding: '1.4rem 1.2rem 1rem' }}>
          <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '0.08em', color: 'var(--accent)' }}>TACFIT</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tactical assessment & training</div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', padding: '0 0.6rem', gap: 2 }}>
          {ITEMS.map(it => (
            <button key={it.path} onClick={() => go(it.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                padding: '0.75rem 0.7rem', borderRadius: 'var(--radius)',
                background: 'none', border: 'none', color: 'var(--text)',
              }}>
              <span style={{ fontSize: '1.15rem' }}>{it.icon}</span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem' }}>{it.label}</span>
                <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)' }}>{it.sub}</span>
              </span>
            </button>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', padding: '1rem 1.2rem', fontSize: '0.66rem', color: 'var(--text-muted)', opacity: 0.7 }}>
          v{__APP_VERSION__} · {__BUILD_TIME__}
        </div>
      </aside>
    </>
  );
}
