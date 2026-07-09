import { useEffect, useMemo, useState } from 'react';
import BottomNav from '../components/BottomNav';
import PageHeader from '../components/PageHeader';
import {
  BODY_PARTS, MOVEMENT_CATEGORIES, EQUIPMENT,
  getCatalog, removeLocalCustomExercise,
} from '../lib/exerciseCatalog';
import { historyFromWodLogs, muscleStatus, dayCap, evaluateExercise } from '../lib/recovery';
import { createCustomExercise, fetchCloudCustomExercises } from '../lib/exerciseDb';
import { store } from '../store/profile';

const fmtUntil = (d) => d.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' });

const EMPTY_FORM = {
  name: '', primary_body_part: 'Chest', secondary_body_parts: [],
  movement_category: 'Compound', equipment: 'Barbell',
  fatigue_score: 3, required_rest_hours: 48,
};

export default function Exercises() {
  const [, bump] = useState(0);
  const refresh = () => bump(n => n + 1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  // Pull any custom exercises created on other devices (best-effort).
  useEffect(() => { fetchCloudCustomExercises().then(refresh); }, []);

  const catalog = getCatalog();
  const history = useMemo(() => historyFromWodLogs(store.getWodLogs()), []);
  const now = new Date();
  const status = muscleStatus(history, now);
  const cap = dayCap(history, now);

  const grouped = useMemo(() => {
    const g = {};
    for (const part of BODY_PARTS) g[part] = [];
    for (const ex of catalog) g[ex.primary_body_part]?.push(ex);
    return g;
  }, [catalog]);

  const submit = async () => {
    setFormError('');
    const res = await createCustomExercise(form);
    if (!res.ok) { setFormError(res.error); return; }
    setForm(EMPTY_FORM);
    setShowForm(false);
    refresh();
  };

  const toggleSecondary = (part) => setForm(f => ({
    ...f,
    secondary_body_parts: f.secondary_body_parts.includes(part)
      ? f.secondary_body_parts.filter(p => p !== part)
      : [...f.secondary_body_parts, part],
  }));

  const selStyle = { width: '100%', padding: '0.55rem', background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' };

  return (
    <div className="screen" style={{ paddingTop: '1.25rem', paddingBottom: '6rem', gap: '1rem' }}>
      <PageHeader title="EXERCISES" subtitle="Catalog · recovery status · custom" />

      {/* Recovery-cap banner (Rule 3) */}
      {cap.capped && (
        <div className="card" style={{ border: '1px solid var(--danger)', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          ⚠️ {cap.warning}
        </div>
      )}

      {/* Muscle recovery board */}
      <div>
        <div className="label">Recovery status · right now</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {BODY_PARTS.map(part => {
            const s = status[part];
            const blockedPrimary = s?.primaryBlockedUntil > now;
            const blockedCompound = s?.compoundBlockedUntil > now;
            const blocked = blockedPrimary || blockedCompound;
            const until = blockedPrimary && blockedCompound
              ? new Date(Math.max(s.primaryBlockedUntil, s.compoundBlockedUntil))
              : (s?.primaryBlockedUntil > now ? s.primaryBlockedUntil : s?.compoundBlockedUntil);
            return (
              <span key={part} title={blocked ? `Recovering from ${s.blockedBy} — safe ${fmtUntil(until)}` : 'Ready to train'}
                style={{
                  padding: '0.35rem 0.7rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700,
                  background: blocked ? 'transparent' : 'var(--bg-elevated)',
                  border: `1px solid ${blocked ? 'var(--danger)' : 'var(--border)'}`,
                  color: blocked ? 'var(--danger)' : 'var(--text-dim)',
                }}>
                {blocked ? `🔻 ${part} · ${fmtUntil(until)}` : `✓ ${part}`}
              </span>
            );
          })}
        </div>
      </div>

      {/* Custom exercise builder */}
      <button className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'}`} onClick={() => setShowForm(v => !v)}>
        {showForm ? 'Cancel' : '＋ Add Custom Exercise'}
      </button>

      {showForm && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div>
            <div className="label">Name</div>
            <input value={form.name} placeholder="e.g. Landmine Press"
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={selStyle} />
          </div>
          <div>
            <div className="label">Primary body part</div>
            <select value={form.primary_body_part} style={selStyle}
              onChange={e => setForm(f => ({ ...f, primary_body_part: e.target.value }))}>
              {BODY_PARTS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <div className="label">Secondary body parts · tap to toggle</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {BODY_PARTS.filter(p => p !== form.primary_body_part).map(p => {
                const on = form.secondary_body_parts.includes(p);
                return (
                  <button key={p} onClick={() => toggleSecondary(p)}
                    style={{
                      padding: '0.3rem 0.65rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700,
                      background: on ? 'var(--accent)' : 'var(--bg-elevated)',
                      color: on ? '#000' : 'var(--text-muted)',
                      border: '1px solid var(--border)',
                    }}>
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div className="label">Movement</div>
              <select value={form.movement_category} style={selStyle}
                onChange={e => setForm(f => ({ ...f, movement_category: e.target.value }))}>
                {MOVEMENT_CATEGORIES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <div className="label">Equipment</div>
              <select value={form.equipment} style={selStyle}
                onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))}>
                {EQUIPMENT.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div className="label">Fatigue score · 1–5</div>
              <select value={form.fatigue_score} style={selStyle}
                onChange={e => setForm(f => ({ ...f, fatigue_score: Number(e.target.value) }))}>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} — {['trivial', 'light', 'moderate', 'heavy', 'max CNS'][n - 1]}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <div className="label">Rest hours</div>
              <select value={form.required_rest_hours} style={selStyle}
                onChange={e => setForm(f => ({ ...f, required_rest_hours: Number(e.target.value) }))}>
                {[24, 48, 72].map(h => <option key={h} value={h}>{h} h</option>)}
              </select>
            </div>
          </div>
          {formError && <div style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>{formError}</div>}
          <button className="btn btn-primary" onClick={submit}>Save Exercise</button>
        </div>
      )}

      {/* Catalog grouped by body part */}
      {BODY_PARTS.map(part => grouped[part].length > 0 && (
        <div key={part}>
          <div className="label">{part}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {grouped[part].map(ex => {
              const verdict = evaluateExercise(ex, history, now);
              return (
                <div key={ex.id} className="card"
                  style={{ padding: '0.7rem 0.9rem', display: 'flex', alignItems: 'center', gap: 10, border: verdict.allowed ? undefined : '1px solid var(--danger)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                      {ex.name} {ex.custom && <span style={{ fontSize: '0.62rem', color: 'var(--accent)' }}>CUSTOM</span>}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {ex.movement_category} · {ex.equipment}
                      {ex.secondary_body_parts.length > 0 && <> · also {ex.secondary_body_parts.join(', ')}</>}
                    </div>
                    {!verdict.allowed && (
                      <div style={{ fontSize: '0.68rem', color: 'var(--danger)', marginTop: 3 }}>
                        {verdict.warnings[0].warning}
                      </div>
                    )}
                  </div>
                  <span title={`Fatigue ${ex.fatigue_score}/5 · rest ${ex.required_rest_hours}h`}
                    style={{
                      fontSize: '0.68rem', fontWeight: 800, flexShrink: 0,
                      padding: '0.25rem 0.55rem', borderRadius: 999,
                      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                      color: ex.fatigue_score >= 4 ? 'var(--danger)' : ex.fatigue_score >= 3 ? 'var(--accent)' : 'var(--text-muted)',
                    }}>
                    F{ex.fatigue_score}
                  </span>
                  {ex.custom && (
                    <button onClick={() => { removeLocalCustomExercise(ex.id); refresh(); }}
                      aria-label={`Delete ${ex.name}`}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1rem', flexShrink: 0 }}>
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <BottomNav active="" />
    </div>
  );
}
