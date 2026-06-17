/**
 * Genera supabase/migrations/20260616120100_seed_packing_catalog.sql
 * da dati strutturati in packingAiSeedSource.ts (nessun eval).
 *
 * Eseguire: npx tsx scripts/generate-packing-seed.ts
 */
import fs from 'fs';
import { TAG_ITEM_MAP, UNIVERSAL_DEFAULTS } from '../src/domain/packing/packingAiSeedSource';
import type { PackingStandardItemTier } from '../src/types/packingCatalog';

interface StandardSeedRow {
  category: string;
  name: string;
  tier: PackingStandardItemTier;
  sort_order: number;
}

const extras: Array<[string, string, PackingStandardItemTier, number]> = [
  ['Igiene', 'Spazzolino', 'core', 100],
  ['Igiene', 'Dentifricio', 'core', 110],
  ['Igiene', 'Deodorante', 'core', 120],
  ['Abbigliamento', 'Intimo', 'core', 200],
  ['Abbigliamento', 'Calze', 'core', 210],
  ['Abbigliamento', 'T-shirt', 'core', 220],
  ['Bambini', 'Pannolini', 'additional', 300],
  ['Animali', 'Cibo pet', 'additional', 400],
];

const standard: StandardSeedRow[] = UNIVERSAL_DEFAULTS.map((item, i) => ({
  category: item.category,
  name: item.name,
  tier: 'core',
  sort_order: (i + 1) * 10,
}));

for (const [category, name, tier, sort_order] of extras) {
  if (!standard.find((s) => s.name === name)) {
    standard.push({ category, name, tier, sort_order });
  }
}

const aiCatalog: Array<{ name: string; category: string; tags: string[]; sort_order: number }> = [];
let sort = 10;
const seen = new Set<string>();

for (const [tag, items] of Object.entries(TAG_ITEM_MAP)) {
  for (const item of items) {
    if (seen.has(item.name)) {
      const existing = aiCatalog.find((a) => a.name === item.name);
      if (existing && !existing.tags.includes(tag)) existing.tags.push(tag);
      continue;
    }
    seen.add(item.name);
    aiCatalog.push({
      name: item.name,
      category: item.category,
      tags: [tag],
      sort_order: sort,
    });
    sort += 10;
  }
}

for (const item of UNIVERSAL_DEFAULTS) {
  if (!seen.has(item.name)) {
    seen.add(item.name);
    aiCatalog.push({
      name: item.name,
      category: item.category,
      tags: ['universal'],
      sort_order: sort,
    });
    sort += 10;
  }
}

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

let sql = '-- Seed MACROFASE A: standard items, AI catalog, migrazione template TD\n\n';

sql += 'INSERT INTO public.packing_standard_items (category, name, sort_order, tier) VALUES\n';
sql += standard
  .map((s) => `  ('${esc(s.category)}', '${esc(s.name)}', ${s.sort_order}, '${s.tier}')`)
  .join(',\n');
sql += '\nON CONFLICT (category, name) DO NOTHING;\n\n';

sql += 'INSERT INTO public.packing_ai_catalog (name, category, tags, sort_order) VALUES\n';
sql += aiCatalog
  .map(
    (a) =>
      `  ('${esc(a.name)}', '${esc(a.category)}', ARRAY[${a.tags.map((t) => `'${esc(t)}'`).join(',')}], ${a.sort_order})`
  )
  .join(',\n');
sql += '\nON CONFLICT (name) DO NOTHING;\n\n';

sql += `-- Migra item TD legacy da suitcase_items -> packing_template_items
INSERT INTO public.packing_template_items (template_id, category, name, sort_order, is_active)
SELECT
    si.suitcase_id,
    CASE
        WHEN lower(trim(si.category)) IN ('accessori & organizzazione', 'accessori') THEN 'Accessori'
        WHEN lower(trim(si.category)) = 'salute' THEN 'Farmaci'
        WHEN lower(trim(si.category)) = 'altro' THEN 'Extra'
        ELSE trim(si.category)
    END,
    trim(si.name),
    ROW_NUMBER() OVER (PARTITION BY si.suitcase_id ORDER BY si.category, si.name)::int * 10,
    true
FROM public.suitcase_items si
INNER JOIN public.suitcases s ON s.id = si.suitcase_id AND s.user_id IS NULL
WHERE COALESCE(si.is_ai_suggestion, false) = false
ON CONFLICT (template_id, category, name) DO NOTHING;

DELETE FROM public.suitcase_items si
USING public.suitcases s
WHERE si.suitcase_id = s.id AND s.user_id IS NULL;
`;

fs.writeFileSync('supabase/migrations/20260616120100_seed_packing_catalog.sql', sql);
console.log('standard:', standard.length, 'ai:', aiCatalog.length);
