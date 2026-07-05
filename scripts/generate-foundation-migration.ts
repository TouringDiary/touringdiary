import { FOUNDATION_DESIGN_RULES } from '../src/data/system/foundationDesignRules.ts';
import fs from 'fs';

const MIGRATION_BASENAME = '20260705120001_seed_foundation_design_system_rules';
const MIGRATION_PATH = `supabase/migrations/${MIGRATION_BASENAME}.sql`;

const esc = (v: unknown) =>
  v == null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`;

const lines = FOUNDATION_DESIGN_RULES.map(
  (r) => `    (
        'foundation',
        ${esc(r.element_name)},
        ${esc(r.component_key)},
        ${esc(r.font_family ?? '')},
        ${esc(r.text_size)},
        ${esc(r.font_weight)},
        ${esc(r.text_transform ?? 'none')},
        ${esc(r.tracking)},
        ${esc(r.color_class)},
        ${esc(r.line_height)},
        ${esc(r.effect_class ?? 'none')},
        ${esc(r.css_class)},
        ${esc(r.preview_text)}
    )`
);

const sql = `-- =============================================================================
-- MIGRATION: ${MIGRATION_BASENAME}.sql
-- DESCRIZIONE: Seed regole Foundation modali (prototipo approvato)
-- SICUREZZA:   UPSERT su component_key
-- =============================================================================

INSERT INTO public.design_system_rules (
    section,
    element_name,
    component_key,
    font_family,
    text_size,
    font_weight,
    text_transform,
    tracking,
    color_class,
    line_height,
    effect_class,
    css_class,
    preview_text
)
VALUES
${lines.join(',\n')}
ON CONFLICT (component_key) DO UPDATE SET
    section = EXCLUDED.section,
    element_name = EXCLUDED.element_name,
    font_family = EXCLUDED.font_family,
    text_size = EXCLUDED.text_size,
    font_weight = EXCLUDED.font_weight,
    text_transform = EXCLUDED.text_transform,
    tracking = EXCLUDED.tracking,
    color_class = EXCLUDED.color_class,
    line_height = EXCLUDED.line_height,
    effect_class = EXCLUDED.effect_class,
    css_class = EXCLUDED.css_class,
    preview_text = EXCLUDED.preview_text;
`;

fs.writeFileSync(MIGRATION_PATH, sql);
console.log(`Generated ${lines.length} foundation rules → ${MIGRATION_PATH}`);
