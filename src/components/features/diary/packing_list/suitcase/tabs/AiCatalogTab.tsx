import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Plus, Edit3, Trash2, CheckCircle2, Search } from 'lucide-react';
import { Z_ADMIN_MODAL_NESTED, Z_OVERLAY } from '@/constants/zIndex';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
import { ADMIN_CATEGORY_OPTIONS } from '@/domain/packing/packingCategories';
import {
  fetchAllAiCatalogAsync,
  upsertAiCatalogItemAsync,
  deleteAiCatalogItemAsync,
} from '@/services/suitcase/packingCatalogService';
import { PackingAiCatalogItem } from '@/types/packingCatalog';

interface EditState {
  id?: string;
  name: string;
  category: string;
  tags: string[];
  sort_order: number;
  is_active: boolean;
}

export const AiCatalogTab: React.FC = () => {
  const [items, setItems] = useState<PackingAiCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<PackingAiCatalogItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isMobile = useMobileDetect();
  const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
  const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
  const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
  const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
  const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);

  const closeEditModal = useCallback(() => setEditing(null), []);
  useGlobalModalEscape(editing !== null, closeEditModal);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setItems(await fetchAllAiCatalogAsync());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [items, search]);

  const handleSave = async () => {
    if (!editing?.name || !editing.category) return;
    try {
      await upsertAiCatalogItemAsync(editing);
      setEditing(null);
      await load();
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteAiCatalogItemAsync(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white">Catalogo AI</h2>
          <p className="text-xs text-slate-500 mt-1">{items.length} elementi · admin-driven · motore AI in MACROFASE C</p>
        </div>
        <button
          onClick={() => setEditing({ name: '', category: 'Extra', tags: [], sort_order: 0, is_active: true })}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-black rounded-xl"
        >
          <Plus className="w-4 h-4" /> Aggiungi
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Cerca nome, categoria, tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white"
        />
      </div>

      <div className="grid gap-2 max-h-[55vh] overflow-y-auto pr-2">
        {filtered.map((item) => (
          <div key={item.id} className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl flex items-center justify-between group">
            <div className="min-w-0">
              <span className="text-sm font-bold text-slate-200">{item.name}</span>
              <span className="text-[10px] text-slate-500 uppercase font-black block mt-0.5 truncate">
                {item.category} · [{item.tags.join(', ')}]
                {!item.is_active && ' · DISATTIVO'}
              </span>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button onClick={() => setEditing({ ...item, tags: [...item.tags] })} className="p-2 rounded-lg hover:bg-white/5 text-slate-500"><Edit3 className="w-3.5 h-3.5" /></button>
              <button
                type="button"
                onClick={() => { if (!isDeleting) setDeleteTarget(item); }}
                className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <DeleteConfirmationModal
        isOpen={deleteTarget !== null}
        onClose={() => { if (!isDeleting) setDeleteTarget(null); }}
        onConfirm={() => { void handleConfirmDelete(); }}
        title="Eliminare dal catalogo AI?"
        message={deleteTarget ? `Stai per eliminare "${deleteTarget.name}" dal catalogo AI.` : ''}
        isDeleting={isDeleting}
        zIndex={Z_ADMIN_MODAL_NESTED}
      />

      {editing && createPortal(
        <div
          className={`td-modal-overlay ${overlayShell} !items-center`}
          style={{ zIndex: Z_OVERLAY }}
          onClick={closeEditModal}
        >
          <div
            className={`${containerShell} max-w-md outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900`}
            style={{ zIndex: Z_ADMIN_MODAL_NESTED }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-catalog-edit-title"
            aria-describedby="ai-catalog-edit-desc"
          >
            <CloseButton
              onClose={closeEditModal}
              variant="primary"
              position="absolute"
              className={`${closeOffsetShell} z-local-overlay`}
            />
            <div className={`${bodyShell} min-h-0 space-y-6`}>
              <h3 id="ai-catalog-edit-title" className={modalTitleShell}>
                {editing.id ? 'Modifica' : 'Nuovo'} Catalogo AI
              </h3>
              <p id="ai-catalog-edit-desc" className="sr-only">
                Compila i campi del catalogo AI e conferma per salvare.
              </p>
              <div className="space-y-4">
                <input type="text" placeholder="Nome" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" />
                <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white">
                  {ADMIN_CATEGORY_OPTIONS.map((c) => <option key={c}>{c}</option>)}
                </select>
                <input type="text" placeholder="Tags (virgola)" value={editing.tags.join(', ')} onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-indigo-400 font-mono" />
                <input type="number" placeholder="Ordine" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" />
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                  Attivo
                </label>
              </div>
              <button type="button" onClick={handleSave} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" aria-hidden /> Conferma
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
