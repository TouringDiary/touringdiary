
import React, { useRef, useState, useEffect } from 'react';
import { Briefcase, PenTool, FolderOpen, Save, FilePlus2, Printer, Share2, Facebook, Twitter, Copy, Trash2, Globe, Sparkles, ChevronLeft, ChevronRight, RefreshCw, Map, AlertTriangle, CalendarDays } from 'lucide-react';
import { Itinerary, User } from '@/types';
import { useItinerary } from '@/context/ItineraryContext';
import { useDynamicContent } from '@/hooks/useDynamicContent'; 
import { useModal } from '@/context/ModalContext';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';

interface DiaryHeaderProps {
    itinerary: Itinerary;
    user: User;
    savedProjects: Itinerary[];
    highlightDates: boolean;
    activeTab: 'all' | number;
    days: Date[];
    minDateStr: string;
    onSetName: (name: string) => void;
    onDateChange: (type: 'startDate' | 'endDate', val: string) => void;
    onLoadProject: (p: Itinerary) => void;
    onSaveAction: () => void;
    onSaveAs: () => void;
    onPrint: () => void;
    onClear: () => void;
    onPublish: () => void;
    onOpenAiPlanner?: () => void;
    onOpenRoadbook?: () => void;
    onOpenPackingList?: () => void;
    setActiveTab: (tab: 'all' | number) => void;
    onDeleteProject: (id: string) => void;
}

const formatDateForDisplay = (dateString: string | null): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

export const DiaryHeader: React.FC<DiaryHeaderProps> = ({
    itinerary, user, savedProjects, highlightDates, activeTab, days, minDateStr,
    onSetName, onDateChange, onLoadProject, onSaveAction, onSaveAs, onPrint, onClear, onPublish, onOpenAiPlanner, onOpenRoadbook, onOpenPackingList, setActiveTab, onDeleteProject
}) => {
    const { refreshItineraryData, syncCloudDrafts } = useItinerary(); 
    const { openModal } = useModal(); 
    
    const [saveMenuOpen, setSaveMenuOpen] = useState(false);
    const [loadMenuOpen, setLoadMenuOpen] = useState(false);
    const [shareMenuOpen, setShareMenuOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false); 
    const [shouldFlashRoadbook, setShouldFlashRoadbook] = useState(false);
    
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 1024);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const titleConfig = useDynamicContent('diary_title', isMobile);
    
    const tabsContainerRef = useRef<HTMLDivElement>(null);
    const saveMenuRef = useRef<HTMLDivElement>(null);
    const loadMenuRef = useRef<HTMLDivElement>(null);
    const shareMenuRef = useRef<HTMLDivElement>(null);

    // --- LOCAL STATE FOR DATE DISPLAY ---
    const [displayStartDate, setDisplayStartDate] = useState(formatDateForDisplay(itinerary.startDate));
    const [displayEndDate, setDisplayEndDate] = useState(formatDateForDisplay(itinerary.endDate));

    useEffect(() => {
        setDisplayStartDate(formatDateForDisplay(itinerary.startDate));
    }, [itinerary.startDate]);

    useEffect(() => {
        setDisplayEndDate(formatDateForDisplay(itinerary.endDate));
    }, [itinerary.endDate]);
    
    const handleDateBlur = (e: React.FocusEvent<HTMLInputElement>, type: 'startDate' | 'endDate') => {
        const displayValue = e.target.value;
        if (!displayValue) {
            // Handle case where user clears the field, if necessary
            return;
        }
        const parts = displayValue.split('/');

        if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
            const [day, month, year] = parts;
            const newDateStr = `${year}-${month}-${day}`;
            const newDate = new Date(newDateStr);
            if (!isNaN(newDate.getTime()) && newDate.getDate() === parseInt(day, 10)) {
                onDateChange(type, newDateStr);
                return;
            }
        }
        // If format is invalid, revert to the last valid value from props
        if (type === 'startDate') {
            setDisplayStartDate(formatDateForDisplay(itinerary.startDate));
        } else {
            setDisplayEndDate(formatDateForDisplay(itinerary.endDate));
        }
    };


    useEffect(() => {
        if (itinerary.items.length > 0) {
            setShouldFlashRoadbook(true);
            const timer = setTimeout(() => setShouldFlashRoadbook(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [itinerary.items.length]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (saveMenuRef.current && !saveMenuRef.current.contains(event.target as Node)) setSaveMenuOpen(false);
            if (loadMenuRef.current && !loadMenuRef.current.contains(event.target as Node)) setLoadMenuOpen(false);
            if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) setShareMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const scrollTabs = (direction: 'left' | 'right') => {
        if (tabsContainerRef.current) tabsContainerRef.current.scrollBy({ left: direction === 'left' ? -100 : 100, behavior: 'smooth' });
    };
    
    const handleRefreshData = async () => {
        setIsRefreshing(true);
        await refreshItineraryData();
        setTimeout(() => setIsRefreshing(false), 800);
        setLoadMenuOpen(false);
    };

    const handleLoadMenuOpen = () => {
        const newState = !loadMenuOpen;
        setLoadMenuOpen(newState);
        
        if (newState && user && user.role !== 'guest') {
            setIsSyncing(true);
            syncCloudDrafts(user.id).then(() => {
                setTimeout(() => setIsSyncing(false), 500);
            });
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeleteTargetId(id);
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;
        setIsDeleting(true);
        try {
            await onDeleteProject(deleteTargetId);
            setDeleteTargetId(null);
        } catch (e) {
            alert("Errore durante la cancellazione");
        } finally {
            setIsDeleting(false);
        }
    };

    const isGuest = user.role === 'guest';
    const canPublish = itinerary.items.length > 0 && itinerary.name && !isGuest;

    const handleSave = () => {
        if (isGuest) {
            openModal('auth');
            return;
        }
        onSaveAction();
        setSaveMenuOpen(false);
    };

    const handleSaveAs = () => {
        if (isGuest) {
            openModal('auth');
            return;
        }
        onSaveAs();
        setSaveMenuOpen(false);
    };

    const handleExportClick = () => {
        if (itinerary.items.length === 0) {
            openModal('emptyDiary');
        } else {
            openModal('exportOptions');
        }
    };

    const targetProjectName = savedProjects.find(p => p.id === deleteTargetId)?.name || 'questo diario';

    return (
        <div className="p-3 border-b border-stone-300 z-50 bg-slate-900 shadow-sm relative no-print-bg flex-shrink-0 transition-all">
            
            <DeleteConfirmationModal 
                isOpen={!!deleteTargetId}
                onClose={() => setDeleteTargetId(null)}
                onConfirm={confirmDelete}
                title="Eliminare Diario?"
                message={`Stai per cancellare definitivamente "${targetProjectName}". L'azione è irreversibile.`}
                isDeleting={isDeleting}
                variant="danger"
                icon={<Trash2 className="w-8 h-8 text-red-500 animate-pulse"/>}
            />

            <div className="flex flex-col gap-2">
                
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <PenTool className="w-[16.5px] h-[16.5px] text-amber-500" />
                        <h3 className={`${titleConfig.style} leading-none whitespace-nowrap`}>
                            {titleConfig.text || (isMobile ? 'Diario' : 'Diario di Viaggio')}
                        </h3>
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0">
                        {onOpenPackingList && (
                             <button onClick={onOpenPackingList} className="text-white bg-indigo-600 hover:bg-indigo-500 p-1.5 rounded-lg shadow-md" title="Lista Bagaglio">
                                 <Briefcase className="w-5 h-5" />
                             </button>
                        )}
                        {onOpenRoadbook && itinerary.items.length > 0 && (
                            <button onClick={onOpenRoadbook} className={`text-white p-1.5 rounded-lg transition-all shadow-md ${shouldFlashRoadbook ? 'bg-amber-500 animate-pulse ring-2 ring-amber-300' : 'bg-indigo-600 hover:bg-indigo-500'}`} title="Roadbook">
                                <Map className="w-5 h-5" />
                            </button>
                        )}
                        {onOpenAiPlanner && (
                            <button onClick={onOpenAiPlanner} className="text-white bg-indigo-600 hover:bg-indigo-500 p-1.5 rounded-lg shadow-md" title="Magic Planner AI">
                                <Sparkles className="w-5 h-5" />
                            </button>
                        )}
                        <button 
                            onClick={() => { if(canPublish) onPublish(); else if(isGuest) openModal('auth'); }} 
                            disabled={!canPublish && !isGuest} 
                            className={`p-1.5 rounded-lg shadow-md flex items-center justify-center ${canPublish || isGuest ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500 opacity-60 cursor-not-allowed border border-slate-700'}`} 
                            title="Condividi con la Community"
                        >
                            <Globe className="w-5 h-5" />
                        </button>
                    </div>
                </div>

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
                        <div className="relative" ref={loadMenuRef}>
                            <button onClick={handleLoadMenuOpen} className={`text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-full transition-colors ${loadMenuOpen ? 'bg-slate-800 text-white' : ''}`} title="Apri/Carica">
                                <FolderOpen className="w-[16.5px] h-[16.5px]" />
                            </button>
                            {loadMenuOpen && (
                                <div className="absolute top-full right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 origin-top-right">
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
                                                    <button onClick={() => { onLoadProject(p); setLoadMenuOpen(false); }} className="flex-1 text-left px-3 py-2 text-xs text-slate-300 hover:text-white truncate">
                                                        <span className="font-bold block truncate">{p.name || 'Senza Nome'}</span>
                                                        <span className="text-[9px] text-slate-500">{(p.items || []).length} tappe • {new Date(p.createdAt || 0).toLocaleDateString()}</span>
                                                    </button>
                                                    <button 
                                                        onClick={(e) => handleDeleteClick(e, p.id)} 
                                                        className="p-2 text-slate-500 hover:text-red-500 hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Elimina"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5"/>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : <div className="px-3 py-4 text-xs text-slate-500 text-center italic">Nessun progetto</div>}
                                </div>
                            )}
                        </div>
                        
                        <div className="relative" ref={saveMenuRef}>
                            <button onClick={() => {
                                 if (isGuest) openModal('auth');
                                 else setSaveMenuOpen(!saveMenuOpen);
                            }} className={`text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-full transition-colors ${saveMenuOpen ? 'bg-slate-800 text-white' : ''}`}>
                                <Save className="w-[16.5px] h-[16.5px]" />
                            </button>
                            {saveMenuOpen && (
                                <div className="absolute top-full right-0 mt-2 w-36 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 origin-top-right">
                                    <button onClick={handleSave} className="w-full text-left px-3 py-2 text-xs font-bold text-white hover:bg-slate-700 flex items-center gap-2">
                                        <Save className="w-3 h-3 text-emerald-500"/> Salva
                                    </button>
                                    <button onClick={handleSaveAs} className="w-full text-left px-3 py-2 text-xs font-bold text-white hover:bg-slate-700 flex items-center gap-2 border-t border-slate-700">
                                        <FilePlus2 className="w-3 h-3 text-amber-500"/> Salva come...
                                    </button>
                                </div>
                            )}
                        </div>

                        <button onClick={handleExportClick} className="text-slate-400 hover:text-blue-400 hover:bg-slate-800 p-1.5 rounded-full transition-colors" title="Esporta / Stampa">
                            <Printer className="w-[16.5px] h-[16.5px]" />
                        </button>
                        
                        <div className="relative" ref={shareMenuRef}>
                            <button onClick={() => setShareMenuOpen(!shareMenuOpen)} className={`text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-full transition-colors ${shareMenuOpen ? 'bg-slate-800 text-white' : ''}`}>
                                <Share2 className="w-[16.5px] h-[16.5px]" />
                            </button>
                            {shareMenuOpen && (
                                <div className="absolute top-full right-0 mt-2 w-32 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 origin-top-right">
                                    <button className="w-full text-left px-3 py-2 text-xs font-bold text-white hover:bg-slate-700 flex items-center gap-2">
                                        <Facebook className="w-3 h-3 text-blue-500"/> Facebook
                                    </button>
                                    <button className="w-full text-left px-3 py-2 text-xs font-bold text-white hover:bg-slate-700 flex items-center gap-2 border-t border-slate-700">
                                        <Copy className="w-3 h-3 text-emerald-500"/> Copia Link
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="w-px h-4 bg-slate-700 mx-1"></div>
                        
                        <button onClick={onClear} className="text-slate-400 hover:text-red-400 hover:bg-slate-800 p-1.5 rounded-full transition-colors">
                            <Trash2 className="w-[16.5px] h-[16.5px]" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className={`flex-1 flex items-center bg-slate-800 rounded border h-9 overflow-hidden ${highlightDates ? 'border-red-500 ring-2 ring-red-500 animate-pulse' : 'border-slate-700'}`}>
                        <div className="h-full w-10 flex items-center justify-center border-r border-slate-600/50 bg-slate-900/30 shrink-0">
                             <span className="text-[10px] font-bold text-amber-500 uppercase leading-none">Dal</span>
                        </div>
                        <div className="relative flex-1 h-full">
                            <input 
                                type="text"
                                placeholder="GG/MM/AAAA"
                                className="w-full h-full bg-transparent text-sm font-bold text-center text-white focus:outline-none font-mono" 
                                value={displayStartDate} 
                                onChange={(e) => setDisplayStartDate(e.target.value)}
                                onBlur={(e) => handleDateBlur(e, 'startDate')}
                            />
                            <CalendarDays className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 text-white opacity-90 pointer-events-none" />
                        </div>
                    </div>
                    <div className={`flex-1 flex items-center bg-slate-800 rounded border h-9 overflow-hidden ${highlightDates ? 'border-red-500 ring-2 ring-red-500 animate-pulse' : 'border-slate-700'}`}>
                        <div className="h-full w-10 flex items-center justify-center border-r border-slate-600/50 bg-slate-900/30 shrink-0">
                            <span className="text-[10px] font-bold text-amber-500 uppercase leading-none">Al</span>
                        </div>
                        <div className="relative flex-1 h-full">
                            <input 
                                type="text"
                                placeholder="GG/MM/AAAA"
                                className="w-full h-full bg-transparent text-sm font-bold text-center text-white focus:outline-none font-mono" 
                                value={displayEndDate} 
                                onChange={(e) => setDisplayEndDate(e.target.value)}
                                onBlur={(e) => handleDateBlur(e, 'endDate')}
                            />
                            <CalendarDays className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 text-white opacity-90 pointer-events-none" />
                        </div>
                    </div>
                </div>
                
                {days.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 pt-1 border-t border-slate-800/50">
                        <button onClick={() => setActiveTab('all')} className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors border ${activeTab === 'all' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>ALL</button>
                        <div className="w-px h-4 bg-slate-700 mx-1"></div>
                        <button onClick={() => scrollTabs('left')} className="p-0.5 text-slate-500 hover:text-white"><ChevronLeft className="w-3 h-3"/></button>
                        <div className="flex-1 overflow-x-auto scrollbar-hide flex gap-1 mx-1" ref={tabsContainerRef}>{days.map((_, index) => (<button key={index} onClick={() => setActiveTab(index)} className={`flex-shrink-0 px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${activeTab === index ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'}`}>DAY {index + 1}</button>))}</div>
                        <button onClick={() => scrollTabs('right')} className="p-0.5 text-slate-500 hover:text-white"><ChevronRight className="w-3 h-3"/></button>
                    </div>
                )}
            </div>
        </div>
    );
};
