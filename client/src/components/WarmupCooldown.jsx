import { useState } from 'react';
import EventTimer from './EventTimer';

const PLANS = {
  gymLower: {
    warmup: { mins: 6, items: ['3 min easy cardio (bike / row / skip)', 'Hip circles & leg swings ×10 / side', 'Ankle rocks ×10 / side', 'Bodyweight squats ×15 → goblet squats ×10', '2 ramp-up sets on the main lift'] },
    cooldown: { mins: 4, items: ['Couch / hip-flexor stretch ×30s / side', 'Hamstring stretch ×30s / side', 'Glute & piriformis stretch ×30s', 'Calf stretch ×30s'] },
  },
  gymUpper: {
    warmup: { mins: 6, items: ['3 min easy cardio / row', 'Band pull-aparts ×20', 'Shoulder dislocates / pass-throughs ×10', 'Scap push-ups & arm circles ×10', '2 ramp-up sets on the main lift'] },
    cooldown: { mins: 3, items: ['Doorway chest stretch ×30s / side', 'Tricep & lat stretch ×30s / side', 'Cross-body shoulder stretch ×30s', 'Neck & trap release'] },
  },
  gym: {
    warmup: { mins: 5, items: ['3 min easy cardio', 'Leg swings ×10 / side', 'Band pull-aparts & arm circles ×15', '2 ramp-up sets on your first lift'] },
    cooldown: { mins: 3, items: ['Hip-flexor stretch ×30s / side', 'Chest & shoulder stretch ×30s', 'Lat stretch ×30s', 'Slow nasal breathing'] },
  },
  run: {
    warmup: { mins: 5, items: ['3 min easy jog', 'High knees & butt kicks ×20m', 'Leg swings ×10 / side', '2–3 × 20m strides'] },
    cooldown: { mins: 5, items: ['3 min easy jog into a walk', 'Calf & hamstring stretch ×30s', 'Quad & hip-flexor stretch ×30s', 'Walk until HR settles'] },
  },
  swim: {
    warmup: { mins: 4, items: ['200m easy mixed strokes', 'Shoulder circles & band ×15', '2 × 25m build to pace'] },
    cooldown: { mins: 3, items: ['100m easy swim', 'Shoulder & lat stretch ×30s', 'Slow breathing'] },
  },
  ruck: {
    warmup: { mins: 5, items: ['3 min brisk unloaded walk', 'Leg swings & ankle circles', 'Shoulder rolls with pack on', 'Build to target pace'] },
    cooldown: { mins: 4, items: ['3 min easy walk, pack off', 'Calf & hamstring stretch ×30s', 'Shoulder & trap stretch ×30s'] },
  },
};

function planKey(discipline, workout) {
  if (discipline === 'gym') {
    const focus = (workout?.focus || '').toLowerCase();
    const names = (workout?.exercises || []).map(e => (e.name || '').toLowerCase()).join(' ');
    if (focus.includes('lower') || /squat|deadlift|lunge|hip thrust/.test(names)) return 'gymLower';
    if (focus.includes('upper') || /bench|press|pull|row|dip/.test(names)) return 'gymUpper';
    return 'gym';
  }
  return discipline;
}

export default function WarmupCooldown({ discipline, workout, phase }) {
  const key = planKey(discipline, workout);
  const plan = (PLANS[key] || PLANS.gym)[phase];
  const [open, setOpen] = useState(phase === 'warmup');
  const [timer, setTimer] = useState(false);
  if (!plan) return null;

  const isWarm = phase === 'warmup';
  const title = isWarm ? 'Warm-up' : 'Cool-down';
  const accent = isWarm ? 'var(--warn)' : 'var(--run)';

  return (
    <div className="card" style={{ border: `1px solid ${accent}33`, padding: '0.85rem 1rem' }}>
      {timer && (
        <EventTimer
          label={`${title} · ${plan.mins} min`}
          phases={[{ name: title, seconds: plan.mins * 60 }]}
          onClose={() => setTimer(false)}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <button onClick={() => setOpen(o => !o)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', flex: 1, textAlign: 'left' }}>
          <span style={{ fontSize: '1.1rem' }}>{isWarm ? '🔥' : '🧊'}</span>
          <span style={{ fontWeight: 700 }}>{title}</span>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{plan.mins} min</span>
          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.8rem', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
        </button>
        <button onClick={() => setTimer(true)}
          style={{ padding: '0.35rem 0.7rem', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, color: accent, background: `${accent}1a`, border: `1px solid ${accent}55` }}>
          ▶ {plan.mins}m
        </button>
      </div>

      {open && (
        <ul style={{ margin: '0.75rem 0 0', paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {plan.items.map((it, i) => (
            <li key={i} style={{ fontSize: '0.83rem', color: 'var(--text-dim)', lineHeight: 1.35 }}>{it}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
