
import React from 'react';
import {
  buildAffiliateLink,
  getPartnerByCapability,
} from '../../services/partnerIntegrationService';
import { PartnerCapability } from '../../types/partners';
import { usePartnerIntegrations } from '../../hooks/usePartnerIntegrations';
import { affiliateTrackingService } from '../../services/affiliateTrackingService';

interface AffiliateCTAProps {
  capability: PartnerCapability;
  context?: {
    query?: string;
    city?: string;
    checkin?: string;
    checkout?: string;
  };
}

/**
 * Un componente CTA che genera un link di affiliazione per una data capability.
 * Cerca il primo partner abilitato per la capability e, se trovato,
 * mostra un bottone che punta al link di affiliazione costruito.
 * Se nessun partner è disponibile, il componente non renderizza nulla.
 */
const AffiliateCTA: React.FC<AffiliateCTAProps> = ({ capability, context }) => {
  const { integrations } = usePartnerIntegrations(); // Modificato per estrarre `integrations`
  const partner = getPartnerByCapability(integrations, capability);

  if (!partner) {
    return null;
  }

  const affiliateLink = buildAffiliateLink(partner, context);

  const handleTrackClick = () => {
    // Nuovo tracking centralizzato
    affiliateTrackingService.trackClickOut({
      partnerId: partner.id,
      sourceType: 'cta',
      category: capability,
      cityId: context?.city,
      searchQuery: context?.query
    });
  };

  const buttonStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '10px 15px',
    backgroundColor: partner.display_options.theme_color || '#007bff',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '5px',
    fontWeight: 'bold',
    textAlign: 'center',
    cursor: 'pointer',
  };

  return (
    <a
      href={affiliateLink}
      target="_blank"
      rel="noopener noreferrer"
      style={buttonStyle}
      onClick={handleTrackClick}
    >
      Cerca su {partner.label}
    </a>
  );
};

export default AffiliateCTA;
