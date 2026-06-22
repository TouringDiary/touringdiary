/**
 * Genera le migration Supabase Macrofase C dal catalogo congelato.
 * Eseguire: npx tsx scripts/generate-packing-catalog-migrations.ts
 *
 * Prima di applicare: verificare i vincoli DB con
 * docs/packing/MACROFASE_C_MIGRATION_CONSTRAINTS.sql
 * ON CONFLICT è valido solo dove esiste il UNIQUE corrispondente.
 */
import fs from 'fs';
import path from 'path';
import {
  expandStandardCatalog,
  PACKING_AI_CATALOG,
  PACKING_TEMPLATE_CATALOG,
  TEMPLATE_DB_TITLES,
  TEMPLATE_KEYS,
  CITY_TYPE_TO_TEMPLATE,
  validatePackingDomainCatalog,
} from '../src/domain/packing/packingDomainCatalog';
import { CATEGORY_ORDER, type SystemCategoryName } from '../src/domain/packing/packingCategories';

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

const report = validatePackingDomainCatalog();
if (!report.ok) {
  console.error('Catalogo non valido:', report.anomalies);
  process.exit(1);
}

const migrationsDir = path.join('supabase', 'migrations');

// M0: Rinomina template TD legacy (DB reale → titoli canonici dominio)
// Deve precedere M1: altrimenti M1 inserirebbe duplicati per Cultura/Business.
const m0 = `-- Macrofase C: rinomina template TD legacy ai titoli canonici del dominio
-- Eseguire prima di macrofase_c_td_templates (M1).

UPDATE public.suitcases
SET title = '${esc(TEMPLATE_DB_TITLES.cultura)}', updated_at = now()
WHERE user_id IS NULL
  AND title ILIKE 'Template Città'
  AND NOT EXISTS (
    SELECT 1 FROM public.suitcases
    WHERE user_id IS NULL AND title ILIKE '${esc(TEMPLATE_DB_TITLES.cultura)}'
  );

UPDATE public.suitcases
SET title = '${esc(TEMPLATE_DB_TITLES.business)}', updated_at = now()
WHERE user_id IS NULL
  AND title ILIKE 'Template Lavoro'
  AND NOT EXISTS (
    SELECT 1 FROM public.suitcases
    WHERE user_id IS NULL AND title ILIKE '${esc(TEMPLATE_DB_TITLES.business)}'
  );
`;

// M1: TD Templates
let m1 = `-- Macrofase C: garantisce 7 template TD con category_setup corretto
`;

for (const key of TEMPLATE_KEYS) {
  const title = TEMPLATE_DB_TITLES[key];
  const isFamiglia = key === 'famiglia';
  m1 += `
INSERT INTO public.suitcases (user_id, title, icon, ui_state, is_user_template)
SELECT
  NULL,
  '${esc(title)}',
  '${isFamiglia ? '👨‍👩‍👧' : '🎒'}',
  jsonb_build_object(
    'hidden_category_ids', '[]'::jsonb,
    'dismissed_category_ids', '[]'::jsonb,
    'category_display_order', '[]'::jsonb,
    'category_setup', jsonb_build_object(
      'clothing', jsonb_build_object('enabled', true, 'seeded', true),
      'hygiene', jsonb_build_object('enabled', true, 'seeded', true),
      'documents', jsonb_build_object('enabled', true, 'seeded', true),
      'electronics', jsonb_build_object('enabled', true, 'seeded', true),
      'meds', jsonb_build_object('enabled', true, 'seeded', true),
      'accessories', jsonb_build_object('enabled', true, 'seeded', true),
      'extra', jsonb_build_object('enabled', true, 'seeded', true),
      'kids', jsonb_build_object('enabled', ${isFamiglia}, 'seeded', ${isFamiglia}),
      'pets', jsonb_build_object('enabled', ${isFamiglia}, 'seeded', ${isFamiglia})
    )
  ),
  false
WHERE NOT EXISTS (
  SELECT 1 FROM public.suitcases WHERE user_id IS NULL AND title ILIKE '${esc(title)}'
);
`;
}

// M2: Standard - deactivate legacy not in catalog, upsert new
const standardRows = expandStandardCatalog();

let m2 = `-- Macrofase C: allinea packing_standard_items al catalogo congelato

-- Disattiva standard legacy non più nel dominio
UPDATE public.packing_standard_items
SET is_active = false, updated_at = now()
WHERE is_active = true
  AND (category, name) NOT IN (
`;

m2 += standardRows.map((r) => `    ('${esc(r.category)}', '${esc(r.name)}')`).join(',\n');
m2 += `
  );

INSERT INTO public.packing_standard_items (category, name, sort_order, tier, is_active)
VALUES
`;
m2 += standardRows
  .map((r) => `  ('${esc(r.category)}', '${esc(r.name)}', ${r.sort_order}, '${r.tier}', true)`)
  .join(',\n');
m2 += `
ON CONFLICT (category, name) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  tier = EXCLUDED.tier,
  is_active = true,
  updated_at = now();
`;

// M3: Template items - replace per template
let m3 = `-- Macrofase C: allinea packing_template_items al catalogo congelato
-- Sostituisce gli item specifici per ogni template TD (non tocca valigie utente)

`;

for (const key of TEMPLATE_KEYS) {
  const title = TEMPLATE_DB_TITLES[key];
  m3 += `
-- Template: ${title}
DELETE FROM public.packing_template_items
WHERE template_id IN (
  SELECT id FROM public.suitcases WHERE user_id IS NULL AND title ILIKE '${esc(title)}'
);

INSERT INTO public.packing_template_items (template_id, category, name, sort_order, is_active)
SELECT s.id, v.category, v.name, v.sort_order, true
FROM public.suitcases s
CROSS JOIN (
  VALUES
`;
  const values: string[] = [];
  const tpl = PACKING_TEMPLATE_CATALOG[key];
  for (const cat of CATEGORY_ORDER) {
    const items = tpl[cat as SystemCategoryName];
    items.forEach((name, idx) => {
      values.push(`    ('${esc(cat)}', '${esc(name)}', ${(idx + 1) * 10})`);
    });
  }
  m3 += values.join(',\n');
  m3 += `
) AS v(category, name, sort_order)
WHERE s.user_id IS NULL AND s.title ILIKE '${esc(title)}'
ON CONFLICT (template_id, category, name) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  is_active = true,
  updated_at = now();
`;
}

// M4: AI catalog
let m4 = `-- Macrofase C: allinea packing_ai_catalog al catalogo congelato

UPDATE public.packing_ai_catalog
SET is_active = false, updated_at = now()
WHERE is_active = true
  AND name NOT IN (
`;
m4 += PACKING_AI_CATALOG.map((a) => `    '${esc(a.name)}'`).join(',\n');
m4 += `
  );

INSERT INTO public.packing_ai_catalog (name, category, tags, sort_order, is_active)
VALUES
`;
m4 += PACKING_AI_CATALOG.map(
  (a) =>
    `  ('${esc(a.name)}', '${esc(a.category)}', ARRAY[${a.tags.map((t) => `'${esc(t)}'`).join(', ')}], ${a.sort_order}, true)`
).join(',\n');
m4 += `
ON CONFLICT (name) DO UPDATE SET
  category = EXCLUDED.category,
  tags = EXCLUDED.tags,
  sort_order = EXCLUDED.sort_order,
  is_active = true,
  updated_at = now();
`;

// M5: city_template_map
let m5 = `-- Macrofase C: seed city_template_map

DELETE FROM public.city_template_map
WHERE city_type IN ('mare', 'lago', 'laghi_fiumi', 'montagna', 'cultura', 'business', 'weekend', 'famiglia');

`;

for (const key of TEMPLATE_KEYS) {
  const title = TEMPLATE_DB_TITLES[key];
  const cityTypes = CITY_TYPE_TO_TEMPLATE[key];
  for (const cityType of cityTypes) {
    m5 += `
INSERT INTO public.city_template_map (city_type, template_id, priority)
SELECT '${esc(cityType)}', s.id, 0
FROM public.suitcases s
WHERE s.user_id IS NULL AND s.title ILIKE '${esc(title)}';
`;
  }
}

const files = [
  ['20260622115900_macrofase_c_rename_td_templates.sql', m0],
  ['20260622120000_macrofase_c_td_templates.sql', m1],
  ['20260622120100_macrofase_c_standard_catalog.sql', m2],
  ['20260622120200_macrofase_c_template_catalog.sql', m3],
  ['20260622120300_macrofase_c_ai_catalog.sql', m4],
  ['20260622120400_macrofase_c_city_template_map.sql', m5],
];

for (const [name, sql] of files) {
  const fp = path.join(migrationsDir, name);
  fs.writeFileSync(fp, sql);
  console.log('Scritto:', fp);
}

console.log('\n=== GENERAZIONE MIGRATION ===');
console.log('Standard:', standardRows.length);
console.log('Template:', report.templateTotal);
console.log('AI:', PACKING_AI_CATALOG.length);
console.log('Legacy standard da disattivare: vedi UPDATE in M2');
