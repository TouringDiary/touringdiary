
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { X, Navigation, ChevronLeft, ChevronRight, MapPin, ArrowRight, Layers, Locate, Check } from 'lucide-react';
import { CityDetails, CitySummary } from '../../types/index';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { calculateDistance } from '../../services/geo';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    currentCity: CityDetails;
    onSelectCity: (id: string) => void;
    liveManifest: CitySummary[];
    onToggleMerge?: (isActive: boolean, radius: number) => void;
    isMergeActive?: boolean;
}

export const ProvinceModal = ({ isOpen, onClose, currentCity, onSelectCity, liveManifest, onToggleMerge, isMergeActive = false }: Props) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    
    const [isDown, setIsDown] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [isDragging, setIsDragging] = useState(false); 
    
    const [maxDistance, setMaxDistance] = useState(25); // Default 25km
    const [mergeEnabled, setMergeEnabled] = useState(isMergeActive);

    const nearbyCities = useMemo(() => {
        if (!currentCity || !liveManifest) return [];

        // 1. Validazione Coordinate Origine (Se sono 0,0 non possiamo calcolare nulla)
        if (!currentCity.coords || (currentCity.coords.lat === 0 && currentCity.coords.lng === 0)) {
            return [];
        }

        return liveManifest
            .filter(c => c.id !== currentCity.id) 
            // 2. Validazione Coordinate Destinazione (Escludi città con coord 0,0 o nulle)
            .filter(c => c.coords && (c.coords.lat !== 0 || c.coords.lng !== 0))
            .map(c => {
                const dist = calculateDistance(currentCity.coords.lat, currentCity.coords.lng, c.coords.lat, c.coords.lng);
                return { ...c, distance: dist };
            })
            // 3. Filtro Raggio:
            // - distance <= maxDistance
            // - distance > 0.1 (Evita falsi positivi di calcolo o città sovrapposte erroneamente)
            .filter(c => c.distance <= maxDistance && c.distance > 0.1)
            .sort((a, b) => a.distance - b.distance);
    }, [currentCity, liveManifest, maxDistance]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: direction === 'left' ? -320 : 320, behavior: 'smooth' });
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollRef.current) return;
        setIsDown(true);
        setIsDragging(false);
        setStartX(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeft(scrollRef.current.scrollLeft);
    };
    const handleMouseLeave = () => { setIsDown(false); };
    const handleMouseUp = () => { setIsDown(false); setTimeout(() => setIsDragging(false), 0); };
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDown || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 2; 
        if (Math.abs(walk) > 5) setIsDragging(true);
        scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    const handleCardClick = (cityId: string) => {
        if (!isDragging) {
            onSelectCity(cityId);
            onClose();
        }
    };

    const handleToggle = () => {
        // Aggiorna solo lo stato locale visivo
        setMergeEnabled(!mergeEnabled);
    };

    const handleConfirm = () => {
        // Applica la logica e chiude
        if (onToggleMerge) {
            onToggleMerge(mergeEnabled, maxDistance);
        }
        onClose();
    };

    if (!isOpen) return null;

    // Altezza card sincronizzata per i bottoni laterali
    const cardHeightClass = "h-[22rem] md:h-[26rem]";

    return (
        <div className="fixed top-24 bottom-0 left-0 right-0 z-[2000] flex items-center justify-center p-0 md:p-4">
            <style>{`
                .slider-distance { -webkit-appearance: none; width: 100%; height: 4px; border-radius: 2px; background: #1e293b; outline: none; }
                /* Compass Icon SVG (Bussola) - Smaller Size (20px) */
                .slider-distance::-webkit-slider-thumb { 
                    -webkit-appearance: none; 
                    appearance: none; 
                    width: 24px; 
                    height: 24px; 
                    background-color: #0f172a; 
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23f59e0b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpolygon points='16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76' fill='%23f59e0b'/%3E%3C/svg%3E"); 
                    background-repeat: no-repeat; 
                    background-position: center; 
                    background-size: cover; 
                    cursor: grab; 
                    /* MODIFICATO: margin-top portato a -4px per abbassare l'icona rispetto alla riga */
                    margin-top: -4px; 
                    border-radius: 50%;
                    box-shadow: 0 0 10px rgba(245, 158, 11, 0.4);
                    transition: transform 0.1s; 
                    border: 2px solid #1e293b;
                }
                .slider-distance::-webkit-slider-thumb:active { cursor: grabbing; transform: scale(1.2); }
            `}</style>
            
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative bg-[#020617] w-full max-w-7xl h-full md:h-auto md:max-h-[98vh] md:rounded-3xl border-0 md:border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
                
                {/* HEADER */}
                <div className="flex justify-between items-center px-4 md:px-6 py-3 border-b border-slate-800 bg-[#020617] z-20 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-amber-500">
                            <Navigation className="w-5 h-5 transform rotate-45"/>
                        </div>
                        <div>
                            <h2 className="text-base md:text-lg font-bold text-white uppercase tracking-wide">Esplora Dintorni</h2>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Partenza da {currentCity.name}</p>
                        </div>
                    </div>
                    {/* STANDARD RED CLOSE BUTTON */}
                    <button onClick={onClose} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg">
                        <X className="w-5 h-5"/>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-[#020617] flex flex-col relative">
                    
                    {/* TOP SECTION: RAGGIO & CONTROLLI */}
                    <div className="flex flex-col xl:flex-row items-end justify-between gap-4 mb-2 w-full shrink-0">
                        
                        {/* LEFT: INFO TESTUALE INGRANDITA */}
                        <div className="flex flex-col gap-1 w-full xl:w-auto self-start xl:self-center">
                             <div className="flex items-baseline gap-2">
                                <p className="text-xl md:text-3xl text-slate-200 font-light leading-tight whitespace-nowrap">
                                    Raggio d'azione: <span className="text-white font-black">{maxDistance} km</span>
                                </p>
                            </div>
                            <span className="text-base md:text-lg text-slate-500 font-bold tracking-wide">
                                <strong className="text-indigo-400">{nearbyCities.length}</strong> città trovate
                            </span>
                        </div>

                        {/* RIGHT: SLIDER ALLARGATO & RIDISEGNATO */}
                        <div className="w-full xl:w-auto flex justify-end">
                            <div className="w-full md:w-96 bg-slate-900 px-5 py-5 rounded-xl border border-slate-700 shadow-inner relative group flex flex-col justify-center">
                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-3 tracking-widest absolute top-2 left-4 right-4">
                                    <span className="text-amber-500 font-black">ESTENDI RAGGIO &gt;</span>
                                </div>
                                
                                {/* MODIFICATO: Aggiunto pt-1 per spostare leggermente in basso la riga con i KM */}
                                <div className="flex items-center gap-3 mt-3 pt-1">
                                    <span className="text-[10px] font-bold text-slate-500 min-w-[30px]">5KM</span>
                                    <div className="relative flex-1">
                                        <input 
                                            type="range" 
                                            min="5" 
                                            max="100" 
                                            step="5" 
                                            value={maxDistance} 
                                            onChange={(e) => setMaxDistance(parseInt(e.target.value))} 
                                            className="slider-distance w-full cursor-pointer relative z-10"
                                        />
                                        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 flex justify-between pointer-events-none opacity-30 px-1">
                                            {[...Array(10)].map((_,i) => <div key={i} className="w-px h-1.5 bg-slate-400"></div>)}
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 min-w-[35px] text-right">100KM</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SEPARATOR 1 (TOP) */}
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent my-4 shrink-0"></div>

                    {/* LISTA CITTÀ (CARDS) CON FRECCE LATERALI MIGLIORATE */}
                    <div className="flex items-center gap-2 md:gap-4 shrink-0 mb-4">
                        {/* LEFT ARROW - STYLED */}
                        <button 
                            onClick={() => scroll('left')} 
                            className={`hidden md:flex items-center justify-center ${cardHeightClass} w-9 bg-slate-900 border border-slate-700 rounded-xl text-slate-400 hover:text-white hover:border-amber-500/50 hover:bg-slate-800 hover:shadow-lg hover:shadow-amber-900/20 transition-all active:scale-95 shrink-0 group/arrow`}
                        >
                            <ChevronLeft className="w-6 h-6 group-hover/arrow:-translate-x-0.5 transition-transform"/>
                        </button>

                        <div className="flex-1 overflow-hidden min-w-0">
                             {nearbyCities.length > 0 ? (
                                <div 
                                    ref={scrollRef} 
                                    onMouseDown={handleMouseDown} 
                                    onMouseLeave={handleMouseLeave} 
                                    onMouseUp={handleMouseUp} 
                                    onMouseMove={handleMouseMove} 
                                    className={`flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-hide snap-x ${isDown ? 'cursor-grabbing snap-none' : 'cursor-grab snap-mandatory'}`}
                                >
                                    {nearbyCities.map(city => (
                                        <div 
                                            key={city.id} 
                                            onClick={() => handleCardClick(city.id)} 
                                            className={`snap-center flex-shrink-0 w-60 md:w-72 ${cardHeightClass} bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden cursor-pointer group hover:border-amber-500/50 transition-all hover:shadow-2xl hover:shadow-amber-900/10 relative flex flex-col hover:-translate-y-1`}
                                        >
                                            {/* IMMAGINE CITTÀ */}
                                            <div className="h-36 md:h-44 overflow-hidden relative border-b border-slate-800 shrink-0">
                                                <ImageWithFallback src={city.imageUrl} alt={city.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"/>
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80"></div>
                                                
                                                <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold text-amber-400 border border-amber-500/30 shadow-lg flex items-center gap-1">
                                                    <Navigation className="w-2.5 h-2.5 fill-current transform rotate-45"/> 
                                                    {city.distance.toFixed(1)} km
                                                </div>
                                            </div>

                                            {/* CONTENUTO */}
                                            <div className="p-3 md:p-4 flex-1 flex flex-col bg-slate-900 min-h-0">
                                                <div className="h-5 mb-0.5 overflow-hidden shrink-0">
                                                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded border border-slate-700/50 whitespace-nowrap">
                                                        {city.zone}
                                                    </span>
                                                </div>
                                                
                                                <div className="mb-0.5 shrink-0">
                                                    {/* MODIFICATO: Font size aumentato */}
                                                    <h4 className="font-display font-bold text-white text-lg md:text-xl group-hover:text-amber-400 transition-colors leading-tight line-clamp-1">
                                                        {city.name}
                                                    </h4>
                                                </div>

                                                <div className="flex-1 min-h-0">
                                                    {/* MODIFICATO: line-clamp aumentato a 4 per permettere più righe */}
                                                    <p className="text-xs md:text-sm text-slate-400 line-clamp-4 leading-relaxed">
                                                        {city.description}
                                                    </p>
                                                </div>

                                                <div className="pt-2 mt-auto border-t border-slate-800 flex items-center justify-between h-8 shrink-0">
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors">Visita</span>
                                                    <div className="bg-slate-800 p-1 rounded-full text-slate-400 group-hover:bg-amber-600 group-hover:text-white transition-all transform group-hover:translate-x-1">
                                                        <ArrowRight className="w-3 h-3"/>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 md:py-20 text-slate-500 italic bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed flex flex-col items-center justify-center gap-4 mx-auto w-full h-full">
                                    <div className="p-3 bg-slate-900 rounded-full border border-slate-800 shadow-xl"><MapPin className="w-8 h-8 opacity-30"/></div>
                                    <div>
                                        <p className="text-base font-medium text-slate-300">Nessuna città nel raggio selezionato ({maxDistance} km).</p>
                                        <p className="text-xs mt-0.5">Prova ad aumentare il raggio o controlla che le città vicine siano geolocalizzate.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT ARROW - STYLED */}
                         <button 
                            onClick={() => scroll('right')} 
                            className={`hidden md:flex items-center justify-center ${cardHeightClass} w-9 bg-slate-900 border border-slate-700 rounded-xl text-slate-400 hover:text-white hover:border-amber-500/50 hover:bg-slate-800 hover:shadow-lg hover:shadow-amber-900/20 transition-all active:scale-95 shrink-0 group/arrow`}
                        >
                            <ChevronRight className="w-6 h-6 group-hover/arrow:translate-x-0.5 transition-transform"/>
                        </button>
                    </div>

                    {/* SEPARATOR 2 (BOTTOM) */}
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent my-4 shrink-0"></div>

                    {/* BOTTOM: ROW WITH TOGGLE AND OK BUTTON */}
                    <div className="flex items-stretch gap-3 mb-2">
                        {/* TOGGLE "TUTTO INCLUSO" (COMPATTATO E UNA RIGA) */}
                        <div 
                            onClick={handleToggle}
                            className={`flex-1 flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all shadow-lg group hover:border-indigo-500/50 ${mergeEnabled ? 'bg-indigo-900/10 border-indigo-500/40' : 'bg-slate-900 border-slate-800'}`}
                        >
                            {/* SWITCH UI - COMPACT */}
                            <div className={`w-11 h-6 rounded-full p-1 transition-colors flex items-center shrink-0 ${mergeEnabled ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300 ${mergeEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                            </div>

                            {/* TEXT CONTENT - SINGLE LINE */}
                            <div className="flex-1 flex items-center gap-3 overflow-hidden">
                                <div className="flex items-center gap-2 shrink-0">
                                    <h4 className={`text-sm md:text-base font-bold uppercase tracking-wide whitespace-nowrap ${mergeEnabled ? 'text-indigo-300' : 'text-white'}`}>
                                        Modalità "Tutto Incluso"
                                    </h4>
                                    {mergeEnabled && <Layers className="w-4 h-4 text-indigo-400 animate-pulse"/>}
                                </div>
                                <div className="w-px h-4 bg-slate-700 shrink-0"></div>
                                <p className="text-xs md:text-sm text-slate-300 leading-none truncate w-full">
                                    Touring Diary fonderà i contenuti delle città nei "DINTORNI" in un'unica lista esplorabile.
                                </p>
                            </div>
                        </div>

                        {/* TASTO OK - RESTYLING "PIÙ DECENTE" */}
                        <button
                            onClick={handleConfirm}
                            className="px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            OK <Check className="w-5 h-5"/>
                        </button>
                    </div>

                    {/* SUGGERIMENTO SMART (SENZA BOX, SOLO TESTO) - ICONA CORRETTA */}
                    <div className="flex items-center gap-2 text-xs text-slate-100 w-full md:w-fit mx-auto md:mx-0 mt-2 px-2">
                         <MapPin className="w-4 h-4 text-emerald-500"/>
                         <span><strong className="text-white">Suggerimento Smart:</strong> Attiva il GPS dal menu in alto per calcolare le distanze reali nel contesto unificato.</span>
                    </div>

                </div>
            </div>
        </div>
    );
};
