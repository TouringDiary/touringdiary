import { supabase } from './supabaseClient';
import type { Database } from '../types/supabase';
import {
    fetchAdminUsersPaged,
    searchAdminUsersByEmail,
} from './ai/legacyExtraQuotaCompat';

export { type AdminProfileQuotaRow } from './ai/legacyExtraQuotaCompat';

export type AiUserCostCategory = 'guest' | 'free' | 'sponsor' | 'admin';
export type AiSeasonKey = 'winter' | 'spring' | 'summer' | 'autumn';

type AiGlobalUsageAnalyticsRow = Pick<
    Database['public']['Tables']['ai_global_usage']['Row'],
    'request_count' | 'model_type' | 'date' | 'user_id' | 'guest_id'
> & {
    /** Present only when PostgREST embed is included in the select (not in current query). */
    profiles?: { role?: string | null } | null;
};

function getAnalyticsLogUserRole(log: AiGlobalUsageAnalyticsRow): string | null | undefined {
    const profiles = log.profiles;
    if (!profiles || typeof profiles !== 'object') return undefined;
    return typeof profiles.role === 'string' ? profiles.role : null;
}

export interface AiModelPrice {
    model: string;
    cost_per_request: number;
}

export interface AiThirtyDayCosts {
    flash: number;
    pro: number;
    total: number;
    guest: number;
    free: number;
    sponsor: number;
    admin: number;
}

export interface AiEconomicsDashboardData {
    mrr: number;
    modelPrices: AiModelPrice[];
    costs: {
        today: Pick<AiThirtyDayCosts, 'flash' | 'pro' | 'guest' | 'free' | 'sponsor' | 'admin'>;
        sevenDays: { flash: number; pro: number; total: number };
        thirtyDays: AiThirtyDayCosts;
        thisMonth: number;
        lastMonth: number;
    };
    trends: {
        monthly: Record<string, number>;
        seasonal: Record<AiSeasonKey, number>;
    };
}

export interface AiAdminGlobalSetting {
    key: string;
    value: string;
}

export interface AiAdminPlanSummary {
    name?: string;
    type?: string;
}

export interface AiAdminPricingVersion {
    id: string;
    duration_days: number;
    price: number;
    currency: string;
    ai_limits?: {
        soft_daily_limit?: number;
        burst_allowed?: boolean;
        models?: { flash?: number; pro?: number };
    };
    plans?: AiAdminPlanSummary | AiAdminPlanSummary[];
}

export interface AiAdminData {
    modelPrices: AiModelPrice[];
    globalSettings: AiAdminGlobalSetting[];
    pricingVersions: AiAdminPricingVersion[];
}

export type PlanAiLimitFieldValue =
    | number
    | boolean
    | string
    | { flash?: number | string; pro?: number | string };

export interface AiAdminPricingVersionUpdate {
    duration_days?: number;
    price?: number;
    currency?: string;
    ai_limits?: AiAdminPricingVersion['ai_limits'];
    is_active?: boolean;
    valid_from?: string;
    activated_at?: string;
}

/**
 * Recupera tutti i dati necessari per l'AI Limits Control Center
 */
export const getAiAdminData = async (): Promise<AiAdminData> => {
    const { data: modelPrices } = await supabase
        .from('ai_model_prices')
        .select('*')
        .order('model');

    const { data: globalSettings } = await supabase
        .from('global_settings')
        .select('*');

    const { data: pricingVersions } = await supabase
        .from('pricing_versions')
        .select(`
            id,
            duration_days,
            price,
            currency,
            ai_limits,
            plans:plan_id (
                name,
                type
            )
        `)
        .is('campaign_id', null)
        .eq('is_active', true); // Utilizza il selettore runtime standard v16

    return {
        modelPrices: modelPrices || [],
        globalSettings: (globalSettings || []) as AiAdminGlobalSetting[],
        pricingVersions: (pricingVersions || []) as AiAdminPricingVersion[],
    };
};

/**
 * Aggiorna i costi dei modelli AI
 */
export const updateModelCosts = async (model: string, cost: number) => {
    const { error } = await supabase
        .from('ai_model_prices')
        .update({ cost_per_request: cost, updated_at: new Date().toISOString() })
        .eq('model', model);
    if (error) throw error;
};

/**
 * Aggiorna i budget anonimi in global_settings
 */
export const updateAnonBudgets = async (key: string, value: string) => {
    const { error } = await supabase
        .from('global_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) throw error;
};

/**
 * Aggiorna un campo specifico dell'oggetto ai_limits in pricing_versions
 */
export const updatePlanAiLimitField = async (versionId: string, field: string, value: PlanAiLimitFieldValue) => {
    // 1. Get current limits
    const { data } = await supabase
        .from('pricing_versions')
        .select('ai_limits')
        .eq('id', versionId)
        .single();
    
    const oldLimits = (data?.ai_limits as Record<string, any>) || {};
    
    // 2. Deep merge logic for specific fields
    const newLimits: Record<string, any> = { ...oldLimits };
    
    if (field === 'soft_daily_limit') {
        newLimits.soft_daily_limit = Number(value);
    } else if (field === 'burst_allowed') {
        newLimits.burst_allowed = !!value;
    } else if (field === 'models' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
        newLimits.models = {
            ...(oldLimits.models || {}),
            ...value,
        };
    }

    const { error } = await supabase
        .from('pricing_versions')
        .update({ ai_limits: newLimits })
        .eq('id', versionId);
    
    if (error) throw error;
};

/**
 * Cerca un utente per email per il pannello grant bonus wallet.
 */
export const searchAdminUserByEmail = async (email: string) => {
    return searchAdminUsersByEmail(email);
};

export interface GrantAdminWalletCreditsResult {
    success?: boolean;
    grant_id?: string;
    wallet_id?: string;
    user_id?: string;
    flash_credits?: number;
    pro_credits?: number;
    expires_at?: string;
}

/**
 * Assegna crediti bonus admin nel wallet runtime (user_ai_credits) via RPC SECURITY DEFINER.
 * Audit atomico su admin_credit_grants. source wallet = 'bonus' (bucket BONUS runtime).
 */
export const grantAdminWalletCredits = async (
    userId: string,
    flashCredits: number,
    proCredits: number = 0,
    expiresAt: string | null = null,
    reason: string = 'manual_admin_grant',
): Promise<GrantAdminWalletCreditsResult> => {
    const { data, error } = await supabase.rpc('grant_admin_ai_credits', {
        p_user_id: userId,
        p_flash_credits: flashCredits,
        p_pro_credits: proCredits,
        p_expires_at: expiresAt,
        p_reason: reason,
    });

    if (error) throw error;
    return (data ?? {}) as GrantAdminWalletCreditsResult;
};

/**
 * Toggle Emergency Stop Switch
 */
export const toggleEmergencyStop = async (enabled: boolean) => {
    const { error } = await supabase
        .from('global_settings')
        .upsert({ 
            key: 'ai_emergency_stop', 
            value: enabled ? 'true' : 'false',
            updated_at: new Date().toISOString() 
        });
    if (error) throw error;
};

/**
 * Recupera una lista di utenti con ordinamento e ricerca per la dashboard AI.
 */
export const getAdminUsersPaged = async (
    sortBy: 'registrationDate' | 'bonusTotal' | 'expiresSoon' = 'registrationDate',
    searchTerm: string = ''
) => {
    return fetchAdminUsersPaged(sortBy, searchTerm);
};

/**
 * Recupera statistiche di consumo aggregate per una lista di utenti in una data specifica
 */
export const getUsersUsageStats = async (userIds: string[], date: string) => {
    if (!userIds || userIds.length === 0) return {};

    const { data, error } = await supabase
        .from('ai_global_usage')
        .select('user_id, model_type, request_count')
        .in('user_id', userIds)
        .eq('date', date);
    
    if (error) throw error;

    const stats: Record<string, { flash: number; pro: number }> = {};
    
    (data || []).forEach(row => {
        const uid = row.user_id as string;
        if (!stats[uid]) stats[uid] = { flash: 0, pro: 0 };
        
        if (row.model_type === 'flash') stats[uid].flash += (row.request_count || 0);
        else if (row.model_type === 'pro') stats[uid].pro += (row.request_count || 0);
    });

    return stats;
};

/**
 * Recupera il totale del consumo globale per il calcolo dei budget
 */
export const getGlobalConsumptionToday = async (date: string) => {
    const { data, error } = await supabase
        .from('ai_global_usage')
        .select('model_type, request_count')
        .eq('date', date);
    
    if (error) throw error;

    const totals = { flash: 0, pro: 0 };
    (data || []).forEach(row => {
        if (row.model_type === 'flash') totals.flash += (row.request_count || 0);
        else if (row.model_type === 'pro') totals.pro += (row.request_count || 0);
    });

    return totals;
};

/**
 * Recupera i dati aggregati per la AI Economics Dashboard
 * Analizza lo storico completo per trend e simulazioni
 */
export const getEconomicsDashboardData = async (): Promise<AiEconomicsDashboardData> => {
    // 1. Prezzi Modelli
    const { data: prices } = await supabase.from('ai_model_prices').select('model, cost_per_request');
    const costMap: Record<string, number> = {};
    (prices || []).forEach(p => costMap[p.model] = p.cost_per_request || 0);

    // 2. Sottoscrizioni Attive (Ricavi)
    const { data: activeSubs } = await supabase
        .from('subscriptions')
        .select('price_paid')
        .eq('status', 'active');
    
    const currentMRR = (activeSubs || []).reduce((acc, s) => acc + (s.price_paid || 0), 0);

    // 3. Log di Consumo Completi + Profili per Classificazione
    // Nota: Usiamo una query che recupera i log e i dati necessari per il CASE
    const { data: rawLogs, error: logsError } = await supabase
        .from('ai_global_usage')
        .select(`
            request_count,
            model_type,
            date,
            user_id,
            guest_id
        `);

    if (logsError) throw logsError;

    // 4. Mappa degli utenti con sottoscrizione attiva per classificazione sponsor
    const activeSubUserIds = new Set((
        await supabase.from('subscriptions').select('user_id').eq('status', 'active')
    ).data?.map(s => s.user_id) || []);

    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Date per confronto mese
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

    const stats = {
        costs: {
            today: { flash: 0, pro: 0, guest: 0, free: 0, sponsor: 0, admin: 0 },
            sevenDays: { flash: 0, pro: 0, total: 0 },
            thirtyDays: { flash: 0, pro: 0, total: 0, guest: 0, free: 0, sponsor: 0, admin: 0 },
            thisMonth: 0,
            lastMonth: 0
        },
        trends: {
            monthly: {} as Record<string, number>,
            seasonal: { winter: 0, spring: 0, summer: 0, autumn: 0 }
        }
    };

    (rawLogs || []).forEach((rawLog) => {
        const log = rawLog as AiGlobalUsageAnalyticsRow;
        const cost = (log.request_count || 0) * (costMap[log.model_type] || 0);
        const date = log.date;
        const month = date.slice(0, 7); // YYYY-MM
        
        // Classificazione Utente (SSoT Logic - Ruoli da recuperare se necessario)
        let category: 'guest' | 'free' | 'sponsor' | 'admin' = 'free';
        if (!log.user_id) category = 'guest';
        else {
            const role = getAnalyticsLogUserRole(log);
            if (role === 'admin_all' || role === 'admin_limited') category = 'admin';
            else if (role === 'business' || activeSubUserIds.has(log.user_id)) category = 'sponsor';
            else category = 'free';
        }

        // 1. Costi Oggi
        if (date === today) {
            if (log.model_type === 'flash') stats.costs.today.flash += cost;
            if (log.model_type === 'pro') stats.costs.today.pro += cost;
            stats.costs.today[category] += cost;
        }

        // 2. Costi 7 giorni
        if (date >= sevenDaysAgo) {
            if (log.model_type === 'flash') stats.costs.sevenDays.flash += cost;
            if (log.model_type === 'pro') stats.costs.sevenDays.pro += cost;
            stats.costs.sevenDays.total += cost;
        }

        // 3. Costi 30 giorni
        if (date >= thirtyDaysAgo) {
            if (log.model_type === 'flash') stats.costs.thirtyDays.flash += cost;
            if (log.model_type === 'pro') stats.costs.thirtyDays.pro += cost;
            stats.costs.thirtyDays.total += cost;
            stats.costs.thirtyDays[category] += cost;
        }

        // 4. Confronto Mesi
        if (date >= firstDayThisMonth) stats.costs.thisMonth += cost;
        if (date >= firstDayLastMonth && date <= lastDayLastMonth) stats.costs.lastMonth += cost;

        // 5. Monthly Trend
        stats.trends.monthly[month] = (stats.trends.monthly[month] || 0) + cost;

        // 6. Seasonality (Aggregata per costo)
        const m = parseInt(date.split('-')[1]);
        if ([12, 1, 2].includes(m)) stats.trends.seasonal.winter += cost;
        else if ([3, 4, 5].includes(m)) stats.trends.seasonal.spring += cost;
        else if ([6, 7, 8].includes(m)) stats.trends.seasonal.summer += cost;
        else stats.trends.seasonal.autumn += cost;
    });

    return {
        costs: stats.costs,
        mrr: currentMRR,
        trends: stats.trends,
        modelPrices: (prices || []).map(p => ({
            model: p.model,
            cost_per_request: p.cost_per_request ?? 0,
        })),
    };
};
/**
 * Recupera i dati avanzati per la AI Economic Control Tower tramite RPC
 */
export const getControlTowerData = async () => {
    const { data, error } = await supabase.rpc('get_ai_control_tower_stats');
    
    if (error) {
        console.error('[AiAdminService] Error fetching Control Tower stats:', error.message);
        throw error;
    }

    return data;
};
/**
 * Recupera i dati economici avanzati v4 per la dashboard admin
 */
export const getAiEconomicsStatsV4 = async () => {
    const { data, error } = await supabase.rpc('get_ai_economics_stats_v4');
    if (error) throw error;
    return data;
};

/**
 * Recupera tutti i pacchetti crediti extra
 */
export const getCreditPackages = async () => {
    const { data, error } = await supabase
        .from('extra_credit_packages')
        .select('*')
        .order('sort_order', { ascending: true });
    if (error) throw error;
    return data;
};

export interface CreditPackage {
    id?: string;
    name: string;
    description: string;
    flash_credits: number;
    pro_credits: number;
    price_eur: number;
    stripe_price_id_test: string;
    stripe_price_id_prod: string;
    is_active: boolean;
    sort_order: number;
    is_recommended: boolean;
}

/**
 * Crea o aggiorna un pacchetto crediti
 */
export const upsertCreditPackage = async (pkg: CreditPackage) => {
    const { data, error } = await supabase
        .from('extra_credit_packages')
        .upsert({
            ...pkg,
            updated_at: new Date().toISOString()
        })
        .select()
        .single();
    if (error) throw error;
    return data;
};

/**
 * Gestione Versioning Pricing
 */
export const getPricingVersions = async () => {
    const { data, error } = await supabase
        .from('pricing_versions')
        .select('*, plans(name)')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
};

export const createPricingDraft = async (baseVersionId: string) => {
    // 1. Get base version
    const { data: base } = await supabase
        .from('pricing_versions')
        .select('*')
        .eq('id', baseVersionId)
        .single();
    
    if (!base) throw new Error("Base version not found");

    // 2. Insert as draft (is_active = false)
    const { data, error } = await supabase
        .from('pricing_versions')
        .insert({
            plan_id: base.plan_id,
            duration_days: base.duration_days,
            price: base.price,
            currency: base.currency,
            ai_limits: base.ai_limits,
            campaign_id: base.campaign_id,
            valid_from: new Date().toISOString(),
            is_active: false
        })
        .select()
        .single();
    
    if (error) throw error;
    return data;
};

/**
 * Attiva una versione di pricing in modo atomico (disattiva le altre dello stesso piano)
 */
export const activatePricingVersion = async (versionId: string) => {
    // 1. Recuperiamo il plan_id della versione da attivare
    const { data: target } = await supabase
        .from('pricing_versions')
        .select('plan_id')
        .eq('id', versionId)
        .single();
    
    if (!target) throw new Error("Versione non trovata");

    // 2. Disattiviamo tutte le versioni attive per quel piano
    const { error: deactivateError } = await supabase
        .from('pricing_versions')
        .update({ is_active: false })
        .eq('plan_id', target.plan_id)
        .eq('is_active', true);
    
    if (deactivateError) throw deactivateError;

    // 3. Attiviamo la versione desiderata
    const { error: activateError } = await supabase
        .from('pricing_versions')
        .update({ is_active: true, activated_at: new Date().toISOString() })
        .eq('id', versionId);
    
    if (activateError) throw activateError;

    return true;
};

/**
 * Alias per rollback (stessa logica di attivazione)
 */
export const rollbackPricingVersion = activatePricingVersion;

/**
 * Aggiorna i dati di una versione (tipicamente una bozza)
 */
export const updatePricingVersion = async (versionId: string, updates: AiAdminPricingVersionUpdate) => {
    const { data, error } = await supabase
        .from('pricing_versions')
        .update(updates)
        .eq('id', versionId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Recupera tutte le campagne esistenti (Tabella campaigns reale)
 */
export const getCampaigns = async () => {
    const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
};

/**
 * Crea una nuova campagna (Tabella campaigns reale)
 */
export const createCampaign = async (name: string, description?: string) => {
    const { data, error } = await supabase
        .from('campaigns')
        .insert({
            name: name.toUpperCase(),
            description: description || name,
            created_at: new Date().toISOString()
        })
        .select()
        .single();
    
    if (error) throw error;
    return data;
};



/**
 * Recupera la versione di pricing attiva (SSoT) tramite RPC v2
 */
export const getActivePricingVersion = async (planId: string, durationDays: number) => {
    const { data, error } = await supabase.rpc('get_active_pricing_version_v2', {
        p_plan_id: planId,
        p_duration_days: durationDays
    });
    if (error) throw error;
    return data;
};

/**
 * Recupera i global settings (per Stripe mode, etc)
 */
export const getGlobalSettings = async () => {
    const { data, error } = await supabase
        .from('global_settings')
        .select('*');
    if (error) throw error;
    
    const settings: Record<string, string> = {};
    (data || []).forEach(s => {
        if (s.key) settings[s.key] = String(s.value || '');
    });
    return settings;
};
