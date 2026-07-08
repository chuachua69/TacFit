import { useState } from 'react';
import { store } from '../store/profile';

// Epley Formula for 1RM estimation: Weight * (1 + 0.0333 * Reps)
// For exactly 8 reps: Weight * (1 + 0.0333 * 8) = Weight * 1.2664
const estimate1RM = (weight8rm) => Math.round(weight8rm * 1.2664);

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
        programStartDate: new Date().toISOString(),
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
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--accent)' }}>Tactical Fitness</h2>
          <p style={{ color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: '2rem' }}>
            Welcome to TacFit. This is a 6-week mission to build undeniable strength, stamina, and grit.
            <br/><br/>
            The calendar is strict and doesn't wait for anyone. If you miss a day, the clock keeps ticking—so show up, put in the work, and let's get you ready for test day!
          </p>
          <button className="btn btn-primary" onClick={handleNext}>Initialize Profile</button>
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

          <button className="btn btn-primary" onClick={handleNext}>
            Calculate & Start Program
          </button>
        </div>
      )}
    </div>
  );
}
