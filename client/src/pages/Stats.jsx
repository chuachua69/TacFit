import { useNavigate } from 'react-router-dom';
import { storage } from '../store/storage';
import BottomNav from '../components/BottomNav';

const DISC_EMOJI = { run: '🏃', swim: '🏊', ruck: '🎒', gym: '🏋️' };
const DISC_COLOR = { run: 'var(--run)', swim: 'var(--swim)', ruck: 'var(--ruck)', gym: 'var(--gym)' };
const DISCIPLINES = ['gym', 'run', 'swim', 'ruck'];

export default function Stats() {
  const plan = storage.getPlan();
  const logs = storage.getLogs();

  if (!plan) {
    return (
      <div className="screen" style={{ paddingBottom: '5rem' }}>
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '3rem' }}>No plan yet.</div>
        <BottomNav active="stats" />
      </div>
    );
  }

  const allSessions = plan.weeks.flatMap(w => w.sessions);
  const doneLogs = logs.filter(l => l.status === 'done');
  const missedLogs = logs.filter(l => l.status && l.status !== 'done');
  const completion = allSessions.length > 0 ? doneLogs.length / allSessions.length : 0;
  const doneDays = new Set(doneLogs.map(l => l.completedAt?.split('T')[0]).filter(Boolean)).size;

  // Discipline stats
  const discStats = {};
  DISCIPLINES.forEach(d => {
    const sessions = allSessions.filter(s => s.discipline === d);
    const done = sessions.filter(s => logs.find(l => l.sessionId === s.id && l.status === 'done')).length;
    discStats[d] = { total: sessions.length, done };
  });

  // Gym PRs from log data
  const prs = {};
  doneLogs.filter(l => l.gymData).forEach(log => {
    log.gymData.forEach(ex => {
      ex.sets?.filter(s => s.type === 'normal' && s.done && s.weight > 0).forEach(s => {
        if (!prs[ex.name] || s.weight > prs[ex.name]) prs[ex.name] = s.weight;
      });
    });
  });

  return (
    <div className="screen" style={{ paddingTop: '1.5rem', paddingBottom: '5rem', gap: '1.25rem' }}>
      <div style={{ fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.02em', color: 'var(--accent)' }}>
        STATS
      </div>

      {/* Overall */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontWeight: 700 }}>Plan Progress</span>
          <span style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--accent)' }}>
            {Math.round(completion * 100)}%
          </span>
        </div>
        <div style={{ height: 6, background: 'var(--border)', borderRadius: 999, overflow: 'hidden', marginBottom: '1rem' }}>
          <div style={{ width: `${completion * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: 999, transition: 'width 0.5s' }} />
        </div>
        <div style={{ display: 'flex', gap: '1.25rem' }}>
          {[
            { label: 'Done', value: doneLogs.length, color: 'var(--success)' },
            { label: 'Missed', value: missedLogs.length, color: 'var(--danger)' },
            { label: 'Left', value: allSessions.length - doneLogs.length - missedLogs.length, color: 'var(--text-muted)' },
            { label: 'Active Days', value: doneDays, color: 'var(--accent)' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div className="label">{label}</div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Discipline breakdown */}
      <div>
        <div className="label">By Discipline</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DISCIPLINES.filter(d => discStats[d].total > 0).map(d => {
            const pct = discStats[d].total > 0 ? discStats[d].done / discStats[d].total : 0;
            return (
              <div key={d} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.4rem' }}>{DISC_EMOJI[d]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span className={`tag tag-${d}`}>{d}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {discStats[d].done}/{discStats[d].total}
                    </span>
                  </div>
                  <div style={{ height: 5, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${pct * 100}%`, height: '100%', background: DISC_COLOR[d], borderRadius: 999 }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gym PRs */}
      {Object.keys(prs).length > 0 && (
        <div>
          <div className="label">Gym PRs 🏋️</div>
          <div className="card" style={{ padding: '0.5rem 1rem' }}>
            {Object.entries(prs).sort((a, b) => b[1] - a[1]).map(([name, weight], i, arr) => (
              <div key={name} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.6rem 0',
                borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ fontSize: '0.9rem' }}>{name}</span>
                <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '1rem' }}>{weight} kg</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* After week 6 note */}
      <div style={{
        padding: '0.75rem 1rem',
        background: 'var(--accent)10',
        border: '1px solid var(--accent)30',
        borderRadius: 'var(--radius)',
        fontSize: '0.82rem',
        color: 'var(--text-muted)',
        lineHeight: 1.5,
      }}>
        🎯 After completing all 6 weeks, you'll do a baseline re-test to update your 1RMs and generate a fresh plan.
      </div>

      {/* Weekly summary */}
      <div>
        <div className="label">By Week</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {plan.weeks.map(week => {
            const done = week.sessions.filter(s => logs.find(l => l.sessionId === s.id && l.status === 'done')).length;
            const pct = week.sessions.length > 0 ? done / week.sessions.length : 0;
            return (
              <div key={week.week} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.75rem 1rem' }}>
                <div style={{ minWidth: 52 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Week {week.week}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{week.name}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 5, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct * 100}%`, height: '100%', borderRadius: 999,
                      background: pct >= 0.8 ? 'var(--success)' : pct > 0 ? 'var(--accent)' : 'var(--border)',
                      transition: 'width 0.4s',
                    }} />
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: 36, textAlign: 'right' }}>
                  {done}/{week.sessions.length}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <BottomNav active="stats" />
    </div>
  );
}
