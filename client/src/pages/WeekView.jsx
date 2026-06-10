import { useParams, useNavigate } from 'react-router-dom';
import { storage } from '../store/storage';

const DISC_EMOJI = { run: '🏃', swim: '🏊', ruck: '🎒', gym: '🏋️' };
const STATUS_COLOR = {
  done: 'var(--success)',
  missed: 'var(--danger)',
  skipped: 'var(--text-muted)',
  pending: 'var(--text-dim)',
};

export default function WeekView() {
  const { weekNum } = useParams();
  const navigate = useNavigate();
  const plan = storage.getPlan();
  const wn = Number(weekNum);

  const weekData = plan?.weeks.find(w => w.week === wn);
  if (!weekData) return <div className="screen">Week not found</div>;

  const allWeeks = plan.weeks.map(w => w.week);

  return (
    <div className="screen" style={{ gap: '1.25rem', paddingTop: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-ghost" style={{ width: 'auto', padding: '0.4rem 0.75rem' }}
          onClick={() => navigate('/dashboard')}>
          ← Back
        </button>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Week {weekData.week}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{weekData.name} Phase</div>
        </div>
      </div>

      {/* Week selector */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {allWeeks.map(w => (
          <button key={w}
            onClick={() => navigate(`/week/${w}`)}
            style={{
              padding: '0.4rem 0.9rem', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0,
              background: w === wn ? 'var(--accent)' : 'var(--bg-elevated)',
              color: w === wn ? '#000' : 'var(--text-muted)',
              fontWeight: 700, fontSize: '0.85rem',
            }}>
            Wk {w}
          </button>
        ))}
      </div>

      {/* Session list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {weekData.sessions.map((s, i) => {
          const logs = storage.getLogs();
          const log = logs.find(l => l.sessionId === s.id);
          const status = log?.status || s.status;

          return (
            <button key={s.id} className="card"
              style={{ width: '100%', textAlign: 'left', cursor: 'pointer', padding: '1rem' }}
              onClick={() => navigate(`/session/${s.id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 'var(--radius)',
                    background: 'var(--bg-elevated)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.3rem',
                  }}>
                    {DISC_EMOJI[s.discipline]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                      Day {i + 1} — {s.workout?.label || s.workout?.focus || s.discipline}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.date}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span className={`tag tag-${s.discipline}`}>{s.discipline}</span>
                  <span style={{ fontSize: '0.72rem', color: STATUS_COLOR[status], fontWeight: 600, textTransform: 'uppercase' }}>
                    {status}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
