
import { PoiCategory } from '../types/index';

// --- TIPI INTERNI OSM ---
interface OsmRawElement {
    type: 'node' | 'way' | 'relation';
    id: number;
    lat?: number;
    lon?: number;
    center?: { lat: number, lon: number };
    tags?: Record<string, string>;
}

interface OsmResponse {
    version: number;
    generator: string;
    elements: OsmRawElement[];
    remark?: string; 
}

interface BoundingBox {
    south: number;
    west: number;
    north: number;
    east: number;
}

const OSM_QUERY_MAP: Record<string, string[]> = {
    monument: [
        'node["historic"]', 'way["historic"]', 'relation["historic"]',
        'node["tourism"="museum"]', 'way["tourism"="museum"]', 'relation["tourism"="museum"]',
        'node["tourism"="attraction"]', 'way["tourism"="attraction"]', 'relation["tourism"="attraction"]',
        'node["tourism"="artwork"]',
        'node["amenity"="place_of_worship"]', 'way["amenity"="place_of_worship"]', 'relation["amenity"="place_of_worship"]',
        'node["leisure"="square"]', 'way["leisure"="square"]', 'relation["leisure"="square"]',
        'node["place"="square"]', 'way["place"="square"]', 'relation["place"="square"]'
    ],
    food: [
        'node["amenity"~"restaurant|cafe|fast_food|pub|bar|ice_cream|biergarten"]',
        'way["amenity"~"restaurant|cafe|fast_food|pub|bar|ice_cream|biergarten"]'
    ],
    hotel: [
        'node["tourism"~"hotel|guest_house|hostel|apartment|motel|chalet|camp_site"]',
        'way["tourism"~"hotel|guest_house|hostel|apartment|motel|chalet|camp_site"]',
        'relation["tourism"~"hotel|guest_house|hostel|apartment|motel|chalet|camp_site"]'
    ],
    nature: [
        'node["natural"]', 'way["natural"]', 'relation["natural"]',
        'node["leisure"="park"]', 'way["leisure"="park"]', 'relation["leisure"="park"]',
        'node["leisure"="garden"]', 'way["leisure"="garden"]', 'relation["leisure"="garden"]',
        'node["tourism"="viewpoint"]',
        'node["natural"="beach"]', 'way["natural"="beach"]', 'relation["natural"="beach"]'
    ],
    leisure: [
        'node["leisure"~"water_park|sports_centre|stadium|pitch|playground"]',
        'way["leisure"~"water_park|sports_centre|stadium|pitch|playground"]',
        'relation["leisure"~"water_park|sports_centre|stadium|pitch|playground"]',
        'node["amenity"~"cinema|theatre|nightclub|casino"]',
        'way["amenity"~"cinema|theatre|nightclub|casino"]'
    ],
    shop: [
        'node["shop"]',
        'way["shop"]'
    ],
    services: [
        'node["amenity"~"pharmacy|hospital|police|post_office|bank|atm|car_rental|taxi|bus_station|ferry_terminal"]',
        'way["amenity"~"pharmacy|hospital|police|post_office|bank|atm|car_rental|taxi|bus_station|ferry_terminal"]',
        'node["public_transport"]',
        'node["railway"="station"]', 'way["railway"="station"]'
    ]
};

const OVERPASS_INSTANCES = [
    'https://overpass-api.de/api/interpreter',                
    'https://overpass.kumi.systems/api/interpreter',          
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter' 
];

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchOverpassWithRetry = async (query: string, attempt: number = 1, serverIndex: number = 0): Promise<OsmResponse> => {
    const MAX_RETRIES = 5; 
    const BASE_DELAY = 2000; 
    
    const currentUrl = OVERPASS_INSTANCES[serverIndex % OVERPASS_INSTANCES.length];

    try {
        const response = await fetch(currentUrl, {
            method: 'POST',
            body: `data=${encodeURIComponent(query)}`,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (response.status === 429 || response.status === 504 || response.status >= 500) {
            if (attempt <= MAX_RETRIES) {
                const nextServerIndex = serverIndex + 1;
                const delay = BASE_DELAY * Math.pow(1.5, attempt - 1); 
                // Silenced log
                await wait(delay);
                return fetchOverpassWithRetry(query, attempt + 1, nextServerIndex);
            }
            throw new Error(`Overpass Limit Exceeded (${response.status})`);
        }

        if (!response.ok) {
            throw new Error(`Error OSM: ${response.status}`);
        }

        const text = await response.text();
        try {
            const json = JSON.parse(text);
            return json;
        } catch (parseError) {
            if (attempt <= MAX_RETRIES) {
                await wait(1000);
                return fetchOverpassWithRetry(query, attempt + 1, serverIndex + 1);
            }
            throw new Error("Invalid Overpass response");
        }

    } catch (e: any) {
        if (attempt <= MAX_RETRIES) {
            const delay = BASE_DELAY * Math.pow(1.5, attempt - 1);
            await wait(delay);
            return fetchOverpassWithRetry(query, attempt + 1, serverIndex + 1);
        }
        throw e;
    }
};

const generateGridChunks = (lat: number, lng: number, radiusMeters: number, chunkSizeMeters: number = 5000): BoundingBox[] => {
    const earthRadius = 6371000;
    const latOffset = (radiusMeters / earthRadius) * (180 / Math.PI);
    const lngOffset = (radiusMeters / earthRadius) * (180 / Math.PI) / Math.cos(lat * Math.PI / 180);
    
    const minLat = lat - latOffset;
    const maxLat = lat + latOffset;
    const minLng = lng - lngOffset;
    const maxLng = lng + lngOffset;

    const latStep = (chunkSizeMeters / earthRadius) * (180 / Math.PI);
    const lngStep = (chunkSizeMeters / earthRadius) * (180 / Math.PI) / Math.cos(lat * Math.PI / 180);

    const chunks: BoundingBox[] = [];

    for (let currentLat = minLat; currentLat < maxLat; currentLat += latStep) {
        for (let currentLng = minLng; currentLng < maxLng; currentLng += lngStep) {
            chunks.push({
                south: currentLat,
                west: currentLng,
                north: Math.min(currentLat + latStep, maxLat),
                east: Math.min(currentLng + lngStep, maxLng)
            });
        }
    }
    return chunks;
};

const buildOverpassQuery = (
    category: string, 
    filterType: 'around' | 'area' | 'bbox',
    params: { lat?: number, lng?: number, radius?: number, areaId?: number, bbox?: BoundingBox }
): string => {
    
    let query = `[out:json][timeout:180][maxsize:20000000];`; 
    let filterString = '';

    if (filterType === 'area' && params.areaId) {
        filterString = `(area:${3600000000 + params.areaId})`;
    } else if (filterType === 'around' && params.lat && params.lng && params.radius) {
        filterString = `(around:${params.radius},${params.lat},${params.lng})`;
    } else if (filterType === 'bbox' && params.bbox) {
        filterString = `(${params.bbox.south},${params.bbox.west},${params.bbox.north},${params.bbox.east})`;
    }

    query += `(`;
    const queryParts = OSM_QUERY_MAP[category] || OSM_QUERY_MAP['monument'];
    queryParts.forEach(part => {
        query += `${part}${filterString};`;
    });
    query += `);out center;`; 
    return query;
};

const fetchOsmAreaId = async (cityName: string): Promise<number | null> => {
    const query = `
        [out:json][timeout:30];
        relation["name"~"^${cityName}$",i]["admin_level"="8"];
        out tags;
    `;
    
    try {
        const data = await fetchOverpassWithRetry(query);
        if (data && data.elements && data.elements.length > 0) {
            return data.elements[0].id;
        }
    } catch (e) {}
    return null;
};

const mapOsmCategoryToApp = (tags: Record<string, string> | undefined, requestedCategory: string): { cat: PoiCategory, sub: string | null } => {
    if (!tags) return { cat: requestedCategory as PoiCategory, sub: null };

    const amenity = tags['amenity'];
    const tourism = tags['tourism'];
    const historic = tags['historic'];
    const leisure = tags['leisure'];
    const shop = tags['shop'];
    const natural = tags['natural'];
    const place = tags['place'];
    const cuisine = tags['cuisine'];

    if (amenity === 'restaurant') return { cat: 'food', sub: 'restaurant' };
    if (amenity === 'cafe') return { cat: 'food', sub: 'bar' };
    if (amenity === 'bar') return { cat: 'food', sub: 'bar' };
    if (amenity === 'pub') return { cat: 'food', sub: 'pub' };
    if (amenity === 'ice_cream') return { cat: 'food', sub: 'gelato' };
    if (amenity === 'fast_food') return { cat: 'food', sub: 'fast_food' };
    if (cuisine === 'pizza') return { cat: 'food', sub: 'pizzeria' };
    
    if (tourism === 'hotel') return { cat: 'hotel', sub: 'hotel' };
    if (tourism === 'guest_house') return { cat: 'hotel', sub: 'bnb' };
    if (tourism === 'hostel') return { cat: 'hotel', sub: 'hostel' };
    if (tourism === 'apartment') return { cat: 'hotel', sub: 'apartment' };
    if (tourism === 'camp_site') return { cat: 'hotel', sub: 'camping' };
    
    if (historic) return { cat: 'monument', sub: 'monument' }; 
    if (tourism === 'museum') return { cat: 'monument', sub: 'museum' };
    if (amenity === 'place_of_worship') return { cat: 'monument', sub: 'church' };
    if (leisure === 'square' || place === 'square') return { cat: 'monument', sub: 'square' };
    if (tourism === 'attraction') return { cat: 'monument', sub: 'monument' };
    
    if (leisure === 'park' || leisure === 'garden') return { cat: 'nature', sub: 'park' };
    if (natural === 'beach') return { cat: 'nature', sub: 'beach_free' };
    if (tourism === 'viewpoint') return { cat: 'nature', sub: 'viewpoint' };
    
    if (amenity === 'bank' || amenity === 'atm') return { cat: 'shop', sub: 'bank' }; 
    if (amenity === 'car_rental' || shop === 'car') return { cat: 'shop', sub: 'rental' };
    if (shop === 'travel_agency') return { cat: 'leisure', sub: 'tour_operator' }; 

    if (shop) return { cat: 'shop', sub: shop }; 

    return { cat: requestedCategory as PoiCategory, sub: amenity || tourism || leisure || shop || null };
};

const buildAddressFromTags = (tags: Record<string, string> | undefined): string | null => {
    if (!tags) return null;
    const street = tags['addr:street'] || tags['addr:place'] || '';
    if (!street) return null; 

    const number = tags['addr:housenumber'] ? `, ${tags['addr:housenumber']}` : '';
    const city = tags['addr:city'] ? ` - ${tags['addr:city']}` : '';
    return `${street}${number}${city}`;
};

export const fetchOsmData = async (
    lat: number, 
    lng: number, 
    radius: number, 
    category: string,
    cityName: string 
): Promise<any[]> => { 
    
    let allElements: OsmRawElement[] = [];
    
    const SAFE_RADIUS_THRESHOLD = 25000; 
    const DEFAULT_CITY_RADIUS = 6000; 
    
    const effectiveRadius = radius === 0 ? DEFAULT_CITY_RADIUS : radius;
    const useChunking = effectiveRadius > SAFE_RADIUS_THRESHOLD;
    
    if (useChunking) {
        const chunks = generateGridChunks(lat, lng, effectiveRadius, 5000); 

        for (let i = 0; i < chunks.length; i++) {
            const bbox = chunks[i];
            const ql = buildOverpassQuery(category, 'bbox', { bbox });
            try {
                if (i > 0) await wait(1500); 
                const response = await fetchOverpassWithRetry(ql);
                if (response.elements) allElements.push(...response.elements);
            } catch (e) {
                // Ignore chunk error
            }
        }
    } else {
        let ql = '';

        if (radius === 0) {
            const areaId = await fetchOsmAreaId(cityName);
            if (areaId) {
                ql = buildOverpassQuery(category, 'area', { areaId });
            } else {
                ql = buildOverpassQuery(category, 'around', { lat, lng, radius: DEFAULT_CITY_RADIUS });
            }
        } else {
            ql = buildOverpassQuery(category, 'around', { lat, lng, radius: effectiveRadius });
        }

        try {
            const response = await fetchOverpassWithRetry(ql);
            allElements = response.elements || [];
        } catch (e: any) {
            throw new Error(`Errore OSM: ${e.message}`);
        }
    }
    
    if (!allElements || allElements.length === 0) return [];

    const uniqueElements = new Map<number, OsmRawElement>();
    allElements.forEach(el => {
        if (!uniqueElements.has(el.id)) {
            uniqueElements.set(el.id, el);
        }
    });
    
    const distinctElements = Array.from(uniqueElements.values());

    const mappedItems = distinctElements
        .filter(el => el.tags && el.tags['name']) 
        .map(el => {
            const tags = el.tags || {}; 
            const { cat, sub } = mapOsmCategoryToApp(tags, category);
            
            let rawCat = sub || tags['amenity'] || tags['tourism'] || tags['shop'] || tags['historic'] || tags['leisure'] || 'unknown';
            
            if (tags['amenity'] === 'bank') rawCat = 'bank';
            if (tags['amenity'] === 'car_rental' || tags['shop'] === 'car') rawCat = 'rental';
            if (tags['shop'] === 'travel_agency') rawCat = 'tour_operator';
            if (tags['amenity'] === 'police') rawCat = 'emergency';

            const finalLat = el.lat || el.center?.lat || 0;
            const finalLon = el.lon || el.center?.lon || 0;

            if (finalLat === 0 || finalLon === 0) return null;

            return {
                osm_id: `${el.type}/${el.id}`,
                name: tags['name']!, 
                raw_category: rawCat,
                category: cat, 
                coords_lat: finalLat,
                coords_lng: finalLon,
                address: buildAddressFromTags(tags),
                processing_status: 'new',
                ai_rating: 'medium'
            };
        })
        .filter(item => item !== null); 

    return mappedItems as any[];
};
