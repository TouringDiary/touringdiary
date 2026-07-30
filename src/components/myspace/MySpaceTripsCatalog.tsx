import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, Map, Plus, Trash2 } from 'lucide-react';
import type { CitySummary } from '@/types';
import type { Viaggio } from '@/types/models/Viaggio';
import { createEmptyViaggio, listViaggiByUser } from '@/services/viaggio/viaggioService';
import { deleteViaggio } from '@/services/viaggio/viaggioService';
import { listCityIdsForViaggio } from '@/services/viaggio/viaggioCityService';
import { emitDueRicordamiNotifications } from '@/services/viaggio/viaggioRicordamiService';
import { useUser } from '@/context/UserContext';
import { useModal } from '@/context/ModalContext';
import { useNavigation } from '@/context/useNavigation';
import { useFeatureFlag } from '@/context/PlatformControlContext';
import { PLATFORM_FEATURE_FLAG_KEYS } from '@/constants/platformFeatureFlags';
import { findCityInManifest } from '@/myspace/resolveCityPresentation';
import {
  isViaggioPast,
  loadTripsSortMode,
  saveTripsSortMode,
  type MySpaceTripsSortMode,
} from '@/myspace/mySpaceTripsCatalogPrefs';
import { saveMySpaceNavMemory } from '@/myspace/mySpaceNavMemory';
import { MY_SPACE_DEFAULT_ROOT } from '@/myspace/mySpaceRoots';
import { MY_SPACE_TRIPS_CATALOG } from '@/myspace/mySpaceTripsSession';
import { MySpaceCityPickModal } from './MySpaceCityPickModal';
import { MySpaceViaggioCityThumbButton } from './MySpaceViaggioCityThumbButton';
import { MySpaceViaggioCoverPreview } from './MySpaceViaggioCoverPreview';
import { MySpaceViaggioDeleteModal } from './MySpaceViaggioDeleteModal';
import { ViaggioRicordamiControl } from './ViaggioRicordamiControl';
import { SwipeToDelete } from '@/components/common/SwipeToDelete';
import { MySpaceSectionHeader } from './MySpaceSectionHeader';

interface Props {
  userId: string;
  onOpenViaggio: (viaggioId: string) => void;
  /** Snapshot path prima di lasciare MySpace (città). */
  onBeforeLeaveMySpace?: () => void;
}

function formatDay(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('it-IT');
}

function SortSelect({
  value,
  onChange,
}: {
  value: MySpaceTripsSortMode;
  onChange: (m: MySpaceTripsSortMode) => void;
}) {
  return (
    <label className="inline-flex items-center gap-1.5 text-[10px] text-slate-500">
      Ordina
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as MySpaceTripsSortMode)}
        className="rounded-md border border-slate-700 bg-slate-950 px-1.5 py-1 text-[10px] text-slate-300"
        data-testid="myspace-trips-sort"
      >
        <option value="updated_at">Ultima modifica</option>
        <option value="created_at">Data creazione</option>
        <option value="title">Titolo</option>
      </select>
    </label>
  );
}

function ViaggioRow({
  v,
  citiesForThumb,
  thumbBusy,
  userId,
  notificationsSiteEnabled,
  onOpen,
  onCityThumb,
  onUpdated,
  onRequestDelete,
}: {
  v: Viaggio;
  citiesForThumb: CitySummary[];
  thumbBusy: boolean;
  userId: string;
  notificationsSiteEnabled: boolean;
  onOpen: () => void;
  onCityThumb: (e: React.MouseEvent) => void;
  onUpdated: (next: Viaggio) => void;
  onRequestDelete: () => void;
}) {
  const primaryCity = v.destination
    ? citiesForThumb.find((c) => c.id === v.destination) ?? citiesForThumb[0]
    : citiesForThumb[0];
  const cityLabel = primaryCity?.name ?? null;
  const startLabel = formatDay(v.periodStart);
  const endLabel = formatDay(v.periodEnd);

  const rowContent = (
    <div
      className="w-full group flex items-stretch gap-2 md:gap-3 px-2 py-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-amber-500/40 transition-colors"
      data-testid={`myspace-viaggio-card-${v.id}`}
    >
      <MySpaceViaggioCoverPreview
        viaggio={v}
        userId={userId}
        onUpdated={onUpdated}
        className="w-[5.5rem] sm:w-28 md:w-40 lg:w-56 min-h-[3.5rem] self-stretch"
      />

      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen();
          }
        }}
        className="min-w-0 flex-1 text-left self-center outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 rounded-xl"
        aria-label={`Apri viaggio ${v.title || 'Viaggio'}`}
      >
        <div className="min-w-0">
          <span className="block text-sm font-bold text-white truncate group-hover:text-amber-300 transition-colors">
            {v.title || 'Viaggio'}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400">
            {cityLabel && (
              <span className="truncate max-w-full sm:max-w-[14rem]">{cityLabel}</span>
            )}
            {(startLabel || endLabel) && (
              <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-slate-500">
                {startLabel && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" aria-hidden />
                    {startLabel}
                  </span>
                )}
                {endLabel && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" aria-hidden />
                    {endLabel}
                  </span>
                )}
              </span>
            )}
            {!startLabel && !endLabel && (
              <span className="text-slate-600">Periodo non impostato</span>
            )}
          </span>
        </div>
      </div>

      <div className="shrink-0 self-start pt-0.5">
        <ViaggioRicordamiControl
          viaggio={v}
          notificationsSiteEnabled={notificationsSiteEnabled}
          onUpdated={onUpdated}
          compact
        />
      </div>

      <div className="shrink-0 self-center">
        <MySpaceViaggioCityThumbButton
          cities={citiesForThumb}
          busy={thumbBusy}
          onClick={onCityThumb}
          aria-label={
            cityLabel ? `Apri pagina città: ${cityLabel}` : 'Scegli città da aprire'
          }
          title={cityLabel ?? 'Apri città'}
        />
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRequestDelete();
        }}
        className="hidden lg:inline-flex self-center shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-rose-300 hover:bg-slate-800/80"
        aria-label={`Elimina ${v.title || 'viaggio'}`}
        title="Elimina viaggio"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  return (
    <li>
      <SwipeToDelete
        onDelete={onRequestDelete}
        className="rounded-xl"
        revealClassName="inset-y-[10%] rounded-xl"
      >
        {rowContent}
      </SwipeToDelete>
    </li>
  );
}

/**
 * Catalogo MySpace «I miei Viaggi» — DOC 35 §6.1 (MP-02 STEP-1).
 */
export const MySpaceTripsCatalog: React.FC<Props> = ({
  userId,
  onOpenViaggio,
  onBeforeLeaveMySpace,
}) => {
  const { cityManifest } = useUser();
  const { closeModal } = useModal();
  const { navigateToCity } = useNavigation();
  const notificationsFlag = useFeatureFlag(PLATFORM_FEATURE_FLAG_KEYS.COMMS_NOTIFICATIONS);
  const siteNotificationsOn = notificationsFlag?.enabled ?? true;

  const [items, setItems] = useState<Viaggio[]>([]);
  const [sortMode, setSortMode] = useState<MySpaceTripsSortMode>(() =>
    loadTripsSortMode(userId),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [cityPickList, setCityPickList] = useState<CitySummary[] | null>(null);
  const [resolvingCityFor, setResolvingCityFor] = useState<string | null>(null);
  const [citiesByViaggioId, setCitiesByViaggioId] = useState<Record<string, CitySummary[]>>({});
  const [deleteTarget, setDeleteTarget] = useState<Viaggio | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadViaggi = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listViaggiByUser(userId, sortMode);
      if (!mountedRef.current) return;
      setItems(rows);
      // Ricordami: controllo opportunistico a ogni load.
      // L'emissione è idempotente: il servizio decide se esistono notifiche realmente dovute;
      // il catalogo non contiene logica di scheduling.
      if (siteNotificationsOn) {
        void emitDueRicordamiNotifications(userId).catch((e) =>
          console.error('[MySpaceTripsCatalog] ricordami emit failed', e),
        );
      }
    } catch (e) {
      console.error('[MySpaceTripsCatalog] listViaggiByUser failed', e);
      if (!mountedRef.current) return;
      setError('Non è stato possibile caricare i viaggi.');
      setItems([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [userId, sortMode, siteNotificationsOn]);

  useEffect(() => {
    void loadViaggi();
  }, [loadViaggi]);

  useEffect(() => {
    if (items.length === 0) {
      setCitiesByViaggioId({});
      return;
    }

    // Doppio update intenzionale di citiesByViaggioId:
    // 1) seed sincrono con la città principale dal manifest → UI subito popolata (no flicker)
    // 2) refresh asincrono via listCityIdsForViaggio() → lista completa delle città del viaggio
    const seed: Record<string, CitySummary[]> = {};
    for (const v of items) {
      const primary = v.destination
        ? findCityInManifest(v.destination, cityManifest)
        : undefined;
      seed[v.id] = primary ? [primary] : [];
    }
    setCitiesByViaggioId(seed);

    let cancelled = false;
    const loadCities = async () => {
      // Promise.all sicuro: ogni item è isolato con try/catch e risolve sempre
      // (seed di fallback); un fallimento non rifiuta l’aggregato.
      const entries = await Promise.all(
        items.map(async (v) => {
          try {
            const ids = await listCityIdsForViaggio(v.id, v.destination);
            const resolved = ids
              .map((id) => findCityInManifest(id, cityManifest))
              .filter((c): c is CitySummary => Boolean(c));
            return [v.id, resolved] as const;
          } catch (e) {
            console.error('[MySpaceTripsCatalog] listCityIdsForViaggio failed', e);
            return [v.id, seed[v.id] ?? []] as const;
          }
        }),
      );
      if (cancelled || !mountedRef.current) return;
      setCitiesByViaggioId(Object.fromEntries(entries));
    };

    void loadCities();
    return () => {
      cancelled = true;
    };
  }, [items, cityManifest]);

  const { upcoming, past } = useMemo(() => {
    const up: Viaggio[] = [];
    const pa: Viaggio[] = [];
    for (const v of items) {
      if (isViaggioPast(v.periodEnd)) pa.push(v);
      else up.push(v);
    }
    return { upcoming: up, past: pa };
  }, [items]);

  const handleSortChange = (mode: MySpaceTripsSortMode) => {
    setSortMode(mode);
    saveTripsSortMode(userId, mode);
  };

  const goToCity = useCallback(
    (cityId: string) => {
      setCityPickList(null);
      onBeforeLeaveMySpace?.();
      saveMySpaceNavMemory(userId, {
        activeRoot: MY_SPACE_DEFAULT_ROOT,
        tripsView: MY_SPACE_TRIPS_CATALOG,
      });
      navigateToCity(cityId);
      closeModal();
    },
    [navigateToCity, closeModal, onBeforeLeaveMySpace, userId],
  );

  const handleCityThumbClick = async (e: React.MouseEvent, viaggio: Viaggio) => {
    e.stopPropagation();
    e.preventDefault();
    if (resolvingCityFor) return;

    setResolvingCityFor(viaggio.id);
    try {
      const cityIds = await listCityIdsForViaggio(viaggio.id, viaggio.destination);
      const resolved = cityIds
        .map((id) => findCityInManifest(id, cityManifest))
        .filter((c): c is CitySummary => Boolean(c));

      if (!mountedRef.current) return;

      if (resolved.length === 0) return;
      if (resolved.length === 1) {
        goToCity(resolved[0].id);
        return;
      }
      setCityPickList(resolved);
    } catch (err) {
      console.error('[MySpaceTripsCatalog] listCityIdsForViaggio failed', err);
    } finally {
      if (mountedRef.current) setResolvingCityFor(null);
    }
  };

  const handleCreateEmpty = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const created = await createEmptyViaggio(userId, 'Nuovo viaggio', {
        ricordamiEnabled: siteNotificationsOn,
      });
      if (!mountedRef.current) return;
      onOpenViaggio(created.id);
      // Navigazione immediata: evita reload catalogo non più montato/visibile.
    } catch (e) {
      console.error('[MySpaceTripsCatalog] createEmptyViaggio failed', e);
      if (!mountedRef.current) return;
      setError('Creazione viaggio non riuscita.');
    } finally {
      if (mountedRef.current) setCreating(false);
    }
  };

  const patchItem = (next: Viaggio) => {
    setItems((prev) => prev.map((x) => (x.id === next.id ? next : x)));
    setCitiesByViaggioId((prev) => {
      const current = prev[next.id];
      if (!current) return prev;
      const primary = next.destination
        ? findCityInManifest(next.destination, cityManifest)
        : undefined;
      if (!primary) {
        if (current.length === 0) return prev;
        return { ...prev, [next.id]: [] };
      }
      const withoutPrimary = current.filter((c) => c.id !== primary.id);
      const nextCities = [primary, ...withoutPrimary];
      return { ...prev, [next.id]: nextCities };
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    try {
      await deleteViaggio(id);
      setDeleteTarget(null);
      setItems((prev) => prev.filter((x) => x.id !== id));
      setCitiesByViaggioId((prev) => {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (e) {
      console.error('[MySpaceTripsCatalog] deleteViaggio failed', e);
      // Dialog resta aperta: l’utente può riprovare o annullare.
    }
  };

  const renderGroup = (title: string, list: Viaggio[], testId: string, emptyMessage: string) => (
    <section className="min-w-0" data-testid={testId}>
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
        {title}
      </h3>
      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 px-4 py-8 text-center">
          <p className="text-xs text-slate-500 leading-relaxed">{emptyMessage}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((v) => {
            const cached = citiesByViaggioId[v.id];
            const citiesForThumb =
              cached ??
              (v.destination
                ? (() => {
                    const primaryCity = findCityInManifest(v.destination, cityManifest);
                    return primaryCity ? [primaryCity] : [];
                  })()
                : []);
            return (
              <ViaggioRow
                key={v.id}
                v={v}
                citiesForThumb={citiesForThumb}
                thumbBusy={resolvingCityFor === v.id}
                userId={userId}
                notificationsSiteEnabled={siteNotificationsOn}
                onOpen={() => onOpenViaggio(v.id)}
                onCityThumb={(e) => void handleCityThumbClick(e, v)}
                onUpdated={patchItem}
                onRequestDelete={() => setDeleteTarget(v)}
              />
            );
          })}
        </ul>
      )}
    </section>
  );

  return (
    <div
      id="myspace-root-panel-trips"
      role="tabpanel"
      aria-labelledby="myspace-root-tab-trips"
      data-testid="myspace-trips-catalog"
      className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 md:p-6"
    >
      <MySpaceSectionHeader
        icon={Map}
        title="I miei Viaggi"
        description={loading ? 'Caricamento…' : `${items.length} viaggi`}
        iconClassName="w-4 h-4 text-amber-300 shrink-0"
        actions={
          <div className="flex items-center gap-3">
            <SortSelect value={sortMode} onChange={handleSortChange} />
            <button
              type="button"
              onClick={handleCreateEmpty}
              disabled={creating || loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-amber-300 border border-amber-500/40 hover:bg-amber-500/10 disabled:opacity-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden />
              Nuovo
            </button>
          </div>
        }
      />

      {error && (
        <p className="text-sm text-rose-400 mb-4" role="alert">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
        {renderGroup(
          'Prossimo Viaggio',
          upcoming,
          'myspace-trips-upcoming',
          'Nessun viaggio in programma. Crea un nuovo viaggio quando sei pronto.',
        )}
        {renderGroup(
          'Viaggio Concluso',
          past,
          'myspace-trips-past',
          'Nessun viaggio concluso. I viaggi passati compariranno qui.',
        )}
      </div>

      {cityPickList && cityPickList.length > 0 && (
        <MySpaceCityPickModal
          cities={cityPickList}
          onSelect={goToCity}
          onClose={() => setCityPickList(null)}
        />
      )}

      {deleteTarget && (
        <MySpaceViaggioDeleteModal
          viaggioTitle={deleteTarget.title}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
};
