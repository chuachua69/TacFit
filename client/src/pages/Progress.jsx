import { useState } from 'react';
import BottomNav from '../components/BottomNav';
import TierBadge from '../components/TierBadge';
import { store } from '../store/profile';
import { EVENTS, TIERS } from '../lib/scoring';

const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

export default function Progress() {
  const [attempts, setAttempts] = useState(() => store.getAttempts().slice().reverse());
  const [eventLogs, setEventLogs] = useState(() => store.getEventLogs());
  const wodLogs = store.getWodLogs();

  const removeAttempt = (id) => { store.removeAttempt(id); setAttempts(store.getAttempts().slice().reverse()); };
  const removeEvent = (id) => { store.removeEventLog(id); setEventLogs(store.getEventLogs()); };

  const bestAttempt = attempts.reduce((m, a) => (a.allMet && a.totalBonus > (m?.totalBonus ?? -1) ? a : m), null);

  // Best value per event across BOTH single-event logs and full attempts
  const eventBest = {};
  eventLogs.forEach(l => { eventBest[l.eventKey] = Math.max(eventBest[l.eventKey] || 0, l.value); });
  store.getAttempts().forEach(a => EVENTS.forEach(ev => {
    const v = a.values?.[ev.key] || 0;
    eventBest[ev.key] = Math.max(eventBest[ev.key] || 0, v);
  }));

  const wodCount = wodLogs.length;

  return (
    <div className="screen" style={{ paddingTop: '1.25rem', paddingBottom: '6rem', gap: '1rem' }}>
      <div>
        <div style={{ fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.02em', color: 'var(--accent)' }}>PROGRESS</div>
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Assessments · events · training</div>
      </div>

      {/* Best passing score */}
      {bestAttempt && (
        <div className="card" style={{ border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Best passing score</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent)', lineHeight: 1 }}>{bestAttempt.totalBonus}</div>
          </div>
          <TierBadge tier={TIERS.find(t => t.key === bestAttempt.tier.key)} big />
        </div>
      )}

      {/* Per-event bests */}
      <div>
        <div className="label">Event bests</div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {EVENTS.map(ev => {
            const best = eventBest[ev.key] || 0;
            const met = best >= ev.baseline;
            const pct = Math.min(1, best / (ev.baseline * 1.5)); // baseline at ~67% of bar
            return (
              <div key={ev.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{ev.short}</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: met ? 'var(--accent)' : 'var(--text-muted)' }}>
                      {best} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>/ {ev.baseline}</span>
                    </span>
                  </div>
                  <div style={{ height: 5, background: 'var(--border)', borderRadius: 999, overflow: 'hidden', position: 'relative' }}>
                    <div style={{ width: `${pct * 100}%`, height: '100%', background: met ? 'var(--success)' : 'var(--accent)', borderRadius: 999 }} />
                    <div style={{ position: 'absolute', left: '66.6%', top: -1, bottom: -1, width: 1.5, background: 'var(--text-dim)' }} title="baseline" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* WOD activity */}
      <div>
        <div className="label">Training</div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent)' }}>{wodCount}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
            WOD session{wodCount === 1 ? '' : 's'} completed
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Mark sessions done on the WOD tab</div>
          </div>
        </div>
      </div>

      {/* Assessment attempt history */}
      <div>
        <div className="label">Assessment attempts</div>
        {attempts.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem 1rem', fontSize: '0.85rem' }}>
            No full attempts yet. Run the <strong>Full Assessment</strong> under Test.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {attempts.map(a => (
              <div key={a.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontSize: '1.3rem', fontWeight: 900, color: a.allMet ? 'var(--accent)' : 'var(--danger)' }}>{a.totalBonus}</span>
                  <div>
                    <TierBadge tier={a.allMet ? TIERS.find(t => t.key === a.tier.key) : { label: 'Failed', color: 'var(--danger)', icon: '⚠️' }} />
                    <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: 2 }}>{fmtDate(a.date)}</div>
                  </div>
                </div>
                <button onClick={() => removeAttempt(a.id)} aria-label="Delete" style={{ color: 'var(--text-muted)', fontSize: '1.05rem', padding: '0.25rem 0.5rem' }}>🗑</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Single-event log history */}
      {eventLogs.length > 0 && (
        <div>
          <div className="label">Single-event logs</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {eventLogs.slice().reverse().map(l => (
              <div key={l.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 800, color: l.met ? 'var(--accent)' : 'var(--text-muted)' }}>{l.value}</span>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{l.name}</div>
                    <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>{fmtDate(l.date)} · {l.met ? `+${l.bonus} pts` : 'below baseline'}</div>
                  </div>
                </div>
                <button onClick={() => removeEvent(l.id)} aria-label="Delete" style={{ color: 'var(--text-muted)', fontSize: '1rem', padding: '0.2rem 0.4rem' }}>🗑</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <BottomNav active="progress" />
    </div>
  );
}
