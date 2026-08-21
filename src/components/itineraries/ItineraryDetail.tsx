import {
  ArrowLeft,
  ArrowRight,
  Award,
  Bed,
  Calendar,
  Check,
  ChevronLeft,
  Copy,
  Loader2,
  Navigation,
  Star,
  User,
  X,
} from 'lucide-react';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Z_MODAL_NESTED } from '@/constants/zIndex';
import { useUser } from '@/context/UserContext';
import { useDynamicStyles } from '@/hooks/useDynamicStyles';
import { getCityDetails } from '../../services/cityService';
import { calculateDistance } from '../../services/geo';
import type { PointOfInterest, PremadeItinerary, User as UserType } from '../../types/index';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { StarRating } from '../common/StarRating';
import { PoiDetailModal } from '../modals/PoiDetailModal';

const prettify = (str: string) =>
  str
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

/** Coordinate usabili per distanza: presenti, finite; (0,0) non è accettato come “mancanti inventate” né come punto utile (legacy). */
function hasUsableCoords(
  coords: { lat: number; lng: number } | null | undefined,
): coords is { lat: number; lng: number } {
  if (!coords) return false;
  if (!Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) return false;
  if (coords.lat === 0 && coords.lng === 0) return false;
  return true;
}

interface Props {
  itinerary: PremadeItinerary;
  onBack: () => void;
  onImportConfirm: (
    customStays: Record<number, { start?: PointOfInterest; end?: PointOfInterest }>,
    startDate: string,
  ) => void;
  userLocation?: { lat: number; lng: number } | null;
  user?: UserType;
  onOpenAuth?: () => void;
}

type CustomStaysMap = Record<number, { start?: PointOfInterest; end?: PointOfInterest }>;
type PremadeItineraryStop = PremadeItinerary['items'][number];
type ResolvedItineraryItem = PremadeItineraryStop & {
  /** Assente = POI non risolto o senza coordinate usabili (allineato a PointOfInterest.coords?). */
  coords?: { lat: number; lng: number };
  fullPoi?: PointOfInterest;
};
/** Esito risoluzione città: best-effort, senza inventare dati per i fallimenti. */
type CityResolveOutcome = 'all' | 'partial' | 'none';

/** Distingue tappe identiche nello stesso giorno senza un id item-level nel dominio. */
function itineraryStopRenderKey(item: PremadeItineraryStop, occurrenceAmongEquals: number): string {
  return [
    String(item.dayIndex),
    item.poiId,
    item.timeSlotStr,
    item.cityId,
    item.fallbackName ?? '',
    item.note ?? '',
    String(occurrenceAmongEquals),
  ].join('\u0001');
}

export const ItineraryDetail = ({
  itinerary,
  onBack,
  onImportConfirm,
  userLocation,
  user: userProp,
  onOpenAuth,
}: Props) => {
  const { user: contextUser } = useUser();
  const user = userProp ?? contextUser;
  const [isFlipped, setIsFlipped] = useState(false);
  const [customStays, setCustomStays] = useState<CustomStaysMap>({});
  const filterSectionLabel10Style = useDynamicStyles('filter_section_title', true);
  const [availableHotels, setAvailableHotels] = useState<PointOfInterest[]>([]);
  const [resolvedPoiById, setResolvedPoiById] = useState<Map<string, PointOfInterest>>(
    () => new Map(),
  );

  const [previewPoi, setPreviewPoi] = useState<PointOfInterest | null>(null);
  const [showDateConfig, setShowDateConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cityResolveOutcome, setCityResolveOutcome] = useState<CityResolveOutcome | null>(null);

  const now = new Date();
  const minDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const [startDate, setStartDate] = useState<string>(minDateStr);
  const [isImporting, setIsImporting] = useState(false);

  const resolveGenRef = useRef(0);

  /** Città da risolvere: identità stabile (stringa), indipendente dalla ref di `items`. */
  const uniqueCityIdsKey = useMemo(() => {
    const ids = new Set<string>();
    for (const item of itinerary.items) {
      const fromItem = (item.cityId || '').trim();
      if (fromItem) {
        ids.add(fromItem);
        continue;
      }
      const fromMain = (itinerary.mainCity || '').trim().toLowerCase();
      if (fromMain) ids.add(fromMain);
    }
    return Array.from(ids).sort().join('\0');
  }, [itinerary.items, itinerary.mainCity]);

  const resolvedItems = useMemo((): ResolvedItineraryItem[] => {
    return itinerary.items.map((item) => {
      const fullPoi = resolvedPoiById.get(item.poiId);
      const coords = hasUsableCoords(fullPoi?.coords) ? fullPoi.coords : undefined;
      return { ...item, coords, fullPoi };
    });
  }, [itinerary.items, resolvedPoiById]);

  useEffect(() => {
    const gen = ++resolveGenRef.current;
    if (!itinerary.id) {
      setIsLoading(false);
      setResolvedPoiById(new Map());
      setAvailableHotels([]);
      setCityResolveOutcome(null);
      return;
    }

    setIsLoading(true);
    setIsFlipped(false);
    setCustomStays({});
    setAvailableHotels([]);
    setResolvedPoiById(new Map());
    setCityResolveOutcome(null);

    const cityIds = uniqueCityIdsKey.length === 0 ? [] : uniqueCityIdsKey.split('\0');

    const resolvePois = async () => {
      try {
        const citiesDataResults = await Promise.allSettled(
          cityIds.map((id) => getCityDetails(id, undefined, { peopleAudience: 'public' })),
        );

        if (gen !== resolveGenRef.current) return;

        const allPoisMap = new Map<string, PointOfInterest>();
        const hotelsById = new Map<string, PointOfInterest>();
        let resolvedCount = 0;
        let failedCount = 0;

        for (const result of citiesDataResults) {
          if (result.status === 'rejected') {
            failedCount += 1;
            console.error('Risoluzione città fallita:', result.reason);
            continue;
          }
          const city = result.value;
          if (!city?.details?.allPois) {
            failedCount += 1;
            continue;
          }
          resolvedCount += 1;
          for (const poi of city.details.allPois) {
            allPoisMap.set(poi.id, poi);
            if (poi.category === 'hotel' || (poi.category as string) === 'alloggi') {
              hotelsById.set(poi.id, poi);
            }
          }
        }

        if (cityIds.length === 0) {
          setCityResolveOutcome(null);
        } else if (failedCount === 0) {
          setCityResolveOutcome('all');
        } else if (resolvedCount === 0) {
          setCityResolveOutcome('none');
        } else {
          setCityResolveOutcome('partial');
        }

        setAvailableHotels(
          [...hotelsById.values()].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)),
        );
        setResolvedPoiById(allPoisMap);
      } catch (err) {
        console.error('Risoluzione itinerario fallita:', err);
      } finally {
        if (gen === resolveGenRef.current) setIsLoading(false);
      }
    };

    void resolvePois();

    return () => {
      resolveGenRef.current += 1;
    };
  }, [itinerary.id, uniqueCityIdsKey]);

  useEffect(() => {
    setCustomStays((prev) => {
      let changed = false;
      const next: CustomStaysMap = { ...prev };
      for (const key of Object.keys(next)) {
        const dayIndex = Number(key);
        if (!Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex >= itinerary.durationDays) {
          delete next[dayIndex];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [itinerary.durationDays]);

  const dayExtremes = useMemo(() => {
    const extremes: Record<number, { start?: ResolvedItineraryItem; end?: ResolvedItineraryItem }> =
      {};
    Array.from({ length: itinerary.durationDays }).forEach((_, dIdx) => {
      const dayItems = resolvedItems.filter((i) => i.dayIndex === dIdx);
      if (dayItems.length > 0)
        extremes[dIdx] = { start: dayItems[0], end: dayItems[dayItems.length - 1] };
    });
    return extremes;
  }, [resolvedItems, itinerary.durationDays]);

  const assignStay = (dayIndex: number, type: 'start' | 'end', hotel: PointOfInterest) =>
    setCustomStays((prev) => ({
      ...prev,
      [dayIndex]: { ...prev[dayIndex], [type]: hotel },
    }));
  const clearStay = (dayIndex: number, type: 'start' | 'end') =>
    setCustomStays((prev) => {
      const newState = { ...prev };
      if (newState[dayIndex]) {
        const newDay = { ...newState[dayIndex] };
        delete newDay[type];
        if (!newDay.start && !newDay.end) delete newState[dayIndex];
        else newState[dayIndex] = newDay;
      }
      return newState;
    });

  const handleImport = async () => {
    setIsImporting(true);
    try {
      await onImportConfirm(customStays, startDate);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#020617] perspective-1000 relative">
      <div
        className={`relative flex-1 transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
      >
        <div
          className={`absolute inset-0 backface-hidden flex flex-col bg-[#020617] z-floating-panel ${isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}
        >
          <div className="relative h-64 shrink-0 overflow-hidden">
            <ImageWithFallback
              src={itinerary.coverImage}
              alt={itinerary.title}
              className="w-full h-full object-cover"
              priority={true}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/50 to-transparent"></div>
            <div className="absolute top-6 left-8 z-dropdown flex items-center gap-4">
              <button
                type="button"
                onClick={onBack}
                className="p-2.5 min-h-[44px] min-w-[44px] bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white border border-white/10 transition-all active:scale-95 group inline-flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <span
                className={`text-[10px] font-black text-white px-3 py-1 rounded-full backdrop-blur-md border uppercase tracking-widest flex items-center gap-2 shadow-2xl ${itinerary.type === 'official' ? 'bg-amber-600/80 border-amber-500' : 'bg-indigo-600/80 border-indigo-400'}`}
              >
                {itinerary.type === 'official' ? (
                  <Award className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
                {itinerary.type === 'official' ? 'TOURING DIARY' : 'DIARIO COMMUNITY'}
              </span>
            </div>
            <div className="absolute bottom-8 left-8 right-8">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] backdrop-blur-sm">
                  {prettify(itinerary.zone)}
                </span>
                <div className="flex items-center gap-1.5 text-amber-400 bg-black/40 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm shadow-lg">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-black text-sm">{itinerary.rating}</span>
                </div>
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-2 leading-none tracking-tighter drop-shadow-2xl">
                {itinerary.title}
              </h2>
              <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2 text-slate-200">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-black text-xs border border-indigo-400 shadow-lg">
                    {(itinerary.author || 'U').charAt(0)}
                  </div>
                  <span className="text-sm font-bold tracking-wide">
                    di <strong className="text-white">{itinerary.author || 'Utente Local'}</strong>
                  </span>
                </div>
                <div className="h-4 w-px bg-slate-700"></div>
                <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                  <Calendar className="w-4 h-4 text-amber-500" /> {itinerary.durationDays} Giorni
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 pb-44 md:px-12 md:py-10 md:pr-96 md:pb-10 custom-scrollbar bg-[#020617]">
            {isLoading ? (
              <div
                className="h-64 flex flex-col items-center justify-center gap-4"
                role="status"
                aria-live="polite"
              >
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" aria-hidden />
                <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">
                  Sincronizzazione tappe...
                </p>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-12 pb-32">
                {cityResolveOutcome === 'partial' && (
                  <p
                    className="text-amber-400/90 text-sm font-medium bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3"
                    role="status"
                  >
                    Alcune città non sono state caricate. Le tappe e gli alloggi delle altre restano
                    disponibili.
                  </p>
                )}
                {cityResolveOutcome === 'none' && (
                  <p
                    className="text-rose-400/90 text-sm font-medium bg-rose-500/10 border border-rose-500/30 rounded-2xl px-4 py-3"
                    role="status"
                  >
                    Nessuna città dell&apos;itinerario è stata caricata. Riprova più tardi.
                  </p>
                )}
                {Array.from({ length: itinerary.durationDays }, (_slot, dayIndex) => ({
                  dayIndex,
                })).map((day) => {
                  const dayItems = resolvedItems.filter((i) => i.dayIndex === day.dayIndex);
                  return (
                    <div
                      key={`${itinerary.id}-day-${day.dayIndex}`}
                      className="relative pl-12 sm:pl-16"
                    >
                      <div className="absolute left-[22px] sm:left-[30px] top-10 bottom-0 w-1 bg-gradient-to-b from-indigo-500/30 to-transparent rounded-full"></div>
                      <div className="absolute left-0 top-0 w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-slate-900 border-2 border-indigo-500 flex flex-col items-center justify-center shadow-2xl z-floating-panel">
                        <span className="text-[7px] sm:text-[8px] font-black text-indigo-400 uppercase leading-none mb-0.5 sm:mb-1">
                          Giorno
                        </span>
                        <span className="text-xl sm:text-2xl font-display font-black text-white leading-none">
                          {day.dayIndex + 1}
                        </span>
                      </div>
                      <div className="space-y-4 pt-4">
                        {dayItems.length === 0 && (
                          <div className="p-6 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800 text-slate-600 italic">
                            Nessuna tappa.
                          </div>
                        )}
                        {dayItems.map((item, itemPos) => {
                          const nextItem = dayItems[itemPos + 1];
                          const distToNext =
                            hasUsableCoords(item.coords) && hasUsableCoords(nextItem?.coords)
                              ? calculateDistance(
                                  item.coords.lat,
                                  item.coords.lng,
                                  nextItem.coords.lat,
                                  nextItem.coords.lng,
                                )
                              : null;
                          let occurrenceAmongEquals = 0;
                          for (let i = 0; i < itemPos; i++) {
                            const other = dayItems[i];
                            if (
                              other.poiId === item.poiId &&
                              other.timeSlotStr === item.timeSlotStr &&
                              other.cityId === item.cityId &&
                              other.fallbackName === item.fallbackName &&
                              other.note === item.note
                            ) {
                              occurrenceAmongEquals += 1;
                            }
                          }

                          return (
                            <React.Fragment
                              key={itineraryStopRenderKey(item, occurrenceAmongEquals)}
                            >
                              <button
                                type="button"
                                disabled={!item.fullPoi}
                                onClick={() => {
                                  if (item.fullPoi) setPreviewPoi(item.fullPoi);
                                }}
                                className="w-full min-h-[44px] text-left bg-slate-900/60 border border-slate-800 p-3 sm:p-4 rounded-[1.5rem] sm:rounded-[2rem] flex items-center gap-3 sm:gap-5 hover:border-indigo-500/40 transition-all cursor-pointer group shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-default disabled:hover:border-slate-800"
                              >
                                <div className="w-12 sm:w-16 flex flex-col items-center justify-center shrink-0 border-r border-slate-800 pr-3 sm:pr-5">
                                  <div className="text-sm sm:text-lg font-mono font-black text-indigo-400 leading-none tabular-nums">
                                    {item.timeSlotStr}
                                  </div>
                                </div>
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 border-slate-800">
                                  <ImageWithFallback
                                    src={item.fullPoi?.imageUrl || ''}
                                    alt={item.fallbackName || ''}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <h4 className="font-bold text-white text-base sm:text-lg leading-tight truncate">
                                    {item.fallbackName || item.fullPoi?.name}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1 min-w-0">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest shrink-0">
                                      {prettify(item.cityId)}
                                    </span>
                                    {item.note && (
                                      <span className="text-[10px] text-slate-400 italic truncate min-w-0">
                                        "{item.note}"
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 group-hover:text-indigo-400 transition-all group-hover:translate-x-1 shrink-0" />
                              </button>
                              {distToNext !== null && distToNext > 0 && (
                                <div className="ml-16 sm:ml-24 flex items-center gap-2 text-slate-500 animate-in fade-in slide-in-from-left-2">
                                  <div className="h-4 w-px bg-slate-800"></div>
                                  <Navigation className="w-3 h-3 text-indigo-500 transform rotate-45" />
                                  <span className="text-[10px] font-mono font-black uppercase tracking-widest">
                                    {distToNext} km
                                  </span>
                                </div>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* BACKSIDE: ALLOGGI */}
        <div
          className={`absolute inset-0 backface-hidden rotate-y-180 bg-[#020617] flex flex-col z-floating-panel ${!isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}
        >
          <div className="flex justify-between items-center px-4 sm:px-8 py-3 sm:py-4 border-b border-slate-800 bg-[#0f172a] shrink-0 gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsFlipped(false)}
              className="flex items-center gap-2 min-h-[44px] px-4 sm:px-6 py-2.5 hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all text-[10px] sm:text-xs font-black uppercase tracking-widest border border-slate-700"
            >
              <ChevronLeft className="w-4 h-4 shrink-0" />
              <span className="truncate">Torna alla Timeline</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsFlipped(false);
                setShowDateConfig(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white min-h-[44px] px-4 sm:px-8 py-2.5 rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl transition-all"
            >
              <Check className="w-4 h-4 shrink-0" />
              <span className="truncate">Conferma Alloggi</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#020617]">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h3 className="text-4xl font-display font-bold text-white mb-2 uppercase tracking-tight">
                  Logistic Alloggi
                </h3>
                <p className="text-slate-400 text-base max-w-2xl mx-auto">
                  Valuta la comodità degli alloggi reali in base alla distanza dalla prima e ultima
                  tappa di ogni giornata.
                </p>
              </div>

              {availableHotels.length === 0 ? (
                <div className="text-center py-20 text-slate-500 italic bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed px-6">
                  {cityResolveOutcome === 'none'
                    ? 'Impossibile caricare le città: gli alloggi non sono disponibili.'
                    : cityResolveOutcome === 'partial'
                      ? 'Nessun hotel nelle città caricate (alcune città non sono state risolte).'
                      : "Nessun hotel disponibile nelle città dell'itinerario."}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {availableHotels.map((hotel: PointOfInterest) => (
                    <div
                      key={hotel.id}
                      className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden transition-all flex flex-col h-full shadow-2xl group hover:border-indigo-500/30"
                    >
                      <div className="h-40 relative shrink-0">
                        <ImageWithFallback
                          src={hotel.imageUrl}
                          alt={hotel.name}
                          className="w-full h-full object-cover"
                          category="hotel"
                        />
                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/10">
                          {hotel.subCategory || 'Hotel'}
                        </div>
                      </div>
                      <div className="p-6 flex-1 flex flex-col">
                        <h4 className="text-xl font-bold text-white mb-1 leading-tight">
                          {hotel.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mb-6">
                          <StarRating value={hotel.rating} size="w-3 h-3" />
                          <span className="text-[10px] text-slate-500 font-bold">
                            {hotel.rating ?? 0}
                          </span>
                        </div>
                        <div className="space-y-3">
                          {Array.from({ length: itinerary.durationDays }, (_slot, dayIndex) => ({
                            dayIndex,
                          })).map((day) => {
                            const extremes = dayExtremes[day.dayIndex];
                            const startCoords = extremes?.start?.coords;
                            const endCoords = extremes?.end?.coords;
                            const distToStart =
                              hasUsableCoords(hotel.coords) && hasUsableCoords(startCoords)
                                ? calculateDistance(
                                    hotel.coords.lat,
                                    hotel.coords.lng,
                                    startCoords.lat,
                                    startCoords.lng,
                                  )
                                : null;
                            const distToEnd =
                              hasUsableCoords(hotel.coords) && hasUsableCoords(endCoords)
                                ? calculateDistance(
                                    hotel.coords.lat,
                                    hotel.coords.lng,
                                    endCoords.lat,
                                    endCoords.lng,
                                  )
                                : null;
                            const isStart = customStays[day.dayIndex]?.start?.id === hotel.id;
                            const isEnd = customStays[day.dayIndex]?.end?.id === hotel.id;
                            return (
                              <div
                                key={`${hotel.id}-day-${day.dayIndex}`}
                                className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-3"
                              >
                                <div className="flex justify-between items-center px-1">
                                  <span className={filterSectionLabel10Style}>
                                    Giorno {day.dayIndex + 1}
                                  </span>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        isStart
                                          ? clearStay(day.dayIndex, 'start')
                                          : assignStay(day.dayIndex, 'start', hotel)
                                      }
                                      className={`text-[9px] min-h-[36px] px-3 py-1.5 rounded-lg font-black uppercase transition-all ${isStart ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500 hover:text-white'}`}
                                    >
                                      Start
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        isEnd
                                          ? clearStay(day.dayIndex, 'end')
                                          : assignStay(day.dayIndex, 'end', hotel)
                                      }
                                      className={`text-[9px] min-h-[36px] px-3 py-1.5 rounded-lg font-black uppercase transition-all ${isEnd ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500 hover:text-white'}`}
                                    >
                                      End
                                    </button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="bg-slate-900/50 p-2 rounded-xl border border-slate-800">
                                    <div className="text-[7px] font-bold text-slate-600 uppercase mb-1">
                                      Dallo Start
                                    </div>
                                    <div className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1">
                                      <Navigation className="w-2.5 h-2.5 text-indigo-400 rotate-45" />{' '}
                                      {distToStart !== null ? `${distToStart} km` : '--'}
                                    </div>
                                  </div>
                                  <div className="bg-slate-900/50 p-2 rounded-xl border border-slate-800">
                                    <div className="text-[7px] font-bold text-slate-600 uppercase mb-1">
                                      Al Rientro
                                    </div>
                                    <div className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1">
                                      <Navigation className="w-2.5 h-2.5 text-emerald-400 rotate-45" />{' '}
                                      {distToEnd !== null ? `${distToEnd} km` : '--'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-6 inset-x-4 md:inset-x-auto md:bottom-8 md:right-10 flex flex-col items-stretch md:items-end gap-4 pointer-events-none"
        style={{ zIndex: Z_MODAL_NESTED }}
      >
        {showDateConfig ? (
          <div className="bg-slate-900 border-2 border-indigo-500 rounded-[2.5rem] shadow-2xl p-6 sm:p-8 w-full max-w-sm md:max-w-md ml-auto animate-in slide-in-from-bottom-6 pointer-events-auto relative">
            <button
              type="button"
              onClick={() => setShowDateConfig(false)}
              className="absolute top-4 right-4 p-2 min-h-[44px] min-w-[44px] text-slate-500 hover:text-white transition-colors inline-flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-3">
              <Calendar className="w-7 h-7 text-indigo-500" /> Date del viaggio
            </h3>
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="fld-itineraries-itinerarydetail-tsx-l497"
                  className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-2 ml-1"
                >
                  Data Inizio
                </label>
                <input
                  id="fld-itineraries-itinerarydetail-tsx-l497"
                  type="date"
                  min={minDateStr}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full min-h-[44px] bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white font-bold outline-none"
                />
              </div>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => void handleImport()}
                  disabled={isImporting}
                  className="w-full min-h-[44px] bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-[1.5rem] shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isImporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}{' '}
                  CLONA NEL DIARIO
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsFlipped(true);
                    setShowDateConfig(false);
                  }}
                  className="w-full min-h-[44px] bg-slate-800 hover:bg-slate-700 text-indigo-400 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                >
                  <Bed className="w-4 h-4" /> Modifica Alloggi
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`flex flex-col items-end gap-4 animate-in fade-in pointer-events-auto ${isFlipped ? 'hidden' : ''}`}
          >
            <button
              type="button"
              onClick={() => setIsFlipped(true)}
              className="bg-slate-900/90 hover:bg-slate-800 backdrop-blur-xl text-indigo-400 hover:text-white px-8 py-4 min-h-[44px] rounded-full shadow-2xl border border-indigo-500/30 font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all hover:scale-105 active:scale-95"
            >
              <Bed className="w-5 h-5" />{' '}
              {Object.keys(customStays).length > 0 ? 'Modifica Alloggi' : 'Personalizza Alloggi'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDateConfig(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-6 min-h-[44px] rounded-[2.2rem] shadow-2xl shadow-indigo-900/60 font-black text-base uppercase tracking-widest flex items-center gap-4 transition-all hover:scale-105 active:scale-95 border-2 border-indigo-400/50"
            >
              <Copy className="w-6 h-6" /> Clona questo Viaggio
            </button>
          </div>
        )}
      </div>

      {previewPoi && (
        <PoiDetailModal
          poi={previewPoi}
          onClose={() => setPreviewPoi(null)}
          onToggleItinerary={() => {}}
          isInItinerary={false}
          onOpenReview={() => {}}
          userLocation={userLocation || null}
          user={user}
          onOpenAuth={onOpenAuth ?? (() => {})}
        />
      )}
    </div>
  );
};
