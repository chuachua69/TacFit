import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../store/storage';
import BottomNav from '../components/BottomNav';
import { scheduleTestBlock } from '../lib/testBlock';

export default function TestHub() {
  const navigate = useNavigate();
  const opTests = storage.getOperatorTests();
  const lastOp = opTests[opTests.length - 1];
  const [scheduledMsg, setScheduledMsg] = useState('');

  const schedule = (kind) => {
    const plan = storage.getPlan();
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

  return (
    <div className="screen" style={{ paddingTop: '1.5rem', paddingBottom: '5rem', gap: '1.25rem' }}>
      <div>
        <div style={{ fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.02em', color: 'var(--accent)' }}>TEST</div>
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Assess & calibrate</div>
      </div>

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

      {/* Schedule a tapered block */}
      <div>
        <div className="label">Schedule a Test Block</div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Events can’t all be maxed in one day. This replaces your final <strong>Deload week</strong>
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
