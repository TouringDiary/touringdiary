
import React, { useState, useEffect } from 'react';
import { useCityEditor } from '@/context/CityEditorContext';
import { suggestCityItems, refineServiceData } from '../../services/ai';
import { 
    getCityEvents, saveCityEvent, deleteCityEvent, 
    getCityServices, saveCityService, deleteCityService, 
    getCityGuides, saveCityGuide, deleteCityGuide,
    saveCityDetails
} from '../../services/cityService';
import { getSafeServiceType, getSafeEventCategory } from '../../utils/common';
import { incrementAiUsage } from '../../services/aiUsageService';
import { User } from '../../types/users';
import { useAiTaskRunner, StepReport } from './useAiTaskRunner';

export const useServiceRegeneration = (currentUser: User) => {
    const { city, reloadCurrentCity } = useCityEditor();
    
    // UI STATES
    const [showConfirmRegen, setShowConfirmRegen] = useState(false);
    
    // AI RUNNER (Gestisce log e stati)
    const { 
        processLog, 
        stepReports, 
        isProcessing, 
        addLog, 
        performStep, 
        resetRunner, 
        stopRunner 
    } = useAiTaskRunner();

    // Data Snapshot for Logic
    const [currentData, setCurrentData] = useState<{guides: any[], events: any[], services: any[]}>({ guides: [], events: [], services: [] });

    // Load snapshot when city changes
    useEffect(() => {
        if (city?.id) {
             Promise.all([
                getCityGuides(city.id),
                getCityEvents(city.id),
                getCityServices(city.id)
            ]).then(([g, e, s]) => {
                setCurrentData({ guides: g, events: e, services: s });
            });
        }
    }, [city?.id]);

    const handleRegenerateClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!city?.name) { alert("Inserisci il nome della città!"); return; }
        setShowConfirmRegen(true);
    };
    
    const closeProcessLog = () => {
        resetRunner([]); // Pulisce i log visivi
    };

    const executeRegeneration = async () => {
        if (!city) return;
        
        setShowConfirmRegen(false);

        // DEFINIZIONE STEP VISUALI
        const steps: StepReport[] = [
            { step: 'Analisi & Discovery (Flash)', status: 'pending', itemsCount: 0, durationMs: 0 },
            { step: 'Refinement & Merge (Pro)', status: 'pending', itemsCount: 0, durationMs: 0 },
            { step: 'Pulizia Database', status: 'pending', itemsCount: 0, durationMs: 0 },
            { step: 'Salvataggio Dati Certificati', status: 'pending', itemsCount: 0, durationMs: 0 }
        ];
        
        resetRunner(steps);
        addLog(`🚀 AVVIO RIGENERAZIONE SERVIZI: ${city.name}`);

        try {
            // 0. TRACK USAGE
            if (currentUser) {
                await incrementAiUsage(currentUser);
            }

            // 1. FASE DISCOVERY (FLASH)
            let rawData: any = {};
            await performStep('Analisi & Discovery (Flash)', async () => {
                const currentOperators = currentData.services.filter(s => s.type === 'tour_operator' || s.type === 'agency');
                const currentGeneric = currentData.services.filter(s => s.type !== 'tour_operator' && s.type !== 'agency');

                const existG = currentData.guides.map(i => i.name);
                const existE = currentData.events.map(i => i.name);
                const existO = currentOperators.map(i => i.name);
                const existS = currentGeneric.map(i => i.name);
                
                const servicesQuery = 'stazione ferroviaria, metro, porto, traghetti, ospedale, farmacia, polizia, carabinieri';

                const [rawGuides, rawEvents, rawOperators, rawServices] = await Promise.all([
                    suggestCityItems(city.name, 'guides', existG, '', 5),
                    suggestCityItems(city.name, 'events', existE, '', 5),
                    suggestCityItems(city.name, 'tour_operators', existO, '', 4),
                    suggestCityItems(city.name, 'services', existS, servicesQuery, 10) 
                ]);
                
                rawData = {
                    guides: [...currentData.guides, ...rawGuides],
                    events: [...currentData.events, ...rawEvents],
                    tour_operators: [...currentOperators, ...rawOperators],
                    services: [...currentGeneric, ...rawServices]
                };
                
                return rawGuides.length + rawEvents.length + rawOperators.length + rawServices.length;
            }, (count) => count, (count) => `${count} Nuovi elementi grezzi trovati`);
            
            // 2. FASE REFINEMENT (GEMINI PRO)
            let refinedData: any = {};
            await performStep('Refinement & Merge (Pro)', async () => {
                refinedData = await refineServiceData(city.name, rawData);
                const totalItems = (refinedData.guides?.length || 0) + (refinedData.events?.length || 0) + (refinedData.tour_operators?.length || 0) + (refinedData.services?.length || 0);
                return totalItems;
            }, (count) => count, (count) => `${count} Elementi unificati e bonificati`);

            // 3. CANCELLAZIONE DATI OBSOLETI
            await performStep('Pulizia Database', async () => {
                await Promise.all([
                    ...currentData.guides.map(g => deleteCityGuide(g.id)),
                    ...currentData.events.map(e => deleteCityEvent(e.id)),
                    ...currentData.services.map(s => deleteCityService(s.id))
                ]);
                return 1;
            }, () => 1, () => "Vecchi dati rimossi");

            // 4. SALVATAGGIO DATI PULITI
            await performStep('Salvataggio Dati Certificati', async () => {
                const savePromises: Promise<any>[] = [];

                if (refinedData.guides && Array.isArray(refinedData.guides)) {
                    refinedData.guides.forEach((g: any, i: number) => {
                        if (g && g.name) savePromises.push(saveCityGuide(city.id, { ...g, orderIndex: i + 1 }));
                    });
                }

                if (refinedData.events && Array.isArray(refinedData.events)) {
                    refinedData.events.forEach((e: any, i: number) => {
                        if (e && e.name) {
                            e.category = getSafeEventCategory(e.category || '');
                            savePromises.push(saveCityEvent(city.id, { ...e, orderIndex: i + 1 }));
                        }
                    });
                }

                if (refinedData.tour_operators && Array.isArray(refinedData.tour_operators)) {
                    refinedData.tour_operators.forEach((op: any, i: number) => {
                        if (op && op.name) {
                            op.type = 'tour_operator';
                            savePromises.push(saveCityService(city.id, { ...op, orderIndex: i + 1 }));
                        }
                    });
                }

                if (refinedData.services && Array.isArray(refinedData.services)) {
                    refinedData.services.forEach((s: any, i: number) => {
                        if (s && s.name) {
                            s.type = getSafeServiceType(s.type || s.category || s.name || ''); 
                            savePromises.push(saveCityService(city.id, { ...s, orderIndex: i + 1 }));
                        }
                    });
                }

                await Promise.all(savePromises);
                return savePromises.length;
            }, (count) => count, (count) => `${count} Record salvati nel DB`);

            const newLog = `[${new Date().toISOString()}] ✅ Fine: Rigenerazione Pagina Servizi (in 0s)`;
            const updatedCity = { ...city, details: { ...city.details, generationLogs: [...(city.details.generationLogs || []), newLog] } };
            await saveCityDetails(updatedCity);

            await reloadCurrentCity();
            
            // Reload local snapshot
            const [g, e, s] = await Promise.all([
                getCityGuides(city.id), 
                getCityEvents(city.id), 
                getCityServices(city.id)
            ]);
            setCurrentData({ guides: g, events: e, services: s });
            
            addLog("✅ Processo completato con successo!");

        } catch (err: any) {
            console.error("Errore rigenerazione:", err);
            addLog(`❌ ERRORE FATALE: ${err.message}`);
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
        closeProcessLog
    };
};
