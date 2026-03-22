
import React from 'react';
import {
  buildAffiliateLink,
  getPartnerByCapability,
  PartnerCapability,
} from '../../services/partnerIntegrationService';
import { usePartnerIntegrations } from '../../hooks/usePartnerIntegrations';

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
 * Registra un evento di click affiliato.
 * In futuro questo potrà essere collegato a Google Analytics o altro sistema.
 * @param eventName Il nome dell'evento da tracciare.
 */
function trackAffiliateClick(eventName: string) {
  console.log("Affiliate click:", eventName);
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
    if (partner.tracking?.analytics_event_name) {
      trackAffiliateClick(partner.tracking.analytics_event_name);
    }
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
