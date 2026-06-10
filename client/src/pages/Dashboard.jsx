import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../store/storage';
import WellnessModal from '../components/WellnessModal';
import BottomNav from '../components/BottomNav';

const DISC_EMOJI = { run: '🏃', swim: '🏊', ruck: '🎒', gym: '🏋️', rest: '💤' };

function getTodaySession(plan) {
  if (!plan) return null;
  const today = new Date().toISOString().split('T')[0];
  for (const week of plan.weeks) {
    const s = week.sessions.find(s => s.date === today);
    if (s) return { session: s, phase: week.name };
  }
  return null;
}

function getCurrentWeek(plan) {
  if (!plan) return null;
  const today = new Date().toISOString().split('T')[0];
  for (const week of plan.weeks) {
    const hasFuture = week.sessions.some(s => s.date >= today);
    if (hasFuture) {
      const logs = storage.getLogs();
      const done = week.sessions.filter(s => logs.find(l => l.sessionId === s.id && l.status === 'done')).length;
      return { week: week.week, phase: week.name, done, total: week.sessions.length };
    }
  }
  return plan.weeks[plan.weeks.length - 1];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const plan = storage.getPlan();
  const profile = storage.getProfile();
  const [showWellness, setShowWellness] = useState(false);
  const wellness = storage.getTodayWellness();
  const logs = storage.getLogs();

  useEffect(() => {
    if (!wellness) {
      const timer = setTimeout(() => setShowWellness(true), 600);
      return () => clearTimeout(timer);
    }
  }, [wellness]);

  const todayData = getTodaySession(plan);
  const progress = getCurrentWeek(plan);

  // Check for multiple sessions today (AM + PM)
  const today = new Date().toISOString().split('T')[0];
  const todaySessions = plan?.weeks.flatMap(w => w.sessions).filter(s => s.date === today) || [];

  return (
    <div className="screen" style={{ gap: '1.25rem', paddingTop: '1.5rem', paddingBottom: '5rem' }}>
      {showWellness && <WellnessModal onClose={() => setShowWellness(false)} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--accent)' }}>TACFIT</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{profile?.name || 'Soldier'}</div>
        </div>
        {wellness && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Today</div>
            <div style={{ fontSize: '0.85rem' }}>😴 {wellness.sleep}h &nbsp; 💪 {wellness.fatigue}/5</div>
          </div>
        )}
      </div>

      {/* Week progress */}
      {progress && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div>
              <div style={{ fontWeight: 700 }}>Week {progress.week} — {progress.phase}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{progress.done}/{progress.total} sessions done</div>
            </div>
            <button className="btn btn-ghost" style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
              onClick={() => navigate(`/week/${progress.week}`)}>
              View week →
            </button>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: progress.total }).map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 6, borderRadius: 999,
                background: i < progress.done ? 'var(--accent)' : 'var(--border)',
              }} />
            ))}
          </div>
        </div>
      )}

      {/* Today's sessions */}
      <div>
        <div className="label">Today</div>
        {todaySessions.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {todaySessions.map(s => {
              const log = logs.find(l => l.sessionId === s.id);
              const isDone = log?.status === 'done';
              return (
                <button key={s.id} className="card"
                  style={{ width: '100%', textAlign: 'left', cursor: 'pointer', border: `1px solid ${isDone ? 'var(--success)40' : 'var(--accent)40'}` }}
                  onClick={() => navigate(`/session/${s.id}`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: '1.2rem' }}>{DISC_EMOJI[s.discipline]}</span>
                        <span className={`tag tag-${s.discipline}`}>{s.discipline}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.slot === 'am' ? 'Morning' : 'Evening'}</span>
                      </div>
                      <div style={{ fontWeight: 700 }}>{s.workout?.label || s.workout?.focus || 'Session'}</div>
                    </div>
                    <div style={{ fontSize: '1.3rem', color: isDone ? 'var(--success)' : 'var(--accent)' }}>
                      {isDone ? '✓' : '→'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
            Rest day. Recover well.
          </div>
        )}
      </div>

      {/* Upcoming */}
      <div>
        <div className="label">Upcoming</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {plan?.weeks.flatMap(w => w.sessions)
            .filter(s => s.date > today && !logs.find(l => l.sessionId === s.id))
            .slice(0, 5)
            .map(s => (
              <button key={s.id} className="card"
                style={{ width: '100%', textAlign: 'left', cursor: 'pointer', padding: '0.875rem' }}
                onClick={() => navigate(`/session/${s.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.1rem' }}>{DISC_EMOJI[s.discipline]}</span>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                        {s.workout?.label || s.workout?.focus || s.discipline}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {s.date} · {s.slot === 'am' ? 'Morning' : 'Evening'}
                      </div>
                    </div>
                  </div>
                  <span className={`tag tag-${s.discipline}`}>{s.discipline}</span>
                </div>
              </button>
            ))}
        </div>
      </div>

      {!wellness && (
        <button className="btn btn-primary" onClick={() => setShowWellness(true)}>
          Morning Check-in
        </button>
      )}

      <BottomNav active="dashboard" />
    </div>
  );
}
