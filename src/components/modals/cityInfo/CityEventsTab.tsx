
import React, { useState } from 'react';
import { Filter, LayoutGrid, ChevronRight, Calendar, Plus, Check, ChevronUp, ChevronDown, MapPin } from 'lucide-react';
import { CityDetails, PointOfInterest } from '../../../types/index';
import { useItinerary } from '../../../context/ItineraryContext';

interface Props {
    city: CityDetails;
    onAddToItinerary: (poi: PointOfInterest) => void;
    isMobile: boolean;
    setMobileView: (view: 'menu' | 'content') => void;
    mobileView?: 'menu' | 'content'; // Add mobileView prop
}

export const CityEventsTab = ({ city, onAddToItinerary, isMobile, setMobileView, mobileView }: Props) => {
    const { itinerary } = useItinerary();
    const [activeEventFilter, setActiveEventFilter] = useState<string>('Tutti');
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

    const getEventCategories = () => {
        const events = city.details.events || [];
        const groups = new Set<string>();
        events.forEach(e => groups.add(e.category));
        return Array.from(groups).sort();
    };

    const isItemInItinerary = (id: string) => itinerary.items.some(i => i.poi.id === id);

    const renderSidebar = () => {
        const eventCats = getEventCategories();
        return (
            <div className="h-full flex flex-col">
                <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                    <Filter className="w-5 h-5 text-amber-500"/>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">Filtra Eventi</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                     <button 
                        onClick={() => { setActiveEventFilter('Tutti'); setMobileView('content'); }}
                        className={`w-full text-left p-4 rounded-2xl flex items-center justify-between transition-all ${activeEventFilter === 'Tutti' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
                     >
                        <span className="text-sm font-bold uppercase tracking-wide">Tutti</span>
                        <LayoutGrid className="w-5 h-5 opacity-50"/>
                     </button>
                     
                     {eventCats.map(cat => (
                         <button 
                            key={cat}
                            onClick={() => { setActiveEventFilter(cat); setMobileView('content'); }}
                            className={`w-full text-left p-4 rounded-2xl flex items-center justify-between transition-all ${activeEventFilter === cat ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
                         >
                            <span className="text-sm font-bold uppercase tracking-wide truncate pr-2">{cat}</span>
                            <ChevronRight className={`w-5 h-5 opacity-50 ${activeEventFilter === cat ? 'text-white' : ''}`}/>
                         </button>
                     ))}
                </div>
            </div>
        );
    };

    const renderEventsContent = () => {
        const events = city.details.events || [];
        const filteredEvents = activeEventFilter === 'Tutti' ? events : events.filter(e => e.category === activeEventFilter);

        const handleAddEvent = (e: React.MouseEvent, item: any) => {
            e.stopPropagation();
            const poi: PointOfInterest = {
                id: item.id,
                name: item.name,
                category: 'leisure',
                description: `${item.date} - ${item.description}`,
                address: item.location, 
                imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1533174072545-e8d4aa97d848?q=80&w=400',
                coords: item.coords || { lat: 0, lng: 0 },
                rating: 0,
                votes: 0
            };
            onAddToItinerary(poi);
        };

        return (
            <div className="h-full overflow-y-auto custom-scrollbar p-6 md:p-10 space-y-6 animate-in fade-in bg-[#020617]">
                 <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-800">
                    <Calendar className="w-6 h-6 text-rose-500"/>
                    <h3 className="text-2xl font-display font-bold uppercase tracking-wide text-white">Eventi Locali</h3>
                </div>

                {filteredEvents.map((item: any) => {
                    const isExpanded = expandedItemId === item.id;
                    const isAdded = isItemInItinerary(item.id);
                    
                    return (
                        <div key={item.id} className={`bg-slate-900 border rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded ? 'border-rose-500 shadow-xl bg-slate-900' : 'border-slate-800 hover:border-slate-600'}`}>
                            <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => setExpandedItemId(isExpanded ? null : item.id)}>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] bg-rose-900/30 text-rose-300 border border-rose-500/20 px-2 py-0.5 rounded uppercase font-bold">{item.category}</span>
                                        <span className="text-[10px] text-slate-500 font-mono font-bold uppercase">{item.date}</span>
                                    </div>
                                    <h4 className={`font-bold text-base md:text-lg truncate ${isExpanded ? 'text-white' : 'text-slate-200'}`}>{item.name}</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                     <button 
                                        onClick={(e) => handleAddEvent(e, item)}
                                        className={`px-3 py-2 rounded-lg border transition-all flex items-center gap-1 uppercase font-bold text-[10px] tracking-wide ${isAdded ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-amber-600 border-amber-500 text-white hover:bg-amber-500'}`}
                                    >
                                        {isAdded ? <Check className="w-5 h-5"/> : <Plus className="w-5 h-5"/>}
                                        {isAdded ? 'AGGIUNTO' : 'AGGIUNGI'}
                                    </button>
                                    <button className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors">
                                        {isExpanded ? <ChevronUp className="w-6 h-6 text-rose-400"/> : <ChevronDown className="w-6 h-6"/>}
                                    </button>
                                </div>
                            </div>
                            
                            {isExpanded && (
                                <div className="px-5 pb-5 pt-0 border-t border-slate-800/50 mt-2 animate-in slide-in-from-top-2">
                                    <div className="mt-4">
                                        <div className="space-y-3">
                                            <p className="text-base text-slate-300 leading-relaxed">{item.description || "Nessuna descrizione disponibile."}</p>
                                            {item.location && (
                                                <div className="flex items-center gap-2 text-sm text-slate-400 mt-2 bg-slate-950 p-2 rounded-lg border border-slate-800 w-fit">
                                                    <MapPin className="w-4 h-4 text-amber-500"/> {item.location}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                 {filteredEvents.length === 0 && <div className="text-center py-20 text-slate-500 italic bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">Nessun evento trovato.</div>}
            </div>
        );
    };

    return (
        <>
            {/* FIXED: Check mobileView prop instead of activeEventFilter for CSS transition */}
            <div className={`md:w-80 border-r border-slate-800 bg-[#0b0f1a] flex flex-col shrink-0 absolute md:relative inset-0 z-20 md:z-0 transition-transform duration-300 ${isMobile && mobileView === 'content' ? '-translate-x-full' : 'translate-x-0'}`}>
                {renderSidebar()}
            </div>
            
            {/* FIXED: Check mobileView prop instead of activeEventFilter for CSS transition */}
            <div className={`flex-1 bg-[#020617] flex flex-col min-w-0 absolute md:relative inset-0 z-10 md:z-0 transition-transform duration-300 ${isMobile && mobileView !== 'content' ? 'translate-x-full' : 'translate-x-0'}`}>
                <div className="flex-1 overflow-hidden relative">
                    {renderEventsContent()}
                </div>
            </div>
        </>
    );
};
