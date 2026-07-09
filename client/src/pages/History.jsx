import { useMemo } from 'react';
import BottomNav from '../components/BottomNav';
import PageHeader from '../components/PageHeader';
import { store } from '../store/profile';

const fmt = (iso) => new Date(iso).toLocaleString(undefined, {
  day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
});

const KIND_STYLE = {
  wod:     { icon: '💪', label: 'Session' },
  skipped: { icon: '⏭️', label: 'Skipped' },
  event:   { icon: '🎯', label: 'Event' },
  attempt: { icon: '🏁', label: 'Full Assessment' },
};

/** Unified, newest-first log of everything: WOD sessions, events, attempts. */
export default function History() {
  const entries = useMemo(() => {
    const out = [];
    for (const w of store.getWodLogs()) {
      out.push({
        kind: w.status === 'skipped' ? 'skipped' : 'wod',
        date: w.date,
        title: w.title || 'Session',
        detail: [w.dayLabel, w.slot?.toUpperCase(), w.doneCount != null ? `${w.doneCount}/${w.totalSets} sets` : null]
          .filter(Boolean).join(' · '),
      });
    }
    for (const e of store.getEventLogs()) {
      out.push({
        kind: 'event', date: e.date, title: e.name,
        detail: `${e.value}${e.met ? ' · baseline met' : ''}${e.bonus ? ` · +${e.bonus}` : ''}`,
      });
    }
    for (const a of store.getAttempts()) {
      out.push({
        kind: 'attempt', date: a.date, title: 'Full Assessment',
        detail: a.allMet ? `${a.totalBonus} bonus · ${a.tier?.label || ''}` : 'Baseline missed',
      });
    }
    return out.filter(e => e.date).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, []);

  return (
    <div className="screen" style={{ paddingTop: '1.25rem', paddingBottom: '6rem', gap: '1rem' }}>
      <PageHeader title="HISTORY" subtitle="Everything you've logged, newest first" />

      {entries.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Nothing logged yet — run a WOD session or a test.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {entries.map((e, i) => {
            const k = KIND_STYLE[e.kind];
            return (
              <div key={i} className="card" style={{ padding: '0.7rem 0.9rem', display: 'flex', alignItems: 'center', gap: 12, opacity: e.kind === 'skipped' ? 0.65 : 1 }}>
                <span style={{ fontSize: '1.2rem' }}>{k.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{e.title}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{k.label}{e.detail ? ` · ${e.detail}` : ''}</div>
                </div>
                <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', flexShrink: 0 }}>{fmt(e.date)}</div>
              </div>
            );
          })}
        </div>
      )}

      <BottomNav active="" />
    </div>
  );
}
