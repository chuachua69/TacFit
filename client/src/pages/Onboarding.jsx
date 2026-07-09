import { useState } from 'react';
import { store } from '../store/profile';

// Epley Formula for 1RM estimation: Weight * (1 + 0.0333 * Reps)
// For exactly 8 reps: Weight * (1 + 0.0333 * 8) = Weight * 1.2664
const estimate1RM = (weight8rm) => Math.round(weight8rm * 1.2664);

// yyyy-mm-dd for a Date, in local time (so <input type="date"> round-trips).
const toDateInput = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
// The next upcoming Monday (or today if it's already Monday).
export const nextMonday = (from = new Date()) => {
  const d = new Date(from);
  const delta = (8 - d.getDay()) % 7; // Sun=0→1, Mon=1→0, Tue=2→6 ...
  d.setDate(d.getDate() + delta);
  return d;
};

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState('1RM'); // '1RM' or '8RM'
  const [lifts, setLifts] = useState({
    squat: '',
    deadlift: '',
    bench: '',
    press: ''
  });

  const handleNext = () => {
    if (step === 0) setStep(1);
    else {
      // Save stats
      const parse = (val) => parseFloat(val) || 0;
      const calculate = (val) => mode === '8RM' ? estimate1RM(parse(val)) : parse(val);

      store.setProfile({
        setupComplete: true,
        programStartDate: null,
        oneRMs: {
          squat: calculate(lifts.squat),
          deadlift: calculate(lifts.deadlift),
          bench: calculate(lifts.bench),
          press: calculate(lifts.press)
        }
      });
      onComplete();
    }
  };

  return (
    <div className="screen" style={{ justifyContent: 'center' }}>
      {step === 0 ? (
        <div style={{ textAlign: 'left', maxWidth: 460, margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--accent)', textAlign: 'center' }}>Welcome to TacFit</h2>
          <p style={{ color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: '1rem' }}>
            This isn't a countdown waiting for you to fail, and it's not a random pile of brutal workouts. Think of TacFit as your dedicated trainer — a structured, intentional system built to grow real strength, tactical stamina, and genuine grit.
          </p>
          <p style={{ color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            You run a continuous <strong style={{ color: 'var(--text)' }}>6-week periodization cycle</strong>. Instead of just working hard, you work <em>smart</em> — structured phases that push your limits without breaking you down.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.5rem' }}>
            {[
              ['The 6-Week Block', 'Progressive phases that build strength, capacity, and recovery.'],
              ['Test Day', 'At the end of each block you face the benchmark — just the numbers, no hiding.'],
              ['The Cycle', 'We take your new benchmarks, recalibrate the weights, and start the next block.'],
            ].map(([title, body]) => (
              <div key={title} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 900 }}>›</span>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text)' }}>{title}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{body}</div>
                </div>
              </div>
            ))}
          </div>

          <p style={{ color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: '2rem', textAlign: 'center' }}>
            Train, test, adapt, restart — retesting every 6 weeks until you're bloody strong. Grab your gear. Let's get to work.
          </p>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleNext}>Initialize Profile</button>
        </div>
      ) : (
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', textAlign: 'center' }}>Enter Your Lifts</h2>
          <p style={{ color: 'var(--text-dim)', textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem' }}>
            We'll use these to auto-generate your daily training weights.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'var(--bg-elevated)', padding: '0.5rem', borderRadius: 'var(--radius)' }}>
            <button 
              style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius)', background: mode === '1RM' ? 'var(--accent)' : 'transparent', color: mode === '1RM' ? '#000' : 'var(--text)' }}
              onClick={() => setMode('1RM')}
            >
              1 Rep Max
            </button>
            <button 
              style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius)', background: mode === '8RM' ? 'var(--accent)' : 'transparent', color: mode === '8RM' ? '#000' : 'var(--text)' }}
              onClick={() => setMode('8RM')}
            >
              8 Rep Max
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <div className="label">Back Squat ({mode}) (kg)</div>
              <input type="number" value={lifts.squat} onChange={e => setLifts({...lifts, squat: e.target.value})} placeholder="e.g. 140" />
            </div>
            <div>
              <div className="label">Deadlift ({mode}) (kg)</div>
              <input type="number" value={lifts.deadlift} onChange={e => setLifts({...lifts, deadlift: e.target.value})} placeholder="e.g. 160" />
            </div>
            <div>
              <div className="label">Bench Press ({mode}) (kg)</div>
              <input type="number" value={lifts.bench} onChange={e => setLifts({...lifts, bench: e.target.value})} placeholder="e.g. 100" />
            </div>
            <div>
              <div className="label">Overhead Press ({mode}) (kg)</div>
              <input type="number" value={lifts.press} onChange={e => setLifts({...lifts, press: e.target.value})} placeholder="e.g. 65" />
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={handleNext}>
            Calculate & Complete Setup
          </button>
        </div>
      )}
    </div>
  );
}
