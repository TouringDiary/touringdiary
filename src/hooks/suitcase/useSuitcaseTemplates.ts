import { useState, useCallback, useEffect } from 'react';
import { 
  fetchGlobalTemplatesAsync, 
  fetchCityTypeTemplatesAsync,
  fetchCityTypesTemplatesAsync,
  fetchUserTemplatePreferencesAsync, 
  upsertUserTemplatePreferenceAsync 
} from '@/services/suitcaseService';
import { Suitcase, SuitcaseItem } from '@/types/suitcase';
import { normalizeItemName } from '@/utils/tagDerivation';
import { randomUUID } from '@/utils/runtimeId';

/**
 * Merges multiple templates by flattening items, deduplicating by normalized name,
 * and grouping by category.
 */
export const mergeTemplateItems = (templates: Suitcase[]): SuitcaseItem[] => {
  const allItems: SuitcaseItem[] = [];
  templates.forEach(tpl => {
    if (tpl.suitcase_items) allItems.push(...tpl.suitcase_items);
  });

  const seen = new Set<string>();
  const merged: SuitcaseItem[] = [];

  allItems.forEach(item => {
    const key = normalizeItemName(item.name);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push({
        ...item,
        id: randomUUID(), // Temp ID for UI usage
        is_checked: false,
        is_ai_suggestion: false
      });
    }
  });

  return merged;
};

export const useGlobalTemplates = () => {
  const [globalTemplates, setGlobalTemplates] = useState<Suitcase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchGlobalTemplates = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await fetchGlobalTemplatesAsync();
      setGlobalTemplates(data);
    } catch (error) {
      console.error('Errore fetchGlobalTemplates:', error);
      setFetchError(error instanceof Error ? error.message : 'fetch_failed');
      setGlobalTemplates([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGlobalTemplates();
  }, [fetchGlobalTemplates]);

  return { globalTemplates, fetchGlobalTemplates, isLoading, fetchError };
};

export const useCityTypeTemplates = (cityType: string | null) => {
  const [suggestedTemplateIds, setSuggestedTemplateIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    if (!cityType) {
      setSuggestedTemplateIds([]);
      return;
    }
    setIsLoading(true);
    try {
      const ids = await fetchCityTypeTemplatesAsync(cityType);
      setSuggestedTemplateIds(ids);
    } catch (e) {
      console.error('Error fetching city templates', e);
    } finally {
      setIsLoading(false);
    }
  }, [cityType]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  return { suggestedTemplateIds, isLoading, refetch: fetchSuggestions };
};

export const useCityTypesTemplates = (cityTypes: string[]) => {
  const [suggestedTemplateIds, setSuggestedTemplateIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const cityTypesKey = cityTypes.join('|');

  const fetchSuggestions = useCallback(async () => {
    if (cityTypes.length === 0) {
      setSuggestedTemplateIds([]);
      return;
    }
    setIsLoading(true);
    try {
      const ids = await fetchCityTypesTemplatesAsync(cityTypes);
      setSuggestedTemplateIds(ids);
    } catch (e) {
      console.error('Error fetching city templates', e);
      setSuggestedTemplateIds([]);
    } finally {
      setIsLoading(false);
    }
  }, [cityTypesKey, cityTypes]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  return { suggestedTemplateIds, isLoading, refetch: fetchSuggestions };
};

export const useUserTemplatePreferences = (userId: string | undefined) => {
  const [preferences, setPreferences] = useState<Record<string, { enabled: boolean; priority: number }>>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchPreferences = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const data = await fetchUserTemplatePreferencesAsync(userId);
      const prefs: Record<string, { enabled: boolean; priority: number }> = {};
      data?.forEach(p => {
        prefs[p.template_id] = { enabled: p.enabled, priority: p.priority };
      });
      setPreferences(prefs);
    } catch (e) {
      console.error('Error fetching user template preferences', e);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const togglePreference = async (suitcaseId: string, enabled: boolean) => {
    if (!userId) return;
    try {
      await upsertUserTemplatePreferenceAsync(userId, suitcaseId, enabled);
      await fetchPreferences();
    } catch (e) {
      console.error('Error toggling template preference', e);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return { preferences, isLoading, togglePreference, refetch: fetchPreferences };
};
