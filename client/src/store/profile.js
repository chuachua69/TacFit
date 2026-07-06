/**
 * Local persistence — user profile (bodyweight, prescribed loads, prefs) and
 * saved test attempts. All on-device via localStorage.
 */
const KEYS = {
  PROFILE: 'tac5_profile',
  ATTEMPTS: 'tac5_attempts',   // full 5-event assessment attempts
  EVENTS: 'tac5_events',       // single-event test logs
  WOD: 'tac5_wod',             // completed WOD sessions
};

export const DEFAULT_PROFILE = {
  bodyweight: 77,          // kg — bench load
  loadClass: 40,           // kg — 40/30/20 weight class for events 1 & 2
  externalLoad: 10,        // kg — plate carrier for pull-ups & shuttles
  unit: 'kg',
  muted: false,
};

export const store = {
  getProfile() {
    const saved = JSON.parse(localStorage.getItem(KEYS.PROFILE) || 'null');
    return { ...DEFAULT_PROFILE, ...(saved || {}) };
  },
  setProfile(p) {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify({ ...store.getProfile(), ...p }));
  },

  getAttempts() {
    return JSON.parse(localStorage.getItem(KEYS.ATTEMPTS) || '[]');
  },
  addAttempt(a) {
    const all = store.getAttempts();
    all.push({ ...a, id: Date.now(), date: new Date().toISOString() });
    localStorage.setItem(KEYS.ATTEMPTS, JSON.stringify(all));
    return all;
  },
  removeAttempt(id) {
    const all = store.getAttempts().filter(a => a.id !== id);
    localStorage.setItem(KEYS.ATTEMPTS, JSON.stringify(all));
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
    return all;
  },
  removeEventLog(id) {
    const all = store.getEventLogs().filter(a => a.id !== id);
    localStorage.setItem(KEYS.EVENTS, JSON.stringify(all));
    return all;
  },

  // Completed WOD sessions — keyed by logId so completion toggles are idempotent
  getWodLogs() {
    return JSON.parse(localStorage.getItem(KEYS.WOD) || '[]');
  },
  isWodDone(logId) {
    return store.getWodLogs().some(w => w.logId === logId);
  },
  toggleWod(entry) {
    const all = store.getWodLogs();
    const idx = all.findIndex(w => w.logId === entry.logId);
    if (idx >= 0) all.splice(idx, 1);
    else all.push({ ...entry, id: Date.now(), date: new Date().toISOString() });
    localStorage.setItem(KEYS.WOD, JSON.stringify(all));
    return all;
  },
};
