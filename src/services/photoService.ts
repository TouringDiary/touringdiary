
import { supabase } from './supabaseClient';
import { PhotoSubmission } from '../types/index';
import { DatabasePhotoSubmission } from '../types/database';
// FIX: Import diretti per evitare cicli
import { getFullManifestAsync, getCityDetails } from './city/cityReadService';
import { saveCityDetails } from './city/cityWriteService';
import { dataURLtoFile } from '../utils/common';

const BUCKET_NAME = 'community-photos';
const PUBLIC_BUCKET = 'public-media';

// Helper Regex UUID
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// --- (Keep existing upload/delete functions unchanged) ---
export const getPendingPhotoCount = async (): Promise<number> => {
    try {
        const { count, error } = await supabase
            .from('photo_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');
        if (error) throw error;
        return count || 0;
    } catch (e: any) {
        // Silenzia completamente gli errori di rete per i contatori background
        return 0;
    }
};

export const uploadPublicMedia = async (file: File, folder: string = 'general'): Promise<string | null> => {
    try {
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const timestamp = Date.now();
        const filePath = `${folder}/${timestamp}_${safeName}`;
        const { error: uploadError } = await supabase.storage.from(PUBLIC_BUCKET).upload(filePath, file, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(filePath);
        return publicUrl;
    } catch (e) {
        return null;
    }
};

export const uploadBase64PublicMedia = async (base64Data: string, folder: string = 'edited'): Promise<string | null> => {
    try {
        const fileName = `edited_${Date.now()}.jpg`;
        const file = dataURLtoFile(base64Data, fileName);
        return await uploadPublicMedia(file, folder);
    } catch (e) {
        return null;
    }
};

const syncPhotoDescriptionToCity = async (photoUrl: string, newDescription: string, locationName: string) => {
    try {
        const manifest = await getFullManifestAsync();
        const citySummary = manifest.find(c => 
            locationName.toLowerCase().trim().includes(c.name.toLowerCase().trim()) ||
            c.name.toLowerCase().trim().includes(locationName.toLowerCase().trim())
        );
        if (!citySummary) return;
        const city = await getCityDetails(citySummary.id);
        if (!city) return;
        let changed = false;
        if (city.details.heroImage === photoUrl || city.imageUrl === photoUrl) {
             city.imageCredit = newDescription;
             changed = true;
        }
        if (changed) await saveCityDetails(city);
    } catch (e) {}
};

export const propagatePhotoRemoval = async (photoUrl: string, locationName: string, description?: string): Promise<boolean> => {
    try {
        const manifest = await getFullManifestAsync();
        let targetCities = manifest;
        if (locationName) {
             const matched = manifest.filter(c => 
                c.name.toLowerCase().includes(locationName.toLowerCase().trim()) || 
                locationName.toLowerCase().trim().includes(c.name.toLowerCase().trim())
             );
             if (matched.length > 0) targetCities = matched;
        }
        let globalChanged = false;
        const isHeroContext = description?.includes('[HERO]');

        for (const summary of targetCities) {
            const city = await getCityDetails(summary.id);
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
            if (city.details.gallery && city.details.gallery.includes(photoUrl)) {
                city.details.gallery = city.details.gallery.filter(url => url !== photoUrl);
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

// NUOVA FUNZIONE: Sposta le foto in "city_deleted"
export const flagPhotosAsCityDeleted = async (cityName: string): Promise<void> => {
    try {
        // Usa ILIKE per match case-insensitive
        const { error } = await supabase
            .from('photo_submissions')
            .update({ status: 'city_deleted', updated_at: new Date().toISOString() })
            .ilike('location_name', cityName);

        if (error) throw error;
        console.log(`[PhotoService] Foto di ${cityName} spostate in city_deleted.`);
    } catch (e) {
        console.error("Error flagging photos as deleted:", e);
    }
};

export const uploadCommunityPhoto = async (file: File, userId: string, userName: string, locationName: string, description: string): Promise<PhotoSubmission | null> => {
    try {
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); 
        const fileName = `${userId}_${Date.now()}_${safeName}`;
        const filePath = `${locationName}/${fileName}`; 
        const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
        const isAdmin = userId.startsWith('admin') || userId.includes('admin') || userId === 'u_admin_all' || userId === 'u_admin_limited';
        const initialStatus = isAdmin ? 'approved' : 'pending';
        const newRecord: Partial<DatabasePhotoSubmission> = {
            user_id: userId,
            user_name: userName,
            location_name: locationName,
            description: description,
            image_url: publicUrl,
            status: initialStatus,
            likes: 0
        };
        const { data, error: dbError } = await supabase.from('photo_submissions').insert(newRecord).select().single();
        if (dbError) throw dbError;
        const dbPhoto = data as DatabasePhotoSubmission;
        return {
            id: dbPhoto.id,
            userId: dbPhoto.user_id,
            user: dbPhoto.user_name,
            locationName: dbPhoto.location_name,
            description: dbPhoto.description,
            url: dbPhoto.image_url,
            status: dbPhoto.status as 'pending' | 'approved' | 'rejected' | 'city_deleted',
            date: dbPhoto.created_at,
            likes: dbPhoto.likes
        };
    } catch (e) {
        return null;
    }
};

export const fetchCommunityPhotos = async (cityFilter?: string): Promise<PhotoSubmission[]> => {
    try {
        let query = supabase.from('photo_submissions').select('*').order('created_at', { ascending: false });
        const { data, error } = await query;
        if (error) throw error;
        return (data as any[]).map(p => ({
            id: p.id,
            userId: p.user_id,
            user: p.user_name,
            locationName: p.location_name,
            description: p.description,
            url: p.image_url,
            status: p.status as 'pending' | 'approved' | 'rejected' | 'city_deleted',
            date: p.created_at,
            likes: p.likes,
            updatedAt: p.updated_at || p.created_at,
            publishedAt: p.published_at
        }));
    } catch (e) {
        return [];
    }
};

export const updatePhotoStatusInDb = async (id: string, status: 'approved' | 'rejected' | 'pending'): Promise<void> => {
    const updates: any = { status, updated_at: new Date().toISOString() };
    if (status === 'approved') updates.published_at = new Date().toISOString();
    await supabase.from('photo_submissions').update(updates).eq('id', id);
};

export const updatePhotoDataInDb = async (id: string, data: Partial<PhotoSubmission>): Promise<void> => {
    const payload: any = { updated_at: new Date().toISOString() };
    if (data.locationName) payload.location_name = data.locationName;
    if (data.user) payload.user_name = data.user;
    if (data.description) payload.description = data.description;
    if (data.url) payload.image_url = data.url;
    await supabase.from('photo_submissions').update(payload).eq('id', id);
    if (data.description && data.locationName && data.url) await syncPhotoDescriptionToCity(data.url, data.description, data.locationName);
};

export const deletePhotoSubmissionInDb = async (id: string): Promise<void> => {
    await supabase.from('photo_submissions').delete().eq('id', id);
};

// --- FIX LIKE LOGIC: ABSOLUTE COUNT RECALCULATION ---

export const togglePhotoLikeInDb = async (photoId: string, userId: string): Promise<{ liked: boolean, count: number }> => {
    // SECURITY FIX: UUID CHECK
    if (!userId || userId === 'guest' || !UUID_REGEX.test(userId)) return { liked: false, count: 0 };
    
    try {
        // 1. Controlla lo stato del like esistente (ID Only per velocità)
        const { data: existing } = await supabase
            .from('photo_likes')
            .select('id')
            .eq('user_id', userId)
            .eq('photo_id', photoId)
            .maybeSingle(); 

        let liked = false;

        if (existing) {
            // UNLIKE: Rimuovi
            await supabase.from('photo_likes').delete().eq('id', existing.id);
            liked = false;
        } else {
            // LIKE: Aggiungi
            await supabase.from('photo_likes').insert({ user_id: userId, photo_id: photoId });
            liked = true;
        }

        // 2. RE-COUNT TOTALE REALE (Source of Truth)
        // Invece di fare +1/-1 su un valore potenzialmente vecchio, contiamo le righe.
        const { count } = await supabase
            .from('photo_likes')
            .select('*', { count: 'exact', head: true })
            .eq('photo_id', photoId);
        
        const realCount = count || 0;

        // 3. Aggiorna la cache denormalizzata su photo_submissions
        await supabase
            .from('photo_submissions')
            .update({ likes: realCount })
            .eq('id', photoId);

        return { liked, count: realCount };

    } catch (e) {
        console.error("Error toggling photo like:", e);
        return { liked: false, count: 0 };
    }
};

export const fetchUserPhotoLikes = async (userId: string): Promise<string[]> => {
    // SECURITY FIX: UUID CHECK
    if (!userId || userId === 'guest' || !UUID_REGEX.test(userId)) return [];
    
    try {
        const { data } = await supabase.from('photo_likes').select('photo_id').eq('user_id', userId);
        return (data || []).map((row: any) => row.photo_id);
    } catch (e) {
        return [];
    }
};
