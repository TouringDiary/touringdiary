
import { getFullManifestAsync, getCityDetails } from './city/cityReadService';
import { saveCityDetails } from './city/cityWriteService';

/**
 * SERVIZIO DI CONSISTENZA MEDIA-CITTÀ
 * Questo servizio funge da ponte per evitare dipendenze circolari tra mediaService e cityService.
 * Gestisce la logica di business che richiede la conoscenza di entrambi i domini.
 */

export const syncPhotoDescriptionToCity = async (photoUrl: string, newDescription: string, locationName: string) => {
    try {
        const manifest = await getFullManifestAsync();
        // Trova la città corrispondente al nome della location
        const citySummary = manifest.find(c => 
            locationName.toLowerCase().trim().includes(c.name.toLowerCase().trim()) ||
            c.name.toLowerCase().trim().includes(locationName.toLowerCase().trim())
        );
        
        if (!citySummary) return;
        
        const city = await getCityDetails(citySummary.id);
        if (!city) return;
        
        let changed = false;
        
        // Se la foto è usata come Hero o Card image, aggiorniamo il credito/descrizione nella città
        if (city.details.heroImage === photoUrl || city.imageUrl === photoUrl) {
             city.imageCredit = newDescription;
             changed = true;
        }
        
        if (changed) {
            await saveCityDetails(city);
        }
    } catch (e) {
        console.error("[Consistency] Error syncing photo description:", e);
    }
};

export const propagatePhotoRemoval = async (photoUrl: string, locationName: string, description?: string): Promise<boolean> => {
    try {
        const manifest = await getFullManifestAsync();
        let targetCities = manifest;
        
        // Filtra le città potenzialmente interessate per ridurre le chiamate
        if (locationName) {
             const matched = manifest.filter(c => 
                c.name.toLowerCase().includes(locationName.toLowerCase().trim()) || 
                locationName.toLowerCase().trim().includes(c.name.toLowerCase().trim())
             );
             if (matched.length > 0) targetCities = matched;
        }
        
        let globalChanged = false;
        // Se la descrizione conteneva tag speciali, forziamo controlli
        const isHeroContext = description?.includes('[HERO]');

        for (const summary of targetCities) {
            const city = await getCityDetails(summary.id);
            if (!city) continue;
            
            let changed = false;
            
            // 1. Check Hero / Card Image
            if (isHeroContext || city.details.heroImage === photoUrl || city.imageUrl === photoUrl) {
                // Revert to placeholder Unsplash generico
                city.details.heroImage = 'https://images.unsplash.com/photo-1596825205486-3c36957b9fba?q=80&w=1000'; 
                city.imageUrl = city.details.heroImage;
                city.imageCredit = ''; 
                changed = true;
            }
            
            // 2. Check Patrono
            if (city.details.patronDetails?.imageUrl === photoUrl) {
                city.details.patronDetails.imageUrl = '';
                changed = true;
            }
            
            // 3. Check Galleria
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
        console.error("[Consistency] Error propagating removal:", e);
        return false;
    }
};
