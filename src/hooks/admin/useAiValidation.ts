import { POI_SUBCATEGORY_VALUES } from '../../constants/governance';
import { verifyPoisBatch } from '../../services/ai';
import type { VerifiedPoiResult } from '../../services/ai/generators/poiGenerator';
import { getCorrectCategory } from '../../services/ai/utils/taxonomyUtils';
import {
  deleteSinglePoi,
  getCityDetails,
  getPoisByCityId,
  saveSinglePoi,
} from '../../services/cityService';
import type { OpeningHours, PointOfInterest, PoiSubCategory, User } from '../../types/index';
import { hasRequiredOpeningHours, type OpeningHoursGateInput } from '../../types/write/poiForm';
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

function parseGeoCoords(
  input: { lat: number; lng: number } | undefined,
): { lat: number; lng: number } | null {
  if (!input) return null;
  const { lat, lng } = input;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function parseVerifiedCoords(verified: VerifiedPoiResult): { lat: number; lng: number } | null {
  if (verified.coords) {
    const fromCoords = parseGeoCoords(verified.coords);
    if (fromCoords) return fromCoords;
  }
  if (typeof verified.lat === 'number' && typeof verified.lng === 'number') {
    return parseGeoCoords({ lat: verified.lat, lng: verified.lng });
  }
  return null;
}

function openingHoursFromAi(
  verified: VerifiedPoiResult,
  existing: OpeningHours | null | undefined,
): OpeningHours | null | undefined {
  const days = verified.openingDays;
  const morning = verified.openingHours?.trim() ?? '';
  const candidate: OpeningHoursGateInput = {
    days: Array.isArray(days) ? days : [],
    morning,
    afternoon: '',
    evening: '',
    isEstimated: verified.isEstimated ?? false,
  };
  if (!hasRequiredOpeningHours(candidate)) {
    return existing ?? null;
  }
  return {
    days: candidate.days,
    morning: morning || null,
    afternoon: existing?.afternoon ?? null,
    evening: existing?.evening ?? null,
    isEstimated: verified.isEstimated ?? existing?.isEstimated ?? false,
  };
}

function isTourismInterest(value: unknown): value is PointOfInterest['tourismInterest'] {
  return value === 'high' || value === 'medium' || value === 'low';
}

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

    if (targetIds !== undefined && targetIds.length === 0) {
      addLog('⚠️ Nessun POI selezionato per la validazione.');
      return 0;
    }

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
      let cityCenterCoords: { lat: number; lng: number } | null = null;
      try {
        const cityDetails = await getCityDetails(cityId, undefined, { peopleAudience: 'admin' });
        if (cityDetails) {
          cityCenterCoords = parseGeoCoords(cityDetails.coords);
          if (cityCenterCoords && !categoryFilter) {
            addLog(`📍 Centro città riferimento: ${cityCenterCoords.lat}, ${cityCenterCoords.lng}`);
          }
        }
      } catch (err: unknown) {
        console.warn('Could not fetch city center coords for validation.', err);
      }

      if (!cityCenterCoords) {
        addLog(
          '❌ Centro città non disponibile o coordinate non valide: validazione Pro non eseguita (fail-closed).',
        );
        if (!categoryFilter && !options.keepLogs) stopRunner();
        return 0;
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
            !parseGeoCoords(p.coords ?? undefined);
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

          const verifiedById = new Map<string, VerifiedPoiResult>();
          for (const row of verifiedResults) {
            if ('id' in row && typeof row.id === 'string') {
              verifiedById.set(row.id, row);
            }
          }

          let successCount = 0;
          let deletedCount = 0;
          let lowQualityCount = 0;
          let invalidCount = 0;
          let missingAiCount = 0;

          for (const originalPoi of draftsToVerify) {
            const verified = verifiedById.get(originalPoi.id);
            if (!verified) {
              addLog(`⚠️ Nessun esito AI per: ${originalPoi.name}`);
              missingAiCount++;
              continue;
            }

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
                  description: `[AI INVALIDATO] ${verified.description ?? 'Fuori Zona o Inesistente.'}`,
                },
                cityId,
                undefined,
                { primaryImage: 'preserve_assignment' },
              );
              invalidCount++;
              continue;
            }

            const verifiedCoords = parseVerifiedCoords(verified);

            if (!verifiedCoords) {
              await saveSinglePoi(
                {
                  ...originalPoi,
                  aiReliability: 'low',
                  description:
                    verified.description ??
                    originalPoi.description ??
                    '[NO GPS] Dati insufficienti o coordinate non valide.',
                  updatedAt: new Date().toISOString(),
                },
                cityId,
                undefined,
                { primaryImage: 'preserve_assignment' },
              );
              lowQualityCount++;
              continue;
            }

            const verifiedSubCategory: PoiSubCategory | undefined =
              typeof verified.subCategory === 'string' &&
              (POI_SUBCATEGORY_VALUES as readonly string[]).includes(verified.subCategory)
                ? (verified.subCategory as PoiSubCategory)
                : undefined;

            const tourismInterest = isTourismInterest(verified.tourismInterest)
              ? verified.tourismInterest
              : originalPoi.tourismInterest;

            const updatedPoi: PointOfInterest = {
              ...originalPoi,
              name: verified.name ?? originalPoi.name,
              address:
                typeof verified.address === 'string' && verified.address.trim().length > 0
                  ? verified.address
                  : originalPoi.address,
              coords: verifiedCoords,
              category: getCorrectCategory(
                verified.subCategory || '',
                verified.category || originalPoi.category,
                verified.name || originalPoi.name,
              ),
              subCategory: verifiedSubCategory ?? originalPoi.subCategory,
              description: verified.description ?? originalPoi.description,
              visitDuration:
                typeof verified.visitDuration === 'string' &&
                verified.visitDuration.trim().length > 0
                  ? verified.visitDuration
                  : originalPoi.visitDuration,
              priceLevel:
                verified.priceLevel === 1 ||
                verified.priceLevel === 2 ||
                verified.priceLevel === 3 ||
                verified.priceLevel === 4
                  ? verified.priceLevel
                  : originalPoi.priceLevel,
              openingHours: openingHoursFromAi(verified, originalPoi.openingHours),
              status: originalPoi.status,
              aiReliability: 'high',
              tourismInterest,
              updatedAt: new Date().toISOString(),
              lastVerified: new Date().toISOString(),
            };

            await saveSinglePoi(updatedPoi, cityId, undefined, {
              primaryImage: 'preserve_assignment',
            });
            const { schedulePoiRealImageDiscovery } = await import(
              '../../services/poi/poiRealImageDiscoveryService'
            );
            schedulePoiRealImageDiscovery(updatedPoi.id, cityId, 'bonifica');
            successCount++;
          }

          if (deletedCount > 0) addLog(`🗑️ Rimossi ${deletedCount} duplicati.`);
          if (invalidCount > 0) addLog(`🚫 Invalidati ${invalidCount} elementi.`);
          if (missingAiCount > 0) addLog(`⚠️ ${missingAiCount} POI senza esito AI.`);
          if (lowQualityCount > 0)
            addLog(`⚠️ ${lowQualityCount} elementi con coordinate AI assenti/non valide.`);

          return {
            success: successCount,
            discarded: deletedCount + invalidCount + lowQualityCount + missingAiCount,
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
