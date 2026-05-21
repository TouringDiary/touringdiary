import { Z_ADMIN_MODAL_NESTED } from '@/constants/zIndex';
import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Edit3, Trash2, Copy, Layout, X, CheckCircle2 } from 'lucide-react';
import { Suitcase, SuitcaseItem } from '@/types/suitcase';
import {
  fetchMasterTemplatesAsync,
  fetchTemplateItemsAsync,
  createMasterTemplateAsync,
  cloneMasterTemplateAsync,
  deleteMasterTemplateAsync,
  updateMasterTemplateTitleAsync,
  upsertTemplateItemAsync,
  deleteTemplateItemAsync,
  UpsertTemplateItemDto
} from '@/services/suitcase/suitcaseEditorialService';

interface EditableTemplateItemState {
  id?: string;
  name: string;
  category: string;
  affiliate_tags?: string[] | null;
  quantity?: number | null;
  is_checked?: boolean | null;
  is_ai_suggestion?: boolean | null;
}

export const TemplateLibraryTab: React.FC<{ selectedMasterId: string | null; onSelectMaster: (id: string | null) => void }> = ({ selectedMasterId, onSelectMaster }) => {
  const [masters, setMasters] = useState<Suitcase[]>([]);
  const [items, setItems] = useState<SuitcaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<EditableTemplateItemState | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [mResData, iResData] = await Promise.all([
        fetchMasterTemplatesAsync(),
        selectedMasterId ? fetchTemplateItemsAsync(selectedMasterId) : Promise.resolve([])
      ]);

      setMasters(mResData);
      if (!selectedMasterId && mResData.length > 0) {
        onSelectMaster(mResData[0].id);
      }
      setItems(iResData);
    } catch (e) {
      console.error(e);
    }
  }, [selectedMasterId, onSelectMaster]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await fetchData();
      setIsLoading(false);
    };
    init();
  }, [fetchData]);

  const handleCreateTemplate = async () => {
    try {
      const data = await createMasterTemplateAsync('Nuovo Template', '🎒');
      onSelectMaster(data.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDuplicate = async () => {
    if (!selectedMasterId) return;
    try {
      const newId = await cloneMasterTemplateAsync(selectedMasterId);
      onSelectMaster(newId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedMasterId || !window.confirm('Eliminare definitivamente questo template?')) return;
    try {
      await deleteMasterTemplateAsync(selectedMasterId);
      onSelectMaster(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveItem = async () => {
    if (!editingItem || !selectedMasterId || !editingItem.name || !editingItem.category) return;
    try {
      const payload: UpsertTemplateItemDto = {
        id: editingItem.id,
        suitcase_id: selectedMasterId,
        name: editingItem.name,
        category: editingItem.category,
        quantity: editingItem.quantity ?? undefined,
        is_checked: editingItem.is_checked ?? undefined,
        is_ai_suggestion: editingItem.is_ai_suggestion ?? undefined
      };
      await upsertTemplateItemAsync(payload);
      setEditingItem(null);
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) return <div className="flex-1 flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  const currentMaster = masters.find(m => m.id === selectedMasterId);

  return (
    <div className="flex h-full animate-in fade-in duration-500">
      <aside className="w-80 shrink-0 bg-slate-900/50 border-r border-slate-800 lg:overflow-y-auto p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-600">Libreria Template</h2>
          <button onClick={handleCreateTemplate} className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all"><Plus className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 space-y-1">
          {masters.map(m => (
            <button key={m.id} onClick={() => onSelectMaster(m.id)} className={`w-full px-3 py-3 rounded-xl flex items-center gap-3 transition-all ${selectedMasterId === m.id ? 'bg-slate-800 text-white shadow-lg border border-white/5' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'}`}>
              <span className="text-xl shrink-0">{m.icon}</span>
              <span className="text-sm font-bold truncate text-left flex-1">{m.title}</span>
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-1 lg:overflow-y-auto bg-slate-950 p-8">
        {currentMaster ? (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-slate-900 rounded-3xl p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Layout className="w-32 h-32 text-indigo-500" /></div>
              <div className="relative z-floating-panel space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-6">
                    <div className="text-5xl bg-slate-950 w-20 h-20 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner">{currentMaster.icon}</div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-3xl font-black text-white italic tracking-tight">{currentMaster.title}</h2>
                        <button onClick={async () => { const t = prompt('Nuovo Titolo:', currentMaster.title); if (t) { await updateMasterTemplateTitleAsync(currentMaster.id, t); fetchData(); } }} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500"><Edit3 className="w-4 h-4" /></button>
                      </div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">ID: {currentMaster.id}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleDuplicate} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl border border-white/5 transition-all"><Copy className="w-3.5 h-3.5" /> Duplica</button>
                    <button onClick={handleDeleteTemplate} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-xl border border-red-500/10 transition-all"><Trash2 className="w-3.5 h-3.5" /> Elimina</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white">Oggetti del Template</h3>
                <button onClick={() => setEditingItem({ name: '', category: 'Altro', affiliate_tags: [] })} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-500 transition-all"><Plus className="w-4 h-4" /> Aggiungi Oggetto</button>
              </div>
              <div className="grid gap-2">
                {items.map(item => (
                  <div key={item.id} className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:bg-slate-900 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-[10px] font-black text-slate-600 border border-white/5 uppercase">{item.category.slice(0, 2)}</div>
                      <div>
                        <span className="text-sm font-bold text-slate-200">{item.name}</span>
                        <span className="text-[10px] text-slate-500 uppercase font-black block mt-0.5">{item.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingItem({
                        id: item.id,
                        name: item.name,
                        category: item.category,
                        affiliate_tags: item.affiliate_tags,
                        quantity: item.quantity,
                        is_checked: item.is_checked,
                        is_ai_suggestion: item.is_ai_suggestion
                      })} className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={async () => { await deleteTemplateItemAsync(item.id); fetchData(); }} className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : <div className="h-full flex flex-col items-center justify-center text-slate-700 gap-4"><Layout className="w-16 h-16 opacity-10" /><p className="text-sm font-medium">Seleziona un template.</p></div>}
      </main>

      {editingItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: Z_ADMIN_MODAL_NESTED }}>
          <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-white/10 shadow-2xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-white">{editingItem.id ? 'Modifica Oggetto' : 'Nuovo Oggetto'}</h3>
              <button onClick={() => setEditingItem(null)} className="p-2 text-slate-500"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Nome" value={editingItem.name || ''} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" />
              <select value={editingItem.category || 'Altro'} onChange={e => setEditingItem({ ...editingItem, category: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none appearance-none">
                <option>Documenti</option><option>Elettronica</option><option>Salute</option><option>Abbigliamento</option><option>Accessori</option><option>Altro</option>
              </select>
              <input type="text" placeholder="Tags" value={editingItem.affiliate_tags?.join(', ') || ''} onChange={e => setEditingItem({ ...editingItem, affiliate_tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-indigo-400 font-mono" />
            </div>
            <button onClick={handleSaveItem} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> Conferma</button>
          </div>
        </div>
      )}
    </div>
  );
};



