import { isAssignmentStatusDb, parseImageAssetStatusDb } from '@/constants/governance';
import {
  type PoiImageAssignmentCandidate,
  type PoiImageD22Context,
  resolvePoiPublicImageByD22,
} from '@/domain/poi/poiImageD22Resolver';
import { entityImageAssignmentsQuery } from '@/services/media/entityImageAssignmentsQuery';
import {
  fetchMediaAssetsByIds,
  mediaAssetOriginForImageResolver,
} from '@/services/media/mediaAssetService';
import { supabase } from '@/services/supabaseClient';
import type { PointOfInterest } from '@/types/index';
import { buildPublicStorageUrl } from '@/utils/storagePathFromPublicUrl';

type AssignmentRow = {
  id: string;
  entity_id: string;
  city_id: string;
  media_asset_id: string;
  assignment_role: string;
  assignment_status: string;
  created_at: string | null;
};

function parseEntityAssignmentRole(role: string): 'primary' | 'gallery' | null {
  const trimmed = role.trim();
  if (trimmed === 'primary' || trimmed === 'gallery') return trimmed;
  return null;
}

function isAssignmentRow(value: unknown): value is AssignmentRow {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === 'string' &&
    typeof row.entity_id === 'string' &&
    typeof row.city_id === 'string' &&
    typeof row.media_asset_id === 'string' &&
    typeof row.assignment_role === 'string' &&
    typeof row.assignment_status === 'string' &&
    (row.created_at === null || typeof row.created_at === 'string')
  );
}

function resolveAssetPublicUrl(asset: {
  storage_bucket: string;
  storage_path: string;
}): string | null {
  const bucket = asset.storage_bucket?.trim() ?? '';
  const path = asset.storage_path?.trim() ?? '';
  if (!bucket || !path) return null;
  return buildPublicStorageUrl(bucket, path);
}

/** Toggle assente in Map solo prima del completamento; dopo load ogni poiId richiesto ha true|false (fail-closed). */
async function loadPoiWikimediaFlags(poiIds: string[]): Promise<Map<string, boolean>> {
  const out = new Map<string, boolean>();
  const uniqueIds = [...new Set(poiIds.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length === 0) return out;

  const { data, error } = await supabase
    .from('pois')
    .select('id, wikimedia_public_enabled')
    .in('id', uniqueIds);

  if (error) {
    console.warn('[poiImageReadService] Impossibile leggere toggle Wikimedia POI:', error.message);
    for (const id of uniqueIds) {
      out.set(id, false);
    }
    return out;
  }

  const seen = new Set<string>();
  for (const row of data ?? []) {
    const id = typeof row.id === 'string' ? row.id : '';
    if (!id) continue;
    seen.add(id);
    out.set(id, row.wikimedia_public_enabled === true);
  }
  for (const id of uniqueIds) {
    if (!seen.has(id)) {
      out.set(id, false);
    }
  }
  return out;
}

async function loadPoiAssignmentRowsBatch(
  poiIds: string[],
  cityIds: string[],
): Promise<AssignmentRow[]> {
  const uniquePoiIds = [...new Set(poiIds.map((id) => id.trim()).filter(Boolean))];
  const uniqueCityIds = [...new Set(cityIds.map((id) => id.trim()).filter(Boolean))];
  if (uniquePoiIds.length === 0 || uniqueCityIds.length === 0) return [];

  const { data, error } = await entityImageAssignmentsQuery()
    .select(
      'id, entity_id, city_id, media_asset_id, assignment_role, assignment_status, created_at',
    )
    .eq('entity_type', 'poi')
    .in('city_id', uniqueCityIds)
    .eq('is_current', true)
    .eq('assignment_status', 'active')
    .in('entity_id', uniquePoiIds)
    .in('assignment_role', ['primary', 'gallery']);

  if (error) {
    throw new Error(`Lettura assignment POI fallita: ${error.message}`);
  }

  return (data ?? []).filter(isAssignmentRow);
}

function buildCandidatesForPoi(
  poi: PointOfInterest,
  rows: AssignmentRow[],
  assets: Awaited<ReturnType<typeof fetchMediaAssetsByIds>>,
  wikimediaPublicEnabled: boolean,
  categoryPlaceholders: Record<string, string> | null | undefined,
): PointOfInterest {
  const candidates: PoiImageAssignmentCandidate[] = [];
  for (const row of rows) {
    if (row.entity_id !== poi.id || row.city_id !== poi.cityId) continue;
    const asset = assets.get(row.media_asset_id);
    if (!asset) continue;
    const originType = mediaAssetOriginForImageResolver(asset.origin_type);
    if (!originType) continue;
    if (!isAssignmentStatusDb(row.assignment_status)) continue;
    let assetStatus: PoiImageAssignmentCandidate['assetStatus'];
    try {
      assetStatus = parseImageAssetStatusDb(asset.asset_status);
    } catch {
      continue;
    }
    const assignmentRole = parseEntityAssignmentRole(row.assignment_role);
    if (!assignmentRole) continue;
    candidates.push({
      assignmentRole,
      isCurrent: true,
      assignmentStatus: row.assignment_status,
      originType,
      assetStatus,
      publicUrl: resolveAssetPublicUrl(asset),
      createdAt: row.created_at,
      stableId: row.id,
    });
  }

  const context: PoiImageD22Context = {
    wikimediaPublicEnabled,
    assignments: candidates,
    category: poi.category,
    categoryPlaceholders,
  };
  const { url } = resolvePoiPublicImageByD22(context);
  return { ...poi, imageUrl: url ?? '' };
}

/** INT-01b — applica cascata D-22 ai POI (sostituisce cutover primary-only). */
export async function applyPoiD22PublicDisplayImages(
  pois: PointOfInterest[],
  options?: { categoryPlaceholders?: Record<string, string> | null },
): Promise<PointOfInterest[]> {
  if (pois.length === 0) return pois;

  const byCity = new Map<string, PointOfInterest[]>();
  const failClosedPoiIds = new Set<string>();
  for (const poi of pois) {
    const poiId = poi.id?.trim() ?? '';
    const cityId = poi.cityId?.trim() ?? '';
    if (!poiId || !cityId) {
      if (poiId) failClosedPoiIds.add(poiId);
      continue;
    }
    const bucket = byCity.get(cityId) ?? [];
    bucket.push(poi);
    byCity.set(cityId, bucket);
  }

  const resultById = new Map<string, PointOfInterest>();

  for (const poiId of failClosedPoiIds) {
    const poi = pois.find((p) => p.id === poiId);
    if (!poi) continue;
    const { url } = resolvePoiPublicImageByD22({
      wikimediaPublicEnabled: false,
      assignments: [],
      category: poi.category,
      categoryPlaceholders: options?.categoryPlaceholders,
    });
    resultById.set(poiId, { ...poi, imageUrl: url ?? '' });
  }

  const cityIds = [...byCity.keys()];
  const allPoiIds = [...new Set([...byCity.values()].flatMap((group) => group.map((p) => p.id)))];

  if (cityIds.length > 0 && allPoiIds.length > 0) {
    const [assignments, wikimediaFlags] = await Promise.all([
      loadPoiAssignmentRowsBatch(allPoiIds, cityIds),
      loadPoiWikimediaFlags(allPoiIds),
    ]);

    const assetIds = [...new Set(assignments.map((a) => a.media_asset_id))];
    const assets = await fetchMediaAssetsByIds(assetIds);

    const assignmentsByPoi = new Map<string, AssignmentRow[]>();
    for (const row of assignments) {
      const list = assignmentsByPoi.get(row.entity_id) ?? [];
      list.push(row);
      assignmentsByPoi.set(row.entity_id, list);
    }

    for (const group of byCity.values()) {
      for (const poi of group) {
        const wikimediaPublicEnabled = wikimediaFlags.get(poi.id) === true;
        const rows = assignmentsByPoi.get(poi.id) ?? [];
        resultById.set(
          poi.id,
          buildCandidatesForPoi(
            poi,
            rows,
            assets,
            wikimediaPublicEnabled,
            options?.categoryPlaceholders,
          ),
        );
      }
    }
  }

  return pois.map((poi) => {
    const resolved = resultById.get(poi.id);
    if (resolved) return resolved;
    const { url } = resolvePoiPublicImageByD22({
      wikimediaPublicEnabled: false,
      assignments: [],
      category: poi.category,
      categoryPlaceholders: options?.categoryPlaceholders,
    });
    return { ...poi, imageUrl: url ?? '' };
  });
}
