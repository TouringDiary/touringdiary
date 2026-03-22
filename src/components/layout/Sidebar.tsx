
import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { Map, Users, ArrowUpRight, Sun, Star, Snowflake, Waves, Mountain, Droplets, Wind, Castle, Bot, Sparkles, Leaf, Flower, Award, GripHorizontal, Plus, Check, BookOpen, ChevronDown, CloudSun, X, MapPin, Loader2 } from 'lucide-react';
import { PointOfInterest, SponsorRequest } from '@/types';
import { AdPlaceholder } from '@/components/common/AdPlaceholder';
import { formatVisitors } from '@/utils/common';
import { WeatherWidget } from '@/components/city/WeatherWidget';
import { useItinerary } from '@/context/ItineraryContext';
import { useModal } from '@/context/ModalContext'; 
import { getSponsorsAsync, convertSponsorToPoi } from '@/services/sponsorService'; 
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { StarRating } from '@/components/common/StarRating';

// CONTEXT CONSUMER
import { useUser } from '@/context/UserContext';
import { useGps } from '@/context/GpsContext';
import { useUI } from '@/context/UIContext';
import { useNavigation } from '@/context/NavigationContext';
import { useDiaryInteractionsContext } from '@/context/DiaryInteractionContext';

// --- LAZY IMPORT DEL DIARIO ---
const TravelDiary = React.lazy(() => import('@/components/features/diary/TravelDiary').then(module => ({ default: module.TravelDiary })));

const DiarySkeleton = () => (
    <div className="h-full flex flex-col bg-[#e7e5e4] p-4 animate-pulse rounded-sm border border-slate-600">
        <div className="h-8 bg-stone-300 rounded mb-4 w-3/4"></div>
        <div className="flex gap-2 mb-6">
            <div className="h-8 bg-stone-300 rounded flex-1"></div>
            <div className="h-8 bg-stone-300 rounded flex-1"></div>
        </div>
        <div className="space-y-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-stone-300 rounded-xl"></div>
            ))}
        </div>
        <div className="mt-auto flex justify-center text-stone-500 items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin"/>
            <span className="text-xs font-bold uppercase tracking-widest">Caricamento Diario...</span>
        </div>
    </div>
);

export interface SidebarProps {
    // Props residue solo se necessarie
    onViewPoiDetail: (poi: PointOfInterest) => void;
    onDayDrop: (dayIndex: number, data: string, targetTime?: string) => void;
    onOpenFullRankings: () => void;
    onOpenSponsor: () => void;
    onOpenGlobal: (section: 'itineraries' | 'community' | 'sponsors' | 'around_me') => void;
    onPrint: () => void;
    onCityClick: (id: string) => void;
    externalZoneFilter?: string;
    activeCityId?: string | null;
    onAddToItinerary?: (poi: PointOfInterest) => void;
    onOpenAiPlanner?: () => void; 
    onOpenRoadbook?: () => void;
}

export const Sidebar = ({ 
    onViewPoiDetail, onDayDrop, onOpenFullRankings, onOpenSponsor, onOpenGlobal, 
    onPrint, onCityClick, externalZoneFilter, activeCityId,
    onAddToItinerary,
    onOpenAiPlanner,
    onOpenRoadbook
}: SidebarProps) => {
    
    // CONSUME CONTEXTS
    const { user, cityManifest, setUser } = useUser();
    const { userLocation } = useGps();
    const { mobileShowWeather, setMobileShowWeather, mobileDiaryFullScreen, setMobileDiaryFullScreen } = useUI();
    const { itinerary } = useItinerary();
    const { openModal } = useModal(); 
    
    const [rankingSource, setRankingSource] = useState<'mix' | 'ai' | 'users'>('mix');
    const [activeContext, setActiveContext] = useState<string | null>(null);
    const [hoverInspiration, setHoverInspiration] = useState<string | null>(null);
    const [hoverSeason, setHoverSeason] = useState<string | null>(null);
    const [goldSponsors, setGoldSponsors] = useState<SponsorRequest[]>([]);
    const [sponsorIndex, setSponsorIndex] = useState(0);

    useEffect(() => {
        getSponsorsAsync().then(all => {
            const gold = all.filter(s => s.tier === 'gold' && (s.status === 'approved' || s.status === 'waiting_payment'));
            const shuffled = [...gold].sort(() => 0.5 - Math.random());
            setGoldSponsors(shuffled);
        });
    }, []);

    useEffect(() => {
        if (goldSponsors.length > 1) {
            const interval = setInterval(() => setSponsorIndex(prev => (prev + 1) % goldSponsors.length), 10000); 
            return () => clearInterval(interval);
        }
    }, [goldSponsors]);

    const sidebarSponsor = useMemo(() => goldSponsors.length === 0 ? null : goldSponsors[sponsorIndex % goldSponsors.length], [goldSponsors, sponsorIndex]);
    const activeCity = useMemo(() => activeCityId ? cityManifest.find(c => c.id === activeCityId) : null, [activeCityId, cityManifest]);

    const topCities = useMemo(() => {
        let sorted = cityManifest.filter(c => c.status === 'published');
        
        if (externalZoneFilter) sorted = sorted.filter(c => c.zone === externalZoneFilter);
        if (activeContext) {
             switch(activeContext) {
                case 'sea': sorted = sorted.filter(c => c.tags?.includes('Mare') || c.zone.includes('Costiera') || c.zone.includes('Isole')); break;
                case 'mountain': sorted = sorted.filter(c => c.tags?.includes('Entroterra') || c.zone.includes('Irpinia')); break;
                case 'lakes': sorted = sorted.filter(c => c.tags?.includes('Natura') && c.zone.includes('Entroterra')); break;
                case 'rivers': sorted = sorted.filter(c => c.tags?.includes('Natura')); break;
                case 'villages': sorted = sorted.filter(c => c.tags?.includes('Storia') && !c.isFeatured); break;
                case 'discovery': sorted = sorted.filter(c => c.specialBadge === 'event' || c.specialBadge === 'trend' || c.tags?.includes('Novità')); break;
                case 'summer': sorted = sorted.filter(c => c.specialBadge === 'season' || c.tags?.includes('Mare')); break;
                case 'spring': sorted = sorted.filter(c => c.tags?.includes('Natura') || c.tags?.includes('Fiori')); break;
                case 'winter': sorted = sorted.filter(c => c.tags?.includes('Luci') || c.tags?.includes('Mistero')); break;
                case 'autumn': sorted = sorted.filter(c => c.tags?.includes('Vino') || c.tags?.includes('Entroterra')); break;
            }
        }
        if (rankingSource === 'ai') sorted.sort((a,b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0) || b.rating - a.rating);
        else if (rankingSource === 'users') sorted.sort((a,b) => b.visitors - a.visitors);
        else sorted.sort((a,b) => b.rating - a.rating);
        
        if (sorted.length === 0 && !externalZoneFilter) {
            sorted = cityManifest.filter(c => c.status === 'published').slice(0, 5);
        }
        
        return sorted.slice(0, 5);
    }, [rankingSource, activeContext, externalZoneFilter, cityManifest]);

    const sponsorPoi = useMemo(() => sidebarSponsor ? convertSponsorToPoi(sidebarSponsor) : null, [sidebarSponsor]);
    const isSponsorInItinerary = sponsorPoi ? itinerary.items.some(i => i.poi.id === sponsorPoi.id) : false;

    if (mobileShowWeather) {
        return (
            <div className="fixed inset-0 bottom-16 z-[1200] bg-slate-950 p-4 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
                <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-6 shrink-0">
                    <h3 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                        <CloudSun className="w-7 h-7 text-sky-500"/> Meteo Locale
                    </h3>
                    <button onClick={() => setMobileShowWeather?.(false)} className="p-2 bg-slate-800 rounded-full text-slate-400"><X className="w-5 h-5"/></button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {activeCityId && activeCity ? <WeatherWidget city={activeCity} startDate={itinerary.startDate} endDate={itinerary.endDate} /> : <div className="text-center text-slate-500 py-20 italic">Seleziona una città per il meteo.</div>}
                </div>
            </div>
        );
    }

    if (mobileDiaryFullScreen) {
        return (
            <div 
                id="tour-mobile-diary-overlay" 
                className="fixed inset-0 bottom-0 z-[1200] bg-slate-950 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5"
            >
                <div className="flex-1 flex flex-col min-h-0 relative">
                    <Suspense fallback={<DiarySkeleton />}>
                        <TravelDiary 
                            user={user} 
                            onViewDetail={(poi) => openModal('poiDetail', { poi })} 
                            onDayDrop={onDayDrop} 
                            onPrint={onPrint} 
                            userLocation={userLocation} 
                            onCityClick={onCityClick} 
                            onOpenAiPlanner={onOpenAiPlanner}
                            onOpenRoadbook={onOpenRoadbook} 
                            onUserUpdate={setUser} 
                            cityManifest={cityManifest} 
                        />
                    </Suspense>
                </div>

                <div 
                    className="h-12 bg-slate-900 border-t border-b border-slate-800 flex items-center justify-center px-4 shrink-0 cursor-pointer active:bg-slate-800 transition-colors shadow-md z-50 relative"
                    onClick={() => setMobileDiaryFullScreen?.(false)}
                >
                     <div className="flex items-center gap-3">
                        <ChevronDown className="w-5 h-5 text-amber-500"/>
                        <span className="font-handwriting text-xl font-bold text-white pt-1">
                            Nascondi Diario
                        </span>
                        <ChevronDown className="w-5 h-5 text-amber-500"/>
                     </div>
                </div>

                {sponsorPoi && (
                    <div className="px-3 py-2 shrink-0 bg-slate-950 border-t-2 border-slate-800 shadow-[0_-15px_30px_rgba(0,0,0,0.8)] mt-1 mb-safe">
                        <div onClick={() => openModal('poiDetail', { poi: sponsorPoi })} className="bg-slate-900 rounded-2xl border border-amber-500/60 p-2 flex items-center gap-3 relative overflow-hidden group shadow-2xl">
                             <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-800">
                                <img src={sponsorPoi.imageUrl} className="w-full h-full object-cover" alt={sponsorPoi.name}/>
                             </div>
                             <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-1.5 mb-0.5">
                                     <Award className="w-2.5 h-2.5 text-amber-500"/>
                                     <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest leading-none">Partner d'Eccellenza</span>
                                 </div>
                                 <div className="mb-0.5"><StarRating value={sponsorPoi.rating} size="w-2 h-2" showValue={false}/></div>
                                 <h4 className="text-white font-bold text-sm truncate leading-none mb-1">{sponsorPoi.name}</h4>
                             </div>
                             <button onClick={(e) => { e.stopPropagation(); openModal('add', { poi: sponsorPoi }); }} className={`p-2 rounded-xl transition-all shadow-lg border flex items-center justify-center w-9 h-9 ${isSponsorInItinerary ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-amber-600 border-amber-500 text-white active:scale-95'}`}>
                                {isSponsorInItinerary ? <Check className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}
                             </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- STANDARD DESKTOP SIDEBAR ---
    return (
        <div id="tour-sidebar" className="hidden lg:flex flex-col h-full overflow-hidden px-3 pb-4 gap-3">
            
            {/* 1. GLOBAL BUTTONS */}
            <div id="tour-sidebar-buttons" className="grid grid-cols-3 gap-2 flex-shrink-0">
                 <button onClick={() => openModal('itineraries')} className="bg-slate-900 hover:bg-slate-800 py-1.5 px-2 rounded-lg border border-slate-800 hover:border-amber-500/50 transition-all flex items-center justify-center gap-1.5 group h-8 min-w-0"><Map className="w-3.5 h-3.5 text-amber-500"/><span className="text-[9px] uppercase font-bold text-slate-400 group-hover:text-white truncate">Itinerari</span></button>
                 <button onClick={() => onOpenGlobal('community')} className="bg-slate-900 hover:bg-slate-800 py-1.5 px-2 rounded-lg border border-slate-800 hover:border-emerald-500 transition-all flex items-center justify-center gap-1.5 group h-8 min-w-0"><Users className="w-3.5 h-3.5 text-emerald-500"/><span className="text-[9px] uppercase font-bold text-slate-400 group-hover:text-white truncate">Community</span></button>
                 <button onClick={() => openModal('aroundMe')} className="bg-slate-900 hover:bg-slate-800 py-1.5 px-2 rounded-lg border border-slate-800 hover:border-blue-500/50 transition-all flex items-center justify-center gap-1.5 group h-8 min-w-0">
                    <div className="relative w-4 h-4 flex items-center justify-center">
                        <div className="absolute inset-0 border border-blue-500 rounded-full animate-spin-slow border-t-transparent opacity-70"></div>
                        <MapPin className="w-2.5 h-2.5 text-blue-500 fill-current"/>
                    </div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 group-hover:text-white truncate">Around Me</span>
                </button>
            </div>

            {/* 2. TOP WIDGET (Weather / Rankings) */}
            <div className="flex-shrink-0 h-auto">
                {activeCityId && activeCity ? (
                    <WeatherWidget city={activeCity} startDate={itinerary.startDate} endDate={itinerary.endDate} />
                ) : (
                <div id="tour-sidebar-rankings" className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm flex flex-col h-[13rem] w-full">
                    <div className="flex border-b border-slate-800 bg-slate-950/50 flex-shrink-0">
                        {[{ id: 'mix', label: 'Mix', icon: Star }, { id: 'ai', label: 'AI', icon: Bot }, { id: 'users', label: 'User', icon: Users }].map(opt => (
                            <button key={opt.id} onClick={() => setRankingSource(opt.id as any)} className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${rankingSource === opt.id ? 'bg-slate-800 text-amber-500 border-b-2 border-amber-500' : 'text-amber-500 hover:text-amber-400'}`}><opt.icon className={`w-3.5 h-3.5 ${rankingSource === opt.id ? 'text-amber-400' : 'text-slate-600'}`} /> {opt.label}</button>
                        ))}
                    </div>
                    <div className="flex flex-1 min-h-0">
                        <div className="w-[55%] flex flex-col border-r border-slate-800 bg-slate-900">
                            <div className="px-3 py-1 border-b border-slate-800/50 flex justify-center items-center bg-slate-950/20 relative flex-shrink-0">
                                <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest text-center">{externalZoneFilter ? 'TOP 5 ZONA' : 'TOP 5'}</span>
                                <button onClick={onOpenFullRankings} className="group/arrow p-1 hover:bg-slate-800 rounded absolute right-1 top-0.5"><ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover/arrow:text-amber-500" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {topCities.map((c, i) => (
                                    <div key={c.id} onClick={() => onCityClick(c.id)} className="grid grid-cols-[1.2rem_1fr_auto_auto] gap-2 items-center px-3 py-1 hover:bg-slate-800/50 transition-colors cursor-pointer group border-b border-slate-800/30 last:border-0 h-7">
                                        <span className={`text-[9px] font-black ${i < 3 ? 'text-amber-500' : 'text-slate-600'}`}>#{i + 1}</span>
                                        <span className="text-[9px] font-bold text-slate-200 truncate min-w-0" title={c.name}>{c.name}</span>
                                        <span className="text-[8px] font-bold text-slate-500 font-mono text-right w-[22px]">{formatVisitors(c.visitors)}</span>
                                        <div className="flex items-center gap-0.5 justify-end w-[26px]">
                                            <span className="text-[8px] font-bold text-white font-mono">{c.rating}</span>
                                            <Star className="w-2 h-2 text-amber-500 fill-amber-500"/>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="w-[45%] flex flex-col bg-slate-900 h-full">
                            <div className="flex-[1.2] flex flex-col min-h-0">
                                <div className="text-[9px] uppercase font-bold text-amber-500 text-center py-1 bg-slate-950/30 flex-shrink-0 tracking-widest border-b border-slate-800/30"><span>{hoverInspiration || "ISPIRAZIONE"}</span></div>
                                <div className="grid grid-cols-3 grid-rows-2 flex-1 border-slate-800">
                                    {[{ id: 'sea', label: 'Mare', icon: Waves, color: 'text-cyan-400' }, { id: 'mountain', label: 'Monti', icon: Mountain, color: 'text-stone-400' }, { id: 'lakes', label: 'Laghi', icon: Droplets, color: 'text-blue-400' }, { id: 'rivers', label: 'Fiumi', icon: Wind, color: 'text-sky-300' }, { id: 'villages', label: 'Borghi', icon: Castle, color: 'text-amber-600' }, { id: 'discovery', label: 'Novità', icon: Sparkles, color: 'text-purple-400' }].map(f => (
                                        <button key={f.id} onClick={() => setActiveContext(activeContext === f.id ? null : f.id)} onMouseEnter={() => setHoverInspiration(f.label)} onMouseLeave={() => setHoverInspiration(null)} className={`flex items-center justify-center border-r border-b border-slate-800 ${activeContext === f.id ? 'bg-slate-800' : 'bg-slate-900 hover:bg-slate-800 text-slate-500 hover:text-slate-300'}`}><f.icon className={`w-3.5 h-3.5 ${activeContext === f.id ? f.color : ''}`} /></button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col min-h-0 border-t border-slate-800">
                                <div className="text-[9px] uppercase font-bold text-amber-500 text-center py-1 bg-slate-950/30 flex-shrink-0 tracking-widest border-b border-slate-800/30"><span>{hoverSeason || "STAGIONE"}</span></div>
                                <div className="grid grid-cols-2 grid-rows-2 flex-1">
                                    {[{ id: 'summer', label: 'Estate', icon: Sun, color: 'text-amber-400' }, { id: 'spring', label: 'Primav.', icon: Flower, color: 'text-emerald-400' }, { id: 'winter', label: 'Inverno', icon: Snowflake, color: 'text-cyan-400' }, { id: 'autumn', label: 'Autunno', icon: Leaf, color: 'text-orange-500' }].map(f => (
                                        <button key={f.id} onClick={() => setActiveContext(activeContext === f.id ? null : f.id)} onMouseEnter={() => setHoverSeason(f.label)} onMouseLeave={() => setHoverSeason(null)} className={`flex items-center justify-center border-r border-b border-slate-800 ${activeContext === f.id ? 'bg-slate-800' : 'bg-slate-900 hover:bg-slate-800 text-slate-500 hover:text-slate-300'}`}><f.icon className={`w-3.5 h-3.5 ${activeContext === f.id ? f.color : ''}`} /></button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                )}
            </div>

            {/* 3. DIARY (FLEXIBLE - MIDDLE) - LAZY LOADED SUSPENSE WRAPPER */}
            <div id="tour-diary-panel" className="flex-1 min-h-0 flex-col flex overflow-hidden">
                <Suspense fallback={<DiarySkeleton />}>
                    <TravelDiary 
                        user={user} 
                        onViewDetail={(poi) => openModal('poiDetail', { poi })} 
                        onDayDrop={onDayDrop} 
                        onPrint={onPrint} 
                        userLocation={userLocation} 
                        onCityClick={onCityClick} 
                        onOpenAiPlanner={onOpenAiPlanner} 
                        onOpenRoadbook={onOpenRoadbook} 
                        onUserUpdate={setUser} 
                        cityManifest={cityManifest}
                    />
                </Suspense>
            </div>
            
            {/* 4. SPONSOR BOTTOM */}
            <div id="tour-sponsor-box" className="mt-auto flex-shrink-0">
                {sponsorPoi && sidebarSponsor ? (
                    <div onClick={() => openModal('poiDetail', { poi: sponsorPoi })} className="bg-slate-900 rounded-xl border border-amber-500 hover:border-amber-400 transition-all cursor-pointer overflow-hidden relative group h-20 shadow-lg animate-in fade-in">
                        <ImageWithFallback src={sponsorPoi.imageUrl} alt={sponsorPoi.name} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"/>
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/50 to-transparent"></div>
                        <div className="absolute top-1.5 right-1.5 z-10"><span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 text-black text-[8px] font-bold px-1.5 py-0.5 rounded shadow-lg uppercase tracking-normal flex items-center gap-0.5 border border-yellow-100"><Award className="w-2.5 h-2.5"/> SPONSOR</span></div>
                        <div className="absolute top-1.5 left-3 z-10 pr-16 max-w-full">
                            <div className="mb-0.5"><StarRating value={sponsorPoi.rating} size="w-2.5 h-2.5" showValue={false} /></div>
                            <h4 className="text-white font-bold text-sm leading-tight truncate">{sponsorPoi.name}</h4>
                        </div>
                        <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div 
                                className="hidden lg:block p-1.5 rounded-lg bg-black/60 hover:bg-indigo-600 text-white cursor-grab active:cursor-grabbing border border-white/20 transition-all" 
                                draggable="true" 
                                onDragStart={(e) => { 
                                    e.stopPropagation(); 
                                    e.dataTransfer.setData('text/plain', JSON.stringify(sponsorPoi)); 
                                    e.dataTransfer.effectAllowed = 'copy'; 
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openModal('add', { poi: sponsorPoi });
                                }}
                                title="Trascina nel diario o clicca per aggiungere"
                            >
                                <GripHorizontal className="w-4 h-4"/>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); openModal('add', { poi: sponsorPoi }); }} className={`p-1.5 rounded-lg border transition-colors flex items-center justify-center w-8 h-8 ${isSponsorInItinerary ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-amber-600 hover:bg-amber-500 border-amber-500 text-white'}`}>{isSponsorInItinerary ? <Check className="w-3.5 h-3.5"/> : <Plus className="w-3.5 h-3.5"/>}</button>
                        </div>
                    </div>
                ) : <AdPlaceholder vertical className="h-16" onClick={onOpenSponsor}/>}
            </div>
        </div>
    );
};
