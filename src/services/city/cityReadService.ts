import { supabase } from '../supabaseClient';
import {
    CityDetails,
    CitySummary,
    PointOfInterest,
    PatronDetails,
    MediaAsset,
    CityIdentity,
    CityEvent,
    CityService as CityServiceEntity,
    CityGuide,
    CityTourOperator,
    FamousPerson
} from '../../types/index';
import { DatabaseCityRouteView } from '../../types/database';
import { getFromCache, setInCache, LONG_CACHE_TTL } from './cityCache';
import { calculateDistance } from '../geo';
import { getPoisByCityId, getPoisByCityIds, mapDbPoiToApp } from './poiService';
import {
    getCityEvents,
    getCityServices,
    getCityGuides,
    getCityPeople,
    type CityPeopleAudience,
} from './entitiesService';
import { filterFamousPeopleByAudience } from './parsers/entities/famousPersonAudience';
import { parseEvent } from './parsers/entities/parseEvent';
import { parseService } from './parsers/entities/parseService';
import { parseGuide } from './parsers/entities/parseGuide';
import { parseTourOperator } from './parsers/entities/parseTourOperator';
import { parsePerson } from './parsers/entities/parsePerson';
import { getCityTourOperators } from './tourOperatorService';
import { GEO_CONFIG } from '../../constants/geoConfig';
import { sanitizeMediaStatus } from '../../utils/media';
import { parseMediaAsset } from './parsers/media/parseMediaAsset';
import { parseGallery } from './parsers/media/parseGallery';
import { parseLogs } from './parsers/content/parseLogs';
import { parseRatings } from './parsers/content/parseRatings';
import { parsePatron } from './parsers/content/parsePatron';

const DEFAULT_RATINGS = {
    cultura: 50, monumenti: 50, musei_arte: 50, tradizione: 50, architettura: 50,
    natura: 50, mare_spiagge: 50, paesaggi: 50, clima: 50, sostenibilita: 50,
    gusto: 50, cucina: 50, vita_notturna: 50, caffe_bar: 50, mercati: 50,
    viaggiatore: 50, mobilita: 50, accoglienza: 50, costo: 50, sicurezza: 50
};

/**
 * Categorie POI centralizzate per evitare stringhe hardcoded.
 */
export const POI_CATEGORIES = {
    MONUMENT: 'monument',
    FOOD: 'food',
    HOTEL: 'hotel',
    LEISURE: 'leisure',
    DISCOVERY: 'discovery'
} as const;

/**
 * Mapper esplicito da DatabaseCityRouteView a CitySummary.
 */
const mapDbCityToSummary = (db: DatabaseCityRouteView, zoneMap?: Map<string, string>): CitySummary | null => {
    const id = db.city_id || db.id;
    if (!id) return null;

    const lat = Number(db.coords_lat ?? 0);
    const lng = Number(db.coords_lng ?? 0);
    const hasContent = Array.isArray(db.generation_logs) && db.generation_logs.length > 0;
    const imageUrl = db.image_url || '';
    const heroImage = db.hero_image || '';

    // Risoluzione deterministica del nome zona basato esclusivamente sulla FK tourist_zone_id
    let resolvedZone: string | undefined = undefined;
    if (db.tourist_zone_id && zoneMap) {
        resolvedZone = zoneMap.get(db.tourist_zone_id);
        if (!resolvedZone) {
            console.warn(`[GeoRegistry:Drift] City ID ${id} (${db.city_name || db.name || 'Sconosciuta'}) has orphan tourist_zone_id: ${db.tourist_zone_id}`);
        }
    }

    return {
        id,
        slug: db.city_slug || db.slug || id,
        name: db.city_name || db.name || '',
        continent: db.continent || GEO_CONFIG.DEFAULT_CONTINENT,
        nation: db.nation || GEO_CONFIG.DEFAULT_NATION,
        adminRegion: db.admin_region || GEO_CONFIG.DEFAULT_REGION,
        region_id: db.region_id || undefined,
        zone: resolvedZone,
        tourist_zone_id: db.tourist_zone_id || undefined,
        description: db.description || '',
        imageUrl,
        image_status: sanitizeMediaStatus(db.image_status),
        imageCredit: db.image_credit || undefined,
        imageLicense: (db.image_license as CitySummary['imageLicense']) || undefined,
        imageAsset: parseMediaAsset(imageUrl, db.image_status, db.image_credit, db.image_license),
        heroImage,
        hero_status: sanitizeMediaStatus(db.hero_status),
        heroAsset: parseMediaAsset(heroImage, db.hero_status, db.image_credit, db.image_license),
        rating: db.rating || 0,
        visitors: db.visitors || 0,
        isFeatured: db.is_featured || false,
        specialBadge: db.special_badge as CityDetails['specialBadge'] || null,
        homeOrder: db.home_order || null,
        coords: { lat, lng },
        status: (db.status as CitySummary['status']) || 'published',
        createdAt: db.created_at || '',
        updatedAt: db.updated_at || '',
        publishedAt: db.published_at || '',
        tags: db.city_types as string[] || [],
        cityTypes: db.city_types as string[] || [],
        classificationExplainability: db.classification_explainability as Record<string, number> || undefined,
        hasGeneratedContent: hasContent,
        continent_slug: db.continent_slug || undefined,
        nation_slug: db.nation_slug || undefined,
        region_slug: db.region_slug || undefined,
        zone_slug: db.zone_slug || undefined
    };
};


/**
 * Mapper esplicito da DatabaseCityRouteView a CityDetails.
 */
const mapDbCityToDetails = (db: DatabaseCityRouteView, extra: {
    pois: PointOfInterest[],
    events: CityEvent[],
    services: CityServiceEntity[],
    guides: CityGuide[],
    tourOperators: CityTourOperator[],
    famousPeople: FamousPerson[]
}, zoneMap?: Map<string, string>): CityDetails | null => {
    if (!db) return null;
    const summary = mapDbCityToSummary(db, zoneMap);

    if (!summary) {
        console.error('[CITY_CORRUPTION] mapDbCityToSummary returned null', {
            city_id: db.city_id,
            city_slug: db.city_slug,
            city_name: db.city_name,
            raw: db
        });

        return null;
    }

    const { pois, events, services, guides, tourOperators, famousPeople } = extra;

    return {
        ...summary,
        details: {
            subtitle: db.subtitle || '',
            heroImage: db.hero_image || db.image_url || '',
            hero_status: db.hero_status ?? 'missing',
            historySnippet: db.history_snippet || db.description || '',
            historyFull: db.history_full || '',
            officialWebsite: db.official_website,
            heroAsset: parseMediaAsset(db.hero_image || db.image_url || '', db.hero_status ?? 'missing', db.image_credit, db.image_license),
            patron: parsePatron(db.patron_details)?.name || '',
            patronDetails: parsePatron(db.patron_details) || undefined,
            ratings: { ...DEFAULT_RATINGS, ...parseRatings(db.ratings) } as CityDetails['details']['ratings'],
            gallery: parseGallery(db.gallery),
            events,
            services,
            guides,
            tourOperators,
            famousPeople,
            allPois: pois,
            topAttractions: pois.filter(p => p.category === POI_CATEGORIES.MONUMENT),
            foodSpots: pois.filter(p => p.category === POI_CATEGORIES.FOOD),
            hotels: pois.filter(p => p.category === POI_CATEGORIES.HOTEL),
            newDiscoveries: pois.filter(p => p.category === POI_CATEGORIES.DISCOVERY),
            leisureSpots: pois.filter(p => p.category === POI_CATEGORIES.LEISURE),
            generationLogs: parseLogs(db.generation_logs),
        }
    };
};

export const getFullManifestAsync = async (
    onlyPublished = true,
    options?: { bypassCache?: boolean }
): Promise<CitySummary[]> => {
    const CACHE_KEY = onlyPublished ? 'manifest_published' : 'manifest_all';
    if (!options?.bypassCache) {
        const cached = getFromCache<CitySummary[]>(CACHE_KEY);
        if (cached) return cached;
    }

    let dbData: DatabaseCityRouteView[] = [];

    // 1. TENTA IL CARICAMENTO TRAMITE API LOCALE (PROXIED)
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bootstrap/cities`, {
            cache: 'no-store',
        });
        if (response.ok) {
            const apiRes = await response.json();
            if (apiRes.success && apiRes.data) {
                dbData = apiRes.data;
                console.log("[CityReadService] Manifest caricato da API locale");
            }
        }
    } catch (apiError) {
        console.warn("[CityReadService] API locale fallita, uso fallback Supabase", apiError);
    }

    if (dbData.length === 0) {
        let query = supabase.from('seo_city_routes').select('*');
        if (onlyPublished) {
            query = query.eq('status', 'published');
        }
        const { data, error } = await query.order('updated_at', { ascending: false });
        if (error) {
            console.error("DB Error manifest fallback (seo_city_routes):", error);
            return [];
        }
        dbData = (data || []) as DatabaseCityRouteView[];
        console.log("[CityReadService] Manifest caricato via seo_city_routes (Supabase)");
    }

    // Caricamento e costruzione mappa zone turistiche per risoluzione dei nomi basati su ID
    const { data: zonesData } = await supabase.from('tourist_zones').select('id, name');
    const zoneMap = new Map<string, string>();
    if (zonesData) {
        zonesData.forEach(z => zoneMap.set(z.id, z.name));
    }

    // Normalizzazione dati tramite mapper canonico
    let result = dbData
        .map(db => mapDbCityToSummary(db, zoneMap))
        .filter((c): c is CitySummary => c !== null);

    if (onlyPublished) {
        result = result.filter(c => c.status === 'published');
    }

    console.log("[Manifest Loader]", result.length, result.map(c => c.name));

    setInCache(CACHE_KEY, result, LONG_CACHE_TTL);
    return result;
};

export type { CityPeopleAudience };

export interface GetCityDetailsOptions {
    peopleAudience?: CityPeopleAudience;
}

export const getCityDetails = async (
    cityId: string,
    signal?: AbortSignal,
    options: GetCityDetailsOptions = {},
): Promise<CityDetails | null> => {
    const peopleAudience = options.peopleAudience ?? 'public';
    const CACHE_KEY = `city_details_${cityId}_${peopleAudience}`;
    const cached = getFromCache<CityDetails>(CACHE_KEY);
    if (cached) return cached;

    // Carichiamo le zone a monte per poter mappare correttamente la città
    const { data: zonesData } = await supabase.from('tourist_zones').select('id, name');
    const zoneMap = new Map<string, string>();
    if (zonesData) {
        zonesData.forEach(z => zoneMap.set(z.id, z.name));
    }

    // 1. TENTA IL CARICAMENTO TRAMITE API LOCALE (1 chiamata invece di 6)
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/city/${cityId}/details`, { signal });
        if (response.ok) {
            const apiRes = await response.json();
            if (apiRes.success && apiRes.city) {
                const apiCity = apiRes.city;
                const pois = (apiRes.pois || []).map(mapDbPoiToApp);
                const events = (apiRes.events || []).map(parseEvent);
                const services = (apiRes.services || []).map(parseService);
                const tourOperators = (apiRes.tour_operators || []).map(parseTourOperator);
                const guides = (apiRes.guides || []).map(parseGuide);
                const people = filterFamousPeopleByAudience(
                    (apiRes.people || []).map(parsePerson),
                    peopleAudience,
                ).sort((a: FamousPerson, b: FamousPerson) => (a.orderIndex || 0) - (b.orderIndex || 0));

                let result: CityDetails | null = null;

                // API locale restituisce già un oggetto compatibile CityDetails
                // mentre Supabase usa DatabaseCityRouteView.
                result = mapDbCityToDetails(apiCity as DatabaseCityRouteView, {
                    pois,
                    events,
                    services,
                    guides,
                    tourOperators,
                    famousPeople: people
                }, zoneMap);

                if (!result) return null;

                setInCache(CACHE_KEY, result);
                console.log(
                    `[CityReadService] getCityDetails caricato da API locale per: ${result.name}`
                );
                return result;
            }
        }
    } catch (apiError) {
        console.warn(`[CityReadService] API locale fallita per ${cityId}, uso fallback Supabase`, apiError);
    }

    // 2. FALLBACK SUPABASE — stessa sorgente dell'API (tabella `cities`).
    // La view `seo_city_routes` è una proiezione snella per routing/manifest e NON espone
    // i campi di dettaglio (official_website, patron_details, history_*, ratings, gallery,
    // *_status, image_credit/license). Leggendo direttamente `cities`, come fa l'endpoint
    // API, il fallback costruisce un CityDetails funzionalmente identico: parità Desktop/Mobile.
    let { data: cityData, error: cityErr } = await supabase.from('cities').select('*').eq('id', cityId).maybeSingle();

    if (cityErr || !cityData) return null;
    const dbCity = cityData as unknown as DatabaseCityRouteView;

    const [pois, events, services, guides, tourOperators, people] = await Promise.all([
        getPoisByCityId(cityId),
        getCityEvents(cityId),
        getCityServices(cityId),
        getCityGuides(cityId),
        getCityTourOperators(cityId),
        getCityPeople(cityId, peopleAudience),
    ]);
    const sortedPeople = people.sort((a: FamousPerson, b: FamousPerson) => (a.orderIndex || 0) - (b.orderIndex || 0));

    const result = mapDbCityToDetails(dbCity, {
        pois,
        events,
        services,
        guides,
        tourOperators,
        famousPeople: sortedPeople
    }, zoneMap);

    if (!result) return null;

    setInCache(CACHE_KEY, result);
    return result;
};

export const buildVirtualCity = async (
    centerCoords: { lat: number, lng: number },
    radiusKm: number,
    manifest: CitySummary[],
    /**
     * Opzioni di costruzione:
     * - `baseCity`: attiva la modalità fusione "Tutto Incluso" mantenendo l'identità della città base.
     * - `selectedCityIds`: sottoinsieme opzionale di città (per id) da includere nella fusione.
     *   Quando assente, viene usato l'intero raggio (comportamento storico Around Me).
     *   Cambia SOLO quali città vengono elaborate: la logica di fusione resta invariata.
     */
    options: { baseCity?: CityDetails; selectedCityIds?: string[] } = {}
): Promise<CityDetails | null> => {
    const { baseCity, selectedCityIds } = options;
    try {
        const inRadius = manifest
            .filter(c => c.status === 'published')
            .filter(c => {
                const dist = calculateDistance(centerCoords.lat, centerCoords.lng, c.coords.lat, c.coords.lng);
                return dist <= radiusKm;
            });

        const selectedSet = selectedCityIds && selectedCityIds.length > 0 ? new Set(selectedCityIds) : null;
        const nearbyCities = selectedSet ? inRadius.filter(c => selectedSet.has(c.id)) : inRadius;

        if (nearbyCities.length === 0 && !baseCity) return null;

        // Modalità di costruzione esplicita (dominio): fusione "Tutto Incluso" vs "Around Me".
        const mode: 'merge' | 'around-me' = baseCity ? 'merge' : 'around-me';
        const isMergedMode = mode === 'merge';

        // In modalità fusione i contenuti della città base sono sempre inclusi,
        // insieme a quelli delle (sole) città selezionate.
        const cityIds = isMergedMode
            ? Array.from(new Set([baseCity!.id, ...nearbyCities.map(c => c.id)]))
            : nearbyCities.map(c => c.id);

        const [allPois, allEvents, allGuides] = await Promise.all([
            getPoisByCityIds(cityIds),
            Promise.all(cityIds.map(id => getCityEvents(id))).then(res => res.flat()),
            Promise.all(cityIds.map(id => getCityGuides(id))).then(res => res.flat())
        ]);

        const virtualCity: CityDetails = {
            id: isMergedMode ? baseCity.id : 'around-me-virtual',
            slug: isMergedMode ? baseCity.slug : 'around-me-virtual',
            name: isMergedMode ? baseCity.name : 'Around Me',
            zone: isMergedMode ? baseCity.zone : `Raggio ${radiusKm}km`,
            adminRegion: isMergedMode ? baseCity.adminRegion : GEO_CONFIG.DEFAULT_REGION,
            nation: isMergedMode ? baseCity.nation : GEO_CONFIG.DEFAULT_NATION,
            continent: isMergedMode ? baseCity.continent : GEO_CONFIG.DEFAULT_CONTINENT,
            region_id: isMergedMode ? baseCity.region_id : undefined,
            tourist_zone_id: isMergedMode ? baseCity.tourist_zone_id : undefined,
            description: isMergedMode
                ? (baseCity.description || '')
                : `Esplorazione territoriale personalizzata. Include ${nearbyCities.length} località nel raggio di ${radiusKm}km dalla tua posizione.`,
            imageUrl: isMergedMode
                ? baseCity.imageUrl
                : (nearbyCities[0]?.imageUrl || ''),
            image_status: isMergedMode ? baseCity.image_status : (nearbyCities[0]?.image_status ?? 'missing'),
            heroImage: isMergedMode ? baseCity.heroImage : (nearbyCities[0]?.imageUrl || ''),
            hero_status: isMergedMode ? baseCity.hero_status : (nearbyCities[0]?.image_status ?? 'missing'),
            rating: isMergedMode ? baseCity.rating : 0,
            visitors: isMergedMode ? baseCity.visitors : 0,
            isFeatured: false,
            coords: centerCoords,
            status: 'published',
            tags: [],
            hasGeneratedContent: true,
            isVirtual: true,
            details: {
                subtitle: isMergedMode ? (baseCity.details.subtitle || '') : `${nearbyCities.length} Città vicine`,
                heroImage: isMergedMode ? baseCity.details.heroImage : (nearbyCities[0]?.imageUrl || ''),
                hero_status: isMergedMode ? baseCity.details.hero_status : (nearbyCities[0]?.image_status ?? 'missing'),
                historySnippet: isMergedMode ? (baseCity.details.historySnippet || '') : `Esplorazione libera del territorio.`,
                historyFull: isMergedMode ? (baseCity.details.historyFull || '') : '',
                allPois: allPois,
                events: allEvents,
                guides: allGuides,
                topAttractions: allPois.filter(p => p.category === POI_CATEGORIES.MONUMENT),
                foodSpots: allPois.filter(p => p.category === POI_CATEGORIES.FOOD),
                hotels: allPois.filter(p => p.category === POI_CATEGORIES.HOTEL),
                leisureSpots: allPois.filter(p => p.category === POI_CATEGORIES.LEISURE),
                newDiscoveries: allPois.filter(p => p.category === POI_CATEGORIES.DISCOVERY),
                services: isMergedMode ? baseCity.details.services : [],
                tourOperators: isMergedMode ? (baseCity.details.tourOperators || []) : [],
                famousPeople: isMergedMode ? baseCity.details.famousPeople : [],
                gallery: isMergedMode ? baseCity.details.gallery : [],
                ratings: isMergedMode ? baseCity.details.ratings : undefined,
                generationLogs: [],
                patron: isMergedMode ? baseCity.details.patron : 'N/A',
                patronDetails: isMergedMode ? baseCity.details.patronDetails : undefined
            }
        };

        return virtualCity;

    } catch (e) {
        console.error("Error building virtual city:", e);
        return baseCity || null;
    }
};

/**
 * Recupera il ranking stagionale dinamico tramite RPC PostgreSQL.
 */
export const getSeasonalRanking = async (cityIds: string[], season: string): Promise<{ city_id: string, seasonal_score: number }[]> => {
    const { data, error } = await supabase.rpc('get_dynamic_seasonal_ranking', {
        p_city_ids: cityIds,
        target_season: season.toLowerCase()
    });

    if (error) {
        console.error("[CityReadService] Error calling get_dynamic_seasonal_ranking:", error);
        return [];
    }

    return data || [];
};

/**
 * SYSTEM AUDIT: Recupera informazioni media normalizzate per tutte le città.
 * Utilizzata esclusivamente per strumenti di scansione globale (es: mediaService).
 * Garantisce che i dati passino per i parser ufficiali (Governance Strict).
 */
export const fetchGlobalCityMediaInfo = async (): Promise<{ name: string, imageUrl: string, heroImage: string, gallery: MediaAsset[] }[]> => {
    const { data } = await supabase.from('cities').select('name, image_url, hero_image, gallery');
    if (!data) return [];

    return data.map(c => ({
        name: c.name,
        imageUrl: c.image_url || '',
        heroImage: c.hero_image || '',
        gallery: parseGallery(c.gallery) // Normalizzazione automatica (Legacy Compat)
    }));
};

/**
 * AUTHORITATIVE IDENTITY RESOLVER
 * Centralizza la logica di risoluzione di una città partendo da un input testuale (nome o slug).
 * Questa è l'unica funzione autorizzata a eseguire lookup d'identità per il dominio City.
 */
export const resolveCityIdentity = async (input: string): Promise<CityIdentity | null> => {
    if (!input || !input.trim()) return null;

    const { data, error } = await supabase
        .from('cities')
        .select('id, slug, name')
        .ilike('name', input.trim())
        .maybeSingle();

    if (error || !data || !data.slug) return null;

    return {
        id: data.id,
        slug: data.slug,
        name: data.name
    };
};
