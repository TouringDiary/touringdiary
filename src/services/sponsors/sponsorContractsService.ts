import { supabase } from '../supabaseClient';
import type { Sponsor, ResolvedSponsor, SponsorRequest } from '../../types/models/Sponsor';
import type { Json } from '../../types/database';
import { mapResolvedSponsor, SPONSOR_CONTRACT_SELECT, SPONSOR_PUBLIC_VITRINE_SELECT, convertSponsorToPoi, normalizeJoinedSponsorRow } from './sponsorResolvers';
import { getTodayDateString } from './_internalTypes';
import { PointOfInterest } from '../../types';

interface BulkExtendRpcResult {
    count: number;
    skipped: number;
}

const isJsonRecord = (value: Json): value is { [key: string]: Json | undefined } =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const parseBulkExtendRpcResult = (value: Json | null): BulkExtendRpcResult => {
    if (value === null || !isJsonRecord(value)) {
        return { count: 0, skipped: 0 };
    }
    return {
        count: typeof value.count === 'number' ? value.count : 0,
        skipped: typeof value.skipped === 'number' ? value.skipped : 0,
    };
};

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
        .gte('end_date', today)
        .not('city_id', 'is', null);

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
 * @deprecated Usare `sync_sponsor_profile_from_shop` via `shopService` (Fase 2.4 / O6).
 */
export const startShopSubscription = async (_sponsorId: string, _tier: 'standard' | 'premium'): Promise<{ success: boolean; error?: string }> => {
    throw new Error('startShopSubscription è deprecata. Usare sync_sponsor_profile_from_shop.');
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
 * Termina un contratto sponsor attivo (RPC gateway — admin_all only).
 */
export const cancelSponsor = async (id: string, reason: string) => {
    if (!reason?.trim()) {
        throw new Error('Motivazione obbligatoria per la terminazione contratto.');
    }

    const { data, error } = await supabase.rpc('cancel_sponsor_contract', {
        p_sponsor_id: id,
        p_reason: reason.trim(),
    });

    if (error) throw new Error(error.message);
    return data ? [data] : null;
};

/**
 * Estende la scadenza di un singolo contratto sponsor (RPC gateway — DL-023).
 */
export const updateSponsorExpiration = async (
    sponsorId: string,
    newEndDate: string,
    reason: string
): Promise<boolean> => {
    if (!reason?.trim()) {
        throw new Error('Motivazione obbligatoria per estensione contratto.');
    }

    const { error } = await supabase.rpc('extend_sponsor_contract', {
        p_sponsor_id: sponsorId,
        p_new_end_date: newEndDate,
        p_reason: reason.trim(),
    });

    if (error) throw new Error(error.message);
    return true;
};

/**
 * Estensione massiva su sponsor selezionati via checkbox (RPC gateway — DL-028).
 */
export const extendAllActiveSponsors = async (
    sponsorIds: string[],
    days: number,
    reason: string,
    excludeCritical: boolean = false
): Promise<{ count: number; skipped?: number }> => {
    if (!sponsorIds.length) {
        throw new Error('Seleziona almeno uno sponsor con le checkbox.');
    }
    if (!reason?.trim()) {
        throw new Error('Motivazione obbligatoria per estensione contratto.');
    }
    if (!days || days <= 0) {
        throw new Error('I giorni di estensione devono essere maggiori di zero.');
    }

    const { data, error } = await supabase.rpc('extend_sponsors_bulk', {
        p_sponsor_ids: sponsorIds,
        p_days: days,
        p_reason: reason.trim(),
        p_exclude_critical: excludeCritical,
    });

    if (error) throw new Error(error.message);

    return parseBulkExtendRpcResult(data);
};
