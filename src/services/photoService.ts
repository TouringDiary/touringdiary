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
import { resolveCityIdentity } from './city/cityReadService';
import { entityImageAssignmentsQuery } from './media/entityImageAssignmentsQuery';
import { upsertEntityImageAssignmentFromSource } from './media/entityImageAssignmentWriteService';
import { mapDbPhotoSubmission } from './photoMapper';
import { getPlatformPlaceholderRegistryAsync } from './settingsService';

const BUCKET_NAME = 'community-photos';

/** Revoca + compensazione assignment fallite: non eseguire rollback legacy submission. */
class PhotoSubmissionAssignmentInconsistentError extends Error {
  override readonly name = 'PhotoSubmissionAssignmentInconsistentError';
}

/** Assignment MF4 photo_submission: RPC richiede status approved; active = pubblicabile. */
function photoSubmissionAllowsActiveAssignment(
  status: string | null | undefined,
): status is 'approved' {
  return status === 'approved';
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
  if (!photoSubmissionAllowsActiveAssignment(photo.status)) {
    throw new Error(
      'Materializzazione assignment photo_submission consentita solo per submission approved.',
    );
  }

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
  const { data, error } = await entityImageAssignmentsQuery()
    .select('id, entity_id, assignment_status')
    .eq('entity_type', 'photo_submission')
    .in('entity_id', entityIds)
    .eq('assignment_role', 'primary')
    .eq('is_current', true);

  if (error) {
    throw new Error(`Lettura assignment foto Community fallita: ${error.message}`);
  }

  const assignmentByEntityId = new Map<string, PhotoSubmissionAssignmentRow>();
  for (const row of (data ?? []) as unknown as PhotoSubmissionAssignmentRow[]) {
    if (assignmentByEntityId.has(row.entity_id)) {
      throw new Error(
        `Incoerenza assignment: più righe current per photo_submission ${row.entity_id}.`,
      );
    }
    assignmentByEntityId.set(row.entity_id, row);
  }

  const enriched: PhotoSubmission[] = [];
  for (const photo of photos) {
    const assignment = assignmentByEntityId.get(photo.id);
    if (!assignment) {
      enriched.push({ ...photo, assignmentId: null });
      continue;
    }
    if (assignment.assignment_status !== 'active' && assignment.assignment_status !== 'restored') {
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
  const { data, error } = await entityImageAssignmentsQuery()
    .select('id')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('city_id', cityId)
    .eq('assignment_role', assignmentRole)
    .eq('is_current', true)
    .in('assignment_status', ['active', 'restored'])
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
  // MF4/MF5: revoca assignment e lifecycle avvengono in deletePhotoSubmissionInDb / updatePhotoStatusInDb.
  // Non sostituire Hero/Card con URL artificiali né mutare gallery legacy come SoT.
  void photoUrl;
  void locationName;
  void description;
  return false;
};

// --------------------------------------------------
// FLAG PHOTOS AS CITY DELETED
// --------------------------------------------------

export const flagPhotosAsCityDeleted = async (cityName: string): Promise<void> => {
  const revokedInThisRun: {
    submissionId: string;
    cityId: string;
    assignmentId: string;
  }[] = [];

  try {
    const identity = await resolveCityIdentity(cityName);

    let selectQuery = supabase.from('photo_submissions').select('id, city_id');

    if (identity) {
      selectQuery = selectQuery.or(
        `city_id.eq.${identity.id},location_name.ilike.${identity.name}`,
      );
    } else {
      selectQuery = selectQuery.ilike('location_name', cityName.trim());
    }

    const { data: rows, error: selectError } = await selectQuery;
    if (selectError) throw selectError;

    const revokeFailures: { submissionId: string; message: string }[] = [];
    for (const row of rows ?? []) {
      const cityId = row.city_id?.trim() ?? '';
      if (!cityId) continue;
      try {
        const assignmentId = await getCurrentImageAssignmentId('photo_submission', row.id, cityId);
        if (!assignmentId) continue;
        try {
          await revokePhotoSubmissionAssignment(row.id, cityId, assignmentId);
          revokedInThisRun.push({ submissionId: row.id, cityId, assignmentId });
        } catch (revokeErr) {
          const message = revokeErr instanceof Error ? revokeErr.message : String(revokeErr);
          revokeFailures.push({ submissionId: row.id, message });
        }
      } catch (perRowErr) {
        await restoreRevokedPhotoSubmissionAssignments(
          revokedInThisRun,
          `flagPhotosAsCityDeleted: errore durante elaborazione submission ${row.id}`,
        );
        throw perRowErr;
      }
    }

    if (revokeFailures.length > 0) {
      await restoreRevokedPhotoSubmissionAssignments(
        revokedInThisRun,
        'flagPhotosAsCityDeleted: revoca assignment MF4 fallita',
      );
      throw new Error(
        `flagPhotosAsCityDeleted: revoca assignment MF4 fallita per ${revokeFailures.length} submission; status city_deleted non applicato. Primo id=${revokeFailures[0]?.submissionId}: ${revokeFailures[0]?.message}`,
      );
    }

    let updateQuery = supabase.from('photo_submissions').update({
      status: 'city_deleted',
      updated_at: new Date().toISOString(),
    });

    if (identity) {
      updateQuery = updateQuery.or(
        `city_id.eq.${identity.id},location_name.ilike.${identity.name}`,
      );
    } else {
      updateQuery = updateQuery.ilike('location_name', cityName.trim());
    }

    const { error: updateError } = await updateQuery;
    if (updateError) {
      await restoreRevokedPhotoSubmissionAssignments(
        revokedInThisRun,
        `flagPhotosAsCityDeleted: update status fallito (${updateError.message})`,
      );
      throw updateError;
    }
  } catch (e) {
    console.error('Error flagging photos as deleted:', e);
    throw e;
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

  let storageCreatedThisRun = false;
  let uploadedFilePath: string | null = null;

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

    uploadedFilePath = `${locationName}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(uploadedFilePath, file);

    if (uploadError) throw uploadError;
    storageCreatedThisRun = true;

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(uploadedFilePath);

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
    storageCreatedThisRun = false;

    const mapped = attachStorageMeta(mapDbPhotoSubmission(data));
    if (!resolvedCityId || !photoSubmissionAllowsActiveAssignment(mapped.status)) {
      return mapped;
    }

    try {
      return await materializePhotoSubmissionAssignment(mapped, uploadedFilePath);
    } catch (assignmentErr) {
      const { error: deleteError } = await supabase
        .from('photo_submissions')
        .delete()
        .eq('id', mapped.id);
      if (deleteError) {
        const assignMsg =
          assignmentErr instanceof Error ? assignmentErr.message : String(assignmentErr);
        throw new PhotoSubmissionAssignmentInconsistentError(
          `uploadCommunityPhoto: materialize fallito (${assignMsg}) e delete submission fallito (${deleteError.message}). submission=${mapped.id}.`,
        );
      }
      const { error: storageCleanupError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([uploadedFilePath]);
      if (storageCleanupError) {
        const assignMsg =
          assignmentErr instanceof Error ? assignmentErr.message : String(assignmentErr);
        throw new PhotoSubmissionAssignmentInconsistentError(
          `uploadCommunityPhoto: materialize fallito (${assignMsg}) e cleanup Storage fallito (${storageCleanupError.message}). submission=${mapped.id}, path=${uploadedFilePath}.`,
        );
      }
      throw assignmentErr;
    }
  } catch (e) {
    if (e instanceof PhotoSubmissionAssignmentInconsistentError) {
      throw e;
    }
    if (storageCreatedThisRun && uploadedFilePath) {
      const { error: storageCleanupError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([uploadedFilePath]);
      if (storageCleanupError) {
        console.error(
          '[uploadCommunityPhoto] write fallita e cleanup Storage non riuscito:',
          uploadedFilePath,
          storageCleanupError,
          e,
        );
      }
    }
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
      const { error: deleteError } = await supabase
        .from('photo_submissions')
        .delete()
        .eq('id', mapped.id);
      if (deleteError) {
        const assignMsg =
          assignmentErr instanceof Error ? assignmentErr.message : String(assignmentErr);
        throw new PhotoSubmissionAssignmentInconsistentError(
          `getOrCreatePhotoSubmissionForUrl: materialize fallito (${assignMsg}) e delete submission fallito (${deleteError.message}). submission=${mapped.id}.`,
        );
      }
      throw assignmentErr;
    }
  } catch (e) {
    if (e instanceof PhotoSubmissionAssignmentInconsistentError) {
      throw e;
    }
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
  } else {
    updates.published_at = null;
  }

  try {
    const { data: existing, error: fetchError } = await supabase
      .from('photo_submissions')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!existing) {
      throw new Error('photo_submission non trovata.');
    }

    const previousStatus = existing.status;

    let priorAssignmentId: string | null = null;
    let materializedAssignmentId: string | null = null;
    if (status === 'approved') {
      const cityIdForMaterialize = existing.city_id?.trim() ?? '';
      if (cityIdForMaterialize.length > 0) {
        priorAssignmentId = await getCurrentImageAssignmentId(
          'photo_submission',
          id,
          cityIdForMaterialize,
        );
      }
      const previewRow = {
        ...existing,
        status,
        published_at: updates.published_at ?? existing.published_at ?? null,
        updated_at: updates.updated_at ?? existing.updated_at ?? null,
      };
      const mapped = attachStorageMeta(mapDbPhotoSubmission(previewRow));
      const parsed = parseStorageLocationFromPublicUrl(mapped.url);
      const materialized = await materializePhotoSubmissionAssignment(
        mapped,
        parsed?.storagePath ?? null,
      );
      materializedAssignmentId = materialized.assignmentId ?? null;
    }

    const { error: updateError } = await supabase
      .from('photo_submissions')
      .update(updates)
      .eq('id', id);
    if (updateError) {
      if (status === 'approved') {
        const cityId = existing.city_id?.trim() ?? '';
        if (cityId.length > 0) {
          try {
            await compensatePhotoSubmissionUpsertIntroducedByRun(
              id,
              cityId,
              priorAssignmentId,
              materializedAssignmentId,
            );
          } catch (compensateErr) {
            const updateMsg = updateError.message;
            const compensateMsg =
              compensateErr instanceof Error ? compensateErr.message : String(compensateErr);
            console.error(
              '[photoService] approvazione: update submission fallito dopo materialize e compensazione fallita:',
              compensateErr,
              updateError,
            );
            throw new PhotoSubmissionAssignmentInconsistentError(
              `Incoerenza photo_submission ↔ assignment: materialize riuscito ma update submission fallito (${updateMsg}) e compensazione fallita (${compensateMsg}). submission=${id}.`,
            );
          }
        }
      }
      throw updateError;
    }

    if (status !== 'approved') {
      const cityId = existing.city_id?.trim() ?? '';
      if (cityId.length > 0) {
        const rollbackSubmissionToPreviousStatus = async (
          primaryFailureMessage: string,
        ): Promise<void> => {
          const rollback: DatabasePhotoSubmissionUpdate = {
            status: previousStatus,
            updated_at: new Date().toISOString(),
          };
          if (previousStatus === 'approved' && existing.published_at) {
            rollback.published_at = existing.published_at;
          }
          const { error: rollbackError } = await supabase
            .from('photo_submissions')
            .update(rollback)
            .eq('id', id);
          if (rollbackError) {
            throw new PhotoSubmissionAssignmentInconsistentError(
              `Incoerenza photo_submission ↔ assignment: submission aggiornata a ${status} ma ${primaryFailureMessage} e rollback submission fallito (${rollbackError.message}). Verificare manualmente submission ${id}.`,
            );
          }
        };

        let assignmentId: string | null;
        try {
          assignmentId = await getCurrentImageAssignmentId('photo_submission', id, cityId);
        } catch (lookupErr) {
          const lookupMsg = lookupErr instanceof Error ? lookupErr.message : String(lookupErr);
          try {
            await rollbackSubmissionToPreviousStatus(
              `lettura assignment corrente fallita (${lookupMsg})`,
            );
          } catch (rollbackOutcome) {
            console.error(
              '[photoService] unpublish: lettura assignment fallita e rollback submission non riuscito:',
              rollbackOutcome,
              lookupErr,
            );
            throw rollbackOutcome;
          }
          throw lookupErr instanceof Error
            ? lookupErr
            : new Error('Lettura assignment corrente dopo unpublish fallita.');
        }

        if (assignmentId) {
          try {
            await revokePhotoSubmissionAssignment(id, cityId, assignmentId);
          } catch (revokeErr) {
            const revokeMsg = revokeErr instanceof Error ? revokeErr.message : String(revokeErr);
            try {
              await rollbackSubmissionToPreviousStatus(`revoca assignment fallita (${revokeMsg})`);
            } catch (rollbackOutcome) {
              console.error(
                '[photoService] unpublish: revoca assignment fallita e rollback submission non riuscito:',
                rollbackOutcome,
                revokeErr,
              );
              throw rollbackOutcome;
            }
            throw revokeErr instanceof Error
              ? revokeErr
              : new Error('Revoca assignment dopo unpublish fallita.');
          }
        }
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
      let priorAssignmentIdForUpsert: string | null = null;
      const revokedDuringInactiveSync: RevokedPhotoSubmissionAssignment[] = [];
      try {
        if (!photoSubmissionAllowsActiveAssignment(existing.status)) {
          const citiesToRevoke = [...new Set([oldCityId, newCityId].filter((c) => c.length > 0))];
          for (const revokeCityId of citiesToRevoke) {
            try {
              const staleAssignmentId = await getCurrentImageAssignmentId(
                'photo_submission',
                id,
                revokeCityId,
              );
              if (staleAssignmentId) {
                await revokePhotoSubmissionAssignment(id, revokeCityId, staleAssignmentId);
                revokedDuringInactiveSync.push({
                  submissionId: id,
                  cityId: revokeCityId,
                  assignmentId: staleAssignmentId,
                });
              }
            } catch (revokeErr) {
              await restoreRevokedPhotoSubmissionAssignments(
                revokedDuringInactiveSync,
                `updatePhotoData: revoca assignment stale fallita (submission ${id}, city ${revokeCityId})`,
              );
              throw revokeErr;
            }
          }
        } else if (newCityId.length > 0) {
          priorAssignmentIdForUpsert = await getCurrentImageAssignmentId(
            'photo_submission',
            id,
            newCityId,
          );
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
                    await compensatePhotoSubmissionUpsertIntroducedByRun(
                      id,
                      newCityId,
                      priorAssignmentIdForUpsert,
                      newAssignmentId,
                    );
                  } catch (compensateErr) {
                    const revokeMsg =
                      revokeOldErr instanceof Error ? revokeOldErr.message : String(revokeOldErr);
                    const compensateMsg =
                      compensateErr instanceof Error
                        ? compensateErr.message
                        : String(compensateErr);
                    console.error(
                      '[photoService] revoca assignment vecchia fallita e compensazione upsert non riuscita:',
                      compensateErr,
                      revokeOldErr,
                    );
                    throw new PhotoSubmissionAssignmentInconsistentError(
                      `Stato assignment photo_submission inconsistente: revoca vecchia fallita (${revokeMsg}); compensazione upsert fallita (${compensateMsg}).`,
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
                  throw new PhotoSubmissionAssignmentInconsistentError(
                    `Incoerenza photo_submission ↔ assignment: rollback submission fallito dopo revoca vecchia fallita (submission ${id}).`,
                  );
                }
                throw revokeOldErr;
              }
            }
          }
        }
      } catch (assignmentErr) {
        if (assignmentErr instanceof PhotoSubmissionAssignmentInconsistentError) {
          throw assignmentErr;
        }
        if (revokedDuringInactiveSync.length > 0) {
          try {
            await restoreRevokedPhotoSubmissionAssignments(
              revokedDuringInactiveSync,
              `updatePhotoData: errore sync assignment (submission ${id})`,
            );
          } catch (restoreErr) {
            const assignMsg =
              assignmentErr instanceof Error ? assignmentErr.message : String(assignmentErr);
            const restoreMsg =
              restoreErr instanceof Error ? restoreErr.message : String(restoreErr);
            throw new PhotoSubmissionAssignmentInconsistentError(
              `Incoerenza photo_submission ↔ assignment: sync fallita (${assignMsg}); ripristino revoche stale fallito (${restoreMsg}). submission=${id}, assignments=${revokedDuringInactiveSync.map((r) => r.assignmentId).join(',')}.`,
            );
          }
        }
        if (newAssignmentId && newCityId.length > 0) {
          try {
            await compensatePhotoSubmissionUpsertIntroducedByRun(
              id,
              newCityId,
              priorAssignmentIdForUpsert,
              newAssignmentId,
            );
          } catch (compensateErr) {
            const compensateMsg =
              compensateErr instanceof Error ? compensateErr.message : String(compensateErr);
            const assignMsg =
              assignmentErr instanceof Error ? assignmentErr.message : String(assignmentErr);
            throw new PhotoSubmissionAssignmentInconsistentError(
              `Incoerenza photo_submission ↔ assignment: sync fallita (${assignMsg}) e compensazione upsert fallita (${compensateMsg}). submission=${id}, assignment=${newAssignmentId}.`,
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
        const assignMsg =
          assignmentErr instanceof Error ? assignmentErr.message : String(assignmentErr);
        if (rollbackError) {
          throw new PhotoSubmissionAssignmentInconsistentError(
            `Incoerenza photo_submission ↔ assignment: materialize fallito (${assignMsg}); rollback submission fallito (${rollbackError.message}). submission=${id}.`,
          );
        }
        throw assignmentErr instanceof Error
          ? assignmentErr
          : new Error(`Materializzazione assignment fallita: ${assignMsg}`);
      }
    }
  } catch (err) {
    console.error('[photoService] Error updating photo data:', err);
    throw err instanceof Error ? err : new Error('Aggiornamento dati foto fallito.');
  }
};

// --------------------------------------------------
// DELETE PHOTO SUBMISSION
// --------------------------------------------------

type RevokedPhotoSubmissionAssignment = {
  submissionId: string;
  cityId: string;
  assignmentId: string;
};

async function restoreRevokedPhotoSubmissionAssignments(
  revoked: RevokedPhotoSubmissionAssignment[],
  context: string,
): Promise<void> {
  if (revoked.length === 0) return;
  const compensateErrors: string[] = [];
  for (const entry of revoked) {
    try {
      await restorePhotoSubmissionAssignment(entry.submissionId, entry.cityId, entry.assignmentId);
    } catch (restoreErr) {
      const message = restoreErr instanceof Error ? restoreErr.message : String(restoreErr);
      compensateErrors.push(`${entry.submissionId}/${entry.assignmentId}: ${message}`);
    }
  }
  if (compensateErrors.length > 0) {
    throw new PhotoSubmissionAssignmentInconsistentError(
      `${context}; compensazione revoche fallita (${compensateErrors.length}). Primo: ${compensateErrors[0]}`,
    );
  }
}

/** Ripristina primary `replaced` dopo rollback di un upsert che ha creato `replacedByAssignmentId`. */
async function restoreReplacedPhotoSubmissionAssignment(
  priorAssignmentId: string,
  replacedByAssignmentId: string,
  submissionId: string,
  cityId: string,
): Promise<void> {
  const now = new Date().toISOString();
  const { data: updatedRows, error: updateError } = await entityImageAssignmentsQuery()
    .update({
      assignment_status: 'active',
      is_current: true,
      replaced_by_assignment_id: null,
      updated_at: now,
    })
    .eq('id', priorAssignmentId)
    .eq('entity_type', 'photo_submission')
    .eq('entity_id', submissionId)
    .eq('city_id', cityId)
    .eq('assignment_role', 'primary')
    .eq('assignment_status', 'replaced')
    .eq('replaced_by_assignment_id', replacedByAssignmentId)
    .select('id');

  if (updateError) {
    throw new Error(
      `Ripristino assignment sostituita photo_submission fallito: ${updateError.message}`,
    );
  }
  if (!updatedRows?.length) {
    throw new Error(
      `Ripristino assignment sostituita photo_submission: nessuna riga aggiornata (${priorAssignmentId}).`,
    );
  }
}

/**
 * Compensa un upsert RPC riuscito quando l'operazione caller fallisce dopo.
 * Idempotente (stesso id): nessuna azione. Nuovo id senza prior: revoca. Sostituzione: revoca nuovo + ripristina prior.
 */
async function compensatePhotoSubmissionUpsertIntroducedByRun(
  submissionId: string,
  cityId: string,
  priorAssignmentId: string | null,
  upsertResultAssignmentId: string | null,
): Promise<void> {
  if (!upsertResultAssignmentId) return;
  if (upsertResultAssignmentId === priorAssignmentId) return;

  if (priorAssignmentId === null) {
    await revokePhotoSubmissionAssignment(submissionId, cityId, upsertResultAssignmentId);
    return;
  }

  await revokePhotoSubmissionAssignment(submissionId, cityId, upsertResultAssignmentId);
  await restoreReplacedPhotoSubmissionAssignment(
    priorAssignmentId,
    upsertResultAssignmentId,
    submissionId,
    cityId,
  );
}

async function restorePhotoSubmissionAssignment(
  submissionId: string,
  cityId: string,
  assignmentId: string,
): Promise<void> {
  const now = new Date().toISOString();
  const { data: updatedRows, error: updateError } = await entityImageAssignmentsQuery()
    .update({
      assignment_status: 'active',
      is_current: true,
      removed_at: null,
      updated_at: now,
    })
    .eq('id', assignmentId)
    .eq('entity_type', 'photo_submission')
    .eq('entity_id', submissionId)
    .eq('city_id', cityId)
    .eq('assignment_role', 'primary')
    .eq('assignment_status', 'removed')
    .eq('is_current', false)
    .select('id');

  if (updateError) {
    throw new Error(`Ripristino assignment photo_submission fallito: ${updateError.message}`);
  }
  if (!updatedRows?.length) {
    throw new Error(
      `Ripristino assignment photo_submission: nessuna riga aggiornata (${assignmentId}).`,
    );
  }
}

async function revokePhotoSubmissionAssignment(
  submissionId: string,
  cityId: string,
  assignmentId: string,
): Promise<void> {
  const now = new Date().toISOString();
  const { data: updatedRows, error: updateError } = await entityImageAssignmentsQuery()
    .update({
      assignment_status: 'removed',
      is_current: false,
      removed_at: now,
      updated_at: now,
    })
    .eq('id', assignmentId)
    .eq('entity_type', 'photo_submission')
    .eq('entity_id', submissionId)
    .eq('city_id', cityId)
    .eq('assignment_role', 'primary')
    .eq('is_current', true)
    .in('assignment_status', ['active', 'restored'])
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
  let revokedAssignmentId: string | null = null;
  if (cityId.length > 0) {
    const assignmentId = await getCurrentImageAssignmentId('photo_submission', existing.id, cityId);
    if (assignmentId) {
      await revokePhotoSubmissionAssignment(existing.id, cityId, assignmentId);
      revokedAssignmentId = assignmentId;
    }
  }

  const { error: deleteError } = await supabase.from('photo_submissions').delete().eq('id', id);
  if (deleteError) {
    if (revokedAssignmentId) {
      try {
        await restorePhotoSubmissionAssignment(existing.id, cityId, revokedAssignmentId);
      } catch (restoreErr) {
        const restoreMsg = restoreErr instanceof Error ? restoreErr.message : String(restoreErr);
        throw new PhotoSubmissionAssignmentInconsistentError(
          `Incoerenza photo_submission ↔ assignment: delete submission fallito (${deleteError.message}); ripristino assignment fallito (${restoreMsg}). submission=${id}, assignment=${revokedAssignmentId}.`,
        );
      }
    }
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
