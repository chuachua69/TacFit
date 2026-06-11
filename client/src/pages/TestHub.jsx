import { useNavigate } from 'react-router-dom';
import { storage } from '../store/storage';
import BottomNav from '../components/BottomNav';

export default function TestHub() {
  const navigate = useNavigate();
  const opTests = storage.getOperatorTests();
  const lastOp = opTests[opTests.length - 1];

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

      <div style={{
        padding: '0.75rem 1rem', background: 'var(--bg-elevated)',
        border: '1px solid var(--border)', borderRadius: 'var(--radius)',
        fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5,
      }}>
        💡 Tests have several events that can’t all be maxed in one day. You can log results
        on-demand now, or (coming next) auto-schedule a tapered multi-day test block for true scores.
      </div>

      <BottomNav active="test" />
    </div>
  );
}
