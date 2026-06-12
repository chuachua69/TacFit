import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../store/storage';
import { generatePlan } from '../lib/planEngine';
import { getBarOptions } from '../lib/plateCalc';
import { TimePicker, NumberWheel, fmtTime } from '../components/WheelPicker';
import FileImport from '../components/FileImport';
import { defaultRanking } from '../lib/focus';

// Convert an imported activity into the baseline value for a given field
function deriveBaseline(key, r) {
  if (key === 'run2400')  return Math.round(r.paceSecPerKm * 2.4); // 2.4km @ avg pace
  if (key === 'swim400')  return Math.round(r.paceSecPerKm * 0.4); // 400m @ avg pace
  if (key === 'ruckPace') return Math.round(r.paceSecPerKm);        // sec/km
  return r.durationS;
}

const STEPS = ['basics', 'schedule', 'baselines-lift', 'baselines-cardio', 'review'];
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };

const DEFAULT_SCHEDULE = {
  mon: { am: true, pm: true },
  tue: { am: true, pm: true },
  wed: { am: true, pm: true },
  thu: { am: true, pm: true },
  fri: { am: true, pm: true },
  sat: { am: true, pm: true },
  sun: { am: false, pm: false },
};

// Four core disciplines (Strength, Run, Swim, Ruck). The two "program" modes
// blend them; the four "single" modes emphasise one. The Operator *test* has 5
// scored events — that's an assessment, not a 5th discipline.
const FOCUSES = [
  { value: 'balanced', label: 'Balanced', desc: 'Strength, Run, Swim & Ruck — equal emphasis', group: 'program' },
  { value: 'operator', label: 'Operator Prep', desc: 'Strength + conditioning for the 5-event operator test', group: 'program' },
  { value: 'gym',  label: 'Strength', desc: 'Build maximal power & muscle', group: 'single' },
  { value: 'run',  label: 'Run',  desc: 'Improve 2.4km / run endurance', group: 'single' },
  { value: 'swim', label: 'Swim', desc: 'Water endurance', group: 'single' },
  { value: 'ruck', label: 'Ruck', desc: 'Loaded march capacity', group: 'single' },
];

const FOCUS_GROUPS = [
  ['program', 'Programs', 'Blend the four disciplines'],
  ['single', 'Single-discipline focus', 'Emphasise one pillar'],
];

function StepDots({ current }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: '1.5rem' }}>
      {STEPS.map((s, i) => (
        <div key={s} style={{
          width: i === current ? 20 : 6, height: 6,
          borderRadius: 999,
          background: i <= current ? 'var(--accent)' : 'var(--border)',
          transition: 'all 0.2s',
        }} />
      ))}
    </div>
  );
}

function timeToSeconds(str) {
  const parts = str.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + (parts[1] || 0);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0);
  return 0;
}

function countSessions(schedule) {
  return DAYS.reduce((n, d) => n + (schedule[d].am ? 1 : 0) + (schedule[d].pm ? 1 : 0), 0);
}

const INTRO = [
  {
    headline: 'Train like\nan operator.',
    body: 'TacFit is a periodised training program built for real-world fitness — not beach prep.',
    detail: null,
    items: [
      { emoji: '🏋️', label: 'Strength' },
      { emoji: '🏃', label: 'Run' },
      { emoji: '🏊', label: 'Swim' },
      { emoji: '🎒', label: 'Ruck' },
    ],
    itemNote: 'Four disciplines. One program.',
    cta: 'Continue',
  },
  {
    headline: '6 weeks.\n4 disciplines.',
    body: 'Auto-programmed blocks with progressive overload. Each cycle tapers into a test week so your scores actually move.',
    detail: null,
    items: [
      { emoji: '📈', label: 'Build (Weeks 1–4)' },
      { emoji: '⚡', label: 'Peak (Week 5)' },
      { emoji: '🎯', label: 'Test (Week 6)' },
    ],
    itemNote: 'Not random WODs. A plan that knows where you\'re going.',
    cta: 'Continue',
  },
  {
    headline: 'Before\nyou start.',
    body: 'You\'ll need access to the basics. No pool or track? Single-discipline modes let you focus on what you\'ve got.',
    detail: null,
    items: [
      { emoji: '🏗️', label: 'Barbell + weight plates' },
      { emoji: '🛣️', label: '2.4km run route or track' },
      { emoji: '🏊', label: 'Pool (400m)' },
      { emoji: '🎒', label: 'Weighted pack — 20kg+' },
    ],
    itemNote: null,
    cta: 'Set Up My Plan →',
  },
];

function IntroDots({ current }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: '2rem' }}>
      {INTRO.map((_, i) => (
        <div key={i} style={{
          width: i === current ? 20 : 6, height: 6,
          borderRadius: 999,
          background: i <= current ? 'var(--accent)' : 'var(--border)',
          transition: 'all 0.2s',
        }} />
      ))}
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [intro, setIntro] = useState(true);
  const [introStep, setIntroStep] = useState(0);
  const [step, setStep] = useState(0);
  const [rmMode, setRmMode] = useState('8rm'); // '1rm' | '8rm'
  const [form, setForm] = useState({
    name: '',
    unit: 'kg',
    barWeight: 20,
    bodyweight: '',
    height: '',
    age: '',
    sex: '',
    amTime: '07:00',
    pmTime: '18:00',
    focus: 'operator',
    schedule: DEFAULT_SCHEDULE,
    baselines: {
      squat: '',
      deadlift: '',
      bench: '',
      ohp: '',
      row: '',
      run2400: 720,  // seconds (12:00)
      swim400: 540,  // seconds (09:00)
      ruckPace: 480, // seconds/km (08:00)
      ruckLoad: 20,  // kg
    },
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setBaseline = (key, val) => setForm(f => ({ ...f, baselines: { ...f.baselines, [key]: val } }));
  const toggleSlot = (day, slot) => setForm(f => ({
    ...f,
    schedule: {
      ...f.schedule,
      [day]: { ...f.schedule[day], [slot]: !f.schedule[day][slot] },
    },
  }));

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));

  const finish = () => {
    // Convert to 1RM if input was 8RM (Brzycki: 1RM = 8RM / 0.80)
    const toOneRM = (val) => rmMode === '8rm' ? Math.round(Number(val) / 0.80) : Number(val);

    const profile = {
      name: form.name,
      unit: form.unit,
      barWeight: Number(form.barWeight),
      bodyweight: Number(form.bodyweight) || 0,
      height: Number(form.height) || 0,
      age: Number(form.age) || 0,
      sex: form.sex || '',
      amTime: form.amTime,
      pmTime: form.pmTime,
      focus: form.focus,
      focusRanking: defaultRanking(form.focus),
      schedule: form.schedule,
      sessionsPerWeek: countSessions(form.schedule),
      rmMode,
      baselines: {
        squat8rm: Number(form.baselines.squat),
        deadlift8rm: Number(form.baselines.deadlift),
        bench8rm: Number(form.baselines.bench),
        ohp8rm: Number(form.baselines.ohp),
        row8rm: Number(form.baselines.row),
        // 1RM equivalents for plan engine
        squat: toOneRM(form.baselines.squat),
        deadlift: toOneRM(form.baselines.deadlift),
        bench: toOneRM(form.baselines.bench),
        ohp: toOneRM(form.baselines.ohp),
        row: toOneRM(form.baselines.row),
        run2400s: form.baselines.run2400,
        swim400s: form.baselines.swim400,
        ruckPaceMinKm: form.baselines.ruckPace / 60,
        ruckLoadKg: Number(form.baselines.ruckLoad),
      },
    };
    storage.setProfile(profile);
    const plan = generatePlan(profile);
    storage.setPlan(plan);
    navigate('/dashboard');
  };

  const barOptions = getBarOptions(form.unit);
  const sessionCount = countSessions(form.schedule);

  if (intro) {
    const screen = INTRO[introStep];
    const isLast = introStep === INTRO.length - 1;
    const advance = () => isLast ? setIntro(false) : setIntroStep(i => i + 1);
    return (
      <div className="screen" style={{ paddingTop: '2.5rem', paddingBottom: '2.5rem' }}>
        <div style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--accent)', marginBottom: '2rem' }}>TACFIT</div>
        <IntroDots current={introStep} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em' }}>
            {screen.headline.split('\n').map((line, i) => (
              <span key={i}>{line}{i < screen.headline.split('\n').length - 1 && <br />}</span>
            ))}
          </div>
          <div style={{ fontSize: '1rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>{screen.body}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            {screen.items.map(item => (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '0.75rem 1rem',
              }}>
                <span style={{ fontSize: '1.4rem' }}>{item.emoji}</span>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.label}</span>
              </div>
            ))}
          </div>
          {screen.itemNote && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>{screen.itemNote}</div>
          )}
        </div>
        <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={advance}>
          {screen.cta}
        </button>
        {introStep > 0 && (
          <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => setIntroStep(i => i - 1)}>
            Back
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="screen" style={{ paddingTop: '2rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--accent)' }}>TACFIT</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>Operator Fitness Program</div>
      </div>

      <StepDots current={step} />

      {/* STEP 0: Basics */}
      {step === 0 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <div className="label">Your Name</div>
            <input placeholder="e.g. Cpl Smith" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>

          <div>
            <div className="label">Weight Unit</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['kg', 'lbs'].map(u => (
                <button key={u} className={`btn ${form.unit === u ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { set('unit', u); set('barWeight', u === 'kg' ? 20 : 45); }}>
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="label">Barbell Weight</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {barOptions.map(o => (
                <button key={o.value} className={`btn ${form.barWeight === o.value ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: '1 1 auto', minWidth: 100 }}
                  onClick={() => set('barWeight', o.value)}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="label">Body Metrics</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="number" inputMode="decimal" placeholder="Bodyweight"
                    value={form.bodyweight} onChange={e => set('bodyweight', e.target.value)} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{form.unit}</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="number" inputMode="numeric" placeholder="Height"
                    value={form.height} onChange={e => set('height', e.target.value)} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>cm</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input type="number" inputMode="numeric" placeholder="Age" style={{ flex: 1 }}
                value={form.age} onChange={e => set('age', e.target.value)} />
              <div style={{ flex: 2, display: 'flex', gap: 6 }}>
                {['M', 'F'].map(s => (
                  <button key={s} type="button"
                    className={`btn ${form.sex === s ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '0.6rem 0' }}
                    onClick={() => set('sex', s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
              Bodyweight powers relative-load targets (e.g. bench at bodyweight).
            </div>
          </div>

          <div>
            <div className="label">Training Focus</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: -2, marginBottom: 10, lineHeight: 1.5 }}>
              TacFit trains <strong>4 disciplines</strong> — Strength, Run, Swim &amp; Ruck. Pick a program that
              blends them, or focus a single one.
            </div>
            {FOCUS_GROUPS.map(([g, title, hint]) => (
              <div key={g} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '0 0 6px 2px' }}>
                  <span style={{ fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)' }}>{title}</span>
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>· {hint}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {FOCUSES.filter(f => f.group === g).map(f => (
                    <button key={f.value} onClick={() => set('focus', f.value)}
                      style={{
                        background: form.focus === f.value ? 'var(--accent)20' : 'var(--bg-card)',
                        border: `1px solid ${form.focus === f.value ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius)', padding: '0.75rem 1rem',
                        textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{f.label}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{f.desc}</div>
                      </div>
                      {form.focus === f.value && <span style={{ color: 'var(--accent)', fontSize: '1.2rem' }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn-primary" onClick={next} disabled={!form.name.trim()}>Continue</button>
        </div>
      )}

      {/* STEP 1: Schedule grid */}
      {step === 1 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>Weekly Schedule</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Tap to toggle AM / PM slots. All on by default — adjust to your availability.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 1fr', gap: 6, paddingBottom: 4 }}>
              <div />
              <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em' }}>MORNING</div>
              <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em' }}>EVENING</div>
            </div>

            {DAYS.map(day => {
              const { am, pm } = form.schedule[day];
              const isRest = !am && !pm;
              return (
                <div key={day} style={{ display: 'grid', gridTemplateColumns: '52px 1fr 1fr', gap: 6, alignItems: 'center' }}>
                  <div style={{
                    fontSize: '0.85rem', fontWeight: 700,
                    color: isRest ? 'var(--text-muted)' : 'var(--text)',
                  }}>
                    {DAY_LABELS[day]}
                    {isRest && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 400 }}>rest</div>}
                  </div>
                  {['am', 'pm'].map(slot => {
                    const active = form.schedule[day][slot];
                    return (
                      <button key={slot} onClick={() => toggleSlot(day, slot)}
                        style={{
                          padding: '0.6rem 0', borderRadius: 'var(--radius)',
                          background: active ? 'var(--accent)20' : 'var(--bg-elevated)',
                          border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                          color: active ? 'var(--accent)' : 'var(--text-muted)',
                          fontWeight: 700, fontSize: '0.8rem',
                          transition: 'all 0.15s',
                        }}>
                        {active ? '✓' : '–'}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="card" style={{ background: 'var(--bg-elevated)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--accent)' }}>{sessionCount} sessions/week</strong> · {sessionCount * 6} total over 6 weeks · ~{sessionCount * 1.5}h/week
            </div>
          </div>

          <div>
            <div className="label">Session Start Times</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>
              When your morning &amp; evening sessions usually start (used for calendar exports).
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div className="label">🌅 Morning</div>
                <input type="time" value={form.amTime} onChange={e => set('amTime', e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="label">🌙 Evening</div>
                <input type="time" value={form.pmTime} onChange={e => set('pmTime', e.target.value)} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
            <button className="btn btn-secondary" onClick={back}>Back</button>
            <button className="btn btn-primary" onClick={next} disabled={sessionCount === 0}>Continue</button>
          </div>
        </div>
      )}

      {/* STEP 2: Strength baselines */}
      {step === 2 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>Strength Baselines</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Enter your lifting baseline in {form.unit}.
            </div>
          </div>

          {/* 1RM / 8RM toggle */}
          <div>
            <div className="label">Input type</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className={`btn ${rmMode === '8rm' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setRmMode('8rm')} style={{ flex: 1 }}>
                8RM <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>(preferred)</span>
              </button>
              <button className={`btn ${rmMode === '1rm' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setRmMode('1rm')} style={{ flex: 1 }}>
                1RM
              </button>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
              {rmMode === '8rm'
                ? '8RM = the most weight you can lift for exactly 8 reps'
                : '1RM = your absolute single-rep max'}
            </div>
          </div>

          {[
            { key: 'squat', label: 'Back Squat' },
            { key: 'deadlift', label: 'Deadlift' },
            { key: 'bench', label: 'Bench Press' },
            { key: 'ohp', label: 'Overhead Press' },
            { key: 'row', label: 'Bent-over Row' },
          ].map(({ key, label }) => (
            <div key={key}>
              <div className="label">{label} {rmMode.toUpperCase()}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="number" inputMode="decimal" placeholder="0"
                  value={form.baselines[key]}
                  onChange={e => setBaseline(key, e.target.value)} />
                <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', minWidth: 30 }}>{form.unit}</span>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
            <button className="btn btn-secondary" onClick={back}>Back</button>
            <button className="btn btn-primary" onClick={next}>Continue</button>
          </div>
        </div>
      )}

      {/* STEP 3: Cardio baselines */}
      {step === 3 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>Cardio Baselines</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Scroll the wheels or tap ▲ ▼ to set each time.
            </div>
          </div>

          {[
            { key: 'run2400',  label: '2.4km Run Time',     maxMin: 30, imp: 'Import run (GPX/TCX)',  variant: undefined },
            { key: 'swim400',  label: '400m Swim Time',     maxMin: 25, imp: 'Import swim (GPX/TCX)', variant: 'swim' },
            { key: 'ruckPace', label: 'Ruck Pace (min/km)', maxMin: 20, imp: 'Import ruck (GPX/TCX)', variant: undefined },
          ].map(({ key, label, maxMin, imp, variant }) => (
            <div key={key} className="card" style={{ padding: '0.75rem 1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="label" style={{ marginBottom: 0 }}>{label}</div>
                <div style={{ fontWeight: 800, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>
                  {fmtTime(form.baselines[key])}
                </div>
              </div>
              <TimePicker
                seconds={form.baselines[key]}
                onChange={v => setBaseline(key, v)}
                maxMin={maxMin}
              />
              <div style={{ marginTop: 8 }}>
                <FileImport
                  label={imp}
                  variant={variant}
                  hint="Auto-fills from your Strava/watch file’s average pace"
                  onParsed={r => setBaseline(key, deriveBaseline(key, r))}
                />
              </div>
            </div>
          ))}

          <div className="card" style={{ padding: '0.75rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div className="label" style={{ marginBottom: 0 }}>Ruck Load</div>
              <div style={{ fontWeight: 800, color: 'var(--accent)' }}>
                {form.baselines.ruckLoad} {form.unit}
              </div>
            </div>
            <NumberWheel
              value={Number(form.baselines.ruckLoad)}
              onChange={v => setBaseline('ruckLoad', v)}
              from={0} to={60} step={form.unit === 'kg' ? 2.5 : 5}
              unit={form.unit}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
            <button className="btn btn-secondary" onClick={back}>Back</button>
            <button className="btn btn-primary" onClick={next}>Review Plan</button>
          </div>
        </div>
      )}

      {/* STEP 4: Review */}
      {step === 4 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>Ready to build your plan</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Review your setup before we generate your 6-week block.</div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                ['Name', form.name],
                ['Focus', FOCUSES.find(f => f.value === form.focus)?.label],
                ['Sessions/week', `${sessionCount} × 1.5h`],
                ['Unit', form.unit],
                ['Bar weight', `${form.barWeight}${form.unit}`],
                ['Input mode', rmMode.toUpperCase()],
                [`Squat ${rmMode.toUpperCase()}`, `${form.baselines.squat} ${form.unit}`],
                [`Deadlift ${rmMode.toUpperCase()}`, `${form.baselines.deadlift} ${form.unit}`],
                [`Bench ${rmMode.toUpperCase()}`, `${form.baselines.bench} ${form.unit}`],
                [`OHP ${rmMode.toUpperCase()}`, `${form.baselines.ohp} ${form.unit}`],
                [`Row ${rmMode.toUpperCase()}`, `${form.baselines.row} ${form.unit}`],
                ['2.4km run', fmtTime(form.baselines.run2400)],
                ['400m swim', fmtTime(form.baselines.swim400)],
                ['Ruck pace', `${fmtTime(form.baselines.ruckPace)}/km @ ${form.baselines.ruckLoad}${form.unit}`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
            <button className="btn btn-secondary" onClick={back}>Back</button>
            <button className="btn btn-primary" onClick={finish}>Generate Plan</button>
          </div>
        </div>
      )}
    </div>
  );
}
