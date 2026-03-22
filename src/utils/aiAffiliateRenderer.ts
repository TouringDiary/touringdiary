
import { PartnerIntegrations } from '../types';
import { getPartnerByAiIntent, buildAffiliateLink } from '../services/partnerIntegrationService';

/**
 * Renderizza un suggerimento di affiliazione in formato stringa a partire da un prompt utente.
 * Se viene trovato un partner valido, restituisce un testo formattato con etichetta e URL.
 *
 * @param userPrompt Il testo del prompt dell'utente.
 * @param integrations L'oggetto di configurazione `PartnerIntegrations`.
 * @param context Contesto opzionale per arricchire il link.
 * @returns Una stringa formattata o `null` se nessun suggerimento è generato.
 */
export const renderAffiliateSuggestionFromPrompt = (
  userPrompt: string,
  integrations: PartnerIntegrations,
  context?: {
    city?: string;
    checkin?: string;
    checkout?: string;
    query?: string, // Aggiunto per coerenza con buildAffiliateLink
  }
): string | null => {

  // 1. Trova il partner basandosi sull'intento del prompt
  const partner = getPartnerByAiIntent(userPrompt, integrations);

  if (!partner) {
    return null;
  }

  // 2. Costruisce il link per il partner trovato
  const url = buildAffiliateLink(partner, {
    query: context?.query || userPrompt, // Usa il prompt come query di fallback
    ...context,
  });

  if (!url) {
    return null;
  }

  return `Prenota su ${partner.label}: ${url}`;
};
