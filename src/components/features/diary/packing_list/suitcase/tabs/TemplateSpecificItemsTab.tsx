import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Plus, Edit3, Trash2, CheckCircle2, Layout } from 'lucide-react';
import { Z_ADMIN_MODAL_NESTED, Z_OVERLAY } from '@/constants/zIndex';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
import { ADMIN_CATEGORY_OPTIONS } from '@/domain/packing/packingCategories';
import { Suitcase } from '@/types/suitcase';
import { fetchMasterTemplatesAsync } from '@/services/suitcase/suitcaseEditorialService';
import {
  fetchAllTemplateSpecificItemsAsync,
  upsertTemplateSpecificItemAsync,
  deleteTemplateSpecificItemAsync,
} from '@/services/suitcase/packingCatalogService';
import { PackingTemplateItem } from '@/types/packingCatalog';

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
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PackingTemplateItem | null>(null);
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
      const mRes = await fetchMasterTemplatesAsync();
      setMasters(mRes);
      const tid = selectedId ?? mRes[0]?.id ?? null;
      if (!selectedId && tid) setSelectedId(tid);
      if (tid) {
        setItems(await fetchAllTemplateSpecificItemsAsync(tid));
      } else {
        setItems([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!editing?.name || !editing.category || !editing.template_id) return;
    try {
      await upsertTemplateSpecificItemAsync(editing);
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
      await deleteTemplateSpecificItemAsync(deleteTarget.id);
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

  const current = masters.find((m) => m.id === selectedId);

  return (
    <div className="flex h-full gap-6 animate-in fade-in duration-300">
      <aside className="w-64 shrink-0 space-y-1">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-3 px-2">Template TD</h2>
        {masters.map((m) => (
          <button key={m.id} onClick={() => setSelectedId(m.id)} className={`w-full px-3 py-2 rounded-xl text-left text-sm font-bold truncate ${selectedId === m.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/40'}`}>
            {m.icon} {m.title}
          </button>
        ))}
      </aside>

      <main className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2"><Layout className="w-5 h-5 text-indigo-400" /> Specifici: {current?.title ?? '—'}</h2>
            <p className="text-xs text-slate-500 mt-1">Solo item aggiuntivi del template (oltre allo standard core).</p>
          </div>
          {selectedId && (
            <button
              type="button"
              onClick={() => setEditing({ template_id: selectedId, category: 'Extra', name: '', sort_order: 0, is_active: true })}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-black rounded-xl"
            >
              <Plus className="w-4 h-4" /> Aggiungi
            </button>
          )}
        </div>

        <div className="grid gap-2 max-h-[55vh] overflow-y-auto pr-2">
          {items.map((item) => (
            <div key={item.id} className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl flex items-center justify-between group">
              <div>
                <span className="text-sm font-bold text-slate-200">{item.name}</span>
                <span className="text-[10px] text-slate-500 uppercase font-black block mt-0.5">{item.category}</span>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button type="button" onClick={() => setEditing({ ...item, template_id: item.template_id })} className="p-2 rounded-lg hover:bg-white/5 text-slate-500"><Edit3 className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => { if (!isDeleting) setDeleteTarget(item); }} className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <DeleteConfirmationModal
        isOpen={deleteTarget !== null}
        onClose={() => { if (!isDeleting) setDeleteTarget(null); }}
        onConfirm={() => { void handleConfirmDelete(); }}
        title="Eliminare item specifico?"
        message={deleteTarget ? `Stai per eliminare "${deleteTarget.name}" da questo template.` : ''}
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
            aria-labelledby="template-specific-edit-title"
            aria-describedby="template-specific-edit-desc"
          >
            <CloseButton
              onClose={closeEditModal}
              variant="primary"
              position="absolute"
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
                <input type="text" placeholder="Nome" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" />
                <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white">
                  {ADMIN_CATEGORY_OPTIONS.map((c) => <option key={c}>{c}</option>)}
                </select>
                <input type="number" placeholder="Ordine" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" />
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
