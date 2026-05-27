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

export const getUserAiLimits = async (userId: string): Promise<ModelAwareLimits | null> => {
    const activeSub = await getActiveUserSubscription(userId);
    
    if (activeSub && activeSub.pricing_version && activeSub.pricing_version.ai_limits && Object.keys(activeSub.pricing_version.ai_limits).length > 0) {
        return activeSub.pricing_version.ai_limits as ModelAwareLimits;
    }

    return null; 
};
