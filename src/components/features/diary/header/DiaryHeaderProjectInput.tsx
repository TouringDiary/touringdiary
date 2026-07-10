import React from 'react';
import { Calendar, Check, FolderOpen, Globe, PencilLine, RefreshCw, Trash2, Printer, Share2, Users } from 'lucide-react';
import { Itinerary } from '@/types';
import { AnchoredPopover } from '@/components/common/AnchoredPopover';
import { SaveMenuPopover } from '@/components/save/SaveMenuPopover';
import { SharedResourceIndicator } from '@/components/collaboration/SharedResourceIndicator';
import { useSharedResourceIndicator } from '@/hooks/useSharedResourceIndicator';
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
    onCollaborativeShare: () => void;
    onPublishRequest: () => void;
    canPublish: boolean;
    isAlreadyPublished: boolean;
    popoverBoundaryRef?: React.RefObject<HTMLElement | null>;
}

const SHARE_ITEM_CLASS =
    'w-full text-left px-3 py-2.5 text-xs font-bold text-white hover:bg-slate-700 flex items-center gap-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

interface SavedProjectListItemProps {
    project: Itinerary;
    onLoadProject: (p: Itinerary) => void;
    onCloseMenu: () => void;
    onDeleteProject: (e: React.MouseEvent, id: string) => void;
}

const SavedProjectListItem: React.FC<SavedProjectListItemProps> = ({
    project,
    onLoadProject,
    onCloseMenu,
    onDeleteProject,
}) => {
    const isShared = useSharedResourceIndicator(project.id ? 'diary' : null, project.id);
    const stopCount = (project.items || []).length;

    return (
        <div className="flex items-stretch border-b border-slate-700/50 last:border-0 hover:bg-slate-700/50 transition-colors group">
            <button
                onClick={() => { onLoadProject(project); onCloseMenu(); }}
                className="flex-1 text-left px-3 py-2.5 text-xs text-slate-300 hover:text-white min-w-0"
            >
                <div className="mb-1.5 min-w-0">
                    <span className="font-bold truncate text-slate-200 block">
                        {project.name || 'Senza Nome'}
                    </span>
                </div>
                <div className="flex flex-col gap-1">
                    <div className="flex items-start gap-1.5 text-[9px] text-slate-500">
                        <Calendar className="w-3 h-3 shrink-0 text-slate-500 mt-px" aria-hidden />
                        <span className="leading-snug">
                            Data Creazione:{' '}
                            <span className="text-slate-400 tabular-nums whitespace-nowrap">
                                {isValidTimestamp(project.createdAt)
                                    ? formatItalianDateTimeWithSeconds(project.createdAt)
                                    : '—'}
                            </span>
                        </span>
                    </div>
                    <div className="flex items-start gap-1.5 text-[9px] text-slate-500">
                        <PencilLine className="w-3 h-3 shrink-0 text-slate-500 mt-px" aria-hidden />
                        <span className="leading-snug">
                            Ultimo Salvataggio:{' '}
                            <span className="text-slate-400 tabular-nums whitespace-nowrap">
                                {isValidTimestamp(project.updatedAt)
                                    ? formatItalianDateTimeWithSeconds(project.updatedAt)
                                    : '—'}
                            </span>
                        </span>
                    </div>
                </div>
            </button>
            <div className="flex flex-col items-center justify-between shrink-0 py-2.5">
                <button
                    onClick={(e) => onDeleteProject(e, project.id || '')}
                    className="p-2 text-slate-500 hover:text-red-500 hover:bg-slate-800 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                    title="Elimina"
                    aria-label="Elimina"
                >
                    <Trash2 className="w-3.5 h-3.5"/>
                </button>
                <span className="inline-flex items-center gap-1 px-1 text-[9px] font-semibold text-slate-400 tabular-nums">
                    {stopCount} Tappe
                    {isShared && <SharedResourceIndicator />}
                </span>
            </div>
        </div>
    );
};

export const DiaryHeaderProjectInput: React.FC<DiaryHeaderProjectInputProps> = ({
    itinerary, onSetName, loadMenuOpen, handleLoadMenuOpen, loadMenuRef, isSyncing, savedProjects, onLoadProject, handleDeleteClick,
    isGuest, openModal, onSave, onSaveAs, onAutosaveToggle, savePhase, autosaveEnabled, canUseAutosave,
    handleExportClick, shareMenuOpen, setShareMenuOpen, shareMenuRef, onClear,
    onCollaborativeShare, onPublishRequest, canPublish, isAlreadyPublished,
    popoverBoundaryRef,
}) => {
    const openGuestAuth = () => openModal('auth');

    const handleShareCollaborative = () => {
        setShareMenuOpen(false);
        if (isGuest) {
            openGuestAuth();
            return;
        }
        onCollaborativeShare();
    };

    const handleShareCommunity = () => {
        setShareMenuOpen(false);
        if (isGuest) {
            openGuestAuth();
            return;
        }
        onPublishRequest();
    };

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
                    <button onClick={handleLoadMenuOpen} className={`text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-full transition-colors ${loadMenuOpen ? 'bg-slate-800 text-white' : ''}`} title="Apri/Carica" aria-label="Apri/Carica">
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
                                    <SavedProjectListItem
                                        key={p.id || idx}
                                        project={p}
                                        onLoadProject={onLoadProject}
                                        onCloseMenu={handleLoadMenuOpen}
                                        onDeleteProject={handleDeleteClick}
                                    />
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

                <button onClick={handleExportClick} className="text-slate-400 hover:text-blue-400 hover:bg-slate-800 p-1.5 rounded-full transition-colors" title="Esporta / Stampa" aria-label="Esporta / Stampa">
                    <Printer className="w-[16.5px] h-[16.5px]" />
                </button>
                
                <div ref={shareMenuRef}>
                    <button onClick={() => setShareMenuOpen(!shareMenuOpen)} className={`text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-full transition-colors ${shareMenuOpen ? 'bg-slate-800 text-white' : ''}`} title="Condividi" aria-label="Condividi">
                        <Share2 className="w-[16.5px] h-[16.5px]" />
                    </button>
                    <AnchoredPopover
                        isOpen={shareMenuOpen}
                        onClose={() => setShareMenuOpen(false)}
                        anchorRef={shareMenuRef}
                        boundaryRef={popoverBoundaryRef}
                        align="right"
                        className="w-52 sm:w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden origin-top-right"
                    >
                        <div className="px-3 pt-2 pb-1 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
                            Condivisione
                        </div>
                        <button
                            type="button"
                            onClick={handleShareCollaborative}
                            className={SHARE_ITEM_CLASS}
                        >
                            <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" aria-hidden />
                            Condividi
                        </button>
                        {isAlreadyPublished ? (
                            <div
                                className={`${SHARE_ITEM_CLASS} text-slate-400 cursor-default hover:bg-transparent`}
                                role="status"
                                aria-live="polite"
                            >
                                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden />
                                Già pubblicato
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={handleShareCommunity}
                                disabled={!canPublish && !isGuest}
                                className={SHARE_ITEM_CLASS}
                                title={!canPublish && !isGuest ? 'Aggiungi tappe e un nome al viaggio' : undefined}
                            >
                                <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden />
                                Pubblica in Community
                            </button>
                        )}
                    </AnchoredPopover>
                </div>

                <div className="w-px h-4 bg-slate-700 mx-1"></div>
                
                <button onClick={onClear} className="text-slate-400 hover:text-red-400 hover:bg-slate-800 p-1.5 rounded-full transition-colors" aria-label="Svuota diario">
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
