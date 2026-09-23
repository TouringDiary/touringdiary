import {
  CITY_BADGE_VALUES,
  CITY_STATUS_VALUES,
  fromEditorialStatusDb,
  IMAGE_LICENSE_VALUES,
  type ImageLicense,
  POI_CATEGORY_VALUES,
} from '@/constants/governance';
import { GEO_CONFIG } from '../../constants/geoConfig';
import type { DatabaseCityRouteView } from '../../types/database';
import type * as Domain from '../../types/domain/index';
import type {
  CityDetails,
  CityEvent,
  CityGuide,
  CityIdentity,
  CityService as CityServiceEntity,
  CitySummary,
  CityTourOperator,
  FamousPerson,
  MediaAsset,
  PointOfInterest,
} from '../../types/index';
import type { Json } from '../../types/supabase';
import { sanitizeMediaStatus } from '../../utils/media';
import { calculateDistance } from '../geo';
import {
  applyPrimaryImageCutoverForCityPeople,
  applyPrimaryImageCutoverForPoisList,
} from '../media/entityPrimaryImageReadService';
import { supabase } from '../supabaseClient';
import { getFromCache, LONG_CACHE_TTL, setInCache } from './cityCache';
import {
  type CityPeopleAudience,
  getCityEvents,
  getCityEventsByCityIds,
  getCityGuides,
  getCityGuidesByCityIds,
  getCityPeople,
  getCityPeopleByCityIds,
  getCityServices,
  getCityServicesByCityIds,
} from './entitiesService';
import { parseLogs } from './parsers/content/parseLogs';
import { parsePatron } from './parsers/content/parsePatron';
import { parseRatings } from './parsers/content/parseRatings';
import { filterFamousPeopleByAudience } from './parsers/entities/famousPersonAudience';
import { parseEvent } from './parsers/entities/parseEvent';
import { parseGuide } from './parsers/entities/parseGuide';
import { parsePerson } from './parsers/entities/parsePerson';
import { parseService } from './parsers/entities/parseService';
import { parseTourOperator } from './parsers/entities/parseTourOperator';
import { parseGallery } from './parsers/media/parseGallery';
import { parseMediaAsset } from './parsers/media/parseMediaAsset';
import { mapDbPoiToApp } from './poi/poiMapper';
import { getPoisByCityId, getPoisByCityIds } from './poi/poiRead';
import { getCityTourOperators, getCityTourOperatorsByCityIds } from './tourOperatorService';

const DEFAULT_RATINGS = {
  cultura: 50,
  monumenti: 50,
  musei_arte: 50,
  tradizione: 50,
  architettura: 50,
  natura: 50,
  mare_spiagge: 50,
  paesaggi: 50,
  clima: 50,
  sostenibilita: 50,
  gusto: 50,
  cucina: 50,
  vita_notturna: 50,
  caffe_bar: 50,
  mercati: 50,
  viaggiatore: 50,
  mobilita: 50,
  accoglienza: 50,
  costo: 50,
  sicurezza: 50,
};

const CITY_STATUS_SET = new Set<string>(CITY_STATUS_VALUES);
const CITY_BADGE_SET = new Set<string>(CITY_BADGE_VALUES);
const IMAGE_LICENSE_SET = new Set<string>(IMAGE_LICENSE_VALUES);

const POI_CATEGORY_BY_VALUE = Object.fromEntries(
  POI_CATEGORY_VALUES.map((value) => [value, value]),
) as Record<(typeof POI_CATEGORY_VALUES)[number], (typeof POI_CATEGORY_VALUES)[number]>;

/**
 * Categorie POI centralizzate — valori derivati da POI_CATEGORY_VALUES (governance).
 */
export const POI_CATEGORIES = {
  MONUMENT: POI_CATEGORY_BY_VALUE.monument,
  FOOD: POI_CATEGORY_BY_VALUE.food,
  HOTEL: POI_CATEGORY_BY_VALUE.hotel,
  LEISURE: POI_CATEGORY_BY_VALUE.leisure,
  DISCOVERY: POI_CATEGORY_BY_VALUE.discovery,
} as const;

function parseCityStatusFromDb(raw: string | null | undefined): CitySummary['status'] {
  if (raw == null || String(raw).trim() === '') return 'published';
  const normalized = String(raw).trim().toLowerCase();
  if (CITY_STATUS_SET.has(normalized)) return normalized as CitySummary['status'];
  console.warn(`[cityReadService] Unknown city status "${raw}" — using needs_check`);
  return 'needs_check';
}

function parseImageLicenseFromDb(raw: string | null | undefined): ImageLicense | undefined {
  if (raw == null || String(raw).trim() === '') return undefined;
  const normalized = String(raw).trim().toLowerCase();
  if (IMAGE_LICENSE_SET.has(normalized)) return normalized as ImageLicense;
  console.warn(`[cityReadService] Unknown image_license "${raw}"`);
  return undefined;
}

function parseSpecialBadgeFromDb(
  raw: string | null | undefined,
): CitySummary['specialBadge'] | undefined {
  if (raw == null || String(raw).trim() === '') return undefined;
  const normalized = String(raw).trim().toLowerCase();
  if (CITY_BADGE_SET.has(normalized)) return normalized as CitySummary['specialBadge'];
  console.warn(`[cityReadService] Unknown special_badge "${raw}"`);
  return undefined;
}

function parseClassificationExplainability(
  value: Json | null | undefined,
): Record<string, number> | undefined {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const out: Record<string, number> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'number' && Number.isFinite(entry)) {
      out[key] = entry;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Campi `cities` letti da cityRowToRouteView / readCityRowJsonFields (contratto endpoint, non validati runtime). */
type CityDetailsApiRowFields = Pick<
  Domain.DbCity,
  | 'slug'
  | 'generation_logs'
  | 'coords_lat'
  | 'coords_lng'
  | 'updated_at'
  | 'status'
  | 'continent'
  | 'nation'
  | 'admin_region'
  | 'region_id'
  | 'zone'
  | 'tourist_zone_id'
  | 'description'
  | 'image_url'
  | 'hero_image'
  | 'rating'
  | 'visitors'
  | 'is_featured'
  | 'special_badge'
  | 'home_order'
  | 'city_types'
  | 'classification_explainability'
  | 'created_at'
  | 'subtitle'
  | 'history_snippet'
  | 'history_full'
  | 'official_website'
  | 'patron_details'
  | 'image_status'
  | 'hero_status'
  | 'image_credit'
  | 'image_license'
  | 'ratings'
  | 'gallery'
>;

/**
 * Boundary dedicato per GET /api/city/:cityId/details (`city` = `select *` su `cities`).
 * Identità (id, name) obbligatoria; altri campi opzionali a livello di tipo perché il guard
 * runtime non ne garantisce presenza né forma — si fidano del contratto endpoint/DB.
 */
type CityDetailsApiRow = Pick<Domain.DbCity, 'id' | 'name'> &
  Partial<CityDetailsApiRowFields> & {
    patron_editorial_status?: string | null;
  };

/** Identità minima verificata runtime: id + name. Non valida la shape completa della riga. */
type CityDetailsApiIdentity = Pick<Domain.DbCity, 'id' | 'name'>;

/**
 * Minimal identity guard per il payload `city` dell'endpoint details.
 * Accetta la riga solo se id e name sono stringhe; NON valida gli altri campi del boundary.
 */
function isCityDetailsApiIdentity(value: unknown): value is CityDetailsApiIdentity {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === 'string' && typeof record.name === 'string';
}

type CityRowJsonFields = {
  ratings?: Json | null;
  gallery?: Json | null;
  patron_editorial_status?: string | null;
};

function readCityRowJsonFields(row: CityDetailsApiRow): CityRowJsonFields {
  const record = row as Record<string, unknown>;
  const patronStatus = record.patron_editorial_status;
  return {
    ratings: row.ratings,
    gallery: row.gallery,
    patron_editorial_status: typeof patronStatus === 'string' ? patronStatus : null,
  };
}

/** Adatta una riga `cities` (API/Supabase) al contratto del mapper canonico. */
function cityRowToRouteView(row: CityDetailsApiRow): DatabaseCityRouteView {
  const slug = row.slug ?? row.id;
  const generationLogs = Array.isArray(row.generation_logs)
    ? row.generation_logs.filter((entry): entry is string => typeof entry === 'string')
    : undefined;

  return {
    city_id: row.id,
    id: row.id,
    slug,
    name: row.name,
    city_name: row.name,
    city_slug: slug,
    // Normalizzazione tecnica: 0 ≠ GPS valido. Assenza DB → 0 non è posizione pubblica reale;
    // la pubblicazione con coordinate GPS richiede valori presenti e validi (audit/review guard).
    coords_lat: row.coords_lat ?? 0,
    coords_lng: row.coords_lng ?? 0,
    zone_slug: '',
    region_slug: '',
    nation_slug: '',
    continent_slug: '',
    updated_at: row.updated_at ?? '',
    status: parseCityStatusFromDb(row.status),
    generation_logs: generationLogs,
    continent: row.continent ?? undefined,
    nation: row.nation ?? undefined,
    admin_region: row.admin_region ?? undefined,
    region_id: row.region_id ?? undefined,
    zone: row.zone ?? undefined,
    tourist_zone_id: row.tourist_zone_id ?? undefined,
    description: row.description ?? undefined,
    image_url: row.image_url ?? undefined,
    hero_image: row.hero_image ?? undefined,
    rating: row.rating ?? undefined,
    visitors: row.visitors ?? undefined,
    is_featured: row.is_featured ?? undefined,
    special_badge: parseSpecialBadgeFromDb(row.special_badge),
    home_order: row.home_order ?? undefined,
    city_types: row.city_types ?? undefined,
    classification_explainability: row.classification_explainability ?? undefined,
    created_at: row.created_at ?? undefined,
    subtitle: row.subtitle ?? undefined,
    history_snippet: row.history_snippet ?? undefined,
    history_full: row.history_full ?? undefined,
    official_website: row.official_website ?? undefined,
    patron_details: row.patron_details ?? undefined,
    image_status: row.image_status,
    hero_status: row.hero_status,
    image_credit: row.image_credit ?? undefined,
    image_license: row.image_license ?? undefined,
  };
}

/**
 * Mapper esplicito da DatabaseCityRouteView a CitySummary.
 */
const mapDbCityToSummary = (
  db: DatabaseCityRouteView,
  zoneMap?: Map<string, string>,
): CitySummary | null => {
  const id = db.city_id || db.id;
  if (!id) return null;

  // Stesso contratto di cityRowToRouteView: fallback 0 = normalizzazione mapper, non GPS pubblicato.
  const lat = Number(db.coords_lat ?? 0);
  const lng = Number(db.coords_lng ?? 0);
  const hasContent = Array.isArray(db.generation_logs) && db.generation_logs.length > 0;
  const imageUrl = db.image_url || '';
  const heroImage = db.hero_image || '';

  // Risoluzione deterministica del nome zona basato esclusivamente sulla FK tourist_zone_id
  let resolvedZone: string | undefined;
  if (db.tourist_zone_id && zoneMap) {
    resolvedZone = zoneMap.get(db.tourist_zone_id);
    if (!resolvedZone) {
      console.warn(
        `[GeoRegistry:Drift] City ID ${id} (${db.city_name || db.name || 'Sconosciuta'}) has orphan tourist_zone_id: ${db.tourist_zone_id}`,
      );
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
    zone: resolvedZone ?? '',
    tourist_zone_id: db.tourist_zone_id || undefined,
    description: db.description || '',
    imageUrl,
    image_status: sanitizeMediaStatus(db.image_status),
    imageCredit: db.image_credit || undefined,
    imageLicense: parseImageLicenseFromDb(db.image_license),
    imageAsset: parseMediaAsset(imageUrl, db.image_status, db.image_credit, db.image_license),
    heroImage,
    hero_status: sanitizeMediaStatus(db.hero_status),
    heroAsset: parseMediaAsset(heroImage, db.hero_status, db.image_credit, db.image_license),
    rating: db.rating || 0,
    visitors: db.visitors || 0,
    isFeatured: db.is_featured || false,
    specialBadge: parseSpecialBadgeFromDb(db.special_badge),
    homeOrder: db.home_order ?? undefined,
    coords: { lat, lng },
    status: parseCityStatusFromDb(db.status),
    createdAt: db.created_at || '',
    updatedAt: db.updated_at || '',
    publishedAt: db.published_at || '',
    tags: db.city_types ?? [],
    cityTypes: db.city_types ?? [],
    classificationExplainability: parseClassificationExplainability(
      db.classification_explainability,
    ),
    hasGeneratedContent: hasContent,
    continent_slug: db.continent_slug || undefined,
    nation_slug: db.nation_slug || undefined,
    region_slug: db.region_slug || undefined,
    zone_slug: db.zone_slug || undefined,
  };
};

/**
 * Mapper esplicito da DatabaseCityRouteView a CityDetails.
 */
const mapDbCityToDetails = (
  db: DatabaseCityRouteView,
  extra: {
    pois: PointOfInterest[];
    events: CityEvent[];
    services: CityServiceEntity[];
    guides: CityGuide[];
    tourOperators: CityTourOperator[];
    famousPeople: FamousPerson[];
  },
  zoneMap?: Map<string, string>,
  cityRowJson?: CityRowJsonFields,
): CityDetails | null => {
  if (!db) return null;
  const summary = mapDbCityToSummary(db, zoneMap);

  if (!summary) {
    console.error('[CITY_CORRUPTION] mapDbCityToSummary returned null', {
      city_id: db.city_id,
      city_slug: db.city_slug,
      city_name: db.city_name,
      raw: db,
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
      heroAsset: parseMediaAsset(
        db.hero_image || db.image_url || '',
        db.hero_status ?? 'missing',
        db.image_credit,
        db.image_license,
      ),
      patron: parsePatron(db.patron_details)?.name || '',
      patronEditorialStatus: fromEditorialStatusDb(
        cityRowJson?.patron_editorial_status ?? db.patron_editorial_status,
      ),
      patronDetails: parsePatron(db.patron_details) || undefined,
      ratings: {
        ...DEFAULT_RATINGS,
        ...parseRatings(cityRowJson?.ratings ?? db.ratings),
      } as CityDetails['details']['ratings'],
      gallery: parseGallery(cityRowJson?.gallery ?? db.gallery),
      events,
      services,
      guides,
      tourOperators,
      famousPeople,
      allPois: pois,
      topAttractions: pois.filter((p) => p.category === POI_CATEGORIES.MONUMENT),
      foodSpots: pois.filter((p) => p.category === POI_CATEGORIES.FOOD),
      hotels: pois.filter((p) => p.category === POI_CATEGORIES.HOTEL),
      newDiscoveries: pois.filter((p) => p.category === POI_CATEGORIES.DISCOVERY),
      leisureSpots: pois.filter((p) => p.category === POI_CATEGORIES.LEISURE),
      generationLogs: parseLogs(db.generation_logs),
    },
  };
};

const GLOBAL_READ_PAGE_SIZE = 1000;

function isAbortLikeError(error: unknown, signal?: AbortSignal): boolean {
  if (signal?.aborted) return true;
  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    return error.name === 'AbortError';
  }
  return error instanceof Error && error.name === 'AbortError';
}

export const getFullManifestAsync = async (
  onlyPublished = true,
  options?: { bypassCache?: boolean },
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
      }
    }
  } catch (apiError) {
    console.warn('[CityReadService] API locale fallita, uso fallback Supabase', apiError);
  }

  if (dbData.length === 0) {
    let offset = 0;
    for (;;) {
      let query = supabase.from('seo_city_routes').select('*');
      if (onlyPublished) {
        query = query.eq('status', 'published');
      }
      const { data, error } = await query
        .order('updated_at', { ascending: false })
        .order('id', { ascending: true })
        .range(offset, offset + GLOBAL_READ_PAGE_SIZE - 1);
      if (error) {
        console.error('DB Error manifest fallback (seo_city_routes):', error);
        return [];
      }
      const batch = (data ?? []) as DatabaseCityRouteView[];
      dbData.push(...batch);
      if (batch.length < GLOBAL_READ_PAGE_SIZE) break;
      offset += batch.length;
    }
  }

  // Caricamento e costruzione mappa zone turistiche per risoluzione dei nomi basati su ID
  const { data: zonesData } = await supabase.from('tourist_zones').select('id, name');
  const zoneMap = new Map<string, string>();
  if (zonesData) {
    zonesData.forEach((z) => {
      zoneMap.set(z.id, z.name);
    });
  }

  // Normalizzazione dati tramite mapper canonico
  let result = dbData
    .map((db) => mapDbCityToSummary(db, zoneMap))
    .filter((c): c is CitySummary => c !== null);

  if (onlyPublished) {
    result = result.filter((c) => c.status === 'published');
  }

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
    zonesData.forEach((z) => {
      zoneMap.set(z.id, z.name);
    });
  }

  // 1. TENTA IL CARICAMENTO TRAMITE API LOCALE (1 chiamata invece di 6)
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/city/${cityId}/details`, {
      signal,
    });
    if (response.ok) {
      const apiRes = await response.json();
      if (apiRes.success && apiRes.city && isCityDetailsApiIdentity(apiRes.city)) {
        const routeView = cityRowToRouteView(apiRes.city);
        const pois = (apiRes.pois || []).map(mapDbPoiToApp);
        const events = (apiRes.events || []).map(parseEvent);
        const services = (apiRes.services || []).map(parseService);
        const tourOperators = (apiRes.tour_operators || []).map(parseTourOperator);
        const guides = (apiRes.guides || []).map(parseGuide);
        let people = filterFamousPeopleByAudience(
          (apiRes.people || []).map(parsePerson),
          peopleAudience,
        ).sort((a: FamousPerson, b: FamousPerson) => (a.orderIndex || 0) - (b.orderIndex || 0));

        people = await applyPrimaryImageCutoverForCityPeople(people);

        const visiblePois = await applyPrimaryImageCutoverForPoisList(pois);

        let result: CityDetails | null = null;

        result = mapDbCityToDetails(
          routeView,
          {
            pois: visiblePois,
            events,
            services,
            guides,
            tourOperators,
            famousPeople: people,
          },
          zoneMap,
          readCityRowJsonFields(apiRes.city),
        );

        if (!result) return null;

        setInCache(CACHE_KEY, result);
        return result;
      }
    }
  } catch (apiError) {
    if (isAbortLikeError(apiError, signal)) {
      throw apiError;
    }
    console.warn(
      `[CityReadService] API locale fallita per ${cityId}, uso fallback Supabase`,
      apiError,
    );
  }

  if (signal?.aborted) {
    throw new DOMException('The operation was aborted.', 'AbortError');
  }

  // 2. FALLBACK SUPABASE — stessa sorgente dell'API (tabella `cities`).
  // La view `seo_city_routes` è una proiezione snella per routing/manifest e NON espone
  // i campi di dettaglio (official_website, patron_details, history_*, ratings, gallery,
  // *_status, image_credit/license). Leggendo direttamente `cities`, come fa l'endpoint
  // API, il fallback costruisce un CityDetails funzionalmente identico: parità Desktop/Mobile.
  const { data: cityData, error: cityErr } = await supabase
    .from('cities')
    .select('*')
    .eq('id', cityId)
    .maybeSingle();

  if (cityErr || !cityData) return null;
  const dbCity = cityRowToRouteView(cityData);

  const [pois, events, services, guides, tourOperators, people] = await Promise.all([
    getPoisByCityId(cityId),
    getCityEvents(cityId),
    getCityServices(cityId),
    getCityGuides(cityId),
    getCityTourOperators(cityId),
    getCityPeople(cityId, peopleAudience),
  ]);
  const sortedPeople = people.sort(
    (a: FamousPerson, b: FamousPerson) => (a.orderIndex || 0) - (b.orderIndex || 0),
  );
  const cutoveredPeople = await applyPrimaryImageCutoverForCityPeople(sortedPeople);
  const visiblePois = await applyPrimaryImageCutoverForPoisList(pois);

  const result = mapDbCityToDetails(
    dbCity,
    {
      pois: visiblePois,
      events,
      services,
      guides,
      tourOperators,
      famousPeople: cutoveredPeople,
    },
    zoneMap,
    readCityRowJsonFields(cityData),
  );

  if (!result) return null;

  setInCache(CACHE_KEY, result);
  return result;
};

export const buildVirtualCity = async (
  centerCoords: { lat: number; lng: number },
  radiusKm: number,
  manifest: CitySummary[],
  /**
   * Opzioni di costruzione:
   * - `baseCity`: attiva la modalità fusione "Tutto Incluso" mantenendo l'identità della città base.
   * - `selectedCityIds`: sottoinsieme opzionale di città (per id) da includere nella fusione.
   *   Quando assente, viene usato l'intero raggio (comportamento storico Around Me).
   *   Cambia SOLO quali città vengono elaborate: la logica di fusione resta invariata.
   */
  options: { baseCity?: CityDetails; selectedCityIds?: string[] } = {},
): Promise<CityDetails | null> => {
  const { baseCity, selectedCityIds } = options;
  try {
    const inRadius = manifest
      .filter((c) => c.status === 'published')
      .filter((c) => {
        const dist = calculateDistance(
          centerCoords.lat,
          centerCoords.lng,
          c.coords.lat,
          c.coords.lng,
        );
        return dist <= radiusKm;
      });

    const selectedSet =
      selectedCityIds && selectedCityIds.length > 0 ? new Set(selectedCityIds) : null;
    const nearbyCities = selectedSet ? inRadius.filter((c) => selectedSet.has(c.id)) : inRadius;

    if (nearbyCities.length === 0 && !baseCity) return null;

    // In modalità fusione i contenuti della città base sono sempre inclusi,
    // insieme a quelli delle (sole) città selezionate.
    const cityIds = baseCity
      ? Array.from(new Set([baseCity.id, ...nearbyCities.map((c) => c.id)]))
      : nearbyCities.map((c) => c.id);

    const [allPois, allEvents, allGuides] = await Promise.all([
      getPoisByCityIds(cityIds),
      getCityEventsByCityIds(cityIds),
      getCityGuidesByCityIds(cityIds),
    ]);

    const sharedDetails = {
      allPois,
      events: allEvents,
      guides: allGuides,
      topAttractions: allPois.filter((p) => p.category === POI_CATEGORIES.MONUMENT),
      foodSpots: allPois.filter((p) => p.category === POI_CATEGORIES.FOOD),
      hotels: allPois.filter((p) => p.category === POI_CATEGORIES.HOTEL),
      leisureSpots: allPois.filter((p) => p.category === POI_CATEGORIES.LEISURE),
      newDiscoveries: allPois.filter((p) => p.category === POI_CATEGORIES.DISCOVERY),
      generationLogs: [] as string[],
    };

    const aggregatedCities = nearbyCities.map((c) => ({ id: c.id, name: c.name }));

    // Narrowing reale: ramo merge solo con baseCity definito.
    // Spread da baseCity: nuovi campi CityDetails/details restano ereditati;
    // sotto solo le override richieste dalla virtualizzazione merge.
    if (baseCity) {
      const virtualCity: CityDetails = {
        ...baseCity,
        description: baseCity.description || '',
        isFeatured: false,
        coords: centerCoords,
        status: 'published',
        tags: [],
        hasGeneratedContent: true,
        isVirtual: true,
        virtualMode: 'merge',
        aggregatedCities,
        details: {
          ...baseCity.details,
          subtitle: baseCity.details.subtitle || '',
          historySnippet: baseCity.details.historySnippet || '',
          historyFull: baseCity.details.historyFull || '',
          ...sharedDetails,
          tourOperators: baseCity.details.tourOperators || [],
        },
      };
      return virtualCity;
    }

    const [allServices, allTourOperators, allPeople] = await Promise.all([
      getCityServicesByCityIds(cityIds),
      getCityTourOperatorsByCityIds(cityIds),
      getCityPeopleByCityIds(cityIds, 'public'),
    ]);

    // Around Me: full territorial aggregation (services / TO / people included).
    const virtualCity: CityDetails = {
      id: 'around-me-virtual',
      slug: 'around-me-virtual',
      name: 'Around Me',
      zone: `Raggio ${radiusKm}km`,
      adminRegion: GEO_CONFIG.DEFAULT_REGION,
      nation: GEO_CONFIG.DEFAULT_NATION,
      continent: GEO_CONFIG.DEFAULT_CONTINENT,
      region_id: undefined,
      tourist_zone_id: undefined,
      description: `Esplorazione territoriale personalizzata. Include ${nearbyCities.length} località nel raggio di ${radiusKm}km dalla tua posizione.`,
      imageUrl: nearbyCities[0]?.imageUrl || '',
      image_status: nearbyCities[0]?.image_status ?? 'missing',
      heroImage: nearbyCities[0]?.imageUrl || '',
      hero_status: nearbyCities[0]?.image_status ?? 'missing',
      rating: 0,
      visitors: 0,
      isFeatured: false,
      coords: centerCoords,
      status: 'published',
      tags: [],
      hasGeneratedContent: true,
      isVirtual: true,
      virtualMode: 'around_me',
      aggregatedCities,
      details: {
        subtitle: `${nearbyCities.length} Città vicine`,
        heroImage: nearbyCities[0]?.imageUrl || '',
        hero_status: nearbyCities[0]?.image_status ?? 'missing',
        historySnippet: `Esplorazione libera del territorio.`,
        historyFull: '',
        ...sharedDetails,
        services: allServices,
        tourOperators: allTourOperators,
        famousPeople: allPeople,
        gallery: [],
        ratings: { ...DEFAULT_RATINGS },
        patron: 'N/A',
        patronDetails: undefined,
      },
    };

    return virtualCity;
  } catch (e) {
    console.error('Error building virtual city:', e);
    return baseCity || null;
  }
};

/**
 * Recupera il ranking stagionale dinamico tramite RPC PostgreSQL.
 */
export const getSeasonalRanking = async (
  cityIds: string[],
  season: string,
): Promise<{ city_id: string; seasonal_score: number }[]> => {
  const { data, error } = await supabase.rpc('get_dynamic_seasonal_ranking', {
    p_city_ids: cityIds,
    target_season: season.toLowerCase(),
  });

  if (error) {
    console.error('[CityReadService] Error calling get_dynamic_seasonal_ranking:', error);
    return [];
  }

  return data || [];
};

/**
 * SYSTEM AUDIT: Recupera informazioni media normalizzate per tutte le città.
 * Utilizzata esclusivamente per strumenti di scansione globale (es: mediaService).
 * Garantisce che i dati passino per i parser ufficiali (Governance Strict).
 */
export const fetchGlobalCityMediaInfo = async (): Promise<
  { name: string; imageUrl: string; heroImage: string; gallery: MediaAsset[] }[]
> => {
  const out: { name: string; imageUrl: string; heroImage: string; gallery: MediaAsset[] }[] = [];
  let offset = 0;

  for (;;) {
    const { data, error } = await supabase
      .from('cities')
      .select('name, image_url, hero_image, gallery')
      .order('id', { ascending: true })
      .range(offset, offset + GLOBAL_READ_PAGE_SIZE - 1);

    if (error) {
      console.error('[fetchGlobalCityMediaInfo] paginated read failed:', error.message);
      return [];
    }

    const batch = data ?? [];
    for (const c of batch) {
      out.push({
        name: c.name,
        imageUrl: c.image_url || '',
        heroImage: c.hero_image || '',
        gallery: parseGallery(c.gallery),
      });
    }

    if (batch.length < GLOBAL_READ_PAGE_SIZE) break;
    offset += batch.length;
  }

  return out;
};

/**
 * AUTHORITATIVE IDENTITY RESOLVER
 * Risolve una città da slug (match esatto) o da nome (match case-insensitive esatto).
 */
export const resolveCityIdentity = async (input: string): Promise<CityIdentity | null> => {
  const trimmed = input?.trim() ?? '';
  if (!trimmed) return null;

  const bySlug = await supabase
    .from('cities')
    .select('id, slug, name')
    .eq('slug', trimmed.toLowerCase())
    .maybeSingle();

  if (bySlug.error) {
    console.error('[resolveCityIdentity] slug lookup failed:', bySlug.error.message);
    return null;
  }

  if (bySlug.data?.slug) {
    return {
      id: bySlug.data.id,
      slug: bySlug.data.slug,
      name: bySlug.data.name,
    };
  }

  const escapedName = trimmed.replace(/[%_\\]/g, (char) => `\\${char}`);
  const { data, error } = await supabase
    .from('cities')
    .select('id, slug, name')
    .ilike('name', escapedName)
    .limit(5);

  if (error || !data?.length) return null;

  const exactMatches = data.filter(
    (row) =>
      typeof row.name === 'string' && row.name.trim().toLowerCase() === trimmed.toLowerCase(),
  );
  if (exactMatches.length !== 1) return null;
  const match = exactMatches[0];
  if (!match?.slug) return null;

  return {
    id: match.id,
    slug: match.slug,
    name: match.name,
  };
};
