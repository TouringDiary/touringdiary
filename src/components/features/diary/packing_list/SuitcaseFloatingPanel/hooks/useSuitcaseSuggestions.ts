import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { MutableRefObject } from 'react';
import { Suitcase, SuitcaseItem } from '@/types/suitcase';
import { Itinerary } from '@/types';
import {
  seedAiSuggestions,
  mergeTemplateItems,
  getAiCandidates,
  AiCandidate,
  GetAiCandidatesOptions,
} from '@/hooks/useSuitcaseSystem';
import { getSystemCategoryOrderIndexExact, SystemCategoryName } from '@/domain/packing/packingCategories';
import { deriveItineraryTags, normalizeItemName } from '@/utils/tagDerivation';
import { ToastVariant } from '@/types/toast';
import { isDraftWorkspaceId } from '@/utils/guestSuitcaseHelper';
import type { SeedItemsLocallyFn } from './useSuitcasePanelData';

export interface AiSuggestion {
  name: string;
  category: string;
  status: 'pending' | 'accepted' | 'rejected';
  tripRelevant?: boolean;
}

export interface AiQuotaFeedback {
  requested: Partial<Record<SystemCategoryName, number>>;
  delivered: Record<string, number>;
  selectedCategories: string[];
}

const REVIEW_INITIAL_BATCH_MAX = 14;
const REVIEW_SHOW_MORE_BATCH_MAX = 10;

function toAiSuggestion(candidate: AiCandidate): AiSuggestion {
  return {
    name: candidate.name,
    category: candidate.category,
    status: 'pending',
    tripRelevant: candidate.tripRelevant,
  };
}

function countByCategory(candidates: AiCandidate[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const candidate of candidates) {
    counts[candidate.category] = (counts[candidate.category] ?? 0) + 1;
  }
  return counts;
}

export function buildQuotaFeedback(
  categories: string[],
  options: GetAiCandidatesOptions | undefined,
  candidates: AiCandidate[]
): AiQuotaFeedback | null {
  if (!options?.limitPerCategory) return null;
  return {
    requested: options.limitPerCategory,
    delivered: countByCategory(candidates),
    selectedCategories: categories,
  };
}

function buildCategoryOrder(
  selectedCategories: string[],
  byCategory: Map<string, AiCandidate[]>
): string[] {
  const selected =
    selectedCategories.length > 0
      ? selectedCategories.filter((cat) => byCategory.has(cat))
      : [];

  const orphan = [...byCategory.keys()].filter((cat) => !selected.includes(cat));
  orphan.sort((a, b) => {
    const indexA = getSystemCategoryOrderIndexExact(a);
    const indexB = getSystemCategoryOrderIndexExact(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });

  return selected.length > 0 ? [...selected, ...orphan] : orphan;
}

function takeNextCategoryAwareBatch(
  candidates: AiCandidate[],
  selectedCategories: string[],
  alreadyShownKeys: Set<string>,
  maxBatchSize: number
): AiCandidate[] {
  const remaining = candidates.filter((c) => !alreadyShownKeys.has(normalizeItemName(c.name)));
  const byCategory = new Map<string, AiCandidate[]>();

  for (const candidate of remaining) {
    const list = byCategory.get(candidate.category) ?? [];
    list.push(candidate);
    byCategory.set(candidate.category, list);
  }

  const categoryOrder = buildCategoryOrder(selectedCategories, byCategory);
  const batch: AiCandidate[] = [];
  let round = 0;

  while (batch.length < maxBatchSize) {
    let addedThisRound = false;
    for (const cat of categoryOrder) {
      if (batch.length >= maxBatchSize) break;
      const items = byCategory.get(cat) ?? [];
      if (round < items.length) {
        batch.push(items[round]);
        addedThisRound = true;
      }
    }
    if (!addedThisRound) break;
    round++;
  }

  return batch;
}

function describePartialQuota(feedback: AiQuotaFeedback): string | undefined {
  const shortfalls = feedback.selectedCategories.filter((cat) => {
    const requested = feedback.requested[cat as SystemCategoryName];
    if (requested === undefined) return false;
    const delivered = feedback.delivered[cat] ?? 0;
    return delivered < requested;
  });

  if (shortfalls.length === 0) return undefined;
  if (shortfalls.length === 1) {
    const cat = shortfalls[0];
    const requested = feedback.requested[cat as SystemCategoryName] ?? 0;
    const delivered = feedback.delivered[cat] ?? 0;
    return `${cat}: mostrati ${delivered} di ${requested} richiesti — catalogo esaurito per questa categoria.`;
  }
  return `Alcune categorie hanno meno suggerimenti del richiesto — catalogo esaurito.`;
}

function sortCategoriesBySystemOrder(categories: string[]): string[] {
  return [...categories].sort((a, b) => {
    const indexA = getSystemCategoryOrderIndexExact(a);
    const indexB = getSystemCategoryOrderIndexExact(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });
}

function buildExhaustedCategories(
  selectedCategories: string[],
  candidates: AiCandidate[],
  quotaFeedback: AiQuotaFeedback | null
): string[] {
  if (!selectedCategories.length) return [];

  const counts = countByCategory(candidates);
  const exhausted = selectedCategories.filter((cat) => {
    if (quotaFeedback) {
      const requested = quotaFeedback.requested[cat as SystemCategoryName];
      if (requested === 0) return false;
    }
    return (counts[cat] ?? 0) === 0;
  });

  return sortCategoriesBySystemOrder(exhausted);
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
  seedItemsLocallyRef?: MutableRefObject<SeedItemsLocallyFn | null>;
}

export const useSuitcaseSuggestions = ({
  linkedSuitcaseIds,
  suggestedTemplateIds,
  globalTemplates,
  activeSuitcase,
  itinerary,
  fetchUserSuitcases,
  setSaveStatus,
  showToast,
  seedItemsLocallyRef,
}: SuggestionsProps) => {
  const [mergedSuggestedItems, setMergedSuggestedItems] = useState<SuitcaseItem[]>([]);
  const [suggestedTemplates, setSuggestedTemplates] = useState<Suitcase[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [isSeedingAi, setIsSeedingAi] = useState(false);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [allAiCandidates, setAllAiCandidates] = useState<AiCandidate[]>([]);
  const [shownCount, setShownCount] = useState(0);
  const [lastSelectedCategories, setLastSelectedCategories] = useState<string[]>([]);
  const [aiQuotaFeedback, setAiQuotaFeedback] = useState<AiQuotaFeedback | null>(null);
  const [hasActiveQuota, setHasActiveQuota] = useState(false);

  const aiSessionSuitcaseIdRef = useRef<string | null>(null);
  const saveStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSaveStatusTimeout = useCallback(() => {
    if (saveStatusTimeoutRef.current !== null) {
      clearTimeout(saveStatusTimeoutRef.current);
      saveStatusTimeoutRef.current = null;
    }
  }, []);

  const resetAiSession = useCallback(() => {
    clearSaveStatusTimeout();
    setAiSuggestions([]);
    setAllAiCandidates([]);
    setShownCount(0);
    setLastSelectedCategories([]);
    setAiQuotaFeedback(null);
    setHasActiveQuota(false);
    setIsSeedingAi(false);
  }, [clearSaveStatusTimeout]);

  useEffect(() => {
    resetAiSession();
    aiSessionSuitcaseIdRef.current = activeSuitcase?.id ?? null;
  }, [activeSuitcase?.id, resetAiSession]);

  useEffect(() => clearSaveStatusTimeout, [clearSaveStatusTimeout]);

  useEffect(() => {
    if (!linkedSuitcaseIds || !suggestedTemplateIds || !globalTemplates) {
      setMergedSuggestedItems([]);
      setSuggestedTemplates([]);
      return;
    }

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

  const handleSeedAi = async (
    selectedCategories?: string[],
    mode: 'direct' | 'review' = 'direct',
    options?: GetAiCandidatesOptions
  ) => {
    if (!activeSuitcase || !itinerary) return;
    const targetSuitcaseId = activeSuitcase.id;
    const isSessionCurrent = () => aiSessionSuitcaseIdRef.current === targetSuitcaseId;
    const categories = selectedCategories ?? [];
    const quotaActive = !!options?.limitPerCategory;

    setIsSeedingAi(true);
    try {
      const tags = deriveItineraryTags(itinerary?.items || []);
      const context = `Viaggio: ${itinerary.name} | Tags: ${tags.join(', ')}`;

      const itemsForAi = (activeSuitcase.suitcase_items || []).map(i => ({
        name: i.name,
        is_ai_suggestion: !!i.is_ai_suggestion
      }));

      if (mode === 'direct') {
        const localSeed = seedItemsLocallyRef?.current;
        const useLocalDocumentSeed =
          !!localSeed && !isDraftWorkspaceId(activeSuitcase.id);

        let count = 0;
        let feedback: AiQuotaFeedback | null = null;

        if (useLocalDocumentSeed) {
          const candidates = await getAiCandidates(
            activeSuitcase.id,
            tags,
            itemsForAi,
            categories,
            activeSuitcase,
            options
          );
          if (!isSessionCurrent()) return;

          feedback = buildQuotaFeedback(categories, options, candidates);
          if (candidates.length > 0) {
            count = await localSeed(candidates, context);
          }
        } else {
          const candidates = quotaActive
            ? await getAiCandidates(
                activeSuitcase.id,
                tags,
                itemsForAi,
                categories,
                activeSuitcase,
                options
              )
            : undefined;

          if (quotaActive && !isSessionCurrent()) return;

          feedback = candidates
            ? buildQuotaFeedback(categories, options, candidates)
            : null;

          count = await seedAiSuggestions(
            activeSuitcase.id,
            tags,
            itemsForAi,
            context,
            categories,
            activeSuitcase,
            options,
            candidates
          );
          if (!isSessionCurrent()) return;

          if (count > 0) {
            await fetchUserSuitcases();
            if (!isSessionCurrent()) return;
          }
        }

        if (!isSessionCurrent()) return;

        if (count > 0) {
          clearSaveStatusTimeout();
          setSaveStatus(`Aggiunti ${count} suggerimenti`);
          const statusSuitcaseId = targetSuitcaseId;
          saveStatusTimeoutRef.current = setTimeout(() => {
            saveStatusTimeoutRef.current = null;
            if (aiSessionSuitcaseIdRef.current === statusSuitcaseId) {
              setSaveStatus(null);
            }
          }, 3000);

          const partialNote = feedback ? describePartialQuota(feedback) : undefined;
          showToast(
            'Suggerimenti aggiunti',
            partialNote ?? `Abbiamo aggiunto ${count} oggetti dalle categorie selezionate.`,
            'success'
          );
        } else {
          showToast(
            'Nessun nuovo suggerimento trovato',
            'La valigia copre già tutti gli oggetti disponibili nelle categorie selezionate.',
            'neutral'
          );
        }
      } else {
        const candidates = await getAiCandidates(
          activeSuitcase.id,
          tags,
          itemsForAi,
          categories,
          activeSuitcase,
          options
        );
        if (!isSessionCurrent()) return;

        const feedback = buildQuotaFeedback(categories, options, candidates);

        setAllAiCandidates(candidates);
        setLastSelectedCategories(categories);
        setAiQuotaFeedback(feedback);
        setHasActiveQuota(quotaActive);

        if (quotaActive) {
          setAiSuggestions(candidates.map(toAiSuggestion));
          setShownCount(candidates.length);
        } else {
          const initialBatch = takeNextCategoryAwareBatch(
            candidates,
            categories,
            new Set(),
            REVIEW_INITIAL_BATCH_MAX
          );
          setAiSuggestions(initialBatch.map(toAiSuggestion));
          setShownCount(initialBatch.length);
        }
      }
    } finally {
      if (isSessionCurrent()) {
        setIsSeedingAi(false);
      }
    }
  };

  const handleShowMoreAi = () => {
    if (hasActiveQuota) return;

    const shownKeys = new Set(aiSuggestions.map((s) => normalizeItemName(s.name)));
    const nextBatch = takeNextCategoryAwareBatch(
      allAiCandidates,
      lastSelectedCategories,
      shownKeys,
      REVIEW_SHOW_MORE_BATCH_MAX
    );

    if (nextBatch.length > 0) {
      setAiSuggestions(prev => [...prev, ...nextBatch.map(toAiSuggestion)]);
      setShownCount(prev => prev + nextBatch.length);
    } else {
      showToast(
        'Fine dei suggerimenti',
        'Abbiamo esaurito gli oggetti disponibili nelle categorie selezionate.',
        'neutral'
      );
    }
  };

  const exhaustedCategories = useMemo(
    () => buildExhaustedCategories(lastSelectedCategories, allAiCandidates, aiQuotaFeedback),
    [lastSelectedCategories, allAiCandidates, aiQuotaFeedback]
  );

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
    hasMoreAi: !hasActiveQuota && shownCount < allAiCandidates.length,
    aiQuotaFeedback,
    exhaustedCategories,
  };
};
