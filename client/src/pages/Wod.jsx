import { useState } from 'react';
import BottomNav from '../components/BottomNav';
import PageHeader from '../components/PageHeader';
import SessionRunner from '../components/SessionRunner';
import { PROGRAM, DAY_LABEL, todayKey, tomorrowKey, dayFor, sessionLogId, dateForDayKey, localDateStr } from '../lib/wodProgram';
import { store } from '../store/profile';
import { fxCount, fxUncount } from '../lib/feedback';
import { historyFromWodLogs, evaluateSession } from '../lib/recovery';
import { logSessionToCloud } from '../lib/exerciseDb';

const TYPE_BADGE = {
  lift: { label: 'Strength', color: 'var(--gym)' },
  conditioning: { label: 'Conditioning', color: 'var(--ruck)' },
  mobility: { label: 'Mobility', color: 'var(--swim)' },
  run: { label: 'Run', color: 'var(--run)' },
  rest: { label: 'Rest', color: 'var(--text-muted)' },
};

function SessionCard({ session, dayKey, date, onRun, onRefresh }) {
  const logId = sessionLogId(date, dayKey, session.slot);
  const status = store.getWodStatus(logId); // 'done' | 'skipped' | null
  const done = status === 'done';
  const skipped = status === 'skipped';
  const badge = TYPE_BADGE[session.type] || TYPE_BADGE.lift;
  const runnable = session.exercises && session.exercises.length > 0;

  const log = store.getWodLog(logId);
  let statusText = 'Start ▶';
  let statusColor = 'var(--accent)';
  let borderColor = 'var(--border)';
  let statusIcon = '';

  if (skipped) {
    statusText = 'Skipped / Failed';
    statusColor = 'var(--danger)'; // red
    borderColor = 'color-mix(in srgb, var(--danger) 45%, transparent)';
    statusIcon = '🔴';
  } else if (done) {
    if (log && log.exercises) {
      let totalSets = 0;
      let doneCount = 0;
      let hasPartial = false;
      let hasFail = false;

      log.exercises.forEach(ex => {
        ex.rows?.forEach(r => {
          totalSets++;
          if (r.done) {
            doneCount++;
            if (ex.kind !== 'check') {
              const logged = r.reps ?? 0;
              const target = r.targetReps ?? 0;
              const isMax = target === 'max' || typeof target === 'string' || !target;
              if (!isMax) {
                if (logged === 0) hasFail = true;
                else if (logged < target) hasPartial = true;
              } else if (logged === 0) {
                hasFail = true;
              }
            }
          } else {
            hasFail = true;
          }
        });
      });

      if (totalSets === 0) {
        // No set-level rows to judge: markDone() logs runs as
        // exercises:[{ name }] with no `rows`, so absence of set data is not
        // failure. Without this guard a run you marked done rendered as
        // "🔴 Failed (0 sets done)" beside its own "✓ Done" button.
        statusText = 'Completed';
        statusColor = 'var(--success)';
        borderColor = 'color-mix(in srgb, var(--success) 45%, transparent)';
        statusIcon = '🟢';
      } else if (doneCount === 0) {
        statusText = 'Failed (0 sets done)';
        statusColor = 'var(--danger)';
        borderColor = 'color-mix(in srgb, var(--danger) 45%, transparent)';
        statusIcon = '🔴';
      } else if (hasFail || hasPartial || doneCount < totalSets) {
        statusText = `Partial (${doneCount}/${totalSets})`;
        statusColor = 'var(--warn)';
        borderColor = 'color-mix(in srgb, var(--warn) 45%, transparent)';
        statusIcon = '🟡';
      } else {
        statusText = 'Completed';
        statusColor = 'var(--success)';
        borderColor = 'color-mix(in srgb, var(--success) 45%, transparent)';
        statusIcon = '🟢';
      }
    } else {
      statusText = 'Completed';
      statusColor = 'var(--success)';
      borderColor = 'color-mix(in srgb, var(--success) 45%, transparent)';
      statusIcon = '🟢';
    }
  }

  // `lifts` powers the skip-progression pause in getEffectiveWeek — it must be
  // persisted on every entry or skipping never holds back the %1RM climb.
  const entry = {
    logId, day: dayKey, slot: session.slot, title: session.title, type: session.type,
    dayLabel: DAY_LABEL[dayKey], lifts: session.liftKeys || [],
  };
  const skip = () => { store.skipWod(entry); fxUncount(); onRefresh(); };
  const undo = () => { store.removeWod(logId); fxUncount(); onRefresh(); };
  const markDone = () => {
    // Runs log as a one-exercise session so the title resolves through the
    // catalog aliases (interval/zone2 runs) and feeds the recovery engine +
    // cloud workout_logs — otherwise run fatigue is invisible to R1/R3.
    const done = session.type === 'run'
      ? { ...entry, exercises: [{ name: session.title }] }
      : entry;
    store.saveWodSession(done);
    if (session.type === 'run') logSessionToCloud({ ...done, date: new Date().toISOString() });
    fxCount(); onRefresh();
  };

  const slotTag = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span style={{ fontSize: '0.66rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {session.slot === 'am' ? '🌅 AM' : '🌙 PM'}{session.optional ? ' · optional' : ''}
      </span>
      {statusIcon && (
        <span style={{
          fontSize: '0.62rem', fontWeight: 800, color: statusColor,
          background: `color-mix(in srgb, ${statusColor} 12%, transparent)`,
          border: `1px solid color-mix(in srgb, ${statusColor} 35%, transparent)`,
          padding: '1px 6px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 3
        }}>
          {statusIcon === '🟢' ? '✓' : statusIcon === '🟡' ? '⚠' : '⤫'} {statusText}
        </span>
      )}
    </div>
  );

  const header = (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
      <div>
        {slotTag}
        <div style={{ fontWeight: 800, marginTop: 4 }}>{session.title}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--accent)', marginTop: 1 }}>{session.focus}</div>
      </div>
      <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 8px', borderRadius: 999, background: `color-mix(in srgb, ${badge.color} 18%, transparent)`, color: badge.color, border: `1px solid color-mix(in srgb, ${badge.color} 45%, transparent)`, whiteSpace: 'nowrap' }}>
        {badge.label}
      </span>
    </div>
  );

  // Small pill button used for Skip / Undo actions
  const pill = (label, onClick, color = 'var(--text-muted)') => (
    <button onClick={onClick}
      style={{ fontSize: '0.72rem', fontWeight: 700, color, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 999, padding: '0.3rem 0.8rem' }}>
      {label}
    </button>
  );

  // Runnable session → clickable region opens the runner
  if (runnable) {
    return (
      <div className="card tutorial-session" style={{ display: 'flex', flexDirection: 'column', gap: 10, border: `1px solid ${borderColor}` }}>
        <div role="button" tabIndex={0} onClick={() => onRun(session, dayKey, date)}
          style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {header}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{session.exercises.length} exercises</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: statusColor }}>
              {done ? `${statusText} — tap to edit` : skipped ? 'Skipped / Failed — tap to do it' : 'Start ▶'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {!done && !skipped && pill('Skip session', skip, 'var(--warn)')}
          {done && pill('✕ Undo log', undo)}
          {skipped && pill('✕ Undo skip', undo)}
        </div>
      </div>
    );
  }

  // Run session → follow-own-programme + mark done / skip
  if (session.type === 'run') {
    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10, border: `1px solid ${borderColor}` }}>
        {header}
        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', background: 'var(--bg-elevated)', borderRadius: 8, padding: '0.6rem 0.85rem' }}>
          🏃 Follow your own run programme
        </div>
        {done ? (
          <button className="btn btn-secondary" onClick={undo}>✓ Done — tap to undo</button>
        ) : skipped ? (
          <button className="btn btn-secondary" style={{ color: 'var(--warn)' }} onClick={undo}>⤫ Skipped — tap to undo</button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={markDone}>Mark Done</button>
            <button className="btn btn-secondary" style={{ flex: 1, color: 'var(--warn)' }} onClick={skip}>Skip</button>
          </div>
        )}
      </div>
    );
  }

  // Rest session → static
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: 0.85 }}>
      <span style={{ fontSize: '1.4rem' }}>😴</span>
      <div>
        <div style={{ fontWeight: 700 }}>{session.title}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Recover — you've earned it.</div>
      </div>
    </div>
  );
}

// LOCAL calendar date ±n days — must match dateForDayKey's local format so a
// session's logId is stable all day (UTC dates shifted mid-morning in SGT).
const isoOffset = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return localDateStr(d); };

export default function Wod() {
  const tk = todayKey();
  const tmk = tomorrowKey();
  const [view, setView] = useState('today'); // 'today' | 'tomorrow' | 'week'
  const [running, setRunning] = useState(null); // { session, dayKey, date }
  const [, setRefresh] = useState(0);
  const bump = () => setRefresh(r => r + 1);

  const toDateInput = (d) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getNextMonday = () => {
    const d = new Date();
    // `|| 7`: on a Monday, "Next Monday" means the FOLLOWING Monday, not today.
    const delta = ((8 - d.getDay()) % 7) || 7;
    d.setDate(d.getDate() + delta);
    return d;
  };

  const [startDateInput, setStartDateInput] = useState(toDateInput(new Date()));
  const [wizardStep, setWizardStep] = useState(0); // 0: Select Days, 1: Assign Types, 2: Start Date
  // Seed from the saved schedule so "Adjust Schedule" doesn't silently reset a
  // custom run plan back to the tue/sat defaults after a page reload.
  const savedSchedule = store.getProfile().customSchedule;
  const [runDays, setRunDays] = useState(() => savedSchedule?.runDays ?? ['tue', 'sat']);
  const [runTypes, setRunTypes] = useState(() => savedSchedule?.runTypes ?? { tue: 'intervals', sat: 'zone2' });

  const openRunner = (session, dayKey, date) => {
    // Recovery check: warn (never block) if this session hits muscles that
    // are still inside their recovery window from recent logged work.
    // Exclude the session being opened — editing a done session must not
    // warn about its own sets.
    const logId = sessionLogId(date, dayKey, session.slot);
    const history = historyFromWodLogs(store.getWodLogs().filter(w => w.logId !== logId));
    const names = (session.exercises || []).map(e => e.name);
    const { flagged } = evaluateSession(names, history);
    const warnings = flagged.map(f => f.verdict.warnings[0]?.warning).filter(Boolean);
    setRunning({ session, dayKey, date, warnings });
  };

  const completeSession = (result) => {
    const { session, dayKey, date } = running;
    const entry = {
      logId: sessionLogId(date, dayKey, session.slot),
      day: dayKey, slot: session.slot, title: session.title, type: session.type,
      dayLabel: DAY_LABEL[dayKey], lifts: session.liftKeys || [], exercises: result.exercises,
      doneCount: result.doneCount, totalSets: result.totalSets,
    };
    store.saveWodSession(entry);
    logSessionToCloud({ ...entry, date: new Date().toISOString() }); // relational record, best-effort
    setRunning(null);
    bump();
  };

  const profile = store.getProfile();

  if (!profile.programStartDate) {
    const todayStr = toDateInput(new Date());
    const mondayStr = toDateInput(getNextMonday());

    return (
      <div className="screen" style={{ paddingTop: '1.25rem', paddingBottom: '6rem', justifyContent: 'center', gap: '1.5rem' }}>
        <PageHeader title="WOD" subtitle="Tactical Training Program" />
        <div className="card" style={{ maxWidth: 460, margin: '0.85rem auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
          
          {wizardStep === 0 && (
            <>
              <div style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '0.25rem' }}>🏃</div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, textAlign: 'center', margin: 0 }}>Select Running Days</h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', lineHeight: 1.5, textAlign: 'center', margin: 0 }}>
                Toggle the days you want to schedule runs. Your remaining core training blocks (Lifts, EMOMs, Conditioning) will distribute around them.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '0.5rem 0' }}>
                {[['mon', 'Monday'], ['tue', 'Tuesday'], ['wed', 'Wednesday'], ['thu', 'Thursday'], ['fri', 'Friday'], ['sat', 'Saturday'], ['sun', 'Sunday']].map(([key, name]) => {
                  const active = runDays.includes(key);
                  return (
                    <button key={key}
                      onClick={() => {
                        if (active) {
                          setRunDays(runDays.filter(d => d !== key));
                          const newTypes = { ...runTypes };
                          delete newTypes[key];
                          setRunTypes(newTypes);
                        } else {
                          setRunDays([...runDays, key]);
                          setRunTypes({ ...runTypes, [key]: 'easy' });
                        }
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.95rem 1rem', borderRadius: 'var(--radius)',
                        background: active ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--bg-elevated)',
                        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                        color: 'var(--text)', cursor: 'pointer', textAlign: 'left',
                      }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{name}</span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: active ? 'var(--accent)' : 'var(--text-muted)' }}>
                        {active ? '🏃 Run Day' : '😴 Rest / Core Block'}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button className="btn btn-primary" style={{ width: '100%', fontWeight: 800 }}
                disabled={runDays.length === 0}
                onClick={() => setWizardStep(1)}>
                Next: Assign Run Types →
              </button>
            </>
          )}

          {wizardStep === 1 && (
            <>
              <div style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '0.25rem' }}>⏱️</div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, textAlign: 'center', margin: 0 }}>Assign Run Types</h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', lineHeight: 1.5, textAlign: 'center', margin: 0 }}>
                Specify which run sessions you plan to perform on each selected running day.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '0.5rem 0' }}>
                {runDays.map(day => (
                  <div key={day} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div className="label" style={{ textTransform: 'capitalize' }}>{DAY_LABEL[day]} Run</div>
                    <select
                      value={runTypes[day] || 'easy'}
                      onChange={e => setRunTypes({ ...runTypes, [day]: e.target.value })}
                      style={{
                        width: '100%', padding: '0.75rem',
                        background: 'var(--bg-elevated)', color: 'var(--text)',
                        border: '1px solid var(--border)', borderRadius: 'var(--radius)'
                      }}>
                      <option value="intervals">Hard Running (Intervals/Tempo)</option>
                      <option value="zone2">Long Aerobic Run (Zone 2)</option>
                      <option value="easy">Easy Recovery Run (Zone 1/2)</option>
                    </select>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setWizardStep(0)}>
                  ← Back
                </button>
                <button className="btn btn-primary" style={{ flex: 2, fontWeight: 800 }} onClick={() => setWizardStep(2)}>
                  Next: Choose Start Date →
                </button>
              </div>
            </>
          )}

          {wizardStep === 2 && (
            <>
              <div style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '0.25rem' }}>🚀</div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, textAlign: 'center', margin: 0 }}>Start 6-Week Progression</h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', lineHeight: 1.5, textAlign: 'center', margin: 0 }}>
                Choose your program start date to initialize the periodization training cycle.
              </p>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <div className="label">Choose Start Date</div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem' }}>
                  <button
                    className="btn"
                    style={{ flex: 1, borderRadius: 'var(--radius)', fontSize: '0.8rem', fontWeight: 700,
                      background: startDateInput === todayStr ? 'var(--accent)' : 'var(--bg-elevated)',
                      color: startDateInput === todayStr ? '#000' : 'var(--text)', border: '1px solid var(--border)' }}
                    onClick={() => setStartDateInput(todayStr)}>
                    Today
                  </button>
                  <button
                    className="btn"
                    style={{ flex: 1, borderRadius: 'var(--radius)', fontSize: '0.8rem', fontWeight: 700,
                      background: startDateInput === mondayStr ? 'var(--accent)' : 'var(--bg-elevated)',
                      color: startDateInput === mondayStr ? '#000' : 'var(--text)', border: '1px solid var(--border)' }}
                    onClick={() => setStartDateInput(mondayStr)}>
                    Next Monday
                  </button>
                </div>
                <input type="date" value={startDateInput} min={todayStr}
                  onChange={e => setStartDateInput(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }} />
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.4, margin: 0 }}>
                  A Monday start aligns cleanest with your weekly core training cycle.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setWizardStep(1)}>
                  ← Back
                </button>
                <button className="btn btn-primary" style={{ flex: 2, fontWeight: 800 }}
                  onClick={() => {
                    const start = new Date(`${startDateInput}T12:00:00`);
                    store.setProfile({
                      programStartDate: start.toISOString(),
                      customSchedule: {
                        runDays,
                        runTypes
                      }
                    });
                    bump();
                  }}>
                  Initialize 6-Week Block 🚀
                </button>
              </div>
            </>
          )}

        </div>
        <BottomNav active="wod" />
      </div>
    );
  }

  // Check if start date is in the future
  const start = new Date(profile.programStartDate);
  const today = new Date();
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());

  if (todayDateOnly < startDateOnly) {
    const diffMs = startDateOnly - todayDateOnly;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const countdownText = diffDays === 1 ? "Starts tomorrow!" : `Starts in ${diffDays} days`;
    const formattedStartDate = start.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    return (
      <div className="screen" style={{ paddingTop: '1.25rem', paddingBottom: '6rem', justifyContent: 'center', gap: '1.5rem' }}>
        <PageHeader title="WOD" subtitle="Tactical Training Program" />
        <div className="card" style={{ maxWidth: 460, margin: '0.85rem auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.25rem' }}>⏳</div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Program Scheduled</h2>
          <div>
            <span style={{ 
              background: 'color-mix(in srgb, var(--accent) 12%, transparent)', 
              color: 'var(--accent)', 
              padding: '0.6rem 1rem', 
              borderRadius: 'var(--radius)', 
              fontWeight: 800, 
              fontSize: '0.95rem', 
              display: 'inline-block', 
              margin: '0.5rem auto' 
            }}>
              {countdownText}
            </span>
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', lineHeight: 1.5, margin: 0 }}>
            Your 6-Week Progression training block is scheduled to begin on <strong style={{ color: 'var(--text)' }}>{formattedStartDate}</strong>.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', lineHeight: 1.4, margin: 0 }}>
            Take this time to rest, verify your baseline lifting specs, or click below to adjust your start date or training schedule.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: '0.5rem' }}>
            <button className="btn btn-primary" style={{ width: '100%', fontWeight: 800 }}
              onClick={() => {
                const now = new Date();
                store.setProfile({ programStartDate: now.toISOString() });
                bump();
              }}>
              Start Program Today 🚀
            </button>
            <button className="btn btn-secondary" style={{ width: '100%' }}
              onClick={() => {
                store.setProfile({ programStartDate: null });
                bump();
              }}>
              Adjust Schedule ⚙️
            </button>
          </div>
        </div>
        <BottomNav active="wod" />
      </div>
    );
  }

  return (
    <div className="screen" style={{ paddingTop: '1.25rem', paddingBottom: '6rem', gap: '1rem' }}>
      {/* Title + Tdy / Tmr / Week toggle */}
      <PageHeader title="WOD" right={
        <div id="tutorial-views" style={{ display: 'flex', gap: 3, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 999, padding: 3 }}>
          {[['today', 'Tdy'], ['tomorrow', 'Tmr'], ['week', 'Week']].map(([v, label]) => (
            <button key={v} onClick={() => setView(v)}
              style={{
                padding: '0.4rem 0.85rem', borderRadius: 999, fontSize: '0.8rem', fontWeight: 700,
                background: view === v ? 'var(--accent)' : 'transparent',
                color: view === v ? '#000' : 'var(--text-muted)',
              }}>
              {label}
            </button>
          ))}
        </div>
      } />

      {view === 'week' ? (
        PROGRAM.map(d => (
          <div key={d.day} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: d.day === tk ? 'var(--accent)' : 'var(--text)' }}>{d.label}</span>
              {d.day === tk && <span style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)' }}>today</span>}
            </div>
            {d.sessions.map(s => (
              <SessionCard key={s.slot} session={s} dayKey={d.day} date={dateForDayKey(d.day)} onRun={openRunner} onRefresh={bump} />
            ))}
          </div>
        ))
      ) : (() => {
        const dayKey = view === 'today' ? tk : tmk;
        const date = view === 'today' ? isoOffset(0) : isoOffset(1);
        const dayObj = dayFor(dayKey);
        return (
          <>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>
              {view === 'tomorrow' ? 'Tomorrow · ' : ''}{dayObj.label} · {dayObj.sessions.length} session{dayObj.sessions.length === 1 ? '' : 's'}
            </div>
            {dayObj.sessions.map(s => (
              <SessionCard key={s.slot} session={s} dayKey={dayKey} date={date} onRun={openRunner} onRefresh={bump} />
            ))}
          </>
        );
      })()}

      {running && (
        <SessionRunner
          session={running.session}
          dayLabel={DAY_LABEL[running.dayKey]}
          logId={sessionLogId(running.date, running.dayKey, running.session.slot)}
          profile={profile}
          existing={store.getWodLog(sessionLogId(running.date, running.dayKey, running.session.slot))}
          onClose={() => setRunning(null)}
          onComplete={completeSession}
          warnings={running.warnings || []}
        />
      )}

      <BottomNav active="wod" />
    </div>
  );
}
