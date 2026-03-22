
import { PartnerIntegration, PartnerIntegrations, PartnerCapability } from '../types';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

// La logica di costruzione del link è ora una funzione helper esportata
export const buildAffiliateLink = (
  partner: PartnerIntegration,
  params: {
    query?: string;
    checkin?: string;
    checkout?: string;
  }
): string => {
  if (!partner.affiliate?.base_url || !partner.affiliate.tracking_id) {
    return '';
  }

  let url = new URL(partner.affiliate.base_url);

  // Parametri comuni
  url.searchParams.set(partner.affiliate.tracking_param, partner.affiliate.tracking_id);

  // Parametri specifici per partner
  switch (partner.id) {
    case 'booking':
      if (params.query) {
        url.searchParams.set('ss', params.query);
      }
      if (params.checkin) {
        url.searchParams.set('checkin', params.checkin);
      }
      if (params.checkout) {
        url.searchParams.set('checkout', params.checkout);
      }
      break;
    
    case 'getyourguide':
      if (params.query) {
        url.searchParams.set('q', params.query);
      }
      break;

    case 'amazon':
      if (params.query) {
        url.searchParams.set('k', params.query);
        url.searchParams.set('tag', partner.affiliate.tracking_id);
      }
      break;
  }

  return url.toString();
};


/**
 * Servizio per la gestione delle integrazioni con i partner.
 * Fornisce metodi per recuperare, manipolare e utilizzare le configurazioni
 * dei partner (es. Booking, GetYourGuide).
 */
export const partnerIntegrationService = (supabase: SupabaseClient<Database>) => ({
  /**
   * Recupera le configurazioni di integrazione dei partner.
   *
   * @returns Un oggetto `PartnerIntegrations` con le configurazioni.
   */
  getPartnerIntegrations: async (): Promise<PartnerIntegrations> => {
    const { data, error } = await supabase
      .from('global_settings')
      .select('settings->partner_integrations')
      .single();

    if (error) {
      console.error('Error fetching partner integrations:', error);
      return {};
    }

    return (data as any)?.partner_integrations || {};
  },

  // buildAffiliateLink è ora una funzione helper esterna
  buildAffiliateLink,
});

/**
 * Trova un partner specifico per ID dall'oggetto delle integrazioni.
 * @param integrations Oggetto contenente tutte le integrazioni partner.
 * @param id ID del partner da trovare (es. "booking").
 * @returns La configurazione del partner o `undefined`.
 */
export const getPartnerById = (
  integrations: PartnerIntegrations,
  id: string
): PartnerIntegration | undefined => {
  return Object.values(integrations).find(p => p.id === id && p.enabled);
};

/**
 * Trova il partner di integrazione più adatto in base a un prompt utente,
 * confrontando il testo con parole chiave definite nella configurazione del DB.
 *
 * @param userPrompt Il testo del prompt dell'utente.
 * @param integrations L'oggetto di configurazione `PartnerIntegrations`.
 * @returns La configurazione del partner trovato o `undefined`.
 */
export const getPartnerByAiIntent = (
  userPrompt: string,
  integrations: PartnerIntegrations
): PartnerIntegration | undefined => {
  if (!integrations || !userPrompt) {
    return undefined;
  }

  const lowerCasePrompt = userPrompt.toLowerCase();

  const enabledPartners = Object.values(integrations).filter(p => p.enabled);

  return enabledPartners.find(partner => {
    const triggers = partner.ai_hints?.prompt_trigger; // triggers è di tipo string[]

    if (!triggers || triggers.length === 0) {
      return false;
    }
    
    // Itera direttamente sull'array di keyword
    return triggers.some(keyword => lowerCasePrompt.includes(keyword.toLowerCase()));
  });
};

/**
 * Trova il primo partner abilitato che supporta una data capability.
 * @param integrations Oggetto contenente tutte le integrazioni partner.
 * @param capability La capability da cercare (es. "hotel").
 * @returns La configurazione del primo partner trovato o `undefined`.
 */
export const getPartnerByCapability = (
  integrations: PartnerIntegrations | null,
  capability: PartnerCapability
): PartnerIntegration | undefined => {
  if (!integrations) {
    return undefined;
  }

  const enabledPartners = Object.values(integrations).filter(p => p.enabled);

  return enabledPartners.find(partner => 
    partner.capabilities.includes(capability)
  );
};
