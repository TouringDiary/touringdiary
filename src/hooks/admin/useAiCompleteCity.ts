import {
  generateCitySection,
  refineServiceData,
  type SuggestedCityItem,
  suggestCityItems,
  suggestCityPeople,
} from '../../services/ai';
import { validateAiSpecificSlugs } from '../../services/ai/generators/peopleCategoryValidation';
import {
  ensureFamousPersonCompletenessWithAi,
  toCompleteFamousPersonRequiredFields,
} from '../../services/ai/generators/peopleCompletenessPipeline';
import { reclaimOrphanedItems } from '../../services/city/cityLifecycleService';
import type {
  SaveCityEventInput,
  SaveCityGuideInput,
  SaveCityServiceInput,
} from '../../services/city/entitiesService';
import { loadFamousPersonTaxonomy } from '../../services/city/famousPersonCategoryService';
import { mergePatronDetailsFromAi } from '../../services/city/parsers/content/mergePatronDetailsFromAi';
import { appendGenerationLogs } from '../../services/city/parsers/content/parseLogs';
import {
  deleteCityPerson,
  getCityDetails,
  getCityPeople,
  mapToTourOperatorInput,
  saveCityDetails,
  saveCityEvent,
  saveCityGuide,
  saveCityPerson,
  saveCityService,
  saveCityTourOperator,
} from '../../services/cityService';
import { findExistingPortrait } from '../../services/mediaService';
import type { CityDetails, CityServiceType, FamousPerson, User } from '../../types/index';
import { getSafeEventCategory, getSafeServiceType } from '../../utils/common';
import type { StepReport, useAiTaskRunner } from './useAiTaskRunner';
import type { VerifyDraftsBatchFn } from './useAiValidation';

const DEFAULT_RATINGS = {
  cultura: 50,
  monumenti: 50,
  musei_arte: 50,
  tradizione: 50,
  architettura: 50,
  natura: 50,
  mare_spiagge: 50,
  paesaggi: 50,
  clima: 50,
  sostenibilita: 50,
  gusto: 50,
  cucina: 50,
  vita_notturna: 50,
  caffe_bar: 50,
  mercati: 50,
  viaggiatore: 50,
  mobilita: 50,
  accoglienza: 50,
  costo: 50,
  sicurezza: 50,
};

function mapSuggestedToGuideInput(item: SuggestedCityItem, orderIndex: number): SaveCityGuideInput {
  return {
    name: String(item.name || '').trim(),
    slug: typeof item.slug === 'string' ? item.slug : undefined,
    isOfficial: typeof item.isOfficial === 'boolean' ? item.isOfficial : false,
    languages: Array.isArray(item.languages) ? item.languages.map(String) : [],
    specialties: Array.isArray(item.specialties) ? item.specialties.map(String) : [],
    phone: typeof item.phone === 'string' ? item.phone : undefined,
    email: typeof item.email === 'string' ? item.email : undefined,
    website: typeof item.website === 'string' ? item.website : undefined,
    imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : undefined,
    rating:
      typeof item.rating === 'number' && Number.isFinite(item.rating) ? item.rating : undefined,
    orderIndex,
  };
}

function mapSuggestedToEventInput(
  item: SuggestedCityItem,
  orderIndex: number,
  cityCoords?: { lat: number; lng: number },
): SaveCityEventInput | null {
  const name = String(item.name || '').trim();
  if (!name) return null;

  const lat =
    typeof item.lat === 'number' && Number.isFinite(item.lat) ? item.lat : cityCoords?.lat;
  const lng =
    typeof item.lng === 'number' && Number.isFinite(item.lng) ? item.lng : cityCoords?.lng;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;

  return {
    name,
    date: typeof item.date === 'string' ? item.date : '',
    category: getSafeEventCategory(String(item.category ?? '')),
    description: typeof item.description === 'string' ? item.description : '',
    location: typeof item.location === 'string' ? item.location : '',
    coords: { lat, lng },
    imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : undefined,
    orderIndex,
  };
}

function mapSuggestedToServiceInput(
  item: SuggestedCityItem,
  orderIndex: number,
): SaveCityServiceInput {
  return {
    name: String(item.name || '').trim(),
    type: getSafeServiceType(String(item.type || item.category || '')) as CityServiceType,
    contact: typeof item.contact === 'string' ? item.contact : '',
    category: typeof item.category === 'string' ? item.category : undefined,
    description: typeof item.description === 'string' ? item.description : undefined,
    url: typeof item.url === 'string' ? item.url : undefined,
    address: typeof item.address === 'string' ? item.address : undefined,
    orderIndex,
  };
}

export type CompleteCityConfig = { peopleCount: number; runPoiDeepScan: boolean };

export const useAiCompleteCity = (
  runner: ReturnType<typeof useAiTaskRunner>,
  verifyDraftsBatch: VerifyDraftsBatchFn,
) => {
  // Usiamo il runner passato dal parent, così i log sono visibili nell'UI principale
  const { addLog, performStep, resetRunner, stopRunner, getAccumulatedLogs } = runner;

  const executeCompleteCity = async (
    cityId: string,
    cityName: string,
    config: CompleteCityConfig,
    user?: User,
  ) => {
    // DEFINIZIONE STEP
    const steps: StepReport[] = [
      { step: 'Setup & Reclaim Dati', status: 'pending', itemsCount: 0, durationMs: 0 },
      { step: 'Generali & Statistiche', status: 'pending', itemsCount: 0, durationMs: 0 },
      { step: 'Valutazioni & Ratings', status: 'pending', itemsCount: 0, durationMs: 0 },
      { step: 'Storia & Cultura', status: 'pending', itemsCount: 0, durationMs: 0 },
      {
        step: `Generazione Personaggi (${config.peopleCount})`,
        status: 'pending',
        itemsCount: 0,
        durationMs: 0,
      },
      {
        step: 'Merge & Fix Servizi (Info & Guide)',
        status: 'pending',
        itemsCount: 0,
        durationMs: 0,
      },
      { step: 'Reset Media (Hero)', status: 'pending', itemsCount: 0, durationMs: 0 },
    ];

    if (config.runPoiDeepScan) {
      steps.push({
        step: 'Bonifica POI Pro (Daily)',
        status: 'pending',
        itemsCount: 0,
        durationMs: 0,
      });
    }

    steps.push({ step: 'Finalizzazione & Log', status: 'pending', itemsCount: 0, durationMs: 0 });

    resetRunner(steps);
    addLog(`🚀 AVVIO COMPLETAMENTO TOTALE: ${cityName}`);

    try {
      // Carica la città attuale
      let currentCity = await getCityDetails(cityId, undefined, { peopleAudience: 'admin' });
      if (!currentCity) throw new Error('Città non trovata.');

      // 0. RECLAIM PREVENTIVO (Una tantum all'inizio)
      await performStep(
        'Setup & Reclaim Dati',
        async () => {
          await reclaimOrphanedItems(cityId, cityName);
          return 1;
        },
        () => 1,
        () => 'Dati orfani recuperati',
      );

      // 1. GENERALI & STATS
      await performStep('Generali & Statistiche', async () => {
        if (!currentCity) throw new Error('Città non trovata.');

        const [generalData, statsData] = await Promise.all([
          generateCitySection(cityName, 'general'),
          generateCitySection(cityName, 'stats'),
        ]);

        const newDetails = { ...currentCity.details };
        if (generalData.subtitle) newDetails.subtitle = generalData.subtitle;
        if (generalData.officialWebsite) newDetails.officialWebsite = generalData.officialWebsite;
        if (statsData.seasonalVisitors) newDetails.seasonalVisitors = statsData.seasonalVisitors;

        const updated: CityDetails = {
          ...currentCity,
          description: generalData.description || currentCity.description,
          zone: generalData.zone || currentCity.zone,
          adminRegion: generalData.adminRegion || currentCity.adminRegion,
          nation: generalData.nation || currentCity.nation,
          continent: generalData.continent || currentCity.continent,
          coords:
            typeof generalData.lat === 'number' && typeof generalData.lng === 'number'
              ? { lat: generalData.lat, lng: generalData.lng }
              : currentCity.coords,
          visitors: statsData.visitorsEstimate || currentCity.visitors,
          details: newDetails,
        };
        currentCity = updated; // Update local reference
        // SKIP RECLAIM: Già fatto all'inizio
        await saveCityDetails(updated, { skipReclaim: true });
        return 1;
      });

      // 2. RATINGS
      await performStep('Valutazioni & Ratings', async () => {
        if (!currentCity) throw new Error('Città non trovata.');

        const data = await generateCitySection(cityName, 'ratings');
        const newDetails = { ...currentCity.details };
        newDetails.ratings = { ...DEFAULT_RATINGS, ...data.ratings };

        const updated = { ...currentCity, details: newDetails };
        currentCity = updated;
        await saveCityDetails(updated, { skipReclaim: true });
        return 1;
      });

      // 3. STORIA & CULTURA
      await performStep('Storia & Cultura', async () => {
        if (!currentCity) throw new Error('Città non trovata.');

        const [historyData, patronData] = await Promise.all([
          generateCitySection(cityName, 'history'),
          generateCitySection(cityName, 'patron'),
        ]);

        const newDetails = { ...currentCity.details };
        newDetails.historySnippet = historyData.historySnippet || '';
        newDetails.historyFull = historyData.historyFull || '';

        if (patronData.patron) {
          newDetails.patronDetails = mergePatronDetailsFromAi(
            newDetails.patronDetails,
            patronData.patron,
          );
          newDetails.patron = patronData.patron.name;
        }

        const updated = { ...currentCity, details: newDetails };
        currentCity = updated;
        await saveCityDetails(updated, { skipReclaim: true });
        return 1;
      });

      // 4. PERSONAGGI — genera e valida PRIMA di cancellare quelli esistenti
      await performStep(
        `Generazione Personaggi (${config.peopleCount})`,
        async () => {
          const suggestions = await suggestCityPeople(cityName, [], '', config.peopleCount);
          const taxonomy = await loadFamousPersonTaxonomy({ activeOnly: true });
          const activeSpecifics = taxonomy.specifics.map((s) => ({
            slug: s.slug,
            id: s.id,
          }));

          const prepared: Array<{
            name: string;
            bio: string;
            imageUrl: string | null;
            specificCategoryIds: string[];
            birthYear: number;
            birthDate?: string | null;
            isLiving: boolean;
            deathYear?: number | null;
            deathDate?: string | null;
            quote?: string;
            famousWorks?: string[];
            relatedPlaces?: FamousPerson['relatedPlaces'];
            fullBio?: string;
            privateLife?: string;
            awards?: string[];
            careerStats?: FamousPerson['careerStats'];
            status: 'draft';
            orderIndex: number;
          }> = [];
          let incompleteCount = 0;
          let orderIdx = 1;

          for (const p of suggestions) {
            await new Promise((r) => setTimeout(r, 2000));

            const slugValidation = validateAiSpecificSlugs(
              p.specificCategorySlugs ?? [],
              activeSpecifics,
            );
            if (!slugValidation.ok) {
              incompleteCount += 1;
              console.warn(
                `[useAiCompleteCity] Personaggio scartato (categorie AI invalidi): ${p.name}`,
                slugValidation.invalid,
              );
              continue;
            }

            const existingUrl = await findExistingPortrait(p.name);
            const recovered = await ensureFamousPersonCompletenessWithAi(
              {
                ...p,
                specificCategoryIds: slugValidation.ids,
                imageUrl: existingUrl ?? p.imageUrl,
              },
              cityName,
            );
            const required = toCompleteFamousPersonRequiredFields(recovered.person);
            if (!required) {
              incompleteCount += 1;
              console.warn(
                `[useAiCompleteCity] Personaggio scartato (incompleto): ${p.name}`,
                recovered.missingFields,
              );
              continue;
            }

            prepared.push({
              ...required,
              imageUrl: required.imageUrl ?? null,
              quote: recovered.person.quote ?? p.quote,
              famousWorks: recovered.person.famousWorks ?? p.famousWorks,
              relatedPlaces: recovered.person.relatedPlaces ?? p.relatedPlaces,
              fullBio: recovered.person.fullBio ?? p.fullBio,
              privateLife: recovered.person.privateLife ?? p.privateLife,
              awards: recovered.person.awards ?? p.awards,
              careerStats: recovered.person.careerStats ?? p.careerStats,
              status: 'draft',
              orderIndex: orderIdx++,
            });
          }

          if (prepared.length === 0) {
            console.warn(
              `[useAiCompleteCity] Nessun personaggio completo (scartati: ${incompleteCount}). Dataset esistente preservato.`,
            );
            return 0;
          }

          const existingPeople = await getCityPeople(cityId, 'admin');
          for (const existing of existingPeople) {
            if (existing.id) {
              await deleteCityPerson(existing.id);
            }
          }

          for (const person of prepared) {
            await saveCityPerson(cityId, person);
          }
          return prepared.length;
        },
        (c) => c,
      );

      // 5. SERVIZI
      await performStep(
        'Merge & Fix Servizi (Info & Guide)',
        async () => {
          const [rawGuides, rawEvents, rawOperators, rawServices] = await Promise.all([
            suggestCityItems(cityName, 'guides', [], '', 3),
            suggestCityItems(cityName, 'events', [], '', 4),
            suggestCityItems(cityName, 'tour_operators', [], '', 3),
            suggestCityItems(cityName, 'services', [], 'trasporti, farmacie, ospedali', 8),
          ]);

          const mixedInput = {
            guides: rawGuides,
            events: rawEvents,
            tour_operators: rawOperators,
            services: rawServices,
          };

          const refinedData = await refineServiceData(cityName, mixedInput);

          const savePromises: Promise<unknown>[] = [];
          if (refinedData.guides)
            refinedData.guides.forEach((g: SuggestedCityItem, i: number) => {
              savePromises.push(saveCityGuide(cityId, mapSuggestedToGuideInput(g, i + 1)));
            });
          if (refinedData.events)
            refinedData.events.forEach((e: SuggestedCityItem, i: number) => {
              const payload = mapSuggestedToEventInput(e, i + 1, currentCity?.coords);
              if (payload) {
                savePromises.push(saveCityEvent(cityId, payload));
              }
            });
          if (refinedData.tour_operators)
            refinedData.tour_operators.forEach((op: SuggestedCityItem) => {
              savePromises.push(saveCityTourOperator(cityId, mapToTourOperatorInput(op)));
            });
          if (refinedData.services)
            refinedData.services.forEach((s: SuggestedCityItem, i: number) => {
              savePromises.push(saveCityService(cityId, mapSuggestedToServiceInput(s, i + 1)));
            });

          await Promise.all(savePromises);
          return savePromises.length;
        },
        (c) => c,
      );

      // 6. MEDIA — nessun URL fittizio: senza sorgente reale non si sovrascrive la Hero.
      await performStep('Verifica Media (Hero)', async () => {
        if (!currentCity) return 0;
        const existingHero = currentCity.details.heroImage?.trim();
        if (existingHero) {
          return 1;
        }
        console.warn(
          '[useAiCompleteCity] Hero assente: nessun generatore Hero automatico disponibile. Completare via Tab Media.',
        );
        return 0;
      });

      // 7. POI DEEP SCAN
      if (config.runPoiDeepScan) {
        // Eseguiamo il deep scan usando la funzione passata (che usa il runner condiviso)
        // Passiamo keepLogs: true per non resettare la lista step
        await verifyDraftsBatch(cityId, cityName, user, undefined, undefined, { keepLogs: true });
      }

      // FINALIZZAZIONE
      await performStep('Finalizzazione & Log', async () => {
        const finalCity = await getCityDetails(cityId, undefined, { peopleAudience: 'admin' });
        if (finalCity) {
          finalCity.details.generationLogs = appendGenerationLogs(
            finalCity.details.generationLogs,
            getAccumulatedLogs(),
          );
          // Salvataggio finale: qui riattiviamo il reclaim per sicurezza finale
          await saveCityDetails(finalCity, { skipReclaim: false });
        }
        return 1;
      });

      addLog('✅ COMPLETAMENTO CITTÀ TERMINATO CON SUCCESSO.');
    } catch (e: unknown) {
      addLog(`❌ ERRORE CRITICO: ${e instanceof Error ? e.message : String(e)}`);
      // Non fermiamo il runner qui per permettere all'utente di vedere l'errore
    } finally {
      stopRunner();
    }
  };

  return { executeCompleteCity };
};
