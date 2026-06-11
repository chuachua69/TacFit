import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../store/storage';
import { generatePlan } from '../lib/planEngine';
import { TimePicker, NumberWheel, fmtTime } from '../components/WheelPicker';
import FileImport from '../components/FileImport';
import BottomNav from '../components/BottomNav';
import {
  DISCIPLINES, DISC_LABEL, DISC_EMOJI, normalizeRanking, recommendedDisciplines,
} from '../lib/focus';

const LIFTS = [['squat', 'Squat'], ['deadlift', 'Deadlift'], ['bench', 'Bench'], ['ohp', 'OHP'], ['row', 'Row']];

function deriveCardio(key, r) {
  if (key === 'run') return { run2400s: Math.round(r.paceSecPerKm * 2.4) };
  if (key === 'swim') return { swim400s: Math.round(r.paceSecPerKm * 0.4) };
  if (key === 'ruck') return { ruckPaceMinKm: r.paceSecPerKm / 60 };
  return {};
}

export default function Baseline() {
  const navigate = useNavigate();
  const profile = storage.getProfile();
  const unit = profile?.unit || 'kg';

  const [ranking, setRanking] = useState(() => normalizeRanking(profile?.focusRanking));
  const [mode, setMode] = useState('recommended'); // 'recommended' | 'all'
  const [bl, setBl] = useState({ ...profile?.baselines });
  const [saved, setSaved] = useState(false);
  const [rankSaved, setRankSaved] = useState(false);

  const activeDiscs = mode === 'all' ? DISCIPLINES : recommendedDisciplines(ranking, 2);
  const setBlVal = (k, v) => setBl(b => ({ ...b, [k]: v }));

  const save = () => {
    const updated = { ...profile, baselines: { ...profile.baselines, ...bl }, focusRanking: ranking };
    storage.setProfile(updated);
    storage.setPlan(generatePlan(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const move = (i, dir) => {
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

  return (
    <div className="screen" style={{ paddingTop: '1.5rem', paddingBottom: '5rem', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-ghost" style={{ width: 'auto', padding: '0.4rem 0.75rem' }}
          onClick={() => navigate(-1)}>← Back</button>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Baseline Test</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Re-measure & recalibrate loads</div>
        </div>
      </div>

      {/* Mode toggle */}
      <div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn ${mode === 'recommended' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }}
            onClick={() => setMode('recommended')}>Recommended</button>
          <button className={`btn ${mode === 'all' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }}
            onClick={() => setMode('all')}>Retest All</button>
        </div>
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 6 }}>
          {mode === 'recommended'
            ? `Based on your focus priority: ${recommendedDisciplines(ranking, 2).map(d => DISC_LABEL[d]).join(' & ')}.`
            : 'Re-measure every event. Spread across a few days for true maxes.'}
        </div>
      </div>

      {/* Gym lifts */}
      {activeDiscs.includes('gym') && (
        <div>
          <div className="label">🏋️ Strength (1RM)</div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {LIFTS.map(([key, label]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ flex: 1, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{label}</span>
                <input type="number" inputMode="numeric" value={bl[key] ?? ''}
                  onChange={e => setBlVal(key, Number(e.target.value) || 0)}
                  style={{ width: 90, textAlign: 'center', padding: '0.4rem 0.5rem' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: 28 }}>{unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cardio events */}
      {activeDiscs.filter(d => d !== 'gym').map(d => (
        <div key={d}>
          <div className="label">{DISC_EMOJI[d]} {DISC_LABEL[d]}</div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {d === 'run' && (
              <TimeRow label="2.4km Run Time" value={bl.run2400s} onChange={v => setBlVal('run2400s', v)} maxMin={30} />
            )}
            {d === 'swim' && (
              <TimeRow label="400m Swim Time" value={bl.swim400s} onChange={v => setBlVal('swim400s', v)} maxMin={25} />
            )}
            {d === 'ruck' && (<>
              <TimeRow label="Ruck Pace (min/km)"
                value={Math.round((bl.ruckPaceMinKm || 0) * 60)}
                onChange={v => setBlVal('ruckPaceMinKm', v / 60)} maxMin={20} />
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Ruck Load</span>
                  <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{bl.ruckLoadKg || 0} {unit}</span>
                </div>
                <NumberWheel value={Number(bl.ruckLoadKg || 0)} onChange={v => setBlVal('ruckLoadKg', v)}
                  from={0} to={60} step={unit === 'kg' ? 2.5 : 5} unit={unit} />
              </div>
            </>)}
            {d !== 'gym' && (
              <FileImport
                label={`Import ${d} file (GPX/TCX)`}
                variant={d === 'swim' ? 'swim' : undefined}
                hint="Auto-fills from your Strava/watch file’s average pace"
                onParsed={r => setBl(b => ({ ...b, ...deriveCardio(d, r) }))}
              />
            )}
          </div>
        </div>
      ))}

      <button className="btn btn-primary" onClick={save}>
        {saved ? 'Saved · Plan Recalibrated ✓' : 'Save Results & Update Plan'}
      </button>

      {/* Focus priority */}
      <div>
        <div className="label">Focus Priority</div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Drives which events are recommended. Reorder anytime (also in Settings).
          </div>
          {ranking.map((d, i) => (
            <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.45rem 0.5rem', background: 'var(--bg-elevated)', borderRadius: 8 }}>
              <span style={{ width: 18, fontWeight: 800, color: 'var(--accent)' }}>{i + 1}</span>
              <span style={{ flex: 1 }}>{DISC_EMOJI[d]} {DISC_LABEL[d]}</span>
              <button onClick={() => move(i, -1)} disabled={i === 0}
                style={{ padding: '2px 8px', opacity: i === 0 ? 0.3 : 1, color: 'var(--text-muted)' }}>▲</button>
              <button onClick={() => move(i, 1)} disabled={i === ranking.length - 1}
                style={{ padding: '2px 8px', opacity: i === ranking.length - 1 ? 0.3 : 1, color: 'var(--text-muted)' }}>▼</button>
            </div>
          ))}
          <button className="btn btn-secondary" onClick={saveRanking}>
            {rankSaved ? 'Priority Saved ✓' : 'Save Priority'}
          </button>
        </div>
      </div>

      <BottomNav active="test" />
    </div>
  );
}

function TimeRow({ label, value, onChange, maxMin }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontWeight: 800, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>{fmtTime(value || 0)}</span>
      </div>
      <TimePicker seconds={Math.round(value || 0)} onChange={onChange} maxMin={maxMin} />
    </div>
  );
}
