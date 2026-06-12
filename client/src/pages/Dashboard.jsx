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
import { normalizeRanking, DISC_EMOJI as FOCUS_EMOJI } from '../lib/focus';

const DISC_EMOJI = { run: '🏃', swim: '🏊', ruck: '🎒', gym: '🏋️', test: '🎯' };
const AVATAR_SIZE = 1.8; // shared by the avatar SVG and the speech-bubble follow offset

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

// Which set of lines the avatar draws from, given today's state. Returns a
// stable primitive key (used as the bubble-cycle effect dependency).
function moodFor(sessions, logs) {
  if (!sessions.length) return 'rest';
  const allDone = sessions.every(s => logs.find(l => l.sessionId === s.id && l.status === 'done'));
  if (allDone) return 'done';
  const next = sessions.find(s => !logs.find(l => l.sessionId === s.id && l.status === 'done'));
  return MESSAGES[next?.discipline] ? next.discipline : 'rest';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const plan = storage.getPlan();
  const profile = storage.getProfile();
  const [showWellness, setShowWellness] = useState(false);
  const [editWellness, setEditWellness] = useState(false);
  const [char] = useState(charStore.get());
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

  // Speech bubble — cycle through the mood's lines so the avatar feels alive.
  const mood = moodFor(todaySessions, logs);
  const pool = MESSAGES[mood] || MESSAGES.rest;
  const [bubbleIdx, setBubbleIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setBubbleIdx(i => i + 1), 9000);
    return () => clearInterval(id);
  }, [mood]);
  const message = pool[bubbleIdx % pool.length];

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
      {showWellness && <WellnessModal onClose={() => { setShowWellness(false); setRefresh(r => r + 1); }} />}
      {editWellness && (
        <WellnessModal initial={wellness} onClose={() => { setEditWellness(false); setRefresh(r => r + 1); }} />
      )}
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
          <button onClick={() => setEditWellness(true)}
            style={{ textAlign: 'right', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Check-in <span style={{ color: 'var(--accent)' }}>✎</span>
            </div>
            <div style={{ fontSize: '0.85rem' }}>😴 {wellness.sleep}h &nbsp; 💪 {wellness.fatigue}/5</div>
          </button>
        )}
      </div>

      {/* Character section */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '0.5rem', paddingBottom: '1rem' }}>
        {/* Speech bubble — pops in, then paces horizontally with the avatar */}
        <div className="tac-bubble-follow" style={{ '--shift': `${AVATAR_SIZE * 7}px`, marginBottom: 8 }}>
          <div key={message} className="tac-bubble-pop" style={{
            position: 'relative',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '0.5rem 1rem',
            fontSize: '0.82rem',
            color: 'var(--text-dim)',
            maxWidth: 220,
            textAlign: 'center',
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
        </div>

        <PixelCharacter
          equipped={char.equipped}
          size={AVATAR_SIZE}
          level={char.level}
          xp={char.xp}
          maxXp={LEVEL_XP[char.level + 1] ?? 9999}
          showUI
          onClick={() => navigate('/bunk')}
        />
      </div>

      {/* Profile & focus priority — tap to edit in Settings */}
      <button className="card" onClick={() => navigate('/settings')}
        style={{ width: '100%', textAlign: 'left', cursor: 'pointer', marginBottom: '1rem', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
            Profile & Focus
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--accent)' }}>Edit ✎</span>
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          {profile?.bodyweight > 0 && <span>⚖️ {profile.bodyweight} {profile.unit}</span>}
          {profile?.height > 0 && <span>📐 {profile.height} cm</span>}
          {profile?.age > 0 && <span>🎂 {profile.age}</span>}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Priority:</span>
          {normalizeRanking(profile?.focusRanking).map((d, i) => (
            <span key={d} style={{
              fontSize: '0.74rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999,
              background: i === 0 ? 'var(--accent)20' : 'var(--bg-elevated)',
              border: `1px solid ${i === 0 ? 'var(--accent)55' : 'var(--border)'}`,
              color: i === 0 ? 'var(--accent)' : 'var(--text-muted)',
            }}>
              {i + 1} {FOCUS_EMOJI[d]}
            </span>
          ))}
        </div>
      </button>

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
                      </div>
                      <div style={{ fontWeight: 700 }}>{s.workout?.label || s.workout?.focus || 'Session'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>
                        📅 {new Date(s.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                        {' · '}{s.slot === 'am' ? '🌅 Morning' : '🌙 Evening'}
                      </div>
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
