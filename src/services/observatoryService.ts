
import { supabase } from './supabaseClient';
import { ObservatoryStats, AnomalyRecord, CityQualityStats, PointOfInterest } from '../types/index';
import { DatabasePoi } from '../types/database';

/**
 * Recupera le statistiche aggregate dell'osservatorio tramite RPC.
 * Questo è molto più veloce che fare query count separate.
 */
export const getObservatoryStats = async (): Promise<ObservatoryStats | null> => {
    try {
        const { data, error } = await supabase.rpc('get_observatory_stats');
        
        if (error) {
            console.error("[Observatory] Error fetching stats:", error);
            // Fallback locale in caso di errore RPC (es. funzione non ancora creata)
            return null;
        }

        return data as ObservatoryStats;
    } catch (e) {
        console.error("[Observatory] Exception:", e);
        return null;
    }
};

/**
 * Recupera la lista delle anomalie dalla vista dedicata.
 */
export const getAnomalies = async (limit: number = 50): Promise<AnomalyRecord[]> => {
    try {
        const { data, error } = await supabase
            .from('obs_poi_anomalies')
            .select('*')
            .limit(limit);

        if (error) throw error;
        
        return data as AnomalyRecord[];
    } catch (e) {
        console.error("[Observatory] Error fetching anomalies:", e);
        return [];
    }
};

/**
 * Recupera la griglia DETTAGLIATA con le metriche per ogni città.
 * Usa la nuova funzione RPC get_detailed_city_stats.
 */
export const getCityQualityMetrics = async (): Promise<CityQualityStats[]> => {
    try {
        const { data, error } = await supabase.rpc('get_detailed_city_stats');

        if (error) throw error;

        return data as CityQualityStats[];
    } catch (e) {
        console.error("[Observatory] Error fetching city metrics:", e);
        return [];
    }
};

/**
 * Esegue il MERGE di due POI.
 * Sposta tutte le referenze (Review, Itinerari) dal 'victimId' al 'survivorId', poi cancella il victim.
 * Restituisce true se successo.
 */
export const mergePoisInDb = async (survivor: PointOfInterest, victim: PointOfInterest): Promise<boolean> => {
    try {
        // 1. Aggiorna Review
        await supabase
            .from('reviews')
            .update({ poi_id: survivor.id })
            .eq('poi_id', victim.id);
            
        // 2. Aggiorna Suggerimenti
        await supabase
            .from('suggestions')
            .update({ poi_id: survivor.id })
            .eq('poi_id', victim.id);
            
        // 3. (Opzionale) Aggiorna Itinerari
        // Nota: Gli itinerari salvano un JSON snapshot del POI, ma hanno anche poi_id per riferimento.
        // Aggiornare il JSON dentro gli array degli itinerari è complesso in SQL puro o Supabase client.
        // Per ora aggiorniamo solo le tabelle relazionali dirette.

        // 4. Copia dati mancanti nel Survivor (Arricchimento)
        // Se il survivor ha campi vuoti che la vittima ha, li aggiorniamo.
        const updates: Partial<DatabasePoi> = {};
        let needsUpdate = false;

        if (!survivor.imageUrl && victim.imageUrl) { updates.image_url = victim.imageUrl; needsUpdate = true; }
        if (!survivor.description && victim.description) { updates.description = victim.description; needsUpdate = true; }
        if (!survivor.address && victim.address) { updates.address = victim.address; needsUpdate = true; }
        if (!survivor.visitDuration && victim.visitDuration) { updates.visit_duration = victim.visitDuration; needsUpdate = true; }
        if ((!survivor.priceLevel || survivor.priceLevel === 1) && victim.priceLevel && victim.priceLevel > 1) { 
             updates.price_level = victim.priceLevel; needsUpdate = true; 
        }
        
        // Merge Affiliati (se survivor manca, prendi da victim)
        if (victim.affiliate && Object.keys(victim.affiliate).length > 0) {
            const mergedAffiliate = { ...victim.affiliate, ...survivor.affiliate };
            if (JSON.stringify(mergedAffiliate) !== JSON.stringify(survivor.affiliate)) {
                 updates.affiliate = mergedAffiliate;
                 needsUpdate = true;
            }
        }

        if (needsUpdate) {
            await supabase.from('pois').update(updates).eq('id', survivor.id);
        }

        // 5. Elimina la Vittima
        await supabase.from('pois').delete().eq('id', victim.id);
        
        return true;
    } catch (e) {
        console.error("[Observatory] Merge error:", e);
        return false;
    }
};
