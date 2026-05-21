import { supabase } from './supabaseClient';
import * as Domain from '../types/domain/index';
import { Json } from '../types/supabase';

/**
 * MARKETING & PRICING SERVICE
 * Centralizza tutte le operazioni e le transazioni relative al cluster commerciale:
 * - plans
 * - pricing_versions
 * - campaigns
 * - subscriptions
 * 
 * Segue rigorosamente i principi di:
 * - Database Reality First (nessun campo inventato o fittizio)
 * - Service Boundary Governance (UI isolata dal client DB)
 * - Type Governance reale (zero 'any' o cast cosmetici)
 */

export interface PricingVersionJoined {
    id: string;
    plan_id: string;
    duration_days: number;
    price: number;
    currency: string;
    ai_limits: Json | null;
    features: Json | null;
    campaign_id: string | null;
    valid_from: string;
    valid_until: string | null;
    created_at: string;
    is_active: boolean | null;
    plans: {
        name: string;
        type: string;
    } | null;
}

export interface SubscriptionJoined {
    id: string;
    status: string;
    start_date: string;
    end_date: string;
    price_paid: number;
    currency_paid: string;
    user_id: string | null;
    pricing_versions: {
        duration_days: number;
        ai_limits: Json | null;
        plans: {
            name: string;
            type: string;
        } | null;
    } | null;
}

/**
 * Helper centralizzato per estrarre in modo deterministico una relazione a riga singola.
 * Impedisce la dispersione di controlli euristici (Array.isArray) nella business logic.
 */
function extractRelationSingle<T>(relation: T | T[] | null | undefined): T | null {
    if (!relation) return null;
    return Array.isArray(relation) ? relation[0] : relation;
}

/**
 * Estrae flash e pro in modo deterministico da un campo Json senza cast manuali.
 * Type-safe strutturale nativo.
 */
export function getModelLimits(aiLimits: Json | null | undefined): { flash?: number; pro?: number } {
    if (!aiLimits || typeof aiLimits !== 'object' || Array.isArray(aiLimits)) {
        return {};
    }

    if (!('models' in aiLimits)) {
        return {};
    }

    const models = aiLimits.models;

    if (!models || typeof models !== 'object' || Array.isArray(models)) {
        return {};
    }

    return {
        flash: typeof models.flash === 'number' ? models.flash : undefined,
        pro: typeof models.pro === 'number' ? models.pro : undefined
    };
}

/**
 * Esegue un merge strutturale type-safe dei limiti AI preservando le chiavi sconosciute (forward compatibility).
 * Nessun cast as any, nessuna perdita di metadati o attributi futuri del JSON.
 */
export function mergeAiLimits(
    currentLimits: Json | null | undefined,
    flash: number,
    pro: number
): Json {
    const base = currentLimits && typeof currentLimits === 'object' && !Array.isArray(currentLimits)
        ? { ...currentLimits }
        : {};

    const currentModels = typeof base.models === 'object' && base.models !== null && !Array.isArray(base.models)
        ? { ...base.models }
        : {};

    return {
        ...base,
        models: {
            ...currentModels,
            flash,
            pro
        }
    };
}

/**
 * Carica tutte le versioni di pricing ordinando per data di inizio validità.
 */
export const getPricingVersionsWithPlans = async (): Promise<PricingVersionJoined[]> => {
    const { data, error } = await supabase
        .from('pricing_versions')
        .select(`
            *,
            plans:plan_id (
                name,
                type
            )
        `)
        .order('valid_from', { ascending: false, nullsFirst: true });

    if (error) {
        console.error('[MarketingService] getPricingVersions error:', error.message);
        throw error;
    }

    return (data || []).map(item => {
        const plan = extractRelationSingle(item.plans);
        return {
            id: item.id,
            plan_id: item.plan_id,
            duration_days: item.duration_days,
            price: item.price,
            currency: item.currency,
            ai_limits: item.ai_limits,
            features: item.features,
            campaign_id: item.campaign_id,
            valid_from: item.valid_from,
            valid_until: item.valid_until,
            created_at: item.created_at,
            is_active: item.is_active,
            plans: plan ? { name: plan.name, type: plan.type } : null
        };
    });
};

/**
 * Recupera tutte le campagne promozionali ordinate per data di creazione.
 */
export const getCampaigns = async (): Promise<Domain.Row<'campaigns'>[]> => {
    const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[MarketingService] getCampaigns error:', error.message);
        throw error;
    }

    return data || [];
};

/**
 * Crea una nuova campagna promozionale.
 * Autorità sul payload della campagna delegata esplicitamente senza normalizzazioni arbitrarie.
 */
export const createCampaign = async (name: string, description: string | null): Promise<Domain.Row<'campaigns'>> => {
    const { data, error } = await supabase
        .from('campaigns')
        .insert({
            name,
            description
        })
        .select()
        .single();

    if (error) {
        console.error('[MarketingService] createCampaign error:', error.message);
        throw error;
    }

    return data;
};

/**
 * Elimina definitivamente una campagna.
 */
export const deleteCampaign = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('[MarketingService] deleteCampaign error:', error.message);
        throw error;
    }
};

/**
 * Aggiorna la scadenza temporale di una versione di prezzo.
 */
export const updatePricingVersionExpiration = async (versionId: string, validUntil: string | null): Promise<void> => {
    const { error } = await supabase
        .from('pricing_versions')
        .update({ valid_until: validUntil })
        .eq('id', versionId);

    if (error) {
        console.error('[MarketingService] updatePricingVersionExpiration error:', error.message);
        throw error;
    }
};

/**
 * Inserisce una nuova versione di prezzo (bozza o attiva).
 */
export const createPricingVersion = async (payload: Domain.DbInsert<'pricing_versions'>): Promise<void> => {
    const { error } = await supabase
        .from('pricing_versions')
        .insert(payload);

    if (error) {
        console.error('[MarketingService] createPricingVersion error:', error.message);
        throw error;
    }
};

/**
 * Elimina una versione di pricing in bozza (non ancora attiva).
 */
export const deletePricingVersionDraft = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('pricing_versions')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('[MarketingService] deletePricingVersionDraft error:', error.message);
        throw error;
    }
};

/**
 * Chiude ed inattiva le versioni attive precedenti per un determinato piano e campagna.
 */
export const archivePreviousActivePricingVersions = async (planId: string, campaignId: string | null, validUntil: string): Promise<void> => {
    let query = supabase
        .from('pricing_versions')
        .update({ valid_until: validUntil })
        .eq('plan_id', planId)
        .is('valid_until', null);

    if (campaignId) {
        query = query.eq('campaign_id', campaignId);
    } else {
        query = query.is('campaign_id', null);
    }

    const { error } = await query;
    if (error) {
        console.error('[MarketingService] archivePreviousActivePricingVersions error:', error.message);
        throw error;
    }
};

/**
 * Attiva una specifica versione impostando valid_from e is_active.
 */
export const activatePricingVersion = async (id: string, validFrom: string): Promise<void> => {
    const { error } = await supabase
        .from('pricing_versions')
        .update({ valid_from: validFrom, is_active: true })
        .eq('id', id);

    if (error) {
        console.error('[MarketingService] activatePricingVersion error:', error.message);
        throw error;
    }
};

/**
 * Recupera l'elenco delle sottoscrizioni con join relazionale su pricing_versions e plans.
 */
export const getSubscriptionsWithPlans = async (): Promise<SubscriptionJoined[]> => {
    const { data, error } = await supabase
        .from('subscriptions')
        .select(`
            id,
            status,
            start_date,
            end_date,
            price_paid,
            currency_paid,
            user_id,
            pricing_versions:pricing_version_id (
                duration_days,
                ai_limits,
                plans:plan_id (
                    name,
                    type
                )
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[MarketingService] getSubscriptionsWithPlans error:', error.message);
        throw error;
    }

    return (data || []).map(sub => {
        const pv = extractRelationSingle(sub.pricing_versions);
        const plan = pv ? extractRelationSingle(pv.plans) : null;

        return {
            id: sub.id,
            status: sub.status,
            start_date: sub.start_date,
            end_date: sub.end_date,
            price_paid: sub.price_paid,
            currency_paid: sub.currency_paid,
            user_id: sub.user_id,
            pricing_versions: pv ? {
                duration_days: pv.duration_days,
                ai_limits: pv.ai_limits,
                plans: plan ? { name: plan.name, type: plan.type } : null
            } : null
        };
    });
};
