
import { useAiTaskRunner, StepReport } from './useAiTaskRunner';
import { generateCitySection, suggestCityItems, suggestCityPeople, refineServiceData, enrichPersonData } from '../../services/ai';
import { generateHistoricalPortrait } from '../../services/ai/aiVision';
import { saveCityDetails, saveCityPerson, saveCityGuide, saveCityEvent, saveCityService, getCityPeople, deleteCityPerson, getCityDetails } from '../../services/cityService';
import { reclaimOrphanedItems } from '../../services/city/cityLifecycleService';
import { findExistingPortrait } from '../../services/mediaService'; // NUOVO IMPORT
import { CityDetails, User, FamousPerson } from '../../types/index';
import { incrementAiUsage } from '../../services/aiUsageService';
import { getSafeEventCategory, getSafeServiceType } from '../../utils/common';

const DEFAULT_MASTER_PATRON = "https://upload.wikimedia.org/wikipedia/commons/7/79/Croce_del_campo1.jpg";
const DEFAULT_RATINGS = { cultura: 50, monumenti: 50, musei_arte: 50, tradizione: 50, architettura: 50, natura: 50, mare_spiagge: 50, paesaggi: 50, clima: 50, sostenibilita: 50, gusto: 50, cucina: 50, vita_notturna: 50, caffe_bar: 50, mercati: 50, viaggiatore: 50, mobilita: 50, accoglienza: 50, costo: 50, sicurezza: 50 };

export const useAiCompleteCity = (
    runner: ReturnType<typeof useAiTaskRunner>,
    verifyDraftsBatch: any // Type passed from parent
) => {
    // Usiamo il runner passato dal parent, così i log sono visibili nell'UI principale
    const { addLog, performStep, resetRunner, stopRunner, getAccumulatedLogs } = runner;

    const executeCompleteCity = async (
        cityId: string, 
        cityName: string, 
        config: { peopleCount: number, runPoiDeepScan: boolean }, 
        user?: User
    ) => {
        // DEFINIZIONE STEP
        const steps: StepReport[] = [
            { step: 'Setup & Reclaim Dati', status: 'pending', itemsCount: 0, durationMs: 0 },
            { step: 'Generali & Statistiche', status: 'pending', itemsCount: 0, durationMs: 0 },
            { step: 'Valutazioni & Ratings', status: 'pending', itemsCount: 0, durationMs: 0 },
            { step: 'Storia & Cultura', status: 'pending', itemsCount: 0, durationMs: 0 },
            { step: `Generazione Personaggi (${config.peopleCount})`, status: 'pending', itemsCount: 0, durationMs: 0 },
            { step: 'Merge & Fix Servizi (Info & Guide)', status: 'pending', itemsCount: 0, durationMs: 0 },
            { step: 'Reset Media (Hero)', status: 'pending', itemsCount: 0, durationMs: 0 },
        ];

        if (config.runPoiDeepScan) {
            steps.push({ step: 'Bonifica POI Pro (Daily)', status: 'pending', itemsCount: 0, durationMs: 0 });
        }
        
        steps.push({ step: 'Finalizzazione & Log', status: 'pending', itemsCount: 0, durationMs: 0 });

        resetRunner(steps);
        addLog(`🚀 AVVIO COMPLETAMENTO TOTALE: ${cityName}`);

        try {
            if (user) await incrementAiUsage(user);

            // Carica la città attuale
            let currentCity = await getCityDetails(cityId);
            if (!currentCity) throw new Error("Città non trovata.");

            // 0. RECLAIM PREVENTIVO (Una tantum all'inizio)
            await performStep('Setup & Reclaim Dati', async () => {
                await reclaimOrphanedItems(cityId, cityName);
                return 1;
            }, () => 1, () => "Dati orfani recuperati");

            // 1. GENERALI & STATS
            await performStep('Generali & Statistiche', async () => {
                const [generalData, statsData] = await Promise.all([
                    generateCitySection(cityName, 'general'),
                    generateCitySection(cityName, 'stats')
                ]);

                const newDetails = { ...currentCity!.details };
                if (generalData.subtitle) newDetails.subtitle = generalData.subtitle;
                if (generalData.officialWebsite) newDetails.officialWebsite = generalData.officialWebsite;
                if (statsData.seasonalVisitors) newDetails.seasonalVisitors = statsData.seasonalVisitors;

                const updated: CityDetails = {
                    ...currentCity!,
                    description: generalData.description || currentCity!.description,
                    zone: generalData.zone || currentCity!.zone,
                    adminRegion: generalData.adminRegion || currentCity!.adminRegion,
                    nation: generalData.nation || currentCity!.nation,
                    continent: generalData.continent || currentCity!.continent,
                    coords: (generalData.lat && generalData.lng) ? { lat: generalData.lat, lng: generalData.lng } : currentCity!.coords,
                    visitors: statsData.visitorsEstimate || currentCity!.visitors,
                    details: newDetails
                };
                currentCity = updated; // Update local reference
                // SKIP RECLAIM: Già fatto all'inizio
                await saveCityDetails(updated, { skipReclaim: true });
                return 1;
            });

            // 2. RATINGS
            await performStep('Valutazioni & Ratings', async () => {
                const data = await generateCitySection(cityName, 'ratings');
                const newDetails = { ...currentCity!.details };
                newDetails.ratings = { ...DEFAULT_RATINGS, ...data.ratings };
                
                const updated = { ...currentCity!, details: newDetails };
                currentCity = updated;
                await saveCityDetails(updated, { skipReclaim: true });
                return 1;
            });

            // 3. STORIA & CULTURA
            await performStep('Storia & Cultura', async () => {
                const [historyData, patronData] = await Promise.all([
                    generateCitySection(cityName, 'history'),
                    generateCitySection(cityName, 'patron')
                ]);

                const newDetails = { ...currentCity!.details };
                newDetails.historySnippet = historyData.historySnippet || '';
                newDetails.historyFull = historyData.historyFull || '';

                if (patronData.patron) {
                     newDetails.patronDetails = { 
                         ...newDetails.patronDetails, 
                         ...patronData.patron, 
                         imageUrl: currentCity!.details.patronDetails?.imageUrl || DEFAULT_MASTER_PATRON 
                     };
                     newDetails.patron = patronData.patron.name;
                }

                const updated = { ...currentCity!, details: newDetails };
                currentCity = updated;
                await saveCityDetails(updated, { skipReclaim: true });
                return 1;
            });

            // 4. PERSONAGGI (CON RECUPERO STORAGE)
            await performStep(`Generazione Personaggi (${config.peopleCount})`, async () => {
                const existingPeople = await getCityPeople(cityId);
                await Promise.all(existingPeople.map(p => deleteCityPerson(p.id!)));

                const suggestions = await suggestCityPeople(cityName, [], '', config.peopleCount);
                
                let savedCount = 0;
                let orderIdx = 1;
                
                for (const p of suggestions) {
                    // THROTTLING: Pausa tra le generazioni immagini per evitare 429
                    await new Promise(r => setTimeout(r, 2000));
                    
                    let imageUrl = p.imageUrl;
                    
                    // 1. Controlla se abbiamo un URL valido
                    if (!imageUrl || imageUrl.includes('unsplash') || imageUrl.includes('ui-avatars')) {
                        // 2. PRIMA CONTROLLA LO STORAGE (Recupero Fantasmi)
                        const existingUrl = await findExistingPortrait(p.name);
                        
                        if (existingUrl) {
                            imageUrl = existingUrl;
                            // addLog(`📸 Foto recuperata per: ${p.name}`); // (Opzionale: verbose)
                        } else {
                            // 3. SE NON ESISTE, GENERA (Con Fallback Flash)
                            try {
                                const generated = await generateHistoricalPortrait(p.name, p.role, cityName);
                                if (generated) imageUrl = generated;
                            } catch (err) {
                                console.warn(`Img failed for ${p.name}`);
                            }
                        }
                    }

                    await saveCityPerson(cityId, {
                        ...p,
                        imageUrl: imageUrl || '',
                        status: 'draft',
                        orderIndex: orderIdx++
                    });
                    savedCount++;
                }
                return savedCount;
            }, (c) => c);

            // 5. SERVIZI
            await performStep('Merge & Fix Servizi (Info & Guide)', async () => {
                const [rawGuides, rawEvents, rawOperators, rawServices] = await Promise.all([
                    suggestCityItems(cityName, 'guides', [], '', 3),
                    suggestCityItems(cityName, 'events', [], '', 4),
                    suggestCityItems(cityName, 'tour_operators', [], '', 3),
                    suggestCityItems(cityName, 'services', [], 'trasporti, farmacie, ospedali', 8)
                ]);

                const mixedInput = {
                    guides: rawGuides,
                    events: rawEvents,
                    tour_operators: rawOperators,
                    services: rawServices
                };
                
                const refinedData = await refineServiceData(cityName, mixedInput);

                const savePromises: Promise<any>[] = [];
                if (refinedData.guides) refinedData.guides.forEach((g: any, i: number) => savePromises.push(saveCityGuide(cityId, { ...g, orderIndex: i + 1 })));
                if (refinedData.events) refinedData.events.forEach((e: any, i: number) => savePromises.push(saveCityEvent(cityId, { ...e, category: getSafeEventCategory(e.category), orderIndex: i + 1 })));
                if (refinedData.tour_operators) refinedData.tour_operators.forEach((op: any, i: number) => savePromises.push(saveCityService(cityId, { ...op, type: 'tour_operator', orderIndex: i + 1 })));
                if (refinedData.services) refinedData.services.forEach((s: any, i: number) => savePromises.push(saveCityService(cityId, { ...s, type: getSafeServiceType(s.type || s.category), orderIndex: i + 1 })));

                await Promise.all(savePromises);
                return savePromises.length;
            }, (c) => c);

            // 6. MEDIA
            await performStep('Reset Media (Hero)', async () => {
                const newHero = `https://images.unsplash.com/photo-1596825205486-3c36957b9fba?q=80&w=1200&sig=${Date.now()}`;
                const newDetails = { ...currentCity!.details, heroImage: newHero };
                const updated = { ...currentCity!, imageUrl: newHero, details: newDetails };
                currentCity = updated;
                await saveCityDetails(updated, { skipReclaim: true });
                return 1;
            });

            // 7. POI DEEP SCAN
            if (config.runPoiDeepScan) {
                // Eseguiamo il deep scan usando la funzione passata (che usa il runner condiviso)
                // Passiamo keepLogs: true per non resettare la lista step
                await verifyDraftsBatch(cityId, cityName, user, undefined, undefined, { keepLogs: true });
            }

            // FINALIZZAZIONE
            await performStep('Finalizzazione & Log', async () => {
                 const finalCity = await getCityDetails(cityId);
                 if (finalCity) {
                     finalCity.details.generationLogs = getAccumulatedLogs();
                     // Salvataggio finale: qui riattiviamo il reclaim per sicurezza finale
                     await saveCityDetails(finalCity, { skipReclaim: false });
                 }
                 return 1;
            });

            addLog("✅ COMPLETAMENTO CITTÀ TERMINATO CON SUCCESSO.");

        } catch (e: any) {
            addLog(`❌ ERRORE CRITICO: ${e.message}`);
            // Non fermiamo il runner qui per permettere all'utente di vedere l'errore
        } finally {
             stopRunner();
        }
    };

    return { executeCompleteCity };
};
