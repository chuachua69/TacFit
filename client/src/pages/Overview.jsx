import { useNavigate } from 'react-router-dom';
import { storage } from '../store/storage';
import BottomNav from '../components/BottomNav';

const DISC_COLOR = { run: 'var(--run)', swim: 'var(--swim)', ruck: 'var(--ruck)', gym: 'var(--gym)' };
const DISC_EMOJI = { run: '🏃', swim: '🏊', ruck: '🎒', gym: '🏋️' };
const STATUS_COLOR = { done: 'var(--success)', missed: 'var(--danger)', skipped: 'var(--text-muted)', pending: 'var(--border)' };
const PHASE_COLOR = { Build: '#52a8e040', Intensify: '#e0c25240', Peak: '#e0525240', Deload: '#52c87840' };

export default function Overview() {
  const navigate = useNavigate();
  const plan = storage.getPlan();
  const logs = storage.getLogs();

  if (!plan) return <div className="screen">No plan found</div>;

  const allSessions = plan.weeks.flatMap(w => w.sessions);
  const today = new Date().toISOString().split('T')[0];

  // Stats
  const totalSessions = allSessions.length;
  const doneSessions = allSessions.filter(s => logs.find(l => l.sessionId === s.id && l.status === 'done')).length;
  const missedSessions = allSessions.filter(s => logs.find(l => l.sessionId === s.id && l.status?.startsWith('missed'))).length;
  const completionPct = Math.round((doneSessions / totalSessions) * 100);

  // Discipline breakdown
  const discCounts = {};
  allSessions.forEach(s => { discCounts[s.discipline] = (discCounts[s.discipline] || 0) + 1; });
  const discDone = {};
  allSessions.filter(s => logs.find(l => l.sessionId === s.id && l.status === 'done'))
    .forEach(s => { discDone[s.discipline] = (discDone[s.discipline] || 0) + 1; });

  return (
    <div className="screen" style={{ paddingTop: '1.5rem', gap: '1.5rem', paddingBottom: '5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-ghost" style={{ width: 'auto', padding: '0.4rem 0.75rem' }}
          onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Plan Overview</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>6-Week Block</div>
        </div>
      </div>

      {/* Progress summary */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent)' }}>{completionPct}%</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Complete</div>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>{doneSessions}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Done</div>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--danger)' }}>{missedSessions}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Missed</div>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{totalSessions - doneSessions - missedSessions}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Left</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 8, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${completionPct}%`, height: '100%', background: 'var(--accent)', borderRadius: 999, transition: 'width 0.5s' }} />
        </div>
      </div>

      {/* Discipline breakdown */}
      <div>
        <div className="label">Discipline Breakdown</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.entries(discCounts).map(([disc, total]) => {
            const done = discDone[disc] || 0;
            const pct = Math.round((done / total) * 100);
            return (
              <div key={disc} className="card" style={{ padding: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{DISC_EMOJI[disc]}</span>
                    <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{disc}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{done}/{total} sessions</div>
                </div>
                <div style={{ height: 6, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: DISC_COLOR[disc], borderRadius: 999 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6-week calendar grid */}
      <div>
        <div className="label">6-Week Calendar</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {plan.weeks.map(week => (
            <div key={week.week}>
              <button
                onClick={() => navigate(`/week/${week.week}`)}
                style={{ width: '100%', textAlign: 'left', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    Week {week.week}
                    <span style={{
                      marginLeft: 8, padding: '2px 8px', borderRadius: 999,
                      background: PHASE_COLOR[week.name], fontSize: '0.7rem',
                      color: 'var(--text-muted)', fontWeight: 600,
                    }}>
                      {week.name}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {week.sessions.filter(s => logs.find(l => l.sessionId === s.id && l.status === 'done')).length}/{week.sessions.length}
                  </span>
                </div>
              </button>

              {/* Session dots */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {week.sessions.map(s => {
                  const log = logs.find(l => l.sessionId === s.id);
                  const status = log?.status || (s.date < today ? 'pending' : 'pending');
                  const dotColor = log
                    ? STATUS_COLOR[log.status] || STATUS_COLOR.pending
                    : s.date === today
                    ? 'var(--accent)'
                    : STATUS_COLOR.pending;

                  return (
                    <button key={s.id} onClick={() => navigate(`/session/${s.id}`)}
                      title={`${s.discipline} – ${s.date}`}
                      style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: log?.status === 'done'
                          ? DISC_COLOR[s.discipline] + '30'
                          : 'var(--bg-elevated)',
                        border: `2px solid ${dotColor}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                      }}>
                      {DISC_EMOJI[s.discipline]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav active="overview" />
    </div>
  );
}
