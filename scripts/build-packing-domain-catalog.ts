/**
 * Genera src/domain/packing/packingDomainCatalog.ts dal catalogo congelato.
 * Eseguire: npx tsx scripts/build-packing-domain-catalog.ts
 */
import fs from 'fs';
import path from 'path';
import catalogJson from './packing-domain-catalog-data.json';
import { parsePackingDomainCatalogJson } from './packing-domain-catalog-data.schema';
import { validatePackingDomainCatalogData } from '../src/domain/packing/packingDomainCatalogValidation';

const data = parsePackingDomainCatalogJson(catalogJson);

import { CATEGORY_ORDER } from '../src/domain/packing/packingCategories';
import type { SystemCategoryName } from '../src/domain/packing/packingCategories';
import { TEMPLATE_KEYS } from '../src/domain/packing/packingDomainCatalogTypes';
import type { PackingTemplateKey } from '../src/domain/packing/packingDomainCatalogTypes';

function flattenAiCatalog() {
  const out: Array<{ name: string; category: SystemCategoryName; tags: readonly string[] }> = [];
  for (const cat of CATEGORY_ORDER) {
    for (const [name, tags] of data.ai[cat]) {
      out.push({ name, category: cat, tags });
    }
  }
  return out;
}

function validateFromJson() {
  return validatePackingDomainCatalogData({
    standard: data.standard,
    template: data.templates,
    ai: flattenAiCatalog(),
  });
}

function formatStringArray(items: readonly string[], indent: string): string {
  if (items.length === 0) return '[]';
  const lines = items.map((i) => `${indent}  '${i.replace(/'/g, "\\'")}',`);
  return `[\n${lines.join('\n')}\n${indent}]`;
}

function buildTsFile(): string {
  const standardBlocks = CATEGORY_ORDER.map((cat) => {
    const items = data.standard[cat];
    return `  ${cat}: ${formatStringArray(items, '  ')},`;
  }).join('\n');

  const templateBlocks = TEMPLATE_KEYS.map((tk) => {
    const tpl = data.templates[tk];
    const catBlocks = CATEGORY_ORDER.map((cat) => {
      const items = tpl[cat];
      return `    ${cat}: ${formatStringArray(items, '    ')},`;
    }).join('\n');
    return `  ${tk}: {\n${catBlocks}\n  },`;
  }).join('\n');

  const aiEntries: string[] = [];
  let sort = 10;
  for (const cat of CATEGORY_ORDER) {
    const items = data.ai[cat];
    for (const [name, tags] of items) {
      const tagStr = tags.map((t) => `'${t}'`).join(', ');
      aiEntries.push(
        `  { name: '${name.replace(/'/g, "\\'")}', category: '${cat}', tags: [${tagStr}], sort_order: ${sort} },`
      );
      sort += 10;
    }
  }

  return `/**
 * Catalogo dominio Macrofase C — CONGELATO.
 * Dati editoriali: rigenerare con scripts/build-packing-domain-catalog.ts
 */

import { CATEGORY_ORDER } from './packingCategories';
import type { PackingStandardItemTier } from '@/types/packingCatalog';
import type {
  PackingCategoryItemMap,
  PackingTemplateCatalogMap,
  PackingStandardCatalogItem,
  PackingAiCatalogEntry,
  PackingDomainValidationReport,
} from './packingDomainCatalogTypes';
import { validatePackingDomainCatalogData } from './packingDomainCatalogValidation';

export * from './packingDomainCatalogTypes';

export const PACKING_STANDARD_CATALOG = {
${standardBlocks}
} as const satisfies PackingCategoryItemMap;

export const PACKING_TEMPLATE_CATALOG = {
${templateBlocks}
} as const satisfies PackingTemplateCatalogMap;

export const PACKING_AI_CATALOG = [
${aiEntries.join('\n')}
] as const satisfies readonly PackingAiCatalogEntry[];

/** Espande PACKING_STANDARD_CATALOG in righe con tier e sort_order per il DB. */
export function expandStandardCatalog(): PackingStandardCatalogItem[] {
  const rows: PackingStandardCatalogItem[] = [];
  let order = 10;
  for (const category of CATEGORY_ORDER) {
    const tier: PackingStandardItemTier =
      category === 'Bambini' || category === 'Animali' ? 'additional' : 'core';
    for (const name of PACKING_STANDARD_CATALOG[category]) {
      rows.push({ category, name, tier, sort_order: order });
      order += 10;
    }
  }
  return rows;
}

/** Valida il catalogo congelato in memoria. */
export function validatePackingDomainCatalog(): PackingDomainValidationReport {
  return validatePackingDomainCatalogData({
    standard: PACKING_STANDARD_CATALOG,
    template: PACKING_TEMPLATE_CATALOG,
    ai: PACKING_AI_CATALOG,
  });
}
`;
}

const report = validateFromJson();
const outPath = path.join('src', 'domain', 'packing', 'packingDomainCatalog.ts');
fs.writeFileSync(outPath, buildTsFile());

console.log('=== PACKING DOMAIN CATALOG REPORT ===');
console.log('Standard total:', report.standardTotal);
console.log('Template total:', report.templateTotal);
console.log('AI total:', report.aiTotal);
console.log('Standard by category:', report.standardByCategory);
console.log('Template by template:', report.templateByTemplate);
console.log('AI by category:', report.aiByCategory);
if (report.anomalies.length) {
  console.error('ANOMALIE:', report.anomalies);
  process.exit(1);
}
console.log('OK — scritto', outPath);
