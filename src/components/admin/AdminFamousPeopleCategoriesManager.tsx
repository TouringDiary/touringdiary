import {
  Download,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Tags,
  ToggleLeft,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { slugifyFamousCategoryLabel } from '@/domain/city/famousPersonCategories';
import {
  countSpecificCategoryUsage,
  createFamousPersonMaster,
  createFamousPersonSpecific,
  deactivateFamousPersonMaster,
  deactivateFamousPersonSpecific,
  type FamousPersonMasterDto,
  type FamousPersonSpecificDto,
  type FamousPersonTaxonomyTree,
  loadFamousPersonTaxonomy,
  restoreFamousPersonMaster,
  restoreFamousPersonSpecific,
  updateFamousPersonMaster,
  updateFamousPersonSpecific,
} from '@/services/city/famousPersonCategoryService';
import { AdminPageHeader } from './common/AdminPageHeader';

/** Missing key / undefined = still loading (show "…"); number = real count; 'error' = fetch failed (show "—", never 0). */
type UsageMap = Record<string, number | 'error'>;

/** Strict non-negative integer; rejects "12abc". Invalid or non-finite or exceeding MAX_SAFE_INTEGER → 0. */
function parseStrictOrderIndex(raw: string): number {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return 0;
  if (trimmed.length > 16) return 0; // Prevent numbers larger than MAX_SAFE_INTEGER
  const parsed = Number(trimmed);
  if (
    !Number.isInteger(parsed) ||
    !Number.isFinite(parsed) ||
    parsed < 0 ||
    parsed > Number.MAX_SAFE_INTEGER
  ) {
    return 0;
  }
  return parsed;
}

function downloadTaxonomyJson(tree: FamousPersonTaxonomyTree): void {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    masters: tree.masters.map((m) => ({
      id: m.id,
      slug: m.slug,
      label: m.label,
      orderIndex: m.orderIndex,
      isActive: m.isActive,
      specifics: tree.specifics
        .filter((s) => s.masterId === m.id)
        .map((s) => ({
          id: s.id,
          slug: s.slug,
          label: s.label,
          orderIndex: s.orderIndex,
          isActive: s.isActive,
        })),
    })),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `famous-person-categories-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export type AdminFamousPeopleCategoriesManagerProps = {
  /** When true (hub tab), skip AdminPageHeader — parent owns page chrome. */
  embedded?: boolean;
};

export const AdminFamousPeopleCategoriesManager = ({
  embedded = false,
}: AdminFamousPeopleCategoriesManagerProps = {}) => {
  const [tree, setTree] = useState<FamousPersonTaxonomyTree>({ masters: [], specifics: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [selectedMasterId, setSelectedMasterId] = useState<string | null>(null);
  const [usageBySpecificId, setUsageBySpecificId] = useState<UsageMap>({});

  const [masterDraftLabel, setMasterDraftLabel] = useState('');
  const [masterDraftOrder, setMasterDraftOrder] = useState('0');
  const [specificDraftLabel, setSpecificDraftLabel] = useState('');
  const [specificDraftOrder, setSpecificDraftOrder] = useState('0');

  const [editingMasterId, setEditingMasterId] = useState<string | null>(null);
  const [editMasterLabel, setEditMasterLabel] = useState('');
  const [editMasterOrder, setEditMasterOrder] = useState('0');

  const [editingSpecificId, setEditingSpecificId] = useState<string | null>(null);
  const [editSpecificLabel, setEditSpecificLabel] = useState('');
  const [editSpecificOrder, setEditSpecificOrder] = useState('0');

  const loadTaxonomy = useCallback(async () => {
    setIsLoading(true);
    try {
      const next = await loadFamousPersonTaxonomy({ activeOnly: false });
      setTree(next);
      setSelectedMasterId((prev) => {
        if (prev && next.masters.some((m) => m.id === prev)) return prev;
        return next.masters[0]?.id ?? null;
      });
    } catch (e) {
      console.error('[AdminFamousPeopleCategoriesManager] load failed', e);
      alert('Errore caricamento categorie personaggi.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTaxonomy();
  }, [loadTaxonomy]);

  // Reset Specific editing and draft states when selecting a different Master category
  useEffect(() => {
    if (selectedMasterId !== undefined) {
      setEditingSpecificId(null);
      setEditSpecificLabel('');
      setEditSpecificOrder('0');
      setSpecificDraftLabel('');
      setSpecificDraftOrder('0');
    }
  }, [selectedMasterId]);

  const selectedMaster = useMemo(
    () => tree.masters.find((m) => m.id === selectedMasterId) ?? null,
    [tree.masters, selectedMasterId],
  );

  const specificsForMaster = useMemo(
    () =>
      tree.specifics
        .filter((s) => s.masterId === selectedMasterId)
        .slice()
        .sort((a, b) => a.orderIndex - b.orderIndex || a.slug.localeCompare(b.slug)),
    [tree.specifics, selectedMasterId],
  );

  useEffect(() => {
    if (!selectedMasterId || specificsForMaster.length === 0) {
      setUsageBySpecificId({});
      return;
    }
    let cancelled = false;
    void (async () => {
      // N+1: only countSpecificCategoryUsage(id) exists — no batch/aggregate usage RPC yet.
      const entries = await Promise.all(
        specificsForMaster.map(async (s) => {
          try {
            const count = await countSpecificCategoryUsage(s.id);
            return [s.id, count] as const;
          } catch {
            return [s.id, 'error'] as const;
          }
        }),
      );
      if (cancelled) return;
      const map: UsageMap = {};
      for (const [id, count] of entries) map[id] = count;
      setUsageBySpecificId(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedMasterId, specificsForMaster]);

  const beginEditMaster = (master: FamousPersonMasterDto) => {
    setEditingMasterId(master.id);
    setEditMasterLabel(master.label);
    setEditMasterOrder(String(master.orderIndex));
  };

  const beginEditSpecific = (specific: FamousPersonSpecificDto) => {
    setEditingSpecificId(specific.id);
    setEditSpecificLabel(specific.label);
    setEditSpecificOrder(String(specific.orderIndex));
  };

  const handleCreateMaster = async () => {
    const label = masterDraftLabel.trim();
    if (!label) {
      alert('Inserisci una label per la categoria Master.');
      return;
    }
    const slug = slugifyFamousCategoryLabel(label);
    if (!slug) {
      alert('Impossibile generare uno slug dalla label.');
      return;
    }
    const orderIndex = parseStrictOrderIndex(masterDraftOrder);
    setIsActing(true);
    try {
      await createFamousPersonMaster({
        slug,
        label,
        orderIndex,
      });
      setMasterDraftLabel('');
      setMasterDraftOrder('0');
      await loadTaxonomy();
    } catch (e) {
      console.error(e);
      alert('Errore creazione Master.');
    } finally {
      setIsActing(false);
    }
  };

  const handleSaveMaster = async () => {
    if (!editingMasterId) return;
    const label = editMasterLabel.trim();
    if (!label) {
      alert('Label Master obbligatoria.');
      return;
    }
    const orderIndex = parseStrictOrderIndex(editMasterOrder);
    setIsActing(true);
    try {
      await updateFamousPersonMaster(editingMasterId, {
        label,
        orderIndex,
      });
      setEditingMasterId(null);
      await loadTaxonomy();
    } catch (e) {
      console.error(e);
      alert('Errore aggiornamento Master.');
    } finally {
      setIsActing(false);
    }
  };

  const handleToggleMaster = async (master: FamousPersonMasterDto) => {
    setIsActing(true);
    try {
      if (master.isActive && !master.deletedAt) {
        await deactivateFamousPersonMaster(master.id);
      } else {
        await restoreFamousPersonMaster(master.id);
      }
      await loadTaxonomy();
    } catch (e) {
      console.error(e);
      alert('Errore cambio stato Master.');
    } finally {
      setIsActing(false);
    }
  };

  const handleCreateSpecific = async () => {
    if (!selectedMasterId) return;
    const label = specificDraftLabel.trim();
    if (!label) {
      alert('Inserisci una label per la Specific.');
      return;
    }
    const slug = slugifyFamousCategoryLabel(label);
    if (!slug) {
      alert('Impossibile generare uno slug dalla label.');
      return;
    }
    const orderIndex = parseStrictOrderIndex(specificDraftOrder);
    setIsActing(true);
    try {
      await createFamousPersonSpecific({
        masterId: selectedMasterId,
        slug,
        label,
        orderIndex,
      });
      setSpecificDraftLabel('');
      setSpecificDraftOrder('0');
      await loadTaxonomy();
    } catch (e) {
      console.error(e);
      alert('Errore creazione Specific.');
    } finally {
      setIsActing(false);
    }
  };

  const handleSaveSpecific = async () => {
    if (!editingSpecificId) return;
    const label = editSpecificLabel.trim();
    if (!label) {
      alert('Label Specific obbligatoria.');
      return;
    }
    const orderIndex = parseStrictOrderIndex(editSpecificOrder);
    setIsActing(true);
    try {
      await updateFamousPersonSpecific(editingSpecificId, {
        label,
        orderIndex,
      });
      setEditingSpecificId(null);
      await loadTaxonomy();
    } catch (e) {
      console.error(e);
      alert('Errore aggiornamento Specific.');
    } finally {
      setIsActing(false);
    }
  };

  const handleToggleSpecific = async (specific: FamousPersonSpecificDto) => {
    setIsActing(true);
    try {
      if (specific.isActive && !specific.deletedAt) {
        await deactivateFamousPersonSpecific(specific.id);
      } else {
        await restoreFamousPersonSpecific(specific.id);
      }
      await loadTaxonomy();
    } catch (e) {
      console.error(e);
      alert('Errore cambio stato Specific.');
    } finally {
      setIsActing(false);
    }
  };

  const taxonomyActions = (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => void loadTaxonomy()}
        disabled={isLoading || isActing}
        className="inline-flex items-center justify-center gap-2 min-h-11 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase border border-slate-700 disabled:opacity-50"
        aria-label="Ricarica tassonomia"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
        ) : (
          <RefreshCw className="w-4 h-4" aria-hidden />
        )}
        Ricarica
      </button>
      <button
        type="button"
        onClick={() => downloadTaxonomyJson(tree)}
        disabled={isLoading || tree.masters.length === 0}
        className="inline-flex items-center justify-center gap-2 min-h-11 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase border border-indigo-500 disabled:opacity-50"
        aria-label="Esporta JSON standard categorie"
      >
        <Download className="w-4 h-4" aria-hidden />
        Esporta JSON
      </button>
    </div>
  );

  return (
    <div
      className={`flex flex-col h-full space-y-4 relative ${embedded ? '' : 'animate-in fade-in'}`}
    >
      {embedded ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Tags className="w-4 h-4 text-indigo-400 shrink-0" aria-hidden />
            <h3 className="text-sm font-bold text-white truncate">Tassonomia Master → Specific</h3>
          </div>
          {taxonomyActions}
        </div>
      ) : (
        <AdminPageHeader
          icon={Tags}
          accent="indigo"
          title="Categorie Personaggi"
          subtitle="Tassonomia Master → Specific (soft-delete, slug immutabile)"
          actions={taxonomyActions}
        />
      )}

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" aria-hidden />
          <span className="text-xs font-bold uppercase tracking-widest">Caricamento…</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0 flex-1">
          {/* MASTERS */}
          <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col min-h-0">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
              Master ({tree.masters.length})
            </h3>

            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <input
                value={masterDraftLabel}
                onChange={(e) => setMasterDraftLabel(e.target.value)}
                placeholder="Nuova Master (label)"
                aria-label="Label nuova categoria Master"
                className="flex-1 min-h-11 bg-slate-900 border border-slate-700 rounded-lg px-3 text-sm text-white outline-none focus:border-indigo-500"
              />
              <input
                type="number"
                value={masterDraftOrder}
                onChange={(e) => setMasterDraftOrder(e.target.value)}
                aria-label="Ordine nuova Master"
                className="w-20 min-h-11 bg-slate-900 border border-slate-700 rounded-lg px-2 text-sm text-white text-center outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => void handleCreateMaster()}
                disabled={isActing}
                className="inline-flex items-center justify-center gap-1.5 min-h-11 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase disabled:opacity-50"
                aria-label="Crea categoria Master"
              >
                <Plus className="w-4 h-4" aria-hidden />
                Crea
              </button>
            </div>

            <ul className="space-y-2 overflow-y-auto custom-scrollbar flex-1 min-h-0">
              {tree.masters.map((master) => {
                const inactive = !master.isActive || master.deletedAt != null;
                const isSelected = master.id === selectedMasterId;
                const isEditing = editingMasterId === master.id;
                return (
                  <li
                    key={master.id}
                    className={`rounded-xl border p-3 transition-colors ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/30'
                        : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <input
                          value={editMasterLabel}
                          onChange={(e) => setEditMasterLabel(e.target.value)}
                          aria-label={`Modifica label Master ${master.slug}`}
                          className="min-h-11 bg-slate-950 border border-slate-700 rounded-lg px-3 text-sm text-white outline-none focus:border-indigo-500"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editMasterOrder}
                            onChange={(e) => setEditMasterOrder(e.target.value)}
                            aria-label={`Ordine Master ${master.slug}`}
                            className="w-20 min-h-11 bg-slate-950 border border-slate-700 rounded-lg px-2 text-sm text-white text-center outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => void handleSaveMaster()}
                            disabled={isActing}
                            className="inline-flex items-center gap-1 min-h-11 px-3 rounded-lg bg-emerald-600 text-white text-[10px] font-bold uppercase disabled:opacity-50"
                            aria-label={`Salva Master ${master.slug}`}
                          >
                            <Save className="w-3.5 h-3.5" aria-hidden />
                            Salva
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingMasterId(null)}
                            className="min-h-11 px-3 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-bold uppercase"
                            aria-label="Annulla modifica Master"
                          >
                            Annulla
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono">slug: {master.slug}</p>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedMasterId(master.id)}
                          className="flex-1 text-left min-w-0 bg-transparent border-0 p-0"
                          aria-pressed={isSelected}
                          aria-label={`Seleziona Master ${master.label}`}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-sm font-bold truncate ${inactive ? 'text-slate-500 line-through' : 'text-white'}`}
                            >
                              {master.label}
                            </span>
                            {inactive && (
                              <span className="text-[9px] uppercase font-black text-amber-400 bg-amber-900/20 border border-amber-500/30 px-1.5 py-0.5 rounded">
                                Disattiva
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {master.slug} · ordine {master.orderIndex}
                          </p>
                        </button>
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => beginEditMaster(master)}
                            className="min-h-11 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold uppercase text-slate-200"
                            aria-label={`Modifica Master ${master.label}`}
                          >
                            Modifica
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleToggleMaster(master)}
                            disabled={isActing}
                            className={`inline-flex items-center justify-center gap-1 min-h-11 px-2 rounded-lg text-[10px] font-bold uppercase disabled:opacity-50 ${
                              inactive
                                ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-900/30 text-amber-300 border border-amber-500/30'
                            }`}
                            aria-label={
                              inactive
                                ? `Ripristina Master ${master.label}`
                                : `Disattiva Master ${master.label}`
                            }
                          >
                            {inactive ? (
                              <RotateCcw className="w-3.5 h-3.5" aria-hidden />
                            ) : (
                              <ToggleLeft className="w-3.5 h-3.5" aria-hidden />
                            )}
                            {inactive ? 'Ripristina' : 'Disattiva'}
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          {/* SPECIFICS */}
          <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col min-h-0">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
              Specific
              {selectedMaster ? ` · ${selectedMaster.label}` : ''} ({specificsForMaster.length})
            </h3>

            {!selectedMaster ? (
              <p className="text-sm text-slate-500 italic">Seleziona una Master a sinistra.</p>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <input
                    value={specificDraftLabel}
                    onChange={(e) => setSpecificDraftLabel(e.target.value)}
                    placeholder="Nuova Specific (label)"
                    aria-label="Label nuova categoria Specific"
                    className="flex-1 min-h-11 bg-slate-900 border border-slate-700 rounded-lg px-3 text-sm text-white outline-none focus:border-indigo-500"
                  />
                  <input
                    type="number"
                    value={specificDraftOrder}
                    onChange={(e) => setSpecificDraftOrder(e.target.value)}
                    aria-label="Ordine nuova Specific"
                    className="w-20 min-h-11 bg-slate-900 border border-slate-700 rounded-lg px-2 text-sm text-white text-center outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => void handleCreateSpecific()}
                    disabled={isActing}
                    className="inline-flex items-center justify-center gap-1.5 min-h-11 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase disabled:opacity-50"
                    aria-label="Crea categoria Specific"
                  >
                    <Plus className="w-4 h-4" aria-hidden />
                    Crea
                  </button>
                </div>

                <ul className="space-y-2 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                  {specificsForMaster.map((specific) => {
                    const inactive = !specific.isActive || specific.deletedAt != null;
                    const isEditing = editingSpecificId === specific.id;
                    const usage = usageBySpecificId[specific.id];
                    return (
                      <li
                        key={specific.id}
                        className="rounded-xl border border-slate-800 bg-slate-900/40 p-3"
                      >
                        {isEditing ? (
                          <div className="flex flex-col gap-2">
                            <input
                              value={editSpecificLabel}
                              onChange={(e) => setEditSpecificLabel(e.target.value)}
                              aria-label={`Modifica label Specific ${specific.slug}`}
                              className="min-h-11 bg-slate-950 border border-slate-700 rounded-lg px-3 text-sm text-white outline-none focus:border-indigo-500"
                            />
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={editSpecificOrder}
                                onChange={(e) => setEditSpecificOrder(e.target.value)}
                                aria-label={`Ordine Specific ${specific.slug}`}
                                className="w-20 min-h-11 bg-slate-950 border border-slate-700 rounded-lg px-2 text-sm text-white text-center outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => void handleSaveSpecific()}
                                disabled={isActing}
                                className="inline-flex items-center gap-1 min-h-11 px-3 rounded-lg bg-emerald-600 text-white text-[10px] font-bold uppercase disabled:opacity-50"
                                aria-label={`Salva Specific ${specific.slug}`}
                              >
                                <Save className="w-3.5 h-3.5" aria-hidden />
                                Salva
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingSpecificId(null)}
                                className="min-h-11 px-3 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-bold uppercase"
                                aria-label="Annulla modifica Specific"
                              >
                                Annulla
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono">
                              slug: {specific.slug}
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-sm font-bold truncate ${inactive ? 'text-slate-500 line-through' : 'text-white'}`}
                                >
                                  {specific.label}
                                </span>
                                {inactive && (
                                  <span className="text-[9px] uppercase font-black text-amber-400 bg-amber-900/20 border border-amber-500/30 px-1.5 py-0.5 rounded">
                                    Disattiva
                                  </span>
                                )}
                                <span className="text-[9px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                  {usage === undefined
                                    ? 'usi: …'
                                    : usage === 'error'
                                      ? 'usi: n/d'
                                      : `usi: ${usage}`}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                {specific.slug} · ordine {specific.orderIndex}
                              </p>
                            </div>
                            <div className="flex flex-col gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => beginEditSpecific(specific)}
                                className="min-h-11 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold uppercase text-slate-200"
                                aria-label={`Modifica Specific ${specific.label}`}
                              >
                                Modifica
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleToggleSpecific(specific)}
                                disabled={isActing}
                                className={`inline-flex items-center justify-center gap-1 min-h-11 px-2 rounded-lg text-[10px] font-bold uppercase disabled:opacity-50 ${
                                  inactive
                                    ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-amber-900/30 text-amber-300 border border-amber-500/30'
                                }`}
                                aria-label={
                                  inactive
                                    ? `Ripristina Specific ${specific.label}`
                                    : `Disattiva Specific ${specific.label}`
                                }
                              >
                                {inactive ? (
                                  <RotateCcw className="w-3.5 h-3.5" aria-hidden />
                                ) : (
                                  <ToggleLeft className="w-3.5 h-3.5" aria-hidden />
                                )}
                                {inactive ? 'Ripristina' : 'Disattiva'}
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                  {specificsForMaster.length === 0 && (
                    <li className="text-sm text-slate-500 italic py-4">
                      Nessuna Specific per questa Master.
                    </li>
                  )}
                </ul>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
