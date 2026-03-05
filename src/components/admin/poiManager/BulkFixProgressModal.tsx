
import React, { useMemo } from 'react';
import { Loader2, CheckCircle, AlertTriangle, X, Activity, PauseCircle } from 'lucide-react';

interface BulkStats {
    total: number;
    processed: number;
    success: number;
    error: number;
    byCategory: Record<string, { total: number; processed: number; success: number; waiting: number }>;
}

interface Props {
    isOpen: boolean;
    onClose: () => void; // Attivo solo a fine processo
    stats: BulkStats;
    isProcessing: boolean;
    currentPoiName: string;
    onStop?: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
    monument: 'Monumenti',
    food: 'Cibo & Ristorazione',
    hotel: 'Hotel & Alloggi',
    shop: 'Shopping',
    nature: 'Natura',
    leisure: 'Svago',
    discovery: 'Altro/Novità'
};

export const BulkFixProgressModal = ({ isOpen, onClose, stats, isProcessing, currentPoiName, onStop }: Props) => {
    if (!isOpen) return null;

    const progressPercent = stats.total > 0 ? Math.round((stats.processed / stats.total) * 100) : 0;
    const isComplete = stats.processed === stats.total && stats.total > 0;

    return (
        <div className="fixed inset-0 z-[5000] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-4xl rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
                
                {/* HEADER */}
                <div className="p-6 border-b border-slate-800 bg-[#0f172a] flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${isProcessing ? 'bg-indigo-600 animate-pulse' : 'bg-emerald-600'}`}>
                            {isProcessing ? <Activity className="w-6 h-6 text-white"/> : <CheckCircle className="w-6 h-6 text-white"/>}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white font-display uppercase tracking-wide">
                                {isProcessing ? 'Bonifica in Corso' : 'Processo Completato'}
                            </h3>
                            <p className="text-sm text-slate-400 font-mono">
                                {isProcessing ? `Analisi AI: ${currentPoiName}...` : 'Resoconto finale operazioni'}
                            </p>
                        </div>
                    </div>
                    {isComplete && (
                        <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-colors">
                            <X className="w-6 h-6"/>
                        </button>
                    )}
                </div>

                {/* PROGRESS BAR GLOBALE */}
                <div className="px-6 pt-6 pb-2 shrink-0">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                        <span>Avanzamento Totale</span>
                        <span className={isProcessing ? "text-indigo-400" : "text-emerald-400"}>{progressPercent}%</span>
                    </div>
                    <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                        <div 
                            className={`h-full transition-all duration-500 ease-out ${isProcessing ? 'bg-gradient-to-r from-indigo-600 to-purple-500' : 'bg-emerald-500'}`}
                            style={{ width: `${progressPercent}%` }}
                        >
                            {isProcessing && <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-20 animate-slide"></div>}
                        </div>
                    </div>
                </div>

                {/* RECAP NUMERICO */}
                <div className="grid grid-cols-4 gap-4 px-6 py-4 shrink-0">
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-500 font-black uppercase">Totali</span>
                        <div className="text-2xl font-black text-white">{stats.total}</div>
                    </div>
                    <div className="bg-emerald-900/20 p-3 rounded-xl border border-emerald-500/20 text-center">
                        <span className="text-[10px] text-emerald-500 font-black uppercase">Bonificati</span>
                        <div className="text-2xl font-black text-emerald-400">{stats.success}</div>
                    </div>
                    <div className="bg-red-900/20 p-3 rounded-xl border border-red-500/20 text-center">
                        <span className="text-[10px] text-red-500 font-black uppercase">Errori/Invalidi</span>
                        <div className="text-2xl font-black text-red-400">{stats.error}</div>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-500 font-black uppercase">In Attesa</span>
                        <div className="text-2xl font-black text-slate-400">{stats.total - stats.processed}</div>
                    </div>
                </div>

                {/* TABELLA DETTAGLIO */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-slate-900 z-10 shadow-sm">
                            <tr className="text-[10px] text-slate-500 font-black uppercase tracking-widest border-b border-slate-800">
                                <th className="py-3">Categoria</th>
                                <th className="py-3 text-center">Stato</th>
                                <th className="py-3 text-right">Totale</th>
                                <th className="py-3 text-right text-emerald-500">Fatti</th>
                                <th className="py-3 text-right text-slate-500">Coda</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 text-sm">
                            {Object.entries(stats.byCategory).map(([catKey, catStats]) => {
                                const catLabel = CATEGORY_LABELS[catKey] || catKey;
                                const catProgress = catStats.total > 0 ? (catStats.processed / catStats.total) * 100 : 0;
                                const isCatComplete = catStats.processed === catStats.total && catStats.total > 0;
                                const isCatWorking = catStats.processed < catStats.total && catStats.processed > 0;

                                return (
                                    <tr key={catKey} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="py-3 font-bold text-slate-300 flex items-center gap-2">
                                            {catLabel}
                                        </td>
                                        <td className="py-3 text-center w-32">
                                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden border border-slate-700">
                                                <div 
                                                    className={`h-full transition-all duration-500 ${isCatComplete ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                                                    style={{ width: `${catProgress}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-[9px] font-mono text-slate-500 mt-1 block">{Math.round(catProgress)}%</span>
                                        </td>
                                        <td className="py-3 text-right font-mono text-white">{catStats.total}</td>
                                        <td className="py-3 text-right font-mono text-emerald-400 font-bold">
                                            {catStats.success > 0 ? `+${catStats.success}` : '-'}
                                        </td>
                                        <td className="py-3 text-right font-mono text-slate-500">
                                            {catStats.waiting}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="p-4 bg-[#0f172a] border-t border-slate-800 shrink-0 flex justify-end gap-3">
                    {isProcessing && onStop && (
                        <button 
                            onClick={onStop} 
                            className="bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-500/30 px-6 py-3 rounded-xl font-bold uppercase text-xs flex items-center gap-2 transition-colors"
                        >
                            <PauseCircle className="w-4 h-4"/> Interrompi
                        </button>
                    )}
                    {isComplete && (
                        <button 
                            onClick={onClose} 
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold uppercase text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                        >
                            <CheckCircle className="w-4 h-4"/> Chiudi
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};
