/**
 * cityWriteService.ts
 *
 * RESPONSABILITÀ: Persistenza di CityDetails verso Supabase.
 *
 * SEPARAZIONE DOMINIO:
 * - Input: CityDetails (read model UI, con MediaStatus semantico)
 * - Output DB: CityUpsertPayload (write payload esplicito, soddisfa Insert<'cities'>)
 *
 * PERCHÉ CityUpsertPayload e non DbCityUpdate:
 * - supabase.upsert() richiede il contratto di Insert, non di Update.
 * - DbCityUpdate (= Update<'cities'>) ha tutti i campi opzionali → incompatibile.
 * - CityUpsertPayload ha id e name obbligatori e tutti i campi espliciti.
 *
 * MEDIA GOVERNANCE:
 * - image_is_placeholder deriva da city.image_status === 'placeholder'
 * - hero_is_placeholder deriva da city.hero_status === 'placeholder'
 * - Il DB persiste il flag booleano per future query server-side senza JS.
 * - Il frontend usa solo image_status e hero_status (MediaStatus).
 */

import { supabase } from '../supabaseClient';
import { CityDetails } from '../../types/index';
import { CityUpsertPayload } from '../../types/write';
import { invalidateCityCache, clearCacheKey } from './cityCache';
import { reclaimOrphanedItems } from './cityLifecycleService';

import { 
    serializePatronDetails, 
    serializeRatings, 
    serializeGallery, 
    serializeStringArray 
} from '../../utils/jsonSerialization';

// Helper per calcolare la media matematica perfetta dai dettagli
const calculateDerivedRating = (ratings: Record<string, number> | undefined): number => {
    if (!ratings) return 0;
    const values = Object.values(ratings);
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    const avg100 = sum / values.length;
    return parseFloat(((avg100 / 100) * 5).toFixed(1));
};

export const saveCityDetails = async (city: CityDetails, options: { skipReclaim?: boolean } = {}): Promise<void> => {
    invalidateCityCache(city.id);
    clearCacheKey('manifest');

    const derivedRating = calculateDerivedRating(city.details.ratings);
    const heroImage = city.details.heroImage;
    
    // Filtro asset galleria per evitare duplicati della Hero (Media Governance)
    const sanitizedGallery = (city.details.gallery || []).filter(asset => asset.url !== heroImage);

    /**
     * MAPPING ESPLICITO: CityDetails → CityUpsertPayload
     *
     * Ogni campo è intenzionalmente mappato.
     * Non ci sono cast, non ci sono Partial, non ci sono optional artificiali.
     *
     * MEDIA: image_status e hero_status (MediaStatus) sono sincronizzati con gli enum DB.
     * JSON: serializzazione esplicita tramite utility dedicate (Hardened).
     */
    const payload: CityUpsertPayload = {
        // Identità
        id: city.id,
        name: city.name,
        slug: city.slug ?? null,

        // Geo
        continent: city.continent ?? null,
        nation: city.nation ?? null,
        admin_region: city.adminRegion ?? null,
        zone: city.zone ?? null,
        coords_lat: city.coords.lat,
        coords_lng: city.coords.lng,

        // Descrittivo
        description: city.description ?? null,
        status: city.status ?? null,

        // Media — governance semantica (DB-Driven)
        image_url: city.imageUrl ?? null,
        image_status: city.image_status,
        image_credit: city.imageCredit ?? null,
        image_license: city.imageLicense ?? null,
        hero_image: heroImage ?? null,
        hero_status: city.hero_status,

        // Metriche
        rating: derivedRating,
        visitors: city.visitors ?? null,
        is_featured: city.isFeatured ?? null,
        special_badge: city.specialBadge ?? null,
        home_order: city.homeOrder ?? null,

        // Editoriale
        subtitle: city.details.subtitle ?? null,
        history_snippet: city.details.historySnippet ?? null,
        history_full: city.details.historyFull ?? null,
        official_website: city.details.officialWebsite ?? null,

        // JSON — mappatura esplicita e serializzabile (Hardened)
        patron_details: serializePatronDetails(city.details.patronDetails),
        ratings: serializeRatings(city.details.ratings),
        gallery: serializeGallery(sanitizedGallery),
        generation_logs: serializeStringArray(city.details.generationLogs),

        // Timestamps
        updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('cities').upsert(payload);
    if (error) throw error;

    if (city.id && city.name && !options.skipReclaim) {
        await reclaimOrphanedItems(city.id, city.name);
    }
};
