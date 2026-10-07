import type { AssignmentEntityType } from '@/constants/governance';
import { IMAGE_VERIFICATION_STEP_DEFINITIONS } from '@/constants/imageVerificationSteps';
import { loadLatestCanonicalVerificationRun } from '@/services/media/canonicalVerificationRun';
import { upsertEntityImageAssignmentFromSource } from '@/services/media/entityImageAssignmentWriteService';
import {
  type MediaAssetProvenancePatch,
  patchMediaAssetProvenance,
} from '@/services/media/mediaAssetService';
import { mf3MediaAssetsTable, mf3Rpc } from '@/services/media/mf3DbClient';
import { supabase } from '@/services/supabaseClient';
import { parseCommonsLicenseMetadata } from './commonsLicenseParser';
import { fetchCommonsExtMetadata, type WikidataP18Proposal } from './wikidataLookupService';
import {
  classifyWikimediaStorageContent,
  shouldAssignWikimediaAsset,
} from './wikimediaStorageCollision';
import { buildWikimediaStorageObjectPath } from './wikimediaStorageObjectPath';

const PUBLIC_BUCKET = 'public-media';
const WIKIMEDIA_VERIFIED_FOLDER = 'verified/wikimedia';
const WIKIMEDIA_QUARANTINE_FOLDER = 'wikimedia/quarantine';
const MAX_DOWNLOAD_BYTES = 12 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export type CommonsDownloadEntityTarget = {
  entityType: 'city_person' | 'poi' | 'patron' | 'city';
  entityId: string;
  cityId: string;
};

export type CommonsDownloadPipelineInput = {
  proposal: WikidataP18Proposal;
  entity: CommonsDownloadEntityTarget;
  /** Conferma esplicita Admin nel flusso manuale (WikidataConfirmModal). */
  adminConfirmedQid?: boolean;
  /**
   * Proposta validata dal percorso automatico (lookup + criteri prodotto).
   * Mutuamente esclusivo con adminConfirmedQid nel gate di ingresso.
   */
  autoValidatedProposal?: boolean;
  assignToEntity?: boolean;
  /**
   * Override ruolo solo per entità che ammettono primary (city_person/patron).
   * POI/City: policy pipeline impone sempre gallery.
   */
  assignmentRole?: 'primary' | 'gallery';
  /**
   * Import manuale Admin: se il path esiste, non caricare e restituire la decisione.
   * I chiamanti automatici omettono il flag e, se i byte coincidono, proseguono senza un secondo POST.
   */
  interactiveStorageDecision?: boolean;
  /** Scelta Admin dopo una decisione di collisione. Assente al primo tentativo. */
  storageResolution?: 'reuse_existing' | 'import_new';
};

export type WikimediaStorageObjectFacts = {
  storagePath: string;
  previewUrl: string;
  fileName: string;
  byteLength: number;
  mime: string;
  contentHash: string;
  assetId: string | null;
  assetStatus: string | null;
  originType: string | null;
  licenseCode: string | null;
  sourceUrl: string | null;
  verificationOutcome: string | null;
  verificationSummary: string | null;
};

export type CommonsDownloadPipelineResult =
  | {
      ok: true;
      mediaAssetId: string;
      assignmentId: string | null;
      publicUrl: string;
      storagePath: string;
      autoVerified: boolean;
      verificationRunId: string | null;
      queuedForAdminVerify: boolean;
      message: string;
    }
  | { ok: false; stage: string; message: string }
  | {
      ok: 'storage_decision';
      decision: 'identical' | 'different';
      existing: WikimediaStorageObjectFacts;
      incoming: WikimediaStorageObjectFacts;
    };

type DownloadEvidence = {
  blob: Blob;
  mime: string;
  declaredMime: string;
  magicMime: string | null;
  formatConsistent: boolean;
};

async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function sniffImageMime(buffer: ArrayBuffer): string | null {
  const u = new Uint8Array(buffer.slice(0, 12));
  if (u.length >= 2 && u[0] === 0xff && u[1] === 0xd8) return 'image/jpeg';
  if (
    u.length >= 8 &&
    u[0] === 0x89 &&
    u[1] === 0x50 &&
    u[2] === 0x4e &&
    u[3] === 0x47 &&
    u[4] === 0x0d &&
    u[5] === 0x0a &&
    u[6] === 0x1a &&
    u[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (
    u.length >= 12 &&
    u[0] === 0x52 &&
    u[1] === 0x49 &&
    u[2] === 0x46 &&
    u[3] === 0x46 &&
    u[8] === 0x57 &&
    u[9] === 0x45 &&
    u[10] === 0x42 &&
    u[11] === 0x50
  ) {
    return 'image/webp';
  }
  if (u.length >= 6 && u[0] === 0x47 && u[1] === 0x49 && u[2] === 0x46 && u[3] === 0x38) {
    return 'image/gif';
  }
  return null;
}

function buildVerificationStepsFromLicense(
  licenseSteps: ReturnType<typeof parseCommonsLicenseMetadata>['stepOutcomes'],
  download: DownloadEvidence,
) {
  const byCode = new Map(licenseSteps.map((s) => [s.stepCode, s]));
  return IMAGE_VERIFICATION_STEP_DEFINITIONS.map((def) => {
    if (def.code === 'file_identity') {
      const outcome = download.formatConsistent ? ('verified' as const) : ('doubt' as const);
      return {
        step_code: def.code,
        step_order: def.order,
        outcome,
        ai_rationale: download.formatConsistent
          ? 'Magic bytes coerenti con Content-Type HTTP e allowlist MIME.'
          : 'Evidenza limitata al Content-Type HTTP; magic bytes assenti o non coerenti.',
        evidence_json: {
          declaredMime: download.declaredMime,
          magicMime: download.magicMime,
          formatConsistent: download.formatConsistent,
        },
      };
    }
    const fromLicense = byCode.get(def.code as (typeof licenseSteps)[number]['stepCode']);
    if (fromLicense) {
      return {
        step_code: def.code,
        step_order: def.order,
        outcome: fromLicense.outcome,
        ai_rationale: fromLicense.rationale,
        evidence_json: fromLicense.evidence,
      };
    }
    return {
      step_code: def.code,
      step_order: def.order,
      outcome: 'not_applicable' as const,
      ai_rationale: 'Step non valutato automaticamente in import Wikimedia MF4.',
      evidence_json: {},
    };
  });
}

function isAllowedCommonsDirectImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    return host === 'upload.wikimedia.org' || host.endsWith('.upload.wikimedia.org');
  } catch {
    return false;
  }
}

const MAX_REDIRECT_HOPS = 5;

async function downloadCommonsImage(url: string): Promise<DownloadEvidence | null> {
  try {
    return await downloadCommonsImageInner(url);
  } catch {
    return null;
  }
}

async function downloadCommonsImageInner(url: string): Promise<DownloadEvidence | null> {
  let currentUrl = url;
  let response: Response | null = null;

  for (let hop = 0; hop <= MAX_REDIRECT_HOPS; hop += 1) {
    if (!isAllowedCommonsDirectImageUrl(currentUrl)) return null;
    response = await fetch(currentUrl, {
      signal: AbortSignal.timeout(20_000),
      redirect: 'manual',
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) return null;
      let nextUrl: string;
      try {
        nextUrl = new URL(location, currentUrl).href;
      } catch {
        return null;
      }
      if (!isAllowedCommonsDirectImageUrl(nextUrl)) return null;
      currentUrl = nextUrl;
      continue;
    }
    break;
  }

  if (!response?.ok) return null;
  if (!isAllowedCommonsDirectImageUrl(currentUrl)) return null;
  const declaredMime = (response.headers.get('content-type') ?? '')
    .split(';')[0]
    ?.trim()
    .toLowerCase();
  if (!declaredMime || !ALLOWED_MIME.has(declaredMime)) return null;
  const contentLengthHeader = response.headers.get('content-length');
  if (contentLengthHeader) {
    const contentLength = Number.parseInt(contentLengthHeader, 10);
    if (Number.isFinite(contentLength) && contentLength > MAX_DOWNLOAD_BYTES) return null;
  }
  const body = response.body;
  if (!body) return null;
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value || value.byteLength === 0) continue;
    total += value.byteLength;
    if (total > MAX_DOWNLOAD_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  if (total === 0) return null;
  const buffer = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const magicMime = sniffImageMime(buffer);
  const mime = magicMime ?? declaredMime;
  if (!ALLOWED_MIME.has(mime)) return null;
  const formatConsistent = magicMime !== null && magicMime === declaredMime;
  return {
    blob: new Blob([buffer], { type: mime }),
    mime,
    declaredMime,
    magicMime,
    formatConsistent,
  };
}

async function removeStoragePathQuiet(path: string): Promise<void> {
  const trimmed = path.trim();
  if (!trimmed) {
    throw new Error('Rimozione Storage: path vuoto.');
  }
  const { error } = await supabase.storage.from(PUBLIC_BUCKET).remove([trimmed]);
  if (error) {
    throw new Error(`Rimozione Storage fallita (${trimmed}): ${error.message}`);
  }
}

type MaterializedMediaAsset = {
  id: string;
  createdThisRun: boolean;
  wikimediaValidated: boolean;
};

async function removeMediaAssetQuiet(mediaAssetId: string): Promise<void> {
  const { data, error } = await mf3MediaAssetsTable().delete().eq('id', mediaAssetId).select('id');
  if (error) {
    throw new Error(`Rimozione media_assets fallita: ${error.message}`);
  }
  const rows = (data ?? []) as { id: string }[];
  if (rows.length === 0) {
    throw new Error(`Rimozione media_assets: nessuna riga eliminata (${mediaAssetId}).`);
  }
}

function isStorageObjectAlreadyExistsError(error: {
  message?: string;
  statusCode?: string | number;
}): boolean {
  const message = (error.message ?? '').toLowerCase();
  if (message.includes('already exists') || message.includes('duplicate')) {
    return true;
  }
  return String(error.statusCode ?? '') === '409';
}

type StoredWikimediaObject =
  | { status: 'absent' }
  | { status: 'present'; byteLength: number; mime: string; contentHash: string }
  | { status: 'error'; message: string };

type StorageTargetResolution =
  | { kind: 'ready'; storagePath: string; createdThisRun: boolean }
  | { kind: 'stop'; result: CommonsDownloadPipelineResult };

function storageFileName(storagePath: string): string {
  const slash = storagePath.lastIndexOf('/');
  return slash >= 0 ? storagePath.slice(slash + 1) : storagePath;
}

async function readStoredWikimediaObject(storagePath: string): Promise<StoredWikimediaObject> {
  const fileName = storageFileName(storagePath);
  const folder = storagePath.slice(0, Math.max(0, storagePath.length - fileName.length - 1));
  const { data, error } = await supabase.storage.from(PUBLIC_BUCKET).list(folder, {
    limit: 100,
    search: fileName,
  });
  if (error) return { status: 'error', message: error.message };
  const listed = (data ?? []) as { name?: string; metadata?: { mimetype?: string } | null }[];
  if (!listed.some((item) => item.name === fileName)) return { status: 'absent' };

  const { data: blob, error: downloadError } = await supabase.storage
    .from(PUBLIC_BUCKET)
    .download(storagePath);
  if (downloadError || !blob) {
    return {
      status: 'error',
      message: downloadError?.message ?? 'Lettura oggetto Storage fallita.',
    };
  }
  const buffer = await blob.arrayBuffer();
  const listedMime = listed.find((item) => item.name === fileName)?.metadata?.mimetype;
  return {
    status: 'present',
    byteLength: buffer.byteLength,
    mime: blob.type || listedMime || 'application/octet-stream',
    contentHash: await sha256Hex(buffer),
  };
}

async function loadStoredAssetFacts(
  storagePath: string,
  stored: Extract<StoredWikimediaObject, { status: 'present' }>,
): Promise<WikimediaStorageObjectFacts> {
  const { data: publicData } = supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(storagePath);
  const { data: asset, error: assetError } = await mf3MediaAssetsTable()
    .select('id, asset_status, origin_type, license_code, source_url')
    .eq('storage_bucket', PUBLIC_BUCKET)
    .eq('storage_path', storagePath)
    .maybeSingle();
  if (assetError) throw new Error(assetError.message);
  const row = asset as {
    id?: string;
    asset_status?: string;
    origin_type?: string;
    license_code?: string | null;
    source_url?: string | null;
  } | null;

  let verificationOutcome: string | null = null;
  let verificationSummary: string | null = null;
  if (row?.id) {
    const run = await loadLatestCanonicalVerificationRun(row.id);
    verificationOutcome = run?.overallOutcome ?? null;
    verificationSummary = run?.aiSummary ?? null;
  }

  return {
    storagePath,
    previewUrl: publicData.publicUrl,
    fileName: storageFileName(storagePath),
    byteLength: stored.byteLength,
    mime: stored.mime,
    contentHash: stored.contentHash,
    assetId: row?.id ?? null,
    assetStatus: row?.asset_status ?? null,
    originType: row?.origin_type ?? null,
    licenseCode: row?.license_code ?? null,
    sourceUrl: row?.source_url ?? null,
    verificationOutcome,
    verificationSummary,
  };
}

function incomingStorageFacts(input: {
  storagePath: string;
  previewUrl: string;
  fileName: string;
  byteLength: number;
  mime: string;
  contentHash: string;
  licenseCode: string | null;
  verificationOutcome: string | null;
  verificationSummary: string | null;
}): WikimediaStorageObjectFacts {
  return {
    storagePath: input.storagePath,
    previewUrl: input.previewUrl,
    fileName: input.fileName,
    byteLength: input.byteLength,
    mime: input.mime,
    contentHash: input.contentHash,
    assetId: null,
    assetStatus: null,
    originType: 'wikimedia',
    licenseCode: input.licenseCode,
    sourceUrl: null,
    verificationOutcome: input.verificationOutcome,
    verificationSummary: input.verificationSummary,
  };
}

async function uploadNewWikimediaObject(
  storagePath: string,
  blob: Blob,
  mime: string,
): Promise<{ created: boolean } | { error: string }> {
  const { error } = await supabase.storage.from(PUBLIC_BUCKET).upload(storagePath, blob, {
    cacheControl: '3600',
    upsert: false,
    contentType: mime,
  });
  if (!error) return { created: true };
  if (isStorageObjectAlreadyExistsError(error)) return { created: false };
  return { error: error.message };
}

async function storageDecisionResult(input: {
  storagePath: string;
  stored: Extract<StoredWikimediaObject, { status: 'present' }>;
  relation: 'identical' | 'different';
  incoming: WikimediaStorageObjectFacts;
}): Promise<StorageTargetResolution> {
  try {
    const existing = await loadStoredAssetFacts(input.storagePath, input.stored);
    return {
      kind: 'stop',
      result: {
        ok: 'storage_decision',
        decision: input.relation,
        existing,
        incoming: input.incoming,
      },
    };
  } catch (err) {
    return {
      kind: 'stop',
      result: {
        ok: false,
        stage: 'storage_lookup',
        message: err instanceof Error ? err.message : 'Lettura asset esistente fallita.',
      },
    };
  }
}

function collisionStop(): StorageTargetResolution {
  return {
    kind: 'stop',
    result: {
      ok: false,
      stage: 'storage_collision',
      message:
        'Il path Storage esiste già con un contenuto diverso. Nessuna sovrascrittura eseguita.',
    },
  };
}

async function placeWikimediaStorageObject(input: {
  canonicalPath: string;
  folder: string;
  qid: string;
  contentHash: string;
  commonsFileTitle: string;
  mime: string;
  blob: Blob;
  byteLength: number;
  previewUrl: string;
  licenseCode: string | null;
  verificationOutcome: string | null;
  verificationSummary: string | null;
  interactive: boolean;
  resolution?: 'reuse_existing' | 'import_new';
}): Promise<StorageTargetResolution> {
  const incoming = incomingStorageFacts({
    storagePath: input.canonicalPath,
    previewUrl: input.previewUrl,
    fileName: input.commonsFileTitle.replace(/^File:/i, ''),
    byteLength: input.byteLength,
    mime: input.mime,
    contentHash: input.contentHash,
    licenseCode: input.licenseCode,
    verificationOutcome: input.verificationOutcome,
    verificationSummary: input.verificationSummary,
  });

  const occupy = async (path: string): Promise<StorageTargetResolution> => {
    const uploaded = await uploadNewWikimediaObject(path, input.blob, input.mime);
    if ('error' in uploaded) {
      return {
        kind: 'stop',
        result: { ok: false, stage: 'storage_upload', message: uploaded.error },
      };
    }
    if (uploaded.created) return { kind: 'ready', storagePath: path, createdThisRun: true };

    const raced = await readStoredWikimediaObject(path);
    if (raced.status === 'error') {
      return {
        kind: 'stop',
        result: { ok: false, stage: 'storage_lookup', message: raced.message },
      };
    }
    if (raced.status !== 'present') {
      return {
        kind: 'stop',
        result: {
          ok: false,
          stage: 'storage_upload',
          message: 'Upload rifiutato e oggetto non trovato dopo il conflitto.',
        },
      };
    }
    const relation = classifyWikimediaStorageContent(input.contentHash, raced.contentHash);
    if (relation === 'different') {
      return input.interactive
        ? storageDecisionResult({
            storagePath: path,
            stored: raced,
            relation,
            incoming,
          })
        : collisionStop();
    }
    if (input.interactive && !input.resolution) {
      return storageDecisionResult({
        storagePath: path,
        stored: raced,
        relation: 'identical',
        incoming,
      });
    }
    return { kind: 'ready', storagePath: path, createdThisRun: false };
  };

  const stored = await readStoredWikimediaObject(input.canonicalPath);
  if (stored.status === 'error') {
    return {
      kind: 'stop',
      result: { ok: false, stage: 'storage_lookup', message: stored.message },
    };
  }
  const relation = classifyWikimediaStorageContent(
    input.contentHash,
    stored.status === 'present' ? stored.contentHash : null,
  );

  if (input.resolution === 'reuse_existing') {
    if (stored.status !== 'present') {
      return {
        kind: 'stop',
        result: {
          ok: false,
          stage: 'storage_lookup',
          message: "L'oggetto già presente non è più in Storage. Nessuna modifica eseguita.",
        },
      };
    }
    if (relation === 'different') {
      try {
        const existing = await loadStoredAssetFacts(input.canonicalPath, stored);
        const { data: publicData } = supabase.storage
          .from(PUBLIC_BUCKET)
          .getPublicUrl(input.canonicalPath);
        return {
          kind: 'stop',
          result: {
            ok: true,
            mediaAssetId: existing.assetId ?? '',
            assignmentId: null,
            publicUrl: publicData.publicUrl,
            storagePath: input.canonicalPath,
            autoVerified: false,
            verificationRunId: null,
            queuedForAdminVerify: false,
            message:
              'Asset già presente conservato. I byte e la provenienza non sono stati modificati.',
          },
        };
      } catch (err) {
        return {
          kind: 'stop',
          result: {
            ok: false,
            stage: 'storage_lookup',
            message: err instanceof Error ? err.message : 'Lettura asset esistente fallita.',
          },
        };
      }
    }
    return { kind: 'ready', storagePath: input.canonicalPath, createdThisRun: false };
  }

  if (
    relation === 'different' &&
    stored.status === 'present' &&
    input.resolution === 'import_new'
  ) {
    const alternatePath = buildWikimediaStorageObjectPath({
      folder: input.folder,
      qid: input.qid,
      contentHash: input.contentHash,
      commonsFileTitle: input.commonsFileTitle,
      mime: input.mime,
      contentHashLength: 64,
    });
    const alternate = await readStoredWikimediaObject(alternatePath);
    if (alternate.status === 'error') {
      return {
        kind: 'stop',
        result: { ok: false, stage: 'storage_lookup', message: alternate.message },
      };
    }
    if (alternate.status === 'present') {
      const alternateRelation = classifyWikimediaStorageContent(
        input.contentHash,
        alternate.contentHash,
      );
      if (alternateRelation === 'different') return collisionStop();
      return { kind: 'ready', storagePath: alternatePath, createdThisRun: false };
    }
    return occupy(alternatePath);
  }

  if (relation === 'identical' && stored.status === 'present') {
    if (input.interactive && input.resolution !== 'import_new') {
      return storageDecisionResult({
        storagePath: input.canonicalPath,
        stored,
        relation: 'identical',
        incoming,
      });
    }
    return { kind: 'ready', storagePath: input.canonicalPath, createdThisRun: false };
  }

  if (relation === 'different' && stored.status === 'present') {
    if (input.interactive) {
      return storageDecisionResult({
        storagePath: input.canonicalPath,
        stored,
        relation: 'different',
        incoming,
      });
    }
    return collisionStop();
  }

  return occupy(input.canonicalPath);
}

/** Errori di compensazione dopo fallimento operazione primaria (stringhe già contestualizzate). */
async function rollbackWikimediaPersistence(args: {
  storagePath: string;
  mediaAssetId: string | null;
  deleteMediaAsset: boolean;
  deleteStorage: boolean;
}): Promise<string[]> {
  const errors: string[] = [];
  if (!args.deleteMediaAsset && !args.deleteStorage) {
    return errors;
  }
  if (args.deleteMediaAsset && args.mediaAssetId) {
    try {
      await removeMediaAssetQuiet(args.mediaAssetId);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      errors.push(`media_assets (${args.mediaAssetId}): ${detail}`);
    }
  }
  if (args.deleteStorage) {
    try {
      await removeStoragePathQuiet(args.storagePath);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      errors.push(`storage (${args.storagePath}): ${detail}`);
    }
  }
  return errors;
}

/** URL HTTPS pagina descrittiva Commons (wiki/File:…), senza Markdown. */
export function buildCommonsFileDescriptionPageUrl(fileTitle: string): string {
  const trimmed = fileTitle.trim();
  const withPrefix = trimmed.startsWith('File:') ? trimmed : `File:${trimmed}`;
  const wikiPathTitle = withPrefix.replace(/ /g, '_');
  if (wikiPathTitle.includes('[') || wikiPathTitle.includes('](')) {
    throw new Error('Titolo file Commons non valido (Markdown rilevato).');
  }
  const parsed = new URL(
    `/wiki/${encodeURIComponent(wikiPathTitle)}`,
    'https://commons.wikimedia.org',
  );
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'commons.wikimedia.org') {
    throw new Error('URL pagina descrittiva Commons non valida.');
  }
  if (parsed.href.includes('[') || parsed.href.includes('](')) {
    throw new Error('URL pagina descrittiva Commons contiene Markdown.');
  }
  return parsed.href;
}

async function materializeMediaAssetForPath(
  storagePath: string,
  assetStatus: 'active' | 'suspended',
): Promise<MaterializedMediaAsset> {
  const { data: existing, error: existingError } = await mf3MediaAssetsTable()
    .select('id, wikimedia_validated')
    .eq('storage_bucket', PUBLIC_BUCKET)
    .eq('storage_path', storagePath)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);
  const existingRecord = existing as { id?: string; wikimedia_validated?: boolean | null } | null;
  if (existingRecord?.id) {
    return {
      id: existingRecord.id,
      createdThisRun: false,
      wikimediaValidated: existingRecord.wikimedia_validated === true,
    };
  }

  const insertPayload = {
    storage_bucket: PUBLIC_BUCKET,
    storage_path: storagePath,
    origin_type: 'wikimedia',
    generated_by_ai: false,
    is_placeholder: false,
    asset_status: assetStatus,
    wikimedia_validated: false,
  } as const;
  const { data: inserted, error: insertError } = await mf3MediaAssetsTable()
    .insert(insertPayload)
    .select('id, wikimedia_validated')
    .single();

  if (insertError) {
    const code = (insertError as { code?: string }).code;
    if (code === '23505') {
      const { data: raced, error: raceError } = await mf3MediaAssetsTable()
        .select('id, wikimedia_validated')
        .eq('storage_bucket', PUBLIC_BUCKET)
        .eq('storage_path', storagePath)
        .maybeSingle();
      if (raceError) throw new Error(raceError.message);
      const racedRecord = raced as { id?: string; wikimedia_validated?: boolean | null } | null;
      if (racedRecord?.id) {
        return {
          id: racedRecord.id,
          createdThisRun: false,
          wikimediaValidated: racedRecord.wikimedia_validated === true,
        };
      }
    }
    throw new Error(insertError.message);
  }
  const insertedRecord = inserted as { id?: string } | null;
  if (!insertedRecord?.id) {
    throw new Error('Inserimento media_assets Wikimedia senza id.');
  }
  return { id: insertedRecord.id, createdThisRun: true, wikimediaValidated: false };
}

/**
 * Pipeline Wikidata/Commons post-conferma Admin: metadata → licenza → download → Storage → media_assets.
 */
export function asCommonsDownloadImported(
  result: CommonsDownloadPipelineResult,
):
  | Extract<CommonsDownloadPipelineResult, { ok: true }>
  | { failed: { stage: string; message: string } } {
  if (result.ok === true) return result;
  if (result.ok === false) return { failed: { stage: result.stage, message: result.message } };
  return {
    failed: {
      stage: 'storage_decision',
      message:
        result.decision === 'identical'
          ? 'Questa immagine è già presente in archivio.'
          : 'Il path Storage esiste già con un contenuto diverso. Nessuna sovrascrittura eseguita.',
    },
  };
}

function wikimediaImportMessage(input: {
  adminReuse: boolean;
  assigned: boolean;
  autoPath: boolean;
}): string {
  if (input.autoPath) {
    if (input.assigned) {
      return 'Foto importata e associata sul percorso automatico. Resta DA VALIDARE: l’import non convalida il file e non accende il toggle pubblico.';
    }
    return 'Import sul percorso automatico. Resta DA VALIDARE: l’import non convalida il file e non accende il toggle pubblico.';
  }
  if (input.adminReuse && input.assigned) {
    return 'Asset già presente collegato. Resta DA VALIDARE: i controlli automatici non convalidano la foto.';
  }
  if (input.assigned) {
    return 'Foto importata e associata. Resta DA VALIDARE finché un Admin non la valida.';
  }
  return 'Foto importata. Resta DA VALIDARE e non è pubblicabile finché un Admin non la valida.';
}

async function assignWikimediaAssetToEntity(input: {
  entity: CommonsDownloadEntityTarget;
  assignmentRole?: 'primary' | 'gallery';
  publicUrl: string;
  storagePath: string;
}): Promise<string> {
  const entityTypeForAssignment: AssignmentEntityType = input.entity.entityType;
  const assignmentRole: 'primary' | 'gallery' =
    entityTypeForAssignment === 'poi' || entityTypeForAssignment === 'city'
      ? 'gallery'
      : (input.assignmentRole ?? 'primary');
  return upsertEntityImageAssignmentFromSource({
    entityType: entityTypeForAssignment,
    entityId: input.entity.entityId,
    cityId: input.entity.cityId,
    assignmentRole,
    source: {
      imageUrl: input.publicUrl,
      storageBucket: PUBLIC_BUCKET,
      storagePath: input.storagePath,
      originType: 'wikimedia',
    },
  });
}

export async function runCommonsDownloadPipeline(
  input: CommonsDownloadPipelineInput,
): Promise<CommonsDownloadPipelineResult> {
  const adminConfirmed = input.adminConfirmedQid === true;
  const autoValidated = input.autoValidatedProposal === true;
  if (adminConfirmed === autoValidated) {
    return {
      ok: false,
      stage: 'import_authorization',
      message: adminConfirmed
        ? 'Specificare solo adminConfirmedQid oppure autoValidatedProposal, non entrambi.'
        : 'Autorizzazione import obbligatoria: conferma Admin Wikidata o proposta auto-validata.',
    };
  }

  const proposal = input.proposal;
  if (!proposal.commonsFileTitle.trim()) {
    return { ok: false, stage: 'commons', message: 'Titolo file Commons assente.' };
  }

  let extMetadata: Record<string, string>;
  try {
    extMetadata = await fetchCommonsExtMetadata(proposal.commonsFileTitle);
  } catch (err) {
    return {
      ok: false,
      stage: 'commons_metadata',
      message: err instanceof Error ? err.message : 'Recupero metadati Commons fallito.',
    };
  }

  let commonsPageUrl: string;
  try {
    commonsPageUrl = buildCommonsFileDescriptionPageUrl(proposal.commonsFileTitle);
  } catch (err) {
    return {
      ok: false,
      stage: 'commons_page_url',
      message: err instanceof Error ? err.message : 'URL pagina descrittiva Commons non valida.',
    };
  }

  const license = parseCommonsLicenseMetadata(
    proposal.commonsFileTitle,
    extMetadata,
    commonsPageUrl,
  );

  const imageUrl = proposal.commonsFileUrl?.trim() ?? '';
  if (!imageUrl) {
    return {
      ok: false,
      stage: 'commons_url',
      message: 'URL immagine Commons non disponibile.',
    };
  }
  if (!isAllowedCommonsDirectImageUrl(imageUrl)) {
    return {
      ok: false,
      stage: 'commons_url',
      message: 'URL immagine Commons non valida (HTTPS upload.wikimedia.org richiesto).',
    };
  }

  const downloaded = await downloadCommonsImage(imageUrl);
  if (!downloaded) {
    return {
      ok: false,
      stage: 'download',
      message: 'Download immagine fallito (HTTP, MIME, dimensione o contenuto non valido).',
    };
  }

  const hashBuffer = await downloaded.blob.arrayBuffer();
  const contentHash = await sha256Hex(hashBuffer);

  const autoPath = license.isCcBy40AutoPathEligible && downloaded.formatConsistent;
  const storageFolder = autoPath ? WIKIMEDIA_VERIFIED_FOLDER : WIKIMEDIA_QUARANTINE_FOLDER;
  let storagePath = buildWikimediaStorageObjectPath({
    folder: storageFolder,
    qid: proposal.qid,
    contentHash,
    commonsFileTitle: proposal.commonsFileTitle,
    mime: downloaded.mime,
  });

  const placed = await placeWikimediaStorageObject({
    canonicalPath: storagePath,
    folder: storageFolder,
    qid: proposal.qid,
    contentHash,
    commonsFileTitle: proposal.commonsFileTitle,
    mime: downloaded.mime,
    blob: downloaded.blob,
    byteLength: hashBuffer.byteLength,
    previewUrl: imageUrl,
    licenseCode: license.normalizedLicenseCode,
    verificationOutcome: license.overallLicenseOutcome,
    verificationSummary: license.blockingReasons.join('; ') || null,
    interactive: input.interactiveStorageDecision === true,
    resolution: input.storageResolution,
  });
  if (placed.kind === 'stop') {
    const stopped = placed.result;
    if (
      stopped.ok === true &&
      input.storageResolution === 'reuse_existing' &&
      input.assignToEntity !== false &&
      !stopped.assignmentId
    ) {
      try {
        const assignmentId = await assignWikimediaAssetToEntity({
          entity: input.entity,
          assignmentRole: input.assignmentRole,
          publicUrl: stopped.publicUrl,
          storagePath: stopped.storagePath,
        });
        return {
          ...stopped,
          assignmentId,
          message: wikimediaImportMessage({
            adminReuse: true,
            assigned: true,
            autoPath: false,
          }),
        };
      } catch (err) {
        return {
          ok: false,
          stage: 'assignment',
          message: err instanceof Error ? err.message : 'Assegnazione asset esistente fallita.',
        };
      }
    }
    return stopped;
  }
  storagePath = placed.storagePath;
  const storageCreatedByThisRun = placed.createdThisRun;

  const {
    data: { publicUrl },
  } = supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(storagePath);

  if (!publicUrl) {
    if (storageCreatedByThisRun) {
      await removeStoragePathQuiet(storagePath);
    }
    return { ok: false, stage: 'storage_url', message: 'URL pubblico Storage non generato.' };
  }

  let assignmentId: string | null = null;
  let mediaAssetId: string | null = null;
  let createdMediaAssetThisRun = false;

  try {
    const materialized = await materializeMediaAssetForPath(storagePath, 'suspended');
    mediaAssetId = materialized.id;
    createdMediaAssetThisRun = materialized.createdThisRun;

    const provenancePatch: MediaAssetProvenancePatch = {
      sourceRef: proposal.qid,
      contentHash,
      licenseCode: license.normalizedLicenseCode,
      licenseUrl: license.licenseUrl,
      sourceUrl: commonsPageUrl,
      attributionText: license.attributionText,
      copyrightNotice: license.copyrightNotice,
      authorName: license.authorName,
      rightsHolder: license.rightsHolder,
      retrievedAt: new Date().toISOString(),
      metadata: {
        wikidata_qid: proposal.qid,
        commons_file: proposal.commonsFileTitle,
        content_hash: contentHash,
        license_outcome: license.overallLicenseOutcome,
        blocking_reasons: license.blockingReasons,
        lookup_notes: proposal.lookupNotes,
        storage_quarantine: !autoPath,
        commons_image_url: imageUrl,
      },
    };

    await patchMediaAssetProvenance(mediaAssetId, provenancePatch);

    const adminReuse = input.storageResolution === 'reuse_existing';
    const assignAsset = shouldAssignWikimediaAsset({
      autoPath,
      assignToEntity: input.assignToEntity !== false,
      adminReuse,
    });

    if (materialized.wikimediaValidated) {
      if (assignAsset) {
        assignmentId = await assignWikimediaAssetToEntity({
          entity: input.entity,
          assignmentRole: input.assignmentRole,
          publicUrl,
          storagePath,
        });
      }
      return {
        ok: true,
        mediaAssetId,
        assignmentId,
        publicUrl,
        storagePath,
        autoVerified: true,
        verificationRunId: null,
        queuedForAdminVerify: false,
        message:
          'File Wikimedia già validato. Questo import non modifica la validazione né il toggle pubblico.',
      };
    }

    const verificationSteps = buildVerificationStepsFromLicense(license.stepOutcomes, downloaded);

    const { data: runId, error: runError } = await mf3Rpc<string>('record_image_verification_run', {
      p_media_asset_id: mediaAssetId,
      p_steps: verificationSteps,
      p_ai_summary: autoPath
        ? 'Import Wikimedia sul percorso automatico. Il file resta non validato, fuori dalla coda verify_ai_image.'
        : 'Import Wikimedia: percorso automatico non completo. Resta DA VALIDARE, fuori dalla coda verify_ai_image.',
      p_mark_verify_queue: false,
    });

    if (runError) {
      throw new Error(runError.message);
    }

    if (assignAsset) {
      assignmentId = await assignWikimediaAssetToEntity({
        entity: input.entity,
        assignmentRole: input.assignmentRole,
        publicUrl,
        storagePath,
      });
    }

    return {
      ok: true,
      mediaAssetId,
      assignmentId,
      publicUrl,
      storagePath,
      autoVerified: false,
      verificationRunId: typeof runId === 'string' ? runId : null,
      queuedForAdminVerify: false,
      message: wikimediaImportMessage({
        adminReuse,
        assigned: assignmentId !== null,
        autoPath,
      }),
    };
  } catch (err) {
    const primaryMessage =
      err instanceof Error ? err.message : 'Persistenza asset Wikimedia fallita.';
    const rollbackErrors = await rollbackWikimediaPersistence({
      storagePath,
      mediaAssetId,
      deleteMediaAsset: createdMediaAssetThisRun,
      deleteStorage: storageCreatedByThisRun && createdMediaAssetThisRun,
    });
    const message =
      rollbackErrors.length > 0
        ? `Operazione primaria fallita: ${primaryMessage} | Compensazione rollback incompleta: ${rollbackErrors.join('; ')}`
        : primaryMessage;
    if (rollbackErrors.length > 0) {
      console.error('[commonsDownloadPipeline] rollback parziale:', rollbackErrors);
    }
    return {
      ok: false,
      stage: 'persistence',
      message,
    };
  }
}
