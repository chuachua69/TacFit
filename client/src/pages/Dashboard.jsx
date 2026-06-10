import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../store/storage';
import { charStore, LEVEL_XP } from '../store/character';
import WellnessModal from '../components/WellnessModal';
import BottomNav from '../components/BottomNav';
import PixelCharacter from '../components/PixelCharacter';

const DISC_EMOJI = { run: '🏃', swim: '🏊', ruck: '🎒', gym: '🏋️' };

const MESSAGES = {
  rest:     ['Recovery is training too.', 'Rest hard. Train harder.', 'Downtime = uptime.'],
  gym:      ['Time to move iron.', 'Strength session locked in.', 'The bar is waiting.'],
  run:      ['Legs don\'t lie.', 'Pace yourself. Own the road.', 'Every step counts.'],
  ruck:     ['Load up. Move out.', 'Weight builds character.', 'Pack heavy. Walk tall.'],
  swim:     ['Water is your element.', 'Find your stroke.', 'Breathe. Pull. Kick.'],
  done:     ['All sessions done. Good work.', 'Day complete. Rest up.', 'Mission accomplished.'],
};

function getTodaySessions(plan) {
  if (!plan) return [];
  const today = new Date().toISOString().split('T')[0];
  return plan.weeks.flatMap(w => w.sessions).filter(s => s.date === today);
}

function getCurrentWeek(plan, logs) {
  if (!plan) return null;
  const today = new Date().toISOString().split('T')[0];
  for (const week of plan.weeks) {
    const hasFuture = week.sessions.some(s => s.date >= today);
    if (hasFuture) {
      const done = week.sessions.filter(s => logs.find(l => l.sessionId === s.id && l.status === 'done')).length;
      return { week: week.week, phase: week.name, done, total: week.sessions.length, sessions: week.sessions };
    }
  }
  return plan.weeks[plan.weeks.length - 1];
}

function pickMessage(sessions, logs) {
  if (!sessions.length) return MESSAGES.rest[0];
  const allDone = sessions.every(s => logs.find(l => l.sessionId === s.id && l.status === 'done'));
  if (allDone) return MESSAGES.done[Math.floor(Math.random() * MESSAGES.done.length)];
  const next = sessions.find(s => !logs.find(l => l.sessionId === s.id && l.status === 'done'));
  const pool = MESSAGES[next?.discipline] || MESSAGES.rest;
  return pool[Math.floor(Date.now() / 86400000) % pool.length];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const plan = storage.getPlan();
  const profile = storage.getProfile();
  const [showWellness, setShowWellness] = useState(false);
  const [char, setChar] = useState(charStore.get());
  const wellness = storage.getTodayWellness();
  const logs = storage.getLogs();

  useEffect(() => {
    if (!wellness) {
      const timer = setTimeout(() => setShowWellness(true), 800);
      return () => clearTimeout(timer);
    }
  }, [wellness]);

  const todaySessions = getTodaySessions(plan);
  const progress = getCurrentWeek(plan, logs);
  const today = new Date().toISOString().split('T')[0];
  const message = pickMessage(todaySessions, logs);
  const levelPct = charStore.levelProgress(char) * 100;

  return (
    <div className="screen" style={{ gap: 0, paddingTop: '1.25rem', paddingBottom: '5rem' }}>
      {showWellness && <WellnessModal onClose={() => setShowWellness(false)} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--accent)' }}>TACFIT</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{profile?.name || 'Soldier'}</div>
        </div>
        {wellness && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Check-in</div>
            <div style={{ fontSize: '0.85rem' }}>😴 {wellness.sleep}h &nbsp; 💪 {wellness.fatigue}/5</div>
          </div>
        )}
      </div>

      {/* Character section */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '0.5rem', paddingBottom: '1rem' }}>
        {/* Speech bubble */}
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '0.5rem 1rem',
          fontSize: '0.82rem',
          color: 'var(--text-dim)',
          maxWidth: 220,
          textAlign: 'center',
          marginBottom: 8,
          position: 'relative',
        }}>
          {message}
          <div style={{
            position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '7px solid transparent',
            borderRight: '7px solid transparent',
            borderTop: '8px solid var(--border)',
          }} />
          <div style={{
            position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: `7px solid var(--bg-elevated)`,
          }} />
        </div>

        <PixelCharacter
          equipped={char.equipped}
          size={1.8}
          level={char.level}
          xp={char.xp}
          maxXp={LEVEL_XP[char.level + 1] ?? 9999}
          showUI
          onClick={() => navigate('/bunk')}
        />
      </div>

      {/* Week progress bar */}
      {progress && (
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <div>
              <span style={{ fontWeight: 700 }}>Week {progress.week}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 6 }}>{progress.phase}</span>
            </div>
            <button className="btn btn-ghost" style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
              onClick={() => navigate(`/week/${progress.week}`)}>
              View →
            </button>
          </div>
          <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
            {Array.from({ length: progress.total }).map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 5, borderRadius: 999,
                background: i < progress.done ? 'var(--accent)' : 'var(--border)',
              }} />
            ))}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{progress.done}/{progress.total} sessions</div>
        </div>
      )}

      {/* Today's sessions */}
      <div style={{ marginBottom: '1rem' }}>
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
                    <div style={{ fontSize: '1.4rem', color: isDone ? 'var(--success)' : 'var(--accent)' }}>
                      {isDone ? '✓' : '→'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
            Rest day. Recover well. 💤
          </div>
        )}
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
