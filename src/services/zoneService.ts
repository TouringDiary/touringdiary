
import { supabase } from './supabaseClient';
import { TouristZone, AiCitySuggestion } from '../types/index';
import { clearCacheKey } from './city/cityCache';

// Recupera tutte le zone conosciute (o filtrate per regione)
export const getTouristZones = async (region?: string): Promise<TouristZone[]> => {
    let query = supabase.from('tourist_zones').select('*');
    
    if (region) {
        query = query.eq('admin_region', region);
    }
    
    const { data, error } = await query;
    if (error) {
        console.error("Error fetching zones:", error);
        return [];
    }
    
    return data.map((z: any) => ({
        id: z.id,
        name: z.name,
        adminRegion: z.admin_region,
        description: z.description,
        aiSuggestions: z.ai_suggestions || [] // Map JSONB to internal type
    }));
};

// Assicura che una zona esista. Se non c'è, la crea e restituisce un log.
export const ensureZoneExists = async (zoneName: string, adminRegion: string): Promise<{ created: boolean, log: string }> => {
    const cleanName = zoneName.trim();
    const cleanRegion = adminRegion.trim();
    
    // Check esistenza (Case insensitive)
    const { data } = await supabase
        .from('tourist_zones')
        .select('id')
        .ilike('name', cleanName)
        .ilike('admin_region', cleanRegion)
        .maybeSingle();
        
    if (!data) {
        // Crea nuova zona
        await supabase.from('tourist_zones').insert({
            name: cleanName,
            admin_region: cleanRegion
        });
        return { 
            created: true, 
            log: `[ZoneService] Nuova zona censita: ${cleanName} (${cleanRegion})` 
        };
    }

    return { 
        created: false, 
        log: `[ZoneService] Zona esistente rilevata: ${cleanName}` 
    };
};

export const deleteTouristZone = async (zoneName: string, regionName: string): Promise<void> => {
    console.log(`[ZoneService] Deleting zone: ${zoneName} in ${regionName}`);
    
    // 1. Elimina la zona dalla tabella tourist_zones
    const { error } = await supabase
        .from('tourist_zones')
        .delete()
        .eq('name', zoneName)
        .eq('admin_region', regionName);
        
    if (error) {
        console.error("[ZoneService] Delete error:", error);
        throw error;
    }

    // FIX CACHE: Forza il ricaricamento delle città per riflettere che non hanno più zona
    clearCacheKey('manifest');
};

// Rinominazione profonda (Aggiorna Tabella Zone + Tabella Città)
export const renameTouristZone = async (oldName: string, newName: string, regionName: string): Promise<void> => {
    console.log(`[ZoneService] Renaming zone from "${oldName}" to "${newName}"`);

    // 1. PRIMA Aggiorna la tabella ZONE (Source of Truth)
    const { error: zoneError } = await supabase
        .from('tourist_zones')
        .update({ name: newName })
        .eq('name', oldName)
        .eq('admin_region', regionName);

    if (zoneError) {
        console.error("Errore aggiornamento tabella tourist_zones", zoneError);
        throw zoneError;
    }

    // 2. POI Aggiorna a cascata tutte le città che appartenevano alla vecchia zona
    const { error: cityError } = await supabase
        .from('cities')
        .update({ zone: newName })
        .eq('zone', oldName)
        .eq('admin_region', regionName);

    if (cityError) {
        console.error("Errore aggiornamento a cascata tabella cities", cityError);
        // Rollback parziale manuale (non siamo in transazione SQL pura qui)
        await supabase
            .from('tourist_zones')
            .update({ name: oldName })
            .eq('name', newName)
            .eq('admin_region', regionName);
        throw cityError;
    }

    // FIX CRITICO CACHE: Invalida la cache delle città ('manifest_full')
    // Questo costringe l'app a riscaricare la lista città dal DB, dove ora hanno la zona aggiornata.
    clearCacheKey('manifest');
};

// NEW: Salva i suggerimenti AI (Missing Cities) nel DB per una zona
export const saveZoneSuggestions = async (zoneName: string, suggestions: AiCitySuggestion[], regionName: string) => {
    // 1. Assicurati che la zona esista
    await ensureZoneExists(zoneName, regionName);
    
    // 2. Update JSONB column
    const { error } = await supabase
        .from('tourist_zones')
        .update({ ai_suggestions: suggestions })
        .eq('name', zoneName)
        .eq('admin_region', regionName);

    if (error) console.error("Error saving suggestions:", error);
};

// NEW: Rimuove un singolo suggerimento dalla lista AI della zona
export const removeZoneSuggestion = async (zoneName: string, suggestionName: string, regionName: string) => {
    try {
        // 1. Recupera la zona attuale
        const { data } = await supabase
            .from('tourist_zones')
            .select('ai_suggestions')
            .eq('name', zoneName)
            .eq('admin_region', regionName)
            .maybeSingle();

        if (!data || !data.ai_suggestions) return;

        // 2. Filtra via il suggerimento indesiderato
        const currentSuggestions = data.ai_suggestions as AiCitySuggestion[];
        const updatedSuggestions = currentSuggestions.filter(s => s.name !== suggestionName);

        // 3. Salva la lista aggiornata
        await saveZoneSuggestions(zoneName, updatedSuggestions, regionName);
    } catch (e) {
        console.error("Error removing suggestion:", e);
        throw e;
    }
};

// Funzione di utilità per ripristinare le zone corrette se necessario
export const seedCampaniaZones = async () => {
    const zones = [
        'Napoli & Area Vesuviana',
        'Costiera Sorrentina',
        'Costiera Amalfitana',
        'Isole del Golfo',
        'Campi Flegrei & Domitiana',
        'Cilento & Vallo di Diano',
        'Salerno & Piana del Sele',
        'Irpinia',
        'Sannio',
        'Terra di Lavoro & Matese'
    ];

    for (const zone of zones) {
        await ensureZoneExists(zone, 'Campania');
    }
};
