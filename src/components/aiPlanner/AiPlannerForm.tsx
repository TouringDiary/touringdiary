
import React, { useState, useEffect } from 'react';
import { MapPin, ChevronUp, ChevronDown, Coffee, Lightbulb, Sparkles, Route, AlertTriangle, Loader2, Clock, Calendar, Hash, Flag, Navigation, Zap, Lock, Gift, Crown } from 'lucide-react';
import { useAiPlanner } from '@/context/AiPlannerContext';
import { DailyLogistics } from '../../services/ai/aiPlanner';
// import { checkAiQuota } from '../../services/aiUsageService';
import { getGuestUser } from '../../services/userService';
import { useModal } from '@/context/ModalContext';
import { User } from '../../types/index';
import { useDynamicStyles } from '../../hooks/useDynamicStyles';
import { getCachedSetting, SETTINGS_KEYS } from '../../services/settingsService';

interface Props {
    onGenerate: () => void;
    isLoading: boolean;
    error: string | null;
    user?: User; 
}

// Fallback minimo se il DB non è ancora popolato
const FALLBACK_STYLES = [
    { id: 'balanced', label: 'Equilibrato', emoji: '⚖️', desc: 'Mix di tutto' }
];

const DISTANCE_STEPS = [2, 5, 10, 15, 20, 25, 30];

// Dynamic Header Component
const SectionHeader = ({ num, title }: { num: string, title: string }) => {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => { setIsMobile(window.innerWidth < 1024); }, []);
    const titleStyle = useDynamicStyles('planner_step_title', isMobile);
    
    return (
        <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-display font-black text-indigo-400 text-lg shadow-lg shrink-0">
                {num}
            </div>
            <h4 className={`${titleStyle || 'text-lg font-display font-bold text-[#facc15] tracking-tight uppercase drop-shadow-sm'} pt-0.5`}>{title}</h4>
            <div className="h-px flex-1 bg-gradient-to-r from-slate-700/50 to-transparent"></div>
        </div>
    );
};

export const AiPlannerForm = ({ onGenerate, isLoading, error, user }: Props) => {
    const { aiSession, updateAiSession } = useAiPlanner();
    const { openModal } = useModal();
    const [isCustomDays, setIsCustomDays] = useState(false);
    const [showDailyLogistics, setShowDailyLogistics] = useState(false);
    const [selectedStyles, setSelectedStyles] = useState<string[]>(['balanced']);
    const [quota, setQuota] = useState<{count: number, limit: number, canProceed: boolean} | null>(null);
    
    // FETCH STYLES FROM DB CACHE
    const travelStyles = getCachedSetting<any[]>(SETTINGS_KEYS.TRAVEL_STYLES_CONFIG) || FALLBACK_STYLES;

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => { setIsMobile(window.innerWidth < 1024); }, []);
    const textStyle = useDynamicStyles('planner_text', isMobile);

    // useEffect(() => {
    //     const check = async () => {
    //         const targetUser = user || getGuestUser();
    //         const q = await checkAiQuota(targetUser);
    //         setQuota(q);
    //     };
    //     check();
    // }, [isLoading, user]); 

    useEffect(() => {
        if (showDailyLogistics && aiSession.dailyLogistics.length === 0) {
            initializeDailyLogistics();
        }
    }, [showDailyLogistics, aiSession.daysCount]);

    const initializeDailyLogistics = () => {
        const newLogistics: DailyLogistics[] = [];
        const globalStart = aiSession.startLocation; 
        const globalEnd = aiSession.endLocation;     
        
        let nextDayStart = globalStart;

        for (let i = 0; i < aiSession.daysCount; i++) {
            newLogistics.push({
                dayIndex: i,
                start: nextDayStart,
                end: globalEnd,
                startTime: aiSession.startTime,
                endTime: aiSession.endTime
            });
            nextDayStart = globalEnd;
        }
        updateAiSession({ dailyLogistics: newLogistics });
    };

    const handleGenerateClick = () => {
        onGenerate();
    };

    const minDate = new Date().toISOString().split('T')[0];

    const syncDates = (start: string, days: number) => {
        if (!start) return;
        const d = new Date(start);
        d.setDate(d.getDate() + days - 1);
        updateAiSession({ 
            startDate: start,
            endDate: d.toISOString().split('T')[0] 
        });
    };

    const handleDaysCountChange = (count: number) => {
        const safeCount = Math.max(1, count);
        updateAiSession({ daysCount: safeCount });
        if (aiSession.startDate) {
            syncDates(aiSession.startDate, safeCount);
        }
    };

    const handleManualIncrement = () => {
        setIsCustomDays(true);
        handleDaysCountChange((aiSession.daysCount || 0) + 1);
    };

    const handleManualDecrement = () => {
        setIsCustomDays(true);
        handleDaysCountChange((aiSession.daysCount || 0) - 1);
    };

    const handleStartDateChange = (val: string) => {
        syncDates(val, aiSession.daysCount);
    };

    const handleToggleStyle = (styleId: string) => {
        if (styleId === 'balanced') {
            setSelectedStyles(['balanced']);
            updateAiSession({ style: 'balanced' });
            return;
        }
        let newStyles = selectedStyles.includes('balanced') ? [] : [...selectedStyles];
        if (newStyles.includes(styleId)) {
            newStyles = newStyles.filter(id => id !== styleId);
            if (newStyles.length === 0) newStyles = ['balanced'];
        } else {
            if (newStyles.length < 4) newStyles.push(styleId);
            else newStyles = ['balanced'];
        }
        setSelectedStyles(newStyles);
        updateAiSession({ style: newStyles[0] as any });
    };

    const updateDayLogistic = (index: number, field: keyof DailyLogistics, value: string) => {
        let newList = [...aiSession.dailyLogistics];
        
        if (newList.length < aiSession.daysCount) {
             let tempStart = aiSession.startLocation;
             const globalEnd = aiSession.endLocation;
             
             for (let i=0; i<aiSession.daysCount; i++) {
                 if (!newList[i]) {
                     newList[i] = {
                         dayIndex: i,
                         start: tempStart,
                         end: globalEnd,
                         startTime: aiSession.startTime,
                         endTime: aiSession.endTime
                     };
                 }
                 tempStart = newList[i].end;
             }
        }

        newList[index] = { ...newList[index], [field]: value };

        if (field === 'end' && index < aiSession.daysCount - 1) {
            newList[index + 1] = {
                ...newList[index + 1],
                start: value 
            };
        }

        updateAiSession({ dailyLogistics: newList });
    };

    const currentDistanceIndex = DISTANCE_STEPS.indexOf(aiSession.globalMaxDistance);
    const sliderValue = currentDistanceIndex !== -1 ? currentDistanceIndex : 1;

    return (
        <div className="space-y-5 pb-6">
             <style>{`
                .slider-navigator::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 14px; height: 14px; background: #f97316; clip-path: polygon(100% 50%, 0% 0%, 25% 50%, 0% 100%); cursor: pointer; border: none; box-shadow: 0 0 10px rgba(249, 115, 22, 0.4); }
                .slider-clock::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; background: #facc15; border-radius: 50%; border: 2px solid #854d0e; cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23854d0e' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpolyline points='12 6 12 12 16 14'/%3E%3C/svg%3E"); background-size: 65%; background-repeat: no-repeat; background-position: center; }
                input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
            `}</style>

            <section>
                <SectionHeader num="1" title="DOVE VUOI ANDARE" />
                <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500 group-focus-within:text-indigo-400 transition-colors"/>
                    <input 
                        value={aiSession.destination} 
                        onChange={e => updateAiSession({ destination: e.target.value })} 
                        placeholder="Es. Napoli, Costiera Amalfitana..." 
                        className={`w-full bg-slate-950 border-2 border-slate-800 rounded-xl p-3 pl-12 text-white text-lg font-bold focus:border-indigo-600 outline-none transition-all shadow-inner placeholder:text-slate-600 ${textStyle}`}
                    />
                </div>
            </section>

            <section>
                <SectionHeader num="2" title="quando e quanto" />
                <div className="space-y-4">
                    <div className="flex justify-between items-end mb-1 px-1">
                        <label className="text-[10px] font-black text-[#f97316] uppercase tracking-[0.2em] flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5"/> Durata Viaggio
                        </label>
                        <label className="text-[10px] font-black text-[#f97316] uppercase tracking-[0.2em] flex items-center gap-1">
                            ALTRO <Hash className="w-3 h-3"/>
                        </label>
                    </div>
                    <div className="flex gap-2 items-center">
                        <div className="flex gap-1 flex-1">
                            {[1, 2, 3, 4, 5, 6, 7].map(d => (
                                <button key={d} onClick={() => { handleDaysCountChange(d); setIsCustomDays(false); }} className={`flex-1 h-10 rounded-lg font-black text-xs border-2 transition-all ${aiSession.daysCount === d && !isCustomDays ? 'bg-indigo-600 text-white border-indigo-400 shadow-md' : 'bg-slate-950 text-slate-500 border-slate-800 hover:bg-slate-900'}`}>{d}</button>
                            ))}
                        </div>
                        
                        <div className={`relative w-20 h-10 rounded-lg border-2 transition-all bg-slate-900 flex ${isCustomDays ? 'border-indigo-400' : 'border-slate-800'}`}>
                            <input 
                                type="number" 
                                min="1" 
                                value={isCustomDays ? aiSession.daysCount : ''} 
                                onChange={(e) => { 
                                    const val = parseInt(e.target.value); 
                                    if (!isNaN(val)) { setIsCustomDays(true); handleDaysCountChange(val); }
                                    else if (e.target.value === '') { setIsCustomDays(true); updateAiSession({ daysCount: 0 }); }
                                }} 
                                onClick={() => setIsCustomDays(true)} 
                                placeholder="Gg" 
                                className="w-full h-full bg-transparent text-white font-black text-center text-sm outline-none pl-1 pr-6"
                            />
                            <div className="absolute right-0 top-0 bottom-0 w-6 flex flex-col border-l border-slate-700/50">
                                <button onClick={handleManualIncrement} className="h-1/2 flex items-center justify-center hover:bg-slate-800 text-[#facc15] active:text-white transition-colors">
                                    <ChevronUp size={14} strokeWidth={4} />
                                </button>
                                <button onClick={handleManualDecrement} className="h-1/2 flex items-center justify-center hover:bg-slate-800 text-[#facc15] active:text-white transition-colors border-t border-slate-700/30">
                                    <ChevronDown size={14} strokeWidth={4} />
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 uppercase font-black ml-1">Dal</label>
                            <input type="date" min={minDate} value={aiSession.startDate} onChange={e => handleStartDateChange(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white text-base font-black font-mono text-center outline-none focus:border-indigo-500 transition-colors"/>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 uppercase font-black ml-1">Al</label>
                            <input type="date" min={aiSession.startDate || minDate} value={aiSession.endDate} onChange={e => updateAiSession({ endDate: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white text-base font-black font-mono text-center outline-none focus:border-indigo-500 transition-colors"/>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <SectionHeader num="3" title="logistica" />
                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-1 px-1">
                        <button type="button" onClick={() => setShowDailyLogistics(!showDailyLogistics)} className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${showDailyLogistics ? 'text-[#facc15]' : 'text-slate-500 hover:text-slate-300'}`}>
                            {showDailyLogistics ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>} Configura giorni singoli (Opzionale)
                        </button>
                    </div>

                    {!showDailyLogistics ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="uppercase font-black ml-1 flex items-center gap-1 leading-tight">
                                        <Navigation className="w-3 h-3 text-[#f97316]"/>
                                        <span className="text-[#f97316] text-[10px]">PARTENZA</span> 
                                        <span className="text-slate-500 text-[8px] font-bold tracking-wide opacity-70">(Hotel, Aeroporto, ...)</span>
                                    </label>
                                    <input value={aiSession.startLocation} onChange={e => updateAiSession({ startLocation: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs outline-none font-bold focus:border-emerald-500 transition-colors" placeholder="Es. Stazione Centrale"/>
                                </div>
                                <div className="space-y-1">
                                    <label className="uppercase font-black ml-1 flex items-center gap-1 leading-tight">
                                        <Flag className="w-3 h-3 text-[#f97316]"/>
                                        <span className="text-[#f97316] text-[10px]">ARRIVO</span> 
                                        <span className="text-slate-500 text-[8px] font-bold tracking-wide opacity-70">(Hotel, Aeroporto, ...)</span>
                                    </label>
                                    <input value={aiSession.endLocation} onChange={e => updateAiSession({ endLocation: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs outline-none font-bold focus:border-red-500 transition-colors" placeholder="Es. Hotel Centro"/>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="space-y-1">
                                    <label className="uppercase font-black ml-1 flex items-center gap-1 text-[10px] text-slate-500">
                                        <Clock className="w-3 h-3"/> INIZIO TOUR
                                    </label>
                                    <input type="time" value={aiSession.startTime} onChange={e => updateAiSession({ startTime: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white text-xs outline-none font-bold focus:border-indigo-500 transition-colors text-center"/>
                                </div>
                                <div className="space-y-1">
                                    <label className="uppercase font-black ml-1 flex items-center gap-1 text-[10px] text-slate-500">
                                        <Clock className="w-3 h-3"/> FINE TOUR
                                    </label>
                                    <input type="time" value={aiSession.endTime} onChange={e => updateAiSession({ endTime: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white text-xs outline-none font-bold focus:border-indigo-500 transition-colors text-center"/>
                                </div>
                            </div>

                            <div className="pt-2">
                                <div className="flex justify-between items-end mb-2 px-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Navigation className="w-3.5 h-3.5"/> DISTANZA MASSIMA SPOSTAMENTI
                                    </label>
                                    <span className="text-sm font-black text-indigo-400">{aiSession.globalMaxDistance} km</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max={DISTANCE_STEPS.length - 1} 
                                    step="1" 
                                    value={sliderValue} 
                                    onChange={(e) => updateAiSession({ globalMaxDistance: DISTANCE_STEPS[parseInt(e.target.value)] })}
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 slider-navigator"
                                />
                                <div className="flex justify-between text-[8px] text-slate-600 mt-1 font-bold px-1">
                                    <span>2km</span>
                                    <span>30km</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                            {Array.from({ length: aiSession.daysCount }).map((_, i) => {
                                const dayLog = aiSession.dailyLogistics[i] || { 
                                    dayIndex: i,
                                    start: i === 0 ? aiSession.startLocation : aiSession.dailyLogistics[i-1]?.end || aiSession.endLocation, 
                                    end: aiSession.endLocation, 
                                    startTime: aiSession.startTime, 
                                    endTime: aiSession.endTime 
                                };
                                
                                return (
                                    <div key={i} className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3 shadow-inner hover:border-indigo-500/30 transition-colors">
                                        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-2">
                                            <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase shadow-sm">GIORNO {i+1}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <span className="text-[8px] font-black text-slate-500 uppercase ml-1">Partenza Da</span>
                                                <input value={dayLog.start} onChange={e => updateDayLogistic(i, 'start', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-[10px] text-white font-bold focus:border-indigo-500 outline-none" placeholder="Luogo Start"/>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[8px] font-black text-slate-500 uppercase ml-1">Fine A</span>
                                                <input value={dayLog.end} onChange={e => updateDayLogistic(i, 'end', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-[10px] text-white font-bold focus:border-indigo-500 outline-none" placeholder="Luogo End"/>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[8px] font-black text-slate-500 uppercase ml-1">Ore Inizio</span>
                                                <input type="time" value={dayLog.startTime} onChange={e => updateDayLogistic(i, 'startTime', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm font-black text-white text-center font-mono focus:border-indigo-500 outline-none"/>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[8px] font-black text-slate-500 uppercase ml-1">Ore Fine</span>
                                                <input type="time" value={dayLog.endTime} onChange={e => updateDayLogistic(i, 'endTime', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm font-black text-white text-center font-mono focus:border-indigo-500 outline-none"/>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            <section>
                <SectionHeader num="4" title="stile e ritmo" />
                <div className="space-y-5">
                    <div className="grid grid-cols-3 gap-3">
                        {travelStyles.map(s => (
                            <button key={s.id} onClick={() => handleToggleStyle(s.id)} className={`p-3 rounded-2xl border transition-all text-left flex items-center gap-3 h-20 relative overflow-hidden group ${selectedStyles.includes(s.id) ? 'bg-indigo-600 border-indigo-400 shadow-md ring-2 ring-indigo-400' : 'bg-[#0b0f1a] border-[#1e293b] hover:border-slate-600 hover:bg-slate-900'}`}>
                                <div className="shrink-0 text-2xl drop-shadow-md group-hover:scale-110 transition-transform duration-300">{s.emoji}</div>
                                <div className="min-w-0">
                                    <div className={`text-sm font-black leading-tight truncate ${selectedStyles.includes(s.id) ? 'text-white' : 'text-slate-200'}`}>{s.label}</div>
                                    <div className={`text-[9px] font-bold leading-tight mt-0.5 truncate ${selectedStyles.includes(s.id) ? 'text-indigo-200' : 'text-slate-500'}`}>{s.desc}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                    
                    <div className="pt-2">
                        <div className="flex justify-between items-end mb-2 px-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Coffee className="w-3.5 h-3.5"/> Pausa Relax tra le tappe
                            </label>
                            <span className="text-sm font-black text-amber-500">{aiSession.bufferMinutes} min</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="60" 
                            step="5" 
                            value={aiSession.bufferMinutes} 
                            onChange={(e) => updateAiSession({ bufferMinutes: parseInt(e.target.value) })} 
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 slider-clock"
                        />
                    </div>
                </div>
            </section>
            
            <section>
                <SectionHeader num="5" title="note extra" />
                <div className="space-y-4">
                    <textarea 
                        value={aiSession.preferences} 
                        onChange={e => updateAiSession({ preferences: e.target.value })} 
                        placeholder="Es. Ho bambini piccoli, evitate percorsi troppo ripidi..." 
                        className={`w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white text-sm focus:border-indigo-500 outline-none resize-none h-24 placeholder:text-slate-700 transition-all shadow-inner ${textStyle}`}
                    />
                    
                    <div className="bg-indigo-900/10 border border-indigo-500/20 p-4 rounded-xl flex gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 h-fit">
                            <Lightbulb className="w-4 h-4"/>
                        </div>
                        <div>
                            <h5 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">CONSIGLIO PRO</h5>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Sfoglia le pagine della città per scoprire tappe uniche da aggiungere al diario!
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {error && <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2"><AlertTriangle className="w-4 h-4"/> {error}</div>}
            
            <div className="flex flex-col items-center gap-3 pt-4">
                <button 
                    onClick={handleGenerateClick} 
                    disabled={isLoading || (quota && !quota.canProceed)} 
                    className="w-full max-w-sm bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-display font-bold uppercase tracking-[0.15em] py-4 rounded-[1.5rem] shadow-2xl shadow-indigo-900/50 flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm border border-indigo-400/20"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Sparkles className="w-5 h-5"/>} 
                    {isLoading ? 'Analisi in corso...' : 'Genera Itinerario Magico'}
                </button>
                
                {quota && (
                    <div className="text-center w-full max-w-sm mx-auto mt-2 space-y-3">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Crediti Giornalieri: <span className={quota.canProceed ? "text-emerald-500" : "text-red-500"}>{quota.count} / {quota.limit}</span>
                        </p>
                        
                        <div className="text-center text-xs text-slate-400">
                             Desideri ottenere crediti extra gratuiti? <button 
                                onClick={() => openModal('userDashboard', { tab: 'referral' })} 
                                className="text-amber-500 hover:text-amber-400 font-bold underline transition-colors"
                            >
                                Clicca qui
                            </button>
                        </div>
                        
                        <div className="relative py-2">
                             <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
                             <div className="relative flex justify-center text-[9px] uppercase font-black text-slate-600 bg-[#020617] px-2 tracking-widest">Oppure</div>
                        </div>

                         <div className="flex flex-col items-center gap-1">
                             <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wide">Vuoi crediti infiniti?</p>
                             <button 
                                onClick={() => openModal('upgrade')} 
                                className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2 transition-all active:scale-95 text-xs uppercase tracking-wider"
                             >
                                <Crown className="w-4 h-4 fill-current"/> PASSA A PREMIUM
                            </button>
                         </div>

                        {!quota.canProceed && (
                             <button onClick={() => openModal('auth')} className="text-xs text-indigo-400 hover:text-indigo-300 font-bold underline mt-2 block">
                                Accedi per + crediti
                             </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
