import { CheckCircle2, Edit3, Layout, Loader2, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_ADMIN_MODAL_NESTED, Z_OVERLAY } from '@/constants/zIndex';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { ADMIN_CATEGORY_OPTIONS } from '@/domain/packing/packingCategories';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import {
  deleteTemplateSpecificItemAsync,
  fetchAllTemplateSpecificItemsAsync,
  upsertTemplateSpecificItemAsync,
} from '@/services/suitcase/packingCatalogService';
import { fetchMasterTemplatesAsync } from '@/services/suitcase/suitcaseEditorialService';
import type { PackingTemplateItem } from '@/types/packingCatalog';
import type { Suitcase } from '@/types/suitcase';

interface EditState {
  id?: string;
  template_id: string;
  category: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export const TemplateSpecificItemsTab: React.FC = () => {
  const [masters, setMasters] = useState<Suitcase[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [items, setItems] = useState<PackingTemplateItem[]>([]);
  const [mastersLoading, setMastersLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PackingTemplateItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const isDeletingRef = useRef(false);
  const itemsRequestGenRef = useRef(0);

  const isMobile = useMobileDetect();
  const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
  const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
  const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
  const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
  const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);

  const closeEditModal = useCallback(() => {
    if (isSavingRef.current) return;
    setEditing(null);
  }, []);
  useGlobalModalEscape(editing !== null && !isSaving, closeEditModal);

  // Masters: load once (or when remounting). Selecting the first id does not re-fetch masters.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setMastersLoading(true);
      try {
        const mRes = await fetchMasterTemplatesAsync();
        if (cancelled) return;
        setMasters(mRes);
        setSelectedId((prev) => prev ?? mRes[0]?.id ?? null);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setMastersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Items: load only for the current selected template; ignore stale responses.
  useEffect(() => {
    if (!selectedId) {
      setItems([]);
      setItemsLoading(false);
      return;
    }

    const gen = ++itemsRequestGenRef.current;
    let cancelled = false;

    void (async () => {
      setItemsLoading(true);
      try {
        const rows = await fetchAllTemplateSpecificItemsAsync(selectedId);
        if (cancelled || gen !== itemsRequestGenRef.current) return;
        setItems(rows);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled && gen === itemsRequestGenRef.current) {
          setItemsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const reloadSelectedItems = useCallback(async () => {
    if (!selectedId) return;
    const gen = ++itemsRequestGenRef.current;
    setItemsLoading(true);
    try {
      const rows = await fetchAllTemplateSpecificItemsAsync(selectedId);
      if (gen !== itemsRequestGenRef.current) return;
      setItems(rows);
    } catch (e) {
      console.error(e);
    } finally {
      if (gen === itemsRequestGenRef.current) setItemsLoading(false);
    }
  }, [selectedId]);

  const handleSave = async () => {
    if (
      !editing?.name?.trim() ||
      !editing.category ||
      !editing.template_id ||
      isSavingRef.current
    ) {
      return;
    }
    isSavingRef.current = true;
    setIsSaving(true);
    try {
      await upsertTemplateSpecificItemAsync({ ...editing, name: editing.name.trim() });
      setEditing(null);
      await reloadSelectedItems();
    } catch (e) {
      console.error(e);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeletingRef.current) return;
    isDeletingRef.current = true;
    setIsDeleting(true);
    try {
      await deleteTemplateSpecificItemAsync(deleteTarget.id);
      setDeleteTarget(null);
      await reloadSelectedItems();
    } catch (e) {
      console.error(e);
    } finally {
      isDeletingRef.current = false;
      setIsDeleting(false);
    }
  };

  if (mastersLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const current = masters.find((m) => m.id === selectedId);

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 lg:gap-6 animate-in fade-in duration-300 min-h-0">
      <aside className="w-full lg:w-64 shrink-0 space-y-1 min-w-0">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-3 px-2">
          Template TD
        </h2>
        {masters.map((m) => (
          <button
            type="button"
            key={m.id}
            onClick={() => setSelectedId(m.id)}
            className={`w-full min-h-[44px] px-3 py-2 rounded-xl text-left text-sm font-bold truncate ${selectedId === m.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/40'}`}
          >
            {m.icon} {m.title}
          </button>
        ))}
      </aside>

      <main className="flex-1 min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-black text-white flex items-center gap-2 break-words">
              <Layout className="w-5 h-5 shrink-0 text-indigo-400" /> Specifici:{' '}
              {current?.title ?? '—'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Solo item aggiuntivi del template (oltre allo standard core).
            </p>
          </div>
          {selectedId && (
            <button
              type="button"
              onClick={() =>
                setEditing({
                  template_id: selectedId,
                  category: 'Extra',
                  name: '',
                  sort_order: 0,
                  is_active: true,
                })
              }
              className="flex items-center gap-2 min-h-[44px] px-4 py-2 bg-indigo-600 text-white text-xs font-black rounded-xl"
            >
              <Plus className="w-4 h-4" /> Aggiungi
            </button>
          )}
        </div>

        <div className="grid gap-2 max-h-[55vh] overflow-y-auto pr-2">
          {itemsLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
          ) : null}
          {!itemsLoading &&
            items.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between group"
              >
                <div className="min-w-0">
                  <span className="text-sm font-bold text-slate-200 break-words">{item.name}</span>
                  <span className="text-[10px] text-slate-500 uppercase font-black block mt-0.5">
                    {item.category}
                  </span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditing({ ...item, template_id: item.template_id })}
                    className="p-2 min-h-[44px] min-w-[44px] rounded-lg hover:bg-white/5 text-slate-500 flex items-center justify-center"
                    aria-label={`Modifica ${item.name}`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isDeletingRef.current) setDeleteTarget(item);
                    }}
                    className="p-2 min-h-[44px] min-w-[44px] rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 flex items-center justify-center"
                    aria-label={`Elimina ${item.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </main>

      <DeleteConfirmationModal
        isOpen={deleteTarget !== null}
        onClose={() => {
          if (!isDeletingRef.current) setDeleteTarget(null);
        }}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        title="Eliminare item specifico?"
        message={
          deleteTarget ? `Stai per eliminare "${deleteTarget.name}" da questo template.` : ''
        }
        isDeleting={isDeleting}
        zIndex={Z_ADMIN_MODAL_NESTED}
      />

      {editing &&
        createPortal(
          <div
            className={`td-modal-overlay ${overlayShell}`}
            style={{ zIndex: Z_OVERLAY }}
            role="presentation"
          >
            <button
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              className="absolute inset-0 h-full w-full cursor-default border-0 bg-transparent p-0"
              onClick={closeEditModal}
            />
            <div
              className={`relative ${containerShell} max-w-md outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900`}
              style={{ zIndex: Z_ADMIN_MODAL_NESTED }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="template-specific-edit-title"
              aria-describedby="template-specific-edit-desc"
            >
              <CloseButton
                onClose={closeEditModal}
                variant="primary"
                position="absolute"
                withEscape={false}
                disabled={isSaving}
                className={`${closeOffsetShell} z-local-overlay`}
              />
              <div className={`${bodyShell} min-h-0 space-y-6`}>
                <h3 id="template-specific-edit-title" className={modalTitleShell}>
                  {editing.id ? 'Modifica' : 'Nuovo'} Item Specifico
                </h3>
                <p id="template-specific-edit-desc" className="sr-only">
                  Compila i campi dell&apos;item specifico e conferma per salvare.
                </p>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="template-specific-item-name"
                      className="text-[10px] font-bold text-slate-500 uppercase tracking-widest"
                    >
                      Nome
                    </label>
                    <input
                      id="template-specific-item-name"
                      type="text"
                      placeholder="Nome"
                      value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                      className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="template-specific-item-category"
                      className="text-[10px] font-bold text-slate-500 uppercase tracking-widest"
                    >
                      Categoria
                    </label>
                    <select
                      id="template-specific-item-category"
                      value={editing.category}
                      onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                      className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white"
                    >
                      {ADMIN_CATEGORY_OPTIONS.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="template-specific-item-order"
                      className="text-[10px] font-bold text-slate-500 uppercase tracking-widest"
                    >
                      Ordine
                    </label>
                    <input
                      id="template-specific-item-order"
                      type="number"
                      placeholder="Ordine"
                      value={editing.sort_order}
                      onChange={(e) =>
                        setEditing({ ...editing, sort_order: Number(e.target.value) })
                      }
                      className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={
                    isSaving || !editing.name.trim() || !editing.category || !editing.template_id
                  }
                  className="w-full min-h-[44px] py-4 bg-indigo-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-4 h-4" aria-hidden />{' '}
                  {isSaving ? 'Salvataggio…' : 'Conferma'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
