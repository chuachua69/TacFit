import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../store/storage';
import { charStore, SESSION_XP } from '../store/character';
import BottomNav from '../components/BottomNav';
import { scheduleTestBlock } from '../lib/testBlock';
import { wodFor } from '../lib/wod';

const DISC_EMOJI = { run: '🏃', swim: '🏊', ruck: '🎒', gym: '🏋️', test: '🎯' };
const WOD_FILTERS = [
  [null, 'Daily'],
  ['gym', '🏋️'],
  ['run', '🏃'],
  ['swim', '🏊'],
  ['ruck', '🎒'],
];

const Card = ({ emoji, title, sub, detail, accent, onClick }) => (
  <button className="card" onClick={onClick}
    style={{ width: '100%', textAlign: 'left', cursor: 'pointer', border: `1px solid ${accent}55`, display: 'flex', flexDirection: 'column', gap: 6 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: '1.8rem' }}>{emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800 }}>{title}</div>
        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{sub}</div>
      </div>
      <span style={{ fontSize: '1.2rem', color: accent }}>→</span>
    </div>
    {detail && <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>{detail}</div>}
  </button>
);

export default function TestHub() {
  const navigate = useNavigate();
  const plan = storage.getPlan();
  const logs = storage.getLogs();
  const opTests = storage.getOperatorTests();
  const lastOp = opTests[opTests.length - 1];
  const [scheduledMsg, setScheduledMsg] = useState('');
  const [wodFilter, setWodFilter] = useState(null);
  const [, setRefresh] = useState(0);

  const today = new Date().toISOString().split('T')[0];
  const todaySessions = (plan?.weeks.flatMap(w => w.sessions) || []).filter(s => s.date === today);

  const wod = wodFor(today, wodFilter);
  const wodLogId = wod ? `wod-${today}-${wod.id}` : null;
  const wodDone = wodLogId && logs.some(l => l.sessionId === wodLogId && l.status === 'done');

  const completeWod = () => {
    storage.addLog({
      sessionId: wodLogId,
      status: 'done',
      completedAt: new Date().toISOString(),
      wodId: wod.id,
      discipline: wod.discipline,
    });
    charStore.addXP(wod.discipline);
    setRefresh(r => r + 1);
  };

  const schedule = (kind) => {
    if (!plan) return;
    const newPlan = scheduleTestBlock(plan, kind);
    // Test days reuse positional IDs (w{week}t{i}) in the final week, so a
    // re-schedule would inherit the previous block's completion logs. Clear the
    // final week's logs + any operator draft so the new block starts fresh.
    const lastWeek = newPlan.weeks[newPlan.weeks.length - 1];
    lastWeek.sessions.forEach(s => storage.removeLog(s.id));
    storage.clearOperatorDraft();
    storage.setPlan(newPlan);
    setScheduledMsg(`${kind === 'operator' ? 'Operator' : 'Baseline'} test block scheduled into your final week (taper + grouped test days).`);
  };

  return (
    <div className="screen" style={{ paddingTop: '1.5rem', paddingBottom: '5rem', gap: '1.25rem' }}>
      <div>
        <div style={{ fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.02em', color: 'var(--accent)' }}>WORKOUT</div>
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Train · assess · calibrate</div>
      </div>

      {/* Today's planned sessions */}
      <div>
        <div className="label">Today's Plan</div>
        {todaySessions.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {todaySessions.map(s => {
              const isDone = logs.some(l => l.sessionId === s.id && l.status === 'done');
              return (
                <button key={s.id} className="card"
                  style={{ width: '100%', textAlign: 'left', cursor: 'pointer', padding: '0.75rem 1rem', border: `1px solid ${isDone ? 'var(--success)40' : 'var(--accent)40'}` }}
                  onClick={() => navigate(`/session/${s.id}`)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.3rem' }}>{DISC_EMOJI[s.discipline]}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{s.workout?.label || s.workout?.focus || 'Session'}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.slot === 'am' ? '🌅 Morning' : '🌙 Evening'} · Week {s.week}</div>
                    </div>
                    <span style={{ fontSize: '1.2rem', color: isDone ? 'var(--success)' : 'var(--accent)' }}>{isDone ? '✓' : '→'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem', fontSize: '0.85rem' }}>
            Rest day — nothing scheduled. 💤
          </div>
        )}
      </div>

      {/* Workout of the day */}
      <div>
        <div className="label">Workout of the Day</div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {WOD_FILTERS.map(([val, label]) => (
              <button key={String(val)} onClick={() => setWodFilter(val)}
                style={{
                  flex: 1, padding: '0.35rem 0', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700,
                  background: wodFilter === val ? 'var(--accent)20' : 'var(--bg-elevated)',
                  border: `1px solid ${wodFilter === val ? 'var(--accent)' : 'var(--border)'}`,
                  color: wodFilter === val ? 'var(--accent)' : 'var(--text-muted)',
                }}>
                {label}
              </button>
            ))}
          </div>

          {wod && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.6rem' }}>{DISC_EMOJI[wod.discipline]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800 }}>{wod.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{wod.format} · ~{wod.minutes} min</div>
                </div>
                <span className={`tag tag-${wod.discipline}`}>{wod.discipline}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {wod.items.map((item, i) => {
                  // Strip rep counts/loads so the YouTube search is just the movement
                  const movement = item.split(' ').filter(w => !/\d/.test(w) && w !== '×').join(' ').trim();
                  const linkable = wod.discipline === 'gym' && /^\d/.test(item) && movement.length > 2;
                  return (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--accent)', fontWeight: 800, fontSize: '0.7rem' }}>{i + 1}</span>
                      <span style={{ color: 'var(--text-dim)', flex: 1 }}>{item}</span>
                      {linkable && (
                        <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(movement + ' exercise form')}`}
                          target="_blank" rel="noopener noreferrer"
                          aria-label={`Watch ${movement} demo on YouTube`}
                          style={{ fontSize: '0.72rem', color: 'var(--danger)', textDecoration: 'none', fontWeight: 800 }}>
                          ▶
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
              {wodDone ? (
                <div style={{ textAlign: 'center', color: 'var(--success)', fontWeight: 700, fontSize: '0.9rem', padding: '0.4rem' }}>
                  ✓ Completed — +{SESSION_XP[wod.discipline] || 20} XP
                </div>
              ) : (
                <button className="btn btn-primary" onClick={completeWod}>
                  Complete · +{SESSION_XP[wod.discipline] || 20} XP
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Assessments */}
      <div>
        <div className="label">Assessments</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Card
            emoji="🎯"
            title="Operator Assessment"
            sub="5-event scored test · tier"
            accent="var(--accent)"
            detail={lastOp ? `Last: ${lastOp.totalBonus.toFixed(1)} pts · ${lastOp.tierLabel}` : 'Not attempted yet'}
            onClick={() => navigate('/operator')}
          />
          <Card
            emoji="📏"
            title="Baseline Test"
            sub="Re-measure strength & cardio"
            accent="var(--run)"
            detail="Updates your training loads and regenerates the plan."
            onClick={() => navigate('/baseline')}
          />
        </div>
      </div>

      {/* Schedule a tapered block */}
      <div>
        <div className="label">Schedule a Test Block</div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Events can't all be maxed in one day. This replaces your final <strong>Deload week</strong>{' '}
            with <strong>2 taper days + grouped test days</strong> so each score is fresh. Test-day
            cards link straight to logging.
          </div>
          {scheduledMsg ? (
            <div style={{ fontSize: '0.82rem', color: 'var(--success)', fontWeight: 600 }}>
              ✓ {scheduledMsg}
              <button className="btn btn-secondary" style={{ marginTop: 10 }} onClick={() => navigate('/overview')}>
                View in Plan →
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => schedule('operator')}>🎯 Operator block</button>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => schedule('baseline')}>📏 Baseline block</button>
            </div>
          )}
        </div>
      </div>

      <BottomNav active="test" />
    </div>
  );
}
