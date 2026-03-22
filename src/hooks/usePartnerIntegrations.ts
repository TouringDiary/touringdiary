import { useConfig } from '@/context/ConfigContext'
import { PartnerIntegrations } from '../types'

export const usePartnerIntegrations = (): {
  integrations: PartnerIntegrations | null
  loading: boolean
} => {

  const { configs, isLoading } = useConfig()
  console.log("PARTNER CONFIG:", configs?.partner_integrations);
  const partnerIntegrations =
    (configs?.partner_integrations as PartnerIntegrations) || null

  return {
    integrations: partnerIntegrations,
    loading: isLoading
  }

}