
import { useState } from 'react';
import { getTaxonomyRules } from '../services/taxonomyService';
import { getPoisByCityId, getAllPoisGlobal } from '../services/city/poiService';
import { getCityDetails, getFullManifestAsync } from '../services/city/cityReadService';
import { getAllStagingPois } from '../services/stagingService'; // NEW
import { CitySummary, PointOfInterest } from '../types/index';

export const useAdminExport = () => {
    const [isExporting, setIsExporting] = useState(false);

    // Helper per data filename gg.mm.aaaa
    const getDateStr = () => {
        const d = new Date();
        return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
    };

    // Helper download CSV
    const downloadCsv = (content: string, filename: string) => {
        // Aggiungiamo il BOM (\uFEFF) per dire a Excel che è UTF-8
        const blob = new Blob(["\uFEFF" + content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Helper escape CSV per separatore ";"
    const escapeCsv = (str: string | number | null | undefined) => {
        if (str === null || str === undefined) return '';
        const stringValue = String(str);
        // Se contiene punto e virgola, virgolette o newline, racchiudi tra virgolette
        // Sostituiamo le virgolette interne con doppie virgolette
        if (stringValue.includes(';') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
    };

    // Helper per formattare orari
    const formatOpeningHours = (poi: PointOfInterest) => {
        if (!poi.openingHours) return '';
        const { morning, afternoon, evening } = poi.openingHours;
        const parts = [morning, afternoon, evening].filter(Boolean);
        return parts.join(' / ');
    };

    // Helper per mappare Categoria DB -> Tab UI
    const getTabName = (category: string) => {
        switch(category) {
            case 'monument': return 'Destinazioni';
            case 'food': return 'Sapori';
            case 'hotel': return 'Alloggi';
            case 'nature': return 'Natura';
            case 'leisure': return 'Svago';
            case 'shop': return 'Shopping';
            case 'discovery': return 'Novità';
            default: return 'Altro';
        }
    };

    // Separatore richiesto
    const DELIMITER = ";";
    
    // Intestazioni standard per POI - AGGIORNATO CON LAST VERIFIED
    const POI_HEADERS = [
        "Continente", "Nazione", "Regione", "Zona Turistica", "Città",
        "Stato Pubblicazione", "Categoria (Macro)", "Sotto Categoria (DB)", "TAB Destinazione (UI)", 
        "Interesse Turistico", "Affidabilità AI", "Data Ultima Verifica Info", 
        "POI (Nome)", "Indirizzo", "Giorni Apertura", "Orari Apertura", "Descrizione", "Stelle", "Data Creazione", "Data Ultima Modifica"
    ];
    
    // Intestazioni per Staging
    const STAGING_HEADERS = [
        "ID OSM", "Nome", "Categoria Grezza (OSM)", "Indirizzo", 
        "Latitudine", "Longitudine", "Stato Processo", "AI Rating", "Data Importazione"
    ];

    // 1. ESPORTA TASSONOMIA (Label Aggiornate)
    const exportTaxonomyCsv = async (context: 'poi' | 'event' = 'poi') => {
        setIsExporting(true);
        try {
            const rules = await getTaxonomyRules(context);
            
            // Header più chiari come richiesto
            const headers = ["Contesto", "Termine Originale (AI)", "Macro Categoria (DB)", "Sottocategoria (DB)", "Tab Destinazione (UI)"];
            const rows = rules.map(r => [
                escapeCsv(r.context),
                escapeCsv(r.inputTerm),
                escapeCsv(r.category),
                escapeCsv(r.subCategory),
                escapeCsv(r.targetTab)
            ]);

            const csvContent = [headers.join(DELIMITER), ...rows.map(r => r.join(DELIMITER))].join("\n");
            downloadCsv(csvContent, `Tassonomia_${context.toUpperCase()}_${getDateStr()}.csv`);

        } catch (e) {
            console.error("Errore export tassonomia", e);
            alert("Errore durante l'esportazione della tassonomia.");
        } finally {
            setIsExporting(false);
        }
    };

    // 2. ESPORTA POI (Città Singola)
    const exportPoiCsv = async (cityId: string) => {
        setIsExporting(true);
        try {
            // Recupera Dati Città (per geo) e POI (tutti)
            const [city, pois] = await Promise.all([
                getCityDetails(cityId),
                getPoisByCityId(cityId)
            ]);

            if (!city) throw new Error("Dati città non trovati");

            const rows = pois.map(p => [
                escapeCsv(city.continent),
                escapeCsv(city.nation),
                escapeCsv(city.adminRegion),
                escapeCsv(city.zone),
                escapeCsv(city.name),
                escapeCsv(p.status === 'published' ? 'Pubblicato' : p.status === 'draft' ? 'Bozza (AI)' : 'Da Bonificare'),
                escapeCsv(p.category),
                escapeCsv(p.subCategory),
                escapeCsv(getTabName(p.category)),
                escapeCsv(p.tourismInterest || 'N/D'),
                escapeCsv(p.aiReliability || 'N/D'),
                escapeCsv(p.lastVerified ? new Date(p.lastVerified).toLocaleDateString() : 'N/D'), // NEW FIELD
                escapeCsv(p.name),
                escapeCsv(p.address),
                escapeCsv(p.openingHours?.days?.join(', ') || ''),
                escapeCsv(formatOpeningHours(p)),
                escapeCsv(p.description),
                escapeCsv(p.rating),
                escapeCsv(p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''),
                escapeCsv(p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '')
            ]);

            const csvContent = [POI_HEADERS.join(DELIMITER), ...rows.map(r => r.join(DELIMITER))].join("\n");
            downloadCsv(csvContent, `POI_${city.name}_${getDateStr()}.csv`);

        } catch (e) {
            console.error("Errore export POI", e);
            alert("Errore durante l'esportazione dei POI.");
        } finally {
            setIsExporting(false);
        }
    };
    
    // 3. ESPORTA TUTTI I POI (GLOBALE)
    const exportGlobalPoisCsv = async () => {
        setIsExporting(true);
        try {
            // 1. Recupera tutte le città (per mappare nomi e zone)
            // 2. Recupera TUTTI i POI dal DB
            const [allCities, allPois] = await Promise.all([
                getFullManifestAsync(),
                getAllPoisGlobal()
            ]);
            
            // Crea una mappa veloce ID Città -> Dati Città
            const cityMap = new Map<string, CitySummary>();
            allCities.forEach(c => cityMap.set(c.id, c));
            
            const rows = allPois.map(p => {
                const city = cityMap.get(p.cityId || '') || {
                    continent: 'N/D', nation: 'N/D', adminRegion: 'N/D', zone: 'N/D', name: 'Sconosciuta (ID: ' + p.cityId + ')'
                } as CitySummary;

                return [
                    escapeCsv(city.continent),
                    escapeCsv(city.nation),
                    escapeCsv(city.adminRegion),
                    escapeCsv(city.zone),
                    escapeCsv(city.name),
                    escapeCsv(p.status === 'published' ? 'Pubblicato' : p.status === 'draft' ? 'Bozza (AI)' : 'Da Bonificare'),
                    escapeCsv(p.category),
                    escapeCsv(p.subCategory),
                    escapeCsv(getTabName(p.category)),
                    escapeCsv(p.tourismInterest || 'N/D'),
                    escapeCsv(p.aiReliability || 'N/D'),
                    escapeCsv(p.lastVerified ? new Date(p.lastVerified).toLocaleDateString() : 'N/D'), // NEW FIELD
                    escapeCsv(p.name),
                    escapeCsv(p.address),
                    escapeCsv(p.openingHours?.days?.join(', ') || ''),
                    escapeCsv(formatOpeningHours(p)),
                    escapeCsv(p.description),
                    escapeCsv(p.rating),
                    escapeCsv(p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''),
                    escapeCsv(p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '')
                ];
            });

            const csvContent = [POI_HEADERS.join(DELIMITER), ...rows.map(r => r.join(DELIMITER))].join("\n");
            downloadCsv(csvContent, `POI_GLOBAL_FULL_${getDateStr()}.csv`);

        } catch (e) {
            console.error("Errore export Global POI", e);
            alert("Errore durante l'esportazione globale.");
        } finally {
            setIsExporting(false);
        }
    };

    // 4. ESPORTA STAGING (NEW)
    const exportStagingCsv = async (cityId: string, cityName: string, status: 'new' | 'ready' | 'imported' | 'discarded' | 'all') => {
        setIsExporting(true);
        try {
            const data = await getAllStagingPois({ cityId, status });

            const rows = data.map(item => [
                escapeCsv(item.osm_id),
                escapeCsv(item.name),
                escapeCsv(item.raw_category),
                escapeCsv(item.address),
                escapeCsv(item.coords_lat),
                escapeCsv(item.coords_lng),
                escapeCsv(item.processing_status),
                escapeCsv(item.ai_rating),
                escapeCsv(new Date(item.created_at).toLocaleString())
            ]);

            const csvContent = [STAGING_HEADERS.join(DELIMITER), ...rows.map(r => r.join(DELIMITER))].join("\n");
            const statusLabel = status === 'all' ? 'FULL' : status.toUpperCase();
            downloadCsv(csvContent, `STAGING_${cityName}_${statusLabel}_${getDateStr()}.csv`);

        } catch (e) {
            console.error("Errore export Staging", e);
            alert("Errore durante l'esportazione staging.");
        } finally {
            setIsExporting(false);
        }
    };

    return {
        isExporting,
        exportTaxonomyCsv,
        exportPoiCsv,
        exportGlobalPoisCsv,
        exportStagingCsv // EXPORTED
    };
};
