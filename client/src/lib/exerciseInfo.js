/**
 * Form cues + target muscles, matched by movement keyword so every swap
 * variant (Goblet Squat, Pendlay Row, Pike Push-ups…) resolves to guidance.
 */
const GROUPS = [
  {
    keys: ['squat', 'split squat', 'leg press'],
    muscles: ['Quads', 'Glutes', 'Core'],
    cues: ['Brace your core, chest tall', 'Break at hips and knees together', 'Knees track over toes', 'Drive through mid-foot to stand'],
  },
  {
    keys: ['deadlift', 'good morning'],
    muscles: ['Hamstrings', 'Glutes', 'Back'],
    cues: ['Bar over mid-foot, shoulders just ahead', 'Flat back, brace before you pull', 'Push the floor away, hips & chest rise together', 'Lock out with glutes — don’t lean back'],
  },
  {
    keys: ['hip thrust'],
    muscles: ['Glutes', 'Hamstrings'],
    cues: ['Upper back on bench, chin tucked', 'Drive through heels', 'Squeeze glutes hard at the top', 'Ribs down — don’t arch the lower back'],
  },
  {
    keys: ['overhead press', 'shoulder press', 'push press', 'arnold', 'pike', 'ohp'],
    muscles: ['Shoulders', 'Triceps', 'Core'],
    cues: ['Grip just outside shoulders, elbows under bar', 'Brace glutes & core, ribs down', 'Press up and slightly back', 'Finish with biceps by ears, bar over mid-foot'],
  },
  {
    keys: ['bench', 'push-up', 'pushup', 'dip'],
    muscles: ['Chest', 'Triceps', 'Front delts'],
    cues: ['Shoulder blades pinched & down', 'Lower to lower-chest with control', 'Elbows ~45°, not flared', 'Drive feet, press the bar back over shoulders'],
  },
  {
    keys: ['row', 'pulldown'],
    muscles: ['Lats', 'Mid-back', 'Biceps'],
    cues: ['Hinge ~45°, flat back', 'Pull to lower ribs, lead with elbows', 'Squeeze shoulder blades together', 'Control the lowering — no jerking'],
  },
  {
    keys: ['pull-up', 'pullup', 'chin'],
    muscles: ['Lats', 'Biceps', 'Grip'],
    cues: ['Start from a full dead hang', 'Pull elbows down to your ribs', 'Chin clears the bar', 'Lower under control to full extension'],
  },
  {
    keys: ['plank', 'hollow', 'dead bug', 'leg raise', 'side plank'],
    muscles: ['Core', 'Abs'],
    cues: ['Ribs down, posterior pelvic tilt', 'Squeeze glutes & brace abs', 'Straight line head-to-heels', 'Breathe steadily — don’t sag or pike'],
  },
  {
    keys: ['lunge', 'step-up'],
    muscles: ['Quads', 'Glutes', 'Balance'],
    cues: ['Torso tall, core braced', 'Step into a ~90° front knee', 'Drive through the front heel', 'Control each step — no knee cave'],
  },
  {
    keys: ['carry'],
    muscles: ['Grip', 'Core', 'Traps'],
    cues: ['Stand tall, shoulders packed', 'Brace core, ribs down', 'Short, quick, even steps', 'Don’t lean — resist the load pulling you'],
  },
  {
    keys: ['clean', 'hip to overhead', 'jerk', 'press'],
    muscles: ['Full body', 'Power'],
    cues: ['Explosive hip drive off the hips', 'Pull yourself under, catch in a quarter squat', 'Brace, then drive overhead to lockout', 'Reset each rep — power from the hips, not the arms'],
  },
  {
    keys: ['shuttle', 'sprint'],
    muscles: ['Legs', 'Conditioning'],
    cues: ['Stay low into and out of turns', 'Plant, decelerate, explode back', 'Drive arms, short ground contacts', 'Pace round 1 — leave gas for round 4'],
  },
];

export function infoFor(name) {
  if (!name) return null;
  const lc = name.toLowerCase();
  const g = GROUPS.find(grp => grp.keys.some(k => lc.includes(k)));
  if (!g) return { muscles: ['Full body'], cues: ['Move with control through a full range', 'Brace your core', 'Keep tension on the target muscle', 'Stop 1–2 reps short of failure on working sets'] };
  return { muscles: g.muscles, cues: g.cues };
}
