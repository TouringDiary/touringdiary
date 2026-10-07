import {
  type ImageAssetStatusDb,
  isImageAssetStatusDb,
  MEDIA_ORIGIN_TYPE_DB_VALUES,
  type MediaOriginTypeDb,
  parseImageAssetStatusDb,
} from '@/constants/governance';
import { mf3MediaAssetsTable, mf3Rpc } from './mf3DbClient';

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

/** Provenance runtime: valore DB canonico oppure null se assente/non riconosciuto. */
export type MediaAssetOriginRuntime = MediaOriginTypeDb | null;

/**
 * Boundary D-22 / City Hero: solo origin nel vocabolario governance entrano nel resolver.
 */
export function mediaAssetOriginForImageResolver(
  origin: MediaAssetOriginRuntime,
): MediaOriginTypeDb | null {
  return origin;
}

type MediaAssetRow = {
  id: string;
  storage_bucket: string;
  storage_path: string;
  origin_type: MediaAssetOriginRuntime;
  generated_by_ai: boolean;
  is_placeholder: boolean;
  asset_status: ImageAssetStatusDb;
  wikimedia_validated: boolean | null;
  admin_blocked: boolean;
  license_code: string | null;
  license_verified_at: string | null;
};

function normalizeMediaAssetOriginRuntime(raw: unknown): MediaAssetOriginRuntime {
  if (typeof raw !== 'string') return null;
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return null;
  if ((MEDIA_ORIGIN_TYPE_DB_VALUES as readonly string[]).includes(normalized)) {
    return normalized as MediaOriginTypeDb;
  }
  return null;
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

  const { data, error } = await mf3MediaAssetsTable()
    .update(payload)
    .eq('id', mediaAssetId)
    .select('id');
  if (error) {
    throw new Error(`Patch provenance media_asset fallita: ${error.message}`);
  }
  const updated = (data ?? []) as { id: string }[];
  if (updated.length !== 1 || updated[0]?.id !== mediaAssetId) {
    throw new Error(
      `Patch provenance media_asset: nessuna riga aggiornata per id ${mediaAssetId}.`,
    );
  }
}

const MEDIA_ASSETS_BY_IDS_CHUNK = 80;
const MEDIA_ASSETS_BY_IDS_CONCURRENCY = 4;

export async function fetchMediaAssetsByIds(ids: string[]): Promise<Map<string, MediaAssetRow>> {
  const unique = [...new Set(ids.filter((id) => id.trim().length > 0))];
  const result = new Map<string, MediaAssetRow>();
  if (unique.length === 0) return result;

  const selectCols =
    'id, storage_bucket, storage_path, origin_type, generated_by_ai, is_placeholder, asset_status, wikimedia_validated, admin_blocked, license_code, license_verified_at';

  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += MEDIA_ASSETS_BY_IDS_CHUNK) {
    chunks.push(unique.slice(i, i + MEDIA_ASSETS_BY_IDS_CHUNK));
  }

  for (let i = 0; i < chunks.length; i += MEDIA_ASSETS_BY_IDS_CONCURRENCY) {
    const slice = chunks.slice(i, i + MEDIA_ASSETS_BY_IDS_CONCURRENCY);
    await Promise.all(
      slice.map(async (batch) => {
        const { data, error } = await mf3MediaAssetsTable().select(selectCols).in('id', batch);
        if (error) {
          throw new Error(`Lettura media_assets fallita: ${error.message}`);
        }
        for (const row of data ?? []) {
          const parsed = parseMediaAssetRow(row);
          if (parsed) {
            result.set(parsed.id, parsed);
          }
        }
      }),
    );
  }

  return result;
}

export type WikimediaSourceAssetState = {
  id: string;
  assetStatus: ImageAssetStatusDb;
  wikimediaValidated: boolean | null;
  adminBlocked: boolean;
};

const WIKIMEDIA_SOURCE_PAGE = 50;

export async function fetchWikimediaAssetsBySourceRef(
  sourceRef: string,
): Promise<WikimediaSourceAssetState[]> {
  const qid = sourceRef.trim();
  if (!qid) return [];
  const rows: WikimediaSourceAssetState[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await mf3MediaAssetsTable()
      .select('id, asset_status, wikimedia_validated, admin_blocked')
      .eq('origin_type', 'wikimedia')
      .eq('source_ref', qid)
      .order('id', { ascending: true })
      .range(offset, offset + WIKIMEDIA_SOURCE_PAGE - 1);
    if (error) throw new Error(error.message);
    const page = data ?? [];
    for (const row of page) {
      if (!isImageAssetStatusDb(row.asset_status)) {
        throw new Error('Stato asset Wikimedia non valido.');
      }
      rows.push({
        id: row.id,
        assetStatus: parseImageAssetStatusDb(row.asset_status),
        wikimediaValidated:
          row.wikimedia_validated === true
            ? true
            : row.wikimedia_validated === false
              ? false
              : null,
        adminBlocked: row.admin_blocked !== false,
      });
    }
    if (page.length < WIKIMEDIA_SOURCE_PAGE) break;
    offset += WIKIMEDIA_SOURCE_PAGE;
  }
  return rows;
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
  const wikimediaValidated =
    row.wikimedia_validated === true ? true : row.wikimedia_validated === false ? false : null;
  const adminBlocked = row.admin_blocked !== false;
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
    wikimedia_validated: wikimediaValidated,
    admin_blocked: adminBlocked,
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

function parseAiVerifyQueueRowDb(value: unknown): AiVerifyQueueRowDb | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const mediaAssetId = typeof row.media_asset_id === 'string' ? row.media_asset_id.trim() : '';
  const storageBucket = typeof row.storage_bucket === 'string' ? row.storage_bucket.trim() : '';
  const storagePath = typeof row.storage_path === 'string' ? row.storage_path.trim() : '';
  const originType = typeof row.origin_type === 'string' ? row.origin_type.trim() : '';
  const entityType = typeof row.entity_type === 'string' ? row.entity_type.trim() : '';
  const entityId = typeof row.entity_id === 'string' ? row.entity_id.trim() : '';
  const cityId = typeof row.city_id === 'string' ? row.city_id.trim() : '';
  const cityName = typeof row.city_name === 'string' ? row.city_name : '';
  if (
    !mediaAssetId ||
    !storageBucket ||
    !storagePath ||
    !originType ||
    !entityType ||
    !entityId ||
    !cityId ||
    !cityName
  ) {
    return null;
  }
  if (typeof row.generated_by_ai !== 'boolean' || typeof row.is_placeholder !== 'boolean') {
    return null;
  }
  const assetStatusRaw = typeof row.asset_status === 'string' ? row.asset_status : '';
  if (!isImageAssetStatusDb(assetStatusRaw)) return null;
  const assetStatus = parseImageAssetStatusDb(assetStatusRaw);
  return {
    media_asset_id: mediaAssetId,
    storage_bucket: storageBucket,
    storage_path: storagePath,
    origin_type: originType,
    generated_by_ai: row.generated_by_ai,
    is_placeholder: row.is_placeholder,
    asset_status: assetStatus,
    license_code:
      row.license_code === null || typeof row.license_code === 'string' ? row.license_code : null,
    source_url:
      row.source_url === null || typeof row.source_url === 'string' ? row.source_url : null,
    entity_type: entityType,
    entity_id: entityId,
    city_id: cityId,
    city_name: cityName,
    continent: typeof row.continent === 'string' ? row.continent : null,
    nation: typeof row.nation === 'string' ? row.nation : null,
    admin_region: typeof row.admin_region === 'string' ? row.admin_region : null,
    zone: typeof row.zone === 'string' ? row.zone : null,
    entity_label: typeof row.entity_label === 'string' ? row.entity_label : null,
    latest_run_id: typeof row.latest_run_id === 'string' ? row.latest_run_id : null,
    latest_ai_summary: typeof row.latest_ai_summary === 'string' ? row.latest_ai_summary : null,
    blocking_step_code: typeof row.blocking_step_code === 'string' ? row.blocking_step_code : null,
    current_assignments: row.current_assignments,
  };
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
  const rows: AiVerifyQueueRow[] = [];
  for (const raw of data ?? []) {
    const parsed = parseAiVerifyQueueRowDb(raw);
    if (!parsed) continue;
    rows.push(mapQueueRow(parsed));
  }
  return rows;
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
  const totalRaw = payload.total;
  const total =
    typeof totalRaw === 'number' && Number.isFinite(totalRaw) ? totalRaw : Number(totalRaw ?? 0);
  const safeTotal = Number.isFinite(total) ? total : 0;
  const byEntityType: Record<string, number> = {};
  const rawByType = payload.by_entity_type;
  if (rawByType && typeof rawByType === 'object') {
    for (const [key, value] of Object.entries(rawByType as Record<string, unknown>)) {
      const n = typeof value === 'number' ? value : Number(value);
      if (Number.isFinite(n)) {
        byEntityType[key] = n;
      }
    }
  }
  return {
    total: safeTotal,
    byEntityType,
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
