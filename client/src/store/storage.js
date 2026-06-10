const KEYS = {
  PROFILE: 'tacfit_profile',
  PLAN: 'tacfit_plan',
  LOGS: 'tacfit_logs',
  WELLNESS: 'tacfit_wellness',
};

export const storage = {
  getProfile: () => JSON.parse(localStorage.getItem(KEYS.PROFILE) || 'null'),
  setProfile: (data) => localStorage.setItem(KEYS.PROFILE, JSON.stringify(data)),

  getPlan: () => JSON.parse(localStorage.getItem(KEYS.PLAN) || 'null'),
  setPlan: (data) => localStorage.setItem(KEYS.PLAN, JSON.stringify(data)),

  getLogs: () => JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]'),
  addLog: (log) => {
    const logs = storage.getLogs();
    const idx = logs.findIndex(l => l.sessionId === log.sessionId);
    if (idx >= 0) logs[idx] = log;
    else logs.push(log);
    localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
  },

  getWellness: () => JSON.parse(localStorage.getItem(KEYS.WELLNESS) || '[]'),
  addWellness: (entry) => {
    const all = storage.getWellness();
    const idx = all.findIndex(w => w.date === entry.date);
    if (idx >= 0) all[idx] = entry;
    else all.push(entry);
    localStorage.setItem(KEYS.WELLNESS, JSON.stringify(all));
  },
  getTodayWellness: () => {
    const today = new Date().toISOString().split('T')[0];
    return storage.getWellness().find(w => w.date === today) || null;
  },

  clearAll: () => Object.values(KEYS).forEach(k => localStorage.removeItem(k)),
};
