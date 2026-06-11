import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../store/storage';
import { charStore, LEVEL_XP, rankFor } from '../store/character';
import WellnessModal from '../components/WellnessModal';
import BottomNav from '../components/BottomNav';
import PixelCharacter from '../components/PixelCharacter';
import BulletFX from '../components/BulletFX';
import PromotionModal from '../components/PromotionModal';
import MissedModal from '../components/MissedModal';

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
  const [promo, setPromo] = useState(null);
  const [reschedule, setReschedule] = useState(false);
  const [, setRefresh] = useState(0);
  const wellness = storage.getTodayWellness();
  const logs = storage.getLogs();
  const rank = rankFor(char.level);

  useEffect(() => {
    if (!wellness) {
      const timer = setTimeout(() => setShowWellness(true), 800);
      return () => clearTimeout(timer);
    }
  }, [wellness]);

  // Detect a pending promotion (level gained since last visit)
  useEffect(() => {
    const p = charStore.pendingPromotion();
    if (p) {
      const t = setTimeout(() => setPromo(p), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const todaySessions = getTodaySessions(plan);
  const progress = getCurrentWeek(plan, logs);
  const today = new Date().toISOString().split('T')[0];
  const message = pickMessage(todaySessions, logs);
  const levelPct = charStore.levelProgress(char) * 100;

  // Overdue: past sessions with no log at all
  const allSessions = plan?.weeks.flatMap(w => w.sessions) || [];
  const overdue = allSessions
    .filter(s => s.date < today && !logs.find(l => l.sessionId === s.id))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Recovery recommendation from today's wellness
  const lowRecovery = wellness && (wellness.fatigue >= 4 || wellness.soreness >= 4 || (wellness.sleep != null && wellness.sleep < 6));

  return (
    <div className="screen" style={{ gap: 0, paddingTop: '1.25rem', paddingBottom: '5rem' }}>
      <BulletFX />
      {showWellness && <WellnessModal onClose={() => setShowWellness(false)} />}
      {promo && (
        <PromotionModal
          fromLevel={promo.fromLevel}
          toLevel={promo.toLevel}
          onClose={() => { charStore.markPromotionSeen(); setPromo(null); }}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--accent)' }}>TACFIT</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: rank.color, letterSpacing: '0.02em' }}>
              {rank.badge} {rank.title}
            </span>
            {rank.tab && (
              <span style={{
                fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                padding: '1px 6px', borderRadius: 999,
                background: `${rank.color}22`, color: rank.color, border: `1px solid ${rank.color}55`,
              }}>
                {rank.tab}
              </span>
            )}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: 1 }}>{profile?.name || 'Soldier'}</div>
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

      {/* Recovery recommendation */}
      {lowRecovery && (
        <div className="card" style={{
          marginBottom: '1rem', border: '1px solid var(--warn)40', background: 'var(--warn)12',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: '1.4rem' }}>🛌</span>
          <div style={{ fontSize: '0.82rem', color: 'var(--warn)', fontWeight: 600 }}>
            Recovery flagged today — training loads are auto-reduced. Consider an easy effort or a rest day.
          </div>
        </div>
      )}

      {/* Overdue sessions */}
      {overdue.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div className="label" style={{ marginBottom: 0, color: 'var(--danger)' }}>
              Overdue · {overdue.length}
            </div>
            <button className="btn btn-ghost" style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: 'var(--accent)' }}
              onClick={() => setReschedule(true)}>
              Reschedule plan →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {overdue.slice(0, 3).map(s => (
              <button key={s.id} className="card"
                style={{ width: '100%', textAlign: 'left', cursor: 'pointer', border: '1px solid var(--danger)30', padding: '0.6rem 0.85rem' }}
                onClick={() => navigate(`/session/${s.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1.1rem' }}>{DISC_EMOJI[s.discipline]}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.workout?.label || s.workout?.focus || 'Session'}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{s.date} · Week {s.week}</div>
                    </div>
                  </div>
                  <span style={{ color: 'var(--danger)', fontSize: '1.1rem' }}>→</span>
                </div>
              </button>
            ))}
            {overdue.length > 3 && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                +{overdue.length - 3} more — use Reschedule to clear them
              </div>
            )}
          </div>
        </div>
      )}

      {reschedule && overdue.length > 0 && (
        <MissedModal
          session={overdue[0]}
          plan={plan}
          onClose={() => setReschedule(false)}
          onDone={() => { setReschedule(false); setRefresh(r => r + 1); }}
        />
      )}

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

      {/* Operator assessment entry */}
      <button className="card" onClick={() => navigate('/operator')}
        style={{
          width: '100%', textAlign: 'left', cursor: 'pointer', marginTop: '0.5rem',
          display: 'flex', alignItems: 'center', gap: 12,
          border: '1px solid var(--accent)40',
        }}>
        <span style={{ fontSize: '1.6rem' }}>🎯</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>Operator Assessment</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>5-event fitness test · score &amp; tier</div>
        </div>
        <span style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>→</span>
      </button>

      <BottomNav active="dashboard" />
    </div>
  );
}
