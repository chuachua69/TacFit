import { useState } from 'react';
import BottomNav from '../components/BottomNav';
import TierBadge from '../components/TierBadge';
import { store } from '../store/profile';
import { EVENTS, TIERS } from '../lib/scoring';

const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

const TYPE_LABEL = { lift: 'Strength', conditioning: 'Conditioning', run: 'Run', mobility: 'Mobility' };

// What skipping each session type costs, and how to make it up.
const SKIP_INFO = {
  lift: {
    area: 'Strength',
    impact: 'Your lifts will get weak. You need raw strength for the test.',
    remedy: 'Do a heavy workout this week to catch up.',
  },
  conditioning: {
    area: 'Work capacity',
    impact: 'You will run out of gas fast. Conditioning disappears quickly if you don\'t use it.',
    remedy: 'Do some sprints or an EMOM workout this week.',
  },
  run: {
    area: 'Aerobic base',
    impact: 'You will get tired between events without a strong heart.',
    remedy: 'Go for an easy jog on your rest day.',
  },
  mobility: {
    area: 'Recovery',
    impact: 'You will get stiff and risk getting hurt.',
    remedy: 'Do a quick 10-minute stretch.',
  },
};

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

  // WOD completion vs skips
  const completedWod = wodLogs.filter(w => (w.status || 'done') === 'done');
  const skippedWod = wodLogs.filter(w => w.status === 'skipped');
  const skipByType = {};
  skippedWod.forEach(w => { skipByType[w.type] = (skipByType[w.type] || 0) + 1; });
  const dominantType = Object.entries(skipByType).sort((a, b) => b[1] - a[1])[0]?.[0];
  const totalLogged = completedWod.length + skippedWod.length;
  const skipRate = totalLogged ? skippedWod.length / totalLogged : 0;
  const skipInfo = SKIP_INFO[dominantType] || SKIP_INFO.lift;

  // 6-week cycle status
  const profile = store.getProfile();
  const startDate = profile.programStartDate ? new Date(profile.programStartDate) : null;
  const daysIn = startDate ? Math.max(0, Math.floor((Date.now() - startDate.getTime()) / 86400000)) : 0;
  const currentWeek = startDate ? Math.min(6, Math.floor(daysIn / 7) + 1) : 1;
  const cyclePct = startDate ? Math.min(100, Math.round((daysIn / 42) * 100)) : 0;
  const testDue = startDate && daysIn >= 42;

  return (
    <div className="screen" style={{ paddingTop: '1.25rem', paddingBottom: '6rem', gap: '1rem' }}>
      <div id="tour-progress">
        <div style={{ fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.02em', color: 'var(--accent)' }}>PROGRESS</div>
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Assessments · events · training</div>
      </div>

      {/* 6-week cycle status */}
      {startDate && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <div style={{ fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>6-week cycle</div>
              <div style={{ fontWeight: 700 }}>Started {fmtDate(profile.programStartDate)}</div>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent)', lineHeight: 1 }}>
              Wk {currentWeek}<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/6</span>
            </div>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${cyclePct}%`, background: 'var(--accent)', borderRadius: 999, transition: 'width .3s' }} />
          </div>
          <div style={{ fontSize: '0.72rem', fontWeight: testDue ? 700 : 400, color: testDue ? 'var(--accent)' : 'var(--text-muted)' }}>
            {testDue
              ? '✓ 6 weeks done — retest on the Test tab, then recalibrate your lifts.'
              : `${42 - daysIn} days until test day.`}
          </div>
        </div>
      )}

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

      {/* WOD activity — completed vs skipped */}
      <div>
        <div className="label">Training</div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--success)', lineHeight: 1 }}>{completedWod.length}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>completed</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: skippedWod.length ? 'var(--warn)' : 'var(--text-muted)', lineHeight: 1 }}>{skippedWod.length}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>skipped</div>
          </div>
          {totalLogged > 0 && (
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: skipRate > 0.3 ? 'var(--warn)' : 'var(--success)' }}>
                {Math.round((1 - skipRate) * 100)}%
              </div>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>consistency</div>
            </div>
          )}
        </div>
      </div>

      {/* Skip analysis — impact + remedy */}
      {skippedWod.length > 0 && (
        <div className="card" style={{ border: '1px solid var(--warn)55', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontWeight: 800, color: 'var(--warn)' }}>⚠️ {skippedWod.length} session{skippedWod.length === 1 ? '' : 's'} skipped</span>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--warn)' }}>mostly {skipInfo.area}</span>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.entries(skipByType).sort((a, b) => b[1] - a[1]).map(([t, n]) => (
              <span key={t} style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--bg-elevated)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
                {TYPE_LABEL[t] || t} · {n}
              </span>
            ))}
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
            <span style={{ color: 'var(--warn)', fontWeight: 700 }}>Impact — </span>{skipInfo.impact}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
            <span style={{ color: 'var(--success)', fontWeight: 700 }}>Remedy — </span>{skipInfo.remedy}
          </div>

          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: skipRate > 0.3 ? 'var(--warn)' : 'var(--text-muted)', background: 'var(--bg-elevated)', borderRadius: 8, padding: '0.6rem 0.85rem' }}>
            {skipRate > 0.3
              ? `You missed ${Math.round(skipRate * 100)}% of your workouts. You need to do 1-2 make-up sessions or skip the optional PM workouts so you don't burn out.`
              : 'A few missed workouts are fine. Just make sure to do your heavy lifts before test week.'}
          </div>
        </div>
      )}

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
