import { supabase } from './supabaseClient';
import { PhotoSubmission, MediaStatus } from '../types/index';
import { DatabasePhotoSubmission } from '../types/database';
import { Insert, Update } from '../types/domain/index';

/** Tipi locali per hardening join e update */
type DatabasePhotoSubmissionUpdate = Update<'photo_submissions'>;
type DbPhotoWithLikes = DatabasePhotoSubmission & {
    photo_likes?: { photo_id: string }[];
};

// FIX: Import diretti per evitare cicli

import { dataURLtoFile } from '../utils/common';
import { getFullManifestAsync, getCityDetails, resolveCityIdentity } from './city/cityReadService';
import { saveCityDetails } from './city/cityWriteService';
import { sanitizeMediaStatus } from '../utils/media';
import { PHOTO_SUBMISSION_STATUS_VALUES } from '../constants/governance';

const BUCKET_NAME = 'community-photos';
const PUBLIC_BUCKET = 'public-media';

// Helper Regex UUID (UNICA DEFINIZIONE VALIDA)
const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;



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
    folder: string = 'general'
): Promise<string | null> => {

    try {

        const safeName = file.name.replace(
            /[^a-zA-Z0-9.-]/g,
            '_'
        );

        const timestamp = Date.now();

        const filePath =
            `${folder}/${timestamp}_${safeName}`;

        const { error: uploadError } =
            await supabase.storage
                .from(PUBLIC_BUCKET)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

        if (uploadError) throw uploadError;

        const {
            data: { publicUrl }
        } = supabase.storage
            .from(PUBLIC_BUCKET)
            .getPublicUrl(filePath);

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
    folder: string = 'edited'
): Promise<string | null> => {

    try {

        const fileName =
            `edited_${Date.now()}.jpg`;

        const file =
            dataURLtoFile(base64Data, fileName);

        return await uploadPublicMedia(
            file,
            folder
        );

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
    description?: string
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
            targetCityIds = manifest.map(c => c.id);
        }

        let globalChanged = false;
        const isHeroContext = description?.includes('[HERO]');

        for (const cityId of targetCityIds) {
            const city = await getCityDetails(cityId);
            if (!city) continue;
            let changed = false;
            if (isHeroContext || city.details.heroImage === photoUrl || city.imageUrl === photoUrl) {
                city.details.heroImage = 'https://images.unsplash.com/photo-1596825205486-3c36957b9fba?q=80&w=1000';
                city.imageUrl = city.details.heroImage;
                city.imageCredit = '';
                changed = true;
            }
            if (city.details.patronDetails?.imageUrl === photoUrl) {
                city.details.patronDetails.imageUrl = '';
                changed = true;
            }
            if (city.details.gallery && city.details.gallery.some(asset => asset.url === photoUrl)) {
                city.details.gallery = city.details.gallery.filter(
                    asset => asset.url !== photoUrl
                );

                changed = true;
            }
            if (changed) {
                await saveCityDetails(city);
                globalChanged = true;
            }
        }
        return globalChanged;
    } catch (e) {
        return false;
    }
};

export const syncPhotoDescriptionToCity = async (photoUrl: string, newDescription: string, locationName: string) => {
    try {
        const identity = await resolveCityIdentity(locationName);
        if (!identity) return;
        const city = await getCityDetails(identity.id);
        if (!city) return;
        let changed = false;
        if (city.details.heroImage === photoUrl || city.imageUrl === photoUrl) {
            city.imageCredit = newDescription;
            changed = true;
        }
        if (changed) await saveCityDetails(city);
    } catch (e) { }
};


// --------------------------------------------------
// FLAG PHOTOS AS CITY DELETED
// --------------------------------------------------

export const flagPhotosAsCityDeleted =
    async (
        cityName: string
    ): Promise<void> => {

        try {

            // Resolve identity for SSoT update
            const identity = await resolveCityIdentity(cityName);
            
            let query = supabase.from('photo_submissions').update({
                status: 'city_deleted',
                updated_at: new Date().toISOString()
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

            console.error(
                'Error flagging photos as deleted:',
                e
            );
        }
    };


// --------------------------------------------------
// COMMUNITY PHOTO UPLOAD
// --------------------------------------------------

import { mapDbPhotoSubmission } from './mediaService';

// Rimosso mapDbPhotoToSubmission locale in favore del mapper centralizzato in mediaService.ts

export const uploadCommunityPhoto =
    async (
        file: File,
        userId: string,
        userName: string,
        locationName: string,
        description: string,
        cityId?: string,
        forceStatus?: 'pending' | 'approved' | 'rejected',
        isOfficial: boolean = false,
        mediaStatus: MediaStatus = 'real'
    ): Promise<PhotoSubmission | null> => {

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
                    throw new Error("City ID mandatory for Official/Editorial photos.");
                }
                console.warn(`[photoService] Upload proceeds without cityId for location: ${locationName}`);
            }

            const safeName =
                file.name.replace(
                    /[^a-zA-Z0-9.-]/g,
                    '_'
                );

            const fileName =
                `${userId}_${Date.now()}_${safeName}`;

            const filePath =
                `${locationName}/${fileName}`;

            const { error: uploadError } =
                await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(filePath, file);

            if (uploadError)
                throw uploadError;

            const {
                data: { publicUrl }
            } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(filePath);

            const isAdmin =
                userId.startsWith('admin') ||
                userId.includes('admin') ||
                userId === 'u_admin_all' ||
                userId === 'u_admin_limited';

            const initialStatus =
                forceStatus || (isAdmin ? 'approved' : 'pending');

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
                media_status: mediaStatus
            };

            const {
                data,
                error: dbError
            } = await supabase
                .from('photo_submissions')
                .insert(newRecord)
                .select()
                .single();

            if (dbError)
                throw dbError;

            return mapDbPhotoSubmission(data);

        } catch (e) {
            console.error("[photoService] Error in uploadCommunityPhoto:", e);
            return null;
        }
    };


// --------------------------------------------------
// GET OR CREATE PHOTO SUBMISSION (REGISTRAZIONE PERSISTENTE)
// --------------------------------------------------

/**
 * Assicura che un'immagine (anche ufficiale o POI) abbia un record reale e persistente in photo_submissions.
 * NON usa più ID virtuali. Restituisce sempre un UUID reale dal database.
 */
export const getOrCreatePhotoSubmissionForUrl = async (
    url: string,
    cityId: string,
    cityName: string,
    description: string,
    mediaStatus: MediaStatus = 'real'
): Promise<PhotoSubmission | null> => {
    if (!url || !cityId) return null;

    try {
        // STEP 1: Cerca per URL esatto (Deduplicazione)
        let { data: existing, error: searchError } = await supabase
            .from('photo_submissions')
            .select('*')
            .eq('city_id', cityId)
            .eq('image_url', url)
            .maybeSingle();

        if (searchError) {
            console.error("[photoService] Error searching existing photo:", searchError);
            return null;
        }

        if (existing) {
            return mapDbPhotoSubmission(existing);
        }

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
            media_status: mediaStatus
        };

        const { data: created, error } = await supabase
            .from('photo_submissions')
            .insert(newRecord)
            .select()
            .single();

        if (error) throw error;

        return mapDbPhotoSubmission(created);

    } catch (e) {
        console.error("[photoService] Errore in getOrCreatePhotoSubmissionForUrl:", e);
        return null;
    }
};


// --------------------------------------------------
// FETCH TOP CITY PHOTOS (GALLERY)
// --------------------------------------------------

/**
 * Recupera le prime 10 immagini approvate per una specifica città.
 * Pattern safe con fallback-return [].
 */
export const fetchTopCityPhotos = async (cityId: string): Promise<PhotoSubmission[]> => {
    if (!cityId) return [];

    try {
        const { data, error } = await supabase
            .from('photo_submissions')
            .select('*')
            .eq('city_id', cityId)
            .eq('status', 'approved')
            .not('media_status', 'in', '("placeholder","missing")')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error("[photoService] REST Error fetching top photos:", error);
            return [];
        }

        return (data || []).map(p => mapDbPhotoSubmission(p));

    } catch (err) {
        console.error("[photoService] Catch fallback in fetchTopCityPhotos:", err);
        return [];
    }
};



export const fetchCommunityPhotos =
    async (status?: string, includePlaceholders: boolean = false): Promise<
        PhotoSubmission[]
    > => {

        try {

            let query = supabase
                .from('photo_submissions')
                .select('*, photo_likes(photo_id)')
                .order(
                    'created_at',
                    {
                        ascending: false
                    }
                );

            if (!includePlaceholders) {
                query = query.not('media_status', 'in', '("placeholder","missing")');
            }

            if (status && status !== 'all') {
                query = query.eq('status', status);
            }

            const { data, error } = await query;

            if (error) throw error;

            const photos = (data as DbPhotoWithLikes[]).map(p => {
                const base = mapDbPhotoSubmission(p);
                return {
                    ...base,
                    likedByUser: p.photo_likes && p.photo_likes.length > 0
                };
            });

            return photos;

        } catch {
            return [];
        }
    };

// --------------------------------------------------
// UPDATE PHOTO STATUS
// --------------------------------------------------

export const updatePhotoStatusInDb =
    async (
        id: string,
        status:
            | 'approved'
            | 'rejected'
            | 'pending'
    ): Promise<void> => {

        const updates: DatabasePhotoSubmissionUpdate = {
            status,
            updated_at:
                new Date().toISOString()
        };

        if (status === 'approved') {

            updates.published_at =
                new Date().toISOString();
        }

        try {
            await supabase
                .from('photo_submissions')
                .update(updates)
                .eq('id', id);
        } catch (err) {
            console.error("[photoService] Error updating photo status:", err);
        }
    };


// --------------------------------------------------
// UPDATE PHOTO DATA
// --------------------------------------------------

export const updatePhotoData =
    async (
        id: string,
        data: Partial<PhotoSubmission>
    ): Promise<void> => {

        const payload: DatabasePhotoSubmissionUpdate = {
            updated_at:
                new Date().toISOString()
        };

        if (data.locationName)
            payload.location_name =
                data.locationName;

        if (data.user)
            payload.user_name =
                data.user;

        if (data.description)
            payload.description =
                data.description;

        if (data.url)
            payload.image_url =
                data.url;

        if (data.isOfficial !== undefined)
            payload.is_official = data.isOfficial;

        if (data.cityId)
            payload.city_id = data.cityId;

        try {
            await supabase
                .from('photo_submissions')
                .update(payload)
                .eq('id', id);

            if (data.description && data.locationName && data.url) {
                await syncPhotoDescriptionToCity(data.url, data.description, data.locationName);
            }
        } catch (err) {
            console.error("[photoService] Error updating photo data:", err);
        }
    };


// --------------------------------------------------
// DELETE PHOTO SUBMISSION
// --------------------------------------------------

export const deletePhotoSubmissionInDb =
    async (
        id: string
    ): Promise<void> => {

        try {
            await supabase
                .from('photo_submissions')
                .delete()
                .eq('id', id);
        } catch (err) {
            console.error("[photoService] Error deleting photo submission:", err);
        }
    };


// --------------------------------------------------
// TOGGLE PHOTO LIKE (FIX DEFINITIVO)
// --------------------------------------------------

export const togglePhotoLikeRPC =
    async (
        photoId: string
    ): Promise<{
        liked: boolean;
        count: number;
    }> => {

        if (!photoId) return { liked: false, count: 0 };

        // RIMOSSA COMPLETAMENTE LA LOGICA VIRTUAL IDs
        // Il frontend deve garantire di passare un UUID reale persistente.

        if (!UUID_REGEX.test(photoId)) {
            console.error("[photoService] ID non valido per il like (atteso UUID):", photoId);
            return { liked: false, count: 0 };
        }

        try {
            const { data, error } = await supabase.rpc('toggle_photo_like', {
                p_photo_id: photoId
            });

            if (error) throw error;

            const rpcData = data as { is_liked: boolean; likes_count: number };
            return {
                liked: rpcData.is_liked,
                count: rpcData.likes_count
            };

        } catch (e) {
            console.error(
                'Critical: Error toggling photo like via RPC:',
                e
            );
            throw e;
        }
    };


// --------------------------------------------------
// FETCH USER PHOTO LIKES
// --------------------------------------------------

export const fetchUserPhotoLikes =
    async (
        userId: string
    ): Promise<string[]> => {

        if (
            !userId ||
            userId === 'guest' ||
            !UUID_REGEX.test(userId)
        )
            return [];

        try {

            const { data } =
                await supabase
                    .from('photo_likes')
                    .select('photo_id')
                    .eq(
                        'user_id',
                        userId
                    );

            return (data || []).map(
                (row) =>
                    row.photo_id
            );

        } catch {

            return [];
        }
    };
