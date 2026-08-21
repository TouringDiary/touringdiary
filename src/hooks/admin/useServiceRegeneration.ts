import type React from 'react';
import { useEffect, useState } from 'react';
import { useCityEditor } from '@/context/CityEditorContext';
import { assertAiRuntimeAvailable } from '@/services/ai/aiRuntimeStatus';
import {
  type RefinedServicesBundle,
  refineServiceData,
  type SuggestedCityItem,
  suggestCityItems,
} from '../../services/ai';
import type {
  SaveCityEventInput,
  SaveCityGuideInput,
  SaveCityServiceInput,
} from '../../services/city/entitiesService';
import { appendGenerationLogs } from '../../services/city/parsers/content/parseLogs';
import {
  deleteCityEvent,
  deleteCityGuide,
  deleteCityService,
  deleteCityTourOperator,
  getCityEvents,
  getCityGuides,
  getCityServices,
  getCityTourOperators,
  mapToTourOperatorInput,
  saveCityDetails,
  saveCityEvent,
  saveCityGuide,
  saveCityService,
  saveCityTourOperator,
} from '../../services/cityService';
import type { CityEvent, CityGuide, CityService, CityTourOperator } from '../../types/index';
import type { User } from '../../types/users';
import { getSafeEventCategory, getSafeServiceType } from '../../utils/common';
import { type StepReport, useAiTaskRunner } from './useAiTaskRunner';

/** Entity dominio → item AI bundle (stesso payload runtime, senza any). */
const toSuggestedCityItem = (item: { name: string } & object): SuggestedCityItem => {
  const suggested: SuggestedCityItem = { name: item.name };
  Object.assign(suggested, item);
  return suggested;
};

type CurrentServiceEntities = {
  guides: CityGuide[];
  events: CityEvent[];
  services: CityService[];
  tourOperators: CityTourOperator[];
};

export const useServiceRegeneration = (currentUser: User) => {
  const { city, reloadCurrentCity } = useCityEditor();

  const [showConfirmRegen, setShowConfirmRegen] = useState(false);

  const { processLog, stepReports, isProcessing, addLog, performStep, resetRunner, stopRunner } =
    useAiTaskRunner();

  const [currentData, setCurrentData] = useState<CurrentServiceEntities>({
    guides: [],
    events: [],
    services: [],
    tourOperators: [],
  });

  useEffect(() => {
    if (city?.id) {
      Promise.all([
        getCityGuides(city.id),
        getCityEvents(city.id),
        getCityServices(city.id),
        getCityTourOperators(city.id),
      ]).then(([g, e, services, tourOperators]) => {
        setCurrentData({
          guides: g,
          events: e,
          services,
          tourOperators,
        });
      });
    }
  }, [city?.id]);

  const handleRegenerateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      assertAiRuntimeAvailable({
        userRole: currentUser.role,
        isAuthenticated: true,
      });
    } catch {
      // UI already shows AdminAiRuntimeBanner + disabled button; no native alert.
      return;
    }
    if (!city?.name) {
      alert('Inserisci il nome della città!');
      return;
    }
    setShowConfirmRegen(true);
  };

  const closeProcessLog = () => {
    resetRunner([]);
  };

  const executeRegeneration = async () => {
    if (!city) return;

    try {
      assertAiRuntimeAvailable({
        userRole: currentUser.role,
        isAuthenticated: true,
      });
    } catch {
      setShowConfirmRegen(false);
      // Same as click: banner + disabled state cover user feedback.
      return;
    }

    setShowConfirmRegen(false);

    const steps: StepReport[] = [
      { step: 'Analisi & Discovery (Flash)', status: 'pending', itemsCount: 0, durationMs: 0 },
      { step: 'Refinement & Merge (Pro)', status: 'pending', itemsCount: 0, durationMs: 0 },
      { step: 'Pulizia Database', status: 'pending', itemsCount: 0, durationMs: 0 },
      { step: 'Salvataggio Dati Certificati', status: 'pending', itemsCount: 0, durationMs: 0 },
    ];

    resetRunner(steps);
    addLog(`🚀 AVVIO RIGENERAZIONE SERVIZI: ${city.name}`);

    try {
      let rawData: RefinedServicesBundle = {};
      await performStep(
        'Analisi & Discovery (Flash)',
        async () => {
          const existG = currentData.guides.map((i) => i.name);
          const existE = currentData.events.map((i) => i.name);
          const existO = currentData.tourOperators.map((i) => i.name);
          const existS = currentData.services.map((i) => i.name);

          const servicesQuery =
            'stazione ferroviaria, metro, porto, traghetti, ospedale, farmacia, polizia, carabinieri';

          const [rawGuides, rawEvents, rawOperators, rawServices] = await Promise.all([
            suggestCityItems(city.name, 'guides', existG, '', 5),
            suggestCityItems(city.name, 'events', existE, '', 5),
            suggestCityItems(city.name, 'tour_operators', existO, '', 4),
            suggestCityItems(city.name, 'services', existS, servicesQuery, 10),
          ]);

          rawData = {
            guides: [...currentData.guides.map(toSuggestedCityItem), ...rawGuides],
            events: [...currentData.events.map(toSuggestedCityItem), ...rawEvents],
            tour_operators: [
              ...currentData.tourOperators.map(toSuggestedCityItem),
              ...rawOperators,
            ],
            services: [...currentData.services.map(toSuggestedCityItem), ...rawServices],
          };

          return rawGuides.length + rawEvents.length + rawOperators.length + rawServices.length;
        },
        (count) => count,
        (count) => `${count} Nuovi elementi grezzi trovati`,
      );

      let refinedData: RefinedServicesBundle = {};
      await performStep(
        'Refinement & Merge (Pro)',
        async () => {
          refinedData = await refineServiceData(city.name, rawData);
          const totalItems =
            (refinedData.guides?.length || 0) +
            (refinedData.events?.length || 0) +
            (refinedData.tour_operators?.length || 0) +
            (refinedData.services?.length || 0);
          return totalItems;
        },
        (count) => count,
        (count) => `${count} Elementi unificati e bonificati`,
      );

      await performStep(
        'Pulizia Database',
        async () => {
          await Promise.all([
            ...currentData.guides.map((g) => deleteCityGuide(g.id)),
            ...currentData.events.map((e) => deleteCityEvent(e.id)),
            ...currentData.services.map((s) => deleteCityService(s.id)),
            ...currentData.tourOperators.map((op) => deleteCityTourOperator(op.id)),
          ]);
          return 1;
        },
        () => 1,
        () => 'Vecchi dati rimossi',
      );

      await performStep(
        'Salvataggio Dati Certificati',
        async () => {
          const savePromises: Promise<unknown>[] = [];

          if (refinedData.guides && Array.isArray(refinedData.guides)) {
            refinedData.guides.forEach((g: SuggestedCityItem, i: number) => {
              if (g?.name)
                savePromises.push(
                  saveCityGuide(city.id, { ...g, orderIndex: i + 1 } as SaveCityGuideInput),
                );
            });
          }

          if (refinedData.events && Array.isArray(refinedData.events)) {
            refinedData.events.forEach((e: SuggestedCityItem, i: number) => {
              if (e?.name) {
                const safeCat = getSafeEventCategory(String(e.category ?? ''));
                savePromises.push(
                  saveCityEvent(city.id, {
                    ...(e as SaveCityEventInput),
                    category: safeCat,
                    orderIndex: i + 1,
                  }),
                );
              }
            });
          }

          if (refinedData.tour_operators && Array.isArray(refinedData.tour_operators)) {
            refinedData.tour_operators.forEach((op: SuggestedCityItem) => {
              if (op?.name) {
                savePromises.push(saveCityTourOperator(city.id, mapToTourOperatorInput(op)));
              }
            });
          }

          if (refinedData.services && Array.isArray(refinedData.services)) {
            refinedData.services.forEach((s: SuggestedCityItem, i: number) => {
              if (s?.name) {
                const typed = {
                  ...s,
                  type: getSafeServiceType(String(s.type || s.category || s.name || '')),
                  orderIndex: i + 1,
                };
                savePromises.push(saveCityService(city.id, typed as SaveCityServiceInput));
              }
            });
          }

          await Promise.all(savePromises);
          return savePromises.length;
        },
        (count) => count,
        (count) => `${count} Record salvati nel DB`,
      );

      const newLog = `[${new Date().toISOString()}] ✅ Fine: Rigenerazione Pagina Servizi (in 0s)`;
      const updatedCity = {
        ...city,
        details: {
          ...city.details,
          generationLogs: appendGenerationLogs(city.details.generationLogs, [newLog]),
        },
      };
      await saveCityDetails(updatedCity);

      await reloadCurrentCity();

      const [g, e, services, tourOperators] = await Promise.all([
        getCityGuides(city.id),
        getCityEvents(city.id),
        getCityServices(city.id),
        getCityTourOperators(city.id),
      ]);
      setCurrentData({
        guides: g,
        events: e,
        services,
        tourOperators,
      });

      addLog('✅ Processo completato con successo!');
    } catch (err: unknown) {
      console.error('Errore rigenerazione:', err);
      addLog(`❌ ERRORE FATALE: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      stopRunner();
    }
  };

  return {
    isProcessing,
    showConfirmRegen,
    setShowConfirmRegen,
    processLog,
    stepReports,
    handleRegenerateClick,
    executeRegeneration,
    closeProcessLog,
  };
};
