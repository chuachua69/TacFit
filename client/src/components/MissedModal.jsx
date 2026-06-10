import { storage } from '../store/storage';

export default function MissedModal({ session, plan, onClose, onDone }) {
  const handleOption = (choice) => {
    storage.addLog({ sessionId: session.id, status: choice, markedAt: new Date().toISOString() });

    if (choice === 'missed-rebuild') {
      // Mark all pending sessions between then and now as missed, reschedule remainder from today
      const allSessions = plan.weeks.flatMap(w => w.sessions);
      const idx = allSessions.findIndex(s => s.id === session.id);
      const today = new Date().toISOString().split('T')[0];
      let futureOffset = 0;

      allSessions.slice(idx).forEach(s => {
        if (s.date <= today && s.status === 'pending') {
          storage.addLog({ sessionId: s.id, status: 'missed', markedAt: new Date().toISOString() });
        } else if (s.date > today) {
          const d = new Date();
          d.setDate(d.getDate() + futureOffset);
          s.date = d.toISOString().split('T')[0];
          futureOffset++;
        }
      });
      storage.setPlan(plan);
    }

    if (choice === 'missed-repeat') {
      // Shift all future sessions by 1 week (7 days)
      const allSessions = plan.weeks.flatMap(w => w.sessions);
      const idx = allSessions.findIndex(s => s.id === session.id);
      allSessions.slice(idx + 1).forEach(s => {
        const d = new Date(s.date);
        d.setDate(d.getDate() + 7);
        s.date = d.toISOString().split('T')[0];
      });
      storage.setPlan(plan);
    }

    onDone();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'flex-end',
    }}>
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '20px 20px 0 0',
        padding: '1.5rem',
        width: '100%',
        maxWidth: 480,
        margin: '0 auto',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 999, margin: '0 auto 1.25rem' }} />

        <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 4 }}>Missed or Skipping?</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          How should we handle the rest of your plan?
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="card"
            style={{ textAlign: 'left', cursor: 'pointer' }}
            onClick={() => handleOption('skipped')}>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>Skip this session</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Mark as skipped. Plan continues on original schedule.
            </div>
          </button>

          <button className="card"
            style={{ textAlign: 'left', cursor: 'pointer' }}
            onClick={() => handleOption('missed-repeat')}>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>Repeat the week</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Push all remaining sessions back by 7 days and redo this week.
            </div>
          </button>

          <button className="card"
            style={{ textAlign: 'left', cursor: 'pointer', border: '1px solid var(--accent)40' }}
            onClick={() => handleOption('missed-rebuild')}>
            <div style={{ fontWeight: 700, marginBottom: 2, color: 'var(--accent)' }}>Rebuild from today</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Mark missed sessions as missed, reschedule remaining plan starting today.
            </div>
          </button>
        </div>

        <button className="btn btn-ghost" style={{ marginTop: '1rem' }} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
