import { isPubliclyVisibleAssignmentStatus, parseImageAssetStatusDb } from '@/constants/governance';
import { isAssetEligibleForPublicUse } from '@/domain/media/imagePublicationPolicy';
import { entityImageAssignmentsQuery } from '@/services/media/entityImageAssignmentsQuery';
import { resolvePatronPrimaryImagePublicUrl } from '@/services/media/entityPrimaryImageReadService';
import { fetchMediaAssetsByIds } from '@/services/media/mediaAssetService';

type PatronGalleryAssignmentVisibilityRow = {
  id: string;
  media_asset_id: string;
  assignment_status: string;
};

function isPatronGalleryAssignmentVisibilityRow(
  value: unknown,
): value is PatronGalleryAssignmentVisibilityRow {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === 'string' &&
    typeof row.media_asset_id === 'string' &&
    typeof row.assignment_status === 'string'
  );
}

function isGalleryAssignmentPubliclyVisible(
  row: PatronGalleryAssignmentVisibilityRow,
  asset:
    | {
        asset_status: string;
        origin_type: string | null;
        wikimedia_validated: boolean | null;
        admin_blocked: boolean;
      }
    | undefined,
): boolean {
  if (!isPubliclyVisibleAssignmentStatus(row.assignment_status)) return false;
  if (!row.media_asset_id?.trim()) return false;
  if (!asset?.asset_status) return false;
  try {
    return isAssetEligibleForPublicUse({
      originType: asset.origin_type,
      assetStatus: parseImageAssetStatusDb(asset.asset_status),
      wikimediaValidated: asset.wikimedia_validated,
      adminBlocked: asset.admin_blocked,
    });
  } catch {
    return false;
  }
}

/** Patrono hero: SoT assignment + media_assets (POST-MF5). */
export async function resolvePatronPrimaryImageUrl(cityId: string): Promise<string | null> {
  return resolvePatronPrimaryImagePublicUrl(cityId);
}

export type PatronGalleryVisibilityItem = {
  imageUrl: string;
  storagePath?: string | null;
  assignmentId?: string | null;
};

/** POST-MF5 — galleria Patrono visibile solo con assignment gallery corrente pubblicabile. */
export async function filterPatronGalleryByAssignmentVisibility<
  T extends PatronGalleryVisibilityItem,
>(cityId: string, photos: T[]): Promise<T[]> {
  if (photos.length === 0) return photos;

  const { data, error } = await entityImageAssignmentsQuery()
    .select('id, media_asset_id, assignment_status')
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
        `Record assignment gallery Patrono corrente non valido per la visibilità (city_id=${cityId}).`,
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
    if (assignmentId.length === 0) {
      return false;
    }

    const byId = rowsById.get(assignmentId);
    if (!byId) {
      return false;
    }
    return isGalleryAssignmentPubliclyVisible(byId, assets.get(byId.media_asset_id));
  });
}
