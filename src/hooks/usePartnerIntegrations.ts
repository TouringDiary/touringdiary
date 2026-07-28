import { useMemo } from 'react'
import { useConfig } from '@/context/ConfigContext'
import type { PartnerIntegration, PartnerIntegrations } from '../types'

/** Stable empty map when partner_integrations is absent (avoids fresh `{}` each render). */
const EMPTY_PARTNER_MAP: Record<string, PartnerIntegration> = {}

export const usePartnerIntegrations = (): {
  integrations: PartnerIntegrations | null
  loading: boolean
} => {

  const { configs, isLoading } = useConfig()

  const integrations = useMemo<PartnerIntegrations>(() => {
    const partners =
      configs && configs.partner_integrations
        ? configs.partner_integrations
        : EMPTY_PARTNER_MAP
    return { partners }
  }, [configs.partner_integrations])

  return {
    integrations,
    loading: isLoading
  }

}
