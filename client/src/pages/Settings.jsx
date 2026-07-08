import { useState } from 'react';
import BottomNav from '../components/BottomNav';
import { store, DEFAULT_PROFILE } from '../store/profile';
import { setMuted, unlockAudio, fxAchievement } from '../lib/feedback';

const LOAD_CLASSES = [40, 30, 20];

export default function Settings() {
  const [profile, setProfile] = useState(store.getProfile());
  const [saved, setSaved] = useState(false);

  const set = (k, v) => setProfile(p => ({ ...p, [k]: v }));

  const save = () => {
    store.setProfile(profile);
    setMuted(profile.muted);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const num = (k, min, max, unit) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input type="number" inputMode="decimal" value={profile[k] ?? ''}
        onChange={e => set(k, Number(e.target.value) || 0)}
        min={min} max={max}
        style={{ width: 100, textAlign: 'center', fontWeight: 700 }} />
      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{unit}</span>
    </div>
  );

  return (
    <div className="screen" style={{ paddingTop: '1.25rem', paddingBottom: '6rem', gap: '1.5rem' }}>
      <div>
        <div style={{ fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.02em', color: 'var(--accent)' }}>SETTINGS</div>
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Profile & prescribed loads</div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        <div>
          <div className="label">Bodyweight <span style={{ textTransform: 'none', color: 'var(--text-muted)' }}>· bench press load</span></div>
          {num('bodyweight', 40, 200, profile.unit)}
        </div>

        <div>
          <div className="label">Weight Class <span style={{ textTransform: 'none', color: 'var(--text-muted)' }}>· clean & press + lunges</span></div>
          <div style={{ display: 'flex', gap: 8 }}>
            {LOAD_CLASSES.map(w => (
              <button key={w} onClick={() => set('loadClass', w)}
                className={`btn ${profile.loadClass === w ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '0.6rem 0' }}>
                {w} {profile.unit}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="label">External Load <span style={{ textTransform: 'none', color: 'var(--text-muted)' }}>· pull-ups + shuttles</span></div>
          {num('externalLoad', 0, 60, profile.unit)}
        </div>

        <div>
          <div className="label">Unit</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['kg', 'lbs'].map(u => (
              <button key={u} onClick={() => set('unit', u)}
                className={`btn ${profile.unit === u ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '0.6rem 0' }}>
                {u}
              </button>
            ))}
          </div>
        </div>
      </div>

      <details className="card" style={{ cursor: 'pointer' }}>
        <summary style={{ fontWeight: 700, outline: 'none' }}>Personal Lift Data (1RM)</summary>
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {['squat', 'deadlift', 'bench', 'press'].map(lift => (
            <div key={lift} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ textTransform: 'capitalize' }}>{lift}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="number" value={profile.oneRMs?.[lift] || 0}
                  onChange={e => {
                    const val = Number(e.target.value) || 0;
                    setProfile(p => ({ ...p, oneRMs: { ...p.oneRMs, [lift]: val } }));
                  }}
                  style={{ width: 80, textAlign: 'center', padding: '0.4rem' }}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>kg</span>
              </div>
            </div>
          ))}
        </div>
      </details>

      <details className="card" style={{ cursor: 'pointer' }}>
        <summary style={{ fontWeight: 700, outline: 'none' }}>Frequently Asked Questions</summary>
        <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <strong style={{ color: 'var(--text)' }}>What happens if I skip a workout?</strong><br/>
            The 6-week calendar keeps moving forward. However, to prevent injury, the percentage progression for the specific lift you skipped will pause until you complete it next week.
          </div>
          <div>
            <strong style={{ color: 'var(--text)' }}>How are my daily weights calculated?</strong><br/>
            They are generated dynamically based on the 1RM data you enter and the week of the program you are currently in.
          </div>
        </div>
      </details>

      <button className="btn btn-secondary" onClick={() => window.location.href = 'mailto:support@tacfit.app'}>
        Submit Feedback
      </button>

      {/* Feedback prefs */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 700 }}>Sound & haptics</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Rep clicks, countdown, achievement cues</div>
        </div>
        <button onClick={() => { const m = !profile.muted; set('muted', m); setMuted(m); if (!m) { unlockAudio(); fxAchievement(); } }}
          style={{
            padding: '0.5rem 1rem', borderRadius: 999, fontWeight: 700, fontSize: '0.85rem',
            background: profile.muted ? 'var(--bg-elevated)' : 'var(--accent)20',
            border: `1px solid ${profile.muted ? 'var(--border)' : 'var(--accent)'}`,
            color: profile.muted ? 'var(--text-muted)' : 'var(--accent)',
          }}>
          {profile.muted ? '🔕 Off' : '🔔 On'}
        </button>
      </div>

      <button className="btn btn-primary" onClick={save}>{saved ? 'Saved ✓' : 'Save Settings'}</button>

      <button className="btn btn-ghost" style={{ color: 'var(--danger)' }}
        onClick={() => { setProfile({ ...DEFAULT_PROFILE }); }}>
        Reset to defaults
      </button>

      <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.7 }}>
        v{__APP_VERSION__} · build {__BUILD_TIME__} · all data on-device
      </div>

      <BottomNav active="settings" />
    </div>
  );
}
