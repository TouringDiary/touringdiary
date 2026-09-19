import type { Database } from '@/types/database';
import type { CityPatronGalleryPhoto } from '@/types/models/patronGallery';
import { upsertEntityImageAssignmentDualWrite } from '../media/imageAssignmentDualWriteService';
import { filterPatronGalleryByAssignmentVisibility } from '../media/imageAssignmentVisibilityService';
import {
  copyPublicMediaToFolder,
  deletePublicMediaByStoragePath,
  uploadPublicMediaDetailed,
} from '../mediaService';
import { mf2EntityImageAssignmentsTable } from '../reports/mf2DbClient';
import { supabase } from '../supabaseClient';

type GalleryRow = Database['public']['Tables']['city_patron_gallery']['Row'];
type GalleryInsert = Database['public']['Tables']['city_patron_gallery']['Insert'];

type PatronGalleryAssignmentRow = {
  id: string;
  source_image_url: string | null;
  source_storage_path: string | null;
  assignment_status: string;
};

type Mf2AssignmentConditionalUpdateBuilder = {
  eq: (column: string, value: string | boolean) => Mf2AssignmentConditionalUpdateBuilder;
  select: (columns: string) => Promise<{
    data: unknown;
    error: { message: string } | null;
  }>;
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

async function attachPatronGalleryAssignmentIds(
  cityId: string,
  photos: CityPatronGalleryPhoto[],
): Promise<CityPatronGalleryPhoto[]> {
  if (photos.length === 0) return photos;

  const { data, error } = await mf2EntityImageAssignmentsTable()
    .select('id, source_image_url, source_storage_path, assignment_status')
    .eq('entity_type', 'patron')
    .eq('entity_id', cityId)
    .eq('city_id', cityId)
    .eq('assignment_role', 'gallery')
    .eq('is_current', true);

  if (error) {
    throw new Error(`Lettura assignment galleria Patrono fallita: ${error.message}`);
  }

  const rows = (data ?? []) as unknown as PatronGalleryAssignmentRow[];

  return photos.map((photo) => {
    const path = photo.storagePath?.trim() ?? '';
    const url = photo.imageUrl.trim();
    const match = rows.find((row) => {
      if (path.length > 0 && row.source_storage_path?.trim() === path) return true;
      return url.length > 0 && row.source_image_url?.trim() === url;
    });
    return { ...photo, assignmentId: match?.id ?? null };
  });
}

async function dualWritePatronGalleryAssignment(
  cityId: string,
  photo: Pick<CityPatronGalleryPhoto, 'imageUrl' | 'storagePath'>,
): Promise<string> {
  return upsertEntityImageAssignmentDualWrite({
    entityType: 'patron',
    entityId: cityId,
    cityId,
    assignmentRole: 'gallery',
    source: {
      imageUrl: photo.imageUrl,
      storageBucket: 'public-media',
      storagePath: photo.storagePath ?? null,
      originType: 'admin',
    },
  });
}

/** Lifecycle MF2 removal — stesso contratto di transition_report_status (image_abuse → ok). */
async function revokePatronGalleryAssignment(
  cityId: string,
  photo: Pick<CityPatronGalleryPhoto, 'imageUrl' | 'storagePath' | 'assignmentId'>,
): Promise<void> {
  const explicitId = photo.assignmentId?.trim() ?? '';
  let assignmentId = explicitId;

  if (!assignmentId) {
    const path = photo.storagePath?.trim() ?? '';
    const url = photo.imageUrl.trim();
    const { data, error } = await mf2EntityImageAssignmentsTable()
      .select('id, source_image_url, source_storage_path')
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
    const match = rows.find((row) => {
      if (path.length > 0 && row.source_storage_path?.trim() === path) return true;
      return url.length > 0 && row.source_image_url?.trim() === url;
    });
    assignmentId = match?.id ?? '';
  }

  if (!assignmentId) return;

  const now = new Date().toISOString();
  const updateClient = mf2EntityImageAssignmentsTable() as unknown as {
    update: (values: {
      assignment_status: 'removed';
      removed_at: string;
      updated_at: string;
    }) => Mf2AssignmentConditionalUpdateBuilder;
  };
  const { data: updatedRows, error: updateError } = await updateClient
    .update({
      assignment_status: 'removed',
      removed_at: now,
      updated_at: now,
    })
    .eq('id', assignmentId)
    .eq('entity_type', 'patron')
    .eq('entity_id', cityId)
    .eq('city_id', cityId)
    .eq('assignment_role', 'gallery')
    .eq('is_current', true)
    .eq('assignment_status', 'active')
    .select('id');

  if (updateError) {
    throw new Error(`Revoca assignment galleria Patrono fallita: ${updateError.message}`);
  }

  const rows = updatedRows as unknown as { id: string }[] | null;
  if (!rows || rows.length === 0) {
    throw new Error(
      'Revoca assignment galleria Patrono fallita: nessuna riga aggiornata (stato cambiato).',
    );
  }
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

export const addCityPatronGalleryPhoto = async (
  cityId: string,
  file: File,
  caption?: string | null,
): Promise<CityPatronGalleryPhoto | null> => {
  const folder = `city_patron_gallery/${cityId}`;
  const uploaded = await uploadPublicMediaDetailed(file, folder);
  if (!uploaded) return null;

  const existing = await listCityPatronGallery(cityId);
  const nextOrder = existing.length > 0 ? Math.max(...existing.map((p) => p.sortOrder)) + 1 : 0;
  const normalizedCaption = normalizeCaption(caption);

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const payload: GalleryInsert = {
    id,
    city_id: cityId,
    image_url: uploaded.publicUrl,
    storage_path: uploaded.storagePath,
    sort_order: nextOrder,
    created_at: createdAt,
    caption: normalizedCaption,
  };

  const { error } = await supabase.from('city_patron_gallery').insert(payload);
  if (error) {
    const removed = await deletePublicMediaByStoragePath(uploaded.storagePath);
    if (!removed) {
      console.error(
        '[addCityPatronGalleryPhoto] INSERT fallito e cleanup Storage non riuscito; possibile file orfano:',
        uploaded.storagePath,
        error,
      );
    }
    throw error;
  }

  try {
    const assignmentId = await dualWritePatronGalleryAssignment(cityId, {
      imageUrl: uploaded.publicUrl,
      storagePath: uploaded.storagePath,
    });

    return mapRow(
      {
        id,
        city_id: cityId,
        image_url: uploaded.publicUrl,
        storage_path: uploaded.storagePath,
        sort_order: nextOrder,
        created_at: createdAt,
        caption: normalizedCaption,
        source_suggestion_item_id: null,
        approved_by: null,
        approved_at: null,
      },
      assignmentId,
    );
  } catch (dualWriteErr) {
    const { error: legacyCleanupError } = await supabase
      .from('city_patron_gallery')
      .delete()
      .eq('id', id);
    if (legacyCleanupError) {
      console.error(
        '[addCityPatronGalleryPhoto] dual-write fallito e cleanup legacy non riuscito:',
        legacyCleanupError,
        dualWriteErr,
      );
    }
    const removed = await deletePublicMediaByStoragePath(uploaded.storagePath);
    if (!removed) {
      console.error(
        '[addCityPatronGalleryPhoto] dual-write fallito e cleanup Storage non riuscito; possibile file orfano:',
        uploaded.storagePath,
        dualWriteErr,
      );
    }
    throw dualWriteErr;
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
  approvedByUserId: string,
): Promise<CityPatronGalleryPhoto> => {
  const destFolder = `city_patron_gallery/${cityId}`;
  const copied = await copyPublicMediaToFolder(sourceItem.storagePath, destFolder);
  if (!copied) {
    throw new Error('Impossibile copiare la fotografia nella gallery ufficiale.');
  }

  const existing = await listCityPatronGallery(cityId);
  const nextOrder = existing.length > 0 ? Math.max(...existing.map((p) => p.sortOrder)) + 1 : 0;
  const normalizedCaption = normalizeCaption(sourceItem.caption);

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const approvedAt = createdAt;
  const payload: GalleryInsert = {
    id,
    city_id: cityId,
    image_url: copied.publicUrl,
    storage_path: copied.storagePath,
    sort_order: nextOrder,
    created_at: createdAt,
    caption: normalizedCaption,
    source_suggestion_item_id: sourceItem.id,
    approved_by: approvedByUserId,
    approved_at: approvedAt,
  };

  const { error } = await supabase.from('city_patron_gallery').insert(payload);
  if (error) {
    const removed = await deletePublicMediaByStoragePath(copied.storagePath);
    if (!removed) {
      console.error(
        '[addCityPatronGalleryPhotoFromApprovedSuggestion] INSERT fallito e cleanup Storage non riuscito; possibile file orfano:',
        copied.storagePath,
        error,
      );
    }
    throw error;
  }

  try {
    const assignmentId = await dualWritePatronGalleryAssignment(cityId, {
      imageUrl: copied.publicUrl,
      storagePath: copied.storagePath,
    });

    return mapRow(
      {
        id,
        city_id: cityId,
        image_url: copied.publicUrl,
        storage_path: copied.storagePath,
        sort_order: nextOrder,
        created_at: createdAt,
        caption: normalizedCaption,
        source_suggestion_item_id: sourceItem.id,
        approved_by: approvedByUserId,
        approved_at: approvedAt,
      },
      assignmentId,
    );
  } catch (dualWriteErr) {
    const { error: legacyCleanupError } = await supabase
      .from('city_patron_gallery')
      .delete()
      .eq('id', id);
    if (legacyCleanupError) {
      console.error(
        '[addCityPatronGalleryPhotoFromApprovedSuggestion] dual-write fallito e cleanup legacy non riuscito:',
        legacyCleanupError,
        dualWriteErr,
      );
    }
    const removed = await deletePublicMediaByStoragePath(copied.storagePath);
    if (!removed) {
      console.error(
        '[addCityPatronGalleryPhotoFromApprovedSuggestion] dual-write fallito e cleanup Storage non riuscito; possibile file orfano:',
        copied.storagePath,
        dualWriteErr,
      );
    }
    throw dualWriteErr;
  }
};

export const deleteCityPatronGalleryPhoto = async (photoId: string): Promise<void> => {
  const { data: photo, error: fetchError } = await supabase
    .from('city_patron_gallery')
    .select('city_id, image_url, storage_path')
    .eq('id', photoId)
    .maybeSingle();
  if (fetchError) throw fetchError;

  if (photo) {
    const [withAssignment] = await attachPatronGalleryAssignmentIds(photo.city_id, [
      mapRow({
        id: photoId,
        city_id: photo.city_id,
        image_url: photo.image_url,
        storage_path: photo.storage_path,
        sort_order: 0,
        created_at: '',
        caption: null,
        source_suggestion_item_id: null,
        approved_by: null,
        approved_at: null,
      }),
    ]);
    await revokePatronGalleryAssignment(photo.city_id, {
      imageUrl: photo.image_url,
      storagePath: photo.storage_path,
      assignmentId: withAssignment?.assignmentId ?? null,
    });
  }

  const { error } = await supabase.from('city_patron_gallery').delete().eq('id', photoId);
  if (error) throw error;

  // Pattern consolidato (DB SoT → Storage): se Storage fallisce dopo DELETE DB, non fingere successo.
  if (photo?.storage_path) {
    const removed = await deletePublicMediaByStoragePath(photo.storage_path);
    if (!removed) {
      throw new Error(
        `Foto gallery eliminata dal database, ma rimozione Storage non riuscita (${photo.storage_path}).`,
      );
    }
  }
};

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

  const [withOldAssignment] = await attachPatronGalleryAssignmentIds(existing.city_id, [
    mapRow(existing),
  ]);
  const oldAssignmentId = withOldAssignment?.assignmentId ?? null;
  const sourceChanged =
    imageUrl.trim() !== existing.image_url.trim() ||
    (storagePath?.trim() ?? '') !== (existing.storage_path?.trim() ?? '');

  const { error } = await supabase
    .from('city_patron_gallery')
    .update({ image_url: imageUrl, storage_path: storagePath })
    .eq('id', photoId);
  if (error) throw error;

  const row = mapRow({
    ...existing,
    image_url: imageUrl,
    storage_path: storagePath,
  });

  let newAssignmentId: string | null = null;
  try {
    newAssignmentId = await dualWritePatronGalleryAssignment(existing.city_id, {
      imageUrl,
      storagePath,
    });
    if (sourceChanged) {
      try {
        await revokePatronGalleryAssignment(existing.city_id, {
          imageUrl: existing.image_url,
          storagePath: existing.storage_path,
          assignmentId: oldAssignmentId,
        });
      } catch (revokeOldErr) {
        if (newAssignmentId && newAssignmentId !== oldAssignmentId) {
          try {
            await revokePatronGalleryAssignment(existing.city_id, {
              imageUrl,
              storagePath,
              assignmentId: newAssignmentId,
            });
          } catch (compensateErr) {
            console.error(
              '[updateCityPatronGalleryPhotoUrl] revoca vecchia assignment fallita e compensazione nuova assignment non riuscita:',
              compensateErr,
              revokeOldErr,
            );
          }
        }
        const { error: rollbackError } = await supabase
          .from('city_patron_gallery')
          .update({
            image_url: existing.image_url,
            storage_path: existing.storage_path,
          })
          .eq('id', photoId);
        if (rollbackError) {
          console.error(
            '[updateCityPatronGalleryPhotoUrl] revoca vecchia assignment fallita e rollback legacy non riuscito:',
            rollbackError,
            revokeOldErr,
          );
        }
        throw revokeOldErr;
      }
    }
    return { ...row, assignmentId: newAssignmentId };
  } catch (dualWriteErr) {
    const { error: rollbackError } = await supabase
      .from('city_patron_gallery')
      .update({
        image_url: existing.image_url,
        storage_path: existing.storage_path,
      })
      .eq('id', photoId);
    if (rollbackError) {
      console.error(
        '[updateCityPatronGalleryPhotoUrl] dual-write fallito e rollback legacy non riuscito:',
        rollbackError,
        dualWriteErr,
      );
    }
    throw dualWriteErr;
  }
};
