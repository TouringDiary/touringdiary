
import { suggestNewPois } from '../../services/ai';
import { saveSinglePoi } from '../../services/cityService';
import { PointOfInterest, User } from '../../types/index';
import { incrementAiUsage } from '../../services/aiUsageService';
import { useAiTaskRunner, StepReport } from './useAiTaskRunner';
import { getCorrectCategory } from '../../services/ai/utils/taxonomyUtils';

// Helper delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useAiTargetedSearch = (
    runner: ReturnType<typeof useAiTaskRunner>
) => {
    const { performStep, addLog, resetRunner, stopRunner } = runner;

    const generateTargetedPois = async (
        cityId: string,
        cityName: string,
        categoriesToSearch: Record<string, number>,
        user?: User
    ) => {
        const steps: StepReport[] = Object.entries(categoriesToSearch).map(([catId, count]) => ({
            step: `Ricerca Mirata: ${catId} (${count} item)`,
            status: 'pending',
            itemsCount: 0,
            durationMs: 0
        }));

        resetRunner(steps);
        addLog(`🚀 AVVIO RICERCA MIRATA: ${cityName}`);

        try {
            if (user) await incrementAiUsage(user);

            let totalSaved = 0;

            for (const [catId, count] of Object.entries(categoriesToSearch)) {
                await delay(300);

                await performStep(`Ricerca Mirata: ${catId} (${count} item)`, async () => {
                    const items = await suggestNewPois(cityName, [], `Solo luoghi di tipo ${catId}`, count, catId);
                    
                    let savedForCat = 0;
                    if (items && items.length > 0) {
                        for (const pData of items) {
                            
                            // --- AUTOMATIC TAXONOMY FIX (AUTO-FIX ON INSERT) ---
                            // Calcola la categoria corretta basata su nome e sottocategoria PRIMA di salvare
                            const safeSub = pData.subCategory || 'generic';
                            const correctCategory = getCorrectCategory(safeSub, pData.category || catId, pData.name);

                            const newPoi: PointOfInterest = {
                                id: `draft_${Date.now()}_${Math.random().toString(36).substr(2,6)}`,
                                name: pData.name,
                                category: correctCategory as any,
                                subCategory: pData.subCategory, 
                                description: pData.description || "Bozza da validare",
                                imageUrl: '', 
                                coords: { lat: 0, lng: 0 }, 
                                rating: 0, votes: 0,
                                address: pData.address || `${cityName}, Italia`,
                                cityId: cityId,
                                status: 'draft', 
                                dateAdded: new Date().toISOString(),
                                aiReliability: 'low',
                                tourismInterest: pData.tourismInterest || 'medium', // FIX: Added mapping
                                lastVerified: new Date().toISOString(), // TIMESTAMP CREAZIONE
                                openingHours: {
                                    days: ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"],
                                    morning: "09:00 - 20:00",
                                    afternoon: "",
                                    isEstimated: true 
                                }
                            };
                            await saveSinglePoi(newPoi, cityId);
                            savedForCat++;
                        }
                    }
                    totalSaved += savedForCat;
                    return savedForCat;
                }, (cnt) => cnt);
            }

            addLog(`✅ Ricerca mirata completata. Salvate ${totalSaved} nuove bozze.`);

        } catch (e: any) {
            if (e.message === 'QUOTA_EXCEEDED_DAILY') {
                 addLog("⛔ STOP: Quota giornaliera Google esaurita.");
            } else {
                 addLog(`❌ ERRORE RICERCA MIRATA: ${e.message}`);
            }
        } finally {
            stopRunner();
        }
    };

    return { generateTargetedPois };
};
