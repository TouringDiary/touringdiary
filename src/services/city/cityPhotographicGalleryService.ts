import { type ImageAssetStatusDb, isPublicUsableImageAssetStatus } from '@/constants/governance';
import type { MediaAsset, MediaStatus } from '@/types/index';
import {
  buildPublicStorageUrl,
  parseStorageLocationFromPublicUrl,
} from '@/utils/storagePathFromPublicUrl';
import { entityImageAssignmentsQuery } from '../media/entityImageAssignmentsQuery';
import { upsertEntityImageAssignmentFromSource } from '../media/entityImageAssignmentWriteService';
import {
  fetchMediaAssetsByIds,
  mediaAssetOriginForImageResolver,
} from '../media/mediaAssetService';

export type CityPhotographicGalleryItem = MediaAsset & {
  assignmentId: string;
  mediaAssetId: string;
};

function mediaStatusFromAssetStatus(assetStatus: ImageAssetStatusDb): MediaStatus {
  if (assetStatus === 'active' || assetStatus === 'restored') return 'real';
  return 'missing';
}

function normalizePublicUrl(url: string): string {
  return url.split('?')[0].trim();
}

export async function listCityPhotographicGalleryItems(
  cityId: string,
): Promise<CityPhotographicGalleryItem[]> {
  const trimmedCityId = cityId.trim();
  if (!trimmedCityId) return [];

  const { data: rows, error } = await entityImageAssignmentsQuery()
    .select('id, media_asset_id')
    .eq('entity_type', 'city')
    .eq('entity_id', trimmedCityId)
    .eq('city_id', trimmedCityId)
    .eq('assignment_role', 'gallery')
    .eq('is_current', true)
    .eq('assignment_status', 'active');

  if (error) {
    throw new Error(`Lettura galleria fotografica città fallita: ${error.message}`);
  }

  const assignmentRows: {
    id: string;
    media_asset_id: string;
  }[] = [];
  for (const raw of rows ?? []) {
    if (!raw || typeof raw !== 'object') continue;
    const row = raw as Record<string, unknown>;
    const id = typeof row.id === 'string' ? row.id.trim() : '';
    const mediaAssetId = typeof row.media_asset_id === 'string' ? row.media_asset_id.trim() : '';
    if (!id || !mediaAssetId) continue;
    assignmentRows.push({ id, media_asset_id: mediaAssetId });
  }

  if (assignmentRows.length === 0) return [];

  const assetIds = [...new Set(assignmentRows.map((r) => r.media_asset_id))];
  const assetById = await fetchMediaAssetsByIds(assetIds);

  const items: CityPhotographicGalleryItem[] = [];
  for (const row of assignmentRows) {
    const asset = assetById.get(row.media_asset_id);
    if (!asset || !isPublicUsableImageAssetStatus(asset.asset_status)) {
      continue;
    }

    const url = buildPublicStorageUrl(asset.storage_bucket, asset.storage_path);
    if (url == null || url.trim().length === 0) continue;

    items.push({
      assignmentId: row.id,
      mediaAssetId: row.media_asset_id,
      url,
      mediaStatus: mediaStatusFromAssetStatus(asset.asset_status),
      originType: mediaAssetOriginForImageResolver(asset.origin_type) ?? undefined,
    });
  }

  return items;
}

export async function addCityPhotographicGalleryImageFromUrl(
  cityId: string,
  imageUrl: string,
): Promise<string> {
  const trimmedCityId = cityId.trim();
  const url = imageUrl.trim();
  if (!trimmedCityId || !url) {
    throw new Error('cityId e URL immagine obbligatori per la galleria fotografica.');
  }

  const parsed = parseStorageLocationFromPublicUrl(url);
  if (!parsed?.storageBucket || !parsed.storagePath) {
    throw new Error(
      'URL galleria fotografica non canonico: richiesto path Storage public-media o community-photos.',
    );
  }
  const storageRoot = parsed.storagePath.split('/')[0] ?? '';
  if (storageRoot !== 'admin_uploads' && storageRoot !== 'admin_assets') {
    throw new Error(
      'Galleria fotografica Admin: path Storage non ammesso (solo admin_uploads/admin_assets).',
    );
  }
  return upsertEntityImageAssignmentFromSource({
    entityType: 'city',
    entityId: trimmedCityId,
    cityId: trimmedCityId,
    assignmentRole: 'gallery',
    source: {
      imageUrl: url,
      storageBucket: parsed.storageBucket,
      storagePath: parsed.storagePath,
      originType: 'admin',
    },
  });
}

async function revokeCityPhotographicGalleryAssignment(
  cityId: string,
  assignmentId: string,
): Promise<void> {
  const trimmedCityId = cityId.trim();
  const now = new Date().toISOString();
  const { data, error } = await entityImageAssignmentsQuery()
    .update({
      assignment_status: 'removed',
      is_current: false,
      removed_at: now,
      updated_at: now,
    })
    .eq('id', assignmentId)
    .eq('entity_type', 'city')
    .eq('entity_id', trimmedCityId)
    .eq('city_id', trimmedCityId)
    .eq('assignment_role', 'gallery')
    .eq('is_current', true)
    .eq('assignment_status', 'active')
    .select('id');

  if (error) {
    throw new Error(`Revoca assignment galleria città fallita: ${error.message}`);
  }
  const updated = data as { id: string }[] | null;
  if (!updated?.length) {
    throw new Error('Revoca assignment galleria città: nessuna riga aggiornata.');
  }
}

export async function removeCityPhotographicGalleryByAssignmentId(
  cityId: string,
  assignmentId: string,
): Promise<void> {
  const trimmedAssignmentId = assignmentId.trim();
  if (!trimmedAssignmentId) {
    throw new Error('assignmentId obbligatorio per revoca galleria città.');
  }
  await revokeCityPhotographicGalleryAssignment(cityId, trimmedAssignmentId);
}

/** Compatibilità lookup per URL; preferire removeCityPhotographicGalleryByAssignmentId. */
export async function removeCityPhotographicGalleryImageByPublicUrl(
  cityId: string,
  publicUrl: string,
): Promise<void> {
  const items = await listCityPhotographicGalleryItems(cityId);
  const target = normalizePublicUrl(publicUrl);
  const match = items.find((item) => normalizePublicUrl(item.url) === target);
  if (!match) {
    throw new Error('Immagine galleria non trovata negli assignment MF4 correnti.');
  }
  await revokeCityPhotographicGalleryAssignment(cityId, match.assignmentId);
}

export async function replaceCityPhotographicGalleryByAssignmentId(
  cityId: string,
  assignmentId: string,
  nextPublicUrl: string,
): Promise<string> {
  const newAssignmentId = await addCityPhotographicGalleryImageFromUrl(cityId, nextPublicUrl);
  try {
    await removeCityPhotographicGalleryByAssignmentId(cityId, assignmentId);
  } catch (revokeErr) {
    try {
      await removeCityPhotographicGalleryByAssignmentId(cityId, newAssignmentId);
    } catch (compensateErr) {
      throw new Error(
        `Replace galleria inconsistente: revoca precedente fallita (${revokeErr instanceof Error ? revokeErr.message : String(revokeErr)}); compensazione nuovo assignment ${newAssignmentId} fallita (${compensateErr instanceof Error ? compensateErr.message : String(compensateErr)}).`,
      );
    }
    throw new Error(
      `Replace galleria: revoca precedente fallita; nuovo assignment ${newAssignmentId} compensato.`,
    );
  }
  return newAssignmentId;
}
