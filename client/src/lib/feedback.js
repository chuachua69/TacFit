/**
 * Low-latency sensory feedback — Web Audio (no asset files) + Vibration API.
 * All calls degrade gracefully when audio/haptics are unavailable or muted.
 */

let ctx = null;
let muted = false;

export function setMuted(v) { muted = !!v; }
export function isMuted() { return muted; }

function getCtx() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** Must be called from a user gesture once to unlock audio on iOS/Safari. */
export function unlockAudio() {
  const c = getCtx();
  if (c && c.state === 'suspended') c.resume();
}

function beep(freq, dur, vol, type = 'sine', delay = 0) {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t0 = c.currentTime + delay;
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(c.destination);
  o.start(t0); o.stop(t0 + dur);
}

function vibrate(pattern) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch { /* no-op */ }
}

// ── Public feedback events ───────────────────────────────────────────────

/** Crisp click + light tap on every rep increment. */
export function fxCount() {
  beep(660, 0.03, 0.05, 'square');
  vibrate(18);
}

/** Soft downward blip when decrementing. */
export function fxUncount() {
  beep(420, 0.03, 0.04, 'square');
  vibrate(12);
}

/** Rising chime + double pulse when crossing a baseline into bonus territory. */
export function fxAchievement() {
  [784, 1046.5, 1568].forEach((f, i) => beep(f, 0.18, 0.12, 'triangle', i * 0.09));
  vibrate([40, 50, 120]);
}

/** Sharp tick for the final seconds of a countdown. */
export function fxCountdownTick() {
  beep(1100, 0.06, 0.09, 'square');
  vibrate(15);
}

/** Timer finished — three-note flourish + double pulse. */
export function fxTimerDone() {
  [880, 1174.7, 1568].forEach((f, i) => beep(f, 0.22, 0.14, 'triangle', i * 0.13));
  vibrate([90, 60, 180]);
}

/** Round transition (work↔rest) — single mid tone + tap. */
export function fxPhaseChange(work) {
  beep(work ? 988 : 587, 0.16, 0.12, 'sine');
  vibrate(work ? [60, 40, 60] : 50);
}
