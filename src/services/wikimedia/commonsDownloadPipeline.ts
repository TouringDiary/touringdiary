import type { AssignmentEntityType } from '@/constants/governance';
import { IMAGE_VERIFICATION_STEP_DEFINITIONS } from '@/constants/imageVerificationSteps';
import { upsertEntityImageAssignmentFromSource } from '@/services/media/entityImageAssignmentWriteService';
import {
  type MediaAssetProvenancePatch,
  patchMediaAssetProvenance,
} from '@/services/media/mediaAssetService';
import { mf3MediaAssetsTable, mf3Rpc } from '@/services/media/mf3DbClient';
import { supabase } from '@/services/supabaseClient';
import { parseCommonsLicenseMetadata } from './commonsLicenseParser';
import { fetchCommonsExtMetadata, type WikidataP18Proposal } from './wikidataLookupService';

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
  | { ok: false; stage: string; message: string };

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

function extensionForMime(mime: string): string {
  switch (mime) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'jpg';
  }
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

type MaterializedMediaAsset = { id: string; createdThisRun: boolean };

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
    .select('id')
    .eq('storage_bucket', PUBLIC_BUCKET)
    .eq('storage_path', storagePath)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);
  const existingRecord = existing as { id?: string } | null;
  if (existingRecord?.id) {
    return { id: existingRecord.id, createdThisRun: false };
  }

  const insertPayload = {
    storage_bucket: PUBLIC_BUCKET,
    storage_path: storagePath,
    origin_type: 'wikimedia',
    generated_by_ai: false,
    is_placeholder: false,
    asset_status: assetStatus,
  } as const;
  const { data: inserted, error: insertError } = await mf3MediaAssetsTable()
    .insert(insertPayload)
    .select('id')
    .single();

  if (insertError) {
    const code = (insertError as { code?: string }).code;
    if (code === '23505') {
      const { data: raced, error: raceError } = await mf3MediaAssetsTable()
        .select('id')
        .eq('storage_bucket', PUBLIC_BUCKET)
        .eq('storage_path', storagePath)
        .maybeSingle();
      if (raceError) throw new Error(raceError.message);
      const racedRecord = raced as { id?: string } | null;
      if (racedRecord?.id) {
        return { id: racedRecord.id, createdThisRun: false };
      }
    }
    throw new Error(insertError.message);
  }
  const insertedRecord = inserted as { id?: string } | null;
  if (!insertedRecord?.id) {
    throw new Error('Inserimento media_assets Wikimedia senza id.');
  }
  return { id: insertedRecord.id, createdThisRun: true };
}

/**
 * Pipeline Wikidata/Commons post-conferma Admin: metadata → licenza → download → Storage → media_assets.
 */
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
  const ext = extensionForMime(downloaded.mime);
  const safeQid = proposal.qid.replace(/[^a-zA-Z0-9]/g, '');
  const safeFile = proposal.commonsFileTitle
    .replace(/^File:/i, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .slice(0, 80);

  const autoPath = license.isCcBy40AutoPathEligible && downloaded.formatConsistent;
  const storageFolder = autoPath ? WIKIMEDIA_VERIFIED_FOLDER : WIKIMEDIA_QUARANTINE_FOLDER;
  const storagePath = `${storageFolder}/${safeQid}/${contentHash.slice(0, 32)}_${safeFile}.${ext}`;

  let storageCreatedByThisRun = false;
  const { error: uploadError } = await supabase.storage
    .from(PUBLIC_BUCKET)
    .upload(storagePath, downloaded.blob, {
      cacheControl: '3600',
      upsert: false,
      contentType: downloaded.mime,
    });

  if (uploadError) {
    if (isStorageObjectAlreadyExistsError(uploadError)) {
      storageCreatedByThisRun = false;
    } else {
      return {
        ok: false,
        stage: 'storage_upload',
        message: uploadError.message,
      };
    }
  } else {
    storageCreatedByThisRun = true;
  }

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

    const markQueue = !autoPath;
    const verificationSteps = buildVerificationStepsFromLicense(license.stepOutcomes, downloaded);

    const { data: runId, error: runError } = await mf3Rpc<string>('record_image_verification_run', {
      p_media_asset_id: mediaAssetId,
      p_steps: verificationSteps,
      p_ai_summary: markQueue
        ? 'Import Wikimedia: licenza/provenienza non ammissibile al percorso automatico — coda verify.'
        : 'Import Wikimedia: CC BY 4.0 verificata su metadati Commons (checklist §6.1).',
      p_mark_verify_queue: markQueue,
    });

    if (runError) {
      throw new Error(runError.message);
    }

    if (autoPath && input.assignToEntity !== false) {
      const { data: transitionedStatus, error: transitionError } = await mf3Rpc<string>(
        'transition_media_asset_status',
        {
          p_media_asset_id: mediaAssetId,
          p_target_status: 'active',
          p_admin_rationale: 'Commons CC BY 4.0: auto-path post verification run (MF4).',
        },
      );
      if (transitionError) {
        throw new Error(
          `Transizione asset Wikimedia verificato fallita: ${transitionError.message}`,
        );
      }
      if (transitionedStatus !== 'active') {
        throw new Error(
          `Transizione asset Wikimedia: stato atteso active, ricevuto ${String(transitionedStatus)}.`,
        );
      }

      const entityTypeForAssignment: AssignmentEntityType = input.entity.entityType;

      const assignmentRole: 'primary' | 'gallery' =
        entityTypeForAssignment === 'poi' || entityTypeForAssignment === 'city'
          ? 'gallery'
          : (input.assignmentRole ?? 'primary');

      assignmentId = await upsertEntityImageAssignmentFromSource({
        entityType: entityTypeForAssignment,
        entityId: input.entity.entityId,
        cityId: input.entity.cityId,
        assignmentRole,
        source: {
          imageUrl: publicUrl,
          storageBucket: PUBLIC_BUCKET,
          storagePath,
          originType: 'wikimedia',
        },
      });
    }

    return {
      ok: true,
      mediaAssetId,
      assignmentId,
      publicUrl,
      storagePath,
      autoVerified: autoPath,
      verificationRunId: typeof runId === 'string' ? runId : null,
      queuedForAdminVerify: markQueue,
      message: markQueue
        ? 'Foto importata in quarantena/coda verifica — nessuna primary assignment creata.'
        : 'Foto CC BY 4.0 verificata importata e associata.',
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
