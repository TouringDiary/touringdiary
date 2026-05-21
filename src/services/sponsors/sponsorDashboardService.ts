import { supabase } from '../supabaseClient';
import type { SponsorRequest } from '../../types/models/Sponsor';
import { mapDbSponsorRequestToApp, mapDbSponsorToRequestApp, SPONSOR_REQUEST_SELECT, SPONSOR_CONTRACT_SELECT } from './sponsorResolvers';

/**
 * Recupera tutte le richieste di sponsorizzazione da sponsor_requests (specifico per la dashboard).
 */
export const getAllSponsorsForDashboard = async (): Promise<SponsorRequest[]> => {
    const { data, error } = await supabase
        .from('sponsor_requests')
        .select(SPONSOR_REQUEST_SELECT)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[SponsorService] Error fetching all sponsors for dashboard:', error.message);
        return [];
    }

    return (data || []).map(r => mapDbSponsorRequestToApp(r as import('../../types/database').DatabaseJoinedSponsorRequest));
};

/**
 * Recupera TUTTI i dati aggregati da entrambe le tabelle (richieste e contratti attivi)
 * per popolare la Dashboard globale.
 */
export const getSponsorsDashboardAsync = async (): Promise<SponsorRequest[]> => {
    try {
        const [reqResult, sponResult] = await Promise.all([
            supabase.from('sponsor_requests').select(SPONSOR_REQUEST_SELECT),
            supabase.from('sponsors').select(SPONSOR_CONTRACT_SELECT)
        ]);

        if (reqResult.error) console.error("[SponsorDashboard] Requests fetch error:", reqResult.error.message);
        if (sponResult.error) console.error("[SponsorDashboard] Sponsors fetch error:", sponResult.error.message);

        const requests = (reqResult.data || []).map(r => mapDbSponsorRequestToApp(r as import('../../types/database').DatabaseJoinedSponsorRequest));
        const sponsors = (sponResult.data || []).map(mapDbSponsorToRequestApp);

        return [...requests, ...sponsors];
    } catch (e) {
        console.error("[SponsorDashboard] Unexpected error:", e);
        return [];
    }
};
