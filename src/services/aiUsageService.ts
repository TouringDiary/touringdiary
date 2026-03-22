import { supabase } from './supabaseClient';
import { MarketingConfig, AiLimitsConfig } from '../types';

/**
 * Recupera la configurazione completa dei limiti AI dal database.
 * @returns {Promise<AiLimitsConfig>} La configurazione dei limiti AI.
 */
export const getAiLimitsConfig = async (): Promise<AiLimitsConfig> => {
    const { data, error } = await supabase
        .from('global_settings')
        .select('settings')
        .eq('key', 'marketing_prices_v2')
        .single();

    if (error) {
        console.error('Errore nel recupero della configurazione AI:', error);
        throw new Error('Impossibile caricare la configurazione dei limiti AI.');
    }

    // La configurazione completa è in data.settings, ma a noi serve solo la sezione aiLimits.
    const marketingConfig = data.settings as MarketingConfig;
    if (!marketingConfig || !marketingConfig.aiLimits) {
        throw new Error('Formato della configurazione AI non valido.');
    }

    return marketingConfig.aiLimits;
};

/**
 * Aggiorna la configurazione dei limiti AI nel database.
 * @param {AiLimitsConfig} newAiLimits - Il nuovo oggetto di configurazione dei limiti.
 */
export const updateAiLimitsConfig = async (newAiLimits: AiLimitsConfig): Promise<void> => {
    // 1. Recupera l'intera configurazione marketing
    const { data: currentConfigData, error: fetchError } = await supabase
        .from('global_settings')
        .select('settings')
        .eq('key', 'marketing_prices_v2')
        .single();

    if (fetchError) {
        console.error('Errore nel recupero della configurazione marketing per aggiornamento:', fetchError);
        throw new Error('Impossibile recuperare la configurazione esistente per l\'aggiornamento.');
    }

    const marketingConfig = currentConfigData.settings as MarketingConfig;

    // 2. Aggiorna solo la parte relativa a aiLimits
    const updatedMarketingConfig: MarketingConfig = {
        ...marketingConfig,
        aiLimits: newAiLimits,
    };

    // 3. Salva l'intero oggetto marketingConfig aggiornato
    const { error: updateError } = await supabase
        .from('global_settings')
        .update({ settings: updatedMarketingConfig })
        .eq('key', 'marketing_prices_v2');

    if (updateError) {
        console.error('Errore nell\'aggiornamento della configurazione AI:', updateError);
        throw new Error('Impossibile salvare la nuova configurazione dei limiti AI.');
    }
};

export const incrementAiUsage = async (user: any) => {
  try {
    console.log("[AI USAGE] increment", user?.id);
    return true;
  } catch (err) {
    console.error("[AI USAGE ERROR]", err);
    return false;
  }
};
