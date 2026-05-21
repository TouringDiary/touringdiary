// ─── Central Suitcase System Hub (Delegated) ─────────────────────────────────
// This file maintains the public API by re-exporting from specialized modules.

export type { Suitcase, SuitcaseItem } from '@/types/suitcase';

export { 
  mergeTemplateItems, 
  useGlobalTemplates, 
  useCityTypeTemplates, 
  useUserTemplatePreferences 
} from './suitcase/useSuitcaseTemplates';

export { 
  seedAiSuggestions 
} from './suitcase/aiSuggestions';

export { 
  useAffiliateGear 
} from './suitcase/useAffiliateGear';

export { 
  useUserSuitcases 
} from './suitcase/useUserSuitcases';

export { 
  useSuitcaseItemsMutations 
} from './suitcase/useSuitcaseItemsMutations';

export { 
  useCreateSuitcase, 
  useCloneSuitcase, 
  deleteSuitcase 
} from './suitcase/useSuitcaseCrud';

export { 
  linkSuitcaseToTrip, 
  unlinkSuitcase 
} from './suitcase/useSuitcaseLinking';

// ─── Deprecated / Legacy Support ─────────────────────────────────────────────
import { useUserSuitcases } from './suitcase/useUserSuitcases';

/** @deprecated - Use useUserSuitcases directly */
export const useUserTemplates = (userId: string | undefined) => {
  const { suitcases, isLoading, fetchSuitcases } = useUserSuitcases(userId);
  return { templates: suitcases, isLoading, fetchTemplates: fetchSuitcases };
};
