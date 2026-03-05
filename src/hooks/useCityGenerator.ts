
import { useAiTaskRunner, StepReport } from './admin/useAiTaskRunner';
import { User } from '../types/index';

// SUB-HOOKS (Modules)
import { useAiFlashSearch } from './admin/useAiFlashSearch';
import { useAiValidation } from './admin/useAiValidation';
import { useAiTargetedSearch } from './admin/useAiTargetedSearch';
import { useAiMagicCity } from './admin/useAiMagicCity';
import { useAiCompleteCity } from './admin/useAiCompleteCity';

export type { StepReport };

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

    const fixMissingStats = async (targets: any[], mode: string) => {
        addLog("Funzionalità fixMissingStats non ancora implementata nel nuovo sistema modulare.");
    };

    return { 
        // State
        processLog, 
        stepReports, 
        isProcessing, 
        isRecovered, // NEW
        
        // Exposed Actions
        executeMagicAdd: (cityName: string, poiCount?: number, user?: User, existingCityId?: string) => 
            handleCompletionWrapper(() => executeMagicAdd(cityName, poiCount, user, existingCityId)),
        
        executeCompleteCity: (cityId: string, cityName: string, config: any, user?: User) => 
            handleCompletionWrapper(() => executeCompleteCity(cityId, cityName, config, user)),

        generateTargetedPois: (cityId: string, cityName: string, cats: Record<string, number>, user?: User) => 
            handleCompletionWrapper(() => generateTargetedPois(cityId, cityName, cats, user)),

        verifyDraftsBatch: (cityId: string, cityName: string, user?: User, catFilter?: string, targetIds?: string[]) => 
            handleCompletionWrapper(() => verifyDraftsBatch(cityId, cityName, user, catFilter, targetIds) as Promise<any>),

        generateDraftsOnly: (cityId: string, cityName: string, count: number, cats: any[], user?: User) => 
            handleCompletionWrapper(() => generateDraftsOnly(cityId, cityName, count, cats, user)),
            
        clearSession, // NEW
        
        // Legacy
        fixMissingStats
    };
};
