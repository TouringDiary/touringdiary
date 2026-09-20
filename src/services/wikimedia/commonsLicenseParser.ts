import type { ImageVerificationStepOutcomeDb } from '@/constants/governance';

/** Esito strutturato parser licenza Commons (D79 / D80 — conservativo). */
export type CommonsLicenseParseOutcome = {
  licenseShortName: string | null;
  licenseUrl: string | null;
  authorName: string | null;
  attributionText: string | null;
  copyrightNotice: string | null;
  rightsHolder: string | null;
  sourcePageUrl: string | null;
  normalizedLicenseCode: string | null;
  isCcBy40AutoPathEligible: boolean;
  overallLicenseOutcome: ImageVerificationStepOutcomeDb;
  stepOutcomes: CommonsLicenseStepOutcome[];
  blockingReasons: string[];
};

export type CommonsLicenseStepOutcome = {
  stepCode:
    | 'license_declared'
    | 'license_version'
    | 'license_url'
    | 'attribution_complete'
    | 'copyright_notice'
    | 'source_provenance';
  outcome: ImageVerificationStepOutcomeDb;
  rationale: string;
  evidence: Record<string, unknown>;
};

export type CommonsExtMetadataInput = {
  LicenseShortName?: string | null;
  LicenseUrl?: string | null;
  Artist?: string | null;
  Credit?: string | null;
  Attribution?: string | null;
  UsageTerms?: string | null;
  Copyrighted?: string | null;
  License?: string | null;
  ObjectName?: string | null;
};

const WIKIMEDIA_COMMONS_FILE_PREFIX = 'File:';

const CC_BY_40_PATTERNS = [
  /\bcc\s*by\s*4\.0\b/i,
  /\bcreative\s+commons\s+attribution\s+4\.0\b/i,
  /\battribution\s+4\.0\s+international\b/i,
  /\bcc-by-4\.0\b/i,
];

const CC_BY_SA_40_PATTERN = /\bcc\s*by-sa\s*4\.0\b/i;

const OTHER_LICENSE_MARKERS = [
  /\bcc\s*by-sa\b/i,
  /\bcc\s*by\s*3\.0\b/i,
  /\bcc\s*by\s*2\.0\b/i,
  /\bcc0\b/i,
  /\bpublic\s+domain\b/i,
  /\bpdm\b/i,
  /\ball\s+rights\s+reserved\b/i,
];

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function readMetadataField(
  raw: CommonsExtMetadataInput,
  key: keyof CommonsExtMetadataInput,
): string {
  const value = raw[key];
  if (typeof value !== 'string') return '';
  return stripHtml(value);
}

function isCreativeCommonsHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === 'creativecommons.org' || host === 'www.creativecommons.org';
}

function detectCcBy40InLicenseFields(licenseShortName: string, licenseField: string): boolean {
  const declaration = [licenseShortName, licenseField].filter(Boolean).join(' ');
  if (!declaration.trim()) return false;
  if (CC_BY_SA_40_PATTERN.test(declaration) || /\bcc\s*by-sa\b/i.test(declaration)) return false;
  if (isAmbiguousCcBy40LicenseDeclaration(licenseShortName, licenseField)) return false;
  return CC_BY_40_PATTERNS.some((pattern) => pattern.test(declaration));
}

function detectCcBy40InLicenseUrl(licenseUrl: string): boolean {
  return licenseUrlLooksValid(licenseUrl, true);
}

function isAmbiguousCcBy40LicenseDeclaration(
  licenseShortName: string,
  licenseField: string,
): boolean {
  const declaration = [licenseShortName, licenseField].filter(Boolean).join(' ');
  if (!declaration.trim()) return false;
  if (CC_BY_SA_40_PATTERN.test(declaration) || /\bcc\s*by-sa\b/i.test(declaration)) return true;
  const mentionsCcBy40 = CC_BY_40_PATTERNS.some((pattern) => pattern.test(declaration));
  if (!mentionsCcBy40) return false;
  return OTHER_LICENSE_MARKERS.some((pattern) => pattern.test(declaration));
}

function detectOtherLicense(licenseShortName: string, licenseField: string): boolean {
  const declaration = [licenseShortName, licenseField].filter(Boolean).join(' ');
  if (!declaration.trim()) return false;
  if (detectCcBy40InLicenseFields(licenseShortName, licenseField)) return false;
  return OTHER_LICENSE_MARKERS.some((pattern) => pattern.test(declaration));
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function decodeWikiTitleFromPathname(pathname: string): string {
  if (!pathname.startsWith('/wiki/')) return '';
  const segment = pathname.slice('/wiki/'.length);
  try {
    return decodeURIComponent(segment.replace(/_/g, ' '));
  } catch {
    return segment.replace(/_/g, ' ');
  }
}

function isCommonsOrWikidataPageUrl(url: string, expectedCommonsFileTitle?: string): boolean {
  if (!isHttpUrl(url)) return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host === 'commons.wikimedia.org') {
      if (!parsed.pathname.startsWith('/wiki/')) return false;
      const title = decodeWikiTitleFromPathname(parsed.pathname);
      if (!title.startsWith('File:')) return false;
      if (expectedCommonsFileTitle) {
        const normalizedExpected = expectedCommonsFileTitle.startsWith('File:')
          ? expectedCommonsFileTitle
          : `File:${expectedCommonsFileTitle}`;
        return title.localeCompare(normalizedExpected, undefined, { sensitivity: 'accent' }) === 0;
      }
      return true;
    }
    if (host === 'www.wikidata.org' || host === 'wikidata.org') {
      if (!parsed.pathname.startsWith('/wiki/')) return false;
      const title = decodeWikiTitleFromPathname(parsed.pathname).replace(/ /g, '');
      return /^Q[1-9]\d*$/.test(title);
    }
    return false;
  } catch {
    return false;
  }
}

function licenseUrlLooksValid(url: string, ccBy40Declared: boolean): boolean {
  if (!url.trim()) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;
  if (!isCreativeCommonsHostname(parsed.hostname)) return false;

  const pathname = parsed.pathname.replace(/\/+$/, '').toLowerCase();
  if (pathname.includes('by-sa')) return false;

  if (ccBy40Declared) {
    return pathname === '/licenses/by/4.0' || pathname === '/licenses/by/4.0/legalcode';
  }
  return pathname.startsWith('/licenses/');
}

function attributionLooksComplete(attributionText: string, authorName: string | null): boolean {
  const text = attributionText.trim();
  if (text.length < 12) return false;
  if (!authorName?.trim()) return false;
  const authorNorm = authorName.trim().toLowerCase();
  if (!text.toLowerCase().includes(authorNorm.slice(0, Math.min(authorNorm.length, 6)))) {
    return false;
  }
  return (
    CC_BY_40_PATTERNS.some((p) => p.test(text)) ||
    /\bcc\s*by\b/i.test(text) ||
    /\battribution\b/i.test(text)
  );
}

function worstOutcome(steps: CommonsLicenseStepOutcome[]): ImageVerificationStepOutcomeDb {
  const worstRank = steps.reduce((max, step) => {
    const rank =
      step.outcome === 'blocked'
        ? 4
        : step.outcome === 'unverified'
          ? 3
          : step.outcome === 'doubt'
            ? 2
            : step.outcome === 'not_applicable'
              ? 0
              : 0;
    return Math.max(max, rank);
  }, 0);
  if (worstRank >= 4) return 'blocked';
  if (worstRank >= 3) return 'unverified';
  if (worstRank >= 2) return 'doubt';
  return 'verified';
}

/**
 * Parser conservativo metadati Commons (extmetadata).
 * CC BY 4.0 solo da campi licenza canonici + URL licenza (D79). Credit/UsageTerms non bastano.
 */
export function parseCommonsLicenseMetadata(
  fileTitle: string,
  extMetadata: CommonsExtMetadataInput,
  sourcePageUrl?: string | null,
): CommonsLicenseParseOutcome {
  const licenseShortName = readMetadataField(extMetadata, 'LicenseShortName');
  const licenseUrlRaw = readMetadataField(extMetadata, 'LicenseUrl');
  const artist = readMetadataField(extMetadata, 'Artist');
  const credit = readMetadataField(extMetadata, 'Credit');
  const attributionField = readMetadataField(extMetadata, 'Attribution');
  const licenseField = readMetadataField(extMetadata, 'License');
  const copyrighted = readMetadataField(extMetadata, 'Copyrighted');

  const licenseFieldsAmbiguous = isAmbiguousCcBy40LicenseDeclaration(
    licenseShortName,
    licenseField,
  );
  const ccBy40Declared =
    !licenseFieldsAmbiguous &&
    (detectCcBy40InLicenseFields(licenseShortName, licenseField) ||
      detectCcBy40InLicenseUrl(licenseUrlRaw));
  const otherLicense = !ccBy40Declared && detectOtherLicense(licenseShortName, licenseField);

  let normalizedLicenseCode: string | null = null;
  if (ccBy40Declared) normalizedLicenseCode = 'CC-BY-4.0';
  else if (otherLicense) normalizedLicenseCode = 'OTHER';

  const authorName = artist || null;
  const attributionForCheck = attributionField || credit || '';
  const copyrightNotice = copyrighted || null;
  const rightsHolder: string | null = null;

  const stepOutcomes: CommonsLicenseStepOutcome[] = [];
  const blockingReasons: string[] = [];

  const fileRef = fileTitle.startsWith(WIKIMEDIA_COMMONS_FILE_PREFIX)
    ? fileTitle
    : `${WIKIMEDIA_COMMONS_FILE_PREFIX}${fileTitle}`;

  const hasLicenseDeclaration = Boolean(licenseShortName || licenseField);

  if (!hasLicenseDeclaration) {
    stepOutcomes.push({
      stepCode: 'license_declared',
      outcome: 'unverified',
      rationale: 'Licenza non dichiarata in LicenseShortName/License.',
      evidence: { fileTitle: fileRef },
    });
    blockingReasons.push('Licenza assente');
  } else if (otherLicense) {
    stepOutcomes.push({
      stepCode: 'license_declared',
      outcome: 'doubt',
      rationale: 'Licenza dichiarata diversa da CC BY 4.0 — revisione Admin (D79).',
      evidence: { licenseShortName, licenseField },
    });
    blockingReasons.push('Licenza non CC BY 4.0');
  } else if (ccBy40Declared) {
    stepOutcomes.push({
      stepCode: 'license_declared',
      outcome: 'verified',
      rationale: 'CC BY 4.0 dichiarata in campi licenza canonici Commons.',
      evidence: { licenseShortName, licenseField },
    });
  } else {
    stepOutcomes.push({
      stepCode: 'license_declared',
      outcome: 'doubt',
      rationale: 'Campi licenza presenti ma CC BY 4.0 non identificata con confidenza.',
      evidence: { licenseShortName, licenseField },
    });
    blockingReasons.push('Licenza ambigua');
  }

  if (ccBy40Declared) {
    stepOutcomes.push({
      stepCode: 'license_version',
      outcome: 'verified',
      rationale: 'Versione CC BY 4.0 nei campi licenza (requisito D79).',
      evidence: { normalizedLicenseCode },
    });
  } else if (otherLicense) {
    stepOutcomes.push({
      stepCode: 'license_version',
      outcome: 'blocked',
      rationale: 'Versione licenza non ammessa al percorso automatico.',
      evidence: { licenseShortName, licenseField },
    });
  } else {
    stepOutcomes.push({
      stepCode: 'license_version',
      outcome: 'unverified',
      rationale: 'Versione CC BY 4.0 non verificabile dai campi licenza.',
      evidence: { licenseShortName, licenseField },
    });
  }

  const licenseUrlOk =
    Boolean(licenseUrlRaw) && licenseUrlLooksValid(licenseUrlRaw, ccBy40Declared);
  if (licenseUrlOk) {
    stepOutcomes.push({
      stepCode: 'license_url',
      outcome: ccBy40Declared ? 'verified' : 'doubt',
      rationale: 'URL licenza presente e coerente con la dichiarazione.',
      evidence: { licenseUrl: licenseUrlRaw },
    });
  } else {
    stepOutcomes.push({
      stepCode: 'license_url',
      outcome: 'unverified',
      rationale: 'URL licenza assente o non coerente con CC BY 4.0.',
      evidence: { licenseUrl: licenseUrlRaw || null },
    });
    if (ccBy40Declared) blockingReasons.push('URL licenza CC BY 4.0 non verificabile');
  }

  const attributionOk = attributionLooksComplete(attributionForCheck, authorName);
  if (attributionOk) {
    stepOutcomes.push({
      stepCode: 'attribution_complete',
      outcome: ccBy40Declared ? 'verified' : 'doubt',
      rationale: 'Attribuzione con autore e riferimento licenza/attribution.',
      evidence: { attributionText: attributionForCheck },
    });
  } else {
    stepOutcomes.push({
      stepCode: 'attribution_complete',
      outcome: 'unverified',
      rationale: 'Attribuzione assente, troppo breve o senza autore/licenza verificabile.',
      evidence: { hasAuthor: Boolean(authorName) },
    });
    if (ccBy40Declared) blockingReasons.push('Attribuzione incompleta');
  }

  if (copyrightNotice && copyrightNotice.trim().length >= 3) {
    stepOutcomes.push({
      stepCode: 'copyright_notice',
      outcome: 'verified',
      rationale: 'Campo Copyrighted/notice presente nei metadati Commons.',
      evidence: { copyrightNotice },
    });
  } else {
    stepOutcomes.push({
      stepCode: 'copyright_notice',
      outcome: 'not_applicable',
      rationale:
        'Campo Copyrighted assente nei metadati Commons; non usato come prova obbligatoria per CC BY 4.0.',
      evidence: { authorName },
    });
  }

  const commonsPageOk = Boolean(
    sourcePageUrl && isCommonsOrWikidataPageUrl(sourcePageUrl, fileRef),
  );
  stepOutcomes.push({
    stepCode: 'source_provenance',
    outcome: commonsPageOk ? 'verified' : 'unverified',
    rationale: commonsPageOk
      ? 'Pagina sorgente Commons/Wikimedia referenziata.'
      : 'URL sorgente assente o non è una pagina Commons/Wikimedia verificabile.',
    evidence: { sourcePageUrl: sourcePageUrl ?? null, fileTitle: fileRef },
  });
  if (ccBy40Declared && !commonsPageOk) {
    blockingReasons.push('Provenienza Commons non verificabile');
  }

  const overallLicenseOutcome = worstOutcome(stepOutcomes);

  const requiredVerified =
    ccBy40Declared &&
    stepOutcomes.every((step) => {
      if (
        step.stepCode === 'license_declared' ||
        step.stepCode === 'license_version' ||
        step.stepCode === 'license_url' ||
        step.stepCode === 'attribution_complete' ||
        step.stepCode === 'source_provenance'
      ) {
        return step.outcome === 'verified';
      }
      return true;
    });

  const isCcBy40AutoPathEligible = requiredVerified && overallLicenseOutcome === 'verified';

  return {
    licenseShortName: licenseShortName || null,
    licenseUrl: licenseUrlRaw || null,
    authorName,
    attributionText: attributionForCheck || null,
    copyrightNotice,
    rightsHolder,
    sourcePageUrl: sourcePageUrl ?? null,
    normalizedLicenseCode,
    isCcBy40AutoPathEligible,
    overallLicenseOutcome,
    stepOutcomes,
    blockingReasons,
  };
}
