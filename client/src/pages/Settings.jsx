import { useState, useEffect } from 'react';
import BottomNav from '../components/BottomNav';
import PageHeader from '../components/PageHeader';
import { store, DEFAULT_PROFILE } from '../store/profile';
import { setMuted, unlockAudio, fxAchievement } from '../lib/feedback';
import { supabase } from '../lib/supabase';

const LOAD_CLASSES = [40, 30, 20];

// Epley: a 1RM is ~1.2664× an 8-rep max. We always store the 1RM; the 8RM
// toggle just lets you enter/read the same lift as your 8-rep working weight.
const EIGHT_TO_ONE = 1.2664;
const toOneRM = (eightRM) => Math.round(eightRM * EIGHT_TO_ONE);
const toEightRM = (oneRM) => Math.round(oneRM / EIGHT_TO_ONE);

// yyyy-mm-dd (local) for <input type="date">, round-tripping the stored ISO.
const toDateInput = (iso) => {
  const d = iso ? new Date(iso) : new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function Settings() {
  const [profile, setProfile] = useState(store.getProfile());
  const [saved, setSaved] = useState(false);
  const [rmMode, setRmMode] = useState('1RM'); // view/edit lifts as 1RM or 8RM
  const [showRmInfo, setShowRmInfo] = useState(false); // 1RM/8RM science explainer
  const [account, setAccount] = useState(null); // signed-in Google email

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAccount(data.session?.user?.email || null));
  }, []);
  const signOut = async () => {
    await supabase.auth.signOut();
    const keysToClear = [
      'tac5_profile',
      'tac5_attempts',
      'tac5_events',
      'tac5_wod',
      'tac5_exmem',
      'tac5_custom_exercises',
      'dev_bypass'
    ];
    keysToClear.forEach(k => localStorage.removeItem(k));
    window.location.reload();
  };
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
      <PageHeader title="SETTINGS" subtitle="Profile & prescribed loads" />

      {/* Signed-in account */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Account</div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {account || 'Guest (not signed in)'}
          </div>
        </div>
        {account && (
          <button className="btn btn-secondary" onClick={signOut}
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem', flexShrink: 0, width: 'auto' }}>
            Sign out
          </button>
        )}
      </div>

      {/* Program cycle */}
      <div className="card">
        <div className="label">Program start date <span style={{ textTransform: 'none', color: 'var(--text-muted)' }}>· week 1 begins here</span></div>
        <input type="date" value={toDateInput(profile.programStartDate)}
          onChange={e => set('programStartDate', new Date(`${e.target.value}T12:00:00`).toISOString())}
          style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }} />
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Shifts the whole 6-week cycle. Your prescribed weights recalculate from this date.
        </p>
      </div>

      <div id="tour-settings" className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
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
        <summary style={{ fontWeight: 700, outline: 'none' }}>Personal Lift Data</summary>
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>
            Enter each lift as your 1-rep max or your 8-rep working weight — we convert and store the 1RM either way. These drive your daily prescribed weights.
          </p>

          {/* 1RM / 8RM toggle + science explainer */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ flex: 1, display: 'flex', gap: 6, background: 'var(--bg-elevated)', padding: 4, borderRadius: 999 }}>
              {['1RM', '8RM'].map(m => (
                <button key={m} onClick={() => setRmMode(m)}
                  className={`btn ${rmMode === m ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '0.45rem 0', fontSize: '0.82rem' }}>
                  {m === '1RM' ? '1 Rep Max' : '8 Rep Max'}
                </button>
              ))}
            </div>
            <button onClick={() => setShowRmInfo(v => !v)} aria-label="How the conversion works"
              style={{
                width: 32, height: 32, flexShrink: 0, borderRadius: 999, fontWeight: 800,
                background: showRmInfo ? 'var(--accent)' : 'var(--bg-elevated)',
                color: showRmInfo ? '#000' : 'var(--text-muted)',
                border: '1px solid var(--border)',
              }}>
              ?
            </button>
          </div>

          {showRmInfo && (
            <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', lineHeight: 1.55, background: 'var(--bg-elevated)', padding: '0.8rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <strong style={{ color: 'var(--text)' }}>The science:</strong> testing a true 1-rep max is risky and needs a spotter. Instead, lift a weight you can do for ~8 clean reps and we estimate your max with the <strong style={{ color: 'var(--text)' }}>Epley formula</strong>:
              <div style={{ margin: '0.5rem 0', textAlign: 'center', color: 'var(--accent)', fontWeight: 700 }}>1RM ≈ weight × (1 + reps ÷ 30)</div>
              At 8 reps that's about <strong style={{ color: 'var(--text)' }}>1.27×</strong> your 8-rep weight — accurate enough to prescribe training loads without ever maxing out.
            </div>
          )}

          {['squat', 'deadlift', 'bench', 'press'].map(lift => {
            const oneRM = profile.oneRMs?.[lift] || 0;
            const shown = rmMode === '8RM' ? toEightRM(oneRM) : oneRM;
            return (
              <div key={lift} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ textTransform: 'capitalize' }}>{lift}</span>
                  {rmMode === '8RM' && oneRM > 0 && (
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>1RM ≈ {oneRM} kg</div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="number" value={shown || 0}
                    onChange={e => {
                      const entered = Number(e.target.value) || 0;
                      const stored = rmMode === '8RM' ? toOneRM(entered) : entered;
                      setProfile(p => ({ ...p, oneRMs: { ...p.oneRMs, [lift]: stored } }));
                    }}
                    style={{ width: 80, textAlign: 'center', padding: '0.4rem' }}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>kg · {rmMode}</span>
                </div>
              </div>
            );
          })}
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

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontWeight: 700 }}>Support & Feedback</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          Have ideas, feature requests, or encountered a bug? Send us an email using our preset feedback template.
        </div>
        <button className="btn btn-secondary" style={{ width: '100%', marginTop: '0.4rem' }}
          onClick={() => {
            const subject = encodeURIComponent("TacFit App Feedback & Suggestions");
            const body = encodeURIComponent(
              "Hi TacFit Team,\n\nHere is my feedback on the app:\n\n1. What I like:\n\n2. What could be improved:\n\n3. Bugs/issues encountered:\n\nApp Info:\n- Platform: " + navigator.userAgent + "\n- Version: 1.3.0"
            );
            window.location.href = `mailto:support@tacfit.app?subject=${subject}&body=${body}`;
          }}>
          Submit Feedback
        </button>
      </div>

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
        onClick={() => {
          if (window.confirm("Are you sure you want to reset the app? This will permanently delete your workout history, attempts, and progression start date. Your personal lift 1RMs and weight specs will be kept.")) {
            store.resetAppButKeepLifts();
            window.location.reload();
          }
        }}>
        Reset to defaults
      </button>

      <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.7 }}>
        v{__APP_VERSION__} · build {__BUILD_TIME__} · all data on-device
      </div>

      <BottomNav active="settings" />
    </div>
  );
}
