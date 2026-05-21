import { supabase } from '../supabaseClient';
import type { Sponsor, ResolvedSponsor, SponsorRequest } from '../../types/models/Sponsor';
import { mapResolvedSponsor, mapDbSponsorToApp, SPONSOR_CONTRACT_SELECT, convertSponsorToPoi } from './sponsorResolvers';
import { getTodayDateString } from './_internalTypes';
import { PointOfInterest } from '../../types';

/**
 * Recupera gli sponsor attivi, risolvendo automaticamente i dati UI
 * tramite una query JOIN verso le tabelle risorsa.
 */
export const fetchActiveSponsorsResolvedAsync = async (cityId?: string): Promise<ResolvedSponsor[]> => {
    const today = getTodayDateString();

    let query = supabase
        .from('sponsors')
        .select(SPONSOR_CONTRACT_SELECT)
        .eq('status', 'approved')
        .lte('start_date', today)
        .gte('end_date', today);

    if (cityId) {
        query = query.eq('city_id', cityId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('[SponsorService] Error fetching resolved sponsors:', error.message);
        return [];
    }

    return (data || []).map(mapResolvedSponsor);
};

/**
 * Recupera gli sponsor di una città mappandoli come PointOfInterest per la UI.
 */
export const fetchSponsorsByCityAsync = async (cityId: string): Promise<PointOfInterest[]> => {
    const resolved = await fetchActiveSponsorsResolvedAsync(cityId);
    return resolved.map(convertSponsorToPoi);
};

/**
 * Recupera gli sponsor di tipo guida di una città mappandoli come PointOfInterest.
 */
export const getActiveGuideSponsors = async (cityId: string): Promise<PointOfInterest[]> => {
    const sponsors = await fetchSponsorsByCityAsync(cityId);
    return sponsors.filter(s => s.resourceType === 'guide');
};

/**
 * Attiva o aggiorna l'abbonamento di uno sponsor per la sua vetrina (shop).
 */
export const startShopSubscription = async (sponsorId: string, tier: 'standard' | 'premium'): Promise<{ success: boolean; error?: any }> => {
    if (!sponsorId || !tier) {
        console.error("startShopSubscription: Sponsor ID and tier are required.");
        return { success: false, error: 'Sponsor ID and tier are required.' };
    }

    try {
        const startDate = new Date();
        const endDate = new Date();

        if (tier === 'standard') {
            endDate.setMonth(startDate.getMonth() + 6);
        } else if (tier === 'premium') {
            endDate.setFullYear(startDate.getFullYear() + 1);
        }

        const { error } = await supabase
            .from('sponsors')
            .update({
                status: 'approved',
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                updated_at: new Date().toISOString(),
            })
            .eq('id', sponsorId);

        if (error) {
            console.error('Error updating sponsor subscription in Supabase:', error.message);
            throw error;
        }

        return { success: true };
    } catch (error) {
        console.error('An unexpected error occurred in startShopSubscription:', error);
        return { success: false, error };
    }
};

/**
 * Recupera gli sponsor attivi di un proprietario (UUID).
 */
export const getSponsorsByOwner = async (ownerId: string): Promise<ResolvedSponsor[]> => {
    const { data, error } = await supabase
        .from('sponsors')
        .select(SPONSOR_CONTRACT_SELECT)
        .eq('owner_id', ownerId);

    if (error) {
        console.error('[SponsorService] Error fetching sponsors by owner:', error.message);
        return [];
    }

    return (data || []).map(mapResolvedSponsor);
};

/**
 * Crea un nuovo record 'sponsors' a partire da una 'sponsor_requests'.
 * Propaga obbligatoriamente l'identità UUID.
 */
export const createSponsorFromRequest = async (requestData: SponsorRequest): Promise<Sponsor> => {
    const sponsorPayload = {
        company_name: requestData.companyName,
        vat_number: requestData.vatNumber,
        email: requestData.email,
        address: requestData.address,
        city_id: requestData.cityId,
        pricing_version_id: requestData.pricingVersionId,
        status: 'approved',
        owner_id: requestData.ownerId,
        profile_id: requestData.profileId,
        type: requestData.type,
        request_id: requestData.id,
        amount: requestData.amount,
        start_date: requestData.startDate,
        end_date: requestData.endDate
    };

    const { data, error } = await supabase
        .from('sponsors')
        .insert(sponsorPayload)
        .select()
        .single();

    if (error) {
        console.error("Errore durante la creazione dello sponsor da richiesta:", error);
        throw new Error("Impossibile creare il record sponsor nel database.");
    }

    return mapDbSponsorToApp(data);
};

/**
 * Cancella uno sponsor attivo (terminazione contratto).
 */
export const cancelSponsor = async (id: string, reason?: string) => {
    const { data, error } = await supabase
        .from('sponsors')
        .update({
            status: 'cancelled',
            admin_notes: reason,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

    if (error) throw new Error(error.message);
    return data;
};
