import { supabase } from './supabaseClient';

export type AffiliateSourceType = 'suitcase' | 'poi' | 'ai' | 'cta';
export type AffiliatePlatform = 'web' | 'ios' | 'android' | 'newsletter';

export interface TrackClickParams {
  partnerId: string;
  sourceType: AffiliateSourceType;
  category: string;
  platform?: AffiliatePlatform;
  poiId?: string;
  productId?: string;
  cityId?: string;
  searchQuery?: string;
  metadata?: Record<string, any>;
}

/**
 * Servizio centralizzato per il tracciamento dei click-out verso partner affiliati.
 * Sostituisce il vecchio tracking basato su LocalStorage.
 */
export const affiliateTrackingService = {
  /**
   * Registra un evento di click-out nella tabella affiliate_clicks su Supabase.
   */
  trackClickOut: async (params: TrackClickParams): Promise<boolean> => {
    try {
      const { 
        partnerId, 
        sourceType, 
        category, 
        platform = 'web', 
        poiId, 
        productId, 
        cityId, 
        searchQuery, 
        metadata = {} 
      } = params;

      // Validazione minima a livello applicativo (soft validation per scalabilità)
      const validSources: AffiliateSourceType[] = ['suitcase', 'poi', 'ai', 'cta'];
      const finalSource = validSources.includes(sourceType) ? sourceType : 'cta';

      const { error } = await supabase
        .from('affiliate_clicks')
        .insert({
          partner_id: partnerId,
          source_type: finalSource,
          platform: platform,
          category: category,
          poi_id: poiId,
          product_id: productId,
          city_id: cityId,
          search_query: searchQuery,
          metadata: metadata
        });

      if (error) {
        console.error('[AffiliateTracking] Error inserting click:', error.message);
        return false;
      }

      console.log(`[AffiliateTracking] Click registrato: ${partnerId} da ${finalSource}`);
      return true;
    } catch (err) {
      console.error('[AffiliateTracking] Unexpected error:', err);
      return false;
    }
  }
};
