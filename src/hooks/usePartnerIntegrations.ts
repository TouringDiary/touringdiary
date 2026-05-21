import { useConfig } from '@/context/ConfigContext'
import { PartnerIntegrations } from '../types'

export const usePartnerIntegrations = (): {
  integrations: PartnerIntegrations | null
  loading: boolean
} => {

  const { configs, isLoading } = useConfig()
  
  const partnerIntegrations = (configs && configs.partner_integrations) ? configs.partner_integrations : {};

  const wrapped: PartnerIntegrations = {
    partners: partnerIntegrations
  };

  return {
    integrations: wrapped,
    loading: isLoading
  }

}