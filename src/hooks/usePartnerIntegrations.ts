import { useMemo } from 'react';
import { useConfig } from '@/context/ConfigContext';
import type { PartnerIntegration, PartnerIntegrations } from '../types';

/** Stable empty map when partner_integrations is absent (avoids fresh `{}` each render). */
const EMPTY_PARTNER_MAP: Record<string, PartnerIntegration> = {};

/**
 * Partner integrations bag.
 * `loading` = Config not fully loaded yet (partner values may be null).
 * STEP S.2: must NOT be used as AppCoordinator fullscreen layout gate.
 */
export const usePartnerIntegrations = (): {
  integrations: PartnerIntegrations | null;
  loading: boolean;
} => {
  const { configs, isConfigFullyLoaded } = useConfig();

  const integrations = useMemo<PartnerIntegrations>(() => {
    const partners =
      configs && configs.partner_integrations
        ? configs.partner_integrations
        : EMPTY_PARTNER_MAP;
    return { partners };
  }, [configs.partner_integrations]);

  return {
    integrations,
    loading: !isConfigFullyLoaded,
  };
};
