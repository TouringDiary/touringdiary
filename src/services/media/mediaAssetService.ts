import {
  type ImageAssetStatusDb,
  isImageAssetStatusDb,
  MEDIA_ORIGIN_TYPE_DB_VALUES,
  type MediaOriginTypeDb,
  parseImageAssetStatusDb,
} from '@/constants/governance';
import { mf2EntityImageAssignmentsTable } from '@/services/reports/mf2DbClient';
import { parseStorageLocationFromPublicUrl } from '@/utils/storagePathFromPublicUrl';
import { upsertEntityImageAssignmentFromSource } from './entityImageAssignmentWriteService';
import { mf3MediaAssetsTable, mf3Rpc } from './mf3DbClient';

/** Bucket ammesso per portrait AI registrati via registerAiGeneratedPortraitAsset. */
const AI_PORTRAIT_PUBLIC_BUCKET = 'public-media';

export type MediaAssetProvenancePatch = {
  sourceRef?: string | null;
  contentHash?: string | null;
  licenseCode?: string | null;
  licenseUrl?: string | null;
  sourceUrl?: string | null;
  attributionText?: string | null;
  copyrightNotice?: string | null;
  authorName?: string | null;
  rightsHolder?: string | null;
  retrievedAt?: string | null;
  metadata?: Record<string, unknown>;
};

export type RegisterAiPortraitAssetInput = {
  publicUrl: string;
  entityType: 'city_person' | 'poi' | 'patron';
  entityId: string;
  cityId: string;
  sourceRef?: string | null;
};

/** Provenance runtime: valori DB canonici/legacy o assenza/non riconoscimento (≠ colonna DB). */
type MediaAssetOriginRuntime = MediaOriginTypeDb | 'unknown';

type MediaAssetRow = {
  id: string;
  storage_bucket: string;
  storage_path: string;
  origin_type: MediaAssetOriginRuntime;
  generated_by_ai: boolean;
  is_placeholder: boolean;
  asset_status: ImageAssetStatusDb;
  license_code: string | null;
  license_verified_at: string | null;
};

function normalizeMediaAssetOriginRuntime(raw: unknown): MediaAssetOriginRuntime {
  if (typeof raw !== 'string') return 'unknown';
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return 'unknown';
  if ((MEDIA_ORIGIN_TYPE_DB_VALUES as readonly string[]).includes(normalized)) {
    return normalized as MediaOriginTypeDb;
  }
  return 'unknown';
}

type AssignmentMediaAssetIdRow = {
  media_asset_id: string | null;
};

function isAssignmentMediaAssetIdRow(value: unknown): value is AssignmentMediaAssetIdRow {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return row.media_asset_id === null || typeof row.media_asset_id === 'string';
}

/**
 * Lookup post RPC assignment: `entity_image_assignments` non è nel Database Supabase generato
 * (`src/types/supabase.ts`); `mf2EntityImageAssignmentsTable()` espone solo un bridge runtime
 * (`mf2DbClient.ts`). Il typing del client può restringere `data` a `never` — correzione a monte
 * (schema/tipi), non cast locali (`as any` / `as unknown as …`) in questo servizio.
 */
function readAssignmentMediaAssetId(value: unknown): string {
  if (!isAssignmentMediaAssetIdRow(value)) return '';
  return typeof value.media_asset_id === 'string' ? value.media_asset_id.trim() : '';
}

/**
 * Registra metadata AI su media_assets + assignment (post-upload Storage).
 * Fail-closed: errori propagati; nessun asset orfano silenzioso oltre il file Storage già caricato.
 */
export async function registerAiGeneratedPortraitAsset(
  input: RegisterAiPortraitAssetInput,
): Promise<{ mediaAssetId: string; assignmentId: string }> {
  const url = input.publicUrl.trim();
  if (!url) {
    throw new Error('registerAiGeneratedPortraitAsset: URL pubblico assente.');
  }

  const parsed = parseStorageLocationFromPublicUrl(url);
  if (!parsed?.storageBucket || !parsed.storagePath) {
    throw new Error(
      'registerAiGeneratedPortraitAsset: impossibile ricavare bucket/path public-media dalla URL.',
    );
  }
  if (parsed.storageBucket !== AI_PORTRAIT_PUBLIC_BUCKET) {
    throw new Error(
      `registerAiGeneratedPortraitAsset: bucket non ammesso (${parsed.storageBucket}); atteso ${AI_PORTRAIT_PUBLIC_BUCKET}.`,
    );
  }
  const assignmentId = await upsertEntityImageAssignmentFromSource({
    entityType: input.entityType,
    entityId: input.entityId,
    cityId: input.cityId,
    assignmentRole: 'primary',
    source: {
      imageUrl: url,
      storageBucket: parsed.storageBucket,
      storagePath: parsed.storagePath,
      originType: 'ai',
    },
  });

  const { data: assignmentRow, error: assignmentLookupError } =
    await mf2EntityImageAssignmentsTable()
      .select('media_asset_id')
      .eq('id', assignmentId)
      .maybeSingle();

  if (assignmentLookupError) {
    throw new Error(`Lookup assignment post RPC fallito: ${assignmentLookupError.message}`);
  }

  const mediaAssetId = readAssignmentMediaAssetId(assignmentRow);
  if (!mediaAssetId) {
    throw new Error('media_asset_id assente sull assignment dopo RPC AI.');
  }

  const patch: Record<string, unknown> = {
    generated_by_ai: true,
    origin_type: 'ai',
    is_placeholder: false,
    source_ref: input.sourceRef?.trim() ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await mf3MediaAssetsTable().update(patch).eq('id', mediaAssetId);
  if (updateError) {
    throw new Error(`Aggiornamento provenance AI fallito: ${updateError.message}`);
  }

  return { mediaAssetId, assignmentId };
}

export async function patchMediaAssetProvenance(
  mediaAssetId: string,
  patch: MediaAssetProvenancePatch,
): Promise<void> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.sourceRef !== undefined) payload.source_ref = patch.sourceRef;
  if (patch.contentHash !== undefined) payload.content_hash = patch.contentHash;
  if (patch.licenseCode !== undefined) payload.license_code = patch.licenseCode;
  if (patch.licenseUrl !== undefined) payload.license_url = patch.licenseUrl;
  if (patch.sourceUrl !== undefined) payload.source_url = patch.sourceUrl;
  if (patch.attributionText !== undefined) payload.attribution_text = patch.attributionText;
  if (patch.copyrightNotice !== undefined) payload.copyright_notice = patch.copyrightNotice;
  if (patch.authorName !== undefined) payload.author_name = patch.authorName;
  if (patch.rightsHolder !== undefined) payload.rights_holder = patch.rightsHolder;
  if (patch.retrievedAt !== undefined) payload.retrieved_at = patch.retrievedAt;
  if (patch.metadata !== undefined) {
    payload.metadata = patch.metadata;
  }

  const { error } = await mf3MediaAssetsTable().update(payload).eq('id', mediaAssetId);
  if (error) {
    throw new Error(`Patch provenance media_asset fallita: ${error.message}`);
  }
}

export async function fetchMediaAssetsByIds(ids: string[]): Promise<Map<string, MediaAssetRow>> {
  const unique = [...new Set(ids.filter((id) => id.trim().length > 0))];
  const result = new Map<string, MediaAssetRow>();
  if (unique.length === 0) return result;

  const { data, error } = await mf3MediaAssetsTable()
    .select(
      'id, storage_bucket, storage_path, origin_type, generated_by_ai, is_placeholder, asset_status, license_code, license_verified_at',
    )
    .in('id', unique);

  if (error) {
    throw new Error(`Lettura media_assets fallita: ${error.message}`);
  }

  for (const row of data ?? []) {
    const parsed = parseMediaAssetRow(row);
    if (parsed) {
      result.set(parsed.id, parsed);
    }
  }
  return result;
}

function parseMediaAssetRow(value: unknown): MediaAssetRow | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const id = typeof row.id === 'string' ? row.id.trim() : '';
  const storageBucket = typeof row.storage_bucket === 'string' ? row.storage_bucket.trim() : '';
  const storagePath = typeof row.storage_path === 'string' ? row.storage_path.trim() : '';
  if (!id || !storageBucket || !storagePath) return null;
  const originType = normalizeMediaAssetOriginRuntime(row.origin_type);
  if (typeof row.generated_by_ai !== 'boolean' || typeof row.is_placeholder !== 'boolean') {
    return null;
  }
  const assetStatusRaw = typeof row.asset_status === 'string' ? row.asset_status : '';
  if (!isImageAssetStatusDb(assetStatusRaw)) return null;
  const assetStatus = parseImageAssetStatusDb(assetStatusRaw);
  const licenseCode =
    row.license_code === null || typeof row.license_code === 'string' ? row.license_code : null;
  const licenseVerifiedAt =
    row.license_verified_at === null || typeof row.license_verified_at === 'string'
      ? row.license_verified_at
      : null;
  return {
    id,
    storage_bucket: storageBucket,
    storage_path: storagePath,
    origin_type: originType,
    generated_by_ai: row.generated_by_ai,
    is_placeholder: row.is_placeholder,
    asset_status: assetStatus,
    license_code: licenseCode,
    license_verified_at: licenseVerifiedAt,
  };
}

export type AiVerifyQueueAssignmentUsage = {
  assignmentId: string;
  entityType: string;
  entityId: string;
  cityId: string;
  cityName: string | null;
  entityLabel: string | null;
  continent: string | null;
  nation: string | null;
};

export type AiVerifyQueueRow = {
  mediaAssetId: string;
  storageBucket: string;
  storagePath: string;
  originType: string;
  generatedByAi: boolean;
  isPlaceholder: boolean;
  assetStatus: ImageAssetStatusDb;
  licenseCode: string | null;
  sourceUrl: string | null;
  entityType: string;
  entityId: string;
  cityId: string;
  cityName: string;
  continent: string | null;
  nation: string | null;
  adminRegion: string | null;
  zone: string | null;
  entityLabel: string | null;
  latestRunId: string | null;
  latestAiSummary: string | null;
  blockingStepCode: string | null;
  currentAssignments: AiVerifyQueueAssignmentUsage[];
};

type AiVerifyQueueRowDb = {
  media_asset_id: string;
  storage_bucket: string;
  storage_path: string;
  origin_type: string;
  generated_by_ai: boolean;
  is_placeholder: boolean;
  asset_status: ImageAssetStatusDb;
  license_code: string | null;
  source_url: string | null;
  entity_type: string;
  entity_id: string;
  city_id: string;
  city_name: string;
  continent: string | null;
  nation: string | null;
  admin_region: string | null;
  zone: string | null;
  entity_label: string | null;
  latest_run_id: string | null;
  latest_ai_summary: string | null;
  blocking_step_code: string | null;
  current_assignments: unknown;
};

function parseCurrentAssignments(raw: unknown): AiVerifyQueueAssignmentUsage[] {
  if (!Array.isArray(raw)) return [];
  const usages: AiVerifyQueueAssignmentUsage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const assignmentId = typeof row.assignment_id === 'string' ? row.assignment_id : '';
    const entityType = typeof row.entity_type === 'string' ? row.entity_type : '';
    const entityId = typeof row.entity_id === 'string' ? row.entity_id : '';
    const cityId = typeof row.city_id === 'string' ? row.city_id : '';
    if (!assignmentId || !entityType || !entityId || !cityId) continue;
    usages.push({
      assignmentId,
      entityType,
      entityId,
      cityId,
      cityName: typeof row.city_name === 'string' ? row.city_name : null,
      entityLabel: typeof row.entity_label === 'string' ? row.entity_label : null,
      continent: typeof row.continent === 'string' ? row.continent : null,
      nation: typeof row.nation === 'string' ? row.nation : null,
    });
  }
  return usages;
}

function mapQueueRow(row: AiVerifyQueueRowDb): AiVerifyQueueRow {
  return {
    mediaAssetId: row.media_asset_id,
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    originType: row.origin_type,
    generatedByAi: row.generated_by_ai,
    isPlaceholder: row.is_placeholder,
    assetStatus: row.asset_status,
    licenseCode: row.license_code,
    sourceUrl: row.source_url,
    entityType: row.entity_type,
    entityId: row.entity_id,
    cityId: row.city_id,
    cityName: row.city_name,
    continent: row.continent,
    nation: row.nation,
    adminRegion: row.admin_region,
    zone: row.zone,
    entityLabel: row.entity_label,
    latestRunId: row.latest_run_id,
    latestAiSummary: row.latest_ai_summary,
    blockingStepCode: row.blocking_step_code,
    currentAssignments: parseCurrentAssignments(row.current_assignments),
  };
}

export async function listAiVerifyQueue(input: {
  entityType?: string | null;
  continent?: string | null;
  nation?: string | null;
  cityId?: string | null;
  limit?: number;
  offset?: number;
}): Promise<AiVerifyQueueRow[]> {
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
  const offset = Math.max(input.offset ?? 0, 0);
  const { data, error } = await mf3Rpc<AiVerifyQueueRowDb[]>('list_ai_verify_queue', {
    p_entity_type: input.entityType?.trim() || null,
    p_continent: input.continent?.trim() || null,
    p_nation: input.nation?.trim() || null,
    p_city_id: input.cityId?.trim() || null,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) {
    throw new Error(`Lista coda verify AI fallita: ${error.message}`);
  }
  return (data ?? []).map(mapQueueRow);
}

export async function getAiVerifyQueueCounts(): Promise<{
  total: number;
  byEntityType: Record<string, number>;
}> {
  const { data, error } = await mf3Rpc<{ total: number; by_entity_type: Record<string, number> }>(
    'get_ai_verify_queue_counts',
    {},
  );
  if (error) {
    throw new Error(`Conteggio coda verify AI fallito: ${error.message}`);
  }
  const payload = data ?? { total: 0, by_entity_type: {} };
  return {
    total: Number(payload.total ?? 0),
    byEntityType: payload.by_entity_type ?? {},
  };
}

export function mapOriginTypeToDisplay(
  origin: string | null | undefined,
): MediaOriginTypeDb | 'unknown' {
  const normalized = (origin ?? '').trim().toLowerCase();
  if (!normalized) return 'unknown';
  if ((MEDIA_ORIGIN_TYPE_DB_VALUES as readonly string[]).includes(normalized)) {
    return normalized as MediaOriginTypeDb;
  }
  return 'unknown';
}
