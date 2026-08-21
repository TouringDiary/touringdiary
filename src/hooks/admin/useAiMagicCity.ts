import { useConfig } from '@/context/ConfigContext';
import { GEO_CONFIG } from '../../constants/geoConfig';
import { POI_SUBCATEGORY_VALUES } from '../../constants/governance';
import {
  enrichPersonData,
  generateCitySection,
  type PersonDiscoveryResult,
  type RefinedServicesBundle,
  refineServiceData,
  type SuggestedCityItem,
  suggestCityItems,
  suggestCityPeople,
  suggestNewPois,
} from '../../services/ai';
import { generateHistoricalPortrait } from '../../services/ai/aiVision';
import { getCorrectCategory } from '../../services/ai/utils/taxonomyUtils';
import { getRegistryCitySlugById, resolveCanonicalCityId } from '../../services/city/cityIdService';
import type {
  SaveCityEventInput,
  SaveCityGuideInput,
  SaveCityPersonInput,
  SaveCityServiceInput,
} from '../../services/city/entitiesService';
import { mergePatronDetailsFromAi } from '../../services/city/parsers/content/mergePatronDetailsFromAi';
import { appendGenerationLogs } from '../../services/city/parsers/content/parseLogs';
import {
  getCityDetails,
  getCityPeople,
  getPoisByCityId,
  mapToTourOperatorInput,
  saveCityDetails,
  saveCityEvent,
  saveCityGuide,
  saveCityPerson,
  saveCityService,
  saveCityTourOperator,
  saveSinglePoi,
} from '../../services/cityService';
import { ensureZoneExists, getTouristZones } from '../../services/zoneService';
import type {
  CityGeneralAiResult,
  CityHistoryAiResult,
  CityPatronAiResult,
  CityRatingsAiResult,
  CityStatsAiResult,
} from '../../types/ai/cityGeneration';
import type {
  CityDetails,
  FamousPerson,
  PointOfInterest,
  PoiSubCategory,
  User,
} from '../../types/index';
import { getSafeEventCategory, getSafeServiceType, toTitleCase } from '../../utils/common';
import type { StepReport, useAiTaskRunner } from './useAiTaskRunner';
import type { VerifyDraftsBatchFn } from './useAiValidation';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const useAiMagicCity = (
  runner: ReturnType<typeof useAiTaskRunner>,
  verifyDraftsBatch: VerifyDraftsBatchFn,
) => {
  // Usiamo il runner passato dal parent, così i log sono visibili nell'UI principale
  const { performStep, addLog, resetRunner, stopRunner, getAccumulatedLogs } = runner;
  const { configs } = useConfig();

  // Recupera l'immagine default una volta sola (fuori dal loop)
  const defaultHero =
    typeof configs.hero_image === 'string'
      ? configs.hero_image
      : typeof configs.HERO_IMAGE === 'string'
        ? configs.HERO_IMAGE
        : '';

  const executeMagicAdd = async (
    rawCityName: string,
    poiCount: number = 10,
    user?: User,
    existingCityId?: string,
    adminRegion?: string,
  ) => {
    const cityName = toTitleCase(rawCityName);
    const isUpdateMode = !!existingCityId;

    let rawServicesData: RefinedServicesBundle = {};

    const categoriesToGenerate = [
      { id: 'monument', label: 'Monumenti' },
      { id: 'food', label: 'Cibo & Sapori' },
      { id: 'nature', label: 'Natura & Relax' },
      { id: 'leisure', label: 'Svago & Nightlife' },
      { id: 'shop', label: 'Shopping & Artigianato' },
      { id: 'hotel', label: 'Hotel & Alloggi' },
    ];

    const poiSteps = categoriesToGenerate.map((cat) => ({
      step: `Ricerca Flash: ${cat.label}`,
      status: 'pending' as const,
      itemsCount: 0,
      durationMs: 0,
    }));

    const allSteps: StepReport[] = [
      {
        step: isUpdateMode ? 'Analisi & Popolamento (Arricchimento)' : 'Analisi & Creazione Città',
        status: 'pending',
        itemsCount: 0,
        durationMs: 0,
      },
      ...poiSteps,
      { step: 'Bonifica Servizi & Eventi (Pro)', status: 'pending', itemsCount: 0, durationMs: 0 },
      { step: 'Validazione & Deep Check (Pro)', status: 'pending', itemsCount: 0, durationMs: 0 },
      { step: 'Finalizzazione & Log', status: 'pending', itemsCount: 0, durationMs: 0 },
    ];

    resetRunner(allSteps);
    addLog(`🚀 AVVIO MAGIC ${isUpdateMode ? 'ENRICHMENT' : 'ADD'} v3.5: ${cityName}`);

    try {
      let cityId = existingCityId || '';
      let cityCenterCoords = GEO_CONFIG.DEFAULT_CENTER;

      let existingPoiNames: string[] = [];
      let isTrueDraft = false;

      if (isUpdateMode && existingCityId) {
        try {
          const existingPois = await getPoisByCityId(existingCityId);
          existingPoiNames = existingPois.map((p) => p.name);

          const cityDetails = await getCityDetails(existingCityId, undefined, {
            peopleAudience: 'admin',
          });
          if (cityDetails) {
            if (cityDetails.coords.lat !== 0) cityCenterCoords = cityDetails.coords;
            if (
              cityDetails.description &&
              cityDetails.description.length > 50 &&
              Object.keys(cityDetails.details.ratings || {}).length > 0
            ) {
              isTrueDraft = true;
            }
          }
        } catch (e) {
          console.warn('Errore fetch existing POIs', e);
        }
      }

      const knownZones = await getTouristZones();
      const knownZoneNames = knownZones.map((z) => z.name);

      // STEP 1: ANALISI E POPOLAMENTO
      await performStep(
        isUpdateMode ? 'Analisi & Popolamento (Arricchimento)' : 'Analisi & Creazione Città',
        async () => {
          let currentRegion = adminRegion;

          if (isUpdateMode && !currentRegion) {
            try {
              const existingData = await getCityDetails(cityId, undefined, {
                peopleAudience: 'admin',
              });
              if (existingData) currentRegion = existingData.adminRegion;
            } catch (e) {
              console.warn('Could not fetch existing region for disambiguation', e);
            }
          }

          if (!cityId) {
            try {
              // Risolviamo l'ID canonico PRIMA di procedere con la regione (se disponibile)
              cityId = await resolveCanonicalCityId(cityName, currentRegion);
              addLog(
                `📍 ID Canonico risolto: ${cityId} ${currentRegion ? `(${currentRegion})` : ''}`,
              );
            } catch (err: unknown) {
              addLog(
                `❌ ERRORE: La città "${cityName}" ${currentRegion ? `in ${currentRegion}` : ''} non è presente nel registro ufficiale (cities_registry).`,
              );
              throw new Error('CITY_NOT_IN_REGISTRY');
            }
          }
          const servicesQuery =
            'stazione ferroviaria, metro, porto, traghetti, ospedale, farmacia, polizia, carabinieri, trasporti pubblici';

          let generalData: CityGeneralAiResult = {};
          let statsData: CityStatsAiResult = {};
          let historyData: CityHistoryAiResult = {};
          let ratingsData: CityRatingsAiResult = {};
          let patronData: CityPatronAiResult = {};
          let guides: SuggestedCityItem[] = [];
          let events: SuggestedCityItem[] = [];
          let services: SuggestedCityItem[] = [];
          let people: PersonDiscoveryResult[] = [];

          if (isTrueDraft) {
            const [g, e, s, p] = await Promise.all([
              suggestCityItems(cityName, 'guides', [], '', 3),
              suggestCityItems(cityName, 'events', [], 'Cerca festival cinema, arte o musica.', 4),
              suggestCityItems(cityName, 'services', [], servicesQuery, 10),
              suggestCityPeople(cityName, [], '', 5),
            ]);
            guides = g;
            events = e;
            services = s;
            people = p;
          } else {
            const results = await Promise.all([
              generateCitySection(cityName, 'general', '', knownZoneNames),
              generateCitySection(cityName, 'stats'),
              generateCitySection(cityName, 'history'),
              generateCitySection(cityName, 'ratings'),
              generateCitySection(cityName, 'patron'),
              suggestCityItems(cityName, 'guides', [], '', 3),
              suggestCityItems(cityName, 'events', [], 'Cerca festival cinema, arte o musica.', 4),
              suggestCityItems(cityName, 'services', [], servicesQuery, 10),
              suggestCityPeople(cityName, [], '', 5),
            ]);
            generalData = results[0];
            statsData = results[1];
            historyData = results[2];
            ratingsData = results[3];
            patronData = results[4];
            guides = results[5];
            events = results[6];
            services = results[7];
            people = results[8];
          }

          let existingCityData: CityDetails | null = null;
          if (isUpdateMode)
            existingCityData = await getCityDetails(cityId, undefined, { peopleAudience: 'admin' });

          const citySlug = existingCityData?.slug ?? (await getRegistryCitySlugById(cityId));

          // CLEANUP: Usa il default globale invece di Unsplash hardcoded
          const cityPayload: CityDetails = {
            id: cityId,
            slug: citySlug,
            name: cityName,
            zone: generalData.zone || existingCityData?.zone || GEO_CONFIG.DEFAULT_REGION,
            adminRegion:
              generalData.adminRegion || existingCityData?.adminRegion || GEO_CONFIG.DEFAULT_REGION,
            nation: generalData.nation || existingCityData?.nation || GEO_CONFIG.DEFAULT_NATION,
            continent:
              generalData.continent || existingCityData?.continent || GEO_CONFIG.DEFAULT_CONTINENT,
            description:
              generalData.description || existingCityData?.description || 'Generazione in corso...',
            imageUrl:
              existingCityData?.imageUrl && !existingCityData.imageUrl.includes('unsplash')
                ? existingCityData.imageUrl
                : defaultHero,
            coords:
              generalData.lat && generalData.lng && generalData.lat !== 0
                ? { lat: generalData.lat, lng: generalData.lng }
                : existingCityData?.coords || { lat: 0, lng: 0 },
            rating: existingCityData?.rating || 0,
            visitors: statsData.visitorsEstimate || existingCityData?.visitors || 0,
            isFeatured: existingCityData?.isFeatured || false,
            status: 'draft',
            tags: existingCityData?.tags || [],
            details: {
              subtitle: generalData.subtitle || existingCityData?.details?.subtitle || '',
              heroImage:
                existingCityData?.details?.heroImage &&
                !existingCityData.details.heroImage.includes('unsplash')
                  ? existingCityData.details.heroImage
                  : defaultHero,
              historySnippet:
                historyData.historySnippet || existingCityData?.details?.historySnippet || '',
              historyFull: historyData.historyFull || existingCityData?.details?.historyFull || '',
              officialWebsite:
                generalData.officialWebsite || existingCityData?.details?.officialWebsite || '',
              ratings: (ratingsData.ratings
                ? { ...ratingsData.ratings }
                : existingCityData?.details?.ratings || {}) as CityDetails['details']['ratings'],
              patron: patronData.patron?.name || existingCityData?.details?.patron || '',
              patronDetails: patronData.patron
                ? mergePatronDetailsFromAi(
                    existingCityData?.details?.patronDetails,
                    patronData.patron,
                  )
                : existingCityData?.details?.patronDetails || undefined,
              seasonalVisitors:
                statsData.seasonalVisitors || existingCityData?.details?.seasonalVisitors,
              generationLogs: existingCityData?.details?.generationLogs ?? [],
              // Update: preserva collection esistenti (saveCityDetails persiste gallery nel payload;
              // people/guides/events/services/POI restano su tabelle dedicate ma non vanno azzerati qui).
              famousPeople: existingCityData?.details?.famousPeople ?? [],
              services: existingCityData?.details?.services ?? [],
              events: existingCityData?.details?.events ?? [],
              guides: existingCityData?.details?.guides ?? [],
              gallery: existingCityData?.details?.gallery ?? [],
              allPois: existingCityData?.details?.allPois ?? [],
              topAttractions: existingCityData?.details?.topAttractions ?? [],
              foodSpots: existingCityData?.details?.foodSpots ?? [],
              hotels: existingCityData?.details?.hotels ?? [],
              newDiscoveries: existingCityData?.details?.newDiscoveries ?? [],
              leisureSpots: existingCityData?.details?.leisureSpots ?? [],
              historySections: existingCityData?.details?.historySections ?? [],
              historyGallery: existingCityData?.details?.historyGallery ?? [],
              tourOperators: existingCityData?.details?.tourOperators ?? [],
            },
          };

          if (cityPayload.coords.lat !== 0) cityCenterCoords = cityPayload.coords;
          if (cityPayload.zone) await ensureZoneExists(cityPayload.zone, cityPayload.adminRegion);
          await saveCityDetails(cityPayload);

          if (Array.isArray(people)) {
            let orderIdx = 1;
            for (const p of people) {
              if (p && p.name) {
                let imageUrl = p.imageUrl || '';
                if (!imageUrl || imageUrl.includes('unsplash') || imageUrl.includes('ui-avatars')) {
                  try {
                    const generated = await generateHistoricalPortrait(
                      p.name,
                      p.role || '',
                      cityName,
                    );
                    if (generated) {
                      imageUrl = generated;
                    }
                  } catch (err) {
                    console.warn(`[useAiMagicCity] Ritratto non generato per ${p.name}:`, err);
                  }
                }
                await saveCityPerson(cityId, {
                  ...p,
                  imageUrl: imageUrl,
                  status: 'draft',
                  orderIndex: orderIdx++,
                } as SaveCityPersonInput);
              }
            }
          }

          rawServicesData = { guides, events, services, tour_operators: [] };
          return 1;
        },
      );

      // STEP 2: FLASH GATHERING POI
      for (const cat of categoriesToGenerate) {
        await delay(2000);

        await performStep(
          `Ricerca Flash: ${cat.label}`,
          async () => {
            const items = await suggestNewPois(
              cityName,
              existingPoiNames,
              undefined,
              poiCount,
              cat.id,
            );
            let savedForCat = 0;
            if (items && items.length > 0) {
              for (const pData of items) {
                const safeSub = pData.subCategory || 'generic';
                const correctCategory = getCorrectCategory(
                  safeSub,
                  pData.category || cat.id,
                  pData.name,
                );
                const draftSubCategory: PoiSubCategory | undefined =
                  typeof pData.subCategory === 'string' &&
                  (POI_SUBCATEGORY_VALUES as readonly string[]).includes(pData.subCategory)
                    ? (pData.subCategory as PoiSubCategory)
                    : undefined;
                const newPoi: PointOfInterest = {
                  id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                  name: pData.name,
                  category: correctCategory,
                  subCategory: draftSubCategory,
                  description: pData.description || 'Bozza da validare',
                  imageUrl: '',
                  coords: { lat: 0, lng: 0 },
                  rating: 0,
                  votes: 0,
                  address: pData.address || `${cityName}, Italia`,
                  cityId: cityId,
                  status: 'draft',
                  dateAdded: new Date().toISOString(),
                  aiReliability: 'low',
                  tourismInterest: pData.tourismInterest || 'medium',
                  lastVerified: new Date().toISOString(),
                  openingHours: {
                    days: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'],
                    morning: '09:00 - 20:00',
                    afternoon: '',
                    isEstimated: true,
                  },
                };
                await saveSinglePoi(newPoi, cityId);
                existingPoiNames.push(pData.name);
                savedForCat++;
              }
            }
            return savedForCat;
          },
          (cnt) => cnt,
        );
      }

      // STEP 3: REFINEMENT SERVIZI
      await performStep('Bonifica Servizi & Eventi (Pro)', async () => {
        const refinedData = await refineServiceData(cityName, rawServicesData);
        const savePromises: Promise<unknown>[] = [];

        if (refinedData.guides)
          refinedData.guides.forEach((g: SuggestedCityItem, i: number) => {
            savePromises.push(
              saveCityGuide(cityId, { ...g, orderIndex: i + 1 } as SaveCityGuideInput),
            );
          });
        if (refinedData.events)
          refinedData.events.forEach((e: SuggestedCityItem, i: number) => {
            if (e && e.name) {
              const safeCat = getSafeEventCategory(String(e.category ?? ''));
              const metadata = {
                rating: e.rating || 0,
                visitors: e.visitors || 0,
                summary: e.description,
              };
              savePromises.push(
                saveCityEvent(cityId, {
                  ...(e as SaveCityEventInput),
                  category: safeCat,
                  orderIndex: i + 1,
                  metadata,
                }),
              );
            }
          });
        if (refinedData.tour_operators)
          refinedData.tour_operators.forEach((op: SuggestedCityItem) => {
            savePromises.push(saveCityTourOperator(cityId, mapToTourOperatorInput(op)));
          });
        if (refinedData.services)
          refinedData.services.forEach((s: SuggestedCityItem, i: number) => {
            savePromises.push(
              saveCityService(cityId, {
                ...s,
                type: getSafeServiceType(String(s.type || s.category || '')),
                orderIndex: i + 1,
              } as SaveCityServiceInput),
            );
          });

        await Promise.all(savePromises);
        return 1;
      });

      // STEP 4: VALIDAZIONE
      await performStep(
        'Validazione & Deep Check (Pro)',
        async () => {
          const verifiedCount =
            (await verifyDraftsBatch(cityId, cityName, user, undefined, undefined, {
              keepLogs: true,
            })) || 0;

          const currentPeople = await getCityPeople(cityId);
          const draftPeople = currentPeople.filter((p) => p.status === 'draft');

          let enrichedPeopleCount = 0;
          for (const person of draftPeople) {
            try {
              if (enrichedPeopleCount > 0) await delay(5000);

              const enrichedData = await enrichPersonData(person.name, cityName);
              if (enrichedData) {
                let finalImage = person.imageUrl;
                if (!finalImage || finalImage.includes('ui-avatars')) {
                  const newImg = await generateHistoricalPortrait(
                    person.name,
                    enrichedData.role || person.role,
                    cityName,
                  );
                  if (newImg) {
                    finalImage = newImg;
                  }
                }
                const updatedPerson: FamousPerson = {
                  ...person,
                  ...enrichedData,
                  imageUrl: finalImage,
                  role: enrichedData.role || person.role,
                  bio: enrichedData.bio || person.bio,
                  status: 'published',
                };
                await saveCityPerson(cityId, updatedPerson);
                enrichedPeopleCount++;
              }
            } catch (err) {
              console.warn(`[useAiMagicCity] Enrichment fallito per ${person.name}:`, err);
            }
          }
          return (verifiedCount || 0) + (enrichedPeopleCount || 0);
        },
        (count) => count,
      );

      // STEP 5: FINAL
      await performStep('Finalizzazione & Log', async () => {
        const finalCity = await getCityDetails(cityId, undefined, { peopleAudience: 'admin' });
        if (finalCity) {
          finalCity.details.generationLogs = appendGenerationLogs(
            finalCity.details.generationLogs,
            getAccumulatedLogs(),
          );
          await saveCityDetails(finalCity, { skipReclaim: false });
        }
        return 1;
      });

      addLog('✅ COMPLETAMENTO CITTÀ TERMINATO CON SUCCESSO.');
    } catch (e: unknown) {
      if ((e instanceof Error ? e.message : String(e)) === 'QUOTA_EXCEEDED_DAILY') {
        addLog(`⚠️ PROCESSO INTERROTTO: Quota API esaurita.`);
      } else {
        addLog(`❌ ERRORE CRITICO: ${e instanceof Error ? e.message : String(e)}`);
      }
    } finally {
      stopRunner();
    }
  };

  return { executeMagicAdd };
};
