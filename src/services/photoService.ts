import { supabase } from './supabaseClient';
import { PhotoSubmission } from '../types/index';
import { DatabasePhotoSubmission } from '../types/database';

// FIX: Import diretti per evitare cicli
import { getFullManifestAsync, getCityDetails } from './city/cityReadService';
import { saveCityDetails } from './city/cityWriteService';

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
// HERO IMAGE CREDIT SYNC
// --------------------------------------------------

const syncPhotoDescriptionToCity = async (
    photoUrl: string,
    newDescription: string,
    locationName: string
) => {

    try {

        const manifest =
            await getFullManifestAsync();

        const citySummary = manifest.find(
            c =>
                locationName
                    .toLowerCase()
                    .trim()
                    .includes(
                        c.name.toLowerCase().trim()
                    ) ||
                c.name
                    .toLowerCase()
                    .trim()
                    .includes(
                        locationName
                            .toLowerCase()
                            .trim()
                    )
        );

        if (!citySummary) return;

        const city =
            await getCityDetails(citySummary.id);

        if (!city) return;

        let changed = false;

        if (
            city.details.heroImage === photoUrl ||
            city.imageUrl === photoUrl
        ) {

            city.imageCredit = newDescription;

            changed = true;
        }

        if (changed) {

            await saveCityDetails(city);
        }

    } catch {}
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

        const manifest =
            await getFullManifestAsync();

        let targetCities = manifest;

        if (locationName) {

            const matched =
                manifest.filter(c =>
                    c.name
                        .toLowerCase()
                        .includes(
                            locationName
                                .toLowerCase()
                                .trim()
                        ) ||
                    locationName
                        .toLowerCase()
                        .trim()
                        .includes(
                            c.name
                                .toLowerCase()
                                .trim()
                        )
                );

            if (matched.length > 0) {

                targetCities = matched;
            }
        }
        let globalChanged = false;

        const isHeroContext =
            description?.includes('[HERO]');

        for (const summary of targetCities) {

            const city =
                await getCityDetails(summary.id);

            if (!city) continue;

            let changed = false;

            if (
                isHeroContext ||
                city.details.heroImage === photoUrl ||
                city.imageUrl === photoUrl
            ) {

                city.details.heroImage =
                    'https://images.unsplash.com/photo-1596825205486-3c36957b9fba?q=80&w=1000';

                city.imageUrl =
                    city.details.heroImage;

                city.imageCredit = '';

                changed = true;
            }

            if (
                city.details.patronDetails
                    ?.imageUrl === photoUrl
            ) {

                city.details.patronDetails.imageUrl =
                    '';

                changed = true;
            }

            if (
                city.details.gallery &&
                city.details.gallery.includes(photoUrl)
            ) {

                city.details.gallery =
                    city.details.gallery.filter(
                        url => url !== photoUrl
                    );

                changed = true;
            }

            if (changed) {

                await saveCityDetails(city);

                globalChanged = true;
            }
        }

        return globalChanged;

    } catch {

        return false;
    }
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
        description: string
    ): Promise<PhotoSubmission | null> => {

        try {

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
                isAdmin
                    ? 'approved'
                    : 'pending';

            const newRecord:
                Partial<DatabasePhotoSubmission> =
                {
                    user_id: userId,
                    user_name: userName,
                    location_name: locationName,
                    description,
                    image_url: publicUrl,
                    status: initialStatus,
                    likes: 0
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
                likes: dbPhoto.likes
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
                    .select('*')
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
                        p.published_at
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

export const togglePhotoLikeInDb =
    async (
        photoId: string
    ): Promise<{
        liked: boolean;
        count: number;
    }> => {

        try {

            if (
                !photoId ||
                !UUID_REGEX.test(photoId)
            ) {

                return {
                    liked: false,
                    count: 0
                };
            }

            const {
                data: { user }
            } =
                await supabase.auth.getUser();

            if (!user)
                throw new Error(
                    'User not authenticated'
                );

            const userId = user.id;

            const {
                data: existingRows,
                error: selectError
            } = await supabase
                .from('photo_likes')
                .select('id')
                .eq('user_id', userId)
                .eq('photo_id', photoId);

            if (selectError) throw selectError;

            const alreadyLiked =
                Array.isArray(existingRows) &&
                existingRows.length > 0;

            if (alreadyLiked) {

                await supabase
                    .from('photo_likes')
                    .delete()
                    .eq(
                        'user_id',
                        userId
                    )
                    .eq(
                        'photo_id',
                        photoId
                    );

            } else {

                await supabase
                    .from('photo_likes')
                    .insert({
                        user_id: userId,
                        photo_id: photoId
                    });
            }

            const { count } =
                await supabase
                    .from('photo_likes')
                    .select('*', {
                        count: 'exact',
                        head: true
                    })
                    .eq(
                        'photo_id',
                        photoId
                    );

            const realCount =
                count || 0;

            await supabase
                .from('photo_submissions')
                .update({
                    likes: realCount
                })
                .eq('id', photoId);

            return {
                liked:
                    !alreadyLiked,
                count: realCount
            };

        } catch (e) {

            console.error(
                'Error toggling photo like:',
                e
            );

            return {
                liked: false,
                count: 0
            };
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