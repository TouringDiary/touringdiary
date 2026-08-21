import { CheckCircle2, Edit3, Loader2, Plus, Trash2 } from 'lucide-react';
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
  deleteStandardItemAsync,
  fetchAllStandardItemsAsync,
  upsertStandardItemAsync,
} from '@/services/suitcase/packingCatalogService';
import type { PackingStandardItem, PackingStandardItemTier } from '@/types/packingCatalog';

interface EditState {
  id?: string;
  category: string;
  name: string;
  sort_order: number;
  tier: PackingStandardItemTier;
  is_active: boolean;
}

const STANDARD_ITEM_TIERS: readonly PackingStandardItemTier[] = [
  'core',
  'additional',
  'additional_ai_only',
];

function parseStandardItemTier(value: string): PackingStandardItemTier | null {
  for (const tier of STANDARD_ITEM_TIERS) {
    if (tier === value) return tier;
  }
  return null;
}

export const StandardItemsTab: React.FC = () => {
  const [items, setItems] = useState<PackingStandardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PackingStandardItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const isDeletingRef = useRef(false);

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

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setItems(await fetchAllStandardItemsAsync());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    if (!editing?.name?.trim() || !editing.category || isSavingRef.current) return;
    isSavingRef.current = true;
    setIsSaving(true);
    try {
      await upsertStandardItemAsync({ ...editing, name: editing.name.trim() });
      setEditing(null);
      await load();
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
      await deleteStandardItemAsync(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      isDeletingRef.current = false;
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-black text-white">Standard Items</h2>
          <p className="text-xs text-slate-500 mt-1">
            Core valigia — DB-driven, condivisi da tutti i template.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            setEditing({
              category: 'Documenti',
              name: '',
              sort_order: 0,
              tier: 'core',
              is_active: true,
            })
          }
          className="flex items-center gap-2 min-h-[44px] px-4 py-2 bg-indigo-600 text-white text-xs font-black rounded-xl"
        >
          <Plus className="w-4 h-4" /> Aggiungi
        </button>
      </div>

      <div className="grid gap-2 max-h-[60vh] overflow-y-auto pr-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between group"
          >
            <div className="min-w-0">
              <span className="text-sm font-bold text-slate-200 break-words">{item.name}</span>
              <span className="text-[10px] text-slate-500 uppercase font-black block mt-0.5">
                {item.category} · {item.tier} · ordine {item.sort_order}
                {!item.is_active && ' · DISATTIVO'}
              </span>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setEditing({ ...item })}
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

      <DeleteConfirmationModal
        isOpen={deleteTarget !== null}
        onClose={() => {
          if (!isDeletingRef.current) setDeleteTarget(null);
        }}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        title="Eliminare standard item?"
        message={
          deleteTarget
            ? `Stai per eliminare "${deleteTarget.name}". L'operazione impatta tutti i template.`
            : ''
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
              aria-labelledby="standard-item-edit-title"
              aria-describedby="standard-item-edit-desc"
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
                <h3 id="standard-item-edit-title" className={modalTitleShell}>
                  {editing.id ? 'Modifica' : 'Nuovo'} Standard Item
                </h3>
                <p id="standard-item-edit-desc" className="sr-only">
                  Compila i campi dello standard item e conferma per salvare.
                </p>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="standard-item-name"
                      className="text-[10px] font-bold text-slate-500 uppercase tracking-widest"
                    >
                      Nome
                    </label>
                    <input
                      id="standard-item-name"
                      type="text"
                      placeholder="Nome"
                      value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                      className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="standard-item-category"
                      className="text-[10px] font-bold text-slate-500 uppercase tracking-widest"
                    >
                      Categoria
                    </label>
                    <select
                      id="standard-item-category"
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
                      htmlFor="standard-item-tier"
                      className="text-[10px] font-bold text-slate-500 uppercase tracking-widest"
                    >
                      Tier
                    </label>
                    <select
                      id="standard-item-tier"
                      value={editing.tier}
                      onChange={(e) => {
                        const next = parseStandardItemTier(e.target.value);
                        if (next) setEditing({ ...editing, tier: next });
                      }}
                      className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white"
                    >
                      <option value="core">core</option>
                      <option value="additional">additional</option>
                      <option value="additional_ai_only">additional_ai_only</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="standard-item-order"
                      className="text-[10px] font-bold text-slate-500 uppercase tracking-widest"
                    >
                      Ordine
                    </label>
                    <input
                      id="standard-item-order"
                      type="number"
                      placeholder="Ordine"
                      value={editing.sort_order}
                      onChange={(e) =>
                        setEditing({ ...editing, sort_order: Number(e.target.value) })
                      }
                      className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white"
                    />
                  </div>
                  <label
                    htmlFor="standard-item-active"
                    className="flex items-center gap-2 min-h-[44px] text-sm text-slate-300"
                  >
                    <input
                      id="standard-item-active"
                      type="checkbox"
                      checked={editing.is_active}
                      onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                    />
                    Attivo
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={isSaving || !editing.name || !editing.category}
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
