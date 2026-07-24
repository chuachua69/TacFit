/**
 * Regenerate the exercises seed block in schema.sql from the JS catalog —
 * single source of truth is SEED_EXERCISES in client/src/lib/exerciseCatalog.js.
 *
 * Usage:  node scripts/gen-seed.mjs
 * Then re-run schema.sql in the Supabase SQL editor (idempotent upsert).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const { SEED_EXERCISES } = await import(
  new URL(`file://${join(root, 'client/src/lib/exerciseCatalog.js').replace(/\\/g, '/')}`)
);

const q = (s) => String(s).replace(/'/g, "''");
const arr = (a) => `'{${(a || []).map(q).join(',')}}'`;

const rows = SEED_EXERCISES.map(e =>
  `  ('${q(e.id)}', '${q(e.name)}', '${e.primary_body_part}', ${arr(e.secondary_body_parts)}, ` +
  `'${e.movement_category}', '${e.equipment}', ${e.fatigue_score}, ${e.required_rest_hours})`
).join(',\n');

const block = `-- SEED:BEGIN — GENERATED from client/src/lib/exerciseCatalog.js by scripts/gen-seed.mjs. DO NOT EDIT BY HAND.
-- ${SEED_EXERCISES.length} exercises. Regenerate: node scripts/gen-seed.mjs
insert into public.exercises
  (slug, name, primary_body_part, secondary_body_parts, movement_category, equipment, fatigue_score, required_rest_hours)
values
${rows}
on conflict (slug) where owner is null
do update set
  name = excluded.name,
  primary_body_part = excluded.primary_body_part,
  secondary_body_parts = excluded.secondary_body_parts,
  movement_category = excluded.movement_category,
  equipment = excluded.equipment,
  fatigue_score = excluded.fatigue_score,
  required_rest_hours = excluded.required_rest_hours;
-- SEED:END`;

const schemaPath = join(root, 'schema.sql');
const sql = readFileSync(schemaPath, 'utf8');
const re = /-- SEED:BEGIN[\s\S]*?-- SEED:END/;
if (!re.test(sql)) {
  console.error('SEED markers not found in schema.sql'); process.exit(1);
}
writeFileSync(schemaPath, sql.replace(re, block));
console.log(`schema.sql seed regenerated: ${SEED_EXERCISES.length} exercises.`);
