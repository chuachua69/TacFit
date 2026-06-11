import { storage } from '../store/storage';
import BottomNav from '../components/BottomNav';
import RadarChart from '../components/RadarChart';
import Collapsible from '../components/Collapsible';
import { computeProfile } from '../lib/fitnessProfile';

const DISC_EMOJI = { run: '🏃', swim: '🏊', ruck: '🎒', gym: '🏋️' };
const DISC_COLOR = { run: 'var(--run)', swim: 'var(--swim)', ruck: 'var(--ruck)', gym: 'var(--gym)' };
const DISCIPLINES = ['gym', 'run', 'swim', 'ruck'];

// Epley estimated 1RM
const e1rm = (w, reps) => Math.round(w * (1 + reps / 30));

function Spark({ data, color = 'var(--accent)', w = 70, h = 22 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const rng = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / rng) * (h - 3) - 1.5}`).join(' ');
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function Stats() {
  const plan = storage.getPlan();
  const logs = storage.getLogs();

  if (!plan) {
    return (
      <div className="screen" style={{ paddingBottom: '5rem' }}>
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '3rem' }}>No plan yet.</div>
        <BottomNav active="stats" />
      </div>
    );
  }

  const allSessions = plan.weeks.flatMap(w => w.sessions);
  const doneLogs = logs.filter(l => l.status === 'done');
  const missedLogs = logs.filter(l => l.status && l.status !== 'done');
  const completion = allSessions.length > 0 ? doneLogs.length / allSessions.length : 0;
  const doneDays = new Set(doneLogs.map(l => l.completedAt?.split('T')[0]).filter(Boolean)).size;

  // Discipline stats
  const discStats = {};
  DISCIPLINES.forEach(d => {
    const sessions = allSessions.filter(s => s.discipline === d);
    const done = sessions.filter(s => logs.find(l => l.sessionId === s.id && l.status === 'done')).length;
    discStats[d] = { total: sessions.length, done };
  });

  const profile = storage.getProfile();
  const unit = profile?.unit || 'kg';
  const bw = Number(profile?.bodyweight) || 0;

  // Per-exercise estimated-1RM history from gym logs
  const exHist = {};
  doneLogs.filter(l => l.gymData).forEach(log => {
    const date = log.completedAt?.split('T')[0] || '';
    log.gymData.forEach(ex => {
      ex.sets?.filter(s => s.type === 'normal' && s.done && s.weight > 0 && s.reps > 0).forEach(s => {
        (exHist[ex.name] ||= []).push({ date, t: log.completedAt || date, e1rm: e1rm(s.weight, s.reps), weight: s.weight, reps: s.reps });
      });
    });
  });

  const strength = Object.entries(exHist).map(([name, arr]) => {
    const sorted = [...arr].sort((a, b) => String(a.t).localeCompare(String(b.t)));
    const best = arr.reduce((m, x) => (x.e1rm > m.e1rm ? x : m), arr[0]);
    const byDate = {};
    sorted.forEach(x => { byDate[x.date] = Math.max(byDate[x.date] || 0, x.e1rm); });
    const dates = Object.keys(byDate).sort();
    const series = dates.map(d => byDate[d]);
    const latestDate = dates[dates.length - 1];
    const isPR = series.length > 1 && byDate[latestDate] === Math.max(...series) && best.date === latestDate;
    return { name, best, series, isPR };
  }).sort((a, b) => b.best.e1rm - a.best.e1rm);

  const opTests = storage.getOperatorTests();

  // Fitness profile (radar)
  const fitness = computeProfile({ profile, logs, plan, operatorTests: opTests });
  const rated = fitness.axes.filter(a => a.value > 0).length;

  return (
    <div className="screen" style={{ paddingTop: '1.5rem', paddingBottom: '5rem', gap: '1.25rem' }}>
      <div style={{ fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.02em', color: 'var(--accent)' }}>
        STATS
      </div>

      {/* Overall */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontWeight: 700 }}>Plan Progress</span>
          <span style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--accent)' }}>
            {Math.round(completion * 100)}%
          </span>
        </div>
        <div style={{ height: 6, background: 'var(--border)', borderRadius: 999, overflow: 'hidden', marginBottom: '1rem' }}>
          <div style={{ width: `${completion * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: 999, transition: 'width 0.5s' }} />
        </div>
        <div style={{ display: 'flex', gap: '1.25rem' }}>
          {[
            { label: 'Done', value: doneLogs.length, color: 'var(--success)' },
            { label: 'Missed', value: missedLogs.length, color: 'var(--danger)' },
            { label: 'Left', value: allSessions.length - doneLogs.length - missedLogs.length, color: 'var(--text-muted)' },
            { label: 'Active Days', value: doneDays, color: 'var(--accent)' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div className="label">{label}</div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Fitness profile radar */}
      <Collapsible title="Fitness Profile" subtitle="Strength radar & overall rating" defaultOpen>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          {rated >= 3 ? (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>{fitness.overall}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>overall rating</span>
              </div>
              <RadarChart axes={fitness.axes} />
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
                Indicative scores from your baselines, bodyweight &amp; consistency.
              </div>
            </>
          ) : (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
              Add your bodyweight &amp; baselines in Settings to unlock your strength radar.
            </div>
          )}
        </div>
      </Collapsible>

      {/* Discipline breakdown */}
      <Collapsible title="By Discipline" subtitle="Completion per discipline">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DISCIPLINES.filter(d => discStats[d].total > 0).map(d => {
            const pct = discStats[d].total > 0 ? discStats[d].done / discStats[d].total : 0;
            return (
              <div key={d} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.4rem' }}>{DISC_EMOJI[d]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span className={`tag tag-${d}`}>{d}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {discStats[d].done}/{discStats[d].total}
                    </span>
                  </div>
                  <div style={{ height: 5, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${pct * 100}%`, height: '100%', background: DISC_COLOR[d], borderRadius: 999 }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Collapsible>

      {/* Strength — estimated 1RM with progression */}
      {strength.length > 0 && (
        <Collapsible title="Strength · est. 1RM" subtitle={bw > 0 ? `Bodyweight ${bw} ${unit}` : 'Per-lift bests & progression'}>
          <div style={{ padding: '0 0.25rem' }}>
            {strength.map((s, i) => (
              <div key={s.name} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
                padding: '0.7rem 0',
                borderBottom: i < strength.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {s.name}
                    {s.isPR && (
                      <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--success)', background: 'var(--success)20', borderRadius: 999, padding: '1px 6px' }}>
                        🏆 PR
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 1 }}>
                    from {s.best.weight}{unit} × {s.best.reps}
                    {bw > 0 ? ` · ${(s.best.e1rm / bw).toFixed(2)}× BW` : ''}
                  </div>
                </div>
                <Spark data={s.series} />
                <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '1rem', minWidth: 56, textAlign: 'right' }}>
                  {s.best.e1rm} {unit}
                </span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 6 }}>
            Estimated 1RM (Epley) from your logged working sets. 🏆 = set in your latest session.
          </div>
        </Collapsible>
      )}

      {/* After week 6 note */}
      <div style={{
        padding: '0.75rem 1rem',
        background: 'var(--accent)10',
        border: '1px solid var(--accent)30',
        borderRadius: 'var(--radius)',
        fontSize: '0.82rem',
        color: 'var(--text-muted)',
        lineHeight: 1.5,
      }}>
        🎯 After completing all 6 weeks, you'll do a baseline re-test to update your 1RMs and generate a fresh plan.
      </div>

      {/* Weekly summary */}
      <Collapsible title="By Week" subtitle="6-week phase progress">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {plan.weeks.map(week => {
            const done = week.sessions.filter(s => logs.find(l => l.sessionId === s.id && l.status === 'done')).length;
            const pct = week.sessions.length > 0 ? done / week.sessions.length : 0;
            return (
              <div key={week.week} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.75rem 1rem' }}>
                <div style={{ minWidth: 52 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Week {week.week}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{week.name}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 5, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct * 100}%`, height: '100%', borderRadius: 999,
                      background: pct >= 0.8 ? 'var(--success)' : pct > 0 ? 'var(--accent)' : 'var(--border)',
                      transition: 'width 0.4s',
                    }} />
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: 36, textAlign: 'right' }}>
                  {done}/{week.sessions.length}
                </div>
              </div>
            );
          })}
        </div>
      </Collapsible>

      <BottomNav active="stats" />
    </div>
  );
}
