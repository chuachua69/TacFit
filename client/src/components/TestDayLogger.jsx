import { useState } from 'react';
import { storage } from '../store/storage';
import GymLogger from './GymLogger';
import PlateDisplay from './PlateDisplay';
import EventTimer from './EventTimer';
import { TimePicker, NumberWheel, fmtTime } from './WheelPicker';
import { EVENTS, scoreAssessment } from '../lib/operatorScore';

const round2_5 = v => Math.round(v / 2.5) * 2.5;

// Brzycki 1RM estimate from a weight×reps top set (reps capped for validity)
function est1RM(weight, reps) {
  const w = Number(weight) || 0, r = Number(reps) || 0;
  if (!w || !r) return 0;
  if (r <= 1) return w;
  return (w * 36) / (37 - Math.min(r, 10));
}

// How each tested lift is seeded: fraction of current 1RM + the rep target to
// shoot for. The user edits to their real top set; we back-calc the new 1RM.
const LIFT_DEF = {
  squat:    { name: 'Back Squat',          from: 0.85, reps: 5 },
  deadlift: { name: 'Deadlift',            from: 0.88, reps: 3 },
  bench:    { name: 'Bench Press',         from: 0.85, reps: 5 },
  ohp:      { name: 'Overhead Press',      from: 0.85, reps: 5 },
  row:      { name: 'Bent-over Row',       from: 0.80, reps: 6 },
  pullups:  { name: 'Pull-ups — max reps', bodyweight: true, reps: 8 },
};

const LIFT_LABEL = { squat: 'Squat', deadlift: 'Deadlift', bench: 'Bench', ohp: 'OHP', row: 'Row' };

// Write new 1RM baselines straight back to the profile. We intentionally DON'T
// regenerate the plan here — you're mid-test-block; the fresh numbers seed your
// next block when you start it.
function commitBaselineUpdates(updates) {
  if (!Object.keys(updates).length) return;
  const profile = storage.getProfile();
  const baselines = { ...profile.baselines };
  Object.entries(updates).forEach(([k, v]) => {
    baselines[k] = v;                            // 1RM
    baselines[`${k}8rm`] = Math.round(v * 0.8);  // keep the 8RM mirror in step
  });
  storage.setProfile({ ...profile, baselines });
}

// ── LIFT test day — reuse the full GymLogger (plates + rest timer + sets) ──
function LiftTest({ workout, profile, onComplete }) {
  const u = profile.unit === 'lbs' ? 'lbs' : 'kg';
  const bl = profile.baselines || {};

  const exercises = (workout.lifts || []).map(key => {
    const def = LIFT_DEF[key];
    if (def.bodyweight) return { name: def.name, sets: 1, reps: def.reps, weight: null, unit: null };
    const start = round2_5((bl[key] || 0) * def.from) || 0;
    return { name: def.name, sets: 1, reps: def.reps, weight: start, unit: u };
  });

  const nameToKey = {};
  (workout.lifts || []).forEach(key => { nameToKey[LIFT_DEF[key].name] = key; });

  const handleSave = (saved) => {
    const updates = {};
    saved.forEach(ex => {
      const key = nameToKey[ex.name];
      if (!key || key === 'pullups') return;     // pull-ups aren't a tracked baseline
      let best = 0;
      ex.sets.forEach(s => {
        if (s.type === 'warmup' || !s.done) return;
        const e = est1RM(s.weight, s.reps);
        if (e > best) best = e;
      });
      if (best > 0) updates[key] = round2_5(best);
    });
    commitBaselineUpdates(updates);
    onComplete({
      summary: Object.keys(updates).length
        ? Object.entries(updates).map(([k, v]) => `${LIFT_LABEL[k] || k} → ${v}${u}`).join(' · ')
        : 'Logged — no 1RM change',
    });
  };

  return (
    <>
      <div className="card" style={{ background: 'var(--accent)0d', border: '1px solid var(--accent)40' }}>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
          🏋️ Work up to a heavy set, then log your real <strong>weight × reps</strong> on the top set.
          We estimate your new 1RM and update your baseline automatically.
        </div>
      </div>
      <GymLogger
        workout={{ type: 'gym', focus: workout.title, exercises }}
        profile={profile}
        adjust={false}
        completeLabel="Log Results & Update Baseline ✓"
        onSave={handleSave}
      />
    </>
  );
}

// A labelled time-picker row (module-level so the picker keeps state across renders)
function TimeCard({ label, value, onChange, maxMin }) {
  return (
    <div className="card" style={{ padding: '0.75rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontWeight: 800, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>{fmtTime(value)}</span>
      </div>
      <TimePicker seconds={value} onChange={onChange} maxMin={maxMin} />
    </div>
  );
}

// ── CARDIO test day — time pickers wired to the cardio baselines ──
function CardioTest({ workout, profile, onComplete }) {
  const unit = profile.unit === 'lbs' ? 'lbs' : 'kg';
  const bl = profile.baselines || {};
  const want = new Set(workout.cardio || ['run', 'swim', 'ruck']);

  const [run, setRun] = useState(Math.round(bl.run2400s || 720));
  const [swim, setSwim] = useState(Math.round(bl.swim400s || 540));
  const [ruck, setRuck] = useState(Math.round((bl.ruckPaceMinKm || 8) * 60));
  const [load, setLoad] = useState(Number(bl.ruckLoadKg || 20));

  const save = () => {
    const profileNow = storage.getProfile();
    const baselines = { ...profileNow.baselines };
    if (want.has('run')) baselines.run2400s = run;
    if (want.has('swim')) baselines.swim400s = swim;
    if (want.has('ruck')) { baselines.ruckPaceMinKm = ruck / 60; baselines.ruckLoadKg = load; }
    storage.setProfile({ ...profileNow, baselines });

    const parts = [];
    if (want.has('run')) parts.push(`Run ${fmtTime(run)}`);
    if (want.has('swim')) parts.push(`Swim ${fmtTime(swim)}`);
    if (want.has('ruck')) parts.push(`Ruck ${fmtTime(ruck)}/km`);
    onComplete({ summary: parts.join(' · ') });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div className="card" style={{ background: 'var(--run)0d', border: '1px solid var(--run)40' }}>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
          ⏱ Run each event fresh, then dial in your real time. Saving updates your cardio baselines.
        </div>
      </div>
      {want.has('run') && <TimeCard label="2.4km Run" value={run} onChange={setRun} maxMin={30} />}
      {want.has('swim') && <TimeCard label="400m Swim" value={swim} onChange={setSwim} maxMin={25} />}
      {want.has('ruck') && (
        <div className="card" style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Ruck Pace (min/km)</span>
              <span style={{ fontWeight: 800, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>{fmtTime(ruck)}</span>
            </div>
            <TimePicker seconds={ruck} onChange={setRuck} maxMin={20} />
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Ruck Load</span>
              <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{load} {unit}</span>
            </div>
            <NumberWheel value={load} onChange={setLoad} from={0} to={60} step={unit === 'kg' ? 2.5 : 5} unit={unit} />
          </div>
        </div>
      )}
      <button className="btn btn-primary" onClick={save}>Log Results & Update Baseline ✓</button>
    </div>
  );
}

// ── OPERATOR test day — log scored events; the block's last day banks the attempt ──
function OperatorTest({ workout, profile, onComplete }) {
  const unit = profile.unit === 'lbs' ? 'lbs' : 'kg';
  const evs = EVENTS.filter(e => (workout.eventKeys || []).includes(e.key));
  const draft = storage.getOperatorDraft() || { values: {}, loads: {} };

  const [values, setValues] = useState(() => {
    const init = {};
    evs.forEach(e => { init[e.key] = draft.values?.[e.key] ?? ''; });
    return init;
  });
  const [loads, setLoads] = useState(() => {
    const init = {};
    evs.forEach(e => { if (e.hasLoad) init[e.key] = draft.loads?.[e.key] ?? (e.loadOptions?.[0] ?? ''); });
    return init;
  });
  const [timerEvent, setTimerEvent] = useState(null);

  const setVal = (k, v) => setValues(s => ({ ...s, [k]: v }));
  const setLoad = (k, v) => setLoads(s => ({ ...s, [k]: v }));

  const complete = () => {
    const prev = storage.getOperatorDraft() || { values: {}, loads: {} };
    const merged = {
      values: { ...prev.values, ...values },
      loads: { ...prev.loads, ...loads },
    };
    const allLogged = EVENTS.every(e => merged.values[e.key] !== '' && merged.values[e.key] != null);
    if (allLogged) {
      const scored = scoreAssessment(merged.values);
      storage.addOperatorTest({
        date: new Date().toISOString(),
        values: merged.values, loads: merged.loads,
        totalBonus: scored.totalBonus, tier: scored.tier.key,
        tierLabel: scored.tier.label, allMet: scored.allMet,
      });
      storage.clearOperatorDraft();
      onComplete({ summary: `Operator attempt banked — ${scored.tier.label} · ${scored.totalBonus.toFixed(1)} pts` });
    } else {
      storage.setOperatorDraft(merged);
      onComplete({ summary: 'Events logged — assessment completes on your final test day' });
    }
  };

  const anyInput = evs.some(e => values[e.key] !== '' && values[e.key] != null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {timerEvent && (
        <EventTimer label={`${timerEvent.n}. ${timerEvent.name}`} phases={timerEvent.timer} onClose={() => setTimerEvent(null)} />
      )}
      <div className="card" style={{ background: 'var(--accent)0d', border: '1px solid var(--accent)40' }}>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
          🎯 Log your best score per event — use the timer & plate guide. Your full 5-event tier is
          banked once every event across the block is in.
        </div>
      </div>

      {evs.map(ev => {
        const v = Number(values[ev.key]) || 0;
        const met = values[ev.key] !== '' && v >= ev.baseline;
        const isBarbell = ev.key === 'hipOverhead' || ev.key === 'lunges';
        return (
          <div key={ev.key} className="card" style={{
            borderLeft: `3px solid ${values[ev.key] === '' ? 'var(--border)' : met ? 'var(--success)' : 'var(--danger)'}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>
                  <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>{ev.n}.</span>{ev.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{ev.sub}</div>
                {ev.loadIsBodyweight && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--accent)', marginTop: 3, fontWeight: 600 }}>
                    Target load: {profile?.bodyweight ? `${profile.bodyweight} ${unit} (bodyweight)` : 'set bodyweight in Settings'}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Baseline</div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{ev.baseline} {ev.unit}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                <input type="number" inputMode="numeric" placeholder="0"
                  value={values[ev.key]} onChange={e => setVal(ev.key, e.target.value)}
                  style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 700 }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{ev.unit}</span>
              </div>
              {ev.hasLoad && ev.loadOptions && (
                <div style={{ display: 'flex', gap: 4 }}>
                  {ev.loadOptions.map(l => (
                    <button key={l} onClick={() => setLoad(ev.key, l)}
                      style={{
                        padding: '0.4rem 0.5rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700,
                        background: loads[ev.key] === l ? 'var(--accent)' : 'var(--bg-elevated)',
                        color: loads[ev.key] === l ? '#000' : 'var(--text-muted)',
                        border: `1px solid ${loads[ev.key] === l ? 'var(--accent)' : 'var(--border)'}`,
                      }}>
                      {l}
                    </button>
                  ))}
                </div>
              )}
              {ev.hasLoad && !ev.loadOptions && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input type="number" inputMode="decimal" placeholder="+load" value={loads[ev.key] ?? ''}
                    onChange={e => setLoad(ev.key, e.target.value)} style={{ width: 64, textAlign: 'center' }} />
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{unit}</span>
                </div>
              )}
            </div>

            {isBarbell && Number(loads[ev.key]) > 0 && (
              <div style={{ marginTop: 10 }}>
                <PlateDisplay targetWeight={Number(loads[ev.key])} barWeight={profile.barWeight} unit={unit} />
              </div>
            )}

            {ev.timer && (
              <button onClick={() => setTimerEvent(ev)}
                style={{
                  marginTop: 10, width: '100%', padding: '0.55rem', borderRadius: 'var(--radius)',
                  background: 'var(--accent)15', border: '1px solid var(--accent)40',
                  color: 'var(--accent)', fontWeight: 700, fontSize: '0.85rem',
                }}>
                ▶ Start {ev.timer.length > 1 ? '4 × 90s rounds' : '2:30 timer'}
              </button>
            )}

            <div style={{ marginTop: 10, fontSize: '0.78rem', color: values[ev.key] === '' ? 'var(--text-muted)' : met ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
              {values[ev.key] === '' ? '—' : met ? '✓ Baseline met' : '✗ Below baseline'}
            </div>
          </div>
        );
      })}

      <button className="btn btn-primary" onClick={complete} disabled={!anyInput}>
        Log Results ✓
      </button>
    </div>
  );
}

export default function TestDayLogger({ workout, profile, onComplete }) {
  if (workout.mode === 'lift')     return <LiftTest    workout={workout} profile={profile} onComplete={onComplete} />;
  if (workout.mode === 'cardio')   return <CardioTest  workout={workout} profile={profile} onComplete={onComplete} />;
  if (workout.mode === 'operator') return <OperatorTest workout={workout} profile={profile} onComplete={onComplete} />;
  return null;
}
