
import { useState, useRef, useCallback } from 'react';
import { saveSinglePoi, deleteSinglePoi, getPoisByCityId, getPoisForDeepScan } from '../../services/cityService';
import { getCorrectCategory } from '../../services/ai/utils/taxonomyUtils';
import { enrichStagingPoi } from '../../services/ai/generators/poiGenerator';
import { PointOfInterest, User } from '../../types/index';

interface UsePoiActionsProps {
    cityId: string;
    refreshData: () => Promise<void>;
    selectedIds: Set<string>;
    setSelectedIds: (ids: Set<string>) => void;
}

export const usePoiActions = ({ cityId, refreshData, selectedIds, setSelectedIds }: UsePoiActionsProps) => {
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);
    const [isFixingTaxonomy, setIsFixingTaxonomy] = useState(false);
    const [genStatus, setGenStatus] = useState('');
    
    // Riferimento per interrompere processi lunghi
    const stopSignalRef = useRef(false);

    // --- SINGLE ACTIONS ---

    const savePoi = async (poi: PointOfInterest, currentUser?: User) => {
        setIsSaving(true);
        try {
            await saveSinglePoi(poi, cityId, currentUser);
            await refreshData();
            return true;
        } catch (e: any) {
            alert(`Errore salvataggio: ${e.message}`);
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const deletePoi = async (id: string) => {
        setIsDeleting(true);
        try {
            await deleteSinglePoi(id);
            await new Promise(r => setTimeout(r, 200)); // Delay per propagazione
            await refreshData();
            return true;
        } catch (e: any) {
            alert(`Errore eliminazione: ${e.message}`);
            return false;
        } finally {
            setIsDeleting(false);
        }
    };

    // --- BULK ACTIONS ---

    const bulkDelete = async () => {
        if (selectedIds.size === 0) return;
        setIsBulkProcessing(true);
        try {
            const targets = Array.from(selectedIds);
            // Esegui in parallelo (o chunked se troppi)
            await Promise.all(targets.map(id => deleteSinglePoi(id)));
            
            setSelectedIds(new Set());
            await refreshData();
        } catch (e: any) {
            alert("Errore eliminazione multipla.");
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const bulkStatusChange = async (targetStatus: 'published' | 'draft', getPoiById: (id:string) => PointOfInterest | undefined, currentUser?: User) => {
        if (selectedIds.size === 0) return;
        setIsBulkProcessing(true);
        try {
            const targets = Array.from(selectedIds);
            await Promise.all(targets.map(id => {
                const poi = getPoiById(id);
                if (poi) return saveSinglePoi({ ...poi, status: targetStatus }, cityId, currentUser);
                return Promise.resolve();
            }));
            
            setSelectedIds(new Set());
            await refreshData();
        } catch(e) {
            alert("Errore cambio stato multiplo.");
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const bulkResetImages = async (getPoiById: (id:string) => PointOfInterest | undefined, currentUser?: User) => {
        if (selectedIds.size === 0) return;
        setIsBulkProcessing(true);
        setGenStatus('Reset immagini...');
        try {
            const targets = Array.from(selectedIds);
            await Promise.all(targets.map(async (id) => {
                const poi = getPoiById(id);
                if (poi) {
                    await saveSinglePoi({ ...poi, imageUrl: '' }, cityId, currentUser);
                }
            }));
            await refreshData();
        } catch (e: any) {
            alert("Errore reset immagini.");
        } finally {
            setIsBulkProcessing(false);
            setGenStatus('');
        }
    };

    const fixTaxonomy = async () => {
        setIsFixingTaxonomy(true);
        setGenStatus('Analisi tassonomia...');
        try {
            let fixedCount = 0;
            const allPois = await getPoisByCityId(cityId);

            for (const p of allPois) {
                const correctCat = getCorrectCategory(p.subCategory || '', p.category, p.name);
                if (correctCat !== p.category) {
                    await saveSinglePoi({ ...p, category: correctCat as any }, cityId);
                    fixedCount++;
                }
            }

            if (fixedCount > 0) {
                alert(`Tassonomia corretta per ${fixedCount} POI.`);
                await refreshData();
            } else {
                alert("Tassonomia già corretta per tutti i POI.");
            }
        } catch (e: any) {
            alert(`Errore fix tassonomia: ${e.message}`);
        } finally {
            setIsFixingTaxonomy(false);
            setGenStatus('');
        }
    };
    
    // --- DAILY DEEP SCAN (BONIFICA GIORNALIERA CON LOGICA "+") ---
    const executeDailyDeepScan = async (cityName: string, currentUser?: User) => {
        setIsBulkProcessing(true);
        stopSignalRef.current = false;
        setGenStatus('Avvio bonifica Pro...');
        
        let processedCount = 0;
        let quotaExceeded = false;
        
        try {
            // Ciclo a blocchi di 5 per non saturare subito se la quota è bassa
            while (!stopSignalRef.current && !quotaExceeded) {
                // 1. Fetch batch di POI che NON hanno il flag "+"
                const batch = await getPoisForDeepScan(cityId, 5);
                
                if (batch.length === 0) {
                    setGenStatus('Tutti i POI sono stati bonificati!');
                    break;
                }
                
                for (const poi of batch) {
                    if (stopSignalRef.current) break;
                    
                    setGenStatus(`Bonifica: ${poi.name}...`);
                    
                    try {
                        // 2. Chiamata Gemini Pro + Search (useSearch = true)
                        // Questa chiamata ora ritorna anche un turismoInterest aggiornato basato sui fatti reali
                        const enriched = await enrichStagingPoi(poi.name, cityName, poi.category, true);
                        
                        // 3. Calcolo Nuovo Status "Bonificato"
                        // Prendiamo l'interesse calcolato da Pro (high/medium/low) e aggiungiamo il "+"
                        // Questo "+" impedisce che venga ripescato dalla query, ma preserva l'info sull'importanza.
                        const rawInterest = enriched.tourismInterest || 'medium';
                        const newReliability: PointOfInterest['aiReliability'] = `${rawInterest}+` as any;
                        
                        // Se l'AI Pro dice che non esiste o è dubbio, lo marchiamo in check/invalidated
                        let finalStatus = enriched.status || 'published';
                        let finalReliability = newReliability;
                        
                        if (finalStatus === 'needs_check') {
                             // Se Pro ha dubbi seri, non mettiamo il +, ma lo mettiamo in check o invalidated
                             // Però per "uscire dalla lista", dobbiamo comunque marcarlo in qualche modo.
                             // Usiamo 'low+' se vogliamo che sia "verificato come scarso/dubbio" e non più processato.
                             finalReliability = 'low+'; 
                             finalStatus = 'needs_check';
                        }
                        
                        // 4. Update POI con i nuovi dati e il flag
                        const updatedPoi: PointOfInterest = {
                            ...poi,
                            description: enriched.description || poi.description,
                            address: enriched.address || poi.address,
                            visitDuration: enriched.visitDuration || poi.visitDuration,
                            priceLevel: enriched.priceLevel as any,
                            category: enriched.category as any,
                            subCategory: enriched.subCategory as any,
                            
                            // IL FLAG CRITICO: Reliability con "+" (es. high+, medium+, low+)
                            aiReliability: finalReliability,
                            
                            // Aggiorniamo anche il campo esplicito tourismInterest per coerenza UI
                            tourismInterest: rawInterest, 
                            
                            updatedBy: 'Daily Deep Scan (Pro)',
                            updatedAt: new Date().toISOString(),
                            lastVerified: new Date().toISOString(),
                            
                            status: finalStatus as any
                        };
                        
                        await saveSinglePoi(updatedPoi, cityId, currentUser);
                        processedCount++;
                        
                        // Piccola pausa per cortesia API
                        await new Promise(r => setTimeout(r, 1500));
                        
                    } catch (e: any) {
                        const errMsg = e.message || JSON.stringify(e);
                        // Gestione Quota
                        if (errMsg.includes('429') || errMsg.toLowerCase().includes('quota')) {
                            quotaExceeded = true;
                            console.warn("QUOTA EXCEEDED - Stopping Daily Scan");
                            break;
                        }
                        console.error(`Errore bonifica ${poi.name}`, e);
                    }
                }
                
                // Aggiorna la vista dopo ogni batch
                await refreshData();
            }
            
            if (quotaExceeded) {
                alert(`⚠️ QUOTA AI ESAURITA.\n\nIl processo si è fermato dopo aver bonificato ${processedCount} POI.\nI progressi sono salvati (flag '+').\n\nRiprendi domani.`);
            } else if (stopSignalRef.current) {
                alert(`Processo interrotto manualmente. Bonificati: ${processedCount}`);
            } else {
                alert(`✅ Bonifica completata! Nessun altro POI da verificare. Totale: ${processedCount}`);
            }

        } catch (e) {
            console.error("Errore generico Daily Scan", e);
            alert("Errore imprevisto durante la bonifica.");
        } finally {
            setIsBulkProcessing(false);
            setGenStatus('');
        }
    };
    
    const stopBulkProcess = () => {
        stopSignalRef.current = true;
        setGenStatus('Interruzione in corso...');
    };

    return {
        // State
        isSaving,
        isDeleting,
        isBulkProcessing,
        isFixingTaxonomy,
        genStatus,
        setGenStatus, 

        // Actions
        savePoi,
        deletePoi,
        bulkDelete,
        bulkStatusChange,
        bulkResetImages,
        fixTaxonomy,
        executeDailyDeepScan,
        stopBulkProcess
    };
};
