/**
 * poiWrite.ts
 *
 * RESPONSABILITÀ: Persistenza di PointOfInterest verso Supabase.
 *
 * SEPARAZIONE DOMINIO:
 * - Input: PointOfInterest (read model UI, con MediaStatus semantico)
 * - Output DB: PoiUpsertPayload (write payload esplicito, soddisfa Insert<'pois'>)
 *
 * PERCHÉ PoiUpsertPayload e non DbPoiUpdate:
 * - supabase.upsert() richiede il contratto di Insert, non di Update.
 * - DbPoiUpdate (= Update<'pois'>) ha tutti i campi opzionali → incompatibile.
 * - PoiUpsertPayload ha id, name, city_id, category obbligatori e tutti i campi espliciti.
 *
 * MEDIA GOVERNANCE:
 * - image_status (MediaStatus) è la source of truth definitiva.
 * - Il DB persiste lo stato tramite l'enum nativo media_status.
 * - Non vengono più usati flag booleani legacy.
 */

import { supabase } from '../../supabaseClient';
import { PointOfInterest, PoiCategory } from '../../../types/index';
import { PoiUpsertPayload } from '../../../types/write';
import { User } from '../../../types/users';
import { invalidateCityCache, clearCacheKey } from '../cityCache';
import { evaluateAndUpdateCityStatus } from '../cityUpdateService';
import {
    serializeOpeningHours,
    serializeAffiliateLinks,
    serializeLinkMetadataRecord
} from '../../../utils/jsonSerialization';

export const saveSinglePoi = async (poi: PointOfInterest, cityId: string, currentUser?: User): Promise<void> => {
    invalidateCityCache(cityId);
    clearCacheKey(`pois_multi_`);

    const realId = (poi.id && !poi.id.startsWith('temp_'))
        ? poi.id
        : `poi_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const now = new Date().toISOString();
    const authorName = currentUser?.name || 'Sistema';

    // Validazione categoria contro il DB constraint
    const categoryLower = (poi.category || 'monument').toLowerCase().trim();
    const allowedCats: PoiCategory[] = ['monument', 'food', 'hotel', 'nature', 'discovery', 'leisure', 'shop'];
    const isPoiCategory = (cat: string): cat is PoiCategory => (allowedCats as string[]).includes(cat);

    const safeCategory: PoiCategory = isPoiCategory(categoryLower)
        ? categoryLower
        : 'discovery';

    /**
     * MAPPING ESPLICITO: PointOfInterest → PoiUpsertPayload
     *
     * Ogni campo è intenzionalmente mappato.
     * Non ci sono cast, non ci sono Partial, non ci sono optional artificiali.
     *
     * MEDIA: image_status (MediaStatus) è sincronizzato con l'enum nativo del DB.
     * Nessuna conversione booleana necessaria.
     */
    const payload: PoiUpsertPayload = {
        // Identità (obbligatori per upsert)
        id: realId,
        name: poi.name || 'Senza Nome',
        city_id: cityId,
        category: safeCategory,

        // Descrittivo
        sub_category: poi.subCategory ?? null,
        description: poi.description || '',
        address: poi.address ?? null,

        // Media — governance semantica (DB-Driven)
        image_url: poi.imageUrl || '',
        image_status: poi.image_status,
        image_credit: poi.imageCredit ?? null,
        image_license: poi.imageLicense ?? null,

        // Coordinate
        coords_lat: poi.coords?.lat ?? 0,
        coords_lng: poi.coords?.lng ?? 0,

        // Metriche
        rating: poi.rating ?? 0,
        votes: poi.votes ?? 0,
        status: poi.status || 'published',

        // Visita
        visit_duration: poi.visitDuration ?? null,
        price_level: poi.priceLevel ?? null,

        // Monetizzazione
        is_sponsored: poi.isSponsored ?? false,
        tier: poi.tier ?? null,
        showcase_expiry: poi.showcaseExpiry ?? null,

        // AI & Qualità
        ai_reliability: poi.aiReliability ?? null,
        tourism_interest: poi.tourismInterest ?? null,
        last_verified: poi.lastVerified ?? null,

        // JSON — mappatura esplicita e serializzabile (Hardened)
        opening_hours: serializeOpeningHours(poi.openingHours),
        affiliate: serializeAffiliateLinks(poi.affiliate),
        link_metadata: serializeLinkMetadataRecord(poi.linkMetadata),

        // Timestamps & Audit
        date_added: poi.dateAdded || now,
        created_at: poi.createdAt || now,
        created_by: poi.createdBy || authorName,
        updated_at: now,
        updated_by: authorName,
    };

    const { error } = await supabase.from('pois').upsert(payload);
    if (error) throw error;

    evaluateAndUpdateCityStatus(cityId).catch(err =>
        console.error(`Errore ricalcolo stato città ${cityId}:`, err)
    );
};

export const deleteSinglePoi = async (poiId: string): Promise<void> => {
    clearCacheKey(`city_details_`);
    clearCacheKey(`pois_multi_`);

    const { data: poiData } = await supabase.from('pois').select('city_id').eq('id', poiId).maybeSingle();
    const { error } = await supabase.from('pois').delete().eq('id', poiId);
    if (error) throw error;

    if (poiData?.city_id) {
        evaluateAndUpdateCityStatus(poiData.city_id).catch(err =>
            console.error(`Errore ricalcolo stato città ${poiData.city_id}:`, err)
        );
    }
};

export const votePoiAsync = async (poiId: string, increment: boolean): Promise<number> => {
    const { data: poi } = await supabase.from('pois').select('votes').eq('id', poiId).maybeSingle();
    const newVotes = Math.max(0, (poi?.votes || 0) + (increment ? 1 : -1));
    await supabase.from('pois').update({ votes: newVotes }).eq('id', poiId);
    return newVotes;
};
