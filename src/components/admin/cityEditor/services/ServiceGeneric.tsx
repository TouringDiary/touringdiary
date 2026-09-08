import { Eye, Loader2, MinusCircle, Plus, Save } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useCityEditor } from '@/context/CityEditorContext';
import { type SuggestedCityItem, suggestCityItems } from '../../../../services/ai';
import type { SaveCityServiceInput } from '../../../../services/city/entitiesService';
import {
  deleteCityService,
  getCityServices,
  saveCityService,
} from '../../../../services/cityService';
import type { CityService, CityServiceType } from '../../../../types/index';
import {
  SERVICE_TYPE_MAPPING,
  getBoxIdForType,
  getServicesConfig,
} from '../../../../constants/services';
import { getSafeServiceType } from '../../../../utils/common';
import { DeleteConfirmationModal } from '../../../common/DeleteConfirmationModal';
import { ServiceAiHunter, type ServiceAiResult } from '../../../modals/cityInfo/ServiceAiHunter';

const CITY_SERVICE_TYPES: string[] = [
  'airport',
  'train',
  'bus',
  'taxi',
  'maritime',
  'emergency',
  'pharmacy',
  'other',
  'transport',
  'info',
  'hospital',
  'police',
  'fire',
  'atm',
  'post',
  'luggage',
  'water',
  'consulate',
];

type EditableServiceField =
  | 'name'
  | 'contact'
  | 'category'
  | 'description'
  | 'url'
  | 'address'
  | 'type';

const isCityServiceType = (value: string): value is CityServiceType =>
  CITY_SERVICE_TYPES.includes(value as CityServiceType);

const toCityServiceType = (raw: string): CityServiceType => {
  const safe = getSafeServiceType(raw);
  return isCityServiceType(safe) ? safe : 'other';
};

const readOptionalString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;

const mapSuggestedToServiceAiResult = (item: SuggestedCityItem): ServiceAiResult | null => {
  const name = typeof item.name === 'string' ? item.name.trim() : '';
  if (!name) return null;
  return {
    name,
    type: readOptionalString(item.type),
    contact: readOptionalString(item.contact),
    category: readOptionalString(item.category),
    description: readOptionalString(item.description),
    url: readOptionalString(item.url),
    address: readOptionalString(item.address),
  };
};

const nextOrderIndexForBox = (boxServices: CityService[]): number => {
  const maxOrder = boxServices.reduce((max, s) => {
    const val = s.orderIndex;
    return typeof val === 'number' && Number.isFinite(val) ? Math.max(max, val) : max;
  }, 0);
  return maxOrder + 1;
};

export const ServiceGeneric = () => {
  const { city, triggerPreview, reloadCurrentCity } = useCityEditor();

  const SERVICE_BOXES = getServicesConfig();

  const [servicesList, setServicesList] = useState<CityService[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isDiscovering, setIsDiscovering] = useState(false);
  const [serviceResults, setServiceResults] = useState<ServiceAiResult[]>([]);
  const [serviceQuery, setServiceQuery] = useState('');
  const [discoveryCount, setDiscoveryCount] = useState(3);
  const [serviceTarget, setServiceTarget] = useState('generic');

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Draft degli indici di ordinamento in fase di editing
  const [orderDrafts, setOrderDrafts] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    if (!city?.id) return;
    setIsLoading(true);
    try {
      const data = await getCityServices(city.id);
      const dbServices = [...data].sort((a, b) => {
        const orderA = typeof a.orderIndex === 'number' && Number.isFinite(a.orderIndex) ? a.orderIndex : Number.MAX_SAFE_INTEGER;
        const orderB = typeof b.orderIndex === 'number' && Number.isFinite(b.orderIndex) ? b.orderIndex : Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
      });

      // Preserva i servizi locali temporanei non ancora salvati per la città corrente
      setServicesList((prev) => {
        const localDrafts = prev.filter((s) => s.id.startsWith('new-') && s.cityId === city.id);
        return [...dbServices, ...localDrafts];
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [city?.id]);

  useEffect(() => {
    if (!city?.id) return;
    void loadData();
    // Pulisce lo stato locale dei servizi quando cambia città per sicurezza
    return () => {
      setServicesList([]);
      setOrderDrafts({});
    };
  }, [city?.id, loadData]);

  const getServicesForBox = (boxId: string) => {
    return servicesList
      .filter((s) => getBoxIdForType(s.type) === boxId)
      .sort((a, b) => {
        const orderA = typeof a.orderIndex === 'number' && Number.isFinite(a.orderIndex) ? a.orderIndex : Number.MAX_SAFE_INTEGER;
        const orderB = typeof b.orderIndex === 'number' && Number.isFinite(b.orderIndex) ? b.orderIndex : Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
      });
  };

  const handleAddService = (boxId: string) => {
    if (!city?.id || isSaving) return;
    const firstVal = SERVICE_TYPE_MAPPING[boxId]?.types[0]?.val;
    const defaultType = firstVal ? toCityServiceType(firstVal) : 'other';
    const boxServices = getServicesForBox(boxId);

    // Genera un ID fittizio per l'editing locale temporaneo usando slice()
    const tempId = `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const temp: CityService & { cityId?: string } = {
      id: tempId,
      cityId: city.id,
      name: '', // Nome vuoto, l'utente lo deve compilare prima di salvare
      type: defaultType,
      contact: '',
      category: 'Utilità',
      description: '',
      url: '',
      address: '',
      orderIndex: nextOrderIndexForBox(boxServices),
    };

    setServicesList((prev) => [...prev, temp]);
  };

  const handleSave = async (id: string, item: CityService) => {
    if (!city?.id || isSaving) return;
    if (!item.name?.trim()) {
      alert('Il nome del servizio è obbligatorio.');
      return;
    }

    setIsSaving(true);
    const payload: SaveCityServiceInput = {
      id: id.startsWith('new-') ? undefined : id,
      name: item.name.trim(),
      type: item.type,
      contact: item.contact ?? '',
      category: item.category ?? 'Utilità',
      description: item.description ?? '',
      url: item.url ?? '',
      address: item.address ?? '',
      orderIndex: item.orderIndex,
    };

    try {
      await saveCityService(city.id, payload);
      // Rimuove l'id temporaneo prima di ricaricare dal DB
      setServicesList((prev) => prev.filter((p) => p.id !== id));
      await loadData();
      await reloadCurrentCity();
    } catch (e) {
      console.error(e);
      alert('Errore durante il salvataggio del servizio.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = (id: string, field: EditableServiceField, val: string) => {
    setServicesList((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (field === 'type') return { ...p, type: toCityServiceType(val) };
        return { ...p, [field]: val };
      }),
    );
  };

  const handleDeleteClick = (id: string, name: string) => {
    if (id.startsWith('new-')) {
      setServicesList((prev) => prev.filter((p) => p.id !== id));
    } else {
      setDeleteTarget({ id, name });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || isSaving) return;
    setIsSaving(true);
    try {
      await deleteCityService(deleteTarget.id);
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
    setIsSaving(true);

    const target = servicesList.find((i) => i.id === id);
    if (!target) {
      setIsSaving(false);
      return;
    }

    const boxId = getBoxIdForType(target.type);
    const boxList = getServicesForBox(boxId);
    const itemIndex = boxList.findIndex((i) => i.id === id);
    if (itemIndex === -1) {
      setIsSaving(false);
      return;
    }

    const backupList = [...servicesList];

    const reordered = [...boxList];
    const [item] = reordered.splice(itemIndex, 1);
    const insertIndex = Math.min(Math.max(0, newRank - 1), reordered.length);
    reordered.splice(insertIndex, 0, item);

    const updatedBox = reordered.map((p, idx) => ({ ...p, orderIndex: idx + 1 }));
    setServicesList((prev) => prev.map((s) => updatedBox.find((u) => u.id === s.id) ?? s));

    try {
      for (const p of updatedBox) {
        // Se un elemento è temporaneo, lo saltiamo nel riordino DB
        if (!p.id.startsWith('new-')) {
          await saveCityService(city.id, p);
        }
      }
      await loadData();
      await reloadCurrentCity();
    } catch (e) {
      console.error(e);
      alert('Errore durante il riordino. Ricarico lo stato attuale.');
      setServicesList(backupList);
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

    const newRank = parseInt(draft, 10);
    if (Number.isNaN(newRank) || newRank < 1) {
      await loadData();
      return;
    }

    await handleReorder(id, newRank);
  };

  const handleDiscovery = async () => {
    if (!city?.name || isSaving) return;
    setIsDiscovering(true);
    let finalContext = '';
    if (serviceTarget !== 'generic') {
      const targetLabel = SERVICE_BOXES.find((b) => b.id === serviceTarget)?.label;
      if (targetLabel) finalContext = `Trova SOLO servizi di tipo: ${targetLabel}. `;
    }

    try {
      const existingNames = servicesList.map((i) => i.name);
      const results = await suggestCityItems(
        city.name,
        'services',
        existingNames,
        finalContext + serviceQuery,
        discoveryCount,
      );
      setServiceResults(
        results
          .map(mapSuggestedToServiceAiResult)
          .filter((mapped): mapped is ServiceAiResult => mapped !== null),
      );
    } catch (e) {
      console.error(e);
      alert('Errore durante la ricerca AI.');
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleImport = async (item: ServiceAiResult) => {
    if (!city?.id || isSaving) return;
    setIsSaving(true);
    const normalizedType = item.type ? toCityServiceType(item.type) : 'other';
    const boxId = getBoxIdForType(normalizedType);
    const boxServices = getServicesForBox(boxId);
    const payload: SaveCityServiceInput = {
      name: item.name,
      type: normalizedType,
      contact: item.contact ?? '',
      category: item.category,
      description: item.description,
      url: item.url,
      address: item.address,
      orderIndex: nextOrderIndexForBox(boxServices),
    };
    try {
      await saveCityService(city.id, payload);
      setServiceResults((prev) => prev.filter((x) => x.name !== item.name));
      await loadData();
      await reloadCurrentCity();
    } catch (e) {
      console.error(e);
      alert("Errore durante l'importazione.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading)
    return (
      <div className="text-center py-10">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
      </div>
    );

  return (
    <div className="bg-slate-900 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-800 shadow-xl">
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Elimina Servizio"
        message={`Eliminare "${deleteTarget?.name}"?`}
      />

      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-white text-lg">Servizi Essenziali</h3>
        <button
          type="button"
          onClick={() => triggerPreview('services', 'Servizi Pubblici', servicesList)}
          className="min-h-11 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-2 text-xs font-bold uppercase"
        >
          <Eye className="w-4 h-4" /> Anteprima
        </button>
      </div>

      <ServiceAiHunter
        serviceTarget={serviceTarget}
        onServiceTargetChange={setServiceTarget}
        discoveryCount={discoveryCount}
        onDiscoveryCountChange={setDiscoveryCount}
        serviceQuery={serviceQuery}
        onServiceQueryChange={setServiceQuery}
        discoveringServices={isDiscovering}
        onDiscovery={handleDiscovery}
        serviceResults={serviceResults}
        onImport={handleImport}
        onRemoveResult={(name) => setServiceResults((prev) => prev.filter((x) => x.name !== name))}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SERVICE_BOXES.map((box) => (
          <div
            key={box.id}
            className="bg-slate-950 rounded-2xl border border-slate-800 flex flex-col h-[350px] overflow-hidden"
          >
            <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <box.icon className={`w-4 h-4 ${box.color}`} />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide truncate max-w-[120px]">
                  {box.label}
                </span>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleAddService(box.id)}
                  disabled={isSaving}
                  className="min-h-11 px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-full text-white shadow-md text-[10px] font-bold uppercase flex items-center gap-1 disabled:opacity-50"
                >
                  <Plus className="w-3 h-3" /> Nuovo
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {getServicesForBox(box.id).map((svc, idx) => {
                const currentOrder = typeof svc.orderIndex === 'number' && Number.isFinite(svc.orderIndex) ? svc.orderIndex : idx + 1;
                const draftVal =
                  orderDrafts[svc.id] !== undefined
                    ? orderDrafts[svc.id]
                    : String(currentOrder);

                return (
                  <div
                    key={svc.id}
                    className="bg-slate-900 p-3 rounded-lg border border-slate-800 group relative hover:border-slate-700 transition-colors flex gap-2 items-start"
                  >
                    <div className="w-8 shrink-0">
                      <input
                        type="number"
                        min="1"
                        value={draftVal}
                        onChange={(e) => handleOrderChange(svc.id, e.target.value)}
                        onBlur={() => handleOrderCommit(svc.id)}
                        disabled={isSaving}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          }
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded text-center text-white text-xs font-bold py-1 min-h-11 disabled:opacity-50"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-end gap-2 mb-2 border-b border-slate-800 pb-1">
                        <button
                          type="button"
                          aria-label={`Salva ${svc.name || 'Nuovo'}`}
                          onClick={() => handleSave(svc.id, svc)}
                          disabled={isSaving}
                          className="text-emerald-500 hover:text-white min-h-11 min-w-11 inline-flex items-center justify-center p-1 hover:bg-slate-800 rounded disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Elimina ${svc.name || 'Nuovo'}`}
                          onClick={() => handleDeleteClick(svc.id, svc.name)}
                          disabled={isSaving}
                          className="text-slate-600 hover:text-red-500 min-h-11 min-w-11 inline-flex items-center justify-center p-1 hover:bg-slate-800 rounded disabled:opacity-50"
                        >
                          <MinusCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="mb-2">
                        <select
                          value={svc.type}
                          onChange={(e) => handleUpdate(svc.id, 'type', e.target.value)}
                          disabled={isSaving}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] text-slate-300 focus:outline-none focus:border-blue-500 uppercase font-bold text-left min-h-11 disabled:opacity-50"
                        >
                          {Object.entries(SERVICE_TYPE_MAPPING).map(([key, group]) => (
                            <optgroup key={key} label={group.label}>
                              {group.types.map((t) => (
                                <option key={t.val} value={t.val}>
                                  {t.label}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>
                      <input
                        value={svc.name}
                        onChange={(e) => handleUpdate(svc.id, 'name', e.target.value)}
                        disabled={isSaving}
                        className="bg-transparent font-bold text-white w-full outline-none text-xs border-b border-transparent focus:border-blue-500 pb-0.5 mb-1 text-left disabled:opacity-50"
                        placeholder="Nome..."
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
