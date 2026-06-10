const KEY = 'tacfit_character';

const DEFAULTS = {
  xp: 0,
  level: 1,
  equipped: { head: null, face: null, body: null },
  owned: [],
};

// XP per session type
export const SESSION_XP = { gym: 30, run: 20, ruck: 25, swim: 20 };

// Level thresholds (xp needed for each level)
export const LEVEL_XP = [0, 0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200];

// Rank / qualification progression — each level is a promotion.
// `tab` = special qualification badge earned at that level (SAF-style).
export const RANKS = [
  null, // index 0 unused
  { title: 'Recruit',          tab: null,          badge: '▮',    color: '#8a8a8a' }, // Lv1
  { title: 'Private',          tab: null,          badge: '▮▮',   color: '#9a9a9a' }, // Lv2
  { title: 'Lance Corporal',   tab: 'Marksman',    badge: '◢',    color: '#b0925a' }, // Lv3
  { title: 'Corporal',         tab: 'Marksman',    badge: '◢◢',   color: '#c8a96e' }, // Lv4
  { title: 'Sergeant',         tab: 'Ranger',      badge: '★',    color: '#52c878' }, // Lv5
  { title: 'Staff Sergeant',   tab: 'Commando',    badge: '★★',   color: '#52a8e0' }, // Lv6
  { title: 'Master Sergeant',  tab: 'Diver',       badge: '★★★',  color: '#52c8c8' }, // Lv7
  { title: 'Warrant Officer',  tab: 'Pathfinder',  badge: '◆',    color: '#a852e0' }, // Lv8
  { title: 'Lieutenant',       tab: 'Operator',    badge: '◆◆',   color: '#e0a052' }, // Lv9
  { title: 'Captain',          tab: 'Elite Operator', badge: '◆◆◆', color: '#e0c052' }, // Lv10
];

export const rankFor = (level) => RANKS[Math.min(level, RANKS.length - 1)] || RANKS[1];

export const ITEMS = [
  // Head
  { id: 'beret_green',   slot: 'head', name: 'Green Beret',    unlockLevel: 1,  color: '#3d5a2a' },
  { id: 'helmet_mk6',    slot: 'head', name: 'MK6 Helmet',     unlockLevel: 3,  color: '#2a3520' },
  { id: 'boonie_hat',    slot: 'head', name: 'Boonie Hat',     unlockLevel: 5,  color: '#6b5a3a' },
  { id: 'ops_helmet',    slot: 'head', name: 'Ops-Core Helmet', unlockLevel: 7, color: '#1a2010' },
  // Face
  { id: 'visor_amber',   slot: 'face', name: 'Amber Visor',    unlockLevel: 1,  color: '#e07030' },
  { id: 'nvg',           slot: 'face', name: 'Night Vision',   unlockLevel: 4,  color: '#204020' },
  { id: 'balaclava',     slot: 'face', name: 'Balaclava',      unlockLevel: 6,  color: '#1a1a22' },
  // Body
  { id: 'vest_basic',    slot: 'body', name: 'Chest Rig',      unlockLevel: 1,  color: '#2d3540' },
  { id: 'vest_plate',    slot: 'body', name: 'Plate Carrier',  unlockLevel: 2,  color: '#252d38' },
  { id: 'vest_arid',     slot: 'body', name: 'Arid Carrier',   unlockLevel: 5,  color: '#7a6a45' },
  { id: 'vest_multicam', slot: 'body', name: 'Multicam Carrier',unlockLevel: 8, color: '#6b7a4a' },
];

export const charStore = {
  get: () => {
    const saved = localStorage.getItem(KEY);
    return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : { ...DEFAULTS, owned: ['beret_green', 'visor_amber', 'vest_basic'], equipped: { head: 'beret_green', face: null, body: 'vest_basic' } };
  },
  save: (data) => localStorage.setItem(KEY, JSON.stringify(data)),

  addXP: (discipline) => {
    const char = charStore.get();
    const xpGain = SESSION_XP[discipline] || 20;
    const fromLevel = char.level;
    // Seed the promotion baseline to the pre-XP level so the level-up is detected.
    if (localStorage.getItem('tacfit_seen_level') == null) {
      localStorage.setItem('tacfit_seen_level', String(fromLevel));
    }
    char.xp += xpGain;

    // Level up check
    while (char.level < LEVEL_XP.length - 1 && char.xp >= LEVEL_XP[char.level + 1]) {
      char.level += 1;
      // Unlock new items for this level
      ITEMS.filter(item => item.unlockLevel === char.level && !char.owned.includes(item.id))
        .forEach(item => char.owned.push(item.id));
    }

    charStore.save(char);
    return { char, xpGain, leveledUp: char.level > fromLevel, fromLevel, toLevel: char.level };
  },

  // Promotion detection (works regardless of where XP was earned).
  // Returns the new level if the player has leveled up since last seen, else null.
  pendingPromotion: () => {
    const char = charStore.get();
    const seen = Number(localStorage.getItem('tacfit_seen_level') || char.level);
    if (char.level > seen) return { fromLevel: seen, toLevel: char.level };
    return null;
  },
  markPromotionSeen: () => {
    const char = charStore.get();
    localStorage.setItem('tacfit_seen_level', String(char.level));
  },

  equip: (itemId) => {
    const char = charStore.get();
    const item = ITEMS.find(i => i.id === itemId);
    if (!item || !char.owned.includes(itemId)) return;
    // Toggle: unequip if already on
    if (char.equipped[item.slot] === itemId) {
      char.equipped[item.slot] = null;
    } else {
      char.equipped[item.slot] = itemId;
    }
    charStore.save(char);
  },

  levelProgress: (char) => {
    const current = LEVEL_XP[char.level] || 0;
    const next = LEVEL_XP[char.level + 1];
    if (!next) return 1;
    return (char.xp - current) / (next - current);
  },
};
