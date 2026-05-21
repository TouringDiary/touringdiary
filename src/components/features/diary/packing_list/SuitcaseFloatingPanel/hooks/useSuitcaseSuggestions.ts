import { useState, useEffect } from 'react';
import { Suitcase, SuitcaseItem } from '@/types/suitcase';
import { seedAiSuggestions, mergeTemplateItems } from '@/hooks/useSuitcaseSystem';
import { deriveItineraryTags } from '@/utils/tagDerivation';

interface SuggestionsProps {
  linkedSuitcaseIds: string[];
  suggestedTemplateIds: string[];
  globalTemplates: any[];
  activeSuitcase: Suitcase | undefined;
  itinerary: any;
  fetchUserSuitcases: () => void;
  setSaveStatus: (s: string | null) => void;
}

interface SuggestionsProps {
  linkedSuitcaseIds: string[] | null;
  suggestedTemplateIds: string[] | null;
  globalTemplates: any[] | null;
  activeSuitcase: Suitcase | undefined | null;
  itinerary: any;
  fetchUserSuitcases: () => void;
  setSaveStatus: (s: string | null) => void;
}

export const useSuitcaseSuggestions = ({
  linkedSuitcaseIds,
  suggestedTemplateIds,
  globalTemplates,
  activeSuitcase,
  itinerary,
  fetchUserSuitcases,
  setSaveStatus
}: SuggestionsProps) => {
  const [mergedSuggestedItems, setMergedSuggestedItems] = useState<SuitcaseItem[]>([]);
  const [suggestedTemplates, setSuggestedTemplates] = useState<any[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [isSeedingAi, setIsSeedingAi] = useState(false);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  useEffect(() => {
    // Guardia di readiness: se i dati non sono ancora arrivati o sono null, resettiamo
    if (!linkedSuitcaseIds || !suggestedTemplateIds || !globalTemplates) {
      setMergedSuggestedItems([]);
      setSuggestedTemplates([]);
      return;
    }

    // Se non ci sono valigie collegate e abbiamo template suggeriti, mostriamoli
    if (linkedSuitcaseIds.length === 0 && suggestedTemplateIds.length > 0 && globalTemplates.length > 0) {
      const suggested = globalTemplates.filter(t => suggestedTemplateIds.includes(t.id));
      if (suggested.length > 0) {
        setSuggestedTemplates(suggested);
        const merged = mergeTemplateItems(suggested);
        setMergedSuggestedItems(merged);
      }
    } else {
      setMergedSuggestedItems([]);
      setSuggestedTemplates([]);
    }
  }, [linkedSuitcaseIds, suggestedTemplateIds, globalTemplates]);

  const handleSeedAi = async () => {
    if (!activeSuitcase || !itinerary) return;
    setIsSeedingAi(true);
    try {
      const tags = deriveItineraryTags(itinerary?.items || []);
      const context = `Viaggio: ${itinerary.title} | Tags: ${tags.join(', ')}`;
      
      const itemsForAi = (activeSuitcase.suitcase_items || []).map(i => ({
        name: i.name,
        is_ai_suggestion: !!i.is_ai_suggestion
      }));

      const count = await seedAiSuggestions(activeSuitcase.id, tags, itemsForAi, context);
      if (count > 0) {
        await fetchUserSuitcases();
        setSaveStatus(`Aggiunti ${count} suggerimenti`);
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } finally {
      setIsSeedingAi(false);
    }
  };

  return {
    mergedSuggestedItems,
    suggestedTemplates,
    isMerging,
    setIsMerging,
    isSeedingAi,
    isLoadingAi,
    handleSeedAi
  };
};
