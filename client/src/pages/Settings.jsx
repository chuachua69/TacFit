import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../store/storage';
import { getBarOptions } from '../lib/plateCalc';
import { generatePlan } from '../lib/planEngine';
import { TimePicker, NumberWheel, fmtTime } from '../components/WheelPicker';
import Collapsible from '../components/Collapsible';
import { downloadICS, planToEvents } from '../lib/icsExport';
import { normalizeRanking, DISC_LABEL, DISC_EMOJI } from '../lib/focus';

export default function Settings() {
  const navigate = useNavigate();
  const profile = storage.getProfile();
  const todayStr = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    name: profile?.name || '',
    unit: profile?.unit || 'kg',
    barWeight: profile?.barWeight || 20,
    bodyweight: profile?.bodyweight ?? '',
    height: profile?.height ?? '',
    age: profile?.age ?? '',
    sex: profile?.sex || '',
    startDate: profile?.startDate || todayStr,
    amTime: profile?.amTime || '07:00',
    pmTime: profile?.pmTime || '18:00',
  });
  const [planStartSaved, setPlanStartSaved] = useState(false);
  const [timesSaved, setTimesSaved] = useState(false);
  const [ranking, setRanking] = useState(() => normalizeRanking(profile?.focusRanking));
  const [rankSaved, setRankSaved] = useState(false);

  const moveRank = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= ranking.length) return;
    const next = [...ranking];
    [next[i], next[j]] = [next[j], next[i]];
    setRanking(next);
  };
  const saveRanking = () => {
    storage.setProfile({ ...storage.getProfile(), focusRanking: ranking });
    setRankSaved(true);
    setTimeout(() => setRankSaved(false), 2000);
  };

  const saveTimes = () => {
    const updated = { ...storage.getProfile(), amTime: form.amTime, pmTime: form.pmTime };
    storage.setProfile(updated);
    setTimesSaved(true);
    setTimeout(() => setTimesSaved(false), 2000);
  };
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [baselines, setBaselines] = useState({ ...profile?.baselines });
  const [baselinesSaved, setBaselinesSaved] = useState(false);
  const [cardioSaved, setCardioSaved] = useState(false);

  const saveBaselines = (flagSetter) => {
    const updated = { ...profile, baselines: { ...profile.baselines, ...baselines } };
    storage.setProfile(updated);
    storage.setPlan(generatePlan(updated));
    flagSetter(true);
    setTimeout(() => flagSetter(false), 2500);
  };

  const setB = (k, v) => setBaselines(b => ({ ...b, [k]: Number(v) || 0 }));

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const barOptions = getBarOptions(form.unit);

  const saveProfile = () => {
    const updated = {
      ...profile, ...form,
      barWeight: Number(form.barWeight),
      bodyweight: Number(form.bodyweight) || 0,
      height: Number(form.height) || 0,
      age: Number(form.age) || 0,
    };
    storage.setProfile(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const resetPlan = () => {
    const updatedProfile = storage.getProfile();
    const newPlan = generatePlan(updatedProfile);
    storage.setPlan(newPlan);
    navigate('/dashboard');
  };

  const hardReset = () => {
    storage.clearAll();
    navigate('/onboarding');
  };

  return (
    <div className="screen" style={{ paddingTop: '1.5rem', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-ghost" style={{ width: 'auto', padding: '0.4rem 0.75rem' }}
          onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Settings</div>
      </div>

      {/* Profile */}
      <Collapsible title="Profile" subtitle="Name · unit · body metrics" defaultOpen>
          <div>
            <div className="label">Name</div>
            <input value={form.name} onChange={e => set('name', e.target.value)} />
          </div>

          <div>
            <div className="label">Weight Unit</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['kg', 'lbs'].map(u => (
                <button key={u} className={`btn ${form.unit === u ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { set('unit', u); set('barWeight', u === 'kg' ? 20 : 45); }}>
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="label">Barbell Weight</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {barOptions.map(o => (
                <button key={o.value}
                  className={`btn ${form.barWeight === o.value ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: '1 1 auto' }}
                  onClick={() => set('barWeight', o.value)}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="label">Body Metrics</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="number" inputMode="decimal" placeholder="Bodyweight"
                  value={form.bodyweight} onChange={e => set('bodyweight', e.target.value)} />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{form.unit}</span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="number" inputMode="numeric" placeholder="Height"
                  value={form.height} onChange={e => set('height', e.target.value)} />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>cm</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input type="number" inputMode="numeric" placeholder="Age" style={{ flex: 1 }}
                value={form.age} onChange={e => set('age', e.target.value)} />
              <div style={{ flex: 2, display: 'flex', gap: 6 }}>
                {['M', 'F'].map(s => (
                  <button key={s} type="button"
                    className={`btn ${form.sex === s ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '0.6rem 0' }}
                    onClick={() => set('sex', s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button className="btn btn-primary" onClick={saveProfile}>
            {saved ? 'Saved ✓' : 'Save Changes'}
          </button>
      </Collapsible>

      {/* Editable baselines */}
      <Collapsible title="Baselines (1RM)" subtitle="Squat · deadlift · bench · OHP · row">
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Edit anytime. Save &amp; Regenerate updates your plan with new weights.
          </div>
          {[
            { key: 'squat', label: 'Squat' },
            { key: 'deadlift', label: 'Deadlift' },
            { key: 'bench', label: 'Bench' },
            { key: 'ohp', label: 'OHP' },
            { key: 'row', label: 'Row' },
          ].map(({ key, label }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ flex: 1, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{label} 1RM</span>
              <input
                type="number" inputMode="numeric"
                value={baselines[key] ?? ''}
                onChange={e => setB(key, e.target.value)}
                style={{ width: 80, textAlign: 'center', padding: '0.35rem 0.5rem', fontSize: '0.9rem' }}
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: 28 }}>{profile?.unit || 'kg'}</span>
            </div>
          ))}
          <button className="btn btn-primary" onClick={() => {
            const updated = { ...profile, baselines: { ...profile.baselines, ...baselines } };
            storage.setProfile(updated);
            const newPlan = generatePlan(updated);
            storage.setPlan(newPlan);
            setBaselinesSaved(true);
            setTimeout(() => setBaselinesSaved(false), 2500);
          }}>
            {baselinesSaved ? 'Saved & Plan Updated ✓' : 'Save & Regenerate Plan'}
          </button>
      </Collapsible>

      {/* Cardio baselines */}
      <Collapsible title="Cardio Baselines" subtitle="Run · swim · ruck pace & load">
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Run, swim &amp; ruck targets. Scroll the wheels or tap ▲ ▼. Save &amp; Regenerate
            updates run/swim/ruck paces in your plan.
          </div>

          {[
            { key: 'run2400s', label: '2.4km Run Time', maxMin: 30 },
            { key: 'swim400s', label: '400m Swim Time', maxMin: 25 },
          ].map(({ key, label, maxMin }) => (
            <div key={key} style={{ borderTop: '1px solid var(--border)', paddingTop: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontWeight: 800, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>
                  {fmtTime(baselines[key] || 0)}
                </span>
              </div>
              <TimePicker
                seconds={Math.round(baselines[key] || 0)}
                onChange={v => setBaselines(b => ({ ...b, [key]: v }))}
                maxMin={maxMin}
              />
            </div>
          ))}

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Ruck Pace (min/km)</span>
              <span style={{ fontWeight: 800, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>
                {fmtTime(Math.round((baselines.ruckPaceMinKm || 0) * 60))}
              </span>
            </div>
            <TimePicker
              seconds={Math.round((baselines.ruckPaceMinKm || 0) * 60)}
              onChange={v => setBaselines(b => ({ ...b, ruckPaceMinKm: v / 60 }))}
              maxMin={20}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Ruck Load</span>
              <span style={{ fontWeight: 800, color: 'var(--accent)' }}>
                {baselines.ruckLoadKg || 0} {profile?.unit || 'kg'}
              </span>
            </div>
            <NumberWheel
              value={Number(baselines.ruckLoadKg || 0)}
              onChange={v => setBaselines(b => ({ ...b, ruckLoadKg: v }))}
              from={0} to={60} step={(profile?.unit || 'kg') === 'kg' ? 2.5 : 5}
              unit={profile?.unit || 'kg'}
            />
          </div>

          <button className="btn btn-primary" onClick={() => saveBaselines(setCardioSaved)}>
            {cardioSaved ? 'Saved & Plan Updated ✓' : 'Save & Regenerate Plan'}
          </button>
      </Collapsible>

      {/* Focus priority */}
      <Collapsible title="Focus Priority" subtitle="Drives Baseline-test recommendations">
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Rank what matters most. The Baseline test recommends re-measuring your top priorities.
          </div>
          {ranking.map((d, i) => (
            <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.45rem 0.5rem', background: 'var(--bg-elevated)', borderRadius: 8 }}>
              <span style={{ width: 18, fontWeight: 800, color: 'var(--accent)' }}>{i + 1}</span>
              <span style={{ flex: 1 }}>{DISC_EMOJI[d]} {DISC_LABEL[d]}</span>
              <button onClick={() => moveRank(i, -1)} disabled={i === 0}
                style={{ padding: '2px 8px', opacity: i === 0 ? 0.3 : 1, color: 'var(--text-muted)' }}>▲</button>
              <button onClick={() => moveRank(i, 1)} disabled={i === ranking.length - 1}
                style={{ padding: '2px 8px', opacity: i === ranking.length - 1 ? 0.3 : 1, color: 'var(--text-muted)' }}>▼</button>
            </div>
          ))}
          <button className="btn btn-primary" onClick={saveRanking}>
            {rankSaved ? 'Saved ✓' : 'Save Priority'}
          </button>
      </Collapsible>

      {/* Session times */}
      <Collapsible title="Session Times" subtitle="Default morning / evening start">
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Used for calendar exports — when each AM / PM session starts. You can still
            tweak individual events before adding them to your calendar.
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div className="label">🌅 Morning (AM)</div>
              <input type="time" value={form.amTime} onChange={e => set('amTime', e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="label">🌙 Evening (PM)</div>
              <input type="time" value={form.pmTime} onChange={e => set('pmTime', e.target.value)} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={saveTimes}>
            {timesSaved ? 'Saved ✓' : 'Save Times'}
          </button>
      </Collapsible>

      {/* Plan start date */}
      <Collapsible title="Programme Start" subtitle="When Week 1 begins">
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Pick the Monday-of-week you want Week 1 (Build) to begin. The 6-week
            plan is laid out forward from here.
          </div>
          <div>
            <div className="label">Start Date</div>
            <input
              type="date"
              value={form.startDate}
              onChange={e => set('startDate', e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => {
            const updated = { ...storage.getProfile(), startDate: form.startDate };
            storage.setProfile(updated);
            storage.setPlan(generatePlan(updated));
            setPlanStartSaved(true);
            setTimeout(() => setPlanStartSaved(false), 2500);
          }}>
            {planStartSaved ? 'Plan Rescheduled ✓' : 'Set Start Date & Build Plan'}
          </button>
      </Collapsible>

      {/* Plan actions */}
      <Collapsible title="Plan" subtitle="Calendar export · regenerate · reset">
          <div>
            <button className="btn btn-secondary" onClick={() => { const p = storage.getPlan(); if (p) downloadICS(planToEvents(p, storage.getProfile())); }}>
              📅 Export Full Plan (.ics)
            </button>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
              Downloads the whole 6-week plan — open it to import into Google / Apple / Outlook.
              For a single week with adjustable times, use “Export week” on the Plan tab.
            </div>
          </div>

          <button className="btn btn-secondary" onClick={resetPlan}>
            Regenerate Plan (keep baselines)
          </button>

          {!confirmReset ? (
            <button className="btn btn-ghost" style={{ color: 'var(--danger)' }}
              onClick={() => setConfirmReset(true)}>
              Reset Everything
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--danger)', textAlign: 'center' }}>
                This deletes all data. Are you sure?
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmReset(false)}>Cancel</button>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={hardReset}>Yes, Reset</button>
              </div>
            </div>
          )}
      </Collapsible>

      <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', paddingBottom: '1rem' }}>
        TACFIT · All data stored on this device
        <div style={{ marginTop: 4, fontSize: '0.68rem', color: 'var(--text-muted)', opacity: 0.7 }}>
          v{__APP_VERSION__} · build {__BUILD_TIME__}
        </div>
      </div>
    </div>
  );
}
