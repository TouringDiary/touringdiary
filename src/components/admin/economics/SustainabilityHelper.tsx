import React, { useState } from 'react';
import { Calculator, AlertTriangle, TrendingUp, TrendingDown, Info, Euro, Zap, Sparkles } from 'lucide-react';

export const SustainabilityHelper = () => {
    // Configurazione Input
    const [config, setConfig] = useState({
        price: 9.90,
        flashCredits: 50,
        proCredits: 10,
        avgFlashTokens: 1500,
        avgProTokens: 8000,
        costPer1kFlash: 0.0001, // 0.1€ per 1M
        costPer1kPro: 0.0025,   // 2.5€ per 1M
    });

    // Calcoli
    const totalFlashCost = (config.flashCredits * config.avgFlashTokens / 1000) * config.costPer1kFlash;
    const totalProCost = (config.proCredits * config.avgProTokens / 1000) * config.costPer1kPro;
    const totalApiCost = totalFlashCost + totalProCost;
    
    const grossMargin = config.price - totalApiCost;
    const marginPercent = config.price > 0 ? (grossMargin / config.price) * 100 : 0;
    
    // Break-even (quante vendite servono per coprire costi fissi ipotetici di 1000€)
    const breakEvenUnits = grossMargin > 0 ? Math.ceil(1000 / grossMargin) : '∞';

    // Status Color
    let statusColor = "text-emerald-400";
    let bgColor = "bg-emerald-500/10 border-emerald-500/20";
    let label = "Sicuro";
    
    if (marginPercent < 30) {
        statusColor = "text-amber-400";
        bgColor = "bg-amber-500/10 border-amber-500/20";
        label = "Rischio";
    }
    if (marginPercent <= 0) {
        statusColor = "text-rose-400";
        bgColor = "bg-rose-500/10 border-rose-500/20";
        label = "Perdita";
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Input Panel */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-indigo-600/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
                            <Calculator size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Simulatore Sostenibilità</h2>
                            <p className="text-xs text-slate-500 font-bold uppercase mt-1">Calcola margini e profitti stimati per offerta</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Prezzo di Vendita (€)</label>
                                <div className="relative">
                                    <Euro className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input 
                                        type="number" step="0.1" value={config.price} 
                                        onChange={(e) => setConfig({...config, price: parseFloat(e.target.value)})}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pl-12 text-white font-black outline-none focus:border-indigo-500 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-1">Crediti Flash</label>
                                    <input 
                                        type="number" value={config.flashCredits} 
                                        onChange={(e) => setConfig({...config, flashCredits: parseInt(e.target.value)})}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-black outline-none focus:border-amber-500 transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1">Crediti Pro</label>
                                    <input 
                                        type="number" value={config.proCredits} 
                                        onChange={(e) => setConfig({...config, proCredits: parseInt(e.target.value)})}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-black outline-none focus:border-indigo-500 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Avg Tokens Flash</label>
                                    <input 
                                        type="number" step="100" value={config.avgFlashTokens} 
                                        onChange={(e) => setConfig({...config, avgFlashTokens: parseInt(e.target.value)})}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-300 font-bold outline-none focus:border-slate-600 transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Avg Tokens Pro</label>
                                    <input 
                                        type="number" step="100" value={config.avgProTokens} 
                                        onChange={(e) => setConfig({...config, avgProTokens: parseInt(e.target.value)})}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-300 font-bold outline-none focus:border-slate-600 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl flex items-center gap-3">
                                <Info className="w-5 h-5 text-indigo-500 shrink-0" />
                                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                                    I costi unitari API (Flash/Pro) sono pre-caricati dai listini ufficiali Gemini 2.0. 
                                    I token medi sono basati sulle analytics reali Touring Diary.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Result Panel */}
                <div className={`rounded-[2.5rem] p-8 shadow-2xl flex flex-col justify-between border-2 transition-all duration-500 ${bgColor}`}>
                    <div>
                        <div className="flex justify-between items-start mb-8">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Risultato Stimato</span>
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-current ${statusColor}`}>
                                {label}
                            </span>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Margine Lordo (%)</span>
                                <div className={`text-6xl font-black tracking-tighter ${statusColor}`}>
                                    {marginPercent.toFixed(1)}%
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                                    <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">Costo API</span>
                                    <span className="text-xl font-black text-white">€{totalApiCost.toFixed(2)}</span>
                                </div>
                                <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                                    <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">Profitto Netto</span>
                                    <span className={`text-xl font-black ${grossMargin >= 0 ? 'text-white' : 'text-rose-500'}`}>€{grossMargin.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <TrendingUp size={16} className="text-indigo-400" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Break-even Units</span>
                            </div>
                            <span className="text-lg font-black text-white">{breakEvenUnits}</span>
                        </div>
                        <p className="text-[8px] text-slate-500 uppercase font-bold mt-2 text-center tracking-tighter">
                            Unità da vendere per coprire 1.000€ di costi fissi
                        </p>
                    </div>
                </div>
            </div>

            {/* Feature Breakdown Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden">
                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" /> Analisi Dettagliata Consumi
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
                            <span>Modello Flash</span>
                            <span>{config.flashCredits} Richieste</span>
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 transition-all" style={{ width: `${(totalFlashCost / totalApiCost) * 100}%` }} />
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-300">Incidenza sul costo API</span>
                            <span className="text-xs font-black text-white">{((totalFlashCost / totalApiCost) * 100 || 0).toFixed(1)}%</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
                            <span>Modello Pro</span>
                            <span>{config.proCredits} Richieste</span>
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 transition-all" style={{ width: `${(totalProCost / totalApiCost) * 100}%` }} />
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-300">Incidenza sul costo API</span>
                            <span className="text-xs font-black text-white">{((totalProCost / totalApiCost) * 100 || 0).toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
