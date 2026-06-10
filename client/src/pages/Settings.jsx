import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../store/storage';
import { getBarOptions } from '../lib/plateCalc';
import { generatePlan } from '../lib/planEngine';

export default function Settings() {
  const navigate = useNavigate();
  const profile = storage.getProfile();
  const todayStr = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    name: profile?.name || '',
    unit: profile?.unit || 'kg',
    barWeight: profile?.barWeight || 20,
    startDate: profile?.startDate || todayStr,
  });
  const [planStartSaved, setPlanStartSaved] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [baselines, setBaselines] = useState({ ...profile?.baselines });
  const [baselinesSaved, setBaselinesSaved] = useState(false);

  const setB = (k, v) => setBaselines(b => ({ ...b, [k]: Number(v) || 0 }));

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const barOptions = getBarOptions(form.unit);

  const saveProfile = () => {
    const updated = { ...profile, ...form, barWeight: Number(form.barWeight) };
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
      <div>
        <div className="label">Profile</div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

          <button className="btn btn-primary" onClick={saveProfile}>
            {saved ? 'Saved ✓' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Editable baselines */}
      <div>
        <div className="label">Baselines (1RM)</div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
        </div>
      </div>

      {/* Plan start date */}
      <div>
        <div className="label">Programme Start</div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
        </div>
      </div>

      {/* Plan actions */}
      <div>
        <div className="label">Plan</div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', paddingBottom: '1rem' }}>
        TACFIT · All data stored on this device
      </div>
    </div>
  );
}
