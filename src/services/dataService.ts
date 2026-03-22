
// AGGREGATORE SERVIZI DATI
// Questo file ora re-esporta le funzionalità dai servizi specializzati
// per mantenere la compatibilità con i componenti esistenti.

export * from './contentService';
export * from './mediaService';
export * from './communityService';

import { supabase } from './supabaseClient'; // Percorso da verificare

// Definisce la struttura dell'oggetto che la funzione restituirà per ogni versione di prezzo
export interface FormattedPricingVersion {
  pricing_version_id: string;
  plan_name: string;
  plan_type: string; // AGGIUNTO: Tipo di piano (es. 'business', 'user')
  duration_days: number;
  price: number;
  currency: string;
}

/**
 * Recupera tutte le versioni di prezzo standard attive e le formatta per l'uso nel frontend.
 * Filtra le versioni in base a 'valid_until' e 'campaign_id' per ottenere solo i prezzi standard non scaduti.
 * 
 * @returns Un array di oggetti FormattedPricingVersion.
 */
export const getPricingVersions = async (): Promise<FormattedPricingVersion[]> => {
  const { data, error } = await supabase
    .from('pricing_versions')
    .select(`
      id,
      duration_days,
      price,
      currency,
      plans:plans!plan_id (
        name,
        type
      )
    `) // MODIFICATO: Join esplicito con alias
    .is('valid_until', null)
    .is('campaign_id', null);

  if (error) {
    console.error('Errore durante il recupero delle versioni di prezzo:', error);
    throw new Error('Impossibile caricare i dati dei piani di sponsorizzazione.');
  }

  if (!data) {
    return [];
  }

  // Appiattisce la struttura dati per renderla più facile da usare nei componenti React.
  const formattedData = data
    .filter(item => item.plans) // Assicura che l'oggetto 'plans' non sia nullo
    .map(item => {
        // Estende l'assertion per includere il nuovo campo \`type\`
        const plan_details = Array.isArray(item.plans) ? item.plans[0] : item.plans;
        return {
            pricing_version_id: item.id,
            plan_name: plan_details.name,
            plan_type: plan_details.type, // AGGIUNTO: mappatura del nuovo campo
            duration_days: item.duration_days,
            price: item.price,
            currency: item.currency,
        }
    });

  return formattedData;
};
