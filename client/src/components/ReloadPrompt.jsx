import { useRegisterSW } from 'virtual:pwa-register/react';

const UPDATE_CHECK_MS = 60 * 60 * 1000; // re-check for a new build every hour

/**
 * "New version available — Reload" banner. Registers the service worker and,
 * when a new build is waiting, shows a prompt so the user opts into the update
 * (instead of a silent auto-reload). Also surfaces a brief offline-ready note.
 */
export default function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (!r) return;
      // Poll for a newer service worker periodically...
      setInterval(() => r.update().catch(() => {}), UPDATE_CHECK_MS);
      // ...and whenever the app is brought back to the foreground.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') r.update().catch(() => {});
      });
    },
  });

  if (!offlineReady && !needRefresh) return null;

  const close = () => { setOfflineReady(false); setNeedRefresh(false); };

  return (
    <div style={{
      position: 'fixed', left: 12, right: 12, bottom: 'calc(12px + env(safe-area-inset-bottom))',
      zIndex: 500, display: 'flex', justifyContent: 'center', pointerEvents: 'none',
    }}>
      <div style={{
        pointerEvents: 'auto',
        width: '100%', maxWidth: 440,
        background: 'var(--bg-elevated)',
        border: `1px solid ${needRefresh ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 14,
        padding: '0.85rem 1rem',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
      }}>
        <div style={{ flex: 1, fontSize: '0.88rem' }}>
          {needRefresh ? (
            <>
              <div style={{ fontWeight: 700, color: 'var(--accent)' }}>New version available</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 1 }}>
                Reload to get the latest TacFit.
              </div>
            </>
          ) : (
            <div style={{ fontWeight: 600 }}>✓ Ready to work offline</div>
          )}
        </div>

        {needRefresh && (
          <button
            className="btn btn-primary"
            style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            onClick={() => updateServiceWorker(true)}>
            Reload
          </button>
        )}
        <button
          aria-label="Dismiss"
          onClick={close}
          style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            color: 'var(--text-muted)', background: 'transparent', fontSize: '1.1rem', lineHeight: 1,
          }}>
          ✕
        </button>
      </div>
    </div>
  );
}
