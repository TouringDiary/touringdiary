import type { User } from '../types/index';
import { type CompleteCityConfig, useAiCompleteCity } from './admin/useAiCompleteCity';

// SUB-HOOKS (Modules)
import { useAiFlashSearch } from './admin/useAiFlashSearch';
import { useAiMagicCity } from './admin/useAiMagicCity';
import { useAiTargetedSearch } from './admin/useAiTargetedSearch';
import { type StepReport, useAiTaskRunner } from './admin/useAiTaskRunner';
import { useAiValidation } from './admin/useAiValidation';

export type { CompleteCityConfig, StepReport };
export type FlashCategoryRef = { id: string; label: string };

export const useCityGenerator = (onComplete?: () => void) => {
  // 1. Core Runner (State & Logs)
  const runner = useAiTaskRunner();
  const { processLog, stepReports, isProcessing, isRecovered, addLog, clearSession } = runner;

  // 2. Initialize Sub-Modules
  const { verifyDraftsBatch } = useAiValidation(runner);
  const { generateTargetedPois } = useAiTargetedSearch(runner);
  const { generateDraftsOnly } = useAiFlashSearch(runner);
  const { executeMagicAdd } = useAiMagicCity(runner, verifyDraftsBatch);
  const { executeCompleteCity } = useAiCompleteCity(runner, verifyDraftsBatch);

  // Wrapper per intercettare il completamento globale
  const handleCompletionWrapper = async <T>(fn: () => Promise<T>): Promise<T> => {
    try {
      const result = await fn();
      return result;
    } finally {
      if (onComplete) onComplete();
    }
  };

  const fixMissingStats = async (_targets: unknown[] | { id?: string }[], _mode: string) => {
    addLog('Funzionalità fixMissingStats non ancora implementata nel nuovo sistema modulare.');
  };

  return {
    // State
    processLog,
    stepReports,
    isProcessing,
    isRecovered, // NEW

    // Exposed Actions
    executeMagicAdd: (
      cityName: string,
      poiCount?: number,
      user?: User,
      existingCityId?: string,
      adminRegion?: string,
    ) =>
      handleCompletionWrapper(() =>
        executeMagicAdd(cityName, poiCount, user, existingCityId, adminRegion),
      ),

    executeCompleteCity: (
      cityId: string,
      cityName: string,
      config: CompleteCityConfig,
      user?: User,
    ) => handleCompletionWrapper(() => executeCompleteCity(cityId, cityName, config, user)),

    generateTargetedPois: (
      cityId: string,
      cityName: string,
      cats: Record<string, number>,
      user?: User,
    ) => handleCompletionWrapper(() => generateTargetedPois(cityId, cityName, cats, user)),

    verifyDraftsBatch: (
      cityId: string,
      cityName: string,
      user?: User,
      catFilter?: string,
      targetIds?: string[],
    ) =>
      handleCompletionWrapper(() =>
        verifyDraftsBatch(cityId, cityName, user, catFilter, targetIds),
      ),

    generateDraftsOnly: (
      cityId: string,
      cityName: string,
      count: number,
      cats: FlashCategoryRef[],
      user?: User,
    ) => handleCompletionWrapper(() => generateDraftsOnly(cityId, cityName, count, cats, user)),

    clearSession, // NEW

    // Legacy
    fixMissingStats,
  };
};
