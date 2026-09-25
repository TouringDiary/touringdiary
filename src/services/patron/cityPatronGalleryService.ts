import type { Database } from '@/types/database';
import type { CityPatronGalleryPhoto } from '@/types/models/patronGallery';
import { filterPatronGalleryByAssignmentVisibility } from '../media/imageAssignmentVisibilityService';
import { safeArchiveMediaAsset } from '../media/mediaCatalogService';
import {
  copyPublicMediaToFolder,
  deletePublicMediaByStoragePath,
  uploadPublicMediaDetailed,
} from '../mediaService';
import { mf2EntityImageAssignmentsTable } from '../reports/mf2DbClient';
import { supabase } from '../supabaseClient';
import {
  assignmentMatchesGalleryRow,
  type RepairPatronGalleryAssignmentsResult,
  runPatronGalleryAssignmentRepair,
} from './patronGalleryAssignmentRepairs';
import {
  deleteCityPatronGalleryPhotoWithAssignmentRpc,
  insertCityPatronGalleryPhotoWithAssignmentRpc,
  replaceCityPatronGalleryPhotoWithAssignmentRpc,
  resolvePatronGalleryOriginType,
} from './patronGalleryImageAssignmentRpc';

type GalleryRow = Database['public']['Tables']['city_patron_gallery']['Row'];
type PatronGalleryAssignmentRow = {
  id: string;
  media_asset_id: string;
  source_image_url: string | null;
  source_storage_path: string | null;
  source_storage_bucket: string | null;
  assignment_status: string;
};

export type ListCityPatronGalleryOptions = {
  /** Nasconde foto con assignment sospeso/rimosso (read path pubblico D86). */
  maskSuspendedAssignments?: boolean;
};

const normalizeCaption = (caption: string | null | undefined): string | null => {
  if (caption == null) return null;
  const trimmed = caption.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const mapRow = (row: GalleryRow, assignmentId?: string | null): CityPatronGalleryPhoto => ({
  id: row.id,
  cityId: row.city_id,
  imageUrl: row.image_url,
  storagePath: row.storage_path,
  caption: row.caption,
  sortOrder: row.sort_order,
  createdAt: row.created_at,
  sourceSuggestionItemId: row.source_suggestion_item_id,
  approvedBy: row.approved_by,
  approvedAt: row.approved_at,
  assignmentId: assignmentId ?? null,
});

/** Match assignment ↔ gallery: stesso contrato di upsert_patron_gallery_image_assignment (via assignmentMatchesGalleryRow). */
async function attachPatronGalleryAssignmentIds(
  cityId: string,
  photos: CityPatronGalleryPhoto[],
): Promise<CityPatronGalleryPhoto[]> {
  if (photos.length === 0) return photos;

  const { data, error } = await mf2EntityImageAssignmentsTable()
    .select(
      'id, media_asset_id, source_image_url, source_storage_path, source_storage_bucket, assignment_status',
    )
    .eq('entity_type', 'patron')
    .eq('entity_id', cityId)
    .eq('city_id', cityId)
    .eq('assignment_role', 'gallery')
    .eq('is_current', true)
    .eq('assignment_status', 'active');

  if (error) {
    throw new Error(`Lettura assignment galleria Patrono fallita: ${error.message}`);
  }

  const rows = (data ?? []) as unknown as PatronGalleryAssignmentRow[];

  return photos.map((photo) => {
    const imageUrl = photo.imageUrl.trim();
    const storagePath = photo.storagePath?.trim() ?? '';
    let matchCount = 0;
    let assignmentId: string | null = null;
    for (const row of rows) {
      if (!assignmentMatchesGalleryRow(row, imageUrl, storagePath)) continue;
      matchCount += 1;
      if (matchCount === 1) assignmentId = row.id;
    }
    if (matchCount > 1) {
      throw new Error(
        `Incoerenza gallery Patrono: più assignment attivi corrispondono alla foto ${photo.id} (city_id=${cityId}).`,
      );
    }
    return { ...photo, assignmentId };
  });
}

export const listCityPatronGallery = async (
  cityId: string,
  options: ListCityPatronGalleryOptions = {},
): Promise<CityPatronGalleryPhoto[]> => {
  const { data, error } = await supabase
    .from('city_patron_gallery')
    .select('*')
    .eq('city_id', cityId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;

  let photos = (data ?? []).map((row) => mapRow(row));
  photos = await attachPatronGalleryAssignmentIds(cityId, photos);

  if (options.maskSuspendedAssignments) {
    photos = await filterPatronGalleryByAssignmentVisibility(cityId, photos);
  }

  return photos;
};

/** D90: RPC `insert_city_patron_gallery_photo_with_assignment` (gallery row + assignment in una transazione). */
export const addCityPatronGalleryPhoto = async (
  cityId: string,
  file: File,
  caption?: string | null,
): Promise<CityPatronGalleryPhoto | null> => {
  const folder = `city_patron_gallery/${cityId}`;
  const uploaded = await uploadPublicMediaDetailed(file, folder);
  if (!uploaded) return null;

  const normalizedCaption = normalizeCaption(caption);

  const id = crypto.randomUUID();

  try {
    const assignmentId = await insertCityPatronGalleryPhotoWithAssignmentRpc({
      cityId,
      galleryPhotoId: id,
      imageUrl: uploaded.publicUrl,
      storagePath: uploaded.storagePath,
      caption: normalizedCaption,
      originType: 'admin',
    });

    const { data, error } = await supabase
      .from('city_patron_gallery')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      throw new Error('Gallery Patrono: riga assente dopo insert atomico.');
    }

    return mapRow(data, assignmentId);
  } catch (insertErr) {
    const removed = await deletePublicMediaByStoragePath(uploaded.storagePath);
    if (!removed) {
      console.error(
        '[addCityPatronGalleryPhoto] insert atomico fallito e cleanup Storage non riuscito; possibile file orfano:',
        uploaded.storagePath,
        insertErr,
      );
    }
    throw insertErr;
  }
};

export type ApprovedSuggestionGalleryItem = {
  id: string;
  storagePath: string;
  caption?: string | null;
};

export const addCityPatronGalleryPhotoFromApprovedSuggestion = async (
  cityId: string,
  sourceItem: ApprovedSuggestionGalleryItem,
  _approvedByUserId: string,
): Promise<CityPatronGalleryPhoto> => {
  const destFolder = `city_patron_gallery/${cityId}`;
  const copied = await copyPublicMediaToFolder(sourceItem.storagePath, destFolder);
  if (!copied) {
    throw new Error('Impossibile copiare la fotografia nella gallery ufficiale.');
  }

  // Quality Delta: sort_order da list client-side — concorrenza non risolta senza RPC batch dedicata.
  const normalizedCaption = normalizeCaption(sourceItem.caption);

  const id = crypto.randomUUID();

  try {
    // approved_by/approved_at: server-authoritative (SQL auth.uid()); _approvedByUserId solo compat API.
    const assignmentId = await insertCityPatronGalleryPhotoWithAssignmentRpc({
      cityId,
      galleryPhotoId: id,
      imageUrl: copied.publicUrl,
      storagePath: copied.storagePath,
      caption: normalizedCaption,
      sourceSuggestionItemId: sourceItem.id,
      originType: 'community',
    });

    const { data, error } = await supabase
      .from('city_patron_gallery')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      throw new Error('Gallery Patrono: riga assente dopo insert atomico (suggestion).');
    }

    return mapRow(data, assignmentId);
  } catch (insertErr) {
    const removed = await deletePublicMediaByStoragePath(copied.storagePath);
    if (!removed) {
      console.error(
        '[addCityPatronGalleryPhotoFromApprovedSuggestion] insert atomico fallito e cleanup Storage non riuscito; possibile file orfano:',
        copied.storagePath,
        insertErr,
      );
    }
    throw insertErr;
  }
};

export const deleteCityPatronGalleryPhoto = async (photoId: string): Promise<void> => {
  const mediaAssetIdToArchive = await deleteCityPatronGalleryPhotoWithAssignmentRpc(photoId);

  if (mediaAssetIdToArchive) {
    const archiveResult = await safeArchiveMediaAsset(
      mediaAssetIdToArchive,
      'patron_gallery_photo_deleted',
    );
    if (!archiveResult.ok) {
      console.warn(
        '[deleteCityPatronGalleryPhoto] safe_archive non riuscito (asset possibilmente condiviso):',
        mediaAssetIdToArchive,
        archiveResult.message,
      );
    }
  }
};

/**
 * Aggiorna sort_order per foto (UPDATE separate). Non atomico end-to-end: se una UPDATE fallisce,
 * le precedenti possono restare applicate (nessuna RPC batch nel dominio Patrono gallery).
 */
/** Quality Delta: reorder non atomico (N update client-side); batch RPC server-side non in scope. */
export const reorderCityPatronGallery = async (
  cityId: string,
  orderedPhotoIds: string[],
): Promise<void> => {
  const updates = orderedPhotoIds.map((id, index) =>
    supabase
      .from('city_patron_gallery')
      .update({ sort_order: index })
      .eq('id', id)
      .eq('city_id', cityId),
  );
  const results = await Promise.all(updates);
  for (const { error } of results) {
    if (error) throw error;
  }
};

export const updateCityPatronGalleryPhotoUrl = async (
  photoId: string,
  imageUrl: string,
  storagePath: string | null,
): Promise<CityPatronGalleryPhoto> => {
  const { data: existing, error: fetchError } = await supabase
    .from('city_patron_gallery')
    .select('*')
    .eq('id', photoId)
    .single();
  if (fetchError) throw fetchError;

  const assignmentId = await replaceCityPatronGalleryPhotoWithAssignmentRpc(
    photoId,
    imageUrl,
    storagePath,
    resolvePatronGalleryOriginType(existing.source_suggestion_item_id),
  );

  return mapRow(
    {
      ...existing,
      image_url: imageUrl,
      storage_path: storagePath,
    },
    assignmentId,
  );
};

export type { RepairPatronGalleryAssignmentsResult };

/** Ripara righe gallery senza assignment corrente (POST-MF5 visibilità pubblica). */
export const repairPatronGalleryMissingAssignments = async (
  options: { execute?: boolean } = {},
): Promise<RepairPatronGalleryAssignmentsResult> =>
  runPatronGalleryAssignmentRepair(supabase, options.execute === true);
