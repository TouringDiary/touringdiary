import { supabase } from './supabaseClient';

export type AIModelType = 'flash' | 'pro';

export interface AIUsageResult {
    allowed: boolean;
    warning: boolean;
    reason?: string;
    source?: string;
}

export const getCurrentModelCosts = async () => {
    // Note: Do not implement recalculation logic yet, only support reading values.
    const { data, error } = await supabase
        .from('ai_model_prices')
        .select('*');

    if (error) {
        console.error('Failed to fetch model prices', error);
        return [];
    }
    return data;
};

// Helper per il logging universale dei consumi (Single Source of Truth)
// Migrato a RPC atomica increment_global_usage per coerenza v16
export const logUniversalUsage = async (userId: string | null, guestId: string | null, modelType: AIModelType) => {
    try {
        const { error } = await supabase.rpc('increment_global_usage', {
            p_user_id: userId,
            p_guest_id: guestId,
            p_model_type: modelType
        });

        if (error) {
            console.error("[AI LOG ERROR] Failed to increment global usage:", error);
        }
    } catch (err) {
        console.error("[AI LOG ERROR] Unexpected error during usage logging:", err);
    }
};

// Helper per ottenere l'utilizzo giornaliero aggregato
export const getDailyUsageCount = async (userId: string | null, guestId: string | null, date: string): Promise<number> => {
    const query = supabase.from('ai_global_usage').select('request_count');
    
    if (userId) query.eq('user_id', userId);
    else if (guestId) query.eq('guest_id', guestId);
    else return 0;

    const { data } = await query.eq('date', date);
    return (data || []).reduce((acc, curr) => acc + (curr.request_count || 0), 0);
};

// Helper per generare/ottenere ID ospite persistente nel browser
export const getGuestId = (): string => {
    const KEY = 'td_guest_uuid';
    let id = localStorage.getItem(KEY);
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(KEY, id);
    }
    return id;
};
/**
 * Nuova funzione centralizzata per il consumo crediti AI.
 * Invia la richiesta al database (RPC consume_ai_credits).
 */
export const incrementAiUsage = async (userId: string | null, modelType: AIModelType, feature: string = 'generic'): Promise<AIUsageResult> => {
    try {
        const guestId = userId ? null : getGuestId();
        const { data, error } = await supabase.rpc('consume_ai_credits', {
            p_user_id: userId,
            p_model_type: modelType,
            p_feature: feature,
            p_guest_id: guestId,
        });

        if (error) {
            console.error("[AI USAGE ERROR] RPC consume_ai_credits failed:", error);
            return { allowed: false, warning: false, reason: 'Internal database error' };
        }

        if (data?.allowed) {
            return { 
                allowed: true, 
                warning: false, 
                source: data.source,
                reason: data.reason
            };
        }

        return { 
            allowed: false, 
            warning: false, 
            reason: data?.reason || 'CREDITS_EXHAUSTED' 
        };

    } catch (err) {
        console.error("[AI USAGE ERROR] Unexpected error:", err);
        return { allowed: false, warning: false, reason: 'Unexpected error' };
    }
};

/**
 * Registra il consumo effettivo di token per analytics.
 */
export const logAiTokenUsage = async (
    userId: string | null,
    featureName: string,
    modelName: string,
    tokens: { prompt: number, completion: number, total: number },
    pricingVersionId?: string
) => {
    try {
        await supabase.rpc('log_ai_usage_tokens', {
            p_user_id: userId,
            p_feature_name: featureName,
            p_model_name: modelName,
            p_prompt_tokens: tokens.prompt,
            p_completion_tokens: tokens.completion,
            p_total_tokens: tokens.total,
            p_estimated_cost_eur: 0, // Calcolato poi lato admin o server
            p_pricing_version_id: pricingVersionId
        });
    } catch (err) {
        console.error("[AI LOG ERROR] Failed to log tokens:", err);
    }
};