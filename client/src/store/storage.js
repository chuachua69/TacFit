const KEYS = {
  PROFILE: 'tacfit_profile',
  PLAN: 'tacfit_plan',
  LOGS: 'tacfit_logs',
  WELLNESS: 'tacfit_wellness',
  OPERATOR: 'tacfit_operator',
  OPDRAFT: 'tacfit_operator_draft',
};

export const storage = {
  getProfile: () => JSON.parse(localStorage.getItem(KEYS.PROFILE) || 'null'),
  setProfile: (data) => localStorage.setItem(KEYS.PROFILE, JSON.stringify(data)),

  getPlan: () => JSON.parse(localStorage.getItem(KEYS.PLAN) || 'null'),
  setPlan: (data) => localStorage.setItem(KEYS.PLAN, JSON.stringify(data)),

  getLogs: () => JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]'),
  removeLog: (sessionId) => {
    const logs = storage.getLogs().filter(l => l.sessionId !== sessionId);
    localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
  },
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

  // Operator assessment attempts (most recent last)
  getOperatorTests: () => JSON.parse(localStorage.getItem(KEYS.OPERATOR) || '[]'),
  addOperatorTest: (test) => {
    const all = storage.getOperatorTests();
    all.push(test);
    localStorage.setItem(KEYS.OPERATOR, JSON.stringify(all));
  },

  // In-progress operator attempt, accumulated across multi-day test blocks
  getOperatorDraft: () => JSON.parse(localStorage.getItem(KEYS.OPDRAFT) || 'null'),
  setOperatorDraft: (d) => localStorage.setItem(KEYS.OPDRAFT, JSON.stringify(d)),
  clearOperatorDraft: () => localStorage.removeItem(KEYS.OPDRAFT),

  clearAll: () => Object.values(KEYS).forEach(k => localStorage.removeItem(k)),
};
