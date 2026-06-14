import { supabase } from './supabaseClient';
import { PostgrestError } from '@supabase/supabase-js';
import { Json } from '../types/supabase';

export interface AffiliateClickRecord {
  id: string;
  partner_id: string;
  product_id: string | null;
  category: string;
  source_type: string;
  platform: string;
  city_id: string | null;
  poi_id: string | null;
  search_query: string | null;
  created_at: string;
  metadata: Json;
}

export interface AffiliateAnalyticsData {
  clicks: AffiliateClickRecord[];
  previousPeriodClicks: AffiliateClickRecord[];
}

export const affiliateAdminService = {
  /**
   * Recupera i click per un intervallo di date specifico, 
   * includendo anche il periodo precedente per il calcolo dei trend.
   */
  getAnalyticsData: async (startDate: Date, endDate: Date): Promise<{ data: AffiliateAnalyticsData | null; error: PostgrestError | null }> => {
    try {
      const durationMs = endDate.getTime() - startDate.getTime();
      const previousStartDate = new Date(startDate.getTime() - durationMs);
      const previousEndDate = new Date(startDate.getTime() - 1);

      // Query per il periodo corrente
      const { data: currentData, error: currentError } = await supabase
        .from('affiliate_clicks')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (currentError) return { data: null, error: currentError };

      // Query per il periodo precedente (per trend %)
      const { data: previousData, error: previousError } = await supabase
        .from('affiliate_clicks')
        .select('*')
        .gte('created_at', previousStartDate.toISOString())
        .lte('created_at', previousEndDate.toISOString());

      if (previousError) return { data: null, error: previousError };

      return {
        data: {
          clicks: currentData || [],
          previousPeriodClicks: previousData || []
        },
        error: null
      };
    } catch (err: unknown) {
      console.error('[AffiliateAdminService] Unexpected error:', err);
      return { 
        data: null, 
        error: null
      };
    }
  }
};
