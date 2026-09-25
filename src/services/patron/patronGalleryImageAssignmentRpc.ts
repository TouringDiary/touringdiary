import type { SupabaseClient } from '@supabase/supabase-js';
import type { MediaOriginTypeDb } from '@/constants/governance';
import { supabase } from '../supabaseClient';

export type PatronGalleryAssignmentOrigin = 'admin' | 'community';

function patronGalleryImageRpcStorageArgs(source: {
  imageUrl: string;
  storagePath: string | null;
}): { p_image_url: string; p_storage_path: string | null; p_storage_bucket: string | null } {
  const imageUrl = source.imageUrl.trim();
  const path = source.storagePath?.trim() ?? '';
  if (!imageUrl) {
    throw new Error('imageUrl obbligatorio per assignment gallery Patrono.');
  }
  if (path.length > 0) {
    return { p_image_url: imageUrl, p_storage_path: path, p_storage_bucket: 'public-media' };
  }
  return { p_image_url: imageUrl, p_storage_path: null, p_storage_bucket: null };
}

/** Percorso canonico POST-MF5 — RPC upsert_patron_gallery_image_assignment. */
export type InsertCityPatronGalleryPhotoWithAssignmentArgs = {
  cityId: string;
  galleryPhotoId: string;
  imageUrl: string;
  storagePath: string;
  /** NULL: la RPC calcola sort_order atomico (MAX+1 sotto advisory lock). */
  sortOrder?: number | null;
  caption?: string | null;
  sourceSuggestionItemId?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  originType: PatronGalleryAssignmentOrigin;
};

/** D90: INSERT city_patron_gallery + materializzazione assignment gallery in una transazione PostgreSQL. */
export async function insertCityPatronGalleryPhotoWithAssignmentRpc(
  args: InsertCityPatronGalleryPhotoWithAssignmentArgs,
  client: SupabaseClient = supabase,
): Promise<string> {
  const trimmedCityId = args.cityId.trim();
  const galleryPhotoId = args.galleryPhotoId.trim();
  const imageUrl = args.imageUrl.trim();
  const storagePath = args.storagePath.trim();
  if (!trimmedCityId || !galleryPhotoId || !imageUrl || !storagePath) {
    throw new Error(
      'cityId, galleryPhotoId, imageUrl e storagePath obbligatori per insert gallery Patrono.',
    );
  }

  const rpcClient = client as unknown as {
    rpc: (
      fn: 'insert_city_patron_gallery_photo_with_assignment',
      args: Record<string, string | number | null>,
    ) => Promise<{ data: string | null; error: { message: string } | null }>;
  };

  const { data, error } = await rpcClient.rpc('insert_city_patron_gallery_photo_with_assignment', {
    p_city_id: trimmedCityId,
    p_gallery_photo_id: galleryPhotoId,
    p_image_url: imageUrl,
    p_storage_path: storagePath,
    p_sort_order: args.sortOrder ?? null,
    p_caption: args.caption?.trim() ? args.caption.trim() : null,
    p_source_suggestion_item_id: args.sourceSuggestionItemId?.trim()
      ? args.sourceSuggestionItemId.trim()
      : null,
    p_approved_by: null,
    p_approved_at: null,
    p_origin_type: args.originType satisfies MediaOriginTypeDb,
  });

  if (error) {
    throw new Error(error.message);
  }
  if (typeof data !== 'string' || data.trim().length === 0) {
    throw new Error('insert_city_patron_gallery_photo_with_assignment: assignment id assente.');
  }
  return data.trim();
}

export async function upsertPatronGalleryImageAssignmentRpc(
  cityId: string,
  source: {
    imageUrl: string;
    storagePath: string | null;
  },
  originType: PatronGalleryAssignmentOrigin,
  client: SupabaseClient = supabase,
): Promise<string> {
  const trimmedCityId = cityId.trim();
  if (!trimmedCityId) {
    throw new Error('cityId obbligatorio per assignment gallery Patrono.');
  }
  const storageArgs = patronGalleryImageRpcStorageArgs(source);

  const rpcClient = client as unknown as {
    rpc: (
      fn: 'upsert_patron_gallery_image_assignment',
      args: Record<string, string | null>,
    ) => Promise<{ data: string | null; error: { message: string } | null }>;
  };

  const { data, error } = await rpcClient.rpc('upsert_patron_gallery_image_assignment', {
    p_city_id: trimmedCityId,
    ...storageArgs,
    p_origin_type: originType satisfies MediaOriginTypeDb,
  });

  if (error) {
    throw new Error(error.message);
  }
  if (typeof data !== 'string' || data.trim().length === 0) {
    throw new Error('Assignment gallery Patrono: identificativo assente dalla RPC.');
  }
  return data.trim();
}

/** SQL RETURNS void: successo implicito; incoerenze → EXCEPTION (nessun no-op silenzioso). */
export async function revokePatronGalleryImageAssignmentRpc(
  assignmentId: string,
  client: SupabaseClient = supabase,
): Promise<void> {
  const id = assignmentId.trim();
  if (!id) {
    throw new Error('assignmentId obbligatorio per revoca assignment gallery Patrono.');
  }

  const rpcClient = client as unknown as {
    rpc: (
      fn: 'revoke_patron_gallery_image_assignment',
      args: { p_assignment_id: string },
    ) => Promise<{ data: unknown; error: { message: string } | null }>;
  };

  const { error } = await rpcClient.rpc('revoke_patron_gallery_image_assignment', {
    p_assignment_id: id,
  });
  if (error) {
    throw new Error(`Revoca assignment gallery Patrono fallita: ${error.message}`);
  }
}

export async function replaceCityPatronGalleryPhotoWithAssignmentRpc(
  galleryPhotoId: string,
  imageUrl: string,
  storagePath: string | null,
  originType: PatronGalleryAssignmentOrigin,
  client: SupabaseClient = supabase,
): Promise<string> {
  const url = imageUrl.trim();
  if (!galleryPhotoId.trim() || !url) {
    throw new Error('galleryPhotoId e imageUrl obbligatori.');
  }
  const storageArgs = patronGalleryImageRpcStorageArgs({ imageUrl: url, storagePath });

  const rpcClient = client as unknown as {
    rpc: (
      fn: 'replace_city_patron_gallery_photo_with_assignment',
      args: Record<string, string | null>,
    ) => Promise<{ data: string | null; error: { message: string } | null }>;
  };

  const { data, error } = await rpcClient.rpc('replace_city_patron_gallery_photo_with_assignment', {
    p_gallery_photo_id: galleryPhotoId.trim(),
    ...storageArgs,
    p_origin_type: originType satisfies MediaOriginTypeDb,
  });

  if (error) throw new Error(error.message);
  if (typeof data !== 'string' || data.trim().length === 0) {
    throw new Error('replace_city_patron_gallery_photo_with_assignment: id assignment assente.');
  }
  return data.trim();
}

/** DELETE atomico riga gallery + revoca assignment (POST-MF5). Restituisce media_asset_id per archive opzionale. */
export async function deleteCityPatronGalleryPhotoWithAssignmentRpc(
  galleryPhotoId: string,
  client: SupabaseClient = supabase,
): Promise<string | null> {
  const id = galleryPhotoId.trim();
  if (!id) {
    throw new Error('galleryPhotoId obbligatorio.');
  }

  const rpcClient = client as unknown as {
    rpc: (
      fn: 'delete_city_patron_gallery_photo_with_assignment',
      args: { p_gallery_photo_id: string },
    ) => Promise<{ data: string | null; error: { message: string } | null }>;
  };

  const { data, error } = await rpcClient.rpc('delete_city_patron_gallery_photo_with_assignment', {
    p_gallery_photo_id: id,
  });
  if (error) {
    throw new Error(`Eliminazione gallery Patrono fallita: ${error.message}`);
  }
  if (data == null) return null;
  if (typeof data !== 'string') return null;
  const trimmed = data.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolvePatronGalleryOriginType(
  sourceSuggestionItemId: string | null | undefined,
): PatronGalleryAssignmentOrigin {
  return sourceSuggestionItemId?.trim() ? 'community' : 'admin';
}
