import type { Database } from '@/types/database';
import type { CityPatronGalleryPhoto } from '@/types/models/patronGallery';
import {
  copyPublicMediaToFolder,
  deletePublicMediaByStoragePath,
  uploadPublicMediaDetailed,
} from '../mediaService';
import { supabase } from '../supabaseClient';

type GalleryRow = Database['public']['Tables']['city_patron_gallery']['Row'];
type GalleryInsert = Database['public']['Tables']['city_patron_gallery']['Insert'];

const normalizeCaption = (caption: string | null | undefined): string | null => {
  if (caption == null) return null;
  const trimmed = caption.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const mapRow = (row: GalleryRow): CityPatronGalleryPhoto => ({
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
});

export const listCityPatronGallery = async (cityId: string): Promise<CityPatronGalleryPhoto[]> => {
  const { data, error } = await supabase
    .from('city_patron_gallery')
    .select('*')
    .eq('city_id', cityId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapRow);
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

  return mapRow({
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
  });
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

  return mapRow({
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
  });
};

export const deleteCityPatronGalleryPhoto = async (photoId: string): Promise<void> => {
  const { data: photo, error: fetchError } = await supabase
    .from('city_patron_gallery')
    .select('storage_path')
    .eq('id', photoId)
    .maybeSingle();
  if (fetchError) throw fetchError;

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

  const { error } = await supabase
    .from('city_patron_gallery')
    .update({ image_url: imageUrl, storage_path: storagePath })
    .eq('id', photoId);
  if (error) throw error;

  return mapRow({
    ...existing,
    image_url: imageUrl,
    storage_path: storagePath,
  });
};
