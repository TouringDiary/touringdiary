
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, MapPin, Navigation, ArrowRight, Layers, Search, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { CitySummary } from '../../types/index';
import { calculateDistance } from '../../services/geo';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { DraggableSlider, DraggableSliderHandle } from '../common/DraggableSlider';

interface Props {
    onClose: () => void;
    cityManifest: CitySummary[];
    onConfirm: (config: { type: 'gps' | 'manual', cityId?: string, radius: number }) => void;
}

export const AroundMeWizard = ({ onClose, cityManifest, onConfirm }: Props) => {
    const [mode, setMode] = useState<'gps' | 'manual' | null>(null);
    const [selectedCityId, setSelectedCityId] = useState<string>('');
    const [radius, setRadius] = useState<number>(25); // Default 25km
    
    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    
    // GPS Warning Overlay State
    const [showGpsWarning, setShowGpsWarning] = useState(false);
    
    const searchRef = useRef<HTMLDivElement>(null);
    const sliderRef = useRef<DraggableSliderHandle>(null);
    
    // Drag detection ref
    const dragStartRef = useRef({ x: 0, y: 0 });

    // ESC Key Listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Click outside to close search dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearching(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredCities = useMemo(() => {
        if (!searchQuery) return cityManifest;
        return cityManifest.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [cityManifest, searchQuery]);

    const selectedCity = useMemo(() => cityManifest.find(c => c.id === selectedCityId), [selectedCityId, cityManifest]);

    // Calcolo Anteprima Città nel Raggio
    const previewCities = useMemo(() => {
        if (mode === 'manual' && !selectedCity) return [];
        if (mode === 'gps') return []; 
        
        const center = selectedCity?.coords;
        if (!center) return [];

        return cityManifest
            .filter(c => c.id !== selectedCityId) // Escludi centro
            .map(c => ({
                ...c,
                dist: calculateDistance(center.lat, center.lng, c.coords.lat, c.coords.lng)
            }))
            .filter(c => c.dist <= radius)
            .sort((a,b) => a.dist - b.dist);
    }, [mode, selectedCity, radius, cityManifest]);

    const handleConfirm = () => {
        if (!mode) return;
        if (mode === 'manual' && !selectedCityId) {
            alert("Seleziona una città di partenza.");
            return;
        }
        
        onConfirm({
            type: mode,
            cityId: selectedCityId || undefined,
            radius
        });
        onClose();
    };

    // Navigazione diretta cliccando sulla card
    const handleCardClick = (targetCityId: string) => {
        onConfirm({
            type: 'manual',
            cityId: targetCityId,
            radius
        });
        onClose();
    };

    const handleSelectCity = (city: CitySummary) => {
        setSelectedCityId(city.id);
        setSearchQuery(city.name);
        setIsSearching(false);
    };

    const handleGpsClick = () => {
        setShowGpsWarning(true);
    };

    const confirmGps = () => {
        setShowGpsWarning(false);
        setMode('gps');
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
            <div className="relative bg-[#020617] w-full max-w-3xl rounded-3xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 max-h-[90vh]">
                
                {/* GPS WARNING OVERLAY */}
                {showGpsWarning && (
                    <div className="absolute inset-0 z-[150] bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
                        <div className="max-w-sm text-center">
                            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                                <MapPin className="w-8 h-8 text-blue-500 animate-pulse"/>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Attiva il GPS</h3>
                            <p className="text-sm text-slate-300 mb-6">
                                Per individuare la tua posizione e le attrazioni vicine, assicurati di aver attivato la geolocalizzazione sul tuo dispositivo.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowGpsWarning(false)} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-colors">
                                    Annulla
                                </button>
                                <button onClick={confirmGps} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors shadow-lg">
                                    Ho acceso il GPS
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#0f172a] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-900/30 text-white">
                            <Layers className="w-6 h-6"/>
                        </div>
                        <div>
                            {/* CHANGED: Text size reduced */}
                            <h3 className="text-lg font-display font-bold text-white uppercase tracking-wide">Around Me</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Esplorazione Territoriale</p>
                        </div>
                    </div>
                    {/* STANDARD RED CLOSE BUTTON */}
                    <button onClick={onClose} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg">
                        <X className="w-5 h-5"/>
                    </button>
                </div>

                <div className={`p-6 md:p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar relative z-10 transition-all ${isSearching ? 'pb-72' : ''}`}>
                    
                    {/* SCELTA MODALITÀ - COMPACTED & SWAPPED ICONS */}
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={handleGpsClick}
                            // CHANGED: Padding reduced to p-3
                            className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group relative overflow-hidden ${mode === 'gps' ? 'bg-blue-900/20 border-blue-500 shadow-xl' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}
                        >
                            {/* CHANGED: Icon swapped to MapPin */}
                            <div className={`p-3 rounded-full ${mode === 'gps' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-white'}`}>
                                <MapPin className="w-6 h-6"/>
                            </div>
                            <span className={`text-xs font-black uppercase tracking-widest ${mode === 'gps' ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>Usa GPS</span>
                        </button>

                        <button 
                            onClick={() => setMode('manual')}
                            // CHANGED: Padding reduced to p-3
                            className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group relative overflow-hidden ${mode === 'manual' ? 'bg-indigo-900/20 border-indigo-500 shadow-xl' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}
                        >
                            {/* CHANGED: Icon swapped to Search for clarity */}
                            <div className={`p-3 rounded-full ${mode === 'manual' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-white'}`}>
                                <Search className="w-6 h-6"/>
                            </div>
                            <span className={`text-xs font-black uppercase tracking-widest ${mode === 'manual' ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>Scegli Città</span>
                        </button>
                    </div>

                    {/* OPZIONI */}
                    {mode && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-2 fade-in">
                            {mode === 'manual' && (
                                <div className="space-y-2 relative" ref={searchRef}>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Punto di Partenza</label>
                                    
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-500 transition-colors"/>
                                        {/* CHANGED: Reduced vertical padding (p-3) */}
                                        <input 
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => { setSearchQuery(e.target.value); setIsSearching(true); }}
                                            onFocus={() => setIsSearching(true)}
                                            placeholder="Cerca città (es. Napoli, Salerno...)"
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 pl-12 text-white font-bold outline-none focus:border-indigo-500 transition-colors"
                                        />
                                        {selectedCityId && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 animate-in zoom-in">
                                                <Check className="w-5 h-5"/>
                                            </div>
                                        )}
                                    </div>

                                    {isSearching && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto custom-scrollbar z-[100] animate-in slide-in-from-top-2">
                                            {filteredCities.length > 0 ? filteredCities.map(c => (
                                                <button 
                                                    key={c.id} 
                                                    onClick={() => handleSelectCity(c)}
                                                    className="w-full text-left px-4 py-3 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-between border-b border-slate-800/50 last:border-0"
                                                >
                                                    <span className="font-bold text-sm">{c.name}</span>
                                                    <span className="text-[10px] text-slate-500 uppercase font-bold">{c.zone}</span>
                                                </button>
                                            )) : (
                                                <div className="p-4 text-center text-slate-500 text-xs italic">Nessuna città trovata.</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* COMPACT RADIUS SLIDER */}
                            <div className="space-y-2 pt-1">
                                <div className="flex justify-between items-end px-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Raggio di Ricerca</label>
                                    <span className="text-xl font-mono font-black text-white bg-slate-800 px-3 py-0.5 rounded-lg border border-slate-700 shadow-lg">{radius} <span className="text-sm text-slate-400">km</span></span>
                                </div>
                                <div className="relative h-6 flex items-center">
                                    <input 
                                        type="range" 
                                        min="2" 
                                        max="50" 
                                        step="1" 
                                        value={radius} 
                                        onChange={(e) => setRadius(parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 z-10 relative"
                                    />
                                    {/* Grid Lines */}
                                    <div className="absolute inset-0 flex justify-between pointer-events-none px-1">
                                        {[...Array(11)].map((_, i) => <div key={i} className="w-px h-full bg-slate-700/50"></div>)}
                                    </div>
                                </div>
                                <div className="flex justify-between text-[9px] font-bold text-slate-600 uppercase px-1">
                                    <span>2 km</span>
                                    <span>50 km</span>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* ANTEPRIMA CITTÀ VICINE (CLICCABILI) - UPDATED WITH DRAGGABLE SLIDER & ARROWS */}
                    {mode === 'manual' && selectedCityId && (
                         <div className="pt-2 border-t border-slate-800/50">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    CITTÀ VICINE ({previewCities.length})
                                </h4>
                                <div className="flex gap-2">
                                     <button onClick={() => sliderRef.current?.scroll('left')} className="p-1.5 bg-slate-800 rounded-lg text-slate-400 hover:text-white"><ChevronLeft className="w-4 h-4"/></button>
                                     <button onClick={() => sliderRef.current?.scroll('right')} className="p-1.5 bg-slate-800 rounded-lg text-slate-400 hover:text-white"><ChevronRight className="w-4 h-4"/></button>
                                </div>
                            </div>
                            {previewCities.length > 0 ? (
                                <DraggableSlider ref={sliderRef} className="pb-4 gap-4">
                                    {previewCities.map(city => (
                                        <div 
                                            key={city.id} 
                                            // 1. Cattura inizio click
                                            onMouseDown={(e) => dragStartRef.current = { x: e.clientX, y: e.clientY }}
                                            // 2. Verifica spostamento (se > 10px è uno scroll, non un click)
                                            onClick={(e) => {
                                                const dx = Math.abs(e.clientX - dragStartRef.current.x);
                                                const dy = Math.abs(e.clientY - dragStartRef.current.y);
                                                if (dx < 10 && dy < 10) {
                                                    handleCardClick(city.id);
                                                }
                                            }}
                                            className="snap-start w-56 flex-shrink-0 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg group hover:border-blue-500/50 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                                            title="Clicca per esplorare da qui"
                                        >
                                            <div className="h-40 relative pointer-events-none">
                                                <ImageWithFallback src={city.imageUrl} alt={city.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500"/>
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                                                <div className="absolute bottom-2 left-2 right-2">
                                                    <div className="font-bold text-white text-base truncate leading-none mb-0.5">{city.name}</div>
                                                    <div className="text-[10px] text-slate-300 truncate">{city.zone}</div>
                                                </div>
                                            </div>
                                            <div className="p-3 text-center bg-slate-950/50 flex justify-between items-center px-4 pointer-events-none">
                                                <div className="text-xs text-blue-400 font-mono font-bold flex items-center gap-1">
                                                    <Navigation className="w-3.5 h-3.5 rotate-45"/> {city.dist.toFixed(1)} km
                                                </div>
                                                <span className="text-[9px] font-black uppercase text-slate-500 group-hover:text-white transition-colors">VAI &rarr;</span>
                                            </div>
                                        </div>
                                    ))}
                                </DraggableSlider>
                            ) : (
                                <div className="text-center py-6 text-slate-600 italic text-xs border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                                    Nessuna città nel raggio selezionato. Aumenta i km.
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* COMPACTED FOOTER BUTTON */}
                <div className="p-4 border-t border-slate-800 bg-[#0f172a] shrink-0 z-50">
                    <button 
                        onClick={handleConfirm}
                        disabled={!mode || (mode === 'manual' && !selectedCityId)}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black uppercase text-xs tracking-widest py-3 rounded-xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-3"
                    >
                        Esplora Area <ArrowRight className="w-4 h-4"/>
                    </button>
                </div>
            </div>
        </div>
    );
};
