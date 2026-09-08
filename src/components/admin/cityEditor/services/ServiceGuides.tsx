import { Eye, Loader2, MinusCircle, Plus, Save, UserCheck, Wand2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useCityEditor } from '@/context/CityEditorContext';
import { type SuggestedCityItem, suggestCityItems } from '../../../../services/ai';
import type { SaveCityGuideInput } from '../../../../services/city/entitiesService';
import { deleteCityGuide, getCityGuides, saveCityGuide } from '../../../../services/cityService';
import type { CityGuide } from '../../../../types/index';
import { DeleteConfirmationModal } from '../../../common/DeleteConfirmationModal';

type EditableGuideField = 'name' | 'phone' | 'email';

const readOptionalString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;

const readStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const strings = value.filter((v): v is string => typeof v === 'string');
  return strings.length > 0 ? strings : undefined;
};

/** Maps AI suggestion → SaveCityGuideInput using only real present fields. */
const mapSuggestedToGuideInput = (item: SuggestedCityItem): SaveCityGuideInput | null => {
  const name = typeof item.name === 'string' ? item.name.trim() : '';
  if (!name) return null;

  return {
    name,
    isOfficial: typeof item.isOfficial === 'boolean' ? item.isOfficial : true,
    languages: readStringArray(item.languages) ?? ['IT'],
    specialties: readStringArray(item.specialties) ?? [],
    phone: readOptionalString(item.phone),
    email: readOptionalString(item.email),
    website: readOptionalString(item.website),
    rating: typeof item.rating === 'number' ? item.rating : undefined,
  };
};

export const ServiceGuides = () => {
  const { city, triggerPreview, reloadCurrentCity } = useCityEditor();

  const [guidesList, setGuidesList] = useState<CityGuide[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryResults, setDiscoveryResults] = useState<SaveCityGuideInput[]>([]);
  const [aiQuery, setAiQuery] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Draft degli indici di ordinamento in fase di editing
  const [orderDrafts, setOrderDrafts] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    if (!city?.id) return;
    setIsLoading(true);
    try {
      const data = await getCityGuides(city.id);
      setGuidesList([...data].sort((a, b) => {
        const orderA = typeof a.orderIndex === 'number' && Number.isFinite(a.orderIndex) ? a.orderIndex : Number.MAX_SAFE_INTEGER;
        const orderB = typeof b.orderIndex === 'number' && Number.isFinite(b.orderIndex) ? b.orderIndex : Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [city?.id]);

  useEffect(() => {
    if (!city?.id) return;
    void loadData();
  }, [city?.id, loadData]);

  const handleAddGuide = async () => {
    if (!city?.id || isSaving) return;
    setIsSaving(true);
    const nextOrderIndex =
      guidesList.reduce((max, g) => {
        const val = g.orderIndex;
        return typeof val === 'number' && Number.isFinite(val) ? Math.max(max, val) : max;
      }, 0) + 1;

    const temp: SaveCityGuideInput = {
      name: 'Nuova Guida',
      isOfficial: true,
      languages: ['IT'],
      specialties: [],
      orderIndex: nextOrderIndex,
    };
    try {
      await saveCityGuide(city.id, temp);
      await loadData();
      await reloadCurrentCity();
    } catch (e) {
      console.error(e);
      alert('Errore durante la creazione della guida.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGuide = async (guide: SaveCityGuideInput) => {
    if (!city?.id || isSaving) return;
    setIsSaving(true);
    try {
      await saveCityGuide(city.id, guide);
      await loadData();
    } catch (e) {
      console.error(e);
      alert('Errore durante il salvataggio della guida.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateGuide = (id: string, field: EditableGuideField, val: string) => {
    setGuidesList((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: val } : p)));
  };

  const confirmDelete = async () => {
    if (!deleteTarget || isSaving) return;
    setIsSaving(true);
    try {
      await deleteCityGuide(deleteTarget.id);
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

    const backupList = [...guidesList];

    const list = [...guidesList];
    const itemIndex = list.findIndex((i) => i.id === id);
    if (itemIndex === -1) {
      setIsSaving(false);
      return;
    }

    const [item] = list.splice(itemIndex, 1);
    const insertIndex = Math.min(Math.max(0, newRank - 1), list.length);
    list.splice(insertIndex, 0, item);

    const updated = list.map((p, idx) => ({ ...p, orderIndex: idx + 1 }));
    setGuidesList(updated);

    try {
      for (const p of updated) {
        await saveCityGuide(city.id, p);
      }
      await loadData();
      await reloadCurrentCity();
    } catch (e) {
      console.error(e);
      alert('Errore durante il riordino. Ricarico lo stato attuale.');
      setGuidesList(backupList);
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
    try {
      const existingNames = guidesList.map((i) => i.name);
      const results = await suggestCityItems(city.name, 'guides', existingNames, aiQuery, 3);
      setDiscoveryResults(
        results
          .map(mapSuggestedToGuideInput)
          .filter((mapped): mapped is SaveCityGuideInput => mapped !== null),
      );
    } catch (e) {
      console.error(e);
      alert('Errore durante la ricerca AI.');
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleImport = async (item: SaveCityGuideInput) => {
    if (!city?.id || isSaving) return;
    setIsSaving(true);
    const nextOrderIndex =
      guidesList.reduce((max, g) => {
        const val = g.orderIndex;
        return typeof val === 'number' && Number.isFinite(val) ? Math.max(max, val) : max;
      }, 0) + 1;

    try {
      await saveCityGuide(city.id, { ...item, orderIndex: nextOrderIndex });
      setDiscoveryResults((prev) => prev.filter((x) => x.name !== item.name));
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
        title="Elimina Guida"
        message={`Eliminare "${deleteTarget?.name}"?`}
      />

      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-white flex items-center gap-2 text-sm md:text-base">
          <UserCheck className="w-5 h-5 text-emerald-500" /> Guide
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Anteprima guide"
            onClick={() => triggerPreview('guides', 'Guide Turistiche', guidesList)}
            className="min-h-11 min-w-11 inline-flex items-center justify-center p-1.5 bg-slate-800 hover:bg-emerald-900/30 rounded text-slate-400 hover:text-emerald-400 border border-slate-700"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Aggiungi guida"
            onClick={handleAddGuide}
            disabled={isSaving}
            className="min-h-11 min-w-11 inline-flex items-center justify-center p-1.5 bg-emerald-600 hover:bg-emerald-500 rounded text-white shadow-lg disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-emerald-900/10 border border-emerald-500/20 p-3 rounded-xl mb-4">
        <div className="flex gap-2 mb-2">
          <input
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            disabled={isSaving}
            placeholder="Cerca guide..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded text-xs px-2 py-1 text-white disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleDiscovery}
            disabled={isDiscovering || isSaving}
            className="bg-emerald-600 text-white px-3 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 min-h-11 disabled:opacity-50"
          >
            {isDiscovering ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Wand2 className="w-3 h-3" />
            )}{' '}
            AI
          </button>
        </div>
        {discoveryResults.length > 0 && (
          <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
            {discoveryResults.map((res) => (
              <div
                key={res.name}
                className="flex justify-between items-center bg-slate-900 p-2 rounded border border-slate-700"
              >
                <span className="text-xs text-white truncate max-w-[150px]">{res.name}</span>
                <button
                  type="button"
                  onClick={() => handleImport(res)}
                  disabled={isSaving}
                  className="text-[9px] bg-slate-800 hover:bg-emerald-600 text-white px-2 py-1 rounded min-h-11 disabled:opacity-50"
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
          guidesList.map((guide, idx) => {
            const currentOrder = typeof guide.orderIndex === 'number' && Number.isFinite(guide.orderIndex) ? guide.orderIndex : idx + 1;
            const draftVal =
              orderDrafts[guide.id] !== undefined
                ? orderDrafts[guide.id]
                : String(currentOrder);

            return (
              <div
                key={guide.id}
                className="bg-slate-900 p-3 md:p-4 rounded-xl border border-slate-800 text-sm space-y-2 relative group flex gap-2"
              >
                <div className="w-12 shrink-0">
                  <input
                    type="number"
                    min="1"
                    value={draftVal}
                    onChange={(e) => handleOrderChange(guide.id, e.target.value)}
                    onBlur={() => handleOrderCommit(guide.id)}
                    disabled={isSaving}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded text-center text-white text-sm font-bold py-1 min-h-11 disabled:opacity-50"
                  />
                </div>
                <div className="flex-1">
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      type="button"
                      aria-label={`Salva ${guide.name}`}
                      onClick={() => handleSaveGuide(guide)}
                      disabled={isSaving}
                      className="text-emerald-500 hover:text-white min-h-11 min-w-11 inline-flex items-center justify-center p-1 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Elimina ${guide.name}`}
                      onClick={() => setDeleteTarget({ id: guide.id, name: guide.name })}
                      disabled={isSaving}
                      className="text-slate-600 hover:text-red-500 min-h-11 min-w-11 inline-flex items-center justify-center p-1 disabled:opacity-50"
                    >
                      <MinusCircle className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    value={guide.name}
                    onChange={(e) => handleUpdateGuide(guide.id, 'name', e.target.value)}
                    disabled={isSaving}
                    className="bg-transparent font-bold text-white w-full outline-none border-b border-transparent focus:border-emerald-500 pb-1 pr-24 disabled:opacity-50"
                    placeholder="Nome Guida"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    <input
                      value={guide.phone || ''}
                      onChange={(e) => handleUpdateGuide(guide.id, 'phone', e.target.value)}
                      disabled={isSaving}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 w-full disabled:opacity-50"
                      placeholder="Telefono"
                    />
                    <input
                      value={guide.email || ''}
                      onChange={(e) => handleUpdateGuide(guide.id, 'email', e.target.value)}
                      disabled={isSaving}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 w-full disabled:opacity-50"
                      placeholder="Email"
                    />
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
