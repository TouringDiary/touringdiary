
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getPoisByCityId } from '../../services/cityService';
import { mergePoisInDb } from '../../services/observatoryService';
import { PointOfInterest, CitySummary } from '../../types/index';
import { calculateDistance } from '../../services/geo';
import { getSimilarity } from '../../utils/stringUtils';

export interface DuplicatePair {
    id: string; // Composite ID for list key
    poiA: PointOfInterest;
    poiB: PointOfInterest;
    score: number;
    reasons: string[];
}

export const useDuplicateFinder = (cityList: CitySummary[]) => {
    // State
    const [selectedCityId, setSelectedCityId] = useState<string>('');
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [duplicates, setDuplicates] = useState<DuplicatePair[]>([]);
    const [ignoredPairs, setIgnoredPairs] = useState<Set<string>>(new Set());
    
    // Operations State
    const [isMerging, setIsMerging] = useState(false);

    // --- ALGORITMO DI SCANSIONE ---
    const scanCity = useCallback(async (cityId: string) => {
        setIsScanning(true);
        setScanProgress(0);
        setDuplicates([]);
        
        try {
            const pois = await getPoisByCityId(cityId);
            const found: DuplicatePair[] = [];
            const total = pois.length;
            
            // Confronto O(N^2) ottimizzato
            // Poiché N è solitamente < 500 per città, è gestibile client-side.
            // Per N > 1000 andrebbe fatto server-side o con worker.
            
            for (let i = 0; i < total; i++) {
                const a = pois[i];
                // Loop parte da i+1 per evitare confronti doppi (A vs B e B vs A)
                for (let j = i + 1; j < total; j++) {
                    const b = pois[j];
                    
                    // 1. Filtro Categoria: Se categorie diverse, molto improbabile sia duplicato
                    // (A meno che non sia una correzione, ma per ora siamo conservativi)
                    if (a.category !== b.category) continue;

                    let score = 0;
                    const reasons: string[] = [];

                    // 2. Controllo Nome (Fuzzy)
                    const nameSim = getSimilarity(a.name, b.name);
                    if (nameSim > 0.85) {
                        score += 50;
                        reasons.push(`Nome simile (${Math.round(nameSim * 100)}%)`);
                    } else if (nameSim > 0.6) {
                        score += 20; // Debole
                    }

                    // 3. Controllo Distanza
                    let distMeters = 99999;
                    if (a.coords.lat !== 0 && b.coords.lat !== 0) {
                        distMeters = calculateDistance(a.coords.lat, a.coords.lng, b.coords.lat, b.coords.lng) * 1000;
                        
                        if (distMeters < 10) { // Praticamente sovrapposti
                            score += 50;
                            reasons.push("Posizione sovrapposta (< 10m)");
                        } else if (distMeters < 50) {
                            score += 30;
                            reasons.push("Molto vicini (< 50m)");
                        } else if (distMeters < 200) {
                            score += 10;
                        }
                    } else {
                        // Se uno non ha GPS, ci affidiamo solo al nome
                        if (nameSim > 0.9) score += 20; // Bonus fiducia nome se manca GPS
                    }

                    // Soglia Rilevamento (>= 60 punti)
                    // Esempio: Nome identico (50) + Vicini (30) = 80 -> OK
                    // Esempio: Nome simile (20) + Sovrapposti (50) = 70 -> OK
                    // Esempio: Nome identico (50) + Distanza ignota (20 bonus) = 70 -> OK
                    if (score >= 60) {
                        const pairId = `${a.id}_${b.id}`;
                        if (!ignoredPairs.has(pairId)) {
                             found.push({
                                id: pairId,
                                poiA: a,
                                poiB: b,
                                score,
                                reasons
                            });
                        }
                    }
                }
                
                // Aggiorna progresso ogni 20 items per non bloccare UI
                if (i % 20 === 0) setScanProgress(Math.round((i / total) * 100));
            }
            
            // Sort per score decrescente (i più probabili prima)
            found.sort((a, b) => b.score - a.score);
            setDuplicates(found);
            
        } catch (e) {
            console.error("Scan error", e);
        } finally {
            setIsScanning(false);
            setScanProgress(100);
        }
    }, [ignoredPairs]);

    // --- AZIONI ---

    const handleMerge = async (survivor: PointOfInterest, victim: PointOfInterest, pairId: string) => {
        setIsMerging(true);
        const success = await mergePoisInDb(survivor, victim);
        
        if (success) {
            // Rimuovi dalla lista locale
            setDuplicates(prev => prev.filter(p => p.id !== pairId));
        } else {
            alert("Errore durante il merge nel database.");
        }
        setIsMerging(false);
    };

    const handleIgnore = (pairId: string) => {
        setIgnoredPairs(prev => new Set(prev).add(pairId));
        setDuplicates(prev => prev.filter(p => p.id !== pairId));
    };
    
    // Per eliminare manualmente uno dei due (se è proprio spazzatura)
    const handleDelete = async (victim: PointOfInterest, pairId: string) => {
         // Riutilizziamo la logica di merge ma senza copiare dati? No, meglio avere una delete esplicita nel service.
         // Per ora nel tool di deduplica, "Delete A" è semanticamente simile a "Merge B into A" ma ignorando i dati di B?
         // In realtà "Merge" è più sicuro. Se l'utente vuole solo cancellare, può usare "Merge" verso il buono.
         // Se entrambi sono spazzatura, dovrebbe usare il PoiManager.
         // Quindi qui NON offriamo delete puro, ma solo Merge.
    };

    return {
        selectedCityId,
        setSelectedCityId,
        isScanning,
        scanProgress,
        duplicates,
        isMerging,
        scanCity,
        handleMerge,
        handleIgnore
    };
};
