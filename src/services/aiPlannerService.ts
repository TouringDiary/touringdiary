import { renderAffiliateSuggestionFromPrompt } from '../utils/aiAffiliateRenderer';
import { PartnerIntegrations } from '../types';

// This is a placeholder for the actual AI planner service logic.
// The actual implementation would involve more complex logic 
// to generate AI responses based on user prompts.

export const getAIPlannerResponse = (
  userPrompt: string,
  city: string,
  integrations: PartnerIntegrations
): string => {
  // Placeholder for AI response generation
  let aiResponse = `Ecco un suggerimento per \"${userPrompt}\" a ${city}.`;

  const affiliateSuggestion = renderAffiliateSuggestionFromPrompt(
    userPrompt,
    integrations,
    { city }
  );

  if (affiliateSuggestion) {
    aiResponse = `${aiResponse}\n\n${affiliateSuggestion}`;
  }

  return aiResponse;
};
