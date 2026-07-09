/**
 * Recovery & anti-overtraining engine.
 *
 * Pure functions: (history events, now) → verdicts + human warnings.
 * No storage, no network — so it runs identically for guests and signed-in
 * users, is trivially testable, and can move server-side untouched.
 *
 * Business rules
 *  R1  48-Hour Major Muscle: if a primary body part accumulates fatigue > 3
 *      within a 24h window, it is blocked as a PRIMARY target for 48h
 *      (measured from the last contributing set).
 *  R2  High-Fatigue Overlap: an exercise with fatigue_score >= 4 blocks its
 *      primary AND secondary body parts from any COMPOUND work for 48h.
 *  R3  Rolling Cumulative Fatigue Cap: if a calendar day's summed fatigue
 *      exceeds 7, the next local calendar day is capped to exercises with
 *      individual fatigue_score <= 2.
 *
 * Design defaults (documented so they're deliberate, not accidental):
 *  - Timestamps are ISO/UTC in storage; windows are evaluated in device-local
 *    time (calendar-day boundaries = local midnight).
 *  - "24-48 hours" in the R2 spec is resolved to a fixed 48h.
 *  - Hard windows over exponential decay for v1: easier for users to reason
 *    about ("safe after Fri 6 PM"). The per-event structure below supports
 *    swapping in a decay function (fatigue × 0.5^(hours/24)) later without
 *    touching callers.
 *
 * @typedef {import('./exerciseCatalog').Exercise} Exercise
 *
 * @typedef {Object} HistoryEvent   One completed exercise occurrence.
 * @property {string} name          Exercise display name (for warnings).
 * @property {string} performedAt   ISO timestamp.
 * @property {number} fatigue       fatigue_score at time of logging.
 * @property {string} primary       Primary body part.
 * @property {string[]} secondaries Secondary body parts.
 * @property {string} movement      'Compound' | 'Isolation'.
 *
 * @typedef {Object} Verdict
 * @property {boolean} allowed      False = flagged by at least one rule.
 * @property {{rule: string, warning: string, safeAfter: string}[]} warnings
 */

import { findExercise } from './exerciseCatalog';

const HOUR = 3600 * 1000;
const R1_WINDOW_H = 24, R1_BLOCK_H = 48, R1_THRESHOLD = 3;
const R2_MIN_FATIGUE = 4, R2_BLOCK_H = 48;
const R3_DAY_CAP = 7, R3_MAX_NEXT_DAY_FATIGUE = 2;

const fmtWhen = (date) =>
  date.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' });

/** Local calendar-day key (yyyy-mm-dd) for a timestamp. */
function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Convert the app's completed WOD logs into engine history events.
 * Only sessions with status 'done' count; exercises that don't match the
 * catalog (stretches, rest rows) are ignored.
 * @param {Array} wodLogs store.getWodLogs()
 * @returns {HistoryEvent[]}
 */
export function historyFromWodLogs(wodLogs) {
  const events = [];
  for (const log of wodLogs || []) {
    if ((log.status || 'done') !== 'done' || !log.date) continue;
    for (const exLog of log.exercises || []) {
      const ex = findExercise(exLog.name);
      if (!ex) continue;
      events.push({
        name: ex.name,
        performedAt: log.date,
        fatigue: ex.fatigue_score,
        primary: ex.primary_body_part,
        secondaries: ex.secondary_body_parts,
        movement: ex.movement_category,
      });
    }
  }
  return events;
}

/**
 * Compute per-body-part block state from history.
 * @param {HistoryEvent[]} history
 * @param {Date} [now]
 * @returns {Object<string, {primaryBlockedUntil: Date|null, compoundBlockedUntil: Date|null, blockedBy: string, load24h: number}>}
 */
export function muscleStatus(history, now = new Date()) {
  const t = now.getTime();
  const status = {};
  const get = (part) => (status[part] ||= {
    primaryBlockedUntil: null, compoundBlockedUntil: null, blockedBy: '', load24h: 0,
  });

  // R1 — accumulate primary-part fatigue in the trailing 24h window.
  for (const ev of history) {
    const ts = new Date(ev.performedAt).getTime();
    if (t - ts <= R1_WINDOW_H * HOUR && ts <= t) {
      const s = get(ev.primary);
      s.load24h += ev.fatigue;
      if (s.load24h > R1_THRESHOLD) {
        const until = new Date(ts + R1_BLOCK_H * HOUR);
        if (!s.primaryBlockedUntil || until > s.primaryBlockedUntil) {
          s.primaryBlockedUntil = until;
          s.blockedBy = s.blockedBy || ev.name;
        }
      }
    }
  }

  // R2 — heavy (>=4) exercises block primary + secondaries from compounds.
  for (const ev of history) {
    if (ev.fatigue < R2_MIN_FATIGUE) continue;
    const ts = new Date(ev.performedAt).getTime();
    const until = new Date(ts + R2_BLOCK_H * HOUR);
    if (until.getTime() <= t) continue;
    for (const part of [ev.primary, ...(ev.secondaries || [])]) {
      const s = get(part);
      if (!s.compoundBlockedUntil || until > s.compoundBlockedUntil) {
        s.compoundBlockedUntil = until;
        s.blockedBy = ev.name;
      }
    }
  }

  return status;
}

/**
 * R3 — is `now`'s calendar day capped because yesterday exceeded the
 * cumulative fatigue budget?
 * @param {HistoryEvent[]} history
 * @param {Date} [now]
 * @returns {{capped: boolean, yesterdayTotal: number, maxFatigue: number|null, warning: string|null}}
 */
export function dayCap(history, now = new Date()) {
  const yesterday = new Date(now.getTime() - 24 * HOUR);
  const yKey = dayKey(yesterday);
  const yesterdayTotal = history
    .filter(ev => dayKey(ev.performedAt) === yKey)
    .reduce((sum, ev) => sum + ev.fatigue, 0);

  if (yesterdayTotal > R3_DAY_CAP) {
    return {
      capped: true, yesterdayTotal, maxFatigue: R3_MAX_NEXT_DAY_FATIGUE,
      warning: `Yesterday's total fatigue hit ${yesterdayTotal}/${R3_DAY_CAP} — today is a recovery-cap day. Stick to light work (fatigue ≤ ${R3_MAX_NEXT_DAY_FATIGUE}): isolation, core, or easy cardio.`,
    };
  }
  return { capped: false, yesterdayTotal, maxFatigue: null, warning: null };
}

/**
 * Evaluate ONE exercise against history. Warn, never silently block —
 * callers decide whether to gate or just banner it.
 * @param {Exercise} ex
 * @param {HistoryEvent[]} history
 * @param {Date} [now]
 * @returns {Verdict}
 */
export function evaluateExercise(ex, history, now = new Date()) {
  const warnings = [];
  const status = muscleStatus(history, now);
  const s = status[ex.primary_body_part];

  // R1 — primary target still recovering.
  if (s?.primaryBlockedUntil && s.primaryBlockedUntil > now) {
    warnings.push({
      rule: 'R1',
      safeAfter: s.primaryBlockedUntil.toISOString(),
      warning: `${ex.primary_body_part} is still recovering from ${s.blockedBy} — heavy ${ex.primary_body_part.toLowerCase()} work is safe after ${fmtWhen(s.primaryBlockedUntil)}.`,
    });
  }

  // R2 — compound movement touching a blocked muscle.
  if (ex.movement_category === 'Compound') {
    for (const part of [ex.primary_body_part, ...ex.secondary_body_parts]) {
      const ps = status[part];
      if (ps?.compoundBlockedUntil && ps.compoundBlockedUntil > now) {
        warnings.push({
          rule: 'R2',
          safeAfter: ps.compoundBlockedUntil.toISOString(),
          warning: `${ex.name} loads your ${part.toLowerCase()}, which ${ps.blockedBy} hit hard — compounds there are safe after ${fmtWhen(ps.compoundBlockedUntil)}.`,
        });
        break; // one R2 warning per exercise is enough signal
      }
    }
  }

  // R3 — recovery-cap day restricts anything above light work.
  const cap = dayCap(history, now);
  if (cap.capped && ex.fatigue_score > cap.maxFatigue) {
    warnings.push({
      rule: 'R3',
      safeAfter: new Date(new Date(now).setHours(24, 0, 0, 0)).toISOString(),
      warning: `${ex.name} (fatigue ${ex.fatigue_score}) exceeds today's recovery cap. ${cap.warning}`,
    });
  }

  return { allowed: warnings.length === 0, warnings };
}

/**
 * Evaluate a whole proposed session (array of exercise names).
 * @param {string[]} names
 * @param {HistoryEvent[]} history
 * @param {Date} [now]
 * @returns {{safe: boolean, flagged: {name: string, verdict: Verdict}[]}}
 */
export function evaluateSession(names, history, now = new Date()) {
  const flagged = [];
  for (const name of names) {
    const ex = findExercise(name);
    if (!ex) continue;
    const verdict = evaluateExercise(ex, history, now);
    if (!verdict.allowed) flagged.push({ name: ex.name, verdict });
  }
  return { safe: flagged.length === 0, flagged };
}

/**
 * "What CAN I do today?" — partition the catalog into allowed vs flagged.
 * @param {Exercise[]} catalog
 * @param {HistoryEvent[]} history
 * @param {Date} [now]
 */
export function safeExercises(catalog, history, now = new Date()) {
  const allowed = [], flagged = [];
  for (const ex of catalog) {
    const verdict = evaluateExercise(ex, history, now);
    (verdict.allowed ? allowed : flagged).push({ exercise: ex, verdict });
  }
  return { allowed, flagged };
}
