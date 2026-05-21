import { supabase } from './supabaseClient';
import { PhotoSubmission } from '../types/index';
import { Database, DatabasePhotoSubmission } from '../types/database';
import { SmartInsert } from '../types/domain/index';
// FIX: Import diretti per evitare cicli
import { getFullManifestAsync, getCityDetails, fetchGlobalCityMediaInfo, resolveCityIdentity } from './city/cityReadService';
import { saveCityDetails } from './city/cityWriteService';
import { dataURLtoFile } from '../utils/common';

const BUCKET_NAME = 'community-photos';
const PUBLIC_BUCKET = 'public-media';

// Helper Regex UUID
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Mapper autoritativo per PhotoSubmission.
 * Centralizza il boundary tra DB e Dominio Media.
 */
export const mapDbPhotoSubmission = (p: any): PhotoSubmission => {
    return {
        id: p.id,
        userId: p.user_id,
        user: p.user_name,
        locationName: p.location_name,
        description: p.description || undefined,
        url: p.image_url,
        status: p.status as 'pending' | 'approved' | 'rejected' | 'city_deleted',
        date: p.created_at,
        likes: p.likes || 0,
        updatedAt: p.updated_at || p.created_at,
        publishedAt: p.published_at,
        cityId: p.city_id || undefined,
        isOfficial: p.is_official ?? (p.user_id === '00000000-0000-0000-0000-000000000000'),
        mediaStatus: p.media_status ?? (p.image_url ? 'real' : 'missing')
    };
};

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




// --- FIX LIKE LOGIC: ABSOLUTE COUNT RECALCULATION ---

// FUNZIONI DI LIKE RIMOSSE -> SPOSTATE IN photoService.ts ED ESEGUITE VIA RPC

/**
 * Cerca un ritratto esistente per una persona famosa (es. recupero dopo cancellazione)
 */
export const findExistingPortrait = async (personName: string): Promise<string | null> => {
    try {
        // Cerca nella tabella city_people se esiste già un record per questa persona con una foto valida
        const { data } = await supabase
            .from('city_people')
            .select('image_url')
            .ilike('name', personName)
            .neq('image_url', '')
            .not('image_url', 'is', null)
            .limit(1);

        if (data && data.length > 0) {
             const url = data[0].image_url;
             // Filtra placeholder noti e avatar di default generici se non si vuole riusarli
             if (url && !url.includes('ui-avatars')) {
                 return url;
             }
        }
        
        return null;
    } catch (e) {
        console.error("Error finding existing portrait:", e);
        return null;
    }
};

/**
 * Costruisce una mappa di utilizzo degli asset (immagini) nel database.
 * Chiave: URL immagine (normalizzato) -> Valore: Array di stringhe che descrivono dove è usata.
 */
export const getAssetUsageMap = async (): Promise<Record<string, string[]>> => {
    const usageMap: Record<string, string[]> = {};

    const addToMap = (url: string | null | undefined, context: string) => {
        if (!url) return;
        const cleanUrl = url.split('?')[0].trim();
        if (!usageMap[cleanUrl]) usageMap[cleanUrl] = [];
        if (!usageMap[cleanUrl].includes(context)) usageMap[cleanUrl].push(context);
    };

    try {
        // 1. Cities (Hero, Card, Gallery) - BOUNDARY RECOVERY
        const cityMediaInfos = await fetchGlobalCityMediaInfo();
        cityMediaInfos.forEach(info => {
            addToMap(info.imageUrl, `City Card: ${info.name}`);
            addToMap(info.heroImage, `City Hero: ${info.name}`);
            info.gallery.forEach(asset => addToMap(asset.url, `City Gallery: ${info.name}`));
        });

        // 2. POIs
        const { data: pois } = await supabase.from('pois').select('name, image_url');
        pois?.forEach(p => {
            addToMap(p.image_url, `POI: ${p.name}`);
        });

        // 3. People
        const { data: people } = await supabase.from('city_people').select('name, image_url');
        people?.forEach(p => {
            addToMap(p.image_url, `Person: ${p.name}`);
        });

        // 4. Shops
        const { data: shops } = await supabase.from('shops').select('name, image_url');
        shops?.forEach(s => {
            addToMap(s.image_url, `Shop: ${s.name}`);
        });
        
        // 5. Events & Guides
        const { data: events } = await supabase.from('city_events').select('name, image_url');
        events?.forEach(e => addToMap(e.image_url, `Event: ${e.name}`));
        
        const { data: guides } = await supabase.from('city_guides').select('name, image_url');
        guides?.forEach(g => addToMap(g.image_url, `Guide: ${g.name}`));
        
        // 6. Social Templates
        const { data: templates } = await supabase.from('social_templates').select('name, bg_url');
        templates?.forEach(t => addToMap(t.bg_url, `Template: ${t.name}`));

    } catch (e) {
        console.error("Error building asset usage map:", e);
    }

    return usageMap;
};