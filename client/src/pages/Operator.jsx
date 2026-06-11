import { useState } from 'react';
import { storage } from '../store/storage';
import { EVENTS, scoreAssessment } from '../lib/operatorScore';
import EventTimer from '../components/EventTimer';
import BottomNav from '../components/BottomNav';

export default function Operator() {
  const profile = storage.getProfile();
  const unit = profile?.unit || 'kg';
  const history = storage.getOperatorTests();
  const last = history[history.length - 1];

  const [values, setValues] = useState(() => {
    const init = {};
    EVENTS.forEach(e => { init[e.key] = last?.values?.[e.key] ?? ''; });
    return init;
  });
  const [loads, setLoads] = useState(() => {
    const init = {};
    EVENTS.forEach(e => { if (e.hasLoad) init[e.key] = last?.loads?.[e.key] ?? (e.loadOptions?.[0] ?? ''); });
    return init;
  });
  const [savedMsg, setSavedMsg] = useState(false);
  const [timerEvent, setTimerEvent] = useState(null);

  const setVal = (k, v) => setValues(s => ({ ...s, [k]: v }));
  const setLoad = (k, v) => setLoads(s => ({ ...s, [k]: v }));

  const result = scoreAssessment(values);
  const anyInput = EVENTS.some(e => values[e.key] !== '' && values[e.key] != null);

  const saveAttempt = () => {
    storage.addOperatorTest({
      date: new Date().toISOString(),
      values: { ...values },
      loads: { ...loads },
      totalBonus: result.totalBonus,
      tier: result.tier.key,
      tierLabel: result.tier.label,
      allMet: result.allMet,
    });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  return (
    <div className="screen" style={{ gap: '1.25rem', paddingTop: '1.5rem', paddingBottom: '5rem' }}>
      {/* Header */}
      <div>
        <div style={{ fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.02em', color: 'var(--accent)' }}>OPERATOR</div>
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>5-event fitness test protocol</div>
      </div>

      {timerEvent && (
        <EventTimer
          label={`${timerEvent.n}. ${timerEvent.name}`}
          phases={timerEvent.timer}
          onClose={() => setTimerEvent(null)}
        />
      )}

      {/* Live result */}
      <div className="card" style={{
        textAlign: 'center',
        background: `${result.tier.color}14`,
        border: `1px solid ${result.tier.color}`,
      }}>
        <div style={{ fontSize: '2rem' }}>{result.tier.icon}</div>
        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: result.tier.color }}>
          {anyInput ? result.tier.label : '—'}
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>
          {result.totalBonus.toFixed(1)} bonus points
          {result.tier.note && anyInput ? ` · ${result.tier.note}` : ''}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
          {[['🟢 Pass', 25], ['🔵 Above', 37.5], ['🔥 Excellent', 50]].map(([lbl, pts]) => (
            <span key={lbl} style={{
              fontSize: '0.66rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999,
              background: result.totalBonus >= pts && result.allMet ? `${result.tier.color}30` : 'var(--bg-elevated)',
              color: result.totalBonus >= pts && result.allMet ? result.tier.color : 'var(--text-muted)',
            }}>
              {lbl} {pts}
            </span>
          ))}
        </div>
      </div>

      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        Pass every event's baseline <strong>and</strong> bank 20+ bonus points. Enter your best
        score per event — bonus points are awarded for everything above baseline.
      </div>

      {/* Events */}
      {result.events.map(ev => (
        <div key={ev.key} className="card" style={{
          borderLeft: `3px solid ${values[ev.key] === '' ? 'var(--border)' : ev.met ? 'var(--success)' : 'var(--danger)'}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>
                <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>{ev.n}.</span>{ev.name}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{ev.sub}</div>
              {ev.loadIsBodyweight && (
                <div style={{ fontSize: '0.72rem', color: 'var(--accent)', marginTop: 3, fontWeight: 600 }}>
                  Target load: {profile?.bodyweight ? `${profile.bodyweight} ${unit} (your bodyweight)` : 'set bodyweight in Settings'}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Baseline
              </div>
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
                  onChange={e => setLoad(ev.key, e.target.value)}
                  style={{ width: 64, textAlign: 'center' }} />
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{unit}</span>
              </div>
            )}
          </div>

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

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: '0.78rem' }}>
            <span style={{ color: values[ev.key] === '' ? 'var(--text-muted)' : ev.met ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
              {values[ev.key] === '' ? '—' : ev.met ? '✓ Baseline met' : '✗ Below baseline'}
            </span>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
              +{ev.bonus.toFixed(1)} pts
            </span>
          </div>
        </div>
      ))}

      <button className="btn btn-primary" onClick={saveAttempt} disabled={!anyInput}>
        {savedMsg ? 'Attempt Saved ✓' : 'Save Attempt'}
      </button>

      {/* History */}
      {history.length > 0 && (
        <div>
          <div className="label">Past Attempts</div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[...history].reverse().map((t, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.6rem 0',
                borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {new Date(t.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{t.totalBonus.toFixed(1)} pts</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: t.allMet ? 'var(--success)' : 'var(--danger)' }}>
                    {t.tierLabel}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <BottomNav active="test" />
    </div>
  );
}
