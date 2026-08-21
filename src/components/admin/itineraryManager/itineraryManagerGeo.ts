import { getFullManifestAsync, getPoisByIds } from '../../../services/cityService';
import type { PointOfInterest, PremadeItinerary, Review } from '../../../types/index';
import type { CitySummary } from '../../../types/models/City';
import type { GeoSelection } from '../cities/GeoCascadingFilters';

/** Stub da mapDbReview: non sono nomi leggibili del target. */
export const PLACEHOLDER_TARGET_NAMES = new Set(['POI', 'Itinerario']);

export const EMPTY_GEO_SELECTION: GeoSelection = {
  continent: '',
  nation: '',
  region: '',
  zone: '',
  city: '',
};

export type ResolvedGeo = {
  continent: string;
  nation: string;
  region: string;
  zone: string;
  city: string;
  breadcrumb: string;
};

export type ResolvedTarget = {
  name: string;
  geo: ResolvedGeo | null;
  /** Geo footprints used for filter matching (multi-city itineraries). */
  filterGeos: ResolvedGeo[];
  technicalId: string;
  kind: 'poi' | 'itinerary';
};

/**
 * Cache locale unica (load-time): SoT geo = CitySummary del manifesto.
 * Non usare mai PremadeItinerary.mainCity/zone grezzi come option dei filtri.
 */
export type EnrichmentCache = {
  poiById: Map<string, PointOfInterest>;
  byPoiId: Map<string, ResolvedTarget>;
  byItineraryId: Map<string, ResolvedTarget>;
  cityManifest: CitySummary[];
  cityById: Map<string, CitySummary>;
  /**
   * True when CitySummary SoT cannot support exact geo filtering
   * (fetch failure, or no resolvable cities in the returned manifest).
   */
  manifestLoadError: boolean;
};

export const EMPTY_ENRICHMENT: EnrichmentCache = {
  poiById: new Map(),
  byPoiId: new Map(),
  byItineraryId: new Map(),
  cityManifest: [],
  cityById: new Map(),
  manifestLoadError: false,
};

export type GeoFilterSnapshot = {
  continent: string;
  nation: string;
  adminRegion: string;
  zone: string;
  cityName: string;
};

export function buildBreadcrumb(parts: Array<string | undefined | null>): string {
  const cleaned = parts.map((p) => (p || '').trim()).filter(Boolean);
  return cleaned.filter((item, pos, arr) => !pos || item !== arr[pos - 1]).join(' • ');
}

export function geoFromCity(city: CitySummary): ResolvedGeo {
  const continent = city.continent || '';
  const nation = city.nation || '';
  const region = city.adminRegion || '';
  const zone = city.zone || '';
  const cityName = city.name || '';
  return {
    continent,
    nation,
    region,
    zone,
    city: cityName,
    breadcrumb: buildBreadcrumb([cityName, zone, region, nation]),
  };
}

/** Risolve una città dal manifesto: id, slug o nome (mai lasciare slug in UI). */
export function resolveCityFromToken(
  token: string | undefined | null,
  cityById: Map<string, CitySummary>,
  manifest: CitySummary[],
): CitySummary | undefined {
  const raw = (token || '').trim();
  if (!raw) return undefined;
  const byId = cityById.get(raw);
  if (byId) return byId;
  const lower = raw.toLowerCase();
  return manifest.find(
    (c) =>
      c.id === raw ||
      c.slug === raw ||
      c.slug?.toLowerCase() === lower ||
      c.name === raw ||
      c.name.toLowerCase() === lower,
  );
}

/**
 * Geo itinerario: raccoglie tutte le città risolvibili dagli items (+ mainCity).
 * Il filtro geografico usa OR su tutte le footprint (itinerario multi-città).
 */
export function resolveItineraryGeos(
  it: PremadeItinerary,
  cityById: Map<string, CitySummary>,
  manifest: CitySummary[],
): ResolvedGeo[] {
  const seen = new Set<string>();
  const geos: ResolvedGeo[] = [];

  for (const item of it.items || []) {
    const city = resolveCityFromToken(item.cityId, cityById, manifest);
    if (city?.id && !seen.has(city.id)) {
      seen.add(city.id);
      geos.push(geoFromCity(city));
    }
  }

  const mainCity = resolveCityFromToken(it.mainCity, cityById, manifest);
  if (mainCity?.id && !seen.has(mainCity.id)) {
    geos.push(geoFromCity(mainCity));
  }

  if (geos.length === 0) {
    const fallback = geoFromItineraryFallback(it);
    if (fallback) geos.push(fallback);
  }

  return geos;
}

export function geoFromItineraryFallback(it: PremadeItinerary): ResolvedGeo | null {
  const region = (it.region || '').trim();
  let zone = (it.zone || '').trim();
  // Leak tipico publish: zone defaultata a admin region
  if (zone && region && zone === region) zone = '';
  const city = (it.mainCity || '').trim();
  // Token tecnici tipo city_* (criterio verificato nel codebase; v. GeoCascadingFilters SoT).
  const cityLooksTechnical = !city || city.startsWith('city_') || city === region || city === zone;
  if (!region && !zone && cityLooksTechnical) return null;
  return {
    continent: it.continent || '',
    nation: it.nation || '',
    region,
    zone,
    city: cityLooksTechnical ? '' : city,
    breadcrumb: buildBreadcrumb([cityLooksTechnical ? '' : city, zone, region, it.nation]),
  };
}

export function hasActiveGeoFilter(f: GeoFilterSnapshot): boolean {
  return Boolean(f.continent || f.nation || f.adminRegion || f.zone || f.cityName);
}

export function matchesGeoFilter(
  geo: ResolvedGeo | null | undefined,
  f: GeoFilterSnapshot,
): boolean {
  if (!hasActiveGeoFilter(f)) return true;
  if (!geo) return false;
  if (f.continent && geo.continent !== f.continent) return false;
  if (f.nation && geo.nation !== f.nation) return false;
  if (f.adminRegion && geo.region !== f.adminRegion) return false;
  if (f.zone && geo.zone !== f.zone) return false;
  if (f.cityName && geo.city !== f.cityName) return false;
  return true;
}

export function targetMatchesGeoFilter(
  target: ResolvedTarget | null | undefined,
  f: GeoFilterSnapshot,
): boolean {
  if (!hasActiveGeoFilter(f)) return true;
  if (!target) return false;
  if (target.filterGeos.length > 0) {
    return target.filterGeos.some((geo) => matchesGeoFilter(geo, f));
  }
  return matchesGeoFilter(target.geo, f);
}

/** Recensione più utile in moderazione: voto più basso (a parità, più recente). */
export function pickAlertEvidenceReview(poiId: string, reviews: Review[]): Review | null {
  const forPoi = reviews.filter((r) => r.poiId === poiId);
  if (forPoi.length === 0) return null;
  return [...forPoi].sort((a, b) => {
    if (a.rating !== b.rating) return a.rating - b.rating;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  })[0];
}

export async function buildEnrichmentCache(
  poiIds: string[],
  itineraries: PremadeItinerary[],
): Promise<EnrichmentCache> {
  const uniquePoiIds = Array.from(new Set(poiIds.filter(Boolean)));
  let manifest: CitySummary[] = [];
  let manifestFetchFailed = false;

  try {
    // Contract: returns CitySummary[]; on some DB failures the service returns [] without throwing.
    manifest = await getFullManifestAsync();
  } catch (error) {
    console.error('[ItineraryManager] getFullManifestAsync failed', error);
    manifestFetchFailed = true;
    manifest = [];
  }

  const [pois] = await Promise.all([
    uniquePoiIds.length > 0 ? getPoisByIds(uniquePoiIds) : Promise.resolve([] as PointOfInterest[]),
  ]);

  const cityById = new Map<string, CitySummary>();
  for (const city of manifest) {
    if (city.id) cityById.set(city.id, city);
  }

  // GeoCascadingFilters / exact geo SoT need resolvable CitySummary entries.
  // Empty cityById cannot power reliable filtering (whether fetch failed or SoT is empty).
  const manifestLoadError = manifestFetchFailed || cityById.size === 0;

  const poiById = new Map<string, PointOfInterest>();
  const byPoiId = new Map<string, ResolvedTarget>();
  for (const poi of pois) {
    poiById.set(poi.id, poi);
    const city = poi.cityId ? cityById.get(poi.cityId) : undefined;
    const geo = city ? geoFromCity(city) : null;
    byPoiId.set(poi.id, {
      name: poi.name || poi.id,
      geo,
      filterGeos: geo ? [geo] : [],
      technicalId: poi.id,
      kind: 'poi',
    });
  }

  for (const id of uniquePoiIds) {
    if (!byPoiId.has(id)) {
      byPoiId.set(id, {
        name: id,
        geo: null,
        filterGeos: [],
        technicalId: id,
        kind: 'poi',
      });
    }
  }

  const byItineraryId = new Map<string, ResolvedTarget>();
  for (const it of itineraries) {
    if (!it.id) continue;
    const filterGeos = resolveItineraryGeos(it, cityById, manifest);
    const geo = filterGeos[0] ?? null;
    byItineraryId.set(it.id, {
      name: it.title || it.id,
      geo,
      filterGeos,
      technicalId: it.id,
      kind: 'itinerary',
    });
  }

  return { poiById, byPoiId, byItineraryId, cityManifest: manifest, cityById, manifestLoadError };
}

export function resolveReviewTarget(review: Review, cache: EnrichmentCache): ResolvedTarget {
  if (review.poiId) {
    const fromCache = cache.byPoiId.get(review.poiId);
    if (fromCache) return fromCache;
    const readable = review.poiName?.trim();
    return {
      name: readable && !PLACEHOLDER_TARGET_NAMES.has(readable) ? readable : review.poiId,
      geo: null,
      filterGeos: [],
      technicalId: review.poiId,
      kind: 'poi',
    };
  }
  if (review.itineraryId) {
    const fromCache = cache.byItineraryId.get(review.itineraryId);
    if (fromCache) return fromCache;
    return {
      name: review.itineraryId,
      geo: null,
      filterGeos: [],
      technicalId: review.itineraryId,
      kind: 'itinerary',
    };
  }
  return {
    name: '—',
    geo: null,
    filterGeos: [],
    technicalId: '',
    kind: 'poi',
  };
}
