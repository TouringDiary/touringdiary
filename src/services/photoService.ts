import type { DatabasePhotoSubmission } from '../types/database';
import type { Insert, Update } from '../types/domain/index';
import type { MediaStatus, PhotoSubmission } from '../types/index';
import { supabase } from './supabaseClient';

/** Tipi locali per hardening join e update */
type DatabasePhotoSubmissionUpdate = Update<'photo_submissions'>;
type DbPhotoWithLikes = DatabasePhotoSubmission & {
  photo_likes?: { photo_id: string; user_id?: string }[];
};

// FIX: Import diretti per evitare cicli

import {
  assertPhotographWrite,
  canRegisterAsPhotograph,
} from '@/domain/photos/assertPhotographWrite';
import { filterPhotographs, PHOTOGRAPH_READ_MEDIA_STATUS } from '@/domain/photos/photographQuery';
import { resolvePlatformUserBody } from '@/services/platformControl/resolvePlatformUserMessage';
import {
  PLATFORM_FEATURE_FLAG_KEYS,
  PLATFORM_MESSAGE_TEMPLATE_KEYS,
} from '../constants/platformFeatureFlags';
import { evaluateCachedFeatureFlag } from '../domain/platformControl/platformFlagCache';
import { dataURLtoFile } from '../utils/common';
import { parseStorageLocationFromPublicUrl } from '../utils/storagePathFromPublicUrl';
import { getCityDetails, getFullManifestAsync, resolveCityIdentity } from './city/cityReadService';
import { upsertEntityImageAssignmentFromSource } from './media/entityImageAssignmentWriteService';
import { mapDbPhotoSubmission } from './photoMapper';
import { mf2EntityImageAssignmentsTable } from './reports/mf2DbClient';
import { getPlatformPlaceholderRegistryAsync } from './settingsService';

const BUCKET_NAME = 'community-photos';

/** Bare URL (no Markdown) — fallback hero città dopo rimozione foto community collegata. */
const PROPAGATE_PHOTO_REMOVAL_HERO_FALLBACK_URL =
  'https://images.unsplash.com/photo-1596825205486-3c36957b9fba?q=80&w=1000';

/** Revoca + compensazione assignment fallite: non eseguire rollback legacy submission. */
class PhotoSubmissionAssignmentInconsistentError extends Error {
  override readonly name = 'PhotoSubmissionAssignmentInconsistentError';
}

function attachStorageMeta(photo: PhotoSubmission): PhotoSubmission {
  if (photo.storageBucket?.trim() && photo.storagePath?.trim()) return photo;
  const parsed = parseStorageLocationFromPublicUrl(photo.url);
  if (!parsed) return photo;
  return {
    ...photo,
    storageBucket: parsed.storageBucket,
    storagePath: parsed.storagePath,
  };
}

async function materializePhotoSubmissionAssignment(
  photo: PhotoSubmission,
  storagePath: string | null,
): Promise<PhotoSubmission> {
  const cityId = photo.cityId?.trim();
  if (!cityId) return photo;

  const withStorage = attachStorageMeta({
    ...photo,
    storageBucket: photo.storageBucket ?? BUCKET_NAME,
    storagePath: photo.storagePath ?? storagePath,
  });

  try {
    const assignmentId = await upsertEntityImageAssignmentFromSource({
      entityType: 'photo_submission',
      entityId: photo.id,
      cityId,
      assignmentRole: 'primary',
      source: {
        imageUrl: withStorage.url,
        storageBucket: withStorage.storageBucket ?? BUCKET_NAME,
        storagePath: withStorage.storagePath ?? null,
        originType: 'community',
      },
    });
    return { ...withStorage, assignmentId };
  } catch (err) {
    console.error('[photoService] materialize photo_submission assignment failed:', err);
    throw err instanceof Error ? err : new Error('Assignment foto Community fallito.');
  }
}

async function resolveUploadCallerIsAdmin(): Promise<boolean> {
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !authUser?.id) return false;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authUser.id)
    .maybeSingle();

  if (profileError || !profile?.role) return false;

  return profile.role === 'admin_all' || profile.role === 'admin_limited';
}

type PhotoSubmissionAssignmentRow = {
  id: string;
  entity_id: string;
  assignment_status: string;
};

/**
 * Arricchisce le photo_submission con l'assignment MF2 corrente e filtra quelle non pubblicabili.
 * - Nessun assignment corrente → submission visibile (legacy community read), assignmentId null.
 * - Assignment corrente active → visibile, assignmentId reale.
 * - Assignment corrente suspended/removed/replaced → esclusa dalla lista pubblica.
 */
async function attachPhotoSubmissionAssignmentIds(
  photos: PhotoSubmission[],
): Promise<PhotoSubmission[]> {
  if (photos.length === 0) return photos;

  const entityIds = [...new Set(photos.map((p) => p.id))];
  const { data, error } = await mf2EntityImageAssignmentsTable()
    .select('id, entity_id, assignment_status')
    .eq('entity_type', 'photo_submission')
    .in('entity_id', entityIds)
    .eq('is_current', true);

  if (error) {
    throw new Error(`Lettura assignment foto Community fallita: ${error.message}`);
  }

  const assignmentByEntityId = new Map<string, PhotoSubmissionAssignmentRow>();
  for (const row of (data ?? []) as unknown as PhotoSubmissionAssignmentRow[]) {
    assignmentByEntityId.set(row.entity_id, row);
  }

  const enriched: PhotoSubmission[] = [];
  for (const photo of photos) {
    const assignment = assignmentByEntityId.get(photo.id);
    if (!assignment) {
      enriched.push({ ...photo, assignmentId: null });
      continue;
    }
    if (assignment.assignment_status !== 'active') {
      continue;
    }
    enriched.push({ ...photo, assignmentId: assignment.id });
  }
  return enriched;
}

/** entity_image_assignments.id corrente e attivo per entità MF2 (assignment SoT). */
export async function getCurrentImageAssignmentId(
  entityType: 'city_person' | 'poi' | 'patron' | 'photo_submission',
  entityId: string,
  cityId: string,
  assignmentRole: 'primary' | 'gallery' = 'primary',
): Promise<string | null> {
  const { data, error } = await mf2EntityImageAssignmentsTable()
    .select('id')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('city_id', cityId)
    .eq('assignment_role', assignmentRole)
    .eq('is_current', true)
    .eq('assignment_status', 'active')
    .maybeSingle();

  if (error) {
    throw new Error(`Lettura assignment corrente fallita: ${error.message}`);
  }
  return (data as { id: string } | null)?.id ?? null;
}
const PUBLIC_BUCKET = 'public-media';

// Helper Regex UUID (UNICA DEFINIZIONE VALIDA)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// --------------------------------------------------
// PENDING PHOTO COUNT
// --------------------------------------------------

export const getPendingPhotoCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('photo_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) throw error;

    return count || 0;
  } catch {
    return 0;
  }
};

// --------------------------------------------------
// PUBLIC MEDIA UPLOAD
// --------------------------------------------------

export const uploadPublicMedia = async (
  file: File,
  folder: string = 'general',
): Promise<string | null> => {
  try {
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

    const timestamp = Date.now();

    const filePath = `${folder}/${timestamp}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(PUBLIC_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(filePath);

    return publicUrl;
  } catch {
    return null;
  }
};

// --------------------------------------------------
// BASE64 MEDIA UPLOAD
// --------------------------------------------------

export const uploadBase64PublicMedia = async (
  base64Data: string,
  folder: string = 'edited',
): Promise<string | null> => {
  try {
    const fileName = `edited_${Date.now()}.jpg`;

    const file = dataURLtoFile(base64Data, fileName);

    return await uploadPublicMedia(file, folder);
  } catch {
    return null;
  }
};

// --------------------------------------------------
// PROPAGATE PHOTO REMOVAL
// --------------------------------------------------

export const propagatePhotoRemoval = async (
  photoUrl: string,
  locationName: string,
  description?: string,
): Promise<boolean> => {
  try {
    // Deterministic City Resolution (Boundary Recovery)
    let targetCityIds: string[] = [];
    if (locationName) {
      const identity = await resolveCityIdentity(locationName);
      if (identity) targetCityIds = [identity.id];
    }

    // Fallback: Se non c'è locationName o non è risolvibile, manteniamo il comportamento di scansione globale
    // (legacy/safety) ma mappato su ID.
    if (targetCityIds.length === 0 && !locationName) {
      const manifest = await getFullManifestAsync();
      targetCityIds = manifest.map((c) => c.id);
    }

    let globalChanged = false;
    const isHeroContext = description?.includes('[HERO]');

    for (const cityId of targetCityIds) {
      const city = await getCityDetails(cityId, undefined, { peopleAudience: 'admin' });
      if (!city) continue;
      let changed = false;
      if (isHeroContext || city.details.heroImage === photoUrl || city.imageUrl === photoUrl) {
        city.details.heroImage = PROPAGATE_PHOTO_REMOVAL_HERO_FALLBACK_URL;
        city.imageUrl = PROPAGATE_PHOTO_REMOVAL_HERO_FALLBACK_URL;
        city.imageCredit = '';
        changed = true;
      }
      if (city.details.patronDetails?.imageUrl === photoUrl) {
        city.details.patronDetails.imageUrl = '';
        changed = true;
      }
      if (city.details.gallery?.some((asset) => asset.url === photoUrl)) {
        city.details.gallery = city.details.gallery.filter((asset) => asset.url !== photoUrl);

        changed = true;
      }
      if (changed) {
        // MP-03 STEP-1: dynamic import intenzionale — evita cityWrite/lifecycle/staging nel bootstrap Home.
        const { saveCityDetails } = await import('./city/cityWriteService');
        await saveCityDetails(city);
        globalChanged = true;
      }
    }
    return globalChanged;
  } catch {
    return false;
  }
};

export const syncPhotoDescriptionToCity = async (
  photoUrl: string,
  newDescription: string,
  locationName: string,
) => {
  try {
    const identity = await resolveCityIdentity(locationName);
    if (!identity) return;
    const city = await getCityDetails(identity.id, undefined, { peopleAudience: 'admin' });
    if (!city) return;
    let changed = false;
    if (city.details.heroImage === photoUrl || city.imageUrl === photoUrl) {
      city.imageCredit = newDescription;
      changed = true;
    }
    if (changed) {
      // MP-03 STEP-1: dynamic import intenzionale — evita cityWrite/lifecycle/staging nel bootstrap Home.
      const { saveCityDetails } = await import('./city/cityWriteService');
      await saveCityDetails(city);
    }
  } catch {}
};

// --------------------------------------------------
// FLAG PHOTOS AS CITY DELETED
// --------------------------------------------------

export const flagPhotosAsCityDeleted = async (cityName: string): Promise<void> => {
  try {
    // Resolve identity for SSoT update
    const identity = await resolveCityIdentity(cityName);

    let query = supabase.from('photo_submissions').update({
      status: 'city_deleted',
      updated_at: new Date().toISOString(),
    });

    if (identity) {
      // SSoT: Update by ID or normalized name for maximum safety/compat
      query = query.or(`city_id.eq.${identity.id},location_name.ilike.${identity.name}`);
    } else {
      // Fallback legacy (Identity lookup failed)
      query = query.ilike('location_name', cityName.trim());
    }

    const { error } = await query;

    if (error) throw error;
  } catch (e) {
    console.error('Error flagging photos as deleted:', e);
  }
};

// --------------------------------------------------
// COMMUNITY PHOTO UPLOAD
// --------------------------------------------------

// Rimosso mapDbPhotoToSubmission locale in favore del mapper centralizzato in mediaService.ts

export const uploadCommunityPhoto = async (
  file: File,
  userId: string,
  userName: string,
  locationName: string,
  description: string,
  cityId?: string,
  forceStatus?: 'pending' | 'approved' | 'rejected',
  isOfficial: boolean = false,
  mediaStatus: MediaStatus = 'real',
): Promise<PhotoSubmission | null> => {
  // Security Gate (service boundary): Feature Flag Runtime → Database.
  // UI UX Gates must not replace this check.
  const photosFlag = evaluateCachedFeatureFlag(PLATFORM_FEATURE_FLAG_KEYS.MODERATION_PHOTOS, {
    userRole: null,
    isAuthenticated: false,
  });
  // Fail-closed: Security Gate — SoT evaluateFeatureFlag via cache CC.
  if (photosFlag?.enabled !== true) {
    throw new Error(
      resolvePlatformUserBody(
        photosFlag?.messageKey ?? PLATFORM_MESSAGE_TEMPLATE_KEYS.MODERATION_PHOTOS_PAUSED,
        '',
      ),
    );
  }

  try {
    // 1. Resolve cityId if not provided (Refactored: Service Boundary Recovery)
    let resolvedCityId = cityId;
    if (!resolvedCityId && locationName) {
      const identity = await resolveCityIdentity(locationName);
      if (identity) resolvedCityId = identity.id;
    }

    // 2. City ID Validation
    if (!resolvedCityId) {
      if (isOfficial) {
        throw new Error('City ID mandatory for Official/Editorial photos.');
      }
      console.warn(`[photoService] Upload proceeds without cityId for location: ${locationName}`);
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

    const fileName = `${userId}_${Date.now()}_${safeName}`;

    const filePath = `${locationName}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file);

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

    // Write-boundary: solo Fotografie entrano in photo_submissions.
    const placeholderRegistry = await getPlatformPlaceholderRegistryAsync();
    assertPhotographWrite({ url: publicUrl, mediaStatus }, placeholderRegistry);

    const isAdmin = await resolveUploadCallerIsAdmin();
    const initialStatus: 'pending' | 'approved' | 'rejected' = isAdmin
      ? (forceStatus ?? 'approved')
      : 'pending';

    const newRecord: Insert<'photo_submissions'> = {
      user_id: userId,
      user_name: userName,
      location_name: locationName,
      description,
      image_url: publicUrl,
      status: initialStatus,
      published_at: initialStatus === 'approved' ? new Date().toISOString() : null,
      likes: 0,
      city_id: resolvedCityId,
      is_official: isOfficial,
      media_status: mediaStatus,
    };

    const { data, error: dbError } = await supabase
      .from('photo_submissions')
      .insert(newRecord)
      .select()
      .single();

    if (dbError) throw dbError;

    const mapped = attachStorageMeta(mapDbPhotoSubmission(data));
    if (!resolvedCityId) {
      return mapped;
    }

    try {
      return await materializePhotoSubmissionAssignment(mapped, filePath);
    } catch (assignmentErr) {
      await supabase.from('photo_submissions').delete().eq('id', mapped.id);
      const { error: storageCleanupError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);
      if (storageCleanupError) {
        console.error(
          '[uploadCommunityPhoto] materialize assignment fallito e cleanup Storage non riuscito:',
          filePath,
          storageCleanupError,
          assignmentErr,
        );
      }
      throw assignmentErr;
    }
  } catch (e) {
    console.error('[photoService] Error in uploadCommunityPhoto:', e);
    return null;
  }
};

// --------------------------------------------------
// GET OR CREATE PHOTO SUBMISSION (REGISTRAZIONE PERSISTENTE)
// --------------------------------------------------

/**
 * Assicura che un'immagine della Galleria Fotografica abbia un record in photo_submissions.
 * Callers autorizzati: City Galleria Fotografica, Preview basata su quella galleria.
 * NON usare per Presentation Media (Hero, Card, POI/Shop/Guide/… covers).
 * Write-boundary: Placeholder by origin (registry attivo + retired) non possono essere create/riesposte.
 */
export const getOrCreatePhotoSubmissionForUrl = async (
  url: string,
  cityId: string,
  cityName: string,
  description: string,
  mediaStatus: MediaStatus = 'real',
): Promise<PhotoSubmission | null> => {
  if (!url || !cityId) return null;

  try {
    const placeholderRegistry = await getPlatformPlaceholderRegistryAsync();

    // STEP 1: Cerca per URL esatto (Deduplicazione)
    const { data: existing, error: searchError } = await supabase
      .from('photo_submissions')
      .select('*')
      .eq('city_id', cityId)
      .eq('image_url', url)
      .maybeSingle();

    if (searchError) {
      console.error('[photoService] Error searching existing photo:', searchError);
      return null;
    }

    if (existing) {
      const mapped = attachStorageMeta(mapDbPhotoSubmission(existing));
      // Non riesporre Placeholder / non-fotografie legacy alle gallerie.
      if (
        !canRegisterAsPhotograph(
          { url: mapped.url, mediaStatus: mapped.mediaStatus },
          placeholderRegistry,
        )
      ) {
        return null;
      }
      return mapped;
    }

    // Write-boundary: solo Fotografie possono essere create.
    assertPhotographWrite({ url, mediaStatus }, placeholderRegistry);

    // 2. Crea un record persistente immediato per immagini ufficiali
    const newRecord = {
      user_id: '00000000-0000-0000-0000-000000000000', // SYSTEM USER ID
      user_name: 'Touring Diary',
      location_name: cityName,
      description: description,
      image_url: url,
      status: 'approved',
      published_at: new Date().toISOString(),
      likes: 0,
      city_id: cityId,
      is_official: true,
      media_status: mediaStatus,
    };

    const { data: created, error } = await supabase
      .from('photo_submissions')
      .insert(newRecord)
      .select()
      .single();

    if (error) throw error;

    const mapped = attachStorageMeta(mapDbPhotoSubmission(created));
    const parsed = parseStorageLocationFromPublicUrl(mapped.url);
    try {
      return await materializePhotoSubmissionAssignment(mapped, parsed?.storagePath ?? null);
    } catch (assignmentErr) {
      await supabase.from('photo_submissions').delete().eq('id', mapped.id);
      throw assignmentErr;
    }
  } catch (e) {
    console.error('[photoService] Errore in getOrCreatePhotoSubmissionForUrl:', e);
    return null;
  }
};

// --------------------------------------------------
// LIST PHOTOGRAPHS (unica porta gallerie)
// --------------------------------------------------

export type ListPhotographsOptions = {
  /** Submission workflow status. Omit or `'all'` = no status filter. */
  status?: string;
  cityId?: string;
  limit?: number;
  /** Include `photo_likes` join and set `likedByUser` for current user. */
  withLikes?: boolean;
  orderBy?: 'created_at' | 'likes';
  ascending?: boolean;
};

/**
 * Unica porta di lettura per le gallerie fotografiche.
 * Restituisce solo Fotografie (Community + Official). I Placeholder non appartengono a questo dominio.
 */
export const listPhotographs = async (
  options: ListPhotographsOptions = {},
): Promise<PhotoSubmission[]> => {
  const {
    status,
    cityId,
    limit,
    withLikes = false,
    orderBy = 'created_at',
    ascending = false,
  } = options;

  try {
    // Select fisso (tipizzato PostgREST): likedByUser popolato solo se withLikes.
    let query = supabase
      .from('photo_submissions')
      .select('*, photo_likes(photo_id, user_id)')
      .eq('media_status', PHOTOGRAPH_READ_MEDIA_STATUS)
      .order(orderBy, { ascending });

    if (cityId) {
      query = query.eq('city_id', cityId);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (limit != null) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    const currentUserId = withLikes ? (await supabase.auth.getUser()).data.user?.id : undefined;

    const mapped = ((data as unknown as DbPhotoWithLikes[] | null) || []).map((p) => {
      const base = attachStorageMeta(mapDbPhotoSubmission(p));
      if (!withLikes) return base;
      return {
        ...base,
        likedByUser: Boolean(
          currentUserId && p.photo_likes?.some((l) => l.user_id === currentUserId),
        ),
      };
    });

    const filtered = filterPhotographs(mapped);
    const enriched = await attachPhotoSubmissionAssignmentIds(filtered);
    return enriched.map(attachStorageMeta);
  } catch (err) {
    console.error('[photoService] listPhotographs failed:', err);
    return [];
  }
};

/**
 * Admin moderation only — may include legacy non-photograph rows for cleanup.
 * Galleries must not use this.
 */
export const listPhotoSubmissionsForModeration = async (
  status: string = 'all',
): Promise<PhotoSubmission[]> => {
  try {
    let query = supabase
      .from('photo_submissions')
      .select('*, photo_likes(photo_id, user_id)')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    const currentUserId = (await supabase.auth.getUser()).data.user?.id;

    return ((data as unknown as DbPhotoWithLikes[] | null) || []).map((p) => {
      const base = mapDbPhotoSubmission(p);
      return {
        ...base,
        likedByUser: Boolean(
          currentUserId && p.photo_likes?.some((l) => l.user_id === currentUserId),
        ),
      };
    });
  } catch {
    return [];
  }
};

// --------------------------------------------------
// UPDATE PHOTO STATUS
// --------------------------------------------------

export const updatePhotoStatusInDb = async (
  id: string,
  status: 'approved' | 'rejected' | 'pending',
): Promise<void> => {
  const updates: DatabasePhotoSubmissionUpdate = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'approved') {
    updates.published_at = new Date().toISOString();
  }

  try {
    const { data: existing, error: fetchError } = await supabase
      .from('photo_submissions')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (fetchError) throw fetchError;

    const { error: updateError } = await supabase
      .from('photo_submissions')
      .update(updates)
      .eq('id', id);
    if (updateError) throw updateError;

    if (status === 'approved' && existing) {
      const updatedRow = {
        ...existing,
        status,
        published_at: updates.published_at ?? existing.published_at ?? null,
        updated_at: updates.updated_at ?? existing.updated_at ?? null,
      };
      const mapped = attachStorageMeta(mapDbPhotoSubmission(updatedRow));
      const parsed = parseStorageLocationFromPublicUrl(mapped.url);
      try {
        await materializePhotoSubmissionAssignment(mapped, parsed?.storagePath ?? null);
      } catch (assignmentErr) {
        const { error: rollbackError } = await supabase
          .from('photo_submissions')
          .update({
            status: existing.status,
            published_at: existing.published_at,
            updated_at: existing.updated_at,
          })
          .eq('id', id);
        if (rollbackError) {
          console.error(
            '[photoService] materialize assignment approvazione fallito e rollback stato submission non riuscito:',
            rollbackError,
            assignmentErr,
          );
        }
        throw assignmentErr;
      }
    }
  } catch (err) {
    console.error('[photoService] Error updating photo status:', err);
    throw err instanceof Error ? err : new Error('Aggiornamento stato foto fallito.');
  }
};

// --------------------------------------------------
// UPDATE PHOTO DATA
// --------------------------------------------------

export const updatePhotoData = async (
  id: string,
  data: Partial<PhotoSubmission>,
): Promise<void> => {
  const mayChangeMf2Source = data.url !== undefined || data.cityId !== undefined;

  let existing: DatabasePhotoSubmission | null = null;
  if (mayChangeMf2Source) {
    const { data: row, error: fetchError } = await supabase
      .from('photo_submissions')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (fetchError) {
      throw new Error(`Lettura photo_submission fallita: ${fetchError.message}`);
    }
    if (!row) {
      throw new Error('photo_submission non trovata.');
    }
    existing = row;
  }

  const payload: DatabasePhotoSubmissionUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (data.locationName) payload.location_name = data.locationName;

  if (data.user) payload.user_name = data.user;

  if (data.description) payload.description = data.description;

  const nextUrl = data.url !== undefined ? data.url.trim() : undefined;
  const nextCityId = data.cityId !== undefined ? data.cityId.trim() : undefined;

  if (nextUrl !== undefined && nextUrl.length === 0) {
    throw new Error('image_url non può essere vuoto.');
  }
  if (nextCityId !== undefined && nextCityId.length === 0) {
    throw new Error('city_id non può essere vuoto.');
  }

  if (nextUrl !== undefined && nextUrl.length > 0) {
    // Write-boundary: image_url updates must pass Photograph domain (same SoT as insert).
    const placeholderRegistry = await getPlatformPlaceholderRegistryAsync();
    assertPhotographWrite({ url: nextUrl, mediaStatus: data.mediaStatus }, placeholderRegistry);
    payload.image_url = nextUrl;
  }

  if (data.isOfficial !== undefined) payload.is_official = data.isOfficial;

  if (nextCityId !== undefined && nextCityId.length > 0) {
    payload.city_id = nextCityId;
  }

  const urlChanged =
    existing !== null &&
    nextUrl !== undefined &&
    nextUrl.length > 0 &&
    nextUrl !== existing.image_url.trim();
  const cityChanged =
    existing !== null &&
    nextCityId !== undefined &&
    nextCityId.length > 0 &&
    nextCityId !== (existing.city_id?.trim() ?? '');
  const mf2SyncRequired = existing !== null && (urlChanged || cityChanged);

  try {
    const { error } = await supabase.from('photo_submissions').update(payload).eq('id', id);
    if (error) throw error;

    if (mf2SyncRequired && existing) {
      const oldCityId = existing.city_id?.trim() ?? '';
      const newCityId = cityChanged ? (nextCityId ?? '') : oldCityId;
      let newAssignmentId: string | null = null;
      try {
        if (newCityId.length > 0) {
          const updatedRow = {
            ...existing,
            image_url: urlChanged ? nextUrl : existing.image_url,
            city_id: cityChanged ? nextCityId : existing.city_id,
            updated_at: payload.updated_at ?? existing.updated_at,
          };
          const mapped = attachStorageMeta(mapDbPhotoSubmission(updatedRow));
          const parsed = parseStorageLocationFromPublicUrl(mapped.url);
          const materialized = await materializePhotoSubmissionAssignment(
            mapped,
            parsed?.storagePath ?? null,
          );
          newAssignmentId = materialized.assignmentId ?? null;
        }

        if (cityChanged && oldCityId.length > 0) {
          const oldAssignmentId = await getCurrentImageAssignmentId(
            'photo_submission',
            id,
            oldCityId,
          );
          if (oldAssignmentId) {
            try {
              await revokePhotoSubmissionAssignment(id, oldCityId, oldAssignmentId);
            } catch (revokeOldErr) {
              if (newAssignmentId && newCityId.length > 0) {
                try {
                  await revokePhotoSubmissionAssignment(id, newCityId, newAssignmentId);
                } catch (compensateErr) {
                  const revokeMsg =
                    revokeOldErr instanceof Error ? revokeOldErr.message : String(revokeOldErr);
                  const compensateMsg =
                    compensateErr instanceof Error ? compensateErr.message : String(compensateErr);
                  console.error(
                    '[photoService] revoca assignment vecchia fallita e compensazione nuova assignment non riuscita:',
                    compensateErr,
                    revokeOldErr,
                  );
                  throw new PhotoSubmissionAssignmentInconsistentError(
                    `Stato assignment photo_submission inconsistente: revoca vecchia fallita (${revokeMsg}); compensazione nuova fallita (${compensateMsg}).`,
                  );
                }
              }
              const rollbackPayload: DatabasePhotoSubmissionUpdate = {
                updated_at: existing.updated_at,
              };
              if (urlChanged) rollbackPayload.image_url = existing.image_url;
              if (cityChanged) rollbackPayload.city_id = existing.city_id;
              const { error: rollbackError } = await supabase
                .from('photo_submissions')
                .update(rollbackPayload)
                .eq('id', id);
              if (rollbackError) {
                console.error(
                  '[photoService] revoca assignment vecchia fallita e rollback submission non riuscito:',
                  rollbackError,
                  revokeOldErr,
                );
              }
              throw revokeOldErr;
            }
          }
        }
      } catch (assignmentErr) {
        if (assignmentErr instanceof PhotoSubmissionAssignmentInconsistentError) {
          throw assignmentErr;
        }
        const rollbackPayload: DatabasePhotoSubmissionUpdate = {
          updated_at: existing.updated_at,
        };
        if (urlChanged) rollbackPayload.image_url = existing.image_url;
        if (cityChanged) rollbackPayload.city_id = existing.city_id;
        const { error: rollbackError } = await supabase
          .from('photo_submissions')
          .update(rollbackPayload)
          .eq('id', id);
        if (rollbackError) {
          console.error(
            '[photoService] materialize assignment updatePhotoData fallito e rollback submission non riuscito:',
            rollbackError,
            assignmentErr,
          );
        }
        throw assignmentErr;
      }
    }

    if (data.description && data.locationName && data.url) {
      await syncPhotoDescriptionToCity(data.url, data.description, data.locationName);
    }
  } catch (err) {
    console.error('[photoService] Error updating photo data:', err);
    throw err instanceof Error ? err : new Error('Aggiornamento dati foto fallito.');
  }
};

// --------------------------------------------------
// DELETE PHOTO SUBMISSION
// --------------------------------------------------

type Mf2AssignmentConditionalUpdateBuilder = {
  eq: (column: string, value: string | boolean) => Mf2AssignmentConditionalUpdateBuilder;
  select: (columns: string) => Promise<{
    data: unknown;
    error: { message: string } | null;
  }>;
};

async function revokePhotoSubmissionAssignment(
  submissionId: string,
  cityId: string,
  assignmentId: string,
): Promise<void> {
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
    .eq('entity_type', 'photo_submission')
    .eq('entity_id', submissionId)
    .eq('city_id', cityId)
    .eq('assignment_role', 'primary')
    .eq('is_current', true)
    .eq('assignment_status', 'active')
    .select('id');

  if (updateError) {
    throw new Error(`Revoca assignment photo_submission fallita: ${updateError.message}`);
  }

  const rows = updatedRows as unknown as { id: string }[] | null;
  if (!rows || rows.length === 0) {
    throw new Error(
      'Revoca assignment photo_submission fallita: nessuna riga aggiornata (stato cambiato).',
    );
  }
}

export const deletePhotoSubmissionInDb = async (id: string): Promise<void> => {
  const { data: existing, error: fetchError } = await supabase
    .from('photo_submissions')
    .select('id, city_id')
    .eq('id', id)
    .maybeSingle();
  if (fetchError) {
    throw new Error(`Lettura photo_submission fallita: ${fetchError.message}`);
  }
  if (!existing) return;

  const cityId = existing.city_id?.trim() ?? '';
  if (cityId.length > 0) {
    const assignmentId = await getCurrentImageAssignmentId('photo_submission', existing.id, cityId);
    if (assignmentId) {
      await revokePhotoSubmissionAssignment(existing.id, cityId, assignmentId);
    }
  }

  const { error: deleteError } = await supabase.from('photo_submissions').delete().eq('id', id);
  if (deleteError) {
    throw new Error(`Eliminazione photo_submission fallita: ${deleteError.message}`);
  }
};

// --------------------------------------------------
// TOGGLE PHOTO LIKE (FIX DEFINITIVO)
// --------------------------------------------------

export const togglePhotoLikeRPC = async (
  photoId: string,
): Promise<{
  liked: boolean;
  count: number;
}> => {
  if (!photoId) return { liked: false, count: 0 };

  // RIMOSSA COMPLETAMENTE LA LOGICA VIRTUAL IDs
  // Il frontend deve garantire di passare un UUID reale persistente.

  if (!UUID_REGEX.test(photoId)) {
    console.error('[photoService] ID non valido per il like (atteso UUID):', photoId);
    return { liked: false, count: 0 };
  }

  try {
    const { data, error } = await supabase.rpc('toggle_photo_like', {
      p_photo_id: photoId,
    });

    if (error) throw error;

    const rpcData = data as { is_liked: boolean; likes_count: number };
    return {
      liked: rpcData.is_liked,
      count: rpcData.likes_count,
    };
  } catch (e) {
    console.error('Critical: Error toggling photo like via RPC:', e);
    throw e;
  }
};

// --------------------------------------------------
// FETCH USER PHOTO LIKES
// --------------------------------------------------

export const fetchUserPhotoLikes = async (userId: string): Promise<string[]> => {
  if (!userId || userId === 'guest' || !UUID_REGEX.test(userId)) return [];

  try {
    const { data } = await supabase.from('photo_likes').select('photo_id').eq('user_id', userId);

    return (data || []).map((row) => row.photo_id);
  } catch {
    return [];
  }
};
