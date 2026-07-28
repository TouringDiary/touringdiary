import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import {
  addUserFavorite,
  listUserFavorites,
  removeUserFavorite,
  type UserFavorite,
  type UserFavoriteEntityKind,
} from '@/services/myspace/userFavoritesService';
import {
  getCitiesMinimalByIds,
  searchCitiesMinimalByName,
  type CityGeoMinimal,
} from '@/services/myspace/cityMinimalRead';
import { getPoisByIds } from '@/services/city/poi/poiRead';
import { showGlobalAlert } from '@/services/ui/toastService';

const KIND_LABEL: Record<UserFavoriteEntityKind, string> = {
  city: 'Città',
  poi: 'POI',
  shop: 'Shop',
  guide: 'Guida',
  tour_operator: 'Tour Operator',
  character: 'Personaggio',
  viaggio: 'Viaggio',
  suitcase: 'Valigia',
  template: 'Template',
};

const KIND_ICON: Record<UserFavoriteEntityKind, string> = {
  city: '🏙️',
  poi: '📍',
  shop: '🛍️',
  guide: '🗺️',
  tour_operator: '🎫',
  character: '🎭',
  viaggio: '✈️',
  suitcase: '🧳',
  template: '📋',
};

function countBy(values: Array<string | null | undefined>): Array<{ label: string; count: number }> {
  const map = new Map<string, number>();
  for (const raw of values) {
    const label = (raw ?? '').trim() || 'Non specificato';
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'it'));
}

interface Props {
  userId: string;
}

/**
 * Root Preferiti — vista trasversale DOC 35 §7 (no cartelle).
 */
export const MySpaceFavoritesRoot: React.FC<Props> = ({ userId }) => {
  const [favorites, setFavorites] = useState<UserFavorite[]>([]);
  const [citiesById, setCitiesById] = useState<Record<string, CityGeoMinimal>>({});
  const [poiTitles, setPoiTitles] = useState<Record<string, string>>({});
  const [poiCityIds, setPoiCityIds] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
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

      const cityIds = new Set<string>();
      const poiIds: string[] = [];
      for (const f of list) {
        if (f.entityKind === 'city') cityIds.add(f.entityId);
        else if (f.entityKind === 'poi') poiIds.push(f.entityId);
      }
      const pois = poiIds.length > 0 ? await getPoisByIds(poiIds) : [];
      if (seq !== loadSeqRef.current) return;

      const titles = new Map<string, string>();
      const poiCities = new Map<string, string>();
      for (const poi of pois) {
        titles.set(poi.id, poi.name);
        const cityId = poi.cityId?.trim();
        if (cityId) {
          poiCities.set(poi.id, cityId);
          cityIds.add(cityId);
        }
      }

      const cities = cityIds.size > 0 ? await getCitiesMinimalByIds([...cityIds]) : [];
      if (seq !== loadSeqRef.current) return;

      const cityMap: Record<string, CityGeoMinimal> = {};
      for (const c of cities) cityMap[c.id] = c;

      setCitiesById(cityMap);
      setPoiTitles(Object.fromEntries(titles));
      setPoiCityIds(Object.fromEntries(poiCities));
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
      setSuggestions([]);
      return;
    }
    const seq = ++searchSeqRef.current;
    const t = window.setTimeout(() => {
      void (async () => {
        setSearching(true);
        try {
          const rows = await searchCitiesMinimalByName(q);
          if (seq !== searchSeqRef.current) return;
          setSuggestions(rows);
        } finally {
          if (seq === searchSeqRef.current) setSearching(false);
        }
      })();
    }, 250);
    return () => window.clearTimeout(t);
  }, [query]);

  const { cityFavorites, otherFavorites, favoriteCityIds, poiFavorites } = useMemo(() => {
    const cities: UserFavorite[] = [];
    const others: UserFavorite[] = [];
    const pois: UserFavorite[] = [];
    for (const fav of favorites) {
      if (fav.entityKind === 'city') {
        cities.push(fav);
      } else {
        others.push(fav);
        if (fav.entityKind === 'poi') pois.push(fav);
      }
    }
    return {
      cityFavorites: cities,
      otherFavorites: others,
      favoriteCityIds: new Set(cities.map((f) => f.entityId)),
      poiFavorites: pois,
    };
  }, [favorites]);

  const poiRecapCities = useMemo(
    () =>
      poiFavorites
        .map((f) => citiesById[poiCityIds[f.entityId]])
        .filter((c): c is CityGeoMinimal => Boolean(c)),
    [poiFavorites, citiesById, poiCityIds],
  );

  const recapContinent = useMemo(
    () => countBy(poiRecapCities.map((c) => c.continent)),
    [poiRecapCities],
  );
  const recapNation = useMemo(
    () => countBy(poiRecapCities.map((c) => c.nation)),
    [poiRecapCities],
  );
  const recapRegion = useMemo(
    () => countBy(poiRecapCities.map((c) => c.adminRegion)),
    [poiRecapCities],
  );
  const recapZone = useMemo(
    () => countBy(poiRecapCities.map((c) => c.zone)),
    [poiRecapCities],
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
      setFavorites((prev) => [
        {
          userId,
          entityKind: 'city',
          entityId: city.id,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setCitiesById((prev) => ({ ...prev, [city.id]: city }));
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
      if (fav.entityKind === 'city') {
        setCitiesById((prev) => {
          const next = { ...prev };
          delete next[fav.entityId];
          return next;
        });
      } else if (fav.entityKind === 'poi') {
        setPoiTitles((prev) => {
          const next = { ...prev };
          delete next[fav.entityId];
          return next;
        });
        setPoiCityIds((prev) => {
          const next = { ...prev };
          delete next[fav.entityId];
          return next;
        });
      }
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
      className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-6"
      data-testid="myspace-section-favorites"
      role="tabpanel"
      aria-label="Preferiti"
    >
      <section className="space-y-2" data-testid="myspace-favorites-cities-section">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-amber-400" aria-hidden />
          Città Preferite
        </h2>
        <p className="text-[11px] text-slate-500">
          Puoi aggiungere una città anche se non l’hai ancora visitata.
        </p>
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
              placeholder="Cerca città…"
              className="flex-1 min-w-0 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 outline-none"
              data-testid="myspace-favorites-city-search"
            />
            {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" /> : null}
          </div>
          {suggestions.length > 0 ? (
            <ul
              id="myspace-favorites-city-listbox"
              role="listbox"
              aria-label="Suggerimenti città"
              className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 shadow-xl"
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
        {cityFavorites.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">Nessuna città preferita.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {cityFavorites.map((fav) => {
              const city = citiesById[fav.entityId];
              const busy = busyKey === `city:${fav.entityId}`;
              return (
                <li
                  key={fav.entityId}
                  className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2"
                >
                  <span aria-hidden>{KIND_ICON.city}</span>
                  <span className="flex-1 min-w-0 text-sm text-white truncate">
                    {city?.name ?? fav.entityId}
                  </span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleRemove(fav)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-rose-300 hover:bg-slate-800 disabled:opacity-50"
                    aria-label="Rimuovi dai preferiti"
                    title="Rimuovi"
                  >
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-2" data-testid="myspace-favorites-other-section">
        <h2 className="text-sm font-bold text-white">Altri Preferiti</h2>
        {otherFavorites.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">
            Nessun altro preferito. Usa il segnalibro sulle schede (POI, Shop, …) per aggiungerli.
          </p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {otherFavorites.map((fav) => {
              const busy = busyKey === `${fav.entityKind}:${fav.entityId}`;
              const title =
                fav.entityKind === 'poi'
                  ? poiTitles[fav.entityId] ?? fav.entityId
                  : fav.entityId;
              return (
                <li
                  key={`${fav.entityKind}:${fav.entityId}`}
                  className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2"
                >
                  <span aria-hidden>{KIND_ICON[fav.entityKind]}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[10px] uppercase tracking-wide text-slate-500">
                      {KIND_LABEL[fav.entityKind]}
                    </span>
                    <span className="block text-sm text-white truncate">{title}</span>
                  </span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleRemove(fav)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-rose-300 hover:bg-slate-800 disabled:opacity-50"
                    aria-label="Rimuovi dai preferiti"
                  >
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3" data-testid="myspace-favorites-recap-section">
        <h2 className="text-sm font-bold text-white">Recap POI preferiti</h2>
        <p className="text-[11px] text-slate-500">
          Quantità aggregate per Continente · Nazione · Regione · Zona.
        </p>
        {[
          { title: 'Continente', rows: recapContinent, testId: 'recap-continent' },
          { title: 'Nazione', rows: recapNation, testId: 'recap-nation' },
          { title: 'Regione', rows: recapRegion, testId: 'recap-region' },
          { title: 'Zona', rows: recapZone, testId: 'recap-zone' },
        ].map((block) => (
          <div key={block.title} data-testid={block.testId}>
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">
              {block.title}
            </h3>
            {block.rows.length === 0 ? (
              <p className="text-xs text-slate-600">Nessun POI preferito.</p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {block.rows.map((row) => (
                  <li
                    key={row.label}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-950/80 px-2 py-1 text-[11px] text-slate-300"
                  >
                    <span className="truncate max-w-[10rem]">{row.label}</span>
                    <span className="font-bold text-amber-300/90">{row.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </section>
    </div>
  );
};
