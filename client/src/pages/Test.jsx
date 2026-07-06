import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import PhaseTimer from '../components/PhaseTimer';
import EventLogSheet from '../components/EventLogSheet';
import { EVENTS, eventResult } from '../lib/scoring';
import { store } from '../store/profile';

export default function Test() {
  const navigate = useNavigate();
  const [logging, setLogging] = useState(null); // the event being logged
  const [, setRefresh] = useState(0);

  const eventLogs = store.getEventLogs();
  const lastFor = (key) => {
    const forEv = eventLogs.filter(l => l.eventKey === key);
    return forEv.length ? forEv[forEv.length - 1] : null;
  };

  const saveEvent = (event, value) => {
    const res = eventResult(event, value);
    store.addEventLog({ eventKey: event.key, name: event.name, value, met: res.met, bonus: res.bonus });
    setLogging(null);
    setRefresh(r => r + 1);
  };

  return (
    <div className="screen" style={{ paddingTop: '1.25rem', paddingBottom: '6rem', gap: '1rem' }}>
      <div>
        <div style={{ fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.02em', color: 'var(--accent)' }}>TEST</div>
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Full circuit or single events — both logged</div>
      </div>

      {/* Full assessment */}
      <button className="card" onClick={() => navigate('/assessment')}
        style={{ width: '100%', textAlign: 'left', cursor: 'pointer', border: '1px solid var(--accent)', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '1.8rem' }}>🎯</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800 }}>Full Assessment</div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Score all 5 events · live tier</div>
          </div>
          <span style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>→</span>
        </div>
        <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>Run the whole circuit with per-event timers and save the scored attempt.</div>
      </button>

      {/* Single-event logging */}
      <div>
        <div className="label">Single Event · component training</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {EVENTS.map(ev => {
            const last = lastFor(ev.key);
            return (
              <button key={ev.key} className="card"
                onClick={() => setLogging(ev)}
                style={{ width: '100%', textAlign: 'left', cursor: 'pointer', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)' }}>0{ev.n}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{ev.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    baseline {ev.baseline} {ev.unit} · {ev.timer ? 'timed' : 'max reps'}
                  </div>
                </div>
                {last != null && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: last.met ? 'var(--accent)' : 'var(--text-muted)' }}>{last.value}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>last</div>
                  </div>
                )}
                <span style={{ fontSize: '1.1rem', color: 'var(--accent)' }}>{ev.timer ? '▶' : '＋'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Timed events → PhaseTimer; untimed → bottom-sheet stepper */}
      {logging && logging.timer && (
        <PhaseTimer
          key={logging.key}
          event={logging}
          phases={logging.timer}
          initialCount={lastFor(logging.key)?.value || 0}
          baseline={logging.baseline}
          onClose={() => setLogging(null)}
          onDone={(count) => saveEvent(logging, count)}
        />
      )}
      {logging && !logging.timer && (
        <EventLogSheet
          event={logging}
          initial={lastFor(logging.key)?.value || 0}
          onClose={() => setLogging(null)}
          onSave={(value) => saveEvent(logging, value)}
        />
      )}

      <BottomNav active="test" />
    </div>
  );
}
