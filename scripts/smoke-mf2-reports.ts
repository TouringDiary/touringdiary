/**
 * MF2 — smoke statico governance report (no DB live, no path alias).
 * Eseguire: npm run mf2:smoke
 */

import {
  CONTENT_REPORT_KIND_VALUES,
  CONTENT_REPORT_STATUS_LABELS,
  parseContentReportStatusDb,
} from '../src/constants/governance';

const issues: string[] = [];

function assert(condition: boolean, message: string): void {
  if (!condition) issues.push(message);
}

assert(CONTENT_REPORT_KIND_VALUES.includes('image_abuse'), 'image_abuse kind');

assert(CONTENT_REPORT_KIND_VALUES.includes('entity_abuse'), 'entity_abuse kind');

assert(parseContentReportStatusDb('nuovo') === 'nuovo', 'parse nuovo');

assert(
  CONTENT_REPORT_STATUS_LABELS[parseContentReportStatusDb('in_verifica')] === 'IN VERIFICA',

  'status label IN VERIFICA',
);

if (issues.length > 0) {
  console.error('[smoke-mf2-reports] FAILED');

  for (const issue of issues) console.error(`  - ${issue}`);

  process.exit(1);
}

console.log('[smoke-mf2-reports] OK — governance vocabularies');
