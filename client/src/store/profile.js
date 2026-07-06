/**
 * Local persistence — user profile (bodyweight, prescribed loads, prefs) and
 * saved test attempts. All on-device via localStorage.
 */
const KEYS = {
  PROFILE: 'tac5_profile',
  ATTEMPTS: 'tac5_attempts',
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
};
