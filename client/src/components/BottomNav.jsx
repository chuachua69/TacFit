import { useNavigate } from 'react-router-dom';

const TABS = [
  { key: 'dashboard', label: 'Home',     icon: '🏠', path: '/dashboard' },
  { key: 'overview',  label: 'Plan',     icon: '📅', path: '/overview' },
  { key: 'settings',  label: 'Settings', icon: '⚙️',  path: '/settings' },
];

export default function BottomNav({ active }) {
  const navigate = useNavigate();

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--bg-card)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      zIndex: 50,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {TABS.map(tab => (
        <button key={tab.key} onClick={() => navigate(tab.path)}
          style={{
            flex: 1, padding: '0.75rem 0',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            background: 'none', border: 'none',
            color: active === tab.key ? 'var(--accent)' : 'var(--text-muted)',
            transition: 'color 0.15s',
          }}>
          <span style={{ fontSize: '1.2rem' }}>{tab.icon}</span>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {tab.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
