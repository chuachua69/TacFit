import { useState } from 'react';
import BottomNav from '../components/BottomNav';
import TierBadge from '../components/TierBadge';
import { store } from '../store/profile';
import { EVENTS, TIERS } from '../lib/scoring';

export default function History() {
  const [attempts, setAttempts] = useState(() => store.getAttempts().slice().reverse());

  const remove = (id) => { store.removeAttempt(id); setAttempts(store.getAttempts().slice().reverse()); };

  const best = attempts.reduce((m, a) => (a.allMet && a.totalBonus > (m?.totalBonus ?? -1) ? a : m), null);

  return (
    <div className="screen" style={{ paddingTop: '1.25rem', paddingBottom: '6rem', gap: '1rem' }}>
      <div>
        <div style={{ fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.02em', color: 'var(--accent)' }}>HISTORY</div>
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Saved attempts & progress</div>
      </div>

      {best && (
        <div className="card" style={{ border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Best passing score</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent)', lineHeight: 1 }}>{best.totalBonus}</div>
          </div>
          <TierBadge tier={TIERS.find(t => t.key === best.tier.key)} big />
        </div>
      )}

      {attempts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 1rem' }}>
          No attempts saved yet.<br />Score the blueprint and tap <strong>Save Attempt</strong>.
        </div>
      ) : attempts.map(a => (
        <div key={a.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: a.allMet ? 'var(--accent)' : 'var(--danger)' }}>{a.totalBonus}</span>
                <TierBadge tier={a.allMet ? TIERS.find(t => t.key === a.tier.key) : { label: 'Failed', color: 'var(--danger)', icon: '⚠️' }} />
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {new Date(a.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                {' · '}{new Date(a.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <button onClick={() => remove(a.id)} aria-label="Delete"
              style={{ color: 'var(--text-muted)', fontSize: '1.1rem', padding: '0.25rem 0.5rem' }}>🗑</button>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {EVENTS.map(ev => (
              <span key={ev.key} style={{
                fontSize: '0.68rem', fontWeight: 600, padding: '2px 7px', borderRadius: 6,
                background: 'var(--bg-elevated)', color: 'var(--text-dim)',
              }}>
                {ev.short} {a.values[ev.key] ?? 0}
              </span>
            ))}
          </div>
        </div>
      ))}

      <BottomNav active="history" />
    </div>
  );
}
