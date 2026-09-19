import { mf2EntityImageAssignmentsTable } from '@/services/reports/mf2DbClient';
import type { FamousPerson, PointOfInterest } from '@/types/index';

type PrimaryAssignmentVisibilityRow = {
  id: string;
  entity_id: string;
  assignment_status: string;
  assignment_role: string;
  source_image_url: string | null;
  source_storage_path: string | null;
};

type PatronGalleryAssignmentVisibilityRow = {
  id: string;
  assignment_status: string;
  source_image_url: string | null;
  source_storage_path: string | null;
};

const NON_VISIBLE_ASSIGNMENT_STATUSES = new Set(['suspended', 'removed', 'replaced']);

function isAssignmentBlockingLegacyImage(row: { assignment_status: string } | undefined): boolean {
  if (!row) return false;
  return NON_VISIBLE_ASSIGNMENT_STATUSES.has(row.assignment_status);
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
      'id, entity_id, assignment_status, assignment_role, source_image_url, source_storage_path',
    )
    .eq('entity_type', entityType)
    .eq('city_id', cityId)
    .eq('assignment_role', 'primary')
    .eq('is_current', true)
    .in('entity_id', uniqueIds);

  if (error) {
    throw new Error(`Lettura assignment visibilità fallita: ${error.message}`);
  }

  for (const row of (data ?? []) as unknown as PrimaryAssignmentVisibilityRow[]) {
    result.set(row.entity_id, row);
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
    .select('id, assignment_status, source_image_url, source_storage_path')
    .eq('entity_type', 'patron')
    .eq('entity_id', cityId)
    .eq('city_id', cityId)
    .eq('assignment_role', 'gallery')
    .eq('is_current', true);

  if (error) {
    throw new Error(`Lettura assignment galleria Patrono fallita: ${error.message}`);
  }

  const rows = (data ?? []) as unknown as PatronGalleryAssignmentVisibilityRow[];
  const rowsById = new Map<string, PatronGalleryAssignmentVisibilityRow>();
  for (const row of rows) {
    rowsById.set(row.id, row);
  }

  return photos.filter((photo) => {
    const assignmentId = photo.assignmentId?.trim() ?? '';
    if (assignmentId.length > 0) {
      const byId = rowsById.get(assignmentId);
      if (!byId) {
        return false;
      }
      return !isAssignmentBlockingLegacyImage(byId);
    }

    const url = photo.imageUrl.trim();
    const path = photo.storagePath?.trim() ?? '';

    const matching = rows.find((row) => {
      if (path.length > 0 && row.source_storage_path?.trim() === path) return true;
      return url.length > 0 && row.source_image_url?.trim() === url;
    });

    if (!matching) return true;
    return !isAssignmentBlockingLegacyImage(matching);
  });
}
