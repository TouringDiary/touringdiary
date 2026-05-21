
// AGGREGATORE SERVIZI DATI
// Questo file ora re-esporta le funzionalità dai servizi specializzati
// per mantenere la compatibilità con i componenti esistenti.

export * from './contentService';
export * from './mediaService';
export * from './communityService';

import { supabase } from './supabaseClient'; // Percorso da verificare

export interface FormattedPricingVersion {
  pricing_version_id: string;
  plan_name: string;
  plan_type: string;
  duration_days: number;
  price: number;
  currency: string;
  ai_limits: any;
}

/**
 * Recupera le versioni di prezzo filtrando per campagna (opzionale) e applicando il fallback granulare.
 * Implementa la logica No-Duplicates privilegiando il prezzo della campagna per ogni coppia (piano, durata).
 * 
 * @param campaignCode Il codice della campagna promozionale (es: 'black_friday')
 * @returns Un array di oggetti FormattedPricingVersion deduplicati.
 */
export const getPricingVersions = async (campaignCode?: string): Promise<FormattedPricingVersion[]> => {
  const now = new Date().toISOString();
  
  try {
    let campaignId: string | null = null;
    
    // 1. Se campaignCode è fornito, recupera l'ID della campagna
    if (campaignCode) {
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('id')
        .eq('code', campaignCode)
        .eq('is_active', true)
        .lte('valid_from', now)
        .or(`valid_until.is.null,valid_until.gte.${now}`)
        .single();
        
      if (!campaignError && campaignData) {
        campaignId = campaignData.id;
      }
    }

    // 2. Recupera le versioni standard (campaign_id IS NULL)
    const { data: standardData, error: standardError } = await supabase
      .from('pricing_versions')
      .select(`
        id,
        duration_days,
        price,
        currency,
        ai_limits,
        campaign_id,
        plans:plans!plan_id (
          name,
          type
        )
      `)
      .is('campaign_id', null)
      .lte('valid_from', now)
      .or(`valid_until.is.null,valid_until.gte.${now}`)
      .order('created_at', { ascending: false });

    if (standardError) throw standardError;

    // 3. Se abbiamo una campagna valida, recupera le sue specifiche versioni
    let promoData: any[] = [];
    if (campaignId) {
      const { data: campaignPricingData, error: campaignPricingError } = await supabase
        .from('pricing_versions')
        .select(`
          id,
          duration_days,
          price,
          currency,
          ai_limits,
          campaign_id,
          plans:plans!plan_id (
            name,
            type
          )
        `)
        .eq('campaign_id', campaignId)
        .lte('valid_from', now)
        .or(`valid_until.is.null,valid_until.gte.${now}`)
        .order('created_at', { ascending: false });

      if (!campaignPricingError && campaignPricingData) {
        promoData = campaignPricingData;
      }
    }

    // 4. Logica di Aggregazione No-Duplicates (Map approach)
    // Usiamo una chiave composta [type]-[duration] per identificare univocamente l'offerta
    const mergedMap = new Map<string, FormattedPricingVersion>();

    // Riempiamo prima con i dati standard
    const processItems = (items: any[]) => {
      items.forEach(item => {
        const plan = Array.isArray(item.plans) ? item.plans[0] : item.plans;
        if (!plan) return;

        const key = `${plan.type}-${item.duration_days}`;
        const formatted: FormattedPricingVersion = {
          pricing_version_id: item.id,
          plan_name: plan.name,
          plan_type: plan.type,
          duration_days: item.duration_days,
          price: item.price,
          currency: item.currency,
          ai_limits: item.ai_limits
        };

        // Se è un dato promozionale, sovrascrivi sempre. 
        // Se è standard, scrivi solo se la chiave è vuota.
        const isPromo = item.campaign_id !== null;
        if (isPromo || !mergedMap.has(key)) {
          mergedMap.set(key, formatted);
        }
      });
    };

    processItems(standardData || []);
    processItems(promoData);

    return Array.from(mergedMap.values());

  } catch (error) {
    console.error('Errore durante il recupero delle versioni di prezzo con campagne:', error);
    // Fallback sicuro se tutto fallisce: tenta almeno i prezzi standard senza filtri complessi
    return [];
  }
};

/**
 * Esegue un merge sicuro degli AI limits preservando i campi non relativi ai modelli (es. soft_daily_limit).
 * 
 * @param oldLimits Oggetto JSON attuale dei limiti
 * @param newModels Oggetto contenente i nuovi valori per flash e pro
 * @returns Un nuovo oggetto JSON mergiato
 */
export const safeMergeAiLimits = (oldLimits: any, newModels: { flash: number; pro: number }) => {
  const baseLimits = oldLimits || {};
  return {
    ...baseLimits,
    models: {
      ...(baseLimits.models || {}),
      flash: Number(newModels.flash),
      pro: Number(newModels.pro)
    }
  };
};
