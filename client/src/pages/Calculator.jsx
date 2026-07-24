import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import Stepper from '../components/Stepper';
import TierBadge from '../components/TierBadge';
import PhaseTimer from '../components/PhaseTimer';
import { EVENTS, scoreAssessment } from '../lib/scoring';
import { store } from '../store/profile';

function loadLabel(event, profile) {
  if (event.loadIsBodyweight) return `${profile.bodyweight} ${profile.unit} · bodyweight`;
  if (event.loadIsExternal) return `${profile.externalLoad} ${profile.unit} · external`;
  if (event.hasLoad) return `${profile.loadClass} ${profile.unit} · class`;
  return null;
}

export default function Calculator() {
  const navigate = useNavigate();
  const profile = store.getProfile();
  const [values, setValues] = useState(() => Object.fromEntries(EVENTS.map(e => [e.key, 0])));
  const [timerFor, setTimerFor] = useState(null);
  const [saved, setSaved] = useState(false);

  const result = scoreAssessment(values);
  const setVal = (key, v) => setValues(prev => ({ ...prev, [key]: v }));

  const saveAttempt = () => {
    store.addAttempt({
      values: { ...values },
      totalBonus: result.totalBonus,
      allMet: result.allMet,
      tier: { key: result.tier.key, label: result.tier.label },
      profile: { bodyweight: profile.bodyweight, loadClass: profile.loadClass, externalLoad: profile.externalLoad, unit: profile.unit },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div className="screen" style={{ paddingTop: '1.25rem', paddingBottom: '6rem', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="btn btn-ghost" style={{ width: 'auto', padding: '0.4rem 0.7rem' }} onClick={() => navigate('/test')}>← Test</button>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.02em', color: 'var(--accent)' }}>FULL ASSESSMENT</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>5-event scored circuit</div>
        </div>
      </div>

      {/* Sticky score summary */}
      <div className="card" style={{
        position: 'sticky', top: '0.5rem', zIndex: 20,
        border: `1px solid ${result.tier.color}`, display: 'flex', flexDirection: 'column', gap: 10,
        background: 'var(--bg-card)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bonus points</div>
            <div style={{ fontSize: '2.4rem', fontWeight: 900, lineHeight: 1, color: result.tier.color }}>{result.totalBonus}</div>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <TierBadge tier={result.tier} big />
            {result.allMet && result.toNext != null && result.toNext > 0 && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{result.toNext} pts to next tier</div>
            )}
            {!result.allMet && (
              <div style={{ fontSize: '0.72rem', color: 'var(--danger)' }}>
                {result.events.filter(e => !e.met).length} event(s) below baseline
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event cards */}
      {result.events.map(ev => {
        const load = loadLabel(ev, profile);
        return (
          <div key={ev.key} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, border: `1px solid ${ev.met ? 'color-mix(in srgb, var(--success) 19%, transparent)' : 'var(--border)'}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>0{ev.n}</span>
                  <span style={{ fontWeight: 800 }}>{ev.name}</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{ev.sub}</div>
                {load && <div style={{ fontSize: '0.72rem', color: 'var(--accent)', marginTop: 3, fontWeight: 600 }}>🏋 {load}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: ev.bonus > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {ev.bonus > 0 ? `+${ev.bonus}` : '0'}
                </div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>points</div>
              </div>
            </div>

            <Stepper value={values[ev.key]} onChange={v => setVal(ev.key, v)} baseline={ev.baseline} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: ev.met ? 'var(--success)' : 'var(--text-muted)' }}>
                {ev.met ? `✓ baseline met (${ev.baseline})` : `${ev.toBaseline} ${ev.unit} to baseline`}
              </div>
              {ev.timer && (
                <button onClick={() => setTimerFor(ev)}
                  style={{
                    padding: '0.4rem 0.85rem', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700,
                    color: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 27%, transparent)',
                  }}>
                  ▶ Run timer
                </button>
              )}
            </div>
          </div>
        );
      })}

      <button className="btn btn-primary" onClick={saveAttempt}>
        {saved ? 'Saved to History ✓' : 'Save Attempt'}
      </button>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
        Tiers: Qualified 0 · Passing 20 · Above Average 37.5 · Excellent 50+ bonus points.
        Every event must meet its baseline to pass.
      </div>

      {timerFor && (
        <PhaseTimer
          key={timerFor.key}
          event={timerFor}
          phases={timerFor.timer}
          initialCount={values[timerFor.key]}
          baseline={timerFor.baseline}
          onClose={() => setTimerFor(null)}
          onDone={(count) => { setVal(timerFor.key, count); setTimerFor(null); }}
        />
      )}

      <BottomNav active="test" />
    </div>
  );
}
