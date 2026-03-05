
import { supabase } from '../supabaseClient';
import { CityDetails } from '../../types/index';
import { DatabaseCity } from '../../types/database';
import { invalidateCityCache, clearCacheKey } from './cityCache';
import { reclaimOrphanedItems } from './cityLifecycleService';

// Helper per calcolare la media matematica perfetta dai dettagli
const calculateDerivedRating = (ratings: any): number => {
    if (!ratings) return 0;
    const values = Object.values(ratings) as number[];
    if (values.length === 0) return 0;
    
    const sum = values.reduce((a, b) => a + b, 0);
    const avg100 = sum / values.length;
    return parseFloat(((avg100 / 100) * 5).toFixed(1));
};

export const saveCityDetails = async (city: CityDetails, options: { skipReclaim?: boolean } = {}): Promise<void> => {
    // 1. Invalida cache specifica
    invalidateCityCache(city.id); 
    // 2. CRITICO: Forza invalidazione lista completa per far apparire subito le nuove città
    clearCacheKey('manifest'); 
    
    // CALCOLO FORZATO: La media esterna DEVE dipendere dai dettagli interni.
    const derivedRating = calculateDerivedRating(city.details.ratings);

    // --- SANITIZZAZIONE GALLERIA ---
    const heroImage = city.details.heroImage;
    const sanitizedGallery = (city.details.gallery || []).filter(url => url !== heroImage);

    const cityPayload: Partial<DatabaseCity> = {
        id: city.id, name: city.name, continent: city.continent, nation: city.nation, 
        admin_region: city.adminRegion, zone: city.zone, description: city.description, 
        image_url: city.imageUrl, 
        
        rating: derivedRating, 
        
        visitors: city.visitors, 
        is_featured: city.isFeatured, special_badge: city.specialBadge, 
        coords_lat: city.coords.lat, coords_lng: city.coords.lng, status: city.status, 
        subtitle: city.details.subtitle, hero_image: city.details.heroImage, 
        history_snippet: city.details.historySnippet, history_full: city.details.historyFull, 
        official_website: city.details.officialWebsite, patron_details: city.details.patronDetails as any, 
        ratings: city.details.ratings as any, 
        
        gallery: sanitizedGallery, 
        
        updated_at: new Date().toISOString(),
        generation_logs: city.details.generationLogs 
    };
    
    const { error } = await supabase.from('cities').upsert(cityPayload);
    
    if (error) throw error;

    // RECLAIMING AUTOMATICO: Eseguito solo se non skippato esplicitamente
    // Durante i processi AI massivi, viene disabilitato per performance e riattivato solo alla fine.
    if (city.id && city.name && !options.skipReclaim) {
        await reclaimOrphanedItems(city.id, city.name);
    }
};
