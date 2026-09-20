import { isPublicUsableImageAssetStatus, parseImageAssetStatusDb } from '@/constants/governance';
import { fetchMediaAssetsByIds } from '@/services/media/mediaAssetService';
import { mf2EntityImageAssignmentsTable } from '@/services/reports/mf2DbClient';
import type { FamousPerson, PointOfInterest } from '@/types/index';

type PrimaryAssignmentVisibilityRow = {
  id: string;
  entity_id: string;
  media_asset_id: string;
  assignment_status: string;
  assignment_role: string;
  source_image_url: string | null;
  source_storage_path: string | null;
};

type PatronGalleryAssignmentVisibilityRow = {
  id: string;
  media_asset_id: string;
  assignment_status: string;
  source_image_url: string | null;
  source_storage_path: string | null;
};

function isPrimaryAssignmentVisibilityRow(value: unknown): value is PrimaryAssignmentVisibilityRow {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === 'string' &&
    typeof row.entity_id === 'string' &&
    typeof row.media_asset_id === 'string' &&
    typeof row.assignment_status === 'string' &&
    typeof row.assignment_role === 'string' &&
    (row.source_image_url === null || typeof row.source_image_url === 'string') &&
    (row.source_storage_path === null || typeof row.source_storage_path === 'string')
  );
}

function isPatronGalleryAssignmentVisibilityRow(
  value: unknown,
): value is PatronGalleryAssignmentVisibilityRow {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === 'string' &&
    typeof row.media_asset_id === 'string' &&
    typeof row.assignment_status === 'string' &&
    (row.source_image_url === null || typeof row.source_image_url === 'string') &&
    (row.source_storage_path === null || typeof row.source_storage_path === 'string')
  );
}

/** D86: con assignment corrente, legacy visibile solo se assignment_status === active (vocabolario MF3). */
function isAssignmentBlockingLegacyImage(row: { assignment_status: string } | undefined): boolean {
  if (!row) return false;
  return row.assignment_status !== 'active';
}

function isAssetBlockingPublicImage(
  assetStatus: string | null | undefined,
  hasAssignment: boolean,
): boolean {
  if (!hasAssignment) return false;
  if (!assetStatus) return true;
  try {
    return !isPublicUsableImageAssetStatus(parseImageAssetStatusDb(assetStatus));
  } catch {
    return true;
  }
}

function isGalleryAssignmentPubliclyVisible(
  row: PatronGalleryAssignmentVisibilityRow,
  assetStatus: string | null | undefined,
): boolean {
  if (isAssignmentBlockingLegacyImage(row)) return false;
  if (!row.media_asset_id?.trim()) return false;
  return !isAssetBlockingPublicImage(assetStatus, true);
}

async function fetchPrimaryAssignments(
  entityType: 'city_person' | 'poi' | 'patron',
  cityId: string,
  entityIds: string[],
): Promise<Map<string, PrimaryAssignmentVisibilityRow>> {
  const uniqueIds = [...new Set(entityIds.filter((id) => id.trim().length > 0))];
  const result = new Map<string, PrimaryAssignmentVisibilityRow>();
  if (uniqueIds.length === 0) return result;

  const { data, error } = await mf2EntityImageAssignmentsTable()
    .select(
      'id, entity_id, media_asset_id, assignment_status, assignment_role, source_image_url, source_storage_path',
    )
    .eq('entity_type', entityType)
    .eq('city_id', cityId)
    .eq('assignment_role', 'primary')
    .eq('is_current', true)
    .in('entity_id', uniqueIds);

  if (error) {
    throw new Error(`Lettura assignment visibilità fallita: ${error.message}`);
  }

  for (const row of data ?? []) {
    if (!isPrimaryAssignmentVisibilityRow(row)) {
      throw new Error(
        `Record assignment primario corrente non valido per la visibilità D86 (${entityType}, city_id=${cityId}).`,
      );
    }
    result.set(row.entity_id, row);
  }

  const assetIds = [...result.values()].map((r) => r.media_asset_id).filter((id) => id?.trim());
  const assets = await fetchMediaAssetsByIds(assetIds);

  for (const [entityId, row] of result) {
    const asset = assets.get(row.media_asset_id);
    if (
      isAssetBlockingPublicImage(asset?.asset_status ?? null, true) ||
      isAssignmentBlockingLegacyImage(row)
    ) {
      result.set(entityId, { ...row, assignment_status: 'suspended' });
    }
  }

  return result;
}

/**
 * D86 transizione: se esiste assignment corrente non-active, nascondi image_url legacy.
 * Nessun assignment → fallback legacy ammesso (§42.15 transitorio).
 */
export async function maskSuspendedPrimaryImagesForPeople(
  people: FamousPerson[],
  cityId: string,
): Promise<FamousPerson[]> {
  const withImage = people.filter((p) => p.imageUrl?.trim());
  if (withImage.length === 0) return people;

  const assignments = await fetchPrimaryAssignments(
    'city_person',
    cityId,
    withImage.map((p) => p.id),
  );

  return people.map((person) => {
    const assignment = assignments.get(person.id);
    if (!isAssignmentBlockingLegacyImage(assignment)) return person;
    return { ...person, imageUrl: '' };
  });
}

export async function maskSuspendedPrimaryImagesForPois(
  pois: PointOfInterest[],
  cityId: string,
): Promise<PointOfInterest[]> {
  const withImage = pois.filter((p) => p.imageUrl?.trim());
  if (withImage.length === 0) return pois;

  const assignments = await fetchPrimaryAssignments(
    'poi',
    cityId,
    withImage.map((p) => p.id),
  );

  return pois.map((poi) => {
    const assignment = assignments.get(poi.id);
    if (!isAssignmentBlockingLegacyImage(assignment)) return poi;
    return { ...poi, imageUrl: '' };
  });
}

/** Patrono hero: entity_type patron, entity_id = city_id, role primary. */
export async function resolvePatronPrimaryImageUrl(
  cityId: string,
  legacyImageUrl: string | null | undefined,
): Promise<string | null> {
  const url = legacyImageUrl?.trim() ?? '';
  if (!url) return null;

  const assignments = await fetchPrimaryAssignments('patron', cityId, [cityId]);
  const assignment = assignments.get(cityId);
  if (isAssignmentBlockingLegacyImage(assignment)) return null;
  return url;
}

export type PatronGalleryVisibilityItem = {
  imageUrl: string;
  storagePath?: string | null;
  assignmentId?: string | null;
};

export async function filterPatronGalleryByAssignmentVisibility<
  T extends PatronGalleryVisibilityItem,
>(cityId: string, photos: T[]): Promise<T[]> {
  if (photos.length === 0) return photos;

  const { data, error } = await mf2EntityImageAssignmentsTable()
    .select('id, media_asset_id, assignment_status, source_image_url, source_storage_path')
    .eq('entity_type', 'patron')
    .eq('entity_id', cityId)
    .eq('city_id', cityId)
    .eq('assignment_role', 'gallery')
    .eq('is_current', true);

  if (error) {
    throw new Error(`Lettura assignment galleria Patrono fallita: ${error.message}`);
  }

  const rows: PatronGalleryAssignmentVisibilityRow[] = [];
  for (const row of data ?? []) {
    if (!isPatronGalleryAssignmentVisibilityRow(row)) {
      throw new Error(
        `Record assignment gallery Patrono corrente non valido per la visibilità D86 (city_id=${cityId}).`,
      );
    }
    rows.push(row);
  }
  const rowsById = new Map<string, PatronGalleryAssignmentVisibilityRow>();
  for (const row of rows) {
    rowsById.set(row.id, row);
  }

  const assetIds = rows.map((r) => r.media_asset_id).filter((id) => id?.trim());
  const assets = await fetchMediaAssetsByIds(assetIds);

  return photos.filter((photo) => {
    const assignmentId = photo.assignmentId?.trim() ?? '';
    if (assignmentId.length > 0) {
      const byId = rowsById.get(assignmentId);
      if (!byId) {
        return false;
      }
      const assetStatus = assets.get(byId.media_asset_id)?.asset_status ?? null;
      return isGalleryAssignmentPubliclyVisible(byId, assetStatus);
    }

    const url = photo.imageUrl.trim();
    const path = photo.storagePath?.trim() ?? '';

    const matching = rows.find((row) => {
      if (path.length > 0 && row.source_storage_path?.trim() === path) return true;
      return url.length > 0 && row.source_image_url?.trim() === url;
    });

    if (!matching) return true;
    const assetStatus = assets.get(matching.media_asset_id)?.asset_status ?? null;
    return isGalleryAssignmentPubliclyVisible(matching, assetStatus);
  });
}
