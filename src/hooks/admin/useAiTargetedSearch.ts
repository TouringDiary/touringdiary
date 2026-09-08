import { POI_SUBCATEGORY_VALUES } from '../../constants/governance';
import { suggestNewPois } from '../../services/ai';
import { getCorrectCategory } from '../../services/ai/utils/taxonomyUtils';
import { saveSinglePoi } from '../../services/cityService';
import type { PointOfInterest, PoiSubCategory } from '../../types/index';
import type { StepReport, useAiTaskRunner } from './useAiTaskRunner';

// Helper delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const toPoiSubCategory = (value: string | undefined): PoiSubCategory | undefined => {
  if (!value) return undefined;
  for (const v of POI_SUBCATEGORY_VALUES) {
    if (v === value) return v;
  }
  return undefined;
};

export const useAiTargetedSearch = (runner: ReturnType<typeof useAiTaskRunner>) => {
  const { performStep, addLog, resetRunner, stopRunner } = runner;

  const generateTargetedPois = async (
    cityId: string,
    cityName: string,
    categoriesToSearch: Record<string, number>,
  ) => {
    const steps: StepReport[] = Object.entries(categoriesToSearch).map(([catId, count]) => ({
      step: `Ricerca Mirata: ${catId} (${count} item)`,
      status: 'pending',
      itemsCount: 0,
      durationMs: 0,
    }));

    resetRunner(steps);
    addLog(`🚀 AVVIO RICERCA MIRATA: ${cityName}`);

    try {
      let totalSaved = 0;

      for (const [catId, count] of Object.entries(categoriesToSearch)) {
        await delay(300);

        await performStep(
          `Ricerca Mirata: ${catId} (${count} item)`,
          async () => {
            const items = await suggestNewPois(
              cityName,
              [],
              `Solo luoghi di tipo ${catId}`,
              count,
              catId,
            );

            let savedForCat = 0;
            if (items && items.length > 0) {
              for (const pData of items) {
                // --- AUTOMATIC TAXONOMY FIX (AUTO-FIX ON INSERT) ---
                // Calcola la categoria corretta basata su nome e sottocategoria PRIMA di salvare
                const safeSub = pData.subCategory || 'generic';
                const correctCategory = getCorrectCategory(
                  safeSub,
                  pData.category || catId,
                  pData.name,
                );

                const newPoi: PointOfInterest = {
                  id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                  name: pData.name,
                  category: correctCategory,
                  subCategory: toPoiSubCategory(pData.subCategory),
                  description: pData.description ?? '',
                  imageUrl: '',
                  cityId: cityId,
                  status: 'draft',
                  dateAdded: new Date().toISOString(),
                  aiReliability: 'low',
                  ...(pData.address ? { address: pData.address } : {}),
                  ...(pData.tourismInterest ? { tourismInterest: pData.tourismInterest } : {}),
                };
                await saveSinglePoi(newPoi, cityId);
                savedForCat++;
              }
            }
            totalSaved += savedForCat;
            return savedForCat;
          },
          (cnt) => cnt,
        );
      }

      addLog(`✅ Ricerca mirata completata. Salvate ${totalSaved} nuove bozze.`);
    } catch (e: unknown) {
      if ((e instanceof Error ? e.message : String(e)) === 'QUOTA_EXCEEDED_DAILY') {
        addLog('⛔ STOP: Quota giornaliera Google esaurita.');
      } else {
        addLog(`❌ ERRORE RICERCA MIRATA: ${e instanceof Error ? e.message : String(e)}`);
      }
    } finally {
      stopRunner();
    }
  };

  return { generateTargetedPois };
};
