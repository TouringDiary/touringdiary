import type { SuggestionType } from './shared/primitives';

/** Optional payload read by NavigationContext.handleNavigateGlobal. */
export interface NavigationGlobalExtra {
  slug?: string;
  type?: SuggestionType;
  prefilledName?: string;
}
