import React from 'react';
import { FolderOpen, RefreshCw, Trash2, Save, FilePlus2, Printer, Share2, Facebook, Copy } from 'lucide-react';
import { Itinerary } from '@/types';
import { AnchoredPopover } from '@/components/common/AnchoredPopover';

interface DiaryHeaderProjectInputProps {
    itinerary: Itinerary;
    onSetName: (name: string) => void;
    loadMenuOpen: boolean;
    handleLoadMenuOpen: () => void;
    loadMenuRef: React.RefObject<HTMLDivElement>;
    handleRefreshData: () => Promise<void>;
    isRefreshing: boolean;
    isSyncing: boolean;
    savedProjects: Itinerary[];
    onLoadProject: (p: Itinerary) => void;
    handleDeleteClick: (e: React.MouseEvent, id: string) => void;
    saveMenuOpen: boolean;
    setSaveMenuOpen: (v: boolean) => void;
    saveMenuRef: React.RefObject<HTMLDivElement>;
    isGuest: boolean;
    openModal: (type: string) => void;
    handleSave: () => void;
    handleSaveAs: () => void;
    handleExportClick: () => void;
    shareMenuOpen: boolean;
    setShareMenuOpen: (v: boolean) => void;
    shareMenuRef: React.RefObject<HTMLDivElement>;
    onClear: () => void;
}

export const DiaryHeaderProjectInput: React.FC<DiaryHeaderProjectInputProps> = ({
    itinerary, onSetName, loadMenuOpen, handleLoadMenuOpen, loadMenuRef, handleRefreshData, isRefreshing, isSyncing, savedProjects, onLoadProject, handleDeleteClick,
    saveMenuOpen, setSaveMenuOpen, saveMenuRef, isGuest, openModal, handleSave, handleSaveAs, handleExportClick, shareMenuOpen, setShareMenuOpen, shareMenuRef, onClear
}) => {
    return (
        <div className="flex gap-2 items-center h-8">
            <div className="bg-slate-800/50 p-1 rounded border border-slate-700/50 flex items-center flex-1 min-w-0">
                <div className="px-2 w-full truncate">
                    <input 
                        type="text" 
                        placeholder="Nome del progetto..." 
                        className="bg-transparent text-base font-bold text-white w-full focus:outline-none placeholder:text-slate-600 font-sans tracking-wide" 
                        value={itinerary.name || ''} 
                        onChange={(e) => onSetName(e.target.value)} 
                    />
                </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
                <div ref={loadMenuRef}>
                    <button onClick={handleLoadMenuOpen} className={`text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-full transition-colors ${loadMenuOpen ? 'bg-slate-800 text-white' : ''}`} title="Apri/Carica">
                        <FolderOpen className="w-[16.5px] h-[16.5px]" />
                    </button>
                    <AnchoredPopover
                        isOpen={loadMenuOpen}
                        onClose={() => handleLoadMenuOpen()}
                        anchorRef={loadMenuRef}
                        align="right"
                        className="w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden origin-top-right"
                    >
                        <button onClick={handleRefreshData} className="w-full text-left px-3 py-3 text-xs font-bold text-emerald-400 hover:text-white hover:bg-slate-700 flex items-center gap-2 border-b border-slate-700/50">
                            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}/> Aggiorna Dati
                        </button>
                        <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-700 flex justify-between">
                            <span>Progetti Salvati</span>
                            {isSyncing && <RefreshCw className="w-3 h-3 animate-spin"/>}
                        </div>
                        {savedProjects.length > 0 ? (
                            <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                {savedProjects.map((p, idx) => (
                                    <div key={p.id || idx} className="flex items-center border-b border-slate-700/50 last:border-0 hover:bg-slate-700/50 transition-colors group">
                                        <button onClick={() => { onLoadProject(p); handleLoadMenuOpen(); }} className="flex-1 text-left px-3 py-2 text-xs text-slate-300 hover:text-white truncate">
                                            <span className="font-bold block truncate">{p.name || 'Senza Nome'}</span>
                                            <span className="text-[9px] text-slate-500">{(p.items || []).length} tappe • {new Date(p.createdAt || 0).toLocaleDateString()}</span>
                                        </button>
                                        <button 
                                            onClick={(e) => handleDeleteClick(e, p.id || '')} 
                                            className="p-2 text-slate-500 hover:text-red-500 hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Elimina"
                                        >
                                            <Trash2 className="w-3.5 h-3.5"/>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : <div className="px-3 py-4 text-xs text-slate-500 text-center italic">Nessun progetto</div>}
                    </AnchoredPopover>
                </div>
                
                <div ref={saveMenuRef}>
                    <button onClick={() => {
                         if (isGuest) openModal('auth');
                         else setSaveMenuOpen(!saveMenuOpen);
                    }} className={`text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-full transition-colors ${saveMenuOpen ? 'bg-slate-800 text-white' : ''}`}>
                        <Save className="w-[16.5px] h-[16.5px]" />
                    </button>
                    <AnchoredPopover
                        isOpen={saveMenuOpen}
                        onClose={() => setSaveMenuOpen(false)}
                        anchorRef={saveMenuRef}
                        align="right"
                        className="w-36 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden origin-top-right"
                    >
                        <button onClick={handleSave} className="w-full text-left px-3 py-2 text-xs font-bold text-white hover:bg-slate-700 flex items-center gap-2">
                            <Save className="w-3 h-3 text-emerald-500"/> Salva
                        </button>
                        <button onClick={handleSaveAs} className="w-full text-left px-3 py-2 text-xs font-bold text-white hover:bg-slate-700 flex items-center gap-2 border-t border-slate-700">
                            <FilePlus2 className="w-3 h-3 text-amber-500"/> Salva come...
                        </button>
                    </AnchoredPopover>
                </div>

                <button onClick={handleExportClick} className="text-slate-400 hover:text-blue-400 hover:bg-slate-800 p-1.5 rounded-full transition-colors" title="Esporta / Stampa">
                    <Printer className="w-[16.5px] h-[16.5px]" />
                </button>
                
                <div ref={shareMenuRef}>
                    <button onClick={() => setShareMenuOpen(!shareMenuOpen)} className={`text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-full transition-colors ${shareMenuOpen ? 'bg-slate-800 text-white' : ''}`}>
                        <Share2 className="w-[16.5px] h-[16.5px]" />
                    </button>
                    <AnchoredPopover
                        isOpen={shareMenuOpen}
                        onClose={() => setShareMenuOpen(false)}
                        anchorRef={shareMenuRef}
                        align="right"
                        className="w-32 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden origin-top-right"
                    >
                        <button className="w-full text-left px-3 py-2 text-xs font-bold text-white hover:bg-slate-700 flex items-center gap-2">
                            <Facebook className="w-3 h-3 text-blue-500"/> Facebook
                        </button>
                        <button className="w-full text-left px-3 py-2 text-xs font-bold text-white hover:bg-slate-700 flex items-center gap-2 border-t border-slate-700">
                            <Copy className="w-3 h-3 text-emerald-500"/> Copia Link
                        </button>
                    </AnchoredPopover>
                </div>

                <div className="w-px h-4 bg-slate-700 mx-1"></div>
                
                <button onClick={onClear} className="text-slate-400 hover:text-red-400 hover:bg-slate-800 p-1.5 rounded-full transition-colors">
                    <Trash2 className="w-[16.5px] h-[16.5px]" />
                </button>
            </div>
        </div>
    );
};
