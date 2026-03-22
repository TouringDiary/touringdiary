
import React, { useState, useEffect, useMemo } from 'react';
import { X, Map, Trash2, Globe, Search, ChevronDown, Check, BookOpen, Users, Zap, Lightbulb, ArrowLeft } from 'lucide-react';
import { PremadeItinerary, PointOfInterest, User as UserType } from '../../types/index';
import { ItinerariesList } from '../itineraries/ItinerariesList';
import { ItineraryDetail } from '../itineraries/ItineraryDetail';
import { ItineraryReviews } from '../itineraries/ItineraryReviews';
import { useItinerary } from '@/context/ItineraryContext';
import { getFilteredCommunityItinerariesAsync, getCommunityItinerariesMetadataAsync } from '../../services/communityService'; // NEW ASYNC

interface ItinerariesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onViewPoiDetail: (poi: PointOfInterest) => void;
    userLocation?: { lat: number; lng: number } | null;
    user?: UserType; 
    initialZoneFilter?: string | null; 
    onOpenAuth?: () => void; // ADDED PROP
}

const FilterDropdown = ({ label, options, value, onChange }: { label: string, options: string[], value: string, onChange: (v: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${value ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' : 'bg-slate-900 border-slate-700 text-slate-500 hover:text-white'}`}>
                {value || label} <ChevronDown className="w-2.5 h-2.5 opacity-50"/>
            </button>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute top-full left-0 mt-1 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-[110] overflow-hidden py-1 animate-in slide-in-from-top-2">
                        <button onClick={() => { onChange(''); setIsOpen(false); }} className={`w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-slate-800 ${!value ? 'text-amber-50' : 'text-slate-400'}`}>Tutti</button>
                        {options.map(opt => (
                            <button key={opt} onClick={() => { onChange(opt); setIsOpen(false); }} className={`w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-slate-800 flex items-center justify-between ${value === opt ? 'text-indigo-400 bg-slate-800/50' : 'text-slate-300'}`}>
                                {opt}
                                {value === opt && <Check className="w-3 h-3"/>}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export const ItinerariesModal = ({ isOpen, onClose, onViewPoiDetail, userLocation, user, initialZoneFilter, onOpenAuth }: ItinerariesModalProps) => {
    const { importPremadeItinerary, itinerary } = useItinerary();
    
    const [allItineraries, setAllItineraries] = useState<Partial<PremadeItinerary>[]>([]);
    const [filteredList, setFilteredList] = useState<PremadeItinerary[]>([]);
    const [selectedItinerary, setSelectedItinerary] = useState<PremadeItinerary | null>(null);
    const [isListFlipped, setIsListFlipped] = useState(false); 
    
    const [activeCategory, setActiveCategory] = useState<'official' | 'community' | 'ai'>('official');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTag, setActiveTag] = useState<string>('Tutti');
    const [filterContinent, setFilterContinent] = useState('Europa');
    const [filterNation, setFilterNation] = useState('Italia');
    const [filterRegion, setFilterRegion] = useState('Campania');
    const [filterZone, setFilterZone] = useState('');
    const [filterCity, setFilterCity] = useState('');

    const [showOverwriteWarning, setShowOverwriteWarning] = useState(false);
    const [pendingImportData, setPendingImportData] = useState<{customStays: any, startDate: string} | null>(null);
    
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, isOpen]);

    useEffect(() => {
        if (isOpen) {
            loadMetadata();
            setSelectedItinerary(null);
            setIsListFlipped(false);
            if (initialZoneFilter) setFilterZone(initialZoneFilter);
        }
    }, [isOpen, initialZoneFilter]);

    // Fetch metadata for dropdowns only once when modal opens
    const loadMetadata = async () => {
        const data = await getCommunityItinerariesMetadataAsync();
        setAllItineraries(data);
    };

    // Fetch filtered itineraries from server whenever filters change
    useEffect(() => {
        if (!isOpen) return;
        
        const fetchFilteredData = async () => {
            setIsLoading(true);
            const data = await getFilteredCommunityItinerariesAsync({
                type: activeCategory,
                status: 'published',
                continent: filterContinent || undefined,
                nation: filterNation || undefined,
                region: filterRegion || undefined,
                zone: filterZone || undefined,
                mainCity: filterCity || undefined,
                searchQuery: searchQuery || undefined,
                tag: activeTag || undefined
            });
            setFilteredList(data);
            setIsLoading(false);
        };

        // Debounce search query
        const timeoutId = setTimeout(() => {
            fetchFilteredData();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [isOpen, activeCategory, filterContinent, filterNation, filterRegion, filterZone, filterCity, searchQuery, activeTag]);

    const refreshData = async () => {
        // Trigger a re-fetch by just calling the same effect logic
        // We can just rely on the useEffect to fetch data, but if we need a manual refresh:
        setIsLoading(true);
        const data = await getFilteredCommunityItinerariesAsync({
            type: activeCategory,
            status: 'published',
            continent: filterContinent || undefined,
            nation: filterNation || undefined,
            region: filterRegion || undefined,
            zone: filterZone || undefined,
            mainCity: filterCity || undefined,
            searchQuery: searchQuery || undefined,
            tag: activeTag || undefined
        });
        setFilteredList(data);
        setIsLoading(false);
    };

    const uniqueContinents = useMemo(() => Array.from(new Set(allItineraries.map(i => i.continent).filter(Boolean) as string[])).sort(), [allItineraries]);
    const uniqueNations = useMemo(() => Array.from(new Set(allItineraries.map(i => i.nation).filter(Boolean) as string[])).sort(), [allItineraries]);
    const uniqueRegions = useMemo(() => Array.from(new Set(allItineraries.map(i => i.region).filter(Boolean) as string[])).sort(), [allItineraries]);
    const uniqueZones = useMemo(() => Array.from(new Set(allItineraries.map(i => i.zone).filter(Boolean) as string[])).sort(), [allItineraries]);
    const uniqueCities = useMemo(() => Array.from(new Set(allItineraries.map(i => i.mainCity).filter(Boolean) as string[])).sort(), [allItineraries]);
    const allTags = useMemo(() => ['Tutti', ...Array.from(new Set(allItineraries.flatMap(i => i.tags || []))).sort()], [allItineraries]);

    const handleImportRequest = (customStays: any, startDate: string) => {
        if (itinerary.items.length > 0) {
            setPendingImportData({ customStays, startDate });
            setShowOverwriteWarning(true);
        } else {
            executeImport(customStays, startDate);
        }
    };

    const executeImport = async (customStays: any, startDate: string) => {
        if (!selectedItinerary) return;
        const templateToImport = { ...selectedItinerary };
        const extraItems: any[] = [];
        Object.entries(customStays).forEach(([dayStr, value]: [string, any]) => {
            const dayIdx = parseInt(dayStr);
            if (value.start) {
                extraItems.push({ dayIndex: dayIdx, timeSlotStr: '08:00', poiId: `custom_start_${dayIdx}`, fallbackName: `${value.start.name}`, note: 'Punto di partenza selezionato' });
            }
            if (value.end) {
                extraItems.push({ dayIndex: dayIdx, timeSlotStr: '22:00', poiId: `custom_end_${dayIdx}`, fallbackName: `${value.end.name}`, note: 'Hotel selezionato per la notte' });
            }
        });
        templateToImport.items = [...templateToImport.items, ...extraItems];
        await importPremadeItinerary(templateToImport, startDate);
        setShowOverwriteWarning(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed top-24 bottom-0 left-0 right-0 z-[900] flex items-center justify-center p-0 md:p-4">
             <style>{`
                .perspective-1000 { perspective: 1000px; }
                .transform-style-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
                .rotate-y-0 { transform: rotateY(0deg); }
                
                @keyframes border-march {
                    0% { stroke-dashoffset: 0; }
                    100% { stroke-dashoffset: -20; }
                }
                .marching-ants rect {
                    animation: border-march 1s linear infinite;
                }
            `}</style>

            <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose}></div>
            
            <div className="relative bg-[#020617] w-full max-w-[98vw] h-full md:rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
                
                <div className="w-full flex justify-between items-center px-6 py-3 border-b border-slate-800 bg-[#0f172a] shrink-0 z-50">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-indigo-900/30 rounded-lg border border-indigo-500/30">
                            <Map className="w-5 h-5 text-indigo-400"/>
                        </div>
                        <div>
                            <h2 className="text-lg font-display font-bold text-white uppercase tracking-wider leading-none">Itinerari d'Autore</h2>
                            <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">Percorsi esclusivi Touring Diary</p>
                        </div>
                    </div>
                    {/* STANDARD RED CLOSE BUTTON */}
                    <button onClick={onClose} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg">
                        <X className="w-5 h-5"/>
                    </button>
                </div>

                <div className="w-full bg-slate-950 border-b border-slate-800 shrink-0 z-40 p-3 md:px-6 space-y-3">
                    <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
                        <div className="flex flex-wrap gap-1.5 items-center w-full md:w-auto">
                            <div className="flex items-center gap-1.5 shrink-0 mr-1 text-slate-600">
                                <Globe className="w-3.5 h-3.5 text-indigo-500"/>
                                <span className="text-[9px] font-black uppercase tracking-widest">Destinazione</span>
                            </div> 
                            <FilterDropdown label="Continente" options={uniqueContinents} value={filterContinent} onChange={setFilterContinent} />
                            <FilterDropdown label="Nazione" options={uniqueNations} value={filterNation} onChange={setFilterNation} />
                            <FilterDropdown label="Regione" options={uniqueRegions} value={filterRegion} onChange={setFilterRegion} />
                            <FilterDropdown label="Zona" options={uniqueZones} value={filterZone} onChange={setFilterZone} />
                            <FilterDropdown label="Città" options={uniqueCities} value={filterCity} onChange={setFilterCity} />
                        </div>
                        
                        <div className="relative w-full md:w-72 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-indigo-500 transition-colors"/>
                            <input 
                                type="text" 
                                placeholder="Cerca itinerario..." 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)} 
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1.5 pl-9 pr-8 text-xs text-white focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-600"
                            />
                            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-0.5 rounded-full"><X className="w-3 h-3"/></button>}
                        </div>
                    </div>

                    {!selectedItinerary && (
                        <div className="flex flex-col md:flex-row gap-3 justify-between items-center animate-in fade-in slide-in-from-top-1 duration-300">
                            <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 shadow-inner w-full md:w-auto">
                                {[ 
                                    { id: 'official', label: 'Touring Diary', icon: BookOpen }, 
                                    { id: 'community', label: 'Community', icon: Users }, 
                                    { id: 'ai', label: 'Smart & Trend', icon: Zap } 
                                ].map(tab => (
                                    <button key={tab.id} onClick={() => { setActiveCategory(tab.id as any); }} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all whitespace-nowrap flex-1 ${activeCategory === tab.id ? 'bg-slate-800 text-white shadow-md' : 'text-slate-600 hover:text-slate-400'}`}>
                                        <tab.icon className={`w-3 h-3 ${activeCategory === tab.id ? 'text-amber-500' : 'text-slate-700'}`}/> {tab.label}
                                    </button>
                                ))}
                            </div>
                            
                            <div className="flex gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto pb-2 md:pb-0">
                                {allTags.slice(0, 8).map(tag => (
                                    <button 
                                        key={tag} 
                                        onClick={() => setActiveTag(tag)} 
                                        className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${activeTag === tag ? 'bg-slate-100 text-slate-900 border-white' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-white'}`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-1 overflow-hidden w-full">
                    <div className={`${selectedItinerary ? 'w-full md:w-[280px] lg:w-[320px]' : 'w-full md:w-[350px] lg:w-[400px] xl:w-[440px]'} border-r border-slate-800 bg-slate-900/50 flex flex-col shrink-0 transition-all duration-500 ease-in-out`}>
                        
                        <div className="flex-1 min-h-0 relative perspective-1000">
                             <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isListFlipped ? 'rotate-y-180' : ''}`}>
                                <div className={`absolute inset-0 backface-hidden flex flex-col ${isListFlipped ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
                                    <ItinerariesList 
                                        user={user} 
                                        itineraries={filteredList}
                                        onSelect={(it) => { setSelectedItinerary(it); setIsListFlipped(true); }} 
                                        selectedId={selectedItinerary?.id}
                                        onUpdateData={refreshData}
                                    />
                                </div>
                                <div className={`absolute inset-0 backface-hidden rotate-y-180 flex flex-col ${!isListFlipped ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
                                    {selectedItinerary && (
                                        <ReviewArea 
                                            itinerary={selectedItinerary} 
                                            onBack={() => { setIsListFlipped(false); setSelectedItinerary(null); }} 
                                            user={user}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-800 bg-[#020617] relative z-20 shrink-0">
                            <div className="relative rounded-xl overflow-hidden p-5 bg-slate-900/80 group">
                                <div className="absolute inset-0 pointer-events-none">
                                    <svg width="100%" height="100%" className="marching-ants">
                                        <rect x="1" y="1" width="99.5%" height="98%" rx="12" ry="12" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="10 10" strokeLinecap="round"/>
                                    </svg>
                                </div>
                                <div className="flex gap-4 items-start relative z-10">
                                    <Lightbulb className="w-6 h-6 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                                    <div>
                                        <span className="text-amber-500 font-black uppercase text-sm tracking-wider block mb-1.5">CONSIGLIO</span>
                                        <p className="text-slate-200 text-base md:text-lg leading-relaxed font-serif italic">
                                            Sfoglia le pagine della città per scoprire tappe uniche da aggiungere al diario!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:flex flex-1 bg-[#020617] relative overflow-hidden">
                        {selectedItinerary ? (
                            <ItineraryDetail 
                                itinerary={selectedItinerary} 
                                onBack={() => { setIsListFlipped(false); setSelectedItinerary(null); }}
                                onImportConfirm={handleImportRequest}
                                userLocation={userLocation}
                                user={user}
                                onOpenAuth={onOpenAuth}
                            />
                        ) : (
                            <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 p-8 text-center bg-[#020617] animate-in fade-in">
                                <div className="p-8 rounded-full bg-slate-900/30 border border-slate-800 mb-6 animate-pulse">
                                    <Map className="w-16 h-16 opacity-20"/>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Esplora i Percorsi d'Autore</h3>
                                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed uppercase tracking-widest font-bold">Seleziona un itinerario dalla lista a sinistra per visualizzare la timeline dettagliata e gli alloggi.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showOverwriteWarning && pendingImportData && (
                <div className="absolute inset-0 z-[700] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
                    <div className="bg-slate-900 rounded-xl border border-red-500/50 p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="p-4 bg-red-500/20 rounded-full mb-4 animate-pulse"><Trash2 className="w-10 h-10 text-red-500"/></div>
                            <h3 className="text-xl font-display font-bold text-white mb-2">Attenzione: Sovrascrittura</h3>
                            <p className="text-sm text-slate-300 leading-relaxed">Hai già delle tappe nel tuo diario. Importando questo itinerario, <strong>le tappe attuali verranno cancellate</strong>.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setShowOverwriteWarning(false)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors">Annulla</button>
                            <button onClick={() => executeImport(pendingImportData.customStays, pendingImportData.startDate)} className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-red-900/20">Sovrascrivi</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ReviewArea = ({ itinerary, onBack, user }: any) => {
    return (
        <div className="h-full w-full bg-[#0f172a] flex flex-col overflow-hidden">
            <ItineraryReviews itinerary={itinerary} onBack={onBack} user={user} />
        </div>
    );
};
