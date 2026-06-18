import { useState, useEffect, useCallback, useRef } from 'react';
import { Suitcase, SuitcaseItem } from '@/types/suitcase';
import { Itinerary } from '@/types';
import { seedAiSuggestions, mergeTemplateItems, getAiCandidates } from '@/hooks/useSuitcaseSystem';
import { deriveItineraryTags } from '@/utils/tagDerivation';
import { ToastVariant } from '@/types/toast';

export interface AiSuggestion {
  name: string;
  category: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface SuggestionsProps {
  linkedSuitcaseIds: string[] | null;
  suggestedTemplateIds: string[] | null;
  globalTemplates: Suitcase[] | null;
  activeSuitcase: Suitcase | undefined | null;
  itinerary: Itinerary | null;
  fetchUserSuitcases: () => void;
  setSaveStatus: (s: string | null) => void;
  showToast: (message: string, description?: string, variant?: ToastVariant) => void;
}

export const useSuitcaseSuggestions = ({
  linkedSuitcaseIds,
  suggestedTemplateIds,
  globalTemplates,
  activeSuitcase,
  itinerary,
  fetchUserSuitcases,
  setSaveStatus,
  showToast
}: SuggestionsProps) => {
  const [mergedSuggestedItems, setMergedSuggestedItems] = useState<SuitcaseItem[]>([]);
  const [suggestedTemplates, setSuggestedTemplates] = useState<Suitcase[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [isSeedingAi, setIsSeedingAi] = useState(false);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Stato per il nuovo modal
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [allAiCandidates, setAllAiCandidates] = useState<{ name: string; category: string }[]>([]);
  const [shownCount, setShownCount] = useState(0);

  const aiSessionSuitcaseIdRef = useRef<string | null>(null);

  const resetAiSession = useCallback(() => {
    setAiSuggestions([]);
    setAllAiCandidates([]);
    setShownCount(0);
    setIsSeedingAi(false);
  }, []);

  useEffect(() => {
    resetAiSession();
    aiSessionSuitcaseIdRef.current = activeSuitcase?.id ?? null;
  }, [activeSuitcase?.id, resetAiSession]);

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

  const handleSeedAi = async (selectedCategories?: string[], mode: 'direct' | 'review' = 'direct') => {
    if (!activeSuitcase || !itinerary) return;
    const targetSuitcaseId = activeSuitcase.id;
    const isSessionCurrent = () => aiSessionSuitcaseIdRef.current === targetSuitcaseId;

    setIsSeedingAi(true);
    try {
      const tags = deriveItineraryTags(itinerary?.items || []);
      const context = `Viaggio: ${itinerary.name} | Tags: ${tags.join(', ')}`;
      
      const itemsForAi = (activeSuitcase.suitcase_items || []).map(i => ({
        name: i.name,
        is_ai_suggestion: !!i.is_ai_suggestion
      }));

      if (mode === 'direct') {
        const count = await seedAiSuggestions(
        activeSuitcase.id,
        tags,
        itemsForAi,
        context,
        selectedCategories,
        activeSuitcase
      );
        if (!isSessionCurrent()) return;

        if (count > 0) {
          await fetchUserSuitcases();
          if (!isSessionCurrent()) return;

          setSaveStatus(`Aggiunti ${count} suggerimenti`);
          setTimeout(() => setSaveStatus(null), 3000);
          showToast("Suggerimenti aggiunti", `Abbiamo trovato ${count} oggetti per il tuo viaggio.`, 'success');
        } else {
          showToast(
            "Nessun nuovo suggerimento trovato",
            "La valigia sembra già ben coperta per questo tipo di viaggio.",
            'neutral'
          );
        }
      } else {
        // Modalità Review
        const candidates = await getAiCandidates(
          activeSuitcase.id,
          tags,
          itemsForAi,
          selectedCategories,
          activeSuitcase
        );
        if (!isSessionCurrent()) return;

        setAllAiCandidates(candidates);
        
        const initialBatch = candidates.slice(0, 10).map(c => ({
          name: c.name,
          category: c.category,
          status: 'pending' as const
        }));
        
        setAiSuggestions(initialBatch);
        setShownCount(10);
      }
    } finally {
      if (isSessionCurrent()) {
        setIsSeedingAi(false);
      }
    }
  };

  const handleShowMoreAi = () => {
    const nextBatch = allAiCandidates.slice(shownCount, shownCount + 10).map(c => ({
      name: c.name,
      category: c.category,
      status: 'pending' as const
    }));
    
    if (nextBatch.length > 0) {
      setAiSuggestions(prev => [...prev, ...nextBatch]);
      setShownCount(prev => prev + 10);
    } else {
      showToast("Fine dei suggerimenti", "Abbiamo esaurito gli oggetti nel catalogo per queste categorie.", 'neutral');
    }
  };

  return {
    mergedSuggestedItems,
    suggestedTemplates,
    isMerging,
    setIsMerging,
    isSeedingAi,
    isLoadingAi,
    handleSeedAi,
    aiSuggestions,
    setAiSuggestions,
    handleShowMoreAi,
    hasMoreAi: shownCount < allAiCandidates.length
  };
};
