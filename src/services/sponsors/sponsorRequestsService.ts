import { supabase } from '../supabaseClient';
import type { SponsorRequest, SponsorQueryOptions, PartnerLog } from '../../types/models/Sponsor';
import { mapDbSponsorRequestToApp, mapDbSponsorToRequestApp, SPONSOR_REQUEST_SELECT, SPONSOR_CONTRACT_SELECT, resolvePlanPoiCategory } from './sponsorResolvers';
import { PLAN_TYPES, PlanType } from '../../constants/planTypes';
import { SponsorSubmitFormData } from './_internalTypes';
import type { DatabaseJoinedSponsor, DatabaseJoinedSponsorRequest, Json } from '../../types/database';

/**
 * Recupera le richieste di sponsorizzazione con paginazione e filtri (Logica Multi-tabella).
 * Versione UUID-Native: Elimina lookup basati su email/VAT per la risoluzione dell'identità.
 */
export const getSponsorsPaginated = async (options: SponsorQueryOptions) => {
    const {
        page,
        pageSize,
        status,
        filters = {},
        sortConfig = { key: 'date', direction: 'desc' },
        searchTerm = ''
    } = options;

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Routing Status -> Tabella
    const isSponsorTable = ['approved', 'expired', 'cancelled'].includes(status);

    let query;
    if (isSponsorTable) {
        query = supabase.from('sponsors').select(SPONSOR_CONTRACT_SELECT, { count: 'exact' });
    } else {
        query = supabase.from('sponsor_requests').select(SPONSOR_REQUEST_SELECT, { count: 'exact' });
    }

    const today = new Date().toISOString().split('T')[0];

    if (status === 'approved') {
        query = query.eq('status', 'approved').gte('end_date', today);
    } else if (status === 'expired') {
        query = query.eq('status', 'approved').lt('end_date', today);
    } else {
        query = query.eq('status', status);
    }

    if (filters.cityId) query = query.eq('city_id', filters.cityId);

    if (filters.tier) {
        query = query.eq('pricing_versions.plans.type', filters.tier);
    }

    if (filters.continent) query = query.eq('cities.continent', filters.continent);
    if (filters.nation) query = query.eq('cities.nation', filters.nation);
    if (filters.adminRegion) query = query.eq('cities.admin_region', filters.adminRegion);
    if (filters.zone) query = query.eq('cities.zone', filters.zone);

    if (searchTerm) {
        if (!isSponsorTable) {
            query = query.or(`company_name.ilike.%${searchTerm}%,requester_name.ilike.%${searchTerm}%`);
        } else {
            query = query.or(`company_name.ilike.%${searchTerm}%`);
        }
    }

    const sortKey = sortConfig.key === 'date' ? 'created_at' : (sortConfig.key === 'endDate' ? 'end_date' : sortConfig.key);
    query = query.order(sortKey, { ascending: sortConfig.direction === 'asc' });

    const { data, error, count } = await query.range(from, to);

    if (error) throw new Error(error.message);
    const typedData = (data || []) as Record<string, unknown>[];
    const profileIds: string[] = [...new Set(
        typedData
            .map(r => r['profile_id'] || r['owner_id'])
            .filter((id): id is string => typeof id === 'string' && id.length > 0)
    )];

    let unreadMap: Record<string, number> = {};
    if (profileIds.length > 0) {
        const { data: unreadCounts } = await supabase
            .from('sponsor_messages')
            .select('partner_id')
            .in('partner_id', profileIds)
            .eq('direction', 'partner')
            .eq('is_read', false);

        if (unreadCounts) {
            unreadCounts.forEach(m => {
                unreadMap[m.partner_id] = (unreadMap[m.partner_id] || 0) + 1;
            });
        }
    }

    return {
        data: (data || []).map(dbRow => {
            // Cast sicuro al tipo join corretto in base al branch (sponsor vs request)
            const appObj = isSponsorTable
                ? mapDbSponsorToRequestApp(dbRow as DatabaseJoinedSponsor)
                : mapDbSponsorRequestToApp(dbRow as DatabaseJoinedSponsorRequest);

            const rawRow = dbRow as Record<string, unknown>;
            const resolvedId = rawRow['profile_id'] as string | null || rawRow['owner_id'] as string | null;

            if (resolvedId) {
                appObj.profileId = resolvedId;
                appObj.unreadCount = unreadMap[resolvedId] || 0;
                appObj.identityType = 'linked';
            } else {
                appObj.identityType = 'guest';
            }

            return appObj;
        }),
        count: count || 0,
    };
};

/**
 * Recupera una singola richiesta di sponsor per ID.
 */
export const getSponsorById = async (id: string): Promise<SponsorRequest | null> => {
    const { data, error } = await supabase
        .from('sponsor_requests')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching sponsor by ID:', error.message);
        return null;
    }
    return data ? mapDbSponsorRequestToApp(data as DatabaseJoinedSponsorRequest) : null;
};

/**
 * Aggiorna lo stato di una richiesta (approved, rejected, waiting_payment).
 */
export const updateSponsorStatus = async (id: string, status: 'approved' | 'rejected' | 'waiting_payment', rejectionReason?: string) => {
    const { data, error } = await supabase
        .from('sponsor_requests')
        .update({ status, rejection_reason: rejectionReason })
        .eq('id', id)
        .select();

    if (error) throw new Error(error.message);
    return data;
};

/**
 * Elimina una richiesta di sponsor.
 */
export const deleteSponsor = async (id: string) => {
    const { error } = await supabase.from('sponsor_requests').delete().eq('id', id);
    if (error) throw new Error(error.message);
};

/**
 * Crea un nuovo sponsor (logica admin, non richiesta pubblica).
 */
export const createSponsor = async (sponsorData: Partial<SponsorRequest>) => {
    const { data, error } = await supabase.from('sponsor_requests').insert([sponsorData]).select();
    if (error) throw new Error(error.message);
    return data;
};

/**
 * Aggiorna i dati di una richiesta di sponsor.
 */
export const updateSponsor = async (id: string, sponsorData: Partial<SponsorRequest>) => {
    const { data, error } = await supabase.from('sponsor_requests').update(sponsorData).eq('id', id).select();
    if (error) throw new Error(error.message);
    return data;
};

/**
 * Invia una richiesta di sponsorizzazione pubblica.
 * Forza il collegamento al profileId dell'utente loggato.
 */
export const submitSponsorRequest = async (
    formData: SponsorSubmitFormData,
    activeType: PlanType,
    selectedPlan: string,
    profileId?: string
): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('sponsor_requests')
            .insert({
                company_name: formData.companyName,
                vat_number: formData.vatNumber,
                requester_name: formData.contactName,
                requester_email: formData.adminEmail,
                requester_phone: formData.adminPhone,
                address: formData.address,
                city_id: formData.cityId,
                message: formData.description,
                description: formData.description,
                image_url: formData.imageUrl,
                coords_lat: formData.coords?.lat,
                coords_lng: formData.coords?.lng,
                profile_id: profileId === 'guest' ? null : profileId,
                owner_id: profileId === 'guest' ? null : profileId,
                ...(activeType === PLAN_TYPES.TOUR_GUIDE && {
                    languages: Array.isArray(formData.languages)
                        ? formData.languages.filter(
                            (lang): lang is string =>
                                typeof lang === 'string' && lang.trim().length > 0
                        )
                        : [],

                    specialties: Array.isArray(formData.specialties)
                        ? formData.specialties.filter(
                            (spec): spec is string =>
                                typeof spec === 'string' && spec.trim().length > 0
                        )
                        : []
                }),
                ...((activeType === PLAN_TYPES.TOUR_GUIDE || activeType === PLAN_TYPES.TOUR_OPERATOR) && {
                    license_number: formData.licenseNumber
                }),
                poi_category: resolvePlanPoiCategory(activeType),
                type: activeType,
                pricing_version_id: selectedPlan,
                status: 'pending',
            });

        if (error) {
            console.error('Error inserting sponsor request:', error.message);
            return false;
        }
        return true;
    } catch (err) {
        console.error('Unexpected error in submitSponsorRequest:', err);
        return false;
    }
};

/**
 * Rifiuta una richiesta di sponsorizzazione.
 */
export const rejectSponsor = async (id: string, reason: string, notes?: string) => {
    const { data, error } = await supabase
        .from('sponsor_requests')
        .update({
            status: 'rejected',
            rejection_reason: reason,
            admin_notes: notes,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

    if (error) throw new Error(error.message);
    return data;
};

/**
 * Recupera lo storico completo di un partner tramite il suo profileId (UUID-Only).
 * Elimina i lookup basati su email/VAT per l'aggregazione.
 */
export const getPartnerHistoryAsync = async (identity: {
    profileId: string;
}): Promise<SponsorRequest[]> => {
    const { profileId } = identity;

    if (!profileId) return [];

    // FETCH PARALLELO BASATO SOLO SU UUID
    const [reqResult, sponResult] = await Promise.all([
        supabase.from('sponsor_requests').select(SPONSOR_REQUEST_SELECT).eq('profile_id', profileId).order('created_at', { ascending: false }),
        supabase.from('sponsors').select(SPONSOR_CONTRACT_SELECT).eq('owner_id', profileId).order('created_at', { ascending: false })
    ]);

    if (reqResult.error) console.error('[SponsorService] Error fetching requests history:', reqResult.error.message);
    if (sponResult.error) console.error('[SponsorService] Error fetching sponsors history:', sponResult.error.message);

    const historyReq = (reqResult.data || []).map(r => mapDbSponsorRequestToApp(r as DatabaseJoinedSponsorRequest));
    const historySpon = (sponResult.data || []).map(r => mapDbSponsorToRequestApp(r as DatabaseJoinedSponsor));

    return [...historyReq, ...historySpon].sort((a, b) => {
        const dateA = new Date(a.date || 0).getTime();
        const dateB = new Date(b.date || 0).getTime();
        return dateB - dateA;
    });
};

/**
 * Recupera le richieste di sponsorizzazione associate a un profilo (UUID).
 */
export const getSponsorRequestsByProfile = async (profileId: string): Promise<SponsorRequest[]> => {
    const { data, error } = await supabase
        .from('sponsor_requests')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[SponsorService] Error fetching requests by profileId:', error.message);
        return [];
    }
    return (data || []).map(r => mapDbSponsorRequestToApp(r as DatabaseJoinedSponsorRequest));
};

/**
 * Aggiunge un log allo storico di un partner (Basato su ID per sicurezza).
 */
export const addPartnerLogAsync = async (requestId: string, log: PartnerLog) => {
    const { data: requests, error: fetchError } = await supabase
        .from('sponsor_requests')
        .select('id, partner_logs')
        .eq('id', requestId)
        .limit(1);

    if (fetchError || !requests || requests.length === 0) {
        throw new Error("Impossibile trovare la richiesta per aggiungere il log.");
    }

    const currentLogs = (requests[0].partner_logs as unknown as PartnerLog[]) || [];
    const updatedLogs = [...currentLogs, log];

    const { error: updateError } = await supabase
        .from('sponsor_requests')
        .update({ partner_logs: updatedLogs as unknown as Json })
        .eq('id', requestId);

    if (updateError) throw updateError;
    return true;
};

/**
 * Segna i log come letti per un partner (Basato su ID).
 */
export const markPartnerLogsAsRead = async (requestId: string) => {
    const { data: requests, error: fetchError } = await supabase
        .from('sponsor_requests')
        .select('id, partner_logs')
        .eq('id', requestId)
        .limit(1);

    if (fetchError || !requests || requests.length === 0) return;

    const currentLogs = (requests[0].partner_logs as unknown as PartnerLog[]) || [];
    const updatedLogs = currentLogs.map(l => ({ ...l, isUnread: false }));

    await supabase
        .from('sponsor_requests')
        .update({ partner_logs: updatedLogs as unknown as Json })
        .eq('id', requestId);
};

/**
 * Aggiorna le note amministrative interne di una richiesta o di un contratto attivo.
 */
export const updateSponsorInternalNotes = async (id: string, notes: string, isContract: boolean = false) => {
    const tableName = isContract ? 'sponsors' : 'sponsor_requests';

    const { error } = await supabase
        .from(tableName)
        .update({
            admin_notes: notes,
            admin_notes_last_updated: new Date().toISOString()
        })
        .eq('id', id);

    if (error) {
        console.error(`[SponsorService] Error updating notes on ${tableName}:`, error.message);
        throw new Error(error.message);
    }
    return true;
};
