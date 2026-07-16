
import { supabase } from '../supabaseClient';

/**
 * Attivazione atomica: crea contratto sponsor, risorsa UI, subscription e converte la richiesta.
 * Sostituisce il flusso split createSponsorFromRequest + activate_sponsor_with_resource (DL-017).
 */
export const activateSponsorFromRequestAsync = async (
    requestId: string,
    pricingVersionId: string,
    amount: number,
    invoiceNumber: string,
): Promise<string> => {
    const { data, error } = await supabase.rpc('activate_sponsor_from_request', {
        p_request_id: requestId,
        p_pricing_version_id: pricingVersionId,
        p_amount: amount,
        p_invoice_number: invoiceNumber,
    });

    if (error) {
        console.error('[SponsorService] Error calling activate_sponsor_from_request:', error);
        throw new Error(`L'attivazione sponsor è fallita: ${error.message}`);
    }

    if (!data) {
        throw new Error("L'attivazione sponsor non ha restituito l'ID del contratto.");
    }

    return data;
};

/**
 * @deprecated Percorso legacy rimosso dal client (DL-017). Usare activateSponsorFromRequestAsync.
 */
export const activateSponsorWithResourceAsync = async (
    _sponsorId: string,
    _requestId: string,
    _pricingVersionId: string,
    _ownerId?: string,
): Promise<never> => {
    throw new Error('activateSponsorWithResourceAsync è deprecata. Usare activateSponsorFromRequestAsync.');
};
