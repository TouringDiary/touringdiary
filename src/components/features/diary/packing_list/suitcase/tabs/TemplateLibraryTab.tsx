import { Z_ADMIN_MODAL_NESTED } from '@/constants/zIndex';
import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Edit3, Trash2, Copy, Layout } from 'lucide-react';
import { Suitcase } from '@/types/suitcase';
import {
  fetchMasterTemplatesAsync,
  createMasterTemplateAsync,
  cloneMasterTemplateAsync,
  deleteMasterTemplateAsync,
  updateMasterTemplateTitleAsync,
} from '@/services/suitcase/suitcaseEditorialService';

export const TemplateLibraryTab: React.FC<{ selectedMasterId: string | null; onSelectMaster: (id: string | null) => void }> = ({ selectedMasterId, onSelectMaster }) => {
  const [masters, setMasters] = useState<Suitcase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const mResData = await fetchMasterTemplatesAsync();
      setMasters(mResData);
      if (!selectedMasterId && mResData.length > 0) {
        onSelectMaster(mResData[0].id);
      }
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
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDuplicate = async () => {
    if (!selectedMasterId) return;
    try {
      const newId = await cloneMasterTemplateAsync(selectedMasterId);
      onSelectMaster(newId);
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedMasterId || !window.confirm('Eliminare definitivamente questo template?')) return;
    try {
      await deleteMasterTemplateAsync(selectedMasterId);
      onSelectMaster(null);
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
                <p className="text-sm text-slate-400">
                  Gli oggetti del template sono gestiti in <strong className="text-indigo-400">Standard Items</strong> (core condiviso) e <strong className="text-indigo-400">Template Specifici</strong> (tab dedicata).
                </p>
              </div>
            </div>
          </div>
        ) : <div className="h-full flex flex-col items-center justify-center text-slate-700 gap-4"><Layout className="w-16 h-16 opacity-10" /><p className="text-sm font-medium">Seleziona un template.</p></div>}
      </main>
    </div>
  );
};
