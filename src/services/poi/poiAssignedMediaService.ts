import { entityImageAssignmentsQuery } from '@/services/media/entityImageAssignmentsQuery';
import { fetchMediaAssetsByIds } from '@/services/media/mediaAssetService';
import { buildPublicStorageUrl } from '@/utils/storagePathFromPublicUrl';

export type PoiAssignedPhoto = {
  assignmentId: string;
  assetId: string;
  originType: string;
  previewUrl: string | null;
  assignmentStatus: string;
  adminBlocked: boolean;
  isPlaceholder: boolean;
};

const ADMIN_ORIGINS = new Set(['admin', 'admin_upload', 'verified_real']);
const AI_ORIGINS = new Set(['ai', 'ai_generated']);

export function poiPhotoSection(
  photo: PoiAssignedPhoto,
): 'sponsor' | 'admin' | 'wikimedia' | 'community' | 'ai' | null {
  if (photo.isPlaceholder || photo.originType === 'placeholder') return null;
  if (photo.originType === 'sponsor') return 'sponsor';
  if (ADMIN_ORIGINS.has(photo.originType)) return 'admin';
  if (photo.originType === 'wikimedia') return 'wikimedia';
  if (photo.originType === 'community') return 'community';
  if (AI_ORIGINS.has(photo.originType)) return 'ai';
  return null;
}

/** Foto correnti del POI che il blocco Admin può escludere dalla cascata. Il placeholder non entra. */
export function isPoiAdminBlockTarget(photo: PoiAssignedPhoto): boolean {
  return poiPhotoSection(photo) !== null;
}

function isAssignmentRow(value: unknown): value is {
  id: string;
  media_asset_id: string;
  assignment_status: string;
} {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === 'string' &&
    typeof row.media_asset_id === 'string' &&
    typeof row.assignment_status === 'string'
  );
}

export async function listPoiAssignedPhotos(
  poiId: string,
  cityId: string,
): Promise<PoiAssignedPhoto[]> {
  const entityId = poiId.trim();
  const city = cityId.trim();
  if (!entityId || !city) return [];

  const { data, error } = await entityImageAssignmentsQuery()
    .select('id, media_asset_id, assignment_status')
    .eq('entity_type', 'poi')
    .eq('entity_id', entityId)
    .eq('city_id', city)
    .eq('is_current', true);

  if (error) {
    throw new Error(`Lettura foto del POI fallita: ${error.message}`);
  }

  const rows = (data ?? []).map((raw) => {
    if (!isAssignmentRow(raw)) {
      throw new Error('Lettura foto del POI fallita: record assignment non valido.');
    }
    return raw;
  });
  const assets = await fetchMediaAssetsByIds(rows.map((row) => row.media_asset_id));
  const photos: PoiAssignedPhoto[] = [];

  for (const row of rows) {
    const asset = assets.get(row.media_asset_id);
    if (!asset) continue;
    const bucket = asset.storage_bucket.trim();
    const path = asset.storage_path.trim();
    photos.push({
      assignmentId: row.id,
      assetId: asset.id,
      originType: asset.origin_type ?? '',
      previewUrl: bucket && path ? buildPublicStorageUrl(bucket, path) : null,
      assignmentStatus: row.assignment_status,
      adminBlocked: asset.admin_blocked,
      isPlaceholder: asset.is_placeholder,
    });
  }

  return photos;
}
