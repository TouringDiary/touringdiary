
import { usePartnerIntegrations } from './usePartnerIntegrations';
import { buildAffiliateLink, getPartnerById } from '../services/partnerIntegrationService';

/**
 * Hook per la gestione della logica di affiliazione.
 * Fornisce funzioni per generare link di affiliazione e ottenere dati sui partner.
 */
export const useAffiliate = () => {
  const { integrations, loading } = usePartnerIntegrations();

  /**
   * Genera un link di affiliazione per un partner specifico.
   *
   * @param partnerId L'ID del partner (es. "booking").
   * @param params Parametri per costruire il link (es. query).
   * @returns L'URL di affiliazione o una stringa vuota.
   */
  const getAffiliateLink = (
    partnerId: string,
    params: {
      query?: string;
      checkin?: string;
      checkout?: string;
    }
  ): string => {
    if (loading || !integrations) return '';

    const partner = getPartnerById(integrations, partnerId);
    if (!partner) return '';

    return buildAffiliateLink(partner, params);
  };

  return { getAffiliateLink, integrations, loading };
};
