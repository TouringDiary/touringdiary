
import { suggestNewPois } from '../../services/ai';
import { saveSinglePoi } from '../../services/cityService';
import { PointOfInterest, User } from '../../types/index';
import { incrementAiUsage } from '../../services/aiUsageService';
import { useAiTaskRunner, StepReport } from './useAiTaskRunner';
import { getCorrectCategory } from '../../services/ai/utils/taxonomyUtils';

// Helper delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useAiFlashSearch = (
    runner: ReturnType<typeof useAiTaskRunner>
) => {
    const { performStep, addLog, resetRunner, stopRunner } = runner;

    const generateDraftsOnly = async (
        cityId: string, 
        cityName: string, 
        poiCount: number, 
        categories: {id:string, label:string}[], 
        user?: User
    ) => {
        const initialSteps: StepReport[] = categories.map(cat => ({ 
            step: `Ricerca Flash: ${cat.label}`, 
            status: 'pending' as const, 
            itemsCount: 0, 
            durationMs: 0 
        }));
        
        resetRunner(initialSteps);
        addLog(`🚀 AVVIO RICERCA FLASH (Bozze non validate): ${cityName}`);

        try {
            if (user) await incrementAiUsage(user);

            for (const cat of categories) {
                await delay(300); // Piccolo delay per non saturare
                
                await performStep(`Ricerca Flash: ${cat.label}`, async () => {
                    // Genera con Flash
                    const draftPois = await suggestNewPois(cityName, [], undefined, poiCount, cat.id);
                    
                    // Salva subito come BOZZA (Draft) senza validazione
                    let savedCount = 0;
                    if (draftPois && draftPois.length > 0) {
                        for (const pData of draftPois) {
                            const safeSub = pData.subCategory || 'generic';
                            // Usa la tassonomia intelligente anche qui
                            const correctCategory = getCorrectCategory(safeSub, (pData.category as any) || cat.id, pData.name);

                            const newPoi: PointOfInterest = {
                                id: `draft_${Date.now()}_${Math.random().toString(36).substr(2,6)}`,
                                name: pData.name,
                                category: correctCategory as any,
                                subCategory: pData.subCategory, 
                                description: pData.description || "Bozza da validare",
                                imageUrl: '', 
                                coords: { lat: 0, lng: 0 }, // 0,0 indica che necessita validazione Pro
                                rating: 0,
                                votes: 0,
                                address: pData.address || `${cityName}, Italia`,
                                cityId: cityId,
                                status: 'draft', 
                                dateAdded: new Date().toISOString(),
                                aiReliability: 'low', // Segnala che è grezzo
                                tourismInterest: pData.tourismInterest || 'medium', // FIX: Mappatura Interesse
                                lastVerified: new Date().toISOString() // SET DATA CREAZIONE COME PRIMA VERIFICA
                            };
                            await saveSinglePoi(newPoi, cityId);
                            savedCount++;
                        }
                    }
                    return savedCount;
                }, (count) => count);
            }
            addLog("✅ Ricerca Flash completata. I POI sono in stato 'Bozza'. Usa 'Valida POI - Pro' per la bonifica.");
        } catch (e: any) {
            addLog(`❌ ERRORE FLASH: ${e.message}`);
        } finally {
            stopRunner();
        }
    };

    return { generateDraftsOnly };
};
