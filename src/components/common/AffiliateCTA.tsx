import type React from 'react';
import { useMemo } from 'react';
import { usePartnerIntegrations } from '../../hooks/usePartnerIntegrations';
import { affiliateTrackingService } from '../../services/affiliateTrackingService';
import {
  buildAffiliateLink,
  getPartnerByCapability,
} from '../../services/partnerIntegrationService';
import type { PartnerCapability } from '../../types/partners';

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
  const { integrations } = usePartnerIntegrations();
  const partner = getPartnerByCapability(integrations, capability);

  const buttonStyle = useMemo((): React.CSSProperties | null => {
    if (!partner) return null;
    return {
      display: 'inline-block',
      padding: '10px 15px',
      backgroundColor: partner.display_options?.theme_color || '#007bff',
      color: 'white',
      textDecoration: 'none',
      borderRadius: '5px',
      fontWeight: 'bold',
      textAlign: 'center',
      cursor: 'pointer',
    };
  }, [partner]);

  if (!partner || !buttonStyle) {
    return null;
  }

  const affiliateLink = buildAffiliateLink(partner, {
    query: context?.query,
    checkin: context?.checkin,
    checkout: context?.checkout,
  });

  const handleTrackClick = () => {
    affiliateTrackingService.trackClickOut({
      partnerId: partner.id,
      sourceType: 'cta',
      category: capability,
      cityId: context?.city,
      searchQuery: context?.query,
    });
  };

  const ariaLabel = `Cerca su ${partner.label}`;

  return (
    <a
      href={affiliateLink}
      target="_blank"
      rel="noopener noreferrer"
      style={buttonStyle}
      onClick={handleTrackClick}
      aria-label={ariaLabel}
    >
      Cerca su {partner.label}
    </a>
  );
};

export default AffiliateCTA;
