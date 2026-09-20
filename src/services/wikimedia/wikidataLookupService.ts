const REQUEST_TIMEOUT_MS = 15_000;

function finalizeWikimediaApiBase(rawBase: string, expectedHostname: string): string {
  if (rawBase.includes('[') || rawBase.includes('](')) {
    throw new Error('Endpoint API Wikimedia in formato Markdown non ammesso.');
  }
  const parsed = new URL(rawBase);
  if (parsed.protocol !== 'https:') {
    throw new Error('Endpoint API Wikimedia deve usare HTTPS.');
  }
  if (parsed.hostname !== expectedHostname) {
    throw new Error(`Host API Wikimedia non valido: atteso ${expectedHostname}.`);
  }
  if (parsed.pathname !== '/w/api.php') {
    throw new Error('Path API Wikimedia non valido.');
  }
  return `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`;
}

const WIKIDATA_API = finalizeWikimediaApiBase(
  'https://www.wikidata.org/w/api.php',
  'www.wikidata.org',
);

const COMMONS_API = finalizeWikimediaApiBase(
  'https://commons.wikimedia.org/w/api.php',
  'commons.wikimedia.org',
);

function buildWikimediaApiRequestUrl(apiBase: string, params: URLSearchParams): string {
  if (apiBase.includes('[') || apiBase.includes('](')) {
    throw new Error('Endpoint API Wikimedia non valido (Markdown rilevato).');
  }
  const requestUrl = `${apiBase}?${params.toString()}`;
  const parsed = new URL(requestUrl);
  if (parsed.protocol !== 'https:') {
    throw new Error(`Endpoint API Wikimedia deve usare HTTPS: ${apiBase}`);
  }
  if (apiBase === WIKIDATA_API && parsed.hostname !== 'www.wikidata.org') {
    throw new Error('Host API Wikidata non valido.');
  }
  if (apiBase === COMMONS_API && parsed.hostname !== 'commons.wikimedia.org') {
    throw new Error('Host API Commons non valido.');
  }
  return parsed.href;
}

export type WikidataLookupSubject = {
  label: string;
  description?: string | null;
  birthYear?: number | null;
  deathYear?: number | null;
  cityName?: string | null;
  /** Q-id già noto — salta discovery testuale. */
  knownQid?: string | null;
};

export type WikidataCandidate = {
  qid: string;
  label: string;
  description: string | null;
  matchScore: number;
  ambiguous: boolean;
};

export type WikidataP18Proposal = {
  qid: string;
  qLabel: string;
  qDescription: string | null;
  commonsFileTitle: string;
  commonsFileUrl: string | null;
  confidence: 'high' | 'medium' | 'low';
  requiresAdminConfirm: boolean;
  lookupNotes: string[];
};

export type WikidataLookupResult =
  | { status: 'error'; message: string }
  | { status: 'none'; message: string }
  | { status: 'ambiguous'; candidates: WikidataCandidate[]; message: string }
  | { status: 'proposal'; proposal: WikidataP18Proposal };

type WikidataSearchEntity = {
  id?: string;
  label?: string;
  description?: string;
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Wikimedia API HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreCandidate(entity: WikidataSearchEntity, subject: WikidataLookupSubject): number {
  let score = 0;
  const entityLabel = normalizeText(entity.label ?? '');
  const subjectLabel = normalizeText(subject.label);
  if (!entityLabel || !subjectLabel) return 0;

  if (entityLabel === subjectLabel) score += 100;
  else if (entityLabel.includes(subjectLabel) || subjectLabel.includes(entityLabel)) score += 40;

  const entityDesc = normalizeText(entity.description ?? '');
  const city = normalizeText(subject.cityName ?? '');
  if (city && entityDesc.includes(city)) score += 15;

  if (subject.description) {
    const subjectDesc = normalizeText(subject.description);
    if (subjectDesc && entityDesc.includes(subjectDesc.slice(0, 24))) score += 10;
  }

  return score;
}

async function searchWikidataEntities(
  subject: WikidataLookupSubject,
): Promise<WikidataCandidate[]> {
  const searchTerm = subject.label.trim();
  if (!searchTerm) return [];

  const params = new URLSearchParams({
    action: 'wbsearchentities',
    search: searchTerm,
    language: 'it',
    format: 'json',
    origin: '*',
    limit: '8',
  });

  const payload = await fetchJson<{ search?: WikidataSearchEntity[] }>(
    buildWikimediaApiRequestUrl(WIKIDATA_API, params),
  );

  const raw = payload.search ?? [];
  const scored: WikidataCandidate[] = [];
  for (const entity of raw) {
    const qid = entity.id?.trim() ?? '';
    if (!isValidWikidataQid(qid)) continue;
    const matchScore = scoreCandidate(entity, subject);
    scored.push({
      qid,
      label: entity.label?.trim() || qid,
      description: entity.description?.trim() || null,
      matchScore,
      ambiguous: false,
    });
  }
  scored.sort((a, b) => b.matchScore - a.matchScore);

  if (scored.length === 0) return [];

  const top = scored[0];
  const second = scored[1];
  const topAmbiguous =
    scored.length > 1 &&
    top.matchScore > 0 &&
    second !== undefined &&
    second.matchScore > 0 &&
    top.matchScore - second.matchScore < 25;

  return scored.map((row, index) => ({
    ...row,
    ambiguous: index === 0 ? topAmbiguous : row.matchScore < top.matchScore - 10,
  }));
}

function isValidWikidataQid(qid: string): boolean {
  return /^Q[1-9]\d*$/i.test(qid.trim());
}

type P18Claim = {
  rank?: string;
  mainsnak?: { datavalue?: { value?: string } };
};

function pickP18FileTitle(claims: P18Claim[]): { title: string | null; ambiguous: boolean } {
  const usable = claims.filter((claim) => {
    const rank = (claim.rank ?? 'normal').toLowerCase();
    return rank !== 'deprecated';
  });
  if (usable.length === 0) return { title: null, ambiguous: false };

  const preferred = usable.filter((c) => (c.rank ?? '').toLowerCase() === 'preferred');
  const pool =
    preferred.length > 0
      ? preferred
      : usable.filter((c) => (c.rank ?? 'normal').toLowerCase() === 'normal');
  if (pool.length !== 1) return { title: null, ambiguous: pool.length > 1 };

  const fileName = pool[0]?.mainsnak?.datavalue?.value?.trim();
  if (!fileName) return { title: null, ambiguous: false };
  const title = fileName.startsWith('File:') ? fileName : `File:${fileName}`;
  return { title, ambiguous: false };
}

async function fetchP18CommonsFileTitle(
  qid: string,
): Promise<{ title: string | null; ambiguous: boolean }> {
  const params = new URLSearchParams({
    action: 'wbgetentities',
    ids: qid,
    props: 'claims|labels',
    languages: 'it|en',
    format: 'json',
    origin: '*',
  });

  const payload = await fetchJson<{
    entities?: Record<
      string,
      {
        missing?: string;
        claims?: { P18?: P18Claim[] };
        labels?: Record<string, { value?: string }>;
      }
    >;
  }>(buildWikimediaApiRequestUrl(WIKIDATA_API, params));

  const entity = payload.entities?.[qid];
  if (!entity || entity.missing) return { title: null, ambiguous: false };
  const claims = entity.claims?.P18;
  if (!claims || claims.length === 0) return { title: null, ambiguous: false };

  return pickP18FileTitle(claims);
}

async function resolveCommonsFileUrl(fileTitle: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: 'query',
    titles: fileTitle,
    prop: 'imageinfo',
    iiprop: 'url|mime|size',
    format: 'json',
    origin: '*',
  });

  const payload = await fetchJson<{
    query?: { pages?: Record<string, { imageinfo?: Array<{ url?: string }> }> };
  }>(buildWikimediaApiRequestUrl(COMMONS_API, params));

  const pages = payload.query?.pages ?? {};
  for (const page of Object.values(pages)) {
    const url = page.imageinfo?.[0]?.url?.trim();
    if (url) return url;
  }
  return null;
}

/**
 * Discovery Wikidata → proposta P18. Fail-closed: nessuna auto-selezione su ambiguità.
 */
export async function lookupWikidataP18Proposal(
  subject: WikidataLookupSubject,
): Promise<WikidataLookupResult> {
  try {
    let qid = subject.knownQid?.trim() ?? '';
    let qLabel = subject.label.trim();
    let qDescription = subject.description ?? null;
    const notes: string[] = [];
    let confidence: WikidataP18Proposal['confidence'] = 'medium';
    const requiresAdminConfirm = true;

    if (qid) {
      if (!isValidWikidataQid(qid)) {
        return { status: 'error', message: 'Q-id Wikidata non valido.' };
      }
      const existsParams = new URLSearchParams({
        action: 'wbgetentities',
        ids: qid,
        props: 'labels',
        format: 'json',
        origin: '*',
      });
      const existsPayload = await fetchJson<{
        entities?: Record<string, { missing?: string }>;
      }>(buildWikimediaApiRequestUrl(WIKIDATA_API, existsParams));
      if (existsPayload.entities?.[qid]?.missing) {
        return { status: 'error', message: `Elemento Wikidata ${qid} inesistente.` };
      }
      notes.push(`Q-id fornito esplicitamente: ${qid}`);
      confidence = 'medium';
    } else {
      const candidates = await searchWikidataEntities(subject);
      if (candidates.length === 0) {
        return { status: 'none', message: 'Nessun elemento Wikidata trovato per il soggetto.' };
      }

      const top = candidates[0];
      if (top.matchScore < 40) {
        return {
          status: 'none',
          message: 'Nessuna corrispondenza Wikidata sufficientemente affidabile.',
        };
      }

      if (top.ambiguous) {
        return {
          status: 'ambiguous',
          candidates: candidates.slice(0, 5),
          message:
            'Più elementi Wikidata plausibili — selezione automatica non consentita (conferma Admin).',
        };
      }

      qid = top.qid;
      qLabel = top.label;
      qDescription = top.description;
      confidence = top.matchScore >= 90 ? 'high' : 'medium';
      notes.push(`Discovery Wikidata: ${qid} (score ${top.matchScore})`);
    }

    const p18 = await fetchP18CommonsFileTitle(qid);
    if (p18.ambiguous) {
      return {
        status: 'none',
        message: `Elemento ${qid}: più immagini P18 plausibili — nessuna selezione automatica.`,
      };
    }
    if (!p18.title) {
      return {
        status: 'none',
        message: `Elemento ${qid} senza proprietà P18 (immagine) — nessuna proposta automatica.`,
      };
    }

    const commonsFileTitle = p18.title;
    const commonsFileUrl = await resolveCommonsFileUrl(commonsFileTitle);
    notes.push(`P18: ${commonsFileTitle}`);

    return {
      status: 'proposal',
      proposal: {
        qid,
        qLabel,
        qDescription,
        commonsFileTitle,
        commonsFileUrl,
        confidence,
        requiresAdminConfirm,
        lookupNotes: notes,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore lookup Wikidata.';
    return { status: 'error', message };
  }
}

export async function fetchCommonsExtMetadata(fileTitle: string): Promise<Record<string, string>> {
  const normalized = fileTitle.startsWith('File:') ? fileTitle : `File:${fileTitle}`;
  const params = new URLSearchParams({
    action: 'query',
    titles: normalized,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|mime|size',
    iiextmetadatafilter:
      'LicenseShortName|LicenseUrl|Artist|Credit|Attribution|UsageTerms|Copyrighted|License|ObjectName',
    format: 'json',
    origin: '*',
  });

  const payload = await fetchJson<{
    query?: {
      pages?: Record<
        string,
        {
          title?: string;
          imageinfo?: Array<{ url?: string; extmetadata?: Record<string, { value?: string }> }>;
        }
      >;
    };
  }>(buildWikimediaApiRequestUrl(COMMONS_API, params));

  const pages = payload.query?.pages ?? {};
  for (const page of Object.values(pages)) {
    const ext = page.imageinfo?.[0]?.extmetadata;
    if (!ext) continue;
    const flat: Record<string, string> = {};
    for (const [key, meta] of Object.entries(ext)) {
      if (typeof meta?.value === 'string') flat[key] = meta.value;
    }
    return flat;
  }
  return {};
}
