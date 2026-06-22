/**
 * Valida packingDomainCatalog.ts e stampa report.
 * Eseguire: npx tsx scripts/validate-packing-domain-catalog.ts
 */
import { validatePackingDomainCatalog } from '../src/domain/packing/packingDomainCatalog';

const report = validatePackingDomainCatalog();

console.log('=== VALIDAZIONE PACKING DOMAIN CATALOG ===\n');
console.log('Standard total:', report.standardTotal);
console.log('Template total:', report.templateTotal);
console.log('AI total:', report.aiTotal);
console.log('\nStandard per categoria:', report.standardByCategory);
console.log('Template per template:', report.templateByTemplate);
console.log('AI per categoria:', report.aiByCategory);

if (report.anomalies.length) {
  console.error('\nANOMALIE:');
  report.anomalies.forEach((a) => console.error(' -', a));
  process.exit(1);
}

console.log('\n✓ Catalogo valido — nessuna anomalia.');
