import { generateCitySection, suggestCityItems, suggestCityPeople, refineServiceData, enrichPersonData, suggestNewPois } from '../../services/ai';
import { generateHistoricalPortrait } from '../../services/ai/aiVision'; 
import { saveCityDetails, saveCityPerson, saveCityGuide, saveCityEvent, saveCityService, saveSinglePoi, getCityPeople, deleteCityPerson, getCityDetails, getPoisByCityId } from '../../services/cityService';
import { reclaimOrphanedItems } from '../../services/city/cityLifecycleService';
import { findExistingPortrait } from '../../services/mediaService'; // NUOVO IMPORT
import { CityDetails, User, PointOfInterest, FamousPerson } from '../../types/index';
import { incrementAiUsage } from '../../services/aiUsageService';
import { getSafeEventCategory, getSafeServiceType, toTitleCase } from '../../utils/common';
import { useAiTaskRunner, StepReport } from './useAiTaskRunner';
import { ensureZoneExists, getTouristZones } from '../../services/zoneService';
import { getCorrectCategory } from '../../services/ai/utils/taxonomyUtils';
import { GEO_CONFIG } from '../../constants/geoConfig';
import { getGlobalImage } from '../../services/settingsService'; // NEW

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useAiMagicCity = (
    runner: ReturnType<typeof useAiTaskRunner>,
    verifyDraftsBatch: any // Type passed from parent
) => {
    // Usiamo il runner passato dal parent, così i log sono visibili nell'UI principale
    const { performStep, addLog, resetRunner, stopRunner, getAccumulatedLogs } = runner;

    // Recupera l'immagine default una volta sola (fuori dal loop)
    const defaultHero = getGlobalImage('hero');

    const executeMagicAdd = async (rawCityName: string, poiCount: number = 10, user?: User, existingCityId?: string) => {
        const cityName = toTitleCase(rawCityName);
        const isUpdateMode = !!existingCityId;
        
        let rawServicesData: any = {};
        
        const categoriesToGenerate = [
             {id: 'monument', label: 'Monumenti'}, 
             {id: 'food', label: 'Cibo & Sapori'}, 
             {id: 'nature', label: 'Natura & Relax'}, 
             {id: 'leisure', label: 'Svago & Nightlife'},
             {id: 'shop', label: 'Shopping & Artigianato'},
             {id: 'hotel', label: 'Hotel & Alloggi'}
        ];
        
        const poiSteps = categoriesToGenerate.map(cat => ({ 
            step: `Ricerca Flash: ${cat.label}`, 
            status: 'pending' as const, 
            itemsCount: 0, 
            durationMs: 0 
        }));

        const allSteps: StepReport[] = [
            { step: isUpdateMode ? 'Analisi & Popolamento (Arricchimento)' : 'Analisi & Creazione Città', status: 'pending', itemsCount: 0, durationMs: 0 },
            ...poiSteps, 
            { step: 'Bonifica Servizi & Eventi (Pro)', status: 'pending', itemsCount: 0, durationMs: 0 },
            { step: 'Validazione & Deep Check (Pro)', status: 'pending', itemsCount: 0, durationMs: 0 },
            { step: 'Finalizzazione & Log', status: 'pending', itemsCount: 0, durationMs: 0 }
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
                     existingPoiNames = existingPois.map(p => p.name);
                     
                     const cityDetails = await getCityDetails(existingCityId);
                     if (cityDetails) {
                         if (cityDetails.coords.lat !== 0) cityCenterCoords = cityDetails.coords;
                         if (cityDetails.description && cityDetails.description.length > 50 && Object.keys(cityDetails.details.ratings || {}).length > 0) {
                             isTrueDraft = true;
                         }
                     }
                } catch (e) {
                     console.warn("Errore fetch existing POIs", e);
                }
            }

            const knownZones = await getTouristZones();
            const knownZoneNames = knownZones.map(z => z.name);
            
            // STEP 1: ANALISI E POPOLAMENTO
            await performStep(isUpdateMode ? 'Analisi & Popolamento (Arricchimento)' : 'Analisi & Creazione Città', async () => {
                if (!cityId) cityId = `city_${Date.now()}_${Math.random().toString(36).substr(2,5)}`;
                const servicesQuery = 'stazione ferroviaria, metro, porto, traghetti, ospedale, farmacia, polizia, carabinieri, trasporti pubblici';

                // CONTEGGIO COSTO API ESATTO (REQUESTS):
                const apiCallsCount = isTrueDraft ? 4 : 9;
                if (user) await incrementAiUsage(user, apiCallsCount);

                let generalData: any = {}, statsData: any = {}, historyData: any = {}, ratingsData: any = {}, patronData: any = {};
                let guides: any[] = [], events: any[] = [], services: any[] = [], people: any[] = [];

                if (isTrueDraft) {
                    const [g, e, s, p] = await Promise.all([
                        suggestCityItems(cityName, 'guides', [], '', 3),
                        suggestCityItems(cityName, 'events', [], 'Cerca festival cinema, arte o musica.', 4),
                        suggestCityItems(cityName, 'services', [], servicesQuery, 10),
                        suggestCityPeople(cityName, [], '', 5) 
                    ]);
                    guides = g; events = e; services = s; people = p;
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
                        suggestCityPeople(cityName, [], '', 5) 
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

                let existingCityData: any = null;
                if (isUpdateMode) existingCityData = await getCityDetails(cityId);

                // CLEANUP: Usa il default globale invece di Unsplash hardcoded
                const cityPayload: CityDetails = {
                    id: cityId,
                    name: cityName,
                    zone: generalData.zone || (existingCityData?.zone || GEO_CONFIG.DEFAULT_REGION), 
                    adminRegion: generalData.adminRegion || (existingCityData?.adminRegion || GEO_CONFIG.DEFAULT_REGION),
                    nation: generalData.nation || (existingCityData?.nation || GEO_CONFIG.DEFAULT_NATION),
                    continent: generalData.continent || (existingCityData?.continent || GEO_CONFIG.DEFAULT_CONTINENT),
                    description: generalData.description || (existingCityData?.description || 'Generazione in corso...'),
                    imageUrl: (existingCityData?.imageUrl && !existingCityData.imageUrl.includes('unsplash')) ? existingCityData.imageUrl : defaultHero,
                    coords: (generalData.lat && generalData.lng && generalData.lat !== 0) 
                        ? { lat: generalData.lat, lng: generalData.lng } 
                        : (existingCityData?.coords || { lat: 0, lng: 0 }),
                    rating: existingCityData?.rating || 0,
                    visitors: statsData.visitorsEstimate || existingCityData?.visitors || 0,
                    isFeatured: existingCityData?.isFeatured || false,
                    status: 'draft', 
                    tags: existingCityData?.tags || [],
                    details: {
                        subtitle: generalData.subtitle || (existingCityData?.details?.subtitle || ''), 
                        heroImage: (existingCityData?.details?.heroImage && !existingCityData.details.heroImage.includes('unsplash')) ? existingCityData.details.heroImage : defaultHero,
                        historySnippet: historyData.historySnippet || (existingCityData?.details?.historySnippet || ''), 
                        historyFull: historyData.historyFull || (existingCityData?.details?.historyFull || ''), 
                        officialWebsite: generalData.officialWebsite || (existingCityData?.details?.officialWebsite || ''),
                        ratings: ratingsData.ratings ? { ...ratingsData.ratings } : (existingCityData?.details?.ratings || {}),
                        patron: patronData.patron?.name || (existingCityData?.details?.patron || ''),
                        patronDetails: patronData.patron ? { ...patronData.patron, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/79/Croce_del_campo1.jpg' } : (existingCityData?.details?.patronDetails || undefined),
                        seasonalVisitors: statsData.seasonalVisitors || (existingCityData?.details?.seasonalVisitors),
                        famousPeople: [], services: [], events: [], guides: [], gallery: [], allPois: [], topAttractions: [], foodSpots: [], hotels: [], newDiscoveries: [], leisureSpots: []
                    }
                };

                if (cityPayload.coords.lat !== 0) cityCenterCoords = cityPayload.coords;
                if (cityPayload.zone) await ensureZoneExists(cityPayload.zone, cityPayload.adminRegion);
                await saveCityDetails(cityPayload);

                const peoplePromises: Promise<any>[] = [];
                if (Array.isArray(people)) {
                    let orderIdx = 1;
                    for (const p of people) {
                        if (peoplePromises.length > 0) await delay(4000);

                        if (p && p.name) {
                            let imageUrl = p.imageUrl || '';
                            if (!imageUrl || imageUrl.includes('unsplash') || imageUrl.includes('ui-avatars')) {
                                try {
                                    const generated = await generateHistoricalPortrait(p.name, p.role, cityName);
                                    if (generated) {
                                        imageUrl = generated;
                                        if(user) await incrementAiUsage(user, 1);
                                    }
                                } catch (err) {}
                            }
                            await saveCityPerson(cityId, { 
                                ...p, imageUrl: imageUrl, status: 'draft', orderIndex: orderIdx++ 
                            });
                        }
                    }
                }
                
                rawServicesData = { guides, events, services, tour_operators: [] };
                return 1;
            });

            // STEP 2: FLASH GATHERING POI
            for (const cat of categoriesToGenerate) {
                await delay(2000); 
                if (user) await incrementAiUsage(user, 1);

                await performStep(`Ricerca Flash: ${cat.label}`, async () => {
                    const items = await suggestNewPois(cityName, existingPoiNames, undefined, poiCount, cat.id);
                    let savedForCat = 0;
                    if (items && items.length > 0) {
                        for (const pData of items) {
                            const safeSub = pData.subCategory || 'generic';
                            const correctCategory = getCorrectCategory(safeSub, pData.category || cat.id, pData.name);
                            const newPoi: PointOfInterest = {
                                id: `draft_${Date.now()}_${Math.random().toString(36).substr(2,6)}`,
                                name: pData.name,
                                category: correctCategory as any,
                                subCategory: pData.subCategory, 
                                description: pData.description || "Bozza da validare",
                                imageUrl: '', coords: { lat: 0, lng: 0 }, rating: 0, votes: 0,
                                address: pData.address || `${cityName}, Italia`,
                                cityId: cityId,
                                status: 'draft', dateAdded: new Date().toISOString(),
                                aiReliability: 'low', tourismInterest: pData.tourismInterest || 'medium',
                                lastVerified: new Date().toISOString(),
                                openingHours: { days: ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"], morning: "09:00 - 20:00", afternoon: "", isEstimated: true }
                            };
                            await saveSinglePoi(newPoi, cityId);
                            existingPoiNames.push(pData.name);
                            savedForCat++;
                        }
                    }
                    return savedForCat;
                }, (cnt) => cnt);
            }

            // STEP 3: REFINEMENT SERVIZI
            await performStep('Bonifica Servizi & Eventi (Pro)', async () => {
                 if (user) await incrementAiUsage(user, 1); 

                 const refinedData = await refineServiceData(cityName, rawServicesData);
                 const savePromises: Promise<any>[] = [];

                 if (refinedData.guides) refinedData.guides.forEach((g: any, i: number) => savePromises.push(saveCityGuide(cityId, { ...g, orderIndex: i + 1 })));
                 if (refinedData.events) refinedData.events.forEach((e: any, i: number) => {
                     if (e && e.name) {
                         const safeCat = getSafeEventCategory(e.category || '');
                         const metadata = { rating: e.rating || 0, visitors: e.visitors || 0, summary: e.description };
                         savePromises.push(saveCityEvent(cityId, { ...e, category: safeCat, orderIndex: i + 1, metadata }));
                     }
                 });
                 if (refinedData.tour_operators) refinedData.tour_operators.forEach((op: any, i: number) => savePromises.push(saveCityService(cityId, { ...op, type: 'tour_operator', orderIndex: i + 1 })));
                 if (refinedData.services) refinedData.services.forEach((s: any, i: number) => savePromises.push(saveCityService(cityId, { ...s, type: getSafeServiceType(s.type || s.category), orderIndex: i + 1 })));
                 
                 await Promise.all(savePromises);
                 return 1;
            });

            // STEP 4: VALIDAZIONE
            await performStep('Validazione & Deep Check (Pro)', async () => {
                const verifiedCount = (await verifyDraftsBatch(cityId, cityName, user, undefined, undefined, { keepLogs: true })) || 0;
                
                const currentPeople = await getCityPeople(cityId);
                const draftPeople = currentPeople.filter(p => p.status === 'draft');
                
                let enrichedPeopleCount = 0;
                for (const person of draftPeople) {
                    try {
                        if (enrichedPeopleCount > 0) await delay(5000);
                        if (user) await incrementAiUsage(user, 1);

                        const enrichedData = await enrichPersonData(person.name, cityName);
                        if (enrichedData) {
                            let finalImage = person.imageUrl;
                            if (!finalImage || finalImage.includes('ui-avatars')) {
                                const newImg = await generateHistoricalPortrait(person.name, enrichedData.role || person.role, cityName);
                                if (newImg) {
                                     finalImage = newImg;
                                     if(user) await incrementAiUsage(user, 1); 
                                }
                            }
                            const updatedPerson: FamousPerson = { ...person, ...enrichedData, imageUrl: finalImage, role: enrichedData.role || person.role, bio: enrichedData.bio || person.bio, status: 'published' };
                            await saveCityPerson(cityId, updatedPerson);
                            enrichedPeopleCount++;
                        }
                    } catch (err) {}
                }
                return (verifiedCount || 0) + (enrichedPeopleCount || 0);
            }, (count) => count);

            // STEP 5: FINAL
            await performStep('Finalizzazione & Log', async () => {
                 const finalCity = await getCityDetails(cityId);
                 if (finalCity) {
                     finalCity.details.generationLogs = getAccumulatedLogs();
                     await saveCityDetails(finalCity, { skipReclaim: false });
                 }
                 return 1;
            });

            addLog("✅ COMPLETAMENTO CITTÀ TERMINATO CON SUCCESSO.");

        } catch (e: any) {
             if (e.message === 'QUOTA_EXCEEDED_DAILY') {
                addLog(`⚠️ PROCESSO INTERROTTO: Quota API esaurita.`);
             } else {
                addLog(`❌ ERRORE CRITICO: ${e.message}`);
             }
        } finally {
            stopRunner(); 
        }
    };

    return { executeMagicAdd };
};