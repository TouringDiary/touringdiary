import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Edit3, Trash2, X, CheckCircle2, Layout } from 'lucide-react';
import { Z_ADMIN_MODAL_NESTED } from '@/constants/zIndex';
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
                <button onClick={() => setEditing({ ...item, template_id: item.template_id })} className="p-2 rounded-lg hover:bg-white/5 text-slate-500"><Edit3 className="w-3.5 h-3.5" /></button>
                <button onClick={async () => { await deleteTemplateSpecificItemAsync(item.id); await load(); }} className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {editing && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: Z_ADMIN_MODAL_NESTED }}>
          <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-white/10 shadow-2xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-white">{editing.id ? 'Modifica' : 'Nuovo'} Item Specifico</h3>
              <button onClick={() => setEditing(null)} className="p-2 text-slate-500"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Nome" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" />
              <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white">
                {ADMIN_CATEGORY_OPTIONS.map((c) => <option key={c}>{c}</option>)}
              </select>
              <input type="number" placeholder="Ordine" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" />
            </div>
            <button onClick={handleSave} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> Conferma</button>
          </div>
        </div>
      )}
    </div>
  );
};
