import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, Loader2, Plus, Search, Trash2, Store, Award } from 'lucide-react';
import {
  addUserFavorite,
  listUserFavorites,
  removeUserFavorite,
  type UserFavorite,
} from '@/services/myspace/userFavoritesService';
import {
  getCitiesMinimalByIds,
  searchCitiesMinimalByName,
  type CityGeoMinimal,
} from '@/services/myspace/cityMinimalRead';
import {
  getGuidesMetaByIds,
  getShopsMetaByIds,
  getSponsorPoisByIds,
  getTourOperatorsMetaByIds,
  isSponsorPoiId,
  type FavoriteEntityMeta,
} from '@/services/myspace/favoritesEntityRead';
import { getPoisByIds } from '@/services/city/poi/poiRead';
import { showGlobalAlert } from '@/services/ui/toastService';
import {
  GeoCascadingFilters,
  type GeoSelection,
} from '@/components/admin/cities/GeoCascadingFilters';
import type { CitySummary } from '@/types/index';
import type { PointOfInterest } from '@/types/index';
import { MySpaceSectionHeader } from './MySpaceSectionHeader';

type FavoriteMetaMap = Record<string, FavoriteEntityMeta>;
type FavoriteEntityKind = UserFavorite['entityKind'];

const EMPTY_META: FavoriteMetaMap = {};

function collectFavoriteEntityIds(list: UserFavorite[]) {
  const cityIds = new Set<string>();
  const regularPoiIds: string[] = [];
  const sponsorPoiIds: string[] = [];
  const guideIds: string[] = [];
  const operatorIds: string[] = [];
  const shopIds: string[] = [];

  for (const f of list) {
    switch (f.entityKind) {
      case 'city':
        cityIds.add(f.entityId);
        break;
      case 'poi':
        if (isSponsorPoiId(f.entityId)) sponsorPoiIds.push(f.entityId);
        else regularPoiIds.push(f.entityId);
        break;
      case 'guide':
        guideIds.push(f.entityId);
        break;
      case 'tour_operator':
        operatorIds.push(f.entityId);
        break;
      case 'shop':
        shopIds.push(f.entityId);
        break;
      default:
        break;
    }
  }

  return { cityIds, regularPoiIds, sponsorPoiIds, guideIds, operatorIds, shopIds };
}

function buildPoiMap(pois: PointOfInterest[]): Record<string, PointOfInterest> {
  const poiMap: Record<string, PointOfInterest> = {};
  for (const poi of pois) poiMap[poi.id] = poi;
  return poiMap;
}

function collectCityIdsFromMeta(
  cityIds: Set<string>,
  poiMap: Record<string, PointOfInterest>,
  guides: FavoriteMetaMap,
  operators: FavoriteMetaMap,
  shops: FavoriteMetaMap,
) {
  for (const poi of Object.values(poiMap)) {
    const cityId = poi.cityId?.trim();
    if (cityId) cityIds.add(cityId);
  }
  for (const meta of Object.values(guides)) {
    if (meta.cityId) cityIds.add(meta.cityId);
  }
  for (const meta of Object.values(operators)) {
    if (meta.cityId) cityIds.add(meta.cityId);
  }
  for (const meta of Object.values(shops)) {
    if (meta.cityId) cityIds.add(meta.cityId);
  }
}

const POI_CATEGORY_LABELS: Record<string, string> = {
  monument: 'Monumenti',
  food: 'Cibo & Ristorazione',
  hotel: 'Hotel & Alloggi',
  shop: 'Shopping',
  nature: 'Natura',
  leisure: 'Svago',
  discovery: 'Altro/Novità',
};

const EMPTY_GEO: GeoSelection = {
  continent: '',
  nation: '',
  region: '',
  zone: '',
  city: '',
};

function cityMatchesGeo(city: CityGeoMinimal | undefined, geo: GeoSelection): boolean {
  if (!city) return false;
  if (geo.continent && city.continent !== geo.continent) return false;
  if (geo.nation && city.nation !== geo.nation) return false;
  if (geo.region && city.adminRegion !== geo.region) return false;
  if (geo.zone && city.zone !== geo.zone) return false;
  if (geo.city && city.name !== geo.city) return false;
  return true;
}

function FavoriteItemRow({
  title,
  subtitle,
  icon,
  busy,
  onRemove,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  busy: boolean;
  onRemove: () => void;
}) {
  return (
    <li className="flex items-center gap-2 rounded-lg border border-slate-800/80 bg-slate-950/60 px-2 py-1.5">
      <span className="shrink-0" aria-hidden>
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        {subtitle ? (
          <span className="block text-[9px] uppercase tracking-wide text-slate-500 truncate">
            {subtitle}
          </span>
        ) : null}
        <span className="block text-xs text-white truncate">{title}</span>
      </span>
      <button
        type="button"
        disabled={busy}
        onClick={onRemove}
        className="p-2 rounded-md text-slate-500 hover:text-rose-300 hover:bg-slate-800 disabled:opacity-50"
        aria-label="Rimuovi dai preferiti"
      >
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
      </button>
    </li>
  );
}

function FavoritesBox({
  title,
  icon,
  testId,
  suspended,
  suspendedMessage,
  emptyMessage,
  isEmpty,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  testId: string;
  suspended?: boolean;
  suspendedMessage?: string;
  emptyMessage: string;
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className="flex flex-col min-h-0 h-full rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden"
      data-testid={testId}
    >
      <header className="shrink-0 flex items-center gap-1.5 px-2.5 py-2 border-b border-slate-800/80 bg-slate-950/40">
        <span className="text-slate-400" aria-hidden>
          {icon}
        </span>
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-300 truncate">
          {title}
        </h3>
      </header>
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2">
        {suspended ? (
          <div className="flex flex-col items-center justify-center text-center h-full min-h-[8rem] px-3 py-4">
            <p className="text-[11px] text-slate-400 leading-relaxed">{suspendedMessage}</p>
          </div>
        ) : isEmpty ? (
          <p className="text-[11px] text-slate-600 text-center py-6 px-2">{emptyMessage}</p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

interface Props {
  userId: string;
}

/**
 * Root Preferiti — vista trasversale DOC 35 §7 (filtro geo + 6 box).
 */
export const MySpaceFavoritesRoot: React.FC<Props> = ({ userId }) => {
  const [favorites, setFavorites] = useState<UserFavorite[]>([]);
  const [citiesById, setCitiesById] = useState<Record<string, CityGeoMinimal>>({});
  const [poiById, setPoiById] = useState<Record<string, PointOfInterest>>({});
  const [guideMeta, setGuideMeta] = useState<FavoriteMetaMap>({});
  const [operatorMeta, setOperatorMeta] = useState<FavoriteMetaMap>({});
  const [shopMeta, setShopMeta] = useState<FavoriteMetaMap>({});
  const [loading, setLoading] = useState(true);
  const [geoFilter, setGeoFilter] = useState<GeoSelection>(EMPTY_GEO);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<CityGeoMinimal[]>([]);
  const [searching, setSearching] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const loadSeqRef = useRef(0);
  const searchSeqRef = useRef(0);

  const reload = useCallback(async () => {
    const seq = ++loadSeqRef.current;
    setLoading(true);
    try {
      const list = await listUserFavorites(userId);
      if (seq !== loadSeqRef.current) return;
      setFavorites(list);

      const { cityIds, regularPoiIds, sponsorPoiIds, guideIds, operatorIds, shopIds } =
        collectFavoriteEntityIds(list);

      // POI catalogo obbligatorio in all; sorgenti opzionali indipendenti (allSettled).
      const [regularResult, sponsorResult, guidesResult, operatorsResult, shopsResult] =
        await Promise.allSettled([
          regularPoiIds.length > 0 ? getPoisByIds(regularPoiIds) : Promise.resolve([] as PointOfInterest[]),
          sponsorPoiIds.length > 0 ? getSponsorPoisByIds(sponsorPoiIds) : Promise.resolve([] as PointOfInterest[]),
          guideIds.length > 0 ? getGuidesMetaByIds(guideIds) : Promise.resolve(EMPTY_META),
          operatorIds.length > 0 ? getTourOperatorsMetaByIds(operatorIds) : Promise.resolve(EMPTY_META),
          shopIds.length > 0 ? getShopsMetaByIds(shopIds) : Promise.resolve(EMPTY_META),
        ]);
      if (seq !== loadSeqRef.current) return;

      const regularPois = regularResult.status === 'fulfilled' ? regularResult.value : [];
      const sponsorPois = sponsorResult.status === 'fulfilled' ? sponsorResult.value : [];
      const guides = guidesResult.status === 'fulfilled' ? guidesResult.value : EMPTY_META;
      const operators = operatorsResult.status === 'fulfilled' ? operatorsResult.value : EMPTY_META;
      const shops = shopsResult.status === 'fulfilled' ? shopsResult.value : EMPTY_META;

      if (regularResult.status === 'rejected') {
        console.error('[MySpaceFavoritesRoot] getPoisByIds failed', regularResult.reason);
      }
      if (sponsorResult.status === 'rejected') {
        console.error('[MySpaceFavoritesRoot] getSponsorPoisByIds failed', sponsorResult.reason);
      }
      if (guidesResult.status === 'rejected') {
        console.error('[MySpaceFavoritesRoot] getGuidesMetaByIds failed', guidesResult.reason);
      }
      if (operatorsResult.status === 'rejected') {
        console.error('[MySpaceFavoritesRoot] getTourOperatorsMetaByIds failed', operatorsResult.reason);
      }
      if (shopsResult.status === 'rejected') {
        console.error('[MySpaceFavoritesRoot] getShopsMetaByIds failed', shopsResult.reason);
      }

      const poiMap = buildPoiMap([...regularPois, ...sponsorPois]);
      collectCityIdsFromMeta(cityIds, poiMap, guides, operators, shops);

      const cities = cityIds.size > 0 ? await getCitiesMinimalByIds([...cityIds]) : [];
      if (seq !== loadSeqRef.current) return;

      const cityMap: Record<string, CityGeoMinimal> = {};
      for (const c of cities) cityMap[c.id] = c;

      setCitiesById(cityMap);
      setPoiById(poiMap);
      setGuideMeta(guides);
      setOperatorMeta(operators);
      setShopMeta(shops);
    } catch (e) {
      console.error('[MySpaceFavoritesRoot] reload failed', e);
      if (seq !== loadSeqRef.current) return;
      setCitiesById({});
      setPoiById({});
      setGuideMeta({});
      setOperatorMeta({});
      setShopMeta({});
    } finally {
      if (seq === loadSeqRef.current) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      // Invalida ricerche in volo: Promise precedenti non devono più aggiornare lo state.
      searchSeqRef.current += 1;
      setSuggestions([]);
      setSearching(false);
      return;
    }
    const seq = ++searchSeqRef.current;
    const t = window.setTimeout(() => {
      void (async () => {
        setSearching(true);
        try {
          const rows = await searchCitiesMinimalByName(q);
          if (seq !== searchSeqRef.current) return;
          const geoActive = Boolean(
            geoFilter.continent ||
              geoFilter.nation ||
              geoFilter.region ||
              geoFilter.zone ||
              geoFilter.city,
          );
          setSuggestions(geoActive ? rows.filter((c) => cityMatchesGeo(c, geoFilter)) : rows);
        } catch (e) {
          console.error('[MySpaceFavoritesRoot] searchCitiesMinimalByName failed', e);
          if (seq === searchSeqRef.current) setSuggestions([]);
        } finally {
          if (seq === searchSeqRef.current) setSearching(false);
        }
      })();
    }, 250);
    return () => window.clearTimeout(t);
  }, [query, geoFilter]);

  const geoCities = useMemo(
    (): CitySummary[] =>
      Object.values(citiesById).map((c) => ({
        id: c.id,
        name: c.name,
        continent: c.continent ?? '',
        nation: c.nation ?? '',
        adminRegion: c.adminRegion ?? '',
        zone: c.zone ?? '',
      })) as CitySummary[],
    [citiesById],
  );

  const hasGeoFilter = Boolean(
    geoFilter.continent || geoFilter.nation || geoFilter.region || geoFilter.zone || geoFilter.city,
  );

  const matchesGeo = useCallback(
    (cityId: string | null | undefined): boolean => {
      if (!hasGeoFilter) return true;
      if (!cityId) return false;
      return cityMatchesGeo(citiesById[cityId], geoFilter);
    },
    [citiesById, geoFilter, hasGeoFilter],
  );

  const cityFavorites = useMemo(
    () => favorites.filter((f) => f.entityKind === 'city' && matchesGeo(f.entityId)),
    [favorites, matchesGeo],
  );

  const favoriteCityIds = useMemo(
    () => new Set(favorites.filter((f) => f.entityKind === 'city').map((f) => f.entityId)),
    [favorites],
  );

  const { sponsorFavorites, regularPoiByCategory } = useMemo(() => {
    const sponsors: Array<{ fav: UserFavorite; poi: PointOfInterest }> = [];
    const byCategory = new Map<string, Array<{ fav: UserFavorite; poi: PointOfInterest }>>();

    for (const fav of favorites) {
      if (fav.entityKind !== 'poi') continue;
      const poi = poiById[fav.entityId];
      if (!poi) continue;
      if (!matchesGeo(poi.cityId)) continue;

      const isSponsor = poi.isSponsored === true || isSponsorPoiId(fav.entityId);
      if (isSponsor) {
        sponsors.push({ fav, poi });
      } else {
        const cat = poi.category || 'discovery';
        const list = byCategory.get(cat) ?? [];
        list.push({ fav, poi });
        byCategory.set(cat, list);
      }
    }

    return { sponsorFavorites: sponsors, regularPoiByCategory: byCategory };
  }, [favorites, poiById, matchesGeo]);

  const guideFavorites = useMemo(
    () =>
      favorites.filter((f) => {
        if (f.entityKind !== 'guide') return false;
        const meta = guideMeta[f.entityId];
        return matchesGeo(meta?.cityId);
      }),
    [favorites, guideMeta, matchesGeo],
  );

  const operatorFavorites = useMemo(
    () =>
      favorites.filter((f) => {
        if (f.entityKind !== 'tour_operator') return false;
        const meta = operatorMeta[f.entityId];
        return matchesGeo(meta?.cityId);
      }),
    [favorites, operatorMeta, matchesGeo],
  );

  const shopFavorites = useMemo(
    () =>
      favorites.filter((f) => {
        if (f.entityKind !== 'shop') return false;
        const meta = shopMeta[f.entityId];
        return matchesGeo(meta?.cityId);
      }),
    [favorites, shopMeta, matchesGeo],
  );

  const handleAddCity = async (city: CityGeoMinimal) => {
    const key = `city:${city.id}`;
    setBusyKey(key);
    try {
      const ok = await addUserFavorite(userId, 'city', city.id);
      if (!ok) {
        showGlobalAlert('Non è stato possibile aggiungere il preferito.');
        return;
      }
      setQuery('');
      setSuggestions([]);
      // TODO: oggi reload completo per semplicità e coerenza post-add; in futuro
      // valutare update incrementale dello state se il costo di reload diventa rilevante.
      await reload();
    } finally {
      setBusyKey(null);
    }
  };

  const handleRemove = async (fav: UserFavorite) => {
    const key = `${fav.entityKind}:${fav.entityId}`;
    setBusyKey(key);
    try {
      const ok = await removeUserFavorite(userId, fav.entityKind, fav.entityId);
      if (!ok) {
        showGlobalAlert('Non è stato possibile rimuovere il preferito.');
        return;
      }
      setFavorites((prev) =>
        prev.filter(
          (item) => !(item.entityKind === fav.entityKind && item.entityId === fav.entityId),
        ),
      );

      const removeFromMap = <T,>(
        setter: React.Dispatch<React.SetStateAction<Record<string, T>>>,
      ) => {
        setter((prev) => {
          const next = { ...prev };
          delete next[fav.entityId];
          return next;
        });
      };

      const localCleanup: Partial<Record<FavoriteEntityKind, () => void>> = {
        city: () => removeFromMap(setCitiesById),
        poi: () => removeFromMap(setPoiById),
        guide: () => removeFromMap(setGuideMeta),
        tour_operator: () => removeFromMap(setOperatorMeta),
        shop: () => removeFromMap(setShopMeta),
      };
      localCleanup[fav.entityKind]?.();
    } finally {
      setBusyKey(null);
    }
  };

  if (loading) {
    return (
      <div
        className="flex-1 min-h-0 flex items-center justify-center gap-2 text-slate-500 text-sm"
        data-testid="myspace-section-favorites"
        role="tabpanel"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Caricamento preferiti...
      </div>
    );
  }

  return (
    <div
      className="flex-1 min-h-0 overflow-hidden flex flex-col p-2 sm:p-3 gap-2 overscroll-contain"
      data-testid="myspace-section-favorites"
      role="tabpanel"
      aria-label="Preferiti"
    >
      <MySpaceSectionHeader
        icon={Bookmark}
        title="Preferiti"
        description="I luoghi e le risorse che hai scelto di tenere a portata di mano."
        iconClassName="w-4 h-4 text-amber-400 shrink-0"
      />

      <section data-testid="myspace-favorites-filter-bar" className="shrink-0">
        <GeoCascadingFilters
          cities={geoCities}
          value={geoFilter}
          onChange={setGeoFilter}
          orientation="horizontal"
          density="compact"
          headerSubtitle="Seleziona l'area dei preferiti da visualizzare."
        />
      </section>

      <section className="shrink-0" data-testid="myspace-favorites-city-add">
        <div className="relative">
          <label className="sr-only" htmlFor="myspace-favorites-city-search">
            Cerca città da aggiungere ai preferiti
          </label>
          <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2">
            <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden />
            <input
              id="myspace-favorites-city-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSuggestions([]);
              }}
              onBlur={() => {
                window.setTimeout(() => setSuggestions([]), 150);
              }}
              placeholder="Aggiungi città ai preferiti…"
              className="flex-1 min-w-0 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 outline-none"
              data-testid="myspace-favorites-city-search"
              aria-controls="myspace-favorites-city-listbox"
              aria-expanded={suggestions.length > 0}
              aria-autocomplete="list"
              role="combobox"
            />
            {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" /> : null}
          </div>
          {suggestions.length > 0 ? (
            <ul
              id="myspace-favorites-city-listbox"
              role="listbox"
              aria-label="Suggerimenti città"
              className="absolute z-10 mt-1 w-full max-h-56 sm:max-h-[50vh] overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 shadow-xl"
            >
              {suggestions.map((city) => {
                const already = favoriteCityIds.has(city.id);
                return (
                  <li key={city.id} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={already}
                      disabled={already || busyKey === `city:${city.id}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => void handleAddCity(city)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-40"
                    >
                      <span className="truncate">{city.name}</span>
                      {already ? (
                        <span className="text-[10px] text-slate-500">Già nei preferiti</span>
                      ) : (
                        <Plus className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </section>

      <div
        className="flex-1 min-h-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2"
        data-testid="myspace-favorites-boxes"
      >
        <FavoritesBox
          title="Città"
          icon={<Bookmark className="w-3.5 h-3.5 text-amber-400" />}
          testId="myspace-favorites-box-cities"
          emptyMessage="Nessuna città preferita per questo filtro."
          isEmpty={cityFavorites.length === 0}
        >
          <ul className="space-y-1">
            {cityFavorites.map((fav) => {
              const city = citiesById[fav.entityId];
              const busy = busyKey === `city:${fav.entityId}`;
              return (
                <FavoriteItemRow
                  key={fav.entityId}
                  title={city?.name ?? fav.entityId}
                  icon="🏙️"
                  busy={busy}
                  onRemove={() => void handleRemove(fav)}
                />
              );
            })}
          </ul>
        </FavoritesBox>

        <FavoritesBox
          title="POI"
          icon={<span className="text-sm">📍</span>}
          testId="myspace-favorites-box-poi"
          emptyMessage="Nessun POI preferito per questo filtro."
          isEmpty={regularPoiByCategory.size === 0}
        >
          {[...regularPoiByCategory.entries()]
            .sort(([a], [b]) =>
              (POI_CATEGORY_LABELS[a] ?? a).localeCompare(POI_CATEGORY_LABELS[b] ?? b, 'it'),
            )
            .map(([category, items]) => (
              <div key={category} className="mb-2 last:mb-0">
                <h4 className="text-[9px] font-bold uppercase tracking-wider text-slate-500 px-1 mb-1">
                  {POI_CATEGORY_LABELS[category] ?? category}
                </h4>
                <ul className="space-y-1">
                  {items.map(({ fav, poi }) => (
                    <FavoriteItemRow
                      key={fav.entityId}
                      title={poi.name}
                      busy={busyKey === `poi:${fav.entityId}`}
                      icon="📍"
                      onRemove={() => void handleRemove(fav)}
                    />
                  ))}
                </ul>
              </div>
            ))}
        </FavoritesBox>

        <FavoritesBox
          title="Sponsor"
          icon={<Award className="w-3.5 h-3.5 text-amber-300" />}
          testId="myspace-favorites-box-sponsor"
          emptyMessage="Nessuno sponsor preferito per questo filtro."
          isEmpty={sponsorFavorites.length === 0}
        >
          <ul className="space-y-1">
            {sponsorFavorites.map(({ fav, poi }) => (
              <FavoriteItemRow
                key={fav.entityId}
                title={poi.name}
                busy={busyKey === `poi:${fav.entityId}`}
                icon={<Award className="w-3 h-3 text-amber-300" />}
                onRemove={() => void handleRemove(fav)}
              />
            ))}
          </ul>
        </FavoritesBox>

        <FavoritesBox
          title="Negozio Digitale"
          icon={<Store className="w-3.5 h-3.5 text-indigo-300" />}
          testId="myspace-favorites-box-shop"
          emptyMessage="Nessun negozio digitale preferito per questo filtro."
          isEmpty={shopFavorites.length === 0}
        >
          <ul className="space-y-1">
            {shopFavorites.map((fav) => {
              const meta = shopMeta[fav.entityId];
              return (
                <FavoriteItemRow
                  key={fav.entityId}
                  title={meta?.title ?? fav.entityId}
                  busy={busyKey === `shop:${fav.entityId}`}
                  icon="🛍️"
                  onRemove={() => void handleRemove(fav)}
                />
              );
            })}
          </ul>
        </FavoritesBox>

        <FavoritesBox
          title="Guide Turistiche"
          icon={<span className="text-sm">🗺️</span>}
          testId="myspace-favorites-box-guides"
          emptyMessage="Nessuna guida preferita per questo filtro."
          isEmpty={guideFavorites.length === 0}
        >
          <ul className="space-y-1">
            {guideFavorites.map((fav) => {
              const meta = guideMeta[fav.entityId];
              return (
                <FavoriteItemRow
                  key={fav.entityId}
                  title={meta?.title ?? fav.entityId}
                  busy={busyKey === `guide:${fav.entityId}`}
                  icon="🗺️"
                  onRemove={() => void handleRemove(fav)}
                />
              );
            })}
          </ul>
        </FavoritesBox>

        <FavoritesBox
          title="Tour Operator"
          icon={<span className="text-sm">🎫</span>}
          testId="myspace-favorites-box-operators"
          emptyMessage="Nessun tour operator preferito per questo filtro."
          isEmpty={operatorFavorites.length === 0}
        >
          <ul className="space-y-1">
            {operatorFavorites.map((fav) => {
              const meta = operatorMeta[fav.entityId];
              return (
                <FavoriteItemRow
                  key={fav.entityId}
                  title={meta?.title ?? fav.entityId}
                  busy={busyKey === `tour_operator:${fav.entityId}`}
                  icon="🎫"
                  onRemove={() => void handleRemove(fav)}
                />
              );
            })}
          </ul>
        </FavoritesBox>
      </div>
    </div>
  );
};
