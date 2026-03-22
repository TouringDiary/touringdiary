import { getAIPlannerResponse } from '../services/aiPlannerService';
import { usePartnerIntegrations } from './usePartnerIntegrations';
import { PartnerIntegrations } from '../types';

export const useAIPlanner = () => {
  const generateResponse = (
    userPrompt: string,
    city: string,
    integrations: PartnerIntegrations
  ): string => {
    return getAIPlannerResponse(
      userPrompt,
      city,
      integrations
    );
  };

  return {
    generateResponse
  };
};