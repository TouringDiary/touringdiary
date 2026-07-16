import { supabase } from '../supabaseClient';
import type { Sponsor, ResolvedSponsor, SponsorRequest } from '../../types/models/Sponsor';
import { mapResolvedSponsor, SPONSOR_CONTRACT_SELECT, SPONSOR_PUBLIC_VITRINE_SELECT, convertSponsorToPoi, normalizeJoinedSponsorRow } from './sponsorResolvers';
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
        .select(SPONSOR_PUBLIC_VITRINE_SELECT)
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

    return (data ?? []).map((row) => mapResolvedSponsor(normalizeJoinedSponsorRow(row)));
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

    return (data ?? []).map((row) => mapResolvedSponsor(normalizeJoinedSponsorRow(row)));
};

/**
 * @deprecated Mantenuta temporaneamente durante la migrazione DL-017 (Fase 2.3) esclusivamente
 * per intercettare eventuali consumer legacy. Qualsiasi chiamata indica un percorso non migrato.
 * Percorso corretto: {@link activateSponsorFromRequestAsync} in `sponsorActivationService.ts`.
 * Rimozione completa quando non esisteranno più riferimenti nel codebase (grep `createSponsorFromRequest`).
 */
export const createSponsorFromRequest = async (_requestData: SponsorRequest): Promise<Sponsor> => {
    throw new Error('createSponsorFromRequest è deprecata. Usare activateSponsorFromRequestAsync.');
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
