
import { supabase } from '../supabaseClient';

/**
 * Chiama la RPC per attivare lo sponsor, creare la risorsa UI e attivare la sottoscrizione.
 * @param {string} sponsorId - L'ID dello sponsor nella tabella 'sponsors'.
 * @param {string} requestId - L'ID della richiesta originale nella tabella 'sponsor_requests'.
 * @param {string} pricingVersionId - L'ID della versione di listino prezzi scelta.
 */
export const activateSponsorWithResourceAsync = async (
    sponsorId: string,
    requestId: string,
    pricingVersionId: string,
    ownerId?: string // NEW: Optional owner injection
) => {
    const { data, error } = await supabase.rpc('activate_sponsor_with_resource', {
        p_sponsor_id: sponsorId,
        p_request_id: requestId,
        p_pricing_version_id: pricingVersionId
    });

    if (error) {
        console.error('[SponsorService] Error calling activate_sponsor_with_resource:', error);
        throw new Error(`L'attivazione con risorsa è fallita: ${error.message}`);
    }
    return data;
};
