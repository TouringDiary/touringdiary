import { GEO_CONFIG } from '../../constants/geoConfig';
import { POI_SUBCATEGORY_VALUES } from '../../constants/governance';
import { verifyPoisBatch } from '../../services/ai';
import { getCorrectCategory } from '../../services/ai/utils/taxonomyUtils';
import {
  deleteSinglePoi,
  getCityDetails,
  getPoisByCityId,
  saveSinglePoi,
} from '../../services/cityService';
import type { PointOfInterest, PoiSubCategory, User } from '../../types/index';
import type { useAiTaskRunner } from './useAiTaskRunner';

export interface ValidationOptions {
  keepLogs?: boolean;
}

export type VerifyDraftsBatchFn = (
  cityId: string,
  cityName: string,
  user?: User,
  categoryFilter?: string,
  targetIds?: string[],
  options?: ValidationOptions,
) => Promise<number>;

export const useAiValidation = (runner: ReturnType<typeof useAiTaskRunner>) => {
  const { performStep, addLog, resetRunner, stopRunner } = runner;

  const verifyDraftsBatch: VerifyDraftsBatchFn = async (
    cityId,
    cityName,
    _user,
    categoryFilter,
    targetIds,
    options = {},
  ) => {
    const stepName = categoryFilter
      ? `Validazione Pro: ${categoryFilter}`
      : targetIds
        ? `Validazione Selezione (${targetIds.length})`
        : 'Validazione Pro Massiva';

    if (!options.keepLogs) {
      if (!categoryFilter && !targetIds) {
        resetRunner([
          { step: 'Recupero Bozze DB', status: 'pending', itemsCount: 0, durationMs: 0 },
          { step: stepName, status: 'pending', itemsCount: 0, durationMs: 0 },
        ]);
      } else if (targetIds) {
        resetRunner([{ step: stepName, status: 'pending', itemsCount: 0, durationMs: 0 }]);
      }
    }

    addLog(`🚀 AVVIO VALIDAZIONE PRO: ${cityName}`);

    try {
      let cityCenterCoords = GEO_CONFIG.DEFAULT_CENTER;
      try {
        const cityDetails = await getCityDetails(cityId, undefined, { peopleAudience: 'admin' });
        if (cityDetails) {
          cityCenterCoords = cityDetails.coords;
          if (!categoryFilter)
            addLog(`📍 Centro città riferimento: ${cityCenterCoords.lat}, ${cityCenterCoords.lng}`);
        }
      } catch {
        console.warn('Could not fetch city center coords, using defaults.');
      }

      let draftsToVerify: PointOfInterest[] = [];
      const allPois = await getPoisByCityId(cityId);

      if (targetIds && targetIds.length > 0) {
        draftsToVerify = allPois.filter((p) => targetIds.includes(p.id));
      } else {
        draftsToVerify = allPois.filter((p) => {
          const isDraft =
            p.status === 'draft' ||
            p.aiReliability === 'low' ||
            (!p.coords || (p.coords.lat === 0 && p.coords.lng === 0));
          const isCategoryMatch = categoryFilter ? p.category === categoryFilter : true;
          return isDraft && isCategoryMatch;
        });
      }

      if (draftsToVerify.length === 0) {
        addLog(`⚠️ Nessun POI da validare trovato.`);
        if (!categoryFilter && !options.keepLogs) stopRunner();
        return 0;
      }

      const resultStats = await performStep(
        stepName,
        async () => {
          const inputList = draftsToVerify.map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            subCategory: p.subCategory,
            address: p.address,
          }));

          const verifiedResults = await verifyPoisBatch(inputList, cityName, cityCenterCoords);

          let successCount = 0;
          let deletedCount = 0;
          let lowQualityCount = 0;
          let invalidCount = 0;

          for (const verified of verifiedResults) {
            const originalPoi = draftsToVerify.find((d) => d.id === verified.id);
            if (!originalPoi) continue;

            if (verified.aiReliability === 'duplicate') {
              addLog(`🗑️ Duplicato rimosso: ${originalPoi.name}`);
              await deleteSinglePoi(originalPoi.id);
              deletedCount++;
              continue;
            }

            if (verified.status === 'invalid') {
              await saveSinglePoi(
                {
                  ...originalPoi,
                  status: 'needs_check',
                  aiReliability: 'invalidated',
                  description: `[AI INVALIDATO] ${verified.description || 'Fuori Zona o Inesistente.'}`,
                },
                cityId,
              );
              invalidCount++;
              continue;
            }

            const verifiedCoords =
              verified.coords && typeof verified.coords.lat === 'number'
                ? verified.coords
                : typeof verified.lat === 'number' && typeof verified.lng === 'number'
                  ? { lat: verified.lat, lng: verified.lng }
                  : undefined;

            if (verifiedCoords && verifiedCoords.lat !== 0) {
              let finalOpeningDays = verified.openingDays;
              let isEstimated = verified.isEstimated;
              if (
                !finalOpeningDays ||
                !Array.isArray(finalOpeningDays) ||
                finalOpeningDays.length === 0
              ) {
                finalOpeningDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
                isEstimated = true;
              } else if (isEstimated === undefined) {
                isEstimated = true;
              }

              let finalOpeningTime = verified.openingHours;
              if (!finalOpeningTime || finalOpeningTime === '') {
                finalOpeningTime = '09:00 - 20:00';
                isEstimated = true;
              }

              const verifiedSubCategory: PoiSubCategory | undefined =
                typeof verified.subCategory === 'string' &&
                (POI_SUBCATEGORY_VALUES as readonly string[]).includes(verified.subCategory)
                  ? (verified.subCategory as PoiSubCategory)
                  : undefined;

              const updatedPoi: PointOfInterest = {
                ...originalPoi,
                name: verified.name ?? originalPoi.name,
                address: verified.address,
                coords: verifiedCoords,
                category: getCorrectCategory(
                  verified.subCategory || '',
                  verified.category || originalPoi.category,
                  verified.name || originalPoi.name,
                ),
                subCategory: verifiedSubCategory,
                description: verified.description ?? originalPoi.description,
                visitDuration: verified.visitDuration,
                priceLevel: verified.priceLevel,
                openingHours: {
                  days: finalOpeningDays,
                  morning: finalOpeningTime,
                  afternoon: '',
                  isEstimated: isEstimated,
                },
                status: 'draft',
                aiReliability: 'high',
                tourismInterest: verified.tourismInterest || 'medium',
                updatedAt: new Date().toISOString(),
                lastVerified: new Date().toISOString(),
              };
              await saveSinglePoi(updatedPoi, cityId);
              successCount++;
            } else {
              await saveSinglePoi(
                {
                  ...originalPoi,
                  status: 'draft',
                  aiReliability: 'low',
                  description: `[NO GPS] ${verified.description || 'Dati insufficienti o non trovati.'}`,
                },
                cityId,
              );
              lowQualityCount++;
            }
          }

          if (deletedCount > 0) addLog(`🗑️ Rimossi ${deletedCount} duplicati.`);
          if (invalidCount > 0) addLog(`🚫 Invalidati ${invalidCount} elementi.`);
          if (lowQualityCount > 0)
            addLog(`⚠️ ${lowQualityCount} elementi rimasti in bozza con affidabilità bassa.`);

          return {
            success: successCount,
            discarded: deletedCount + invalidCount + lowQualityCount,
            total: draftsToVerify.length,
          };
        },
        (res) => res.success,
        (res) => `${res.success} Validi • ${res.discarded} Scartati/Bozza`,
      );

      addLog('✅ Bonifica completata. Dati aggiornati.');
      return resultStats.success;
    } catch (e: unknown) {
      addLog(`❌ ERRORE VALIDAZIONE: ${e instanceof Error ? e.message : String(e)}`);
      if (!categoryFilter && !options.keepLogs) stopRunner();
      throw e;
    } finally {
      if (!categoryFilter && !options.keepLogs) stopRunner();
    }
  };

  return { verifyDraftsBatch };
};
