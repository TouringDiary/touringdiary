import { useEffect, useMemo, useState } from 'react';
import {
  getRankedCities,
  getTopCommunityPhotos,
  getTopCommunityPois,
} from '../services/rankingService';
import type {
  CitySummary,
  PhotoSubmission,
  PointOfInterest,
  RankedItemMixin,
} from '../types/index';

export type MainTab = 'cities' | 'pois' | 'gallery';
export type CityAlgo = 'mix' | 'ai' | 'community';
export type SortKey = 'rank' | 'name' | 'zone' | 'visitors' | 'rating' | 'likes' | 'votes';

/** Item client-side rankings (foto/POI): tipi dominio + mixin + zone opzionale usata a runtime. */
type RankingsClientItem = (PhotoSubmission | PointOfInterest) &
  RankedItemMixin & {
    zone?: string;
  };

const itemDisplayName = (item: RankingsClientItem): string => {
  if ('locationName' in item && typeof item.locationName === 'string') return item.locationName;
  if ('name' in item && typeof item.name === 'string') return item.name;
  return '';
};

const itemZone = (item: RankingsClientItem | (CitySummary & RankedItemMixin)): string =>
  'zone' in item && typeof item.zone === 'string' ? item.zone : '';

const readSortValue = (
  item: RankingsClientItem,
  key: Exclude<SortKey, 'rank'>,
): string | number => {
  switch (key) {
    case 'name':
      return itemDisplayName(item);
    case 'zone':
      return itemZone(item);
    case 'likes':
      return 'likes' in item && typeof item.likes === 'number' ? item.likes : 0;
    case 'votes':
      return 'votes' in item && typeof item.votes === 'number' ? item.votes : 0;
    case 'rating':
      return 'rating' in item && typeof item.rating === 'number' ? item.rating : 0;
    case 'visitors':
      return 'visitors' in item && typeof (item as { visitors?: number }).visitors === 'number'
        ? (item as { visitors: number }).visitors
        : 0;
    default:
      return 0;
  }
};

export const useRankingsLogic = () => {
  // STATE
  const [mainTab, setMainTab] = useState<MainTab>('cities');
  const [cityAlgo, setCityAlgo] = useState<CityAlgo>('mix');

  // Server-Side Params
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [totalItems, setTotalItems] = useState(0);

  // Client-Side Sort (Solo per POI e Foto)
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Data Storage
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<(CitySummary & RankedItemMixin)[]>([]);
  const [photos, setPhotos] = useState<(PhotoSubmission & RankedItemMixin)[]>([]);
  const [pois, setPois] = useState<(PointOfInterest & RankedItemMixin)[]>([]);

  // FETCHING LOGIC (With Server Side Support)
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      try {
        if (mainTab === 'cities') {
          // SERVER SIDE FETCHING
          const result = await getRankedCities({
            sortType: cityAlgo,
            page: page,
            pageSize: pageSize,
            search: search,
            zone: selectedZone,
          });

          if (isMounted) {
            setCities(result.data);
            setTotalItems(result.totalCount);
          }
        } else if (mainTab === 'gallery') {
          // CLIENT SIDE (Small dataset)
          const data = await getTopCommunityPhotos(50);
          if (isMounted) {
            setPhotos(data);
            setTotalItems(data.length);
          }
        } else if (mainTab === 'pois') {
          // CLIENT SIDE (Small dataset)
          const data = await getTopCommunityPois(50);
          if (isMounted) {
            setPois(data);
            setTotalItems(data.length);
          }
        }
      } catch (e) {
        console.error('Ranking fetch error:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Debounce per ricerca
    const timer = setTimeout(load, 300);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [mainTab, cityAlgo, page, search, selectedZone]); // pageSize rimosso se costante

  // Reset Page on Filter Change
  useEffect(() => {
    setPage(1);
  }, [mainTab, cityAlgo, search, selectedZone]);

  // PROCESSING LOGIC (Client-Side Sort & Filter for Photos/POIs ONLY)
  // Per Cities, i dati sono già filtrati/ordinati dal server
  const processedData = useMemo(() => {
    if (mainTab === 'cities') {
      // Dati server-side già pronti
      return cities;
    }

    let data: RankingsClientItem[] = mainTab === 'gallery' ? [...photos] : [...pois];

    // 1. FILTER BY ZONE (Client side)
    if (selectedZone) {
      data = data.filter((item) => itemZone(item) === selectedZone);
    }

    // 2. FILTER BY SEARCH (Client side)
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((item) => {
        const name = itemDisplayName(item);
        const zone = itemZone(item);
        return name.toLowerCase().includes(q) || zone.toLowerCase().includes(q);
      });
    }

    // 3. SORT (Client side)
    if (sortKey !== 'rank') {
      data.sort((a, b) => {
        let valA: string | number = readSortValue(a, sortKey);
        let valB: string | number = readSortValue(b, sortKey);
        if (valA === undefined || valA === null) valA = 0;
        if (valB === undefined || valB === null) valB = 0;
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Restore original rank
      data.sort((a, b) => (a.originalRank || 0) - (b.originalRank || 0));
    }

    return data;
  }, [cities, photos, pois, mainTab, search, sortKey, sortDir, selectedZone]);

  // Derived: Available Zones (From all loaded data or fixed list? Using data for now)
  const availableZones = useMemo(() => {
    const source = mainTab === 'cities' ? cities : mainTab === 'gallery' ? photos : pois;
    const zones = new Set<string>();
    source.forEach((item) => {
      const zone = itemZone(item);
      if (zone) zones.add(zone);
    });
    return Array.from(zones).sort();
  }, [cities, photos, pois, mainTab]);

  // ACTIONS
  const handleSort = (key: SortKey) => {
    // Sorting per Cities è Server-Side: Qui non facciamo nulla se siamo su Cities
    // A meno che non implementiamo sort dinamico server-side anche per colonne arbitrarie.
    // Attualmente RPC supporta solo "algo" sort.
    if (mainTab === 'cities') return;

    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // Pagination Actions
  const nextPage = () => {
    if (page * pageSize < totalItems) setPage((p) => p + 1);
  };

  const prevPage = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  return {
    // State
    mainTab,
    setMainTab,
    cityAlgo,
    setCityAlgo,
    sortKey,
    sortDir,
    search,
    setSearch,
    selectedZone,
    setSelectedZone,
    availableZones,
    loading,

    // Data
    processedData,

    // Pagination State
    page,
    pageSize,
    totalItems,

    // Actions
    handleSort,
    nextPage,
    prevPage,
  };
};
