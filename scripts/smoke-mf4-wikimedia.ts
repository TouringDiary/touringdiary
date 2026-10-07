/**
 * MF4 — smoke parser licenza Commons + policy CC BY 4.0
 * Eseguire: npm run mf4:smoke
 */

import { parseCommonsLicenseMetadata } from '../src/services/wikimedia/commonsLicenseParser';
import {
  classifyWikimediaStorageContent,
  shouldAssignWikimediaAsset,
} from '../src/services/wikimedia/wikimediaStorageCollision';
import { buildWikimediaStorageObjectPath } from '../src/services/wikimedia/wikimediaStorageObjectPath';

const issues: string[] = [];

function assert(condition: boolean, message: string): void {
  if (!condition) issues.push(message);
}

function assertRawHttpUrl(value: string | null | undefined, label: string): void {
  if (value == null) return;
  if (value.includes('[') || value.includes('](')) {
    issues.push(`${label}: stringa URL contiene sintassi Markdown`);
    return;
  }
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      issues.push(`${label}: protocollo URL non HTTP(S)`);
    }
  } catch {
    issues.push(`${label}: URL non parseabile`);
  }
}

const CC_BY_40_LICENSE_URL = 'https://creativecommons.org/licenses/by/4.0/';

const CC_BY_SA_LICENSE_URL = 'https://creativecommons.org/licenses/by-sa/4.0/';

const COMMONS_FILE_EXAMPLE_PAGE = 'https://commons.wikimedia.org/wiki/File:Example.jpg';

const COMMONS_FILE_OTHER_PAGE = 'https://commons.wikimedia.org/wiki/File:Other.jpg';

const COMMONS_FILE_TRAP_PAGE = 'https://commons.wikimedia.org/wiki/File:Trap.jpg';

const COMMONS_FILE_AUTHOR_ONLY_PAGE = 'https://commons.wikimedia.org/wiki/File:AuthorOnly.jpg';

const UPLOAD_WIKIMEDIA_DIRECT_EXAMPLE =
  'https://upload.wikimedia.org/wikipedia/commons/3/3a/Example.jpg';

assertRawHttpUrl(CC_BY_40_LICENSE_URL, 'CC BY 4.0 license URL');
assertRawHttpUrl(CC_BY_SA_LICENSE_URL, 'CC BY-SA license URL');
assertRawHttpUrl(COMMONS_FILE_EXAMPLE_PAGE, 'Commons File:Example page');
assertRawHttpUrl(COMMONS_FILE_OTHER_PAGE, 'Commons File:Other page');
assertRawHttpUrl(COMMONS_FILE_TRAP_PAGE, 'Commons File:Trap page');
assertRawHttpUrl(COMMONS_FILE_AUTHOR_ONLY_PAGE, 'Commons File:AuthorOnly page');
assertRawHttpUrl(UPLOAD_WIKIMEDIA_DIRECT_EXAMPLE, 'upload.wikimedia direct URL');

const ccBy40 = parseCommonsLicenseMetadata(
  'File:Example.jpg',
  {
    LicenseShortName: 'CC BY 4.0',
    LicenseUrl: CC_BY_40_LICENSE_URL,
    Artist: 'Jane Photographer',
    Credit: 'Photo by Jane Photographer',
    Attribution: 'Jane Photographer / CC BY 4.0',
    Copyrighted: 'Creative Commons Attribution 4.0',
  },
  COMMONS_FILE_EXAMPLE_PAGE,
);

assert(ccBy40.isCcBy40AutoPathEligible, 'CC BY 4.0 completa → auto-path eligible');
assert(ccBy40.overallLicenseOutcome === 'verified', 'CC BY 4.0 → overall verified');

const ccBySa = parseCommonsLicenseMetadata(
  'File:Other.jpg',
  {
    LicenseShortName: 'CC BY-SA 4.0',
    LicenseUrl: CC_BY_SA_LICENSE_URL,
    Artist: 'Author',
    Credit: 'Author',
    Copyrighted: 'CC BY-SA 4.0',
  },
  COMMONS_FILE_OTHER_PAGE,
);

assert(!ccBySa.isCcBy40AutoPathEligible, 'CC BY-SA non ammessa ad auto-path');
assert(ccBySa.normalizedLicenseCode === 'OTHER', 'CC BY-SA → OTHER');
assert(
  ccBySa.overallLicenseOutcome === 'doubt' || ccBySa.overallLicenseOutcome === 'blocked',
  'CC BY-SA → dubbio/bloccato',
);

const missing = parseCommonsLicenseMetadata('File:Empty.jpg', {}, null);
assert(!missing.isCcBy40AutoPathEligible, 'Licenza assente → no auto-path');
assert(missing.overallLicenseOutcome === 'unverified', 'Licenza assente → unverified');

const falsePositiveCredit = parseCommonsLicenseMetadata(
  'File:Trap.jpg',
  {
    LicenseShortName: 'Unknown',
    License: 'All rights reserved',
    Credit: 'Nice photo — mentions CC BY 4.0 in description only',
    UsageTerms: 'CC BY 4.0 mentioned here but not license field',
    Artist: 'Someone',
  },
  COMMONS_FILE_TRAP_PAGE,
);

assert(
  !falsePositiveCredit.isCcBy40AutoPathEligible,
  'Menzione CC BY 4.0 solo in Credit/UsageTerms → no auto-path',
);

const authorOnly = parseCommonsLicenseMetadata(
  'File:AuthorOnly.jpg',
  {
    LicenseShortName: 'Unknown license',
    Artist: 'Jane Photographer',
    Credit: 'Jane Photographer',
  },
  COMMONS_FILE_AUTHOR_ONLY_PAGE,
);

assert(!authorOnly.isCcBy40AutoPathEligible, 'Autore senza licenza verificabile → no auto-path');

function sourceProvenanceOutcome(
  result: ReturnType<typeof parseCommonsLicenseMetadata>,
): string | undefined {
  return result.stepOutcomes.find((step) => step.stepCode === 'source_provenance')?.outcome;
}

const commonsFilePage = parseCommonsLicenseMetadata(
  'File:Example.jpg',
  {
    LicenseShortName: 'CC BY 4.0',
    LicenseUrl: CC_BY_40_LICENSE_URL,
    Artist: 'Jane Photographer',
    Credit: 'Photo by Jane Photographer',
  },
  COMMONS_FILE_EXAMPLE_PAGE,
);

assert(
  sourceProvenanceOutcome(commonsFilePage) === 'verified',
  'Pagina Commons File: → source_provenance verified',
);

const uploadDirectUrl = parseCommonsLicenseMetadata(
  'File:Example.jpg',
  {
    LicenseShortName: 'CC BY 4.0',
    LicenseUrl: CC_BY_40_LICENSE_URL,
    Artist: 'Jane Photographer',
    Credit: 'Photo by Jane Photographer',
  },
  UPLOAD_WIKIMEDIA_DIRECT_EXAMPLE,
);

assert(
  sourceProvenanceOutcome(uploadDirectUrl) !== 'verified',
  'URL upload.wikimedia.org direct → source_provenance NON verified',
);

const basilicaPath = buildWikimediaStorageObjectPath({
  folder: 'wikimedia/quarantine',
  qid: 'Q3635748',
  contentHash: '84fd090d2e4397b2b68c59e85ad4e033',
  commonsFileTitle: 'File:Santa croce Torre del Greco.jpg',
  mime: 'image/jpeg',
});

assert(
  basilicaPath ===
    'wikimedia/quarantine/Q3635748/84fd090d2e4397b2b68c59e85ad4e033_Santa_croce_Torre_del_Greco.jpg',
  `Path basilica con un solo suffisso MIME, ottenuto: ${basilicaPath}`,
);
assert(!basilicaPath.endsWith('.jpg.jpg'), 'Il path non termina con .jpg.jpg');

const pngFromJpegTitle = buildWikimediaStorageObjectPath({
  folder: 'wikimedia/quarantine',
  qid: 'Q1',
  contentHash: 'a'.repeat(64),
  commonsFileTitle: 'File:Example.jpeg',
  mime: 'image/png',
});
assert(
  pngFromJpegTitle.endsWith('_Example.png') && !pngFromJpegTitle.includes('.jpeg'),
  `Il suffisso segue il MIME dei byte, ottenuto: ${pngFromJpegTitle}`,
);

const untitled = buildWikimediaStorageObjectPath({
  folder: 'verified/wikimedia',
  qid: 'Q2',
  contentHash: 'b'.repeat(64),
  commonsFileTitle: 'File:SoloNome',
  mime: 'image/webp',
});
assert(
  untitled.endsWith('_SoloNome.webp'),
  `Titolo senza estensione riceve solo il suffisso MIME, ottenuto: ${untitled}`,
);

const sameHash = '84fd090d2e4397b2b68c59e85ad4e033711f5fe335d42121382182a860879fa1';
assert(classifyWikimediaStorageContent(sameHash, null) === 'absent', 'Hash assente → absent');
assert(
  classifyWikimediaStorageContent(sameHash, sameHash) === 'identical',
  'Stesso SHA-256 → identical',
);
assert(
  classifyWikimediaStorageContent(sameHash, `${sameHash.slice(0, -1)}0`) === 'different',
  'SHA-256 diverso → different',
);

const alternatePath = buildWikimediaStorageObjectPath({
  folder: 'wikimedia/quarantine',
  qid: 'Q3635748',
  contentHash: sameHash,
  commonsFileTitle: 'File:Santa croce Torre del Greco.jpg',
  mime: 'image/jpeg',
  contentHashLength: 64,
});
assert(
  alternatePath !== basilicaPath &&
    alternatePath.endsWith('.jpg') &&
    !alternatePath.endsWith('.jpg.jpg'),
  `Il path alternativo non sostituisce il canonico, ottenuto: ${alternatePath}`,
);
assert(alternatePath.includes(sameHash), 'Il path alternativo usa lo SHA-256 completo');

assert(
  shouldAssignWikimediaAsset({ autoPath: true, assignToEntity: true, adminReuse: false }),
  'Percorso CC BY 4.0 assegna',
);
assert(
  shouldAssignWikimediaAsset({ autoPath: false, assignToEntity: true, adminReuse: true }),
  'Riuso Admin assegna lo stesso asset senza richiedere il percorso automatico',
);
assert(
  !shouldAssignWikimediaAsset({ autoPath: false, assignToEntity: true, adminReuse: false }),
  'Import in quarantena non crea assignment',
);
assert(
  !shouldAssignWikimediaAsset({ autoPath: true, assignToEntity: false, adminReuse: true }),
  'assignToEntity false non assegna',
);

if (issues.length > 0) {
  console.error('[smoke-mf4-wikimedia] FAILED');
  for (const issue of issues) console.error(`  - ${issue}`);
  process.exit(1);
}

console.log('[smoke-mf4-wikimedia] OK — parser licenza Commons MF4');
