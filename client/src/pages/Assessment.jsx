import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../store/storage';
import { generatePlan } from '../lib/planEngine';

export default function Assessment() {
  const navigate = useNavigate();
  const profile = storage.getProfile();
  const [rmMode, setRmMode] = useState(profile?.rmMode || '8rm');
  const [form, setForm] = useState({
    squat: '',
    deadlift: '',
    bench: '',
    ohp: '',
    row: '',
    run2400: '',
    swim400: '',
    ruckPace: '',
    ruckLoad: String(profile?.baselines?.ruckLoadKg || 20),
  });

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const timeToSeconds = (str) => {
    if (!str) return null;
    const parts = str.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + (parts[1] || 0);
    return 0;
  };

  const finish = () => {
    const toOneRM = (val) => val ? (rmMode === '8rm' ? Math.round(Number(val) / 0.80) : Number(val)) : null;

    const newBaselines = {
      ...profile.baselines,
      ...(form.squat    ? { squat: toOneRM(form.squat),       squat8rm: Number(form.squat) }    : {}),
      ...(form.deadlift ? { deadlift: toOneRM(form.deadlift), deadlift8rm: Number(form.deadlift) } : {}),
      ...(form.bench    ? { bench: toOneRM(form.bench),       bench8rm: Number(form.bench) }     : {}),
      ...(form.ohp      ? { ohp: toOneRM(form.ohp),           ohp8rm: Number(form.ohp) }         : {}),
      ...(form.row      ? { row: toOneRM(form.row),           row8rm: Number(form.row) }         : {}),
      ...(form.run2400  ? { run2400s: timeToSeconds(form.run2400) }  : {}),
      ...(form.swim400  ? { swim400s: timeToSeconds(form.swim400) }  : {}),
      ...(form.ruckPace ? { ruckPaceMinKm: timeToSeconds(form.ruckPace) / 60 } : {}),
      ruckLoadKg: Number(form.ruckLoad),
    };

    const updatedProfile = { ...profile, rmMode, baselines: newBaselines };
    storage.setProfile(updatedProfile);

    // Clear old logs and generate fresh 6-week block
    localStorage.removeItem('tacfit_logs');
    localStorage.removeItem('tacfit_wellness');
    const newPlan = generatePlan(updatedProfile);
    storage.setPlan(newPlan);
    navigate('/dashboard');
  };

  return (
    <div className="screen" style={{ paddingTop: '2rem', gap: '1.25rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: 8 }}>🏆</div>
        <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>6-Week Assessment</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
          Log your new numbers. Leave blank to keep previous baselines.
        </div>
      </div>

      {/* 1RM / 8RM toggle */}
      <div>
        <div className="label">Input type</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn ${rmMode === '8rm' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setRmMode('8rm')} style={{ flex: 1 }}>
            8RM
          </button>
          <button className={`btn ${rmMode === '1rm' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setRmMode('1rm')} style={{ flex: 1 }}>
            1RM
          </button>
        </div>
      </div>

      {/* Strength */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Strength</div>
        {[
          { key: 'squat',    label: 'Back Squat',      prev: profile?.baselines?.squat8rm || profile?.baselines?.squat },
          { key: 'deadlift', label: 'Deadlift',        prev: profile?.baselines?.deadlift8rm || profile?.baselines?.deadlift },
          { key: 'bench',    label: 'Bench Press',     prev: profile?.baselines?.bench8rm || profile?.baselines?.bench },
          { key: 'ohp',      label: 'Overhead Press',  prev: profile?.baselines?.ohp8rm || profile?.baselines?.ohp },
          { key: 'row',      label: 'Bent-over Row',   prev: profile?.baselines?.row8rm || profile?.baselines?.row },
        ].map(({ key, label, prev }) => (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div className="label" style={{ margin: 0 }}>{label} {rmMode.toUpperCase()}</div>
              {prev && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>prev: {prev} {profile.unit}</div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <input type="number" inputMode="decimal"
                placeholder={prev ? String(prev) : '0'}
                value={form[key]}
                onChange={e => setF(key, e.target.value)} />
              <span style={{ color: 'var(--text-muted)', minWidth: 30 }}>{profile.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Cardio */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Cardio</div>
        {[
          { key: 'run2400', label: '2.4km Run Time',  placeholder: '12:00' },
          { key: 'swim400', label: '400m Swim Time',  placeholder: '09:00' },
          { key: 'ruckPace',label: 'Ruck Pace (min/km)', placeholder: '08:00' },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <div className="label">{label}</div>
            <input type="text" inputMode="numeric" placeholder={placeholder}
              value={form[key]} onChange={e => setF(key, e.target.value)} />
          </div>
        ))}
        <div>
          <div className="label">Ruck Load ({profile.unit})</div>
          <input type="number" inputMode="decimal"
            value={form.ruckLoad} onChange={e => setF('ruckLoad', e.target.value)} />
        </div>
      </div>

      <button className="btn btn-primary" onClick={finish}>
        Generate New 6-Week Block →
      </button>
    </div>
  );
}
