
import { useState, useEffect, useMemo, useCallback } from 'react';
import { getTouristZones, deleteTouristZone, renameTouristZone } from '../../services/zoneService';
import { TouristZone, CitySummary } from '../../types/index';

export const useStrategicMap = (allCities: CitySummary[]) => {
    // --- STATE ---
    const [zones, setZones] = useState<TouristZone[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [geoFilter, setGeoFilter] = useState({ 
        continent: 'Europa', 
        nation: 'Italia', 
        region: 'Campania',
        zone: '',
        city: '' 
    });

    // --- DATA LOADING ---
    const loadZones = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getTouristZones(geoFilter.region);
            setZones(data);
        } catch (e) {
            console.error("Errore caricamento zone:", e);
        } finally {
            setIsLoading(false);
        }
    }, [geoFilter.region]);

    // Ricarica quando cambia la regione
    useEffect(() => {
        loadZones();
    }, [loadZones]);

    // --- CRUD ACTIONS ---
    const deleteZone = async (zoneName: string) => {
        try {
            await deleteTouristZone(zoneName, geoFilter.region);
            await loadZones(); // Refresh dati
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    const renameZone = async (oldName: string, newName: string, regionName: string) => {
        try {
            await renameTouristZone(oldName, newName, regionName);
            await loadZones(); // Refresh dati
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    // --- COMPUTED DATA (HEAVY LIFTING) ---
    // Incrocia le zone caricate con le città passate come prop per popolare le card
    const zoneData = useMemo(() => {
        return zones.map(z => {
            // Trova le città che appartengono a questa zona
            const citiesInZone = allCities.filter(c => c.zone === z.name);
            
            // Gestione Suggerimenti AI (Missing Cities)
            const suggestions = z.aiSuggestions || [];
            
            // Filtra i suggerimenti che sono già diventati città reali (per nome)
            const cleanSuggestions = suggestions.filter(s => 
                !citiesInZone.some(c => c.name.toLowerCase() === s.name.toLowerCase())
            );

            return {
                ...z,
                cities: citiesInZone,
                cleanSuggestions
            };
        });
    }, [zones, allCities]);

    // Liste di supporto per autocomplete/modali
    const allCityNames = useMemo(() => allCities.map(c => c.name), [allCities]);
    const zoneNames = useMemo(() => zones.map(z => z.name), [zones]);

    return {
        // Data
        zones,
        zoneData,
        isLoading,
        geoFilter,
        allCityNames,
        zoneNames,

        // Setters
        setGeoFilter,

        // Actions
        loadZones,
        deleteZone,
        renameZone
    };
};
