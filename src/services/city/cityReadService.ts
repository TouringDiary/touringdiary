
import { supabase } from '../supabaseClient';
import { CityDetails, CitySummary } from '../../types/index';
import { DatabaseCity } from '../../types/database';
import { getFromCache, setInCache, LONG_CACHE_TTL } from './cityCache';
import { calculateDistance } from '../geo';
import { getPoisByCityId, getPoisByCityIds } from './poiService';
import { getCityEvents, getCityServices, getCityGuides, getCityPeople } from './entitiesService';
import { GEO_CONFIG } from '../../constants/geoConfig';

const DEFAULT_RATINGS = { 
    cultura: 50, monumenti: 50, musei_arte: 50, tradizione: 50, architettura: 50,
    natura: 50, mare_spiagge: 50, paesaggi: 50, clima: 50, sostenibilita: 50,
    gusto: 50, cucina: 50, vita_notturna: 50, caffe_bar: 50, mercati: 50,
    viaggiatore: 50, mobilita: 50, accoglienza: 50, costo: 50, sicurezza: 50
};

export const getFullManifestAsync = async (): Promise<CitySummary[]> => {
    const CACHE_KEY = 'manifest_full';
    const cached = getFromCache<CitySummary[]>(CACHE_KEY);
    if (cached) return cached;

    const { data, error } = await supabase.from('cities').select('*').order('updated_at', { ascending: false });

    if (error) { 
        if (error.message === 'TypeError: Failed to fetch' || error.message?.includes('fetch')) {
            console.warn("Cities offline: Database non raggiungibile. Uso fallback vuoto.");
        } else {
            console.error("DB Error:", error); 
        }
        return []; 
    }
    
    const result = (data as any[]).map(db => {
        // Una città ha contenuto generato se ha log di generazione (incluso il flag di forzatura manuale)
        const hasContent = db.generation_logs && db.generation_logs.length > 0;
                           
        return {
            id: db.id, name: db.name, continent: db.continent || GEO_CONFIG.DEFAULT_CONTINENT, nation: db.nation || GEO_CONFIG.DEFAULT_NATION, 
            adminRegion: db.admin_region || GEO_CONFIG.DEFAULT_REGION, zone: db.zone, description: db.description || '', 
            imageUrl: db.image_url, heroImage: db.hero_image, rating: db.rating || 0, visitors: db.visitors || 0, 
            isFeatured: db.is_featured || false, specialBadge: (db.special_badge as any) || null,
            homeOrder: db.home_order || null,
            coords: { lat: db.coords_lat, lng: db.coords_lng }, status: db.status as 'published' | 'draft' | 'needs_check' || 'published', 
            createdAt: db.created_at, updatedAt: db.updated_at, publishedAt: db.published_at,
            tags: [],
            hasGeneratedContent: hasContent
        };
    });

    setInCache(CACHE_KEY, result, LONG_CACHE_TTL); 
    return result;
};

export const getCityDetails = async (cityId: string): Promise<CityDetails | null> => {
    const CACHE_KEY = `city_details_${cityId}`;
    const cached = getFromCache<CityDetails>(CACHE_KEY);
    if (cached) return cached;

    const { data: cityData, error: cityErr } = await supabase.from('cities').select('*').eq('id', cityId).maybeSingle();

    if (cityErr || !cityData) return null;
    const dbCity = cityData as any;

    const [pois, events, services, guides, people] = await Promise.all([
        getPoisByCityId(cityId), 
        getCityEvents(cityId), 
        getCityServices(cityId), 
        getCityGuides(cityId), 
        getCityPeople(cityId)
    ]);
    
    const sortedPeople = people.sort((a,b) => (a.orderIndex || 0) - (b.orderIndex || 0));

    const hasContent = dbCity.generation_logs && dbCity.generation_logs.length > 0;

    const result = {
        id: dbCity.id, name: dbCity.name, continent: dbCity.continent || GEO_CONFIG.DEFAULT_CONTINENT, nation: dbCity.nation || GEO_CONFIG.DEFAULT_NATION, 
        adminRegion: dbCity.admin_region || GEO_CONFIG.DEFAULT_REGION, zone: dbCity.zone, 
        description: dbCity.description || '', // FORCE NOT NULL STRING
        imageUrl: dbCity.image_url, rating: dbCity.rating || 0, visitors: dbCity.visitors || 0, 
        isFeatured: dbCity.is_featured || false, specialBadge: (dbCity.special_badge as any) || null,
        homeOrder: dbCity.home_order || null,
        coords: { lat: dbCity.coords_lat, lng: dbCity.coords_lng }, status: dbCity.status as any, updatedAt: dbCity.updated_at,
        tags: [],
        hasGeneratedContent: hasContent,
        details: {
            subtitle: dbCity.subtitle || '', heroImage: dbCity.hero_image || dbCity.image_url, 
            historySnippet: dbCity.history_snippet || dbCity.description || '', historyFull: dbCity.history_full || '', 
            officialWebsite: dbCity.official_website, patron: (dbCity.patron_details as any)?.name || 'N/A', 
            patronDetails: dbCity.patron_details as any, ratings: { ...DEFAULT_RATINGS, ...(dbCity.ratings as any || {}) }, 
            gallery: dbCity.gallery || [], 
            events: events, services: services, guides: guides, famousPeople: sortedPeople, allPois: pois,
            topAttractions: pois.filter(p => p.category === 'monument'), 
            foodSpots: pois.filter(p => p.category === 'food'), 
            hotels: pois.filter(p => p.category === 'hotel'), 
            leisureSpots: pois.filter(p => p.category === 'leisure'), 
            newDiscoveries: pois.filter(p => p.category === 'discovery'),
            generationLogs: dbCity.generation_logs || [] 
        }
    } as CityDetails;

    setInCache(CACHE_KEY, result);
    return result;
};

export const buildVirtualCity = async (
    centerCoords: { lat: number, lng: number }, 
    radiusKm: number, 
    manifest: CitySummary[],
    baseCity?: CityDetails
): Promise<CityDetails | null> => {
    try {
        const nearbyCities = manifest.filter(c => {
            const dist = calculateDistance(centerCoords.lat, centerCoords.lng, c.coords.lat, c.coords.lng);
            return dist <= radiusKm;
        });

        if (nearbyCities.length === 0 && !baseCity) return null;

        const cityIds = nearbyCities.map(c => c.id);
        
        const [allPois, allEvents, allGuides] = await Promise.all([
            getPoisByCityIds(cityIds),
            Promise.all(cityIds.map(id => getCityEvents(id))).then(res => res.flat()),
            Promise.all(cityIds.map(id => getCityGuides(id))).then(res => res.flat())
        ]);

        const isMergedMode = !!baseCity;
        
        const virtualCity: CityDetails = {
            id: isMergedMode ? baseCity.id : 'around-me-virtual',
            name: isMergedMode ? baseCity.name : 'Around Me', 
            zone: isMergedMode ? baseCity.zone : `Raggio ${radiusKm}km`,
            adminRegion: isMergedMode ? baseCity.adminRegion : GEO_CONFIG.DEFAULT_REGION,
            nation: isMergedMode ? baseCity.nation : GEO_CONFIG.DEFAULT_NATION,
            continent: isMergedMode ? baseCity.continent : GEO_CONFIG.DEFAULT_CONTINENT,
            description: isMergedMode 
                ? (baseCity.description || '') 
                : `Esplorazione territoriale personalizzata. Include ${nearbyCities.length} località nel raggio di ${radiusKm}km dalla tua posizione.`,
            imageUrl: isMergedMode 
                ? baseCity.imageUrl 
                : (nearbyCities[0]?.imageUrl || 'https://images.unsplash.com/photo-1596825205486-3c36957b9fba?q=80&w=1200'),
            rating: isMergedMode ? baseCity.rating : 0,
            visitors: isMergedMode ? baseCity.visitors : 0,
            isFeatured: false,
            coords: centerCoords,
            status: 'published',
            tags: [],
            hasGeneratedContent: true,
            details: {
                subtitle: isMergedMode ? (baseCity.details.subtitle || '') : `${nearbyCities.length} Città vicine`,
                heroImage: isMergedMode ? baseCity.details.heroImage : (nearbyCities[0]?.imageUrl || ''),
                historySnippet: isMergedMode ? (baseCity.details.historySnippet || '') : `Esplorazione libera del territorio.`,
                historyFull: isMergedMode ? (baseCity.details.historyFull || '') : '',
                allPois: allPois,
                events: allEvents,
                guides: allGuides,
                topAttractions: allPois.filter(p => p.category === 'monument'),
                foodSpots: allPois.filter(p => p.category === 'food'),
                hotels: allPois.filter(p => p.category === 'hotel'),
                leisureSpots: allPois.filter(p => p.category === 'leisure'),
                newDiscoveries: allPois.filter(p => p.category === 'discovery'),
                services: isMergedMode ? baseCity.details.services : [],
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
