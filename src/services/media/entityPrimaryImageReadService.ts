import { isPublicUsableImageAssetStatus, parseImageAssetStatusDb } from '@/constants/governance';
import { fetchMediaAssetsByIds } from '@/services/media/mediaAssetService';
import { mf2EntityImageAssignmentsTable } from '@/services/reports/mf2DbClient';
import type { FamousPerson, PointOfInterest } from '@/types/index';
import { buildPublicStorageUrl } from '@/utils/storagePathFromPublicUrl';

type PrimaryEntityType = 'city_person' | 'poi' | 'patron';

/** Allineato a PostgREST / usage map — evita URL troppo lunghi su .in() grandi. */
const PRIMARY_ASSIGNMENT_IN_CHUNK_SIZE = 200;

type PrimaryAssignmentRow = {
  id: string;
  entity_id: string;
  city_id: string;
  media_asset_id: string;
  assignment_status: string;
  source_image_url: string | null;
  source_storage_bucket: string | null;
  source_storage_path: string | null;
};

function isPrimaryAssignmentRow(value: unknown): value is PrimaryAssignmentRow {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === 'string' &&
    typeof row.entity_id === 'string' &&
    typeof row.city_id === 'string' &&
    typeof row.media_asset_id === 'string' &&
    typeof row.assignment_status === 'string' &&
    (row.source_image_url === null || typeof row.source_image_url === 'string') &&
    (row.source_storage_bucket === null || typeof row.source_storage_bucket === 'string') &&
    (row.source_storage_path === null || typeof row.source_storage_path === 'string')
  );
}

/** POST-MF5 SoT: solo media_assets pubblicabile con storage valido (no snapshot assignment). */
function resolveAssignmentPublicUrl(
  asset: { storage_bucket: string; storage_path: string; asset_status: string } | undefined,
): string | null {
  if (!asset?.asset_status) return null;
  try {
    if (!isPublicUsableImageAssetStatus(parseImageAssetStatusDb(asset.asset_status))) {
      return null;
    }
  } catch {
    return null;
  }

  const assetBucket = asset.storage_bucket?.trim() ?? '';
  const assetPath = asset.storage_path?.trim() ?? '';
  if (assetBucket.length === 0 || assetPath.length === 0) {
    return null;
  }

  return buildPublicStorageUrl(assetBucket, assetPath);
}

/** Assignment corrente non pubblicabile → nessuna immagine (fail-closed). */
function isAssignmentBlockingDisplay(
  row: PrimaryAssignmentRow,
  assetStatus: string | null,
): boolean {
  if (row.assignment_status !== 'active') return true;
  if (!assetStatus) return true;
  try {
    return !isPublicUsableImageAssetStatus(parseImageAssetStatusDb(assetStatus));
  } catch {
    return true;
  }
}

function entityAssignmentKey(cityId: string, entityId: string): string {
  return `${cityId}:${entityId}`;
}

async function loadPrimaryAssignmentIndex(
  entityType: PrimaryEntityType,
  entityIds: string[],
  cityIds: string[],
): Promise<{
  assignmentByKey: Map<string, PrimaryAssignmentRow>;
  duplicateKeys: Set<string>;
  assets: Awaited<ReturnType<typeof fetchMediaAssetsByIds>>;
}> {
  const assignmentByKey = new Map<string, PrimaryAssignmentRow>();
  const duplicateKeys = new Set<string>();

  if (entityIds.length === 0 || cityIds.length === 0) {
    return { assignmentByKey, duplicateKeys, assets: new Map() };
  }

  const uniqueEntityIds = [...new Set(entityIds.filter((id) => id.trim().length > 0))];
  const uniqueCityIds = [...new Set(cityIds.filter((id) => id.trim().length > 0))];

  for (
    let offset = 0;
    offset < uniqueEntityIds.length;
    offset += PRIMARY_ASSIGNMENT_IN_CHUNK_SIZE
  ) {
    const entityChunk = uniqueEntityIds.slice(offset, offset + PRIMARY_ASSIGNMENT_IN_CHUNK_SIZE);

    const { data, error } = await mf2EntityImageAssignmentsTable()
      .select(
        'id, entity_id, city_id, media_asset_id, assignment_status, source_image_url, source_storage_bucket, source_storage_path',
      )
      .eq('entity_type', entityType)
      .eq('assignment_role', 'primary')
      .eq('is_current', true)
      .in('entity_id', entityChunk)
      .in('city_id', uniqueCityIds);

    if (error) {
      throw new Error(`Cutover read ${entityType} fallito: ${error.message}`);
    }

    for (const raw of data ?? []) {
      if (!isPrimaryAssignmentRow(raw)) {
        throw new Error(
          `Record assignment primario non valido durante cutover read (${entityType}).`,
        );
      }
      const key = entityAssignmentKey(raw.city_id, raw.entity_id);
      if (assignmentByKey.has(key)) {
        duplicateKeys.add(key);
        continue;
      }
      assignmentByKey.set(key, raw);
    }
  }

  const assetIds = [...new Set([...assignmentByKey.values()].map((r) => r.media_asset_id))].filter(
    Boolean,
  );
  const assets = await fetchMediaAssetsByIds(assetIds);

  return { assignmentByKey, duplicateKeys, assets };
}

function resolvePublicUrlFromIndex(
  cityId: string,
  entityId: string,
  assignmentByKey: Map<string, PrimaryAssignmentRow>,
  duplicateKeys: Set<string>,
  assets: Awaited<ReturnType<typeof fetchMediaAssetsByIds>>,
  logLabel: string,
): string {
  const key = entityAssignmentKey(cityId, entityId);
  if (duplicateKeys.has(key)) {
    console.warn(
      `[${logLabel}] Assignment primario corrente duplicato — immagine nascosta (city_id=${cityId}, entity_id=${entityId}).`,
    );
    return '';
  }

  const assignment = assignmentByKey.get(key);
  if (!assignment) return '';

  const asset = assets.get(assignment.media_asset_id);
  const assetStatus = asset?.asset_status ?? null;

  if (isAssignmentBlockingDisplay(assignment, assetStatus)) {
    return '';
  }

  const resolved = resolveAssignmentPublicUrl(asset);
  return resolved?.trim() ?? '';
}

/**
 * POST-MF5 — URL primaria pubblica per entità personaggio (solo assignment + media_assets).
 * Nessun fallback su colonne legacy.
 */
export async function resolvePrimaryImagePublicUrlsForCityPeople(
  cityId: string,
  entityIds: string[],
): Promise<Map<string, string>> {
  const trimmedCityId = cityId.trim();
  const uniqueIds = [...new Set(entityIds.map((id) => id.trim()).filter(Boolean))];
  const out = new Map<string, string>();
  if (!trimmedCityId || uniqueIds.length === 0) return out;

  const { assignmentByKey, duplicateKeys, assets } = await loadPrimaryAssignmentIndex(
    'city_person',
    uniqueIds,
    [trimmedCityId],
  );

  for (const entityId of uniqueIds) {
    const url = resolvePublicUrlFromIndex(
      trimmedCityId,
      entityId,
      assignmentByKey,
      duplicateKeys,
      assets,
      'resolvePrimaryImagePublicUrlsForCityPeople',
    );
    if (url.length > 0) out.set(entityId, url);
  }

  return out;
}

/** POST-MF5 cutover read personaggi — SoT assignment; senza assignment → nessuna immagine. */
export async function applyPrimaryImageCutoverForCityPeople(
  people: FamousPerson[],
): Promise<FamousPerson[]> {
  const candidates = people.filter((p) => p.id?.trim() && p.cityId?.trim());
  if (candidates.length === 0) return people;

  const entityIds = [...new Set(candidates.map((p) => p.id))];
  const cityIds = [...new Set(candidates.map((p) => p.cityId))];

  const { assignmentByKey, duplicateKeys, assets } = await loadPrimaryAssignmentIndex(
    'city_person',
    entityIds,
    cityIds,
  );

  return people.map((person) => {
    if (!person.id?.trim() || !person.cityId?.trim()) return person;

    const resolved = resolvePublicUrlFromIndex(
      person.cityId,
      person.id,
      assignmentByKey,
      duplicateKeys,
      assets,
      'applyPrimaryImageCutoverForCityPeople',
    );

    return { ...person, imageUrl: resolved };
  });
}

/** POST-MF5 cutover read POI multi-città (Around Me, batch globali). */
export async function applyPrimaryImageCutoverForPoisList(
  pois: PointOfInterest[],
): Promise<PointOfInterest[]> {
  if (pois.length === 0) return pois;

  const byCityId = new Map<string, PointOfInterest[]>();
  const resultById = new Map<string, PointOfInterest>();

  for (const poi of pois) {
    const cityId = poi.cityId?.trim() ?? '';
    if (!poi.id?.trim() || !cityId) {
      resultById.set(poi.id, { ...poi, imageUrl: '' });
      continue;
    }
    const bucket = byCityId.get(cityId) ?? [];
    bucket.push(poi);
    byCityId.set(cityId, bucket);
  }

  for (const [cityId, group] of byCityId) {
    const cutovered = await applyPrimaryImageCutoverForPois(group, cityId);
    for (const poi of cutovered) {
      resultById.set(poi.id, poi);
    }
  }

  return pois.map((poi) => resultById.get(poi.id) ?? { ...poi, imageUrl: '' });
}

/** POST-MF5 cutover read POI — SoT assignment; senza assignment → nessuna immagine. */
export async function applyPrimaryImageCutoverForPois(
  pois: PointOfInterest[],
  cityId: string,
): Promise<PointOfInterest[]> {
  const trimmedCityId = cityId.trim();
  if (!trimmedCityId) return pois;

  const entityIds = [...new Set(pois.map((p) => p.id).filter((id) => id?.trim()))];
  if (entityIds.length === 0) return pois;

  const { assignmentByKey, duplicateKeys, assets } = await loadPrimaryAssignmentIndex(
    'poi',
    entityIds,
    [trimmedCityId],
  );

  return pois.map((poi) => {
    if (!poi.id?.trim()) return poi;

    const resolved = resolvePublicUrlFromIndex(
      trimmedCityId,
      poi.id,
      assignmentByKey,
      duplicateKeys,
      assets,
      'applyPrimaryImageCutoverForPois',
    );

    return { ...poi, imageUrl: resolved };
  });
}

/** POST-MF5 — immagine primaria Patrono (entity_id = city_id). */
export async function resolvePatronPrimaryImagePublicUrl(cityId: string): Promise<string | null> {
  const trimmedCityId = cityId.trim();
  if (!trimmedCityId) return null;

  const { assignmentByKey, duplicateKeys, assets } = await loadPrimaryAssignmentIndex(
    'patron',
    [trimmedCityId],
    [trimmedCityId],
  );

  const url = resolvePublicUrlFromIndex(
    trimmedCityId,
    trimmedCityId,
    assignmentByKey,
    duplicateKeys,
    assets,
    'resolvePatronPrimaryImagePublicUrl',
  );

  return url.length > 0 ? url : null;
}
