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

export const useAiFlashSearch = (runner: ReturnType<typeof useAiTaskRunner>) => {
  const { performStep, addLog, resetRunner, stopRunner } = runner;

  const generateDraftsOnly = async (
    cityId: string,
    cityName: string,
    poiCount: number,
    categories: { id: string; label: string }[],
  ) => {
    const initialSteps: StepReport[] = categories.map((cat) => ({
      step: `Ricerca Flash: ${cat.label}`,
      status: 'pending' as const,
      itemsCount: 0,
      durationMs: 0,
    }));

    resetRunner(initialSteps);
    addLog(`🚀 AVVIO RICERCA FLASH (Bozze non validate): ${cityName}`);

    try {
      for (const cat of categories) {
        await delay(300); // Piccolo delay per non saturare

        await performStep(
          `Ricerca Flash: ${cat.label}`,
          async () => {
            // Genera con Flash
            const draftPois = await suggestNewPois(cityName, [], undefined, poiCount, cat.id);

            // Salva subito come BOZZA (Draft) senza validazione
            let savedCount = 0;
            if (draftPois && draftPois.length > 0) {
              for (const pData of draftPois) {
                const safeSub = pData.subCategory || 'generic';
                // Usa la tassonomia intelligente anche qui
                const correctCategory = getCorrectCategory(
                  safeSub,
                  pData.category || cat.id,
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
                  aiReliability: 'low', // Segnala che è grezzo
                  ...(pData.address ? { address: pData.address } : {}),
                  ...(pData.tourismInterest ? { tourismInterest: pData.tourismInterest } : {}),
                };
                await saveSinglePoi(newPoi, cityId);
                savedCount++;
              }
            }
            return savedCount;
          },
          (count) => count,
        );
      }
      addLog(
        "✅ Ricerca Flash completata. I POI sono in stato 'Bozza'. Usa 'Valida POI - Pro' per la bonifica.",
      );
    } catch (e: unknown) {
      addLog(`❌ ERRORE FLASH: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      stopRunner();
    }
  };

  return { generateDraftsOnly };
};
