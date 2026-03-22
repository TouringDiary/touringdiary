
import React, { useState } from 'react';
import { Trash2, Bot, Send, Loader2, CheckCircle, Navigation, Landmark, Utensils, Bed, ShoppingBag, Sun, Scan, Music, MapPin } from 'lucide-react';
import { useAiPlanner } from '@/context/AiPlannerContext';
import { calculateDistance } from '../../services/geo';
import { modifyItinerary } from '../../services/ai/aiPlanner';
import { getCityDetails, getFullManifestAsync } from '../../services/cityService';

interface Props {
    onApply: () => void;
    onReset: () => void;
    activeStyles: string[];
}

const getCategoryIcon = (category: string) => {
    switch (category) {
        case 'monument': return <Landmark className="w-5 h-5" />;
        case 'food': return <Utensils className="w-5 h-5" />;
        case 'hotel': return <Bed className="w-5 h-5" />;
        case 'shop': return <ShoppingBag className="w-5 h-5" />;
        case 'nature': return <Sun className="w-5 h-5" />;
        case 'discovery': return <Scan className="w-5 h-5" />;
        case 'leisure': return <Music className="w-5 h-5" />;
        default: return <MapPin className="w-5 h-5" />;
    }
};

export const AiPlannerTimeline = ({ onApply, onReset, activeStyles }: Props) => {
    const { aiSession, updateAiSession } = useAiPlanner();
    const [chatInput, setChatInput] = useState('');
    const [isModifying, setIsModifying] = useState(false);
    const [aiFeedback, setAiFeedback] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleChatModify = async () => {
        if (!chatInput.trim() || !aiSession.generatedPlan) return;
        setIsModifying(true);
        setAiFeedback(null);
        setError(null);
        try {
            let availablePois: any[] = [];
            // Assuming manifest is fetched in context or parent if needed, but here we can quick fetch or rely on parent
            // To keep it simple and robust, we fetch basic info here
            const manifest = await getFullManifestAsync();
            const matchedCity = manifest.find(c => c.name.toLowerCase() === aiSession.destination.toLowerCase());
            
            if (matchedCity) {
                const details = await getCityDetails(matchedCity.id);
                if (details?.details.allPois) {
                     availablePois = details.details.allPois
                        .sort((a,b) => b.rating - a.rating)
                        .slice(0, 30)
                        .map(p => ({ id: p.id, name: p.name, category: p.category, lat: p.coords.lat, lng: p.coords.lng }));
                }
            }
            const { updatedPlan, chatReply } = await modifyItinerary(aiSession.generatedPlan, chatInput, aiSession.destination, availablePois);
            updateAiSession({ generatedPlan: updatedPlan });
            setAiFeedback(chatReply);
        } catch (e: any) { 
            setError(e.message || "Errore durante la modifica."); 
        } finally { 
            setIsModifying(false); 
            setChatInput(''); 
        }
    };

    return (
        <div className="flex flex-col h-full space-y-6 animate-in fade-in pb-10">
            <div className="flex justify-between items-end shrink-0 mb-2">
                <div><h3 className="text-3xl font-display font-bold text-white tracking-tight leading-none">Timeline Ottimizzata</h3><p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] mt-2">Stile: {activeStyles.join(', ').toUpperCase()}</p></div>
                <button onClick={onReset} className="text-[10px] font-black uppercase text-red-400 hover:text-red-300 flex items-center gap-2 bg-red-900/10 px-3 py-1.5 rounded-full border border-red-500/20 transition-all active:scale-90"><Trash2 className="w-3.5 h-3.5"/> Reset Setup</button>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-slate-950 border border-slate-800 rounded-[2.5rem] p-6 custom-scrollbar min-h-0 relative shadow-inner">
                {aiSession.generatedPlan?.map((item, i) => {
                    const prevItem = aiSession.generatedPlan![i-1];
                    const isDayHeader = item.dayIndex !== prevItem?.dayIndex && i > 0;
                    let distance = null;
                    if (prevItem && !isDayHeader && prevItem.lat !== 0 && item.lat !== 0) {
                        distance = calculateDistance(prevItem.lat, prevItem.lng, item.lat, item.lng);
                    }

                    return (
                        <div key={i} className={`relative pl-4 ${isDayHeader ? 'mt-12' : ''}`}>
                            {(i === 0 || isDayHeader) && (
                                <div className="mb-6 text-[12px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-4"><div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 border border-slate-700 shadow-lg">0{item.dayIndex + 1}</div>Giorno {item.dayIndex + 1}<div className="h-px flex-1 bg-slate-800"></div></div>
                            )}
                            {distance !== null && distance > 0 && (
                                <div className="absolute left-[-2px] top-[-10px] z-20 transform -translate-y-1/2 ml-8"><div className="flex items-center gap-1.5 bg-[#020617] border border-slate-800 px-2 py-0.5 rounded-full shadow-lg"><Navigation className="w-2.5 h-2.5 text-indigo-400 transform rotate-45" /><span className="text-[10px] font-mono font-bold text-slate-400">{distance} km</span></div></div>
                            )}
                            <div className="flex gap-5 py-4 px-6 border-2 border-slate-800/50 transition-all hover:border-indigo-500/50 rounded-[2rem] relative z-10 mb-4 bg-slate-900/80">
                                <div className="w-16 flex flex-col items-center justify-center shrink-0 border-r border-slate-800 pr-5"><div className="text-lg font-mono font-black text-white">{item.time}</div><div className="text-[8px] font-black text-slate-500 uppercase tracking-tighter mt-0.5">ORARIO</div></div>
                                <div className="flex flex-col items-center justify-center shrink-0"><div className="p-3 rounded-2xl bg-slate-800 text-slate-400">{getCategoryIcon(item.category)}</div></div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center"><h4 className="font-bold text-lg leading-tight text-white">{item.activityName}</h4><p className="text-[11px] text-slate-500 mt-1 line-clamp-1 italic">"{item.description}"</p></div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="bg-[#0f172a] border-2 border-indigo-500/30 rounded-[2rem] p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-4"><Bot className="w-5 h-5 text-indigo-400"/><span className="text-[10px] font-black uppercase text-indigo-300 tracking-[0.3em]">IA Conversazionale</span></div>
                <div className="flex gap-3"><input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChatModify()} placeholder="Chiedi modifiche (es: meno tappe il primo giorno)..." className="flex-1 bg-slate-950 border-2 border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:border-indigo-500 outline-none shadow-inner"/><button onClick={handleChatModify} disabled={isModifying || !chatInput.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 rounded-2xl disabled:opacity-50 shadow-lg active:scale-95 transition-all">{isModifying ? <Loader2 className="w-6 h-6 animate-spin"/> : <Send className="w-6 h-6"/>}</button></div>
                {aiFeedback && <div className="mt-3 p-3 bg-indigo-900/20 border border-indigo-500/20 rounded-xl text-xs text-indigo-200">{aiFeedback}</div>}
                {error && <div className="mt-3 p-3 bg-red-900/20 border border-red-500/20 rounded-xl text-xs text-red-200">{error}</div>}
            </div>
            
            <div className="flex gap-4 shrink-0 pt-2"><button onClick={onApply} className="flex-1 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[1.5rem] font-black hover:scale-[1.01] transition-all shadow-2xl shadow-emerald-900/40 text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3"><CheckCircle className="w-6 h-6"/> Conferma e Inizia il Viaggio</button></div>
        </div>
    );
};
