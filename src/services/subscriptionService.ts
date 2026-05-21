import { supabase } from './supabaseClient';
import { AiLimitsConfig } from '../types';
import { SubscriptionData } from '../types/subscriptions';


export const getActiveUserSubscription = async (userId: string): Promise<SubscriptionData | null> => {
    if (!userId) return null;
    
    try {
        const { data, error } = await supabase
            .from('subscriptions')
            .select('*, pricing_version:pricing_versions(*)')
            .eq('user_id', userId)
            .eq('status', 'active')
            .order('end_date', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error('[SubscriptionService] getActiveUserSubscription Supabase Error:', error.message);
            return null;
        }
        return data as SubscriptionData | null;
    } catch (err) {
        console.error('[SubscriptionService] Error fetching user subscription:', err);
        return null;
    }
};

export const getActiveSponsorSubscription = async (sponsorId: string): Promise<SubscriptionData | null> => {
    if (!sponsorId) return null;

    try {
        const { data, error } = await supabase
            .from('subscriptions')
            .select('*, pricing_version:pricing_versions(*)')
            .eq('sponsor_id', sponsorId)
            .eq('status', 'active')
            .order('end_date', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
             console.error('[SubscriptionService] Error fetching sponsor subscription:', error.message);
             return null;
        }

        return data as SubscriptionData | null;
    } catch (err) {
        console.error('[SubscriptionService] Exception in getActiveSponsorSubscription:', err);
        return null;
    }
};

export interface ModelAwareLimits {
  models: {
    flash: number;
    pro: number;
  };
  soft_daily_limit: number;
  burst_allowed: boolean;
}

export interface UserTargetLimits {
  flashRemaining: number;
  proRemaining: number;
  softDailyLimit: number;
  burstAllowed: boolean;
}

export const getUserAiLimits = async (userId: string): Promise<ModelAwareLimits | null> => {
    const activeSub = await getActiveUserSubscription(userId);
    
    if (activeSub && activeSub.pricing_version && activeSub.pricing_version.ai_limits && Object.keys(activeSub.pricing_version.ai_limits).length > 0) {
        return activeSub.pricing_version.ai_limits as ModelAwareLimits;
    }

    return null; 
};

export const getUserModelLimits = async (userId: string): Promise<UserTargetLimits | null> => {
    const activeSub = await getActiveUserSubscription(userId);
    const limits = activeSub?.pricing_version?.ai_limits as ModelAwareLimits | null;
    
    if (!limits) return null;

    // Calcolo utilizzo reale tramite aggregazione log (Single Source of Truth)
    // Se non troviamo una data di inizio periodo, usiamo una data molto vecchia
    const startDate = activeSub?.current_period_start 
        ? new Date(activeSub.current_period_start).toISOString().split('T')[0]
        : '2000-01-01';

    const { data: usageLogs, error } = await supabase
        .from('ai_global_usage')
        .select('model_type, request_count')
        .eq('user_id', userId)
        .gte('date', startDate);
    
    if (error) {
        console.error('[SubscriptionService] Error fetching usage logs:', error);
        return null;
    }

    let flashUsed = 0;
    let proUsed = 0;

    (usageLogs || []).forEach(log => {
        if (log.model_type === 'flash') flashUsed += (log.request_count || 0);
        else if (log.model_type === 'pro') proUsed += (log.request_count || 0);
    });

    return {
        flashRemaining: Math.max(0, (limits.models?.flash || 0) - flashUsed),
        proRemaining: Math.max(0, (limits.models?.pro || 0) - proUsed),
        softDailyLimit: limits.soft_daily_limit || 0,
        burstAllowed: limits.burst_allowed || false
    };
};
