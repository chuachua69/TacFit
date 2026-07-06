import { useNavigate } from 'react-router-dom';

const TABS = [
  { key: 'wod',      label: 'WOD',      icon: '💪', path: '/' },
  { key: 'test',     label: 'Test',     icon: '🎯', path: '/test' },
  { key: 'progress', label: 'Progress', icon: '📈', path: '/progress' },
  { key: 'settings', label: 'Settings', icon: '⚙️', path: '/settings' },
];

export default function BottomNav({ active }) {
  const navigate = useNavigate();
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--bg-card)', borderTop: '1px solid var(--border)',
      display: 'flex', zIndex: 50, paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {TABS.map(tab => (
        <button key={tab.key} onClick={() => navigate(tab.path)}
          style={{
            flex: 1, padding: '0.6rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            background: 'none', border: 'none',
            color: active === tab.key ? 'var(--accent)' : 'var(--text-muted)',
          }}>
          <span style={{ fontSize: '1.1rem' }}>{tab.icon}</span>
          <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
