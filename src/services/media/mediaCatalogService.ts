import type { ImageAssetStatusDb, MediaOriginTypeDb } from '@/constants/governance';
import { isImageAssetStatusDb } from '@/constants/governance';
import { mf2EntityImageAssignmentsTable } from '@/services/reports/mf2DbClient';
import { supabase } from '../supabaseClient';
import { mf4EntityImageHistoryTable, mf4MediaCatalogView, mf4Rpc } from './mf4DbClient';

export type MediaCatalogSortField = 'created_at' | 'updated_at' | 'active_usage_count';
export type MediaCatalogSortDir = 'asc' | 'desc';

export type MediaCatalogFilters = {
  originType?: MediaOriginTypeDb | 'all';
  assetStatus?: ImageAssetStatusDb | 'all';
  usage?: 'all' | 'used' | 'unused';
  search?: string;
  includeArchived?: boolean;
  storageBucket?: string;
  storagePathPrefix?: string;
};

export type MediaCatalogRow = {
  id: string;
  storageBucket: string;
  storagePath: string;
  publicUrl: string;
  originType: string;
  generatedByAi: boolean;
  isPlaceholder: boolean;
  assetStatus: ImageAssetStatusDb;
  licenseCode: string | null;
  licenseUrl: string | null;
  sourceUrl: string | null;
  attributionText: string | null;
  authorName: string | null;
  sourceRef: string | null;
  retrievedAt: string | null;
  licenseVerifiedAt: string | null;
  activeUsageCount: number;
  totalAssignmentCount: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
};

export type MediaCatalogPage = {
  rows: MediaCatalogRow[];
  total: number;
  limit: number;
  offset: number;
};

export type MediaAssetAssignmentUsage = {
  assignmentId: string;
  entityType: string;
  entityId: string;
  cityId: string;
  assignmentRole: string;
  assignmentStatus: string;
  isCurrent: boolean;
  entityLabel: string | null;
  cityName: string | null;
};

export type MediaAssetHistoryEntry = {
  id: string;
  eventType: string;
  createdAt: string;
  previousAssignmentStatus: string | null;
  newAssignmentStatus: string | null;
  previousAssetStatus: string | null;
  newAssetStatus: string | null;
  adminRationale: string | null;
  aiRationale: string | null;
  metadata: Record<string, unknown>;
};

const PUBLIC_BUCKET = 'public-media';

function publicUrlFromPath(bucket: string, path: string): string {
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);
  return publicUrl;
}

type CatalogRowDb = {
  id: string;
  storage_bucket: string;
  storage_path: string;
  origin_type: string;
  generated_by_ai: boolean;
  is_placeholder: boolean;
  asset_status: string;
  license_code: string | null;
  license_url: string | null;
  source_url: string | null;
  attribution_text: string | null;
  author_name: string | null;
  source_ref: string | null;
  retrieved_at: string | null;
  license_verified_at: string | null;
  active_usage_count: number;
  total_assignment_count: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  metadata: unknown;
};

function mapCatalogRow(row: CatalogRowDb): MediaCatalogRow | null {
  if (!row.id || !row.storage_bucket || !row.storage_path) return null;
  if (!isImageAssetStatusDb(row.asset_status)) return null;
  const metadata =
    row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {};
  return {
    id: row.id,
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    publicUrl: publicUrlFromPath(row.storage_bucket, row.storage_path),
    originType: row.origin_type,
    generatedByAi: row.generated_by_ai,
    isPlaceholder: row.is_placeholder,
    assetStatus: row.asset_status,
    licenseCode: row.license_code,
    licenseUrl: row.license_url,
    sourceUrl: row.source_url,
    attributionText: row.attribution_text,
    authorName: row.author_name,
    sourceRef: row.source_ref,
    retrievedAt: row.retrieved_at,
    licenseVerifiedAt: row.license_verified_at,
    activeUsageCount: Number(row.active_usage_count ?? 0),
    totalAssignmentCount: Number(row.total_assignment_count ?? 0),
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadata,
  };
}

export async function listMediaCatalogPage(input: {
  filters?: MediaCatalogFilters;
  limit?: number;
  offset?: number;
  sortField?: MediaCatalogSortField;
  sortDir?: MediaCatalogSortDir;
}): Promise<MediaCatalogPage> {
  const limit = Math.min(Math.max(input.limit ?? 48, 1), 200);
  const offset = Math.max(input.offset ?? 0, 0);
  const filters = input.filters ?? {};
  const sortField = input.sortField ?? 'created_at';
  const sortDir = input.sortDir ?? 'desc';

  let query = mf4MediaCatalogView().select('*', { count: 'exact' });

  if (!filters.includeArchived) {
    query = query.is('archived_at', null);
  }
  if (filters.originType && filters.originType !== 'all') {
    query = query.eq('origin_type', filters.originType);
  }
  if (filters.assetStatus && filters.assetStatus !== 'all') {
    query = query.eq('asset_status', filters.assetStatus);
  }
  if (filters.storageBucket?.trim()) {
    query = query.eq('storage_bucket', filters.storageBucket.trim());
  }
  if (filters.storagePathPrefix?.trim()) {
    query = query.ilike('storage_path', `${filters.storagePathPrefix.trim()}%`);
  }
  if (filters.usage === 'used') {
    query = query.gt('active_usage_count', 0);
  } else if (filters.usage === 'unused') {
    query = query.eq('active_usage_count', 0);
  }
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    query = query.ilike('storage_path', term);
  }

  query = query
    .order(sortField, { ascending: sortDir === 'asc' })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) {
    throw new Error(`Catalogo media fallito: ${error.message}`);
  }

  const rows = ((data ?? []) as unknown as CatalogRowDb[])
    .map((row) => mapCatalogRow(row))
    .filter((row): row is MediaCatalogRow => row !== null);

  return {
    rows,
    total: count ?? rows.length,
    limit,
    offset,
  };
}

export async function getMediaCatalogAssetById(assetId: string): Promise<MediaCatalogRow | null> {
  const { data, error } = await mf4MediaCatalogView().select('*').eq('id', assetId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapCatalogRow(data as unknown as CatalogRowDb);
}

export async function listMediaAssetAssignments(
  mediaAssetId: string,
): Promise<MediaAssetAssignmentUsage[]> {
  const { data, error } = await mf2EntityImageAssignmentsTable()
    .select('id, entity_type, entity_id, city_id, assignment_role, assignment_status, is_current')
    .eq('media_asset_id', mediaAssetId)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);

  const rows = data ?? [];
  type ParsedRow = {
    assignmentId: string;
    entityType: string;
    entityId: string;
    cityId: string;
    assignmentRole: string;
    assignmentStatus: string;
    isCurrent: boolean;
  };

  const parsed: ParsedRow[] = [];
  for (const raw of rows) {
    if (!raw || typeof raw !== 'object') continue;
    const row = raw as Record<string, unknown>;
    const assignmentId = typeof row.id === 'string' ? row.id : '';
    const entityType = typeof row.entity_type === 'string' ? row.entity_type : '';
    const entityId = typeof row.entity_id === 'string' ? row.entity_id : '';
    const cityId = typeof row.city_id === 'string' ? row.city_id : '';
    if (!assignmentId || !entityType || !entityId || !cityId) continue;
    parsed.push({
      assignmentId,
      entityType,
      entityId,
      cityId,
      assignmentRole: typeof row.assignment_role === 'string' ? row.assignment_role : 'primary',
      assignmentStatus:
        typeof row.assignment_status === 'string' ? row.assignment_status : 'active',
      isCurrent: Boolean(row.is_current),
    });
  }

  if (parsed.length === 0) return [];

  const cityIds = [...new Set(parsed.map((r) => r.cityId))];
  const personIds = [
    ...new Set(parsed.filter((r) => r.entityType === 'city_person').map((r) => r.entityId)),
  ];
  const poiIds = [...new Set(parsed.filter((r) => r.entityType === 'poi').map((r) => r.entityId))];

  const cityNameById = new Map<string, string>();
  if (cityIds.length > 0) {
    const { data: cities, error: citiesError } = await supabase
      .from('cities')
      .select('id, name')
      .in('id', cityIds);
    if (citiesError) throw new Error(citiesError.message);
    for (const city of cities ?? []) {
      if (city?.id && typeof city.name === 'string') {
        cityNameById.set(city.id, city.name);
      }
    }
  }

  const personNameById = new Map<string, string>();
  if (personIds.length > 0) {
    const { data: people, error: peopleError } = await supabase
      .from('city_people')
      .select('id, name')
      .in('id', personIds);
    if (peopleError) throw new Error(peopleError.message);
    for (const person of people ?? []) {
      if (person?.id && typeof person.name === 'string') {
        personNameById.set(person.id, person.name);
      }
    }
  }

  const poiNameById = new Map<string, string>();
  if (poiIds.length > 0) {
    const { data: pois, error: poisError } = await supabase
      .from('pois')
      .select('id, name')
      .in('id', poiIds);
    if (poisError) throw new Error(poisError.message);
    for (const poi of pois ?? []) {
      if (poi?.id && typeof poi.name === 'string') {
        poiNameById.set(poi.id, poi.name);
      }
    }
  }

  return parsed.map((row) => ({
    assignmentId: row.assignmentId,
    entityType: row.entityType,
    entityId: row.entityId,
    cityId: row.cityId,
    assignmentRole: row.assignmentRole,
    assignmentStatus: row.assignmentStatus,
    isCurrent: row.isCurrent,
    cityName: cityNameById.get(row.cityId) ?? null,
    entityLabel:
      row.entityType === 'city_person'
        ? (personNameById.get(row.entityId) ?? null)
        : row.entityType === 'poi'
          ? (poiNameById.get(row.entityId) ?? null)
          : null,
  }));
}

export async function listMediaAssetHistory(
  mediaAssetId: string,
  limit = 50,
): Promise<MediaAssetHistoryEntry[]> {
  const { data, error } = await mf4EntityImageHistoryTable()
    .select(
      'id, event_type, created_at, previous_assignment_status, new_assignment_status, previous_asset_status, new_asset_status, admin_rationale, ai_rationale, metadata',
    )
    .eq('media_asset_id', mediaAssetId)
    .order('created_at', { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 200));

  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown[]).map((raw) => {
    const row = raw as Record<string, unknown>;
    const metadata =
      row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {};
    return {
      id: String(row.id ?? ''),
      eventType: String(row.event_type ?? ''),
      createdAt: String(row.created_at ?? ''),
      previousAssignmentStatus:
        row.previous_assignment_status === null ||
        typeof row.previous_assignment_status === 'string'
          ? row.previous_assignment_status
          : null,
      newAssignmentStatus:
        row.new_assignment_status === null || typeof row.new_assignment_status === 'string'
          ? row.new_assignment_status
          : null,
      previousAssetStatus:
        row.previous_asset_status === null || typeof row.previous_asset_status === 'string'
          ? row.previous_asset_status
          : null,
      newAssetStatus:
        row.new_asset_status === null || typeof row.new_asset_status === 'string'
          ? row.new_asset_status
          : null,
      adminRationale:
        row.admin_rationale === null || typeof row.admin_rationale === 'string'
          ? row.admin_rationale
          : null,
      aiRationale:
        row.ai_rationale === null || typeof row.ai_rationale === 'string' ? row.ai_rationale : null,
      metadata,
    };
  });
}

type SafeArchiveRpcPayload = {
  ok?: boolean;
  already_archived?: boolean;
  message?: string;
};

export async function safeArchiveMediaAsset(
  mediaAssetId: string,
  adminRationale?: string,
): Promise<{ ok: boolean; message?: string }> {
  const { data, error } = await mf4Rpc<SafeArchiveRpcPayload>('safe_archive_media_asset', {
    p_media_asset_id: mediaAssetId,
    p_admin_rationale: adminRationale?.trim() ?? null,
  });
  if (error) {
    return { ok: false, message: error.message };
  }
  const payload = data ?? {};
  if (payload.ok !== true) {
    return {
      ok: false,
      message:
        typeof payload.message === 'string' && payload.message.trim().length > 0
          ? payload.message
          : 'Archivio asset non riuscito.',
    };
  }
  if (payload.already_archived) {
    return { ok: true, message: 'Asset già archiviato.' };
  }
  return { ok: true };
}

/** Namespace object path gestiti da MF4 (non trattati come generici public-media legacy). */
const MF4_PUBLIC_MEDIA_OBJECT_PREFIXES = ['verified/', 'wikimedia/'] as const;

/** Root legacy public-media (allineata a mediaService LEGACY_PUBLIC_MEDIA_ROOT_FOLDERS). */
const LEGACY_PUBLIC_MEDIA_ROOT_FOLDERS = new Set([
  'admin_assets',
  'admin_uploads',
  'ai_generated',
  'city_patron_gallery',
  'comms_assets',
  'edited',
  'edited_assets',
  'famous_person_photo_suggestions',
  'general',
  'onboarding_assets',
  'patron_photo_suggestions',
  'people_portraits',
  'shop_products',
  'social_templates',
  'viaggio_covers',
]);

/**
 * True se `path` è un object path valido nel bucket public-media legacy (senza prefisso bucket).
 * Non include namespace MF4 (verified/wikimedia/quarantine) né URL assolute.
 */
export function isPublicMediaStorageObjectPath(path: string): boolean {
  const trimmed = path.trim();
  if (!trimmed || trimmed.includes('://')) return false;

  let objectPath = trimmed;
  if (trimmed.startsWith(`${PUBLIC_BUCKET}/`)) {
    objectPath = trimmed.slice(`${PUBLIC_BUCKET}/`.length);
    if (!objectPath) return false;
  }

  if (objectPath.startsWith('/') || objectPath.includes('\\')) return false;
  if (MF4_PUBLIC_MEDIA_OBJECT_PREFIXES.some((prefix) => objectPath.startsWith(prefix))) {
    return false;
  }

  const segments = objectPath.split('/');
  if (segments.some((segment) => segment.length === 0 || segment === '.' || segment === '..')) {
    return false;
  }

  const root = segments[0] ?? '';
  return LEGACY_PUBLIC_MEDIA_ROOT_FOLDERS.has(root);
}
