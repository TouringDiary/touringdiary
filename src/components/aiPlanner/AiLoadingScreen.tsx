
import React, { useState, useEffect } from 'react';
import { Loader2, Lightbulb, Zap, Terminal } from 'lucide-react';
import { getLoadingTipsAsync } from '../../services/contentService';
import { LoadingTip } from '../../types/index';

interface Props {
    onCancel?: () => void;
}

export const AiLoadingScreen = ({ onCancel }: Props) => {
    // Data State
    const [tips, setTips] = useState<LoadingTip[]>([]);
    const [statuses, setStatuses] = useState<LoadingTip[]>([]);
    
    // UI Rotation State
    const [currentTipIndex, setCurrentTipIndex] = useState(0);
    const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
    
    // Progress Bar State
    const [progress, setProgress] = useState(0);

    // 1. Load Data
    useEffect(() => {
        const load = async () => {
            const data = await getLoadingTipsAsync();
            
            // Filtra e separa i tipi
            const activeTips = data.filter(t => t.active && t.type === 'tip');
            const activeStatuses = data.filter(t => t.active && t.type === 'status');

            // Fallback se DB vuoto
            if (activeTips.length > 0) setTips(activeTips);
            else setTips([{ id: 'def_tip', text: "Stiamo disegnando il tuo viaggio perfetto...", active: true, type: 'tip' }]);

            if (activeStatuses.length > 0) setStatuses(activeStatuses);
            else setStatuses([{ id: 'def_status', text: "Analisi opzioni in corso...", active: true, type: 'status' }]);
        };
        load();
    }, []);

    // 2. Rotate Tips (Slow - 5s)
    useEffect(() => {
        if (tips.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentTipIndex(prev => (prev + 1) % tips.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [tips]);

    // 3. Rotate Statuses (Fast - 2s)
    useEffect(() => {
        if (statuses.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentStatusIndex(prev => (prev + 1) % statuses.length);
        }, 2000);
        return () => clearInterval(interval);
    }, [statuses]);

    // 4. Progress Bar Simulation
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(old => {
                if (old >= 95) return 95; // Stalla al 95% finché non finisce il processo reale
                // Incremento casuale per sembrare naturale
                const diff = Math.random() * 3;
                return Math.min(old + diff, 95);
            });
        }, 200);
        return () => clearInterval(interval);
    }, []);

    const currentTip = tips[currentTipIndex] || { text: "Preparazione itinerario..." };
    const currentStatus = statuses[currentStatusIndex] || { text: "Elaborazione..." };

    return (
        <div className="absolute inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
            <div className="max-w-md w-full flex flex-col items-center gap-8 relative">
                
                {/* Visual Anchor */}
                <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full"></div>
                    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-2xl relative z-10">
                        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin"/>
                    </div>
                </div>
                
                {/* Progress Bar Section */}
                <div className="w-full space-y-2">
                    <div className="flex justify-between items-end px-1">
                        <div className="flex items-center gap-2 text-indigo-400 font-mono text-[10px] font-bold uppercase tracking-widest animate-pulse">
                            <Terminal className="w-3 h-3"/> {currentStatus.text}
                        </div>
                        <span className="text-white font-mono font-bold text-xs">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div 
                            className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>

                {/* Tip Card */}
                <div className="w-full bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600"></div>
                    
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="bg-amber-900/20 p-1.5 rounded-lg">
                            <Lightbulb className="w-4 h-4 text-amber-500"/>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">CONSIGLIO DEL GIORNO</span>
                    </div>
                    
                    <div className="relative min-h-[4rem] flex items-center justify-center">
                        <p key={currentTipIndex} className="text-slate-200 font-serif text-lg italic leading-relaxed animate-in slide-in-from-bottom-2 fade-in duration-700">
                            "{currentTip.text}"
                        </p>
                    </div>

                    <div className="absolute -bottom-4 -right-4 text-slate-800 opacity-20 pointer-events-none">
                        <Zap className="w-24 h-24 rotate-12"/>
                    </div>
                </div>
                
                {onCancel && (
                    <button onClick={onCancel} className="mt-2 text-slate-600 hover:text-red-400 text-[10px] uppercase font-bold tracking-widest transition-colors">
                        Annulla Operazione
                    </button>
                )}
            </div>
        </div>
    );
};

export const GenerationLoader = AiLoadingScreen;
