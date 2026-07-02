import React from 'react';
import { Calendar, FolderOpen, MapPin, PencilLine, RefreshCw, Trash2, Printer, Share2, Facebook, Copy } from 'lucide-react';
import { Itinerary } from '@/types';
import { AnchoredPopover } from '@/components/common/AnchoredPopover';
import { SaveMenuPopover } from '@/components/save/SaveMenuPopover';
import type { DocumentSavePhase } from '@/domain/save/documentSaveTypes';
import { GUEST_SAVE_MESSAGE } from '@/domain/save/documentSaveTypes';
import { formatItalianDateTimeWithSeconds, isValidTimestamp } from '@/utils/dateFormatters';

interface DiaryHeaderProjectInputProps {
    itinerary: Itinerary;
    onSetName: (name: string) => void;
    loadMenuOpen: boolean;
    handleLoadMenuOpen: () => void;
    loadMenuRef: React.RefObject<HTMLDivElement>;
    isSyncing: boolean;
    savedProjects: Itinerary[];
    onLoadProject: (p: Itinerary) => void;
    handleDeleteClick: (e: React.MouseEvent, id: string) => void;
    isGuest: boolean;
    openModal: (type: string) => void;
    onSave: () => void;
    onSaveAs: () => void;
    onAutosaveToggle: (enabled: boolean) => void;
    savePhase: DocumentSavePhase;
    autosaveEnabled: boolean;
    canUseAutosave: boolean;
    handleExportClick: () => void;
    shareMenuOpen: boolean;
    setShareMenuOpen: (v: boolean) => void;
    shareMenuRef: React.RefObject<HTMLDivElement>;
    onClear: () => void;
    popoverBoundaryRef?: React.RefObject<HTMLElement | null>;
}

export const DiaryHeaderProjectInput: React.FC<DiaryHeaderProjectInputProps> = ({
    itinerary, onSetName, loadMenuOpen, handleLoadMenuOpen, loadMenuRef, isSyncing, savedProjects, onLoadProject, handleDeleteClick,
    isGuest, openModal, onSave, onSaveAs, onAutosaveToggle, savePhase, autosaveEnabled, canUseAutosave,
    handleExportClick, shareMenuOpen, setShareMenuOpen, shareMenuRef, onClear, popoverBoundaryRef,
}) => {
    const openGuestAuth = () => openModal('auth');

    return (
        <div className="flex flex-col gap-1 w-full">
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
                        boundaryRef={popoverBoundaryRef}
                        align="left"
                        className="w-80 sm:w-[22rem] max-w-[calc(100vw-1rem)] bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden origin-top-left"
                    >
                        <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-700 flex justify-between">
                            <span>Progetti Salvati</span>
                            {isSyncing && <RefreshCw className="w-3 h-3 animate-spin"/>}
                        </div>
                        {savedProjects.length > 0 ? (
                            <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                {savedProjects.map((p, idx) => (
                                    <div key={p.id || idx} className="flex items-stretch border-b border-slate-700/50 last:border-0 hover:bg-slate-700/50 transition-colors group">
                                        <button
                                            onClick={() => { onLoadProject(p); handleLoadMenuOpen(); }}
                                            className="flex-1 text-left px-3 py-2.5 text-xs text-slate-300 hover:text-white min-w-0"
                                        >
                                            <div className="flex items-center justify-between gap-2 mb-1.5 min-w-0">
                                                <span className="font-bold truncate text-slate-200">
                                                    {p.name || 'Senza Nome'}
                                                </span>
                                                <span className="shrink-0 inline-flex items-center gap-1 text-[9px] font-semibold text-slate-400 tabular-nums">
                                                    <MapPin className="w-3 h-3 shrink-0" aria-hidden />
                                                    {(p.items || []).length} Tappe
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-start gap-1.5 text-[9px] text-slate-500">
                                                    <Calendar className="w-3 h-3 shrink-0 text-slate-500 mt-px" aria-hidden />
                                                    <span className="leading-snug">
                                                        Data Creazione:{' '}
                                                        <span className="text-slate-400 tabular-nums whitespace-nowrap">
                                                            {isValidTimestamp(p.createdAt)
                                                                ? formatItalianDateTimeWithSeconds(p.createdAt)
                                                                : '—'}
                                                        </span>
                                                    </span>
                                                </div>
                                                <div className="flex items-start gap-1.5 text-[9px] text-slate-500">
                                                    <PencilLine className="w-3 h-3 shrink-0 text-slate-500 mt-px" aria-hidden />
                                                    <span className="leading-snug">
                                                        Ultimo Salvataggio:{' '}
                                                        <span className="text-slate-400 tabular-nums whitespace-nowrap">
                                                            {isValidTimestamp(p.updatedAt)
                                                                ? formatItalianDateTimeWithSeconds(p.updatedAt)
                                                                : '—'}
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                        <button 
                                            onClick={(e) => handleDeleteClick(e, p.id || '')} 
                                            className="self-center p-2 text-slate-500 hover:text-red-500 hover:bg-slate-800 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100 shrink-0"
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
                
                <SaveMenuPopover
                    isGuest={isGuest}
                    autosaveEnabled={autosaveEnabled}
                    canUseAutosave={canUseAutosave}
                    onSave={onSave}
                    onSaveAs={onSaveAs}
                    onAutosaveToggle={onAutosaveToggle}
                    onGuestAction={openGuestAuth}
                    disabled={savePhase === 'saving'}
                />

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
            {isGuest && (
                <p className="text-[10px] text-slate-500 pl-1">{GUEST_SAVE_MESSAGE}</p>
            )}
        </div>
    );
};
