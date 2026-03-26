import { supabase } from './supabaseClient';
import { PhotoSubmission } from '../types/index';
import { DatabasePhotoSubmission } from '../types/database';

// FIX: Import diretti per evitare cicli

import { dataURLtoFile } from '../utils/common';

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
    // SSoT: This function is now a no-op for city metadata sync as photo_submissions is the SSoT.
    // In a future phase, this could handle storage cleanup (deleting the file from the bucket).
    console.log(`[SSoT] Skipping legacy sync for ${photoUrl} from ${locationName}`);
    return true;
};


// --------------------------------------------------
// FLAG PHOTOS AS CITY DELETED
// --------------------------------------------------

export const flagPhotosAsCityDeleted =
    async (
        cityName: string
    ): Promise<void> => {

        try {

            const { error } =
                await supabase
                    .from('photo_submissions')
                    .update({
                        status: 'city_deleted',
                        updated_at:
                            new Date().toISOString()
                    })
                    .ilike(
                        'location_name',
                        cityName
                    );

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

export const uploadCommunityPhoto =
    async (
        file: File,
        userId: string,
        userName: string,
        locationName: string,
        description: string,
        cityId?: string,
        forceStatus?: 'pending' | 'approved' | 'rejected'
    ): Promise<PhotoSubmission | null> => {

        try {
            // 1. Resolve cityId if not provided (Lookup DB by name)
            let resolvedCityId = cityId;
            if (!resolvedCityId && locationName) {
                const { data: cityData } = await supabase
                    .from('cities')
                    .select('id')
                    .ilike('name', locationName.trim())
                    .maybeSingle();

                if (cityData) resolvedCityId = cityData.id;
            }

            // CRITICAL: city_id must be mandatory for SSoT
            if (!resolvedCityId) {
                throw new Error("City not found for upload. Photos must be linked to a valid city.");
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

            const newRecord:
                Partial<DatabasePhotoSubmission> =
            {
                user_id: userId,
                user_name: userName,
                location_name: locationName,
                description,
                image_url: publicUrl,
                status: initialStatus,
                likes: 0,
                city_id: resolvedCityId // ADDED
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

            const dbPhoto =
                data as DatabasePhotoSubmission;

            return {
                id: dbPhoto.id,
                userId: dbPhoto.user_id,
                user: dbPhoto.user_name,
                locationName:
                    dbPhoto.location_name,
                description:
                    dbPhoto.description,
                url: dbPhoto.image_url,
                status:
                    dbPhoto.status as
                    | 'pending'
                    | 'approved'
                    | 'rejected'
                    | 'city_deleted',
                date: dbPhoto.created_at,
                likes: dbPhoto.likes,
                cityId: dbPhoto.city_id || undefined // ADDED MAPPING
            };

        } catch {

            return null;
        }
    };


// --------------------------------------------------
// FETCH COMMUNITY PHOTOS
// --------------------------------------------------

export const fetchCommunityPhotos =
    async (): Promise<
        PhotoSubmission[]
    > => {

        try {

            const { data, error } =
                await supabase
                    .from('photo_submissions')
                    .select('*, photo_likes(photo_id)')
                    .order(
                        'created_at',
                        {
                            ascending: false
                        }
                    );

            if (error) throw error;

            return (data as any[]).map(
                p => ({
                    id: p.id,
                    userId: p.user_id,
                    user: p.user_name,
                    locationName:
                        p.location_name,
                    description:
                        p.description,
                    url: p.image_url,
                    status:
                        p.status,
                    date: p.created_at,
                    likes: p.likes,
                    updatedAt:
                        p.updated_at ||
                        p.created_at,
                    publishedAt:
                        p.published_at,
                    likedByUser:
                        p.photo_likes &&
                        p.photo_likes.length > 0
                })
            );

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

        const updates: any = {
            status,
            updated_at:
                new Date().toISOString()
        };

        if (status === 'approved') {

            updates.published_at =
                new Date().toISOString();
        }

        await supabase
            .from('photo_submissions')
            .update(updates)
            .eq('id', id);
    };


// --------------------------------------------------
// UPDATE PHOTO DATA
// --------------------------------------------------

export const updatePhotoData =
    async (
        id: string,
        data: Partial<PhotoSubmission>
    ): Promise<void> => {

        const payload: any = {
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

        await supabase
            .from('photo_submissions')
            .update(payload)
            .eq('id', id);
    };


// --------------------------------------------------
// DELETE PHOTO SUBMISSION
// --------------------------------------------------

export const deletePhotoSubmissionInDb =
    async (
        id: string
    ): Promise<void> => {

        await supabase
            .from('photo_submissions')
            .delete()
            .eq('id', id);
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

        if (
            !photoId ||
            !UUID_REGEX.test(photoId)
        ) {
            return {
                liked: false,
                count: 0
            };
        }

        try {
            const { data, error } = await supabase.rpc('toggle_photo_like', {
                p_photo_id: photoId
            });

            if (error) throw error;

            return {
                liked: data.is_liked,
                count: data.likes_count
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
                (row: any) =>
                    row.photo_id
            );

        } catch {

            return [];
        }
    };