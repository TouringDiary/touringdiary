


import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Star, TrendingUp, Grid, ZoomIn, ChevronLeft, ChevronRight, Award, Plus, Check, GripHorizontal, AlertTriangle } from 'lucide-react';
import { CitySummary, SponsorRequest, PointOfInterest } from '../../types/index';
import { HeroSection } from './HeroSection'; 
import { CuratedGridSection } from './CuratedGridSection';
import { CityCard } from '../city/CityCard';
import { DraggableSlider, DraggableSliderHandle } from '../common/DraggableSlider';
import { getSponsorsAsync, convertSponsorToPoi } from '../../services/sponsorService';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { useItinerary } from '../../context/ItineraryContext';
import { StarRating } from '../common/StarRating';
import { AdPlaceholder } from '../common/AdPlaceholder';
import { useDynamicStyles } from '../../hooks/useDynamicStyles';
import { useDynamicContent } from '../../hooks/useDynamicContent'; 
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useGps } from '../../context/GpsContext';

interface HeroSectionProps {
    activeCategories: string[];
    setActiveCategories: (cats: string[]) => void;
    onSelectCity: (id: string) => void;
    selectedZone: string;
    setSelectedZone: (z: string) => void;
}

interface HomeContentProps {
    heroProps: HeroSectionProps;
    featuredCities: CitySummary[];
    mostVisitedCities: CitySummary[];
    allMostVisitedCities?: CitySummary[];
    destinationCities: CitySummary[];
    onCityClick: (id: string) => void;
    onExploreSection: (cities: CitySummary[], title: string, icon: React.ReactNode, categories?: any[]) => void;
    onAddToItinerary: (poi: PointOfInterest) => void;
    onOpenPoiDetail: (poi: PointOfInterest) => void;
    onOpenSponsor: (tier?: 'gold'|'silver') => void; 
}

const ISPIRAZIONI_CATEGORIES = [
    { id: 'destination', label: 'DESTINAZIONI TOP', color: 'text-indigo-500', badge: 'destination' },
    { id: 'events', label: 'EVENTI IN ARRIVO', color: 'text-rose-500', badge: 'event' },
    { id: 'season', label: 'IDEALE PER LA STAGIONE', color: 'text-emerald-500', badge: 'season' },
    { id: 'trends', label: 'TREND DEL MESE', color: 'text-blue-500', badge: 'trend' },
    { id: 'editor', label: 'SCELTA EDITORIALE', color: 'text-purple-500', badge: 'editor' },
];

const SectionHeaderWithAction = ({ title, icon, color, onExplore, onScrollLeft, onScrollRight, subtitleConfig }: any) => {
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const titleStyle = useDynamicStyles('section_title', isMobile);
    const btnStyle = useDynamicStyles('btn_explore', isMobile);

    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-6 md:h-8 ${color} rounded-full`}></div>
                    <h3 className={`flex items-center gap-3 ${titleStyle}`}>
                        {icon}
                        {title}
                    </h3>
                </div>
                <div className="flex items-center gap-3">
                    {(onScrollLeft && onScrollRight) && (
                        <div className="flex bg-slate-900 rounded-lg border border-slate-800">
                            <button onClick={onScrollLeft} className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-white transition-colors border-r border-slate-800 rounded-l-lg"><ChevronLeft className="w-4 h-4"/></button>
                            <button onClick={onScrollRight} className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-white transition-colors rounded-r-lg"><ChevronRight className="w-4 h-4"/></button>
                        </div>
                    )}
                    <button onClick={onExplore} className={`${btnStyle} bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-amber-600 transition-colors flex items-center gap-1.5 group h-full`}>
                        <ZoomIn className="w-3.5 h-3.5 text-amber-500 group-hover:text-white transition-colors"/> ESPLORA
                    </button>
                </div>
            </div>
            {subtitleConfig?.text && (
                <p className={`${subtitleConfig.style} ml-4`}>{subtitleConfig.text}</p>
            )}
        </div>
    );
};

const EmptyFeaturedCard: React.FC<{ label: string }> = ({ label }) => (
    <div className="w-[150px] md:w-[165px] lg:w-[145px] xl:w-[165px] h-[200px] md:h-[240px] flex-shrink-0 bg-slate-900/30 rounded-xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center p-4 text-center gap-2 group hover:border-slate-600 transition-colors snap-start">
        <AlertTriangle className="w-8 h-8 text-slate-700 group-hover:text-amber-500 transition-colors"/>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
        <div className={`px-2 py-1 rounded text-[9px] font-black uppercase text-white bg-slate-800 opacity-50`}>
            DISPONIBILE
        </div>
    </div>
);

const HomeSideSponsorCard = ({ poi, onOpenDetail, onAddToItinerary, className = "" }: any) => {
    const { itinerary } = useItinerary();
    const inItinerary = itinerary.items.some((i: any) => i.poi.id === poi.id);
    const isGold = poi.tier === 'gold';
    const isSilver = poi.tier === 'silver';
    
    let borderColor = 'border border-slate-800 hover:border-slate-600';
    if (isGold) borderColor = 'border border-amber-500 hover:border-amber-400 ring-1 ring-amber-500/20';
    else if (isSilver) borderColor = 'border border-slate-200 hover:border-white ring-1 ring-white/10';

    let badge = null;
    if (isGold) badge = <span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 text-black text-[7px] font-black px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(251,191,36,0.5)] uppercase tracking-normal flex items-center gap-0.5 border border-yellow-100"><Award className="w-2 h-2"/> SPONSOR</span>;
    else if (isSilver) badge = <span className="bg-gradient-to-r from-slate-200 via-white to-slate-400 text-slate-900 text-[7px] font-black px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(255,255,255,0.2)] uppercase tracking-normal flex items-center gap-0.5 border border-white/50"><Award className="w-2 h-2"/> SPONSOR</span>;
    else badge = <span className="bg-slate-700 text-slate-300 text-[7px] font-bold px-1.5 py-0.5 rounded border border-slate-600 uppercase tracking-normal w-fit">SPONSOR</span>;

    return (
        <div 
            onClick={() => onOpenDetail(poi)}
            className={`group relative w-full h-full rounded-xl border overflow-hidden cursor-default transition-all bg-slate-900 shadow-lg shrink-0 ${borderColor} ${className}`}
        >
            <div className="absolute inset-0 w-full h-full">
                <ImageWithFallback 
                    src={poi.imageUrl} 
                    alt={poi.name} 
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100 select-none"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80 pointer-events-none"></div>
            </div>

            <div className="absolute top-2 right-2 z-20 pointer-events-none">
                {badge}
            </div>

            <div className="absolute top-3 left-4 z-20 flex flex-col items-start pr-12 pointer-events-none max-w-full">
                <div className="mb-0.5">
                    <StarRating value={poi.rating} size="w-3 h-3" showValue={false} />
                </div>
                <h4 className={`text-white font-display font-bold text-sm md:text-lg leading-tight drop-shadow-md ${isGold ? 'text-amber-50' : ''}`}>
                    {poi.name}
                </h4>
            </div>

            <div className="absolute bottom-2 right-2 z-30 flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                <div 
                    className="hidden lg:flex p-1.5 rounded-lg bg-black/50 hover:bg-indigo-600 text-slate-300 hover:text-white backdrop-blur-sm cursor-grab active:cursor-grabbing border border-white/10 transition-all shadow-lg" 
                    draggable="true" 
                    onDragStart={(e) => { 
                        e.stopPropagation(); 
                        e.dataTransfer.setData('text/plain', JSON.stringify(poi)); 
                        e.dataTransfer.effectAllowed = 'copy'; 
                    }}
                    title="Trascina nel diario"
                >
                    <GripHorizontal className="w-3.5 h-3.5"/>
                </div>
                <button 
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        e.preventDefault();
                        onAddToItinerary(poi); 
                    }}
                    className={`rounded-lg text-white shadow-lg border transition-colors cursor-pointer pointer-events-auto flex items-center justify-center w-9 h-9 ${inItinerary ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500' : 'bg-amber-600 hover:bg-amber-500 border-amber-500'}`}
                    title={inItinerary ? "Aggiunto" : "Aggiungi al diario"}
                >
                    {inItinerary ? <Check className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}
                </button>
            </div>
        </div>
    );
};

export const HomeContent = ({ heroProps, featuredCities, mostVisitedCities, allMostVisitedCities, destinationCities, onCityClick, onExploreSection, onAddToItinerary, onOpenPoiDetail, onOpenSponsor }: HomeContentProps) => {
    
    useDocumentTitle('Scopri la Campania');
    
    const { userLocation } = useGps();
    
    const featuredRef = useRef<DraggableSliderHandle>(null);
    const visitedRef = useRef<DraggableSliderHandle>(null);
    const sponsorContainerRef = useRef<HTMLDivElement>(null);
    
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const titleStyle = useDynamicStyles('section_title', isMobile);
    const btnStyle = useDynamicStyles('btn_explore', isMobile);
    
    // NEW: USE DYNAMIC CONTENT FOR SUBTITLES
    const featuredSubtitle = useDynamicContent('home_featured_subtitle', isMobile);
    const visitedSubtitle = useDynamicContent('home_visited_subtitle', isMobile);
    const inspirationSubtitle = useDynamicContent('home_inspiration_subtitle', isMobile);
    
    const [goldSponsors, setGoldSponsors] = useState<SponsorRequest[]>([]);
    const [sponsorIndex, setSponsorIndex] = useState(0);
    const [sponsorCols, setSponsorCols] = useState(1);

    const { selectedZone, activeCategories } = heroProps;

    const filteredCities = useMemo(() => {
        let data = allMostVisitedCities || mostVisitedCities || []; 
        if (selectedZone) data = data.filter(c => c.zone === selectedZone);
        if (activeCategories && activeCategories.length > 0) {
            data = data.filter(c => {
                if (c.tags && c.tags.length > 0) return activeCategories.some(cat => c.tags!.includes(cat));
                if (c.specialBadge) return true;
                return true; 
            });
        }
        return data;
    }, [allMostVisitedCities, mostVisitedCities, selectedZone, activeCategories]);

    const dynamicAllCities = filteredCities;

    useEffect(() => {
        getSponsorsAsync().then(all => {
            const today = new Date().toISOString().split('T')[0];
            const active = all.filter(s => (s.status === 'approved' || s.status === 'waiting_payment') && (!s.endDate || s.endDate >= today));
            setGoldSponsors(active.filter(s => s.tier === 'gold'));
        });
    }, []);

    useEffect(() => {
        const el = sponsorContainerRef.current;
        if (!el) return;
        const handleResize = () => {
            if (!el) return;
            const width = el.offsetWidth;
            const cols = Math.floor(width / 300);
            setSponsorCols(Math.max(1, Math.min(4, cols)));
        };
        const observer = new ResizeObserver(handleResize);
        observer.observe(el);
        handleResize();
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (goldSponsors.length <= 1) return;
        const interval = setInterval(() => {
            setSponsorIndex(prev => prev + 1);
        }, 8000); 
        return () => clearInterval(interval);
    }, [goldSponsors.length]);

    const goldGridSlots = useMemo(() => {
        const slots = [...goldSponsors.slice(0, 8)];
        while (slots.length < 8) {
            slots.push(null as any);
        }
        return slots;
    }, [goldSponsors]);

    const featuredSlots = useMemo(() => {
        if (!dynamicAllCities) return [];

        const slot1City = dynamicAllCities.find(c => c.homeOrder === 1);
        const slot2City = dynamicAllCities.find(c => c.homeOrder === 2);
        const slot3City = dynamicAllCities.find(c => c.homeOrder === 3);
        const slot4City = dynamicAllCities.find(c => c.homeOrder === 4);

        const getBadgeConfig = (city: CitySummary | undefined) => {
             const badge = city?.specialBadge;
             switch(badge) {
                 case 'event': return { id: 'event', label: 'EVENTI IN ARRIVO', color: 'bg-rose-600' };
                 case 'season': return { id: 'season', label: 'IDEALE STAGIONE', color: 'bg-emerald-600' };
                 case 'trend': return { id: 'trend', label: 'TREND DEL MESE', color: 'bg-blue-600' };
                 case 'editor': return { id: 'editor', label: 'SCELTA EDITORIALE', color: 'bg-purple-600' };
                 case 'destination': return { id: 'destination', label: 'DESTINAZIONE TOP', color: 'bg-indigo-600' };
                 default: return { id: 'destination', label: 'DESTINAZIONE TOP', color: 'bg-indigo-600' };
             }
        };
        
        const findFallback = (badge: string) => dynamicAllCities.find(c => c.specialBadge === badge && !c.homeOrder);

        const slots = [
            { city: slot1City || findFallback('event'), label: 'POSIZIONE 1' },
            { city: slot2City || findFallback('season'), label: 'POSIZIONE 2' },
            { city: slot3City || findFallback('trend'), label: 'POSIZIONE 3' },
            { city: slot4City || findFallback('editor'), label: 'POSIZIONE 4' }
        ];

        return slots.map(s => {
            if (s.city) {
                return {
                    city: s.city,
                    config: getBadgeConfig(s.city)
                };
            }
            return {
                city: null,
                config: { id: 'empty', label: s.label, color: 'bg-slate-700' }
            };
        });

    }, [dynamicAllCities]);

    const sponsorsToDisplay = useMemo(() => {
        if (goldSponsors.length === 0) return [];
        const res = [];
        const maxItems = Math.max(2, sponsorCols * 2); 
        for (let i = 0; i < maxItems; i++) {
            const s = goldSponsors[(sponsorIndex + i) % goldSponsors.length];
            if (s) res.push(s);
        }
        return res;
    }, [goldSponsors, sponsorIndex, sponsorCols]);

    const renderSponsorCell = (sponsor: SponsorRequest | null) => (
        <div className="h-full w-full">
            {sponsor ? (
                <div className="h-full animate-in fade-in duration-700" key={sponsor.id}>
                    <HomeSideSponsorCard poi={convertSponsorToPoi(sponsor)} onOpenDetail={onOpenPoiDetail} onAddToItinerary={onAddToItinerary} />
                </div>
            ) : (
                <AdPlaceholder vertical label="Partner" onClick={() => onOpenSponsor('gold')} className="h-full" />
            )}
        </div>
    );

    return (
        <div className="animate-in fade-in flex flex-col gap-0 w-full overflow-x-hidden">
            
            <div className="shrink-0 z-30 lg:sticky lg:top-0 lg:bg-[#020617] lg:pb-6 lg:pt-1 lg:border-b lg:border-slate-800/50 lg:shadow-2xl transition-all">
                 <div className="mb-4 lg:mb-0"> 
                    <HeroSection 
                        activeCategories={heroProps.activeCategories}
                        setActiveCategories={heroProps.setActiveCategories}
                        onSelectCity={heroProps.onSelectCity}
                        selectedZone={heroProps.selectedZone}
                        setSelectedZone={heroProps.setSelectedZone}
                        cityManifest={dynamicAllCities}
                    />
                 </div>
            </div>

            <div className="space-y-12 pb-10 pt-6">
                
                <section>
                    <div className="flex flex-col lg:flex-row gap-4 xl:gap-6 items-start">
                        <div id="tour-featured-section" className="min-w-0 flex flex-col gap-4 shrink-0 max-w-full relative scroll-mt-40">
                            <div className="w-full xl:max-w-[calc(4*165px+3*16px)]">
                                <div className="flex items-center justify-between h-10 mb-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 md:h-8 bg-amber-500 rounded-full"></div>
                                        <h3 className={`flex items-center gap-3 ${titleStyle}`}>
                                            <Star className="w-5 h-5 md:w-7 md:h-7 text-amber-500" /> In Evidenza
                                        </h3>
                                    </div>
                                    <div className="flex gap-2">
                                         <div className="flex bg-slate-900 rounded-lg border border-slate-800">
                                            <button onClick={() => featuredRef.current?.scroll('left')} className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-white transition-colors border-r border-slate-800 rounded-l-lg"><ChevronLeft className="w-4 h-4"/></button>
                                            <button onClick={() => featuredRef.current?.scroll('right')} className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-white transition-colors rounded-r-lg"><ChevronRight className="w-4 h-4"/></button>
                                        </div>
                                        <button onClick={() => onExploreSection(dynamicAllCities, "Ispirazioni di Viaggio", <Grid className="w-5 h-5 text-indigo-500"/>, ISPIRAZIONI_CATEGORIES)} className={`${btnStyle} text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-amber-600 transition-colors flex items-center gap-1.5 uppercase font-bold tracking-wide group shrink-0`}>
                                            <ZoomIn className="w-3.5 h-3.5 text-amber-500 group-hover:text-white transition-colors"/> ESPLORA
                                        </button>
                                    </div>
                                </div>
                                {featuredSubtitle.text && (
                                    <p className={`${featuredSubtitle.style} mb-4 ml-4`}>{featuredSubtitle.text}</p>
                                )}
                            </div>
                            
                            <div>
                                <DraggableSlider ref={featuredRef} className="pb-4">
                                    {featuredSlots.map((slot, idx) => {
                                        if (slot.city) {
                                            return (
                                                <div key={slot.city.id + slot.config.id} className="snap-start flex-shrink-0">
                                                    <CityCard 
                                                        city={slot.city} 
                                                        onClick={onCityClick} 
                                                        userLocation={userLocation}
                                                        forcedBadge={slot.config.id}
                                                        priority={idx < 2} 
                                                    />
                                                </div>
                                            );
                                        } else {
                                            return <EmptyFeaturedCard key={`empty-${idx}`} label={slot.config.label} />;
                                        }
                                    })}
                                </DraggableSlider>
                            </div>
                        </div>

                        <div ref={sponsorContainerRef} id="tour-partners" className="w-full lg:flex-1 flex justify-center min-w-0 px-2 lg:px-0">
                            <div className="flex flex-col gap-4 items-center w-full lg:w-fit">
                                <div className="flex items-center justify-center gap-2 h-10 mb-2 w-full">
                                    <div className="h-px flex-1 bg-amber-500/50"></div>
                                    <div className="flex items-center gap-2 px-2">
                                         <Award className="w-4 h-4 text-amber-500"/>
                                         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">PARTNER</span>
                                    </div>
                                    <div className="h-px flex-1 bg-amber-500/50"></div>
                                </div>
                                
                                <div className="flex justify-center gap-3 w-full">
                                    {sponsorCols >= 1 && (
                                        <div className="flex flex-col gap-3 w-full md:w-72 shrink-0 h-[280px] md:h-[240px]">
                                            {renderSponsorCell(sponsorsToDisplay[0] || null)}
                                            {renderSponsorCell(sponsorsToDisplay[1] || null)}
                                        </div>
                                    )}
                                    {sponsorCols >= 2 && (
                                        <div className="flex flex-col gap-3 w-full md:w-72 shrink-0 h-[280px] md:h-[240px]">
                                            {renderSponsorCell(sponsorsToDisplay[2] || null)}
                                            {renderSponsorCell(sponsorsToDisplay[3] || null)}
                                        </div>
                                    )}
                                    {sponsorCols >= 3 && (
                                        <div className="flex flex-col gap-3 w-full md:w-72 shrink-0 h-[280px] md:h-[240px]">
                                            {renderSponsorCell(sponsorsToDisplay[4] || null)}
                                            {renderSponsorCell(sponsorsToDisplay[5] || null)}
                                        </div>
                                    )}
                                    {sponsorCols >= 4 && (
                                        <div className="flex flex-col gap-3 w-full md:w-72 shrink-0 h-[280px] md:h-[240px]">
                                            {renderSponsorCell(sponsorsToDisplay[6] || null)}
                                            {renderSponsorCell(sponsorsToDisplay[7] || null)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="w-full max-w-[100vw] overflow-hidden">
                    <SectionHeaderWithAction 
                        title="Le Più Visitate" 
                        icon={<TrendingUp className="w-5 h-5 md:w-7 md:h-7 text-rose-500" />} 
                        color="bg-rose-500"
                        onExplore={() => onExploreSection(dynamicAllCities, "Le Più Visitate", <TrendingUp className="w-5 h-5 text-rose-500"/>)}
                        onScrollLeft={() => visitedRef.current?.scroll('left')}
                        onScrollRight={() => visitedRef.current?.scroll('right')}
                        subtitleConfig={visitedSubtitle}
                    />
                    
                    <div id="tour-most-visited-section">
                        <DraggableSlider ref={visitedRef} className="pb-4">
                            {dynamicAllCities.slice(0, 10).map((city, idx) => (
                                <div key={city.id} className="snap-start flex-shrink-0">
                                    <CityCard 
                                        city={city} 
                                        onClick={onCityClick} 
                                        userLocation={userLocation}
                                        priority={false}
                                    />
                                </div>
                            ))}
                        </DraggableSlider>
                    </div>
                </section>

                <section id="tour-categories-section" className="w-full max-w-[100vw] overflow-hidden">
                    <SectionHeaderWithAction 
                        title="Ispirazioni di Viaggio" 
                        icon={<Grid className="w-5 h-5 md:w-7 md:h-7 text-indigo-500"/>} 
                        color="bg-indigo-500" 
                        onExplore={() => onExploreSection(dynamicAllCities, "Ispirazioni di Viaggio", <Grid className="w-5 h-5 text-indigo-500"/>, ISPIRAZIONI_CATEGORIES)}
                        subtitleConfig={inspirationSubtitle}
                    />
                    <CuratedGridSection 
                        onCityClick={onCityClick} 
                        onExplore={(c, t, i) => onExploreSection(c, t, i)} 
                        cityManifest={dynamicAllCities}
                    />
                </section>

                <section className="pt-8">
                    <div className="flex items-center justify-center gap-2 h-10 mb-6">
                        <div className="h-px flex-1 bg-amber-500/50"></div>
                        <div className="flex items-center gap-2 px-2">
                             <Award className="w-4 h-4 text-amber-500"/>
                             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">PARTNER</span>
                        </div>
                        <div className="h-px flex-1 bg-amber-500/50"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                        {goldGridSlots.map((s, i) => (
                            <div key={s?.id || `empty-${i}`} className="w-full h-32 md:h-44">
                                {s ? (
                                    <HomeSideSponsorCard 
                                        poi={convertSponsorToPoi(s)} 
                                        onOpenDetail={onOpenPoiDetail} 
                                        onAddToItinerary={onAddToItinerary} 
                                    />
                                ) : (
                                    <AdPlaceholder 
                                        label="Partner Gold" 
                                        onClick={() => onOpenSponsor('gold')} 
                                        className="h-full border-amber-500/30" 
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};