import { CalendarDays, Eye, Loader2, MinusCircle, Plus, Save, Wand2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useCityEditor } from '@/context/CityEditorContext';
import { type SuggestedCityItem, suggestCityItems } from '../../../../services/ai';
import type { SaveCityEventInput } from '../../../../services/city/entitiesService';
import { deleteCityEvent, getCityEvents, saveCityEvent } from '../../../../services/cityService';
import { getCachedSetting, SETTINGS_KEYS } from '../../../../services/settingsService';
import type { CityEvent } from '../../../../types/index';
import { getSafeEventCategory } from '../../../../utils/common';
import { DeleteConfirmationModal } from '../../../common/DeleteConfirmationModal';

type CanonicalOption = { value: string; label: string };

type EditableEventField = 'name' | 'date' | 'category';

const readOptionalString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;

const readOptionalCoords = (item: SuggestedCityItem): { lat: number; lng: number } | undefined => {
  const lat = typeof item.lat === 'number' && Number.isFinite(item.lat) ? item.lat : undefined;
  const lng = typeof item.lng === 'number' && Number.isFinite(item.lng) ? item.lng : undefined;
  if (lat === undefined || lng === undefined) return undefined;
  return { lat, lng };
};

/** Maps AI suggestion → SaveCityEventInput using only real present fields. */
const mapSuggestedToEventInput = (item: SuggestedCityItem): SaveCityEventInput | null => {
  const name = typeof item.name === 'string' ? item.name.trim() : '';
  if (!name) return null;

  const date = readOptionalString(item.date);
  const categoryRaw = readOptionalString(item.category);
  const description = readOptionalString(item.description);
  const location = readOptionalString(item.location);
  const coords = readOptionalCoords(item);

  if (!date || !categoryRaw || !description || !location || !coords) return null;

  const metadata: Record<string, unknown> = {};
  if (typeof item.rating === 'number' && Number.isFinite(item.rating))
    metadata.rating = item.rating;
  if (typeof item.visitors === 'number' && Number.isFinite(item.visitors))
    metadata.visitors = item.visitors;
  if (description) metadata.summary = description;

  return {
    name,
    date,
    category: getSafeEventCategory(categoryRaw),
    description,
    location,
    coords,
    imageUrl: readOptionalString(item.imageUrl),
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  };
};

type DiscoveryEventResult = SaveCityEventInput & { localId: string };

export const ServiceEvents = () => {
  const { city, triggerPreview, reloadCurrentCity } = useCityEditor();

  const eventList = getCachedSetting<CanonicalOption[]>(SETTINGS_KEYS.EVENT_CANONICAL_LIST);
  const EVENT_CANONICAL_LIST = eventList || [
    { value: 'Festa Patronale', label: 'Festa Patronale' },
  ];

  const [eventsList, setEventsList] = useState<CityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryResults, setDiscoveryResults] = useState<DiscoveryEventResult[]>([]);
  const activeDiscoveryRequestIdRef = useRef<number>(0);
  const activeLoadRequestIdRef = useRef<number>(0);
  const [aiQuery, setAiQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Draft degli indici di ordinamento in fase di editing
  const [orderDrafts, setOrderDrafts] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    if (!city?.id) return;
    const requestId = ++activeLoadRequestIdRef.current;
    const requestedCityId = city.id;
    setIsLoading(true);
    try {
      const data = await getCityEvents(requestedCityId);
      if (requestId !== activeLoadRequestIdRef.current) return;
      const dbEvents = [...data].sort((a, b) => {
        const orderA =
          typeof a.orderIndex === 'number' && Number.isFinite(a.orderIndex)
            ? a.orderIndex
            : Number.MAX_SAFE_INTEGER;
        const orderB =
          typeof b.orderIndex === 'number' && Number.isFinite(b.orderIndex)
            ? b.orderIndex
            : Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
      });

      // Preserva gli eventi locali temporanei non ancora salvati per la città corrente
      setEventsList((prev) => {
        const localDrafts = prev.filter(
          (e) => e.id.startsWith('new-') && e.cityId === requestedCityId,
        );
        return [...dbEvents, ...localDrafts];
      });
    } catch (e) {
      if (requestId === activeLoadRequestIdRef.current) {
        console.error(e);
      }
    } finally {
      if (requestId === activeLoadRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [city?.id]);

  useEffect(() => {
    if (!city?.id) return;
    activeDiscoveryRequestIdRef.current++;
    activeLoadRequestIdRef.current++;
    setDiscoveryResults([]);
    setIsDiscovering(false);
    void loadData();
    // Pulisce lo stato locale degli eventi quando cambia città per sicurezza
    return () => {
      setEventsList([]);
      setOrderDrafts({});
    };
  }, [city?.id, loadData]);

  const handleAddEvent = () => {
    if (!city?.id || isSaving) return;
    const maxOrder = eventsList.reduce((max, e) => {
      const val = e.orderIndex;
      return typeof val === 'number' && Number.isFinite(val) ? Math.max(max, val) : max;
    }, 0);
    const nextOrderIndex =
      maxOrder >= Number.MAX_SAFE_INTEGER ? Number.MAX_SAFE_INTEGER : maxOrder + 1;

    // Genera un ID fittizio locale temporaneo con slice()
    const tempId = `new-${crypto.randomUUID()}`;
    const temp: CityEvent = {
      id: tempId,
      cityId: city.id,
      name: '', // Nome vuoto per non persistere placeholder, l'utente lo inserisce prima di salvare
      date: '',
      category: 'Festa Patronale',
      description: '',
      location: '',
      coords: city.coords,
      orderIndex: nextOrderIndex,
    };

    setEventsList((prev) => [...prev, temp]);
  };

  const handleSaveEvent = async (id: string, event: CityEvent) => {
    if (!city?.id || isSaving) return;
    if (!event.name?.trim()) {
      alert("Il nome dell'evento è obbligatorio.");
      return;
    }

    activeDiscoveryRequestIdRef.current++;
    setIsSaving(true);
    const payload: SaveCityEventInput = {
      id: id.startsWith('new-') ? undefined : id,
      name: event.name.trim(),
      date: event.date ?? '',
      category: getSafeEventCategory(event.category ?? 'Festa Patronale'),
      description: event.description ?? '',
      location: event.location ?? '',
      coords: event.coords ?? city.coords,
      imageUrl: event.imageUrl ?? undefined,
      orderIndex: event.orderIndex,
      metadata: event.metadata,
    };

    try {
      await saveCityEvent(city.id, payload);
      // Rimuove l'id temporaneo prima di ricaricare dal DB
      setEventsList((prev) => prev.filter((e) => e.id !== id));
      await loadData();
      await reloadCurrentCity();
    } catch (e) {
      console.error(e);
      alert("Errore durante il salvataggio dell'evento.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateEvent = (id: string, field: EditableEventField, val: string) => {
    setEventsList((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: val } : p)));
  };

  const handleDeleteClick = (id: string, name: string) => {
    if (id.startsWith('new-')) {
      setEventsList((prev) => prev.filter((p) => p.id !== id));
    } else {
      setDeleteTarget({ id, name });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || isSaving) return;
    activeDiscoveryRequestIdRef.current++;
    setIsSaving(true);
    try {
      await deleteCityEvent(deleteTarget.id);
      setDeleteTarget(null);
      await loadData();
      await reloadCurrentCity();
    } catch (e) {
      console.error(e);
      alert('Errore durante eliminazione.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReorder = async (id: string, newRank: number) => {
    if (!city?.id || isSaving) return;
    activeDiscoveryRequestIdRef.current++;
    setIsSaving(true);

    const list = [...eventsList];
    const itemIndex = list.findIndex((i) => i.id === id);
    if (itemIndex === -1) {
      setIsSaving(false);
      return;
    }

    const backupList = [...eventsList];

    const [item] = list.splice(itemIndex, 1);
    const insertIndex = Math.min(Math.max(0, newRank - 1), list.length);
    list.splice(insertIndex, 0, item);

    const updated = list.map((p, idx) => ({ ...p, orderIndex: idx + 1 }));
    setEventsList(updated);

    try {
      for (const p of updated) {
        if (!p.id.startsWith('new-')) {
          const payload: SaveCityEventInput = {
            id: p.id,
            name: p.name,
            date: p.date,
            category: getSafeEventCategory(p.category ?? ''),
            description: p.description,
            location: p.location,
            coords: p.coords,
            imageUrl: p.imageUrl,
            metadata: p.metadata,
            orderIndex: p.orderIndex,
          };
          await saveCityEvent(city.id, payload);
        }
      }
      await loadData();
      await reloadCurrentCity();
    } catch (e) {
      console.error(e);
      alert('Errore durante il riordino. Ricarico lo stato attuale.');
      setEventsList(backupList);
      await loadData();
    } finally {
      setIsSaving(false);
    }
  };

  const handleOrderChange = (id: string, value: string) => {
    setOrderDrafts((prev) => ({ ...prev, [id]: value }));
  };

  const handleOrderCommit = async (id: string) => {
    const draft = orderDrafts[id];
    if (draft === undefined) return;

    setOrderDrafts((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });

    const trimmed = draft.trim();
    if (!/^\d+$/.test(trimmed)) {
      await loadData();
      return;
    }

    const newRank = Number(trimmed);
    if (
      newRank < 1 ||
      !Number.isInteger(newRank) ||
      !Number.isFinite(newRank) ||
      newRank > Number.MAX_SAFE_INTEGER
    ) {
      await loadData();
      return;
    }

    await handleReorder(id, newRank);
  };

  const handleDiscovery = async () => {
    if (!city?.name || !city.coords || isSaving) return;
    setIsDiscovering(true);
    const requestId = ++activeDiscoveryRequestIdRef.current;
    try {
      const existingNames = eventsList.map((i) => i.name);
      const results = await suggestCityItems(city.name, 'events', existingNames, aiQuery, 3);
      if (requestId !== activeDiscoveryRequestIdRef.current) return;
      setDiscoveryResults(
        results
          .map((item) => mapSuggestedToEventInput(item))
          .filter((mapped): mapped is SaveCityEventInput => mapped !== null)
          .map((item) => ({
            ...item,
            localId: crypto.randomUUID(),
          })),
      );
    } catch (e) {
      if (requestId === activeDiscoveryRequestIdRef.current) {
        console.error(e);
        alert('Errore durante la ricerca AI.');
      }
    } finally {
      if (requestId === activeDiscoveryRequestIdRef.current) {
        setIsDiscovering(false);
      }
    }
  };

  const handleImport = async (item: DiscoveryEventResult) => {
    if (!city?.id || isSaving) return;
    activeDiscoveryRequestIdRef.current++;
    setIsSaving(true);
    const maxOrder = eventsList.reduce((max, e) => {
      const val = e.orderIndex;
      return typeof val === 'number' && Number.isFinite(val) ? Math.max(max, val) : max;
    }, 0);
    const nextOrderIndex =
      maxOrder >= Number.MAX_SAFE_INTEGER ? Number.MAX_SAFE_INTEGER : maxOrder + 1;

    const { localId: _localId, ...eventInput } = item;
    const payload: SaveCityEventInput = {
      ...eventInput,
      category: getSafeEventCategory(item.category ?? ''),
      orderIndex: nextOrderIndex,
    };
    try {
      await saveCityEvent(city.id, payload);
      setDiscoveryResults((prev) => prev.filter((x) => x.localId !== item.localId));
      await loadData();
      await reloadCurrentCity();
    } catch (e) {
      console.error(e);
      alert("Errore durante l'importazione.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-800 flex flex-col h-[600px]">
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Elimina Evento"
        message={`Eliminare "${deleteTarget?.name}"?`}
      />

      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-white flex items-center gap-2 text-sm md:text-base">
          <CalendarDays className="w-5 h-5 text-rose-500" aria-hidden="true" /> Eventi
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Anteprima eventi"
            onClick={() => triggerPreview('events', 'Eventi Locali', eventsList)}
            className="min-h-11 min-w-11 inline-flex items-center justify-center p-1.5 bg-slate-800 hover:bg-rose-900/30 rounded text-slate-400 hover:text-rose-400 border border-slate-700"
          >
            <Eye className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Aggiungi evento"
            onClick={handleAddEvent}
            disabled={isSaving}
            className="min-h-11 min-w-11 inline-flex items-center justify-center p-1.5 bg-rose-600 hover:bg-rose-500 rounded text-white shadow-lg disabled:opacity-50"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="bg-rose-900/10 border border-rose-500/20 p-3 rounded-xl mb-4">
        <div className="flex gap-2 mb-2">
          <input
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            disabled={isSaving}
            placeholder="Cerca eventi..."
            aria-label="Cerca eventi tramite query"
            className="flex-1 bg-slate-900 border border-slate-700 rounded text-xs px-2 py-1 text-white disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleDiscovery}
            disabled={isDiscovering || isSaving}
            className="bg-rose-600 text-white px-3 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 min-h-11 disabled:opacity-50"
          >
            {isDiscovering ? (
              <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
            ) : (
              <Wand2 className="w-3 h-3" aria-hidden="true" />
            )}{' '}
            AI
          </button>
        </div>
        {discoveryResults.length > 0 && (
          <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
            {discoveryResults.map((res) => (
              <div
                key={res.localId}
                className="flex justify-between items-center bg-slate-900 p-2 rounded border border-slate-700"
              >
                <span className="text-xs text-white truncate max-w-[150px]">{res.name}</span>
                <button
                  type="button"
                  onClick={() => handleImport(res)}
                  disabled={isSaving}
                  className="text-[9px] bg-slate-800 hover:bg-rose-600 text-white px-2 py-1 rounded min-h-11 disabled:opacity-50"
                >
                  Importa
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
        {isLoading ? (
          <div className="text-center py-10">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-500" />
          </div>
        ) : (
          eventsList.map((evt, idx) => {
            const currentOrder =
              typeof evt.orderIndex === 'number' && Number.isFinite(evt.orderIndex)
                ? evt.orderIndex
                : idx + 1;
            const draftVal =
              orderDrafts[evt.id] !== undefined ? orderDrafts[evt.id] : String(currentOrder);

            return (
              <div
                key={evt.id}
                className="bg-slate-900 p-3 md:p-4 rounded-xl border border-slate-800 text-sm space-y-2 relative group flex gap-2"
              >
                <div className="w-12 shrink-0">
                  <input
                    type="number"
                    min="1"
                    value={draftVal}
                    onChange={(e) => handleOrderChange(evt.id, e.target.value)}
                    onBlur={() => handleOrderCommit(evt.id)}
                    disabled={isSaving}
                    aria-label="Ordine evento"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded text-center text-white text-sm font-bold py-1 min-h-11 disabled:opacity-50"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      type="button"
                      aria-label={`Salva ${evt.name || 'Nuovo'}`}
                      onClick={() => handleSaveEvent(evt.id, evt)}
                      disabled={isSaving}
                      className="text-emerald-500 hover:text-white min-h-11 min-w-11 inline-flex items-center justify-center p-1 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Elimina ${evt.name || 'Nuovo'}`}
                      onClick={() => handleDeleteClick(evt.id, evt.name)}
                      disabled={isSaving}
                      className="text-slate-600 hover:text-red-500 min-h-11 min-w-11 inline-flex items-center justify-center p-1 disabled:opacity-50"
                    >
                      <MinusCircle className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                  <input
                    value={evt.name}
                    onChange={(e) => handleUpdateEvent(evt.id, 'name', e.target.value)}
                    disabled={isSaving}
                    aria-label="Nome dell'evento"
                    className="bg-transparent font-bold text-white w-full outline-none border-b border-transparent focus:border-rose-500 pb-1 pr-24 disabled:opacity-50"
                    placeholder="Nome Evento"
                  />
                  <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2">
                    <input
                      value={evt.date}
                      onChange={(e) => handleUpdateEvent(evt.id, 'date', e.target.value)}
                      disabled={isSaving}
                      aria-label="Data dell'evento"
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 w-full disabled:opacity-50"
                      placeholder="Data"
                    />
                    <select
                      value={evt.category}
                      onChange={(e) => handleUpdateEvent(evt.id, 'category', e.target.value)}
                      disabled={isSaving}
                      aria-label="Categoria dell'evento"
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 w-full min-h-11 disabled:opacity-50"
                    >
                      {EVENT_CANONICAL_LIST.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.value}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
