// ─── Central Suitcase System Hub (Delegated) ─────────────────────────────────
// This file maintains the public API by re-exporting from specialized modules.

export type { Suitcase, SuitcaseItem } from '@/types/suitcase';
export type { AiCandidate, GetAiCandidatesOptions } from './suitcase/aiSuggestions';

export {
  buildUniformLimitMap,
  clampCategoryLimit,
  getAiCandidates,
  normalizeLimitPerCategory,
  seedAiSuggestions,
} from './suitcase/aiSuggestions';
export { useAffiliateGear } from './suitcase/useAffiliateGear';
export {
  deleteSuitcase,
  useCloneSuitcase,
} from './suitcase/useSuitcaseCrud';
export { useSuitcaseItemsMutations } from './suitcase/useSuitcaseItemsMutations';
export {
  linkSuitcaseToTrip,
  unlinkSuitcase,
} from './suitcase/useSuitcaseLinking';
export {
  mergeTemplateItems,
  useCityTypesTemplates,
  useCityTypeTemplates,
  useGlobalTemplates,
  useUserTemplatePreferences,
} from './suitcase/useSuitcaseTemplates';
export { useUserSuitcases } from './suitcase/useUserSuitcases';

// ─── Deprecated / Legacy Support ─────────────────────────────────────────────
import { useUserSuitcases } from './suitcase/useUserSuitcases';

/** @deprecated - Use useUserSuitcases directly */
export const useUserTemplates = (userId: string | undefined) => {
  const { suitcases, isLoading, fetchSuitcases } = useUserSuitcases(userId);
  return { templates: suitcases, isLoading, fetchTemplates: fetchSuitcases };
};
