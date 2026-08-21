import { useEffect, useRef, useState } from 'react';
import {
  type AutomationResult,
  runAiAnalysisService,
  runBulkStatusUpdateService,
  runPublishingService,
} from '../../../services/importAutomationService';
import {
  clearCityStaging,
  deduplicateStagingData,
  deleteStagingPois,
  getAllStagingIds,
  reclaimStagingByCityName,
  type StagingFilter,
} from '../../../services/stagingService';

interface UseImportActionsProps {
  selectedCityId: string;
  refreshData: () => Promise<void>;
  // Filter context needed for "Select All"
  filtersContext: {
    statusFilter: NonNullable<StagingFilter['status']>;
    searchTerm: string;
    filterAiRating: string[];
    filterRawCategories: string[];
    totalItems: number;
  };
}

export const useImportActions = ({
  selectedCityId,
  refreshData,
  filtersContext,
}: UseImportActionsProps) => {
  // --- ACTION STATES ---
  const [isSelectingAll, setIsSelectingAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Process States
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState('');
  const [isDeduplicating, setIsDeduplicating] = useState(false);

  // Report State
  const [report, setReport] = useState<AutomationResult & { isOpen: boolean }>({
    isOpen: false,
    totalRequested: 0,
    processed: 0,
    success: 0,
    errors: 0,
    quotaExceeded: false,
  });

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Reset selezione quando cambia la città o i filtri principali (non la pagina)
  useEffect(() => {
    if (!isAnalyzing && !isPublishing && !isBulkUpdating) {
      setSelectedIds(new Set());
    }
  }, [selectedCityId, filtersContext.statusFilter, filtersContext.searchTerm]);

  // --- SELECTION ACTIONS ---
  const handleToggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSelectAll = async () => {
    if (selectedIds.size === filtersContext.totalItems && filtersContext.totalItems > 0) {
      setSelectedIds(new Set());
      return;
    }

    setIsSelectingAll(true);
    try {
      const allIds = await getAllStagingIds({
        cityId: selectedCityId,
        status: filtersContext.statusFilter,
        search: filtersContext.searchTerm,
        aiRating: filtersContext.filterAiRating,
        rawCategories: filtersContext.filterRawCategories,
      });
      if (isMounted.current) setSelectedIds(new Set(allIds));
    } catch (e) {
      alert('Errore selezione massiva.');
    } finally {
      if (isMounted.current) setIsSelectingAll(false);
    }
  };

  const resetSelection = () => setSelectedIds(new Set());

  // --- BULK OPERATIONS ---
  const handleBulkStatus = async (status: 'ready' | 'discarded' | 'new') => {
    if (selectedIds.size === 0) return;
    setIsBulkUpdating(true);
    try {
      const ids = Array.from(selectedIds) as string[];
      await runBulkStatusUpdateService(ids, status);
      if (isMounted.current) setSelectedIds(new Set());
      await refreshData();
    } catch (e) {
      alert('Errore aggiornamento status');
    } finally {
      if (isMounted.current) setIsBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkUpdating(true);
    try {
      const ids = Array.from(selectedIds) as string[];
      const CHUNK = 500;
      for (let i = 0; i < ids.length; i += CHUNK) {
        await deleteStagingPois(ids.slice(i, i + CHUNK));
      }
      await refreshData();
      if (isMounted.current) setSelectedIds(new Set());
    } catch (e: unknown) {
      alert(`Errore eliminazione: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      if (isMounted.current) setIsBulkUpdating(false);
    }
  };

  const handleClearAllStaging = async () => {
    if (!selectedCityId) return;
    // Nota: Il confirm deve essere gestito dal componente UI prima di chiamare questa funzione
    try {
      const count = await clearCityStaging(selectedCityId);
      await refreshData();
      if (isMounted.current) setSelectedIds(new Set());
      return count;
    } catch (e) {
      alert('Errore pulizia.');
      return 0;
    }
  };

  const handleDeduplicate = async () => {
    if (!selectedCityId) return;
    setIsDeduplicating(true);
    try {
      const removedCount = await deduplicateStagingData(selectedCityId);
      await refreshData();
      alert(`Deduplica completata. Rimossi ${removedCount} elementi ridondanti.`);
    } catch (e) {
      alert('Errore durante la deduplica.');
    } finally {
      setIsDeduplicating(false);
    }
  };

  const handleRecoverOrphans = async (activeCityName: string) => {
    if (!selectedCityId || !activeCityName) return;
    try {
      const recoveredCount = await reclaimStagingByCityName(activeCityName, selectedCityId);
      await refreshData();
      alert(`Recupero completato. Riassegnati ${recoveredCount} elementi orfani.`);
    } catch (e) {
      alert('Errore durante il recupero.');
    }
  };

  // --- AI & PUBLISH OPERATIONS ---
  const handleAiAnalysis = async (activeCityName: string) => {
    if (selectedIds.size === 0 || !activeCityName) return;

    setIsAnalyzing(true);
    setAnalysisProgress('Inizializzazione...');
    const ids = Array.from(selectedIds) as string[];

    try {
      const result = await runAiAnalysisService(activeCityName, ids, (progressMsg) => {
        if (isMounted.current) setAnalysisProgress(progressMsg);
      });

      if (isMounted.current) {
        setReport({ ...result, isOpen: true });
        await refreshData();
      }
    } catch (e: unknown) {
      alert(`Errore critico analisi: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      if (isMounted.current) {
        setIsAnalyzing(false);
        setAnalysisProgress('');
      }
    }
  };

  const handlePublishSelected = async (activeCityName: string) => {
    if (selectedIds.size === 0 || !activeCityName) return;

    setIsPublishing(true);
    setPublishProgress('Preparazione...');
    const ids = Array.from(selectedIds) as string[];

    try {
      const { successCount, errorQuota } = await runPublishingService(
        activeCityName,
        ids,
        (progressMsg) => {
          if (isMounted.current) setPublishProgress(progressMsg);
        },
      );

      if (errorQuota && isMounted.current) {
        alert(`⚠️ QUOTA AI ESAURITA!\nIl processo si è fermato dopo ${successCount} elementi.`);
      } else if (isMounted.current) {
        alert(`Processo completato: ${successCount} elementi pubblicati con successo.`);
      }

      await refreshData();
      if (isMounted.current) setSelectedIds(new Set());
    } catch (e) {
      alert('Errore durante la pubblicazione.');
    } finally {
      if (isMounted.current) {
        setPublishProgress('');
        setIsPublishing(false);
      }
    }
  };

  const closeReport = () => setReport((prev) => ({ ...prev, isOpen: false }));

  return {
    // State
    selectedIds,
    isSelectingAll,
    isBulkUpdating,
    isAnalyzing,
    analysisProgress,
    isPublishing,
    publishProgress,
    isDeduplicating,
    report,

    // Actions
    handleToggleSelection,
    handleSelectAll,
    resetSelection,
    handleBulkStatus,
    handleBulkDelete,
    handleClearAllStaging,
    handleDeduplicate,
    handleRecoverOrphans,
    handleAiAnalysis,
    handlePublishSelected,
    closeReport,
  };
};
