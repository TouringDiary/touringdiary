/**
 * MF4 — smoke parser licenza Commons + policy CC BY 4.0
 * Eseguire: npm run mf4:smoke
 */

import { parseCommonsLicenseMetadata } from '../src/services/wikimedia/commonsLicenseParser';

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

const CC_BY_40_LICENSE_URL =
  'https://creativecommons.org/licenses/by/4.0/';

const CC_BY_SA_LICENSE_URL =
  'https://creativecommons.org/licenses/by-sa/4.0/';

const COMMONS_FILE_EXAMPLE_PAGE =
  'https://commons.wikimedia.org/wiki/File:Example.jpg';

const COMMONS_FILE_OTHER_PAGE =
  'https://commons.wikimedia.org/wiki/File:Other.jpg';

const COMMONS_FILE_TRAP_PAGE =
  'https://commons.wikimedia.org/wiki/File:Trap.jpg';

const COMMONS_FILE_AUTHOR_ONLY_PAGE =
  'https://commons.wikimedia.org/wiki/File:AuthorOnly.jpg';

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

if (issues.length > 0) {
  console.error('[smoke-mf4-wikimedia] FAILED');
  for (const issue of issues) console.error(`  - ${issue}`);
  process.exit(1);
}

console.log('[smoke-mf4-wikimedia] OK — parser licenza Commons MF4');
