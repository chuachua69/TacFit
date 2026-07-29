/**
 * Local persistence — user profile (bodyweight, prescribed loads, prefs) and
 * saved test attempts. All on-device via localStorage.
 */
import { supabase } from '../lib/supabase';

const KEYS = {
  PROFILE: 'tac5_profile',
  ATTEMPTS: 'tac5_attempts',   // full 5-event assessment attempts
  EVENTS: 'tac5_events',       // single-event test logs
  WOD: 'tac5_wod',             // completed WOD sessions (detailed)
  EXMEM: 'tac5_exmem',         // last-used weight per exercise name
};

// Guest mode: the app is fully usable offline from localStorage, so signing in
// is only needed for cross-device sync. Unlike `dev_bypass` (dev builds only)
// this is honoured in production — it's what lets a first-time user, or a Play
// reviewer, reach the app without a Google account.
const GUEST_KEY = 'tac5_guest';

export const isGuest = () => !!localStorage.getItem(GUEST_KEY);
export const startGuestSession = () => localStorage.setItem(GUEST_KEY, '1');
export const endGuestSession = () => localStorage.removeItem(GUEST_KEY);

// Every localStorage key the app writes, in ONE place. Sign-out handlers use
// this so a new storage key can never silently leak across accounts again.
const ALL_LOCAL_KEYS = [...Object.values(KEYS), 'tac5_custom_exercises', 'dev_bypass', GUEST_KEY];

/** Wipe all app data on this device (used on sign-out). */
export function clearAllLocalData() {
  ALL_LOCAL_KEYS.forEach(k => localStorage.removeItem(k));
}

export const DEFAULT_PROFILE = {
  setupComplete: false,
  tutorialSeen: false,
  programStartDate: null,
  oneRMs: {
    squat: 0,
    deadlift: 0,
    bench: 0,
    press: 0
  },
  bodyweight: 77,          // kg — bench load
  loadClass: 40,           // kg — 40/30/20 weight class for events 1 & 2
  externalLoad: 10,        // kg — plate carrier for pull-ups & shuttles
  unit: 'kg',
  muted: false,
};

// Helper to push ALL app state to Supabase in the background
async function syncToSupabase() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  
  const fullState = {
    profile: JSON.parse(localStorage.getItem(KEYS.PROFILE) || 'null'),
    attempts: JSON.parse(localStorage.getItem(KEYS.ATTEMPTS) || '[]'),
    events: JSON.parse(localStorage.getItem(KEYS.EVENTS) || '[]'),
    wod: JSON.parse(localStorage.getItem(KEYS.WOD) || '[]'),
    exmem: JSON.parse(localStorage.getItem(KEYS.EXMEM) || '{}')
  };

  await supabase.from('profiles').upsert({
    id: session.user.id,
    data: fullState,
    updated_at: new Date().toISOString()
  });
}

export const store = {
  getProfile() {
    const saved = JSON.parse(localStorage.getItem(KEYS.PROFILE) || 'null');
    return { ...DEFAULT_PROFILE, ...(saved || {}) };
  },
  async fetchProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase.from('profiles').select('data').eq('id', session.user.id).single();
      if (data && data.data && data.data.profile) {
        // Restore full state from cloud
        if (data.data.profile) localStorage.setItem(KEYS.PROFILE, JSON.stringify(data.data.profile));
        if (data.data.attempts) localStorage.setItem(KEYS.ATTEMPTS, JSON.stringify(data.data.attempts));
        if (data.data.events) localStorage.setItem(KEYS.EVENTS, JSON.stringify(data.data.events));
        if (data.data.wod) localStorage.setItem(KEYS.WOD, JSON.stringify(data.data.wod));
        if (data.data.exmem) localStorage.setItem(KEYS.EXMEM, JSON.stringify(data.data.exmem));
        return data.data.profile;
      }
    }
    return this.getProfile();
  },
  setProfile(p) {
    const newProfile = { ...store.getProfile(), ...p };
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(newProfile));
    syncToSupabase();
  },

  getAttempts() {
    return JSON.parse(localStorage.getItem(KEYS.ATTEMPTS) || '[]');
  },
  addAttempt(a) {
    const all = store.getAttempts();
    all.push({ ...a, id: Date.now(), date: new Date().toISOString() });
    localStorage.setItem(KEYS.ATTEMPTS, JSON.stringify(all));
    syncToSupabase();
    return all;
  },
  removeAttempt(id) {
    const all = store.getAttempts().filter(a => a.id !== id);
    localStorage.setItem(KEYS.ATTEMPTS, JSON.stringify(all));
    syncToSupabase();
    return all;
  },

  // Single-event test logs (component training)
  getEventLogs() {
    return JSON.parse(localStorage.getItem(KEYS.EVENTS) || '[]');
  },
  addEventLog(log) {
    const all = store.getEventLogs();
    all.push({ ...log, id: Date.now(), date: new Date().toISOString() });
    localStorage.setItem(KEYS.EVENTS, JSON.stringify(all));
    syncToSupabase();
    return all;
  },
  removeEventLog(id) {
    const all = store.getEventLogs().filter(a => a.id !== id);
    localStorage.setItem(KEYS.EVENTS, JSON.stringify(all));
    syncToSupabase();
    return all;
  },

  // Completed WOD sessions — keyed by logId (idempotent upsert)
  getWodLogs() {
    return JSON.parse(localStorage.getItem(KEYS.WOD) || '[]');
  },
  getWodLog(logId) {
    return store.getWodLogs().find(w => w.logId === logId) || null;
  },
  // 'done' | 'skipped' | null. Legacy logs (no status) count as done.
  getWodStatus(logId) {
    const w = store.getWodLog(logId);
    return w ? (w.status || 'done') : null;
  },
  isWodDone(logId) {
    return store.getWodStatus(logId) === 'done';
  },
  isWodSkipped(logId) {
    return store.getWodStatus(logId) === 'skipped';
  },
  saveWodSession(entry) {
    const all = store.getWodLogs();
    const idx = all.findIndex(w => w.logId === entry.logId);
    // Preserve the original completion date on edits — restamping would shift
    // the session's fatigue timestamps and extend recovery windows.
    const date = (idx >= 0 && all[idx].date) || new Date().toISOString();
    const record = { status: 'done', ...entry, id: entry.id || Date.now(), date };
    if (idx >= 0) all[idx] = record;
    else all.push(record);
    localStorage.setItem(KEYS.WOD, JSON.stringify(all));
    syncToSupabase();
    return all;
  },
  skipWod(entry) {
    return store.saveWodSession({ ...entry, status: 'skipped' });
  },
  removeWod(logId) {
    const all = store.getWodLogs().filter(w => w.logId !== logId);
    localStorage.setItem(KEYS.WOD, JSON.stringify(all));
    syncToSupabase();
    return all;
  },

  // Per-exercise last-used weight memory (pre-fills the runner next time)
  getExMemory() {
    return JSON.parse(localStorage.getItem(KEYS.EXMEM) || '{}');
  },
  rememberWeights(map) {
    const mem = { ...store.getExMemory(), ...map };
    localStorage.setItem(KEYS.EXMEM, JSON.stringify(mem));
    syncToSupabase();
    return mem;
  },
  // Async ON PURPOSE: callers must `await` this before reloading the page.
  // The cloud upsert has to land first — otherwise fetchProfile pulls the old
  // row back on reload and the reset silently undoes itself.
  async resetAppButKeepLifts() {
    const current = store.getProfile();
    const resetProfile = {
      ...DEFAULT_PROFILE,
      setupComplete: true,
      oneRMs: { ...current.oneRMs },
      bodyweight: current.bodyweight,
      loadClass: current.loadClass,
      externalLoad: current.externalLoad,
      unit: current.unit,
    };
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(resetProfile));
    localStorage.removeItem(KEYS.ATTEMPTS);
    localStorage.removeItem(KEYS.EVENTS);
    localStorage.removeItem(KEYS.WOD);
    localStorage.removeItem(KEYS.EXMEM);
    await syncToSupabase();
  }
};
