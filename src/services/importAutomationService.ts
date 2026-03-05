
import { 
    getStagingItemsByIds, 
    updateStagingAiRatings, 
    promoteToLive,
    updateStagingStatus
} from './stagingService';
import { ratePoiBatch } from './ai/generators/qualityGenerator';

export interface AutomationResult {
    totalRequested: number;
    processed: number;
    success: number;
    errors: number;
    quotaExceeded: boolean;
}

export type ProgressCallback = (progress: string) => void;

/**
 * Esegue l'analisi AI in batch (Quality Filter) sugli elementi selezionati.
 * Gestisce il loop, il partizionamento (Batch 25) e il salvataggio progressivo.
 * FIX: Include "Gap Analysis" per gestire elementi saltati dall'AI.
 */
export const runAiAnalysisService = async (
    cityName: string, 
    ids: string[], 
    onProgress?: ProgressCallback
): Promise<AutomationResult> => {
    
    const result: AutomationResult = {
        totalRequested: ids.length,
        processed: 0,
        success: 0,
        errors: 0,
        quotaExceeded: false
    };

    // 1. Recupero Dati Freschi dal DB
    const targetsData = await getStagingItemsByIds(ids);
    
    const targets = targetsData.map(i => ({ 
        id: i.id, 
        name: i.name, 
        rawCategory: i.raw_category, 
        address: i.address 
    }));

    if (targets.length === 0) return result;

    const BATCH_SIZE = 25; 
    
    // 2. Loop Batch (Logica corretta 0-based)
    for (let i = 0; i < targets.length; i += BATCH_SIZE) {
        if (result.quotaExceeded) break;

        const batch = targets.slice(i, i + BATCH_SIZE);
        const currentBatchNum = Math.ceil((i + 1) / BATCH_SIZE);
        const totalBatches = Math.ceil(targets.length / BATCH_SIZE);

        if (onProgress) {
            onProgress(`Analisi Batch ${currentBatchNum}/${totalBatches} (${result.processed}/${result.totalRequested} elementi)...`);
        }
        
        try {
            // Chiamata AI (Gemini Flash)
            const ratings = await ratePoiBatch(cityName, batch);
            
            // --- FIX GAP ANALYSIS ---
            // A volte l'AI non restituisce un rating per tutti gli elementi del batch.
            // Identifichiamo quelli mancanti e li forziamo per evitare che rimangano in 'new'.
            
            const returnedIds = new Set(ratings.map(r => r.id));
            const missingItems = batch.filter(item => !returnedIds.has(item.id));
            
            // Aggiungi i mancanti con un rating di default (Safety net)
            // Se l'AI non ha saputo classificarlo, probabilmente è poco rilevante (Low) o spazzatura.
            // Usiamo 'low' per sicurezza così l'utente lo vede in 'Ready' e può decidere.
            const recoveredRatings = missingItems.map(item => ({
                id: item.id,
                rating: 'low' as const, // Default fallback
                reason: 'AI Timeout/Skip - Recuperato da Gap Analysis'
            }));

            const finalRatings = [...ratings, ...recoveredRatings];

            if (finalRatings.length > 0) {
                // Salvataggio DB parziale (Progressivo)
                await updateStagingAiRatings(finalRatings);
                result.success += finalRatings.length;
                result.processed += batch.length; // Conta tutto il batch come processato
                
                if (recoveredRatings.length > 0) {
                    console.log(`[ImportAutomation] Recuperati ${recoveredRatings.length} elementi saltati dall'AI.`);
                }
            } else {
                result.errors += batch.length;
                result.processed += batch.length;
            }
            
            // Pausa di cortesia
            await new Promise(r => setTimeout(r, 600));

        } catch (e: any) {
            const errMsg = e.message || JSON.stringify(e);
            if (errMsg.includes('429') || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('resource_exhausted')) {
                result.quotaExceeded = true;
                console.warn("[ImportAutomation] Quota AI esaurita durante l'analisi.");
                break; 
            } else {
                console.error("[ImportAutomation] Errore Batch Generico:", e);
                // In caso di errore batch totale, non possiamo fare gap analysis facilmente
                // Ma marchiamo il batch come processato (con errore) per non bloccare la UI
                result.errors += batch.length;
                result.processed += batch.length;
            }
        }
    }
    
    return result;
};

/**
 * Esegue la pubblicazione (promozione a Live) degli elementi selezionati.
 */
export const runPublishingService = async (
    cityName: string,
    ids: string[],
    onProgress?: ProgressCallback
): Promise<{ successCount: number, errorQuota: boolean }> => {
    
    const targets = await getStagingItemsByIds(ids);
    let successCount = 0;
    let processed = 0;
    let errorQuota = false;

    // Loop Sequenziale
    for (const item of targets) {
        if (errorQuota) break;

        processed++;
        if (onProgress) {
            onProgress(`Importazione: ${processed}/${targets.length} - ${item.name}`);
        }
        
        try {
            // promoteToLive ora forza lo stato 'draft'
            const success = await promoteToLive(item, cityName, false); 
            if (success) successCount++;
            
        } catch (innerErr: any) {
            const msg = innerErr.message || JSON.stringify(innerErr);
            if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.includes('403')) {
                errorQuota = true;
            } else {
                console.error(`[ImportAutomation] Errore importazione item ${item.id}`, innerErr);
            }
        }
        
        await new Promise(r => setTimeout(r, 1500));
    }

    return { successCount, errorQuota };
};

export const runBulkStatusUpdateService = async (
    ids: string[], 
    status: 'ready' | 'discarded' | 'new',
    onProgress?: ProgressCallback
): Promise<void> => {
    const CHUNK = 500;
    for (let i = 0; i < ids.length; i += CHUNK) {
        if (onProgress) onProgress(`Aggiornamento blocco ${Math.ceil((i + 1) / CHUNK)}...`);
        
        await updateStagingStatus(ids.slice(i, i + CHUNK), status);
        
        await new Promise(r => setTimeout(r, 50));
    }
};
