/**
 * QA Macrofase C — verifica composizione e exclusion logic in memoria.
 * Eseguire: npm run packing:qa
 */
import {
  expandStandardCatalog,
  PACKING_AI_CATALOG,
  PACKING_TEMPLATE_CATALOG,
  TEMPLATE_KEYS,
  TEMPLATE_DB_TITLES,
  CITY_TYPE_TO_TEMPLATE,
  validatePackingDomainCatalog,
} from '../src/domain/packing/packingDomainCatalog';
import { CATEGORY_ORDER } from '../src/domain/packing/packingCategories';
import { resolveCategorySetup } from '../src/domain/packing/categorySetup';
import { composeTdTemplateItemsFromCatalog } from '../src/domain/packing/packingTemplateComposition';
import {
  createFamigliaTdTemplateFixture,
  createTdTemplateSuitcaseFixture,
} from '../src/domain/packing/packingQaFixtures';
import { normalizeItemName } from '../src/utils/tagDerivation';
import type { PackingStandardItem, PackingTemplateItem } from '../src/types/packingCatalog';

const validation = validatePackingDomainCatalog();
const issues: string[] = [];

const standardRows: PackingStandardItem[] = expandStandardCatalog().map((r, i) => ({
  id: `std-${i}`,
  ...r,
  is_active: true,
}));

function buildTemplateSpecificRows(
  templateId: string,
  templateKey: (typeof TEMPLATE_KEYS)[number]
): PackingTemplateItem[] {
  const tplData = PACKING_TEMPLATE_CATALOG[templateKey];
  const rows: PackingTemplateItem[] = [];
  let sort = 10;
  for (const cat of CATEGORY_ORDER) {
    for (const name of tplData[cat]) {
      rows.push({
        id: `tpl-${templateId}-${sort}`,
        template_id: templateId,
        category: cat,
        name,
        sort_order: sort,
        is_active: true,
      });
      sort += 10;
    }
  }
  return rows;
}

function composeForTemplate(templateKey: (typeof TEMPLATE_KEYS)[number]) {
  const template =
    templateKey === 'famiglia'
      ? createFamigliaTdTemplateFixture(`fixture-${templateKey}`)
      : createTdTemplateSuitcaseFixture({
          id: `fixture-${templateKey}`,
          templateKey,
        });
  const specificRows = buildTemplateSpecificRows(template.id, templateKey);
  const items = composeTdTemplateItemsFromCatalog({
    setup: resolveCategorySetup(template),
    suitcaseId: template.id,
    standardRows,
    specificRows,
  });
  return { template, items };
}

// --- 1. Composizione Template TD ---
console.log('=== QA 1: Composizione Template TD ===\n');

for (const key of TEMPLATE_KEYS) {
  const { items: composed } = composeForTemplate(key);
  const byCat: Record<string, number> = {};
  for (const item of composed) {
    byCat[item.category] = (byCat[item.category] ?? 0) + 1;
  }

  const expectedCats = key === 'famiglia' ? 9 : 7;
  const activeCats = Object.keys(byCat).length;
  if (activeCats < expectedCats) {
    issues.push(`Composizione ${key}: solo ${activeCats} categorie attive (attese ${expectedCats})`);
  }

  if (!composed.some((i) => normalizeItemName(i.name) === normalizeItemName('Intimo'))) {
    issues.push(`Composizione ${key}: manca Intimo (standard)`);
  }

  if (
    (key === 'mare' || key === 'lago') &&
    !composed.some((i) => normalizeItemName(i.name) === normalizeItemName('Costume'))
  ) {
    issues.push(`Composizione ${key}: manca Costume (template)`);
  }

  console.log(
    `${TEMPLATE_DB_TITLES[key]}: ${composed.length} item totali, categorie: ${Object.entries(byCat)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ')}`
  );
}

// --- 2. Category Setup Bambini/Animali ---
console.log('\n=== QA 2: Category Setup Bambini/Animali ===\n');

const mareTemplate = createTdTemplateSuitcaseFixture({
  id: 'fixture-mare-setup',
  templateKey: 'mare',
});
const mareDefault = composeTdTemplateItemsFromCatalog({
  setup: resolveCategorySetup(mareTemplate),
  suitcaseId: mareTemplate.id,
  standardRows,
  specificRows: [],
});
if (
  mareDefault.some((i) => normalizeItemName(i.name) === normalizeItemName('Pannolini'))
) {
  issues.push('Mare default: Pannolini non dovrebbe comparire (Bambini non seeded)');
} else {
  console.log('✓ Template Mare: Bambini esclusi correttamente');
}

const { items: famComposed } = composeForTemplate('famiglia');
if (!famComposed.some((i) => normalizeItemName(i.name) === normalizeItemName('Pannolini'))) {
  issues.push('Famiglia: manca Pannolini (standard Bambini)');
} else {
  console.log('✓ Template Famiglia: Pannolini presente');
}
if (!famComposed.some((i) => normalizeItemName(i.name) === normalizeItemName('Ciuccio'))) {
  issues.push('Famiglia: manca Ciuccio (template Bambini)');
} else {
  console.log('✓ Template Famiglia: Ciuccio presente');
}

// --- 3. AI Exclusion simulation ---
console.log('\n=== QA 3: AI Exclusion (simulazione) ===\n');

const { items: mareFull } = composeForTemplate('mare');
const excluded = new Set(mareFull.map((i) => normalizeItemName(i.name)));

const piumino = PACKING_AI_CATALOG.find((a) => a.name === 'Piumino packable');
if (piumino && excluded.has(normalizeItemName(piumino.name))) {
  issues.push('AI: Piumino packable erroneamente escluso (non in valigia Mare)');
} else if (piumino) {
  console.log('✓ Piumino packable disponibile come candidato AI per Mare');
}

const overlapCount = PACKING_AI_CATALOG.filter((a) =>
  excluded.has(normalizeItemName(a.name))
).length;
if (overlapCount > 0) {
  console.log(
    `ℹ ${overlapCount} item AI presenti anche in standard/template Mare (esclusi a runtime — OK)`
  );
}

const aiNames = new Set<string>();
for (const a of PACKING_AI_CATALOG) {
  const k = normalizeItemName(a.name);
  if (aiNames.has(k)) issues.push(`AI: nome duplicato ${a.name}`);
  aiNames.add(k);
}
console.log(`✓ ${PACKING_AI_CATALOG.length} item AI con nomi univoci`);

// --- 4. City Template Map ---
console.log('\n=== QA 4: City Template Map (definizione) ===\n');
for (const key of TEMPLATE_KEYS) {
  const types = CITY_TYPE_TO_TEMPLATE[key];
  console.log(`${types.join(', ')} → ${TEMPLATE_DB_TITLES[key]}`);
}

// --- 5. Editorial counts ---
console.log('\n=== QA 5: Conteggi Editorial Center attesi ===\n');
console.log('StandardItemsTab:', validation.standardTotal);
console.log('TemplateSpecificItemsTab (totale):', validation.templateTotal);
console.log('AiCatalogTab:', validation.aiTotal);

console.log('\n=== REPORT FINALE QA ===\n');
if (!validation.ok) {
  issues.push(...validation.anomalies.map((a) => `Catalogo: ${a}`));
}

if (issues.length) {
  console.error('PROBLEMI:');
  issues.forEach((i) => console.error(' ✗', i));
  process.exit(1);
}

console.log('✓ QA Macrofase C superato — nessuna anomalia bloccante.');
console.log(
  `\nCatalogo: ${validation.standardTotal} standard, ${validation.templateTotal} template, ${validation.aiTotal} AI`
);
