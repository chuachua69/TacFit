import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storage } from '../store/storage';
import { charStore, rankFor } from '../store/character';
import GymLogger from '../components/GymLogger';
import PlateDisplay from '../components/PlateDisplay';
import MissedModal from '../components/MissedModal';
import ShareWorkout from '../components/ShareWorkout';
import FileImport from '../components/FileImport';
import WarmupCooldown from '../components/WarmupCooldown';
import { fmtTime } from '../components/WheelPicker';

const DISC_EMOJI = { run: '🏃', swim: '🏊', ruck: '🎒', gym: '🏋️', test: '🎯' };
const SLOT_LABEL = { am: 'Morning', pm: 'Evening' };

// Stat line from real imported activity data
function actualStatLine(discipline, a) {
  const km = (a.distanceM / 1000).toFixed(2);
  if (discipline === 'swim') return `${Math.round(a.distanceM)} m · ${fmtTime(a.durationS)} · ${fmtTime(a.paceSecPerKm / 10)}/100m`;
  return `${km} km · ${fmtTime(a.durationS)} · ${fmtTime(a.paceSecPerKm)}/km`;
}

// Build a one-line stat summary per discipline for the share card
function statLineFor(workout) {
  if (!workout) return '';
  if (workout.type === 'gym') return `${workout.focus} · ${workout.exercises.length} exercises`;
  if (workout.type === 'run') return workout.distance ? `${workout.distance} km @ ${workout.pace}` : 'Interval session';
  if (workout.type === 'swim') return `${workout.totalMetres} m`;
  if (workout.type === 'ruck') return `${workout.distance} km · ${workout.load}${workout.loadUnit} @ ${workout.targetPace}`;
  return '';
}

export default function SessionDetail() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const plan = storage.getPlan();
  const profile = storage.getProfile();
  const logs = storage.getLogs();
  const [showMissed, setShowMissed] = useState(false);
  const [share, setShare] = useState(null);

  const allSessions = plan?.weeks.flatMap(w => w.sessions) || [];
  const session = allSessions.find(s => s.id === sessionId);
  if (!session) return <div className="screen">Session not found</div>;

  const log = logs.find(l => l.sessionId === sessionId);
  const status = log?.status || session.status;

  const markDone = (gymData, actual) => {
    storage.addLog({
      sessionId,
      status: 'done',
      completedAt: new Date().toISOString(),
      ...(gymData ? { gymData } : {}),
      ...(actual ? { actual } : {}),
    });
    const { char } = charStore.addXP(session.discipline);
    const rank = rankFor(char.level);
    const phase = plan?.weeks?.[session.week - 1]?.name || '';
    setShare({
      discipline: session.discipline,
      emoji: DISC_EMOJI[session.discipline] || '🎖️',
      title: session.workout?.label || session.workout?.focus || 'Session',
      statLine: actual ? actualStatLine(session.discipline, actual) : statLineFor(session.workout),
      sub: `Week ${session.week}${phase ? ' · ' + phase : ''}`,
      date: new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }),
      level: char.level,
      rank: rank.title,
    });
  };

  const unmark = () => {
    storage.removeLog(sessionId);
    navigate(-1);
  };

  const { workout } = session;

  // ── Test-block session (taper / grouped test day) ──
  if (workout?.type === 'test') {
    const isTest = workout.phase === 'test';
    const markTestDone = () => {
      storage.addLog({ sessionId, status: 'done', completedAt: new Date().toISOString() });
      navigate(-1);
    };
    return (
      <div className="screen" style={{ gap: '1.25rem', paddingTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost" style={{ width: 'auto', padding: '0.4rem 0.75rem' }} onClick={() => navigate(-1)}>← Back</button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.2rem' }}>{workout.phase === 'test' ? '🎯' : workout.phase === 'rest' ? '💤' : '🌙'}</span>
              <span className="tag" style={{ background: 'var(--accent)20', color: 'var(--accent)' }}>{workout.phase === 'test' ? 'TEST' : workout.phase === 'rest' ? 'REST' : 'TAPER'}</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', marginTop: 2 }}>{workout.title}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{session.date} · Week {session.week}</div>
          </div>
        </div>

        <div className="card">
          {isTest ? (
            <>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600 }}>Events to log today</div>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {workout.events.map((e, i) => (
                  <li key={i} style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>{e}</li>
                ))}
              </ul>
            </>
          ) : (
            <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>{workout.notes}</div>
          )}
        </div>

        {status === 'pending' && <WarmupCooldown discipline="gym" workout={{ focus: 'Upper' }} phase="warmup" />}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
          {isTest && (
            <button className="btn btn-primary" onClick={() => navigate(workout.link)}>
              Open {workout.testKind === 'baseline' ? 'Baseline' : 'Operator'} to log results →
            </button>
          )}
          <button className={`btn ${isTest ? 'btn-secondary' : 'btn-primary'}`} onClick={markTestDone}>
            {status !== 'pending' ? '✓ Completed' : 'Mark Day Done ✓'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen" style={{ gap: '1.25rem', paddingTop: '1.5rem' }}>
      {showMissed && (
        <MissedModal session={session} plan={plan} onClose={() => setShowMissed(false)} onDone={() => navigate('/dashboard')} />
      )}
      {share && (
        <ShareWorkout summary={share} onClose={() => { setShare(null); navigate(-1); }} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-ghost" style={{ width: 'auto', padding: '0.4rem 0.75rem' }}
          onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.2rem' }}>{DISC_EMOJI[session.discipline]}</span>
            <span className={`tag tag-${session.discipline}`}>{session.discipline}</span>
            {session.slot && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {SLOT_LABEL[session.slot]}
              </span>
            )}
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', marginTop: 2 }}>
            {workout?.label || workout?.focus || 'Session'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {session.date} · Week {session.week}
          </div>
        </div>
      </div>

      {/* Workout content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {status === 'pending' && <WarmupCooldown discipline={session.discipline} workout={workout} phase="warmup" />}

        {/* GYM — interactive logger */}
        {workout?.type === 'gym' && status === 'pending' && (
          <GymLogger workout={workout} profile={profile} onSave={markDone} />
        )}

        {/* GYM — completed view */}
        {workout?.type === 'gym' && status !== 'pending' && (
          <div className="card">
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 600 }}>
              {workout.focus} — Strength
            </div>
            {workout.exercises.map((ex, i) => (
              <div key={i} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700 }}>{ex.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {ex.reps ? `${ex.sets}×${ex.reps}` : `${ex.sets}×${ex.duration}`}
                  </span>
                </div>
                {ex.weight && (
                  <>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent)', marginBottom: 6 }}>
                      {ex.weight} {ex.unit}
                    </div>
                    <PlateDisplay targetWeight={ex.weight} barWeight={profile.barWeight} unit={profile.unit} />
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* RUN */}
        {workout?.type === 'run' && (
          <div className="card">
            {workout.distance && (
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.75rem' }}>
                <div>
                  <div className="label">Distance</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{workout.distance} km</div>
                </div>
                <div>
                  <div className="label">Target Pace</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{workout.pace}</div>
                </div>
              </div>
            )}
            {workout.intervals && (
              <div>
                <div className="label">Intervals</div>
                {workout.warmup && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 6 }}>Warm-up: {workout.warmup}</div>}
                {workout.intervals.map((iv, i) => (
                  <div key={i} className="card" style={{ background: 'var(--bg-elevated)', marginBottom: 8 }}>
                    <div style={{ fontWeight: 700 }}>{iv.reps} × {iv.distance}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Target: {iv.targetPace} · Rest: {iv.rest}</div>
                  </div>
                ))}
                {workout.cooldown && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cool-down: {workout.cooldown}</div>}
              </div>
            )}
            {workout.notes && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 8 }}>{workout.notes}</div>}
          </div>
        )}

        {/* SWIM */}
        {workout?.type === 'swim' && (
          <div className="card">
            <div style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>{workout.totalMetres}m total</div>
            {workout.sets.map((s, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0',
                borderBottom: i < workout.sets.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ fontSize: '0.9rem' }}>{s.desc}</span>
                <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.85rem' }}>{s.pace}</span>
              </div>
            ))}
          </div>
        )}

        {/* RUCK */}
        {workout?.type === 'ruck' && (
          <div className="card">
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div>
                <div className="label">Distance</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{workout.distance} km</div>
              </div>
              <div>
                <div className="label">Load</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{workout.load} {workout.loadUnit}</div>
              </div>
              <div>
                <div className="label">Pace</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{workout.targetPace}</div>
              </div>
            </div>
          </div>
        )}

        {status === 'pending' && <WarmupCooldown discipline={session.discipline} workout={workout} phase="cooldown" />}
      </div>

      {/* Actions for non-gym pending sessions */}
      {workout?.type !== 'gym' && status === 'pending' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
          {/* Import real activity → logs with actual distance/pace */}
          <div className="card" style={{ padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
              Done this on Strava or your watch? Import the file to log it with your real stats.
            </div>
            <FileImport
              label="Import & log this session"
              variant={session.discipline === 'swim' ? 'swim' : undefined}
              onParsed={r => markDone(undefined, r)}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowMissed(true)}>
              Missed / Skip
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => markDone()}>
              Mark Done ✓
            </button>
          </div>
        </div>
      )}

      {/* Missed/skip for gym too */}
      {workout?.type === 'gym' && status === 'pending' && (
        <button className="btn btn-ghost" onClick={() => setShowMissed(true)}>
          Miss / Skip this session
        </button>
      )}

      {/* Completed status + unmark */}
      {status !== 'pending' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
          <div className="card" style={{
            textAlign: 'center',
            background: status === 'done' ? 'var(--success)15' : 'var(--danger)15',
          }}>
            <span style={{
              fontWeight: 700,
              color: status === 'done' ? 'var(--success)' : 'var(--danger)',
              textTransform: 'uppercase',
            }}>
              {status === 'done' ? '✓ Completed' : `✗ ${status}`}
            </span>
          </div>
          <button className="btn btn-ghost" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
            onClick={unmark}>
            ↩ Unmark / Revert to pending
          </button>
        </div>
      )}
    </div>
  );
}
