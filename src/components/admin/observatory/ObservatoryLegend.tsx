
import React from 'react';
import { AlertTriangle, MapPinOff, ImageOff, FileWarning, ShieldAlert, Info } from 'lucide-react';

interface Props {
    activeTab: 'overview' | 'anomalies' | 'duplicates';
}

export const ObservatoryLegend = ({ activeTab }: Props) => {
    
    if (activeTab === 'overview') {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-full">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-indigo-500"/> Guida Metriche
                </h4>
                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-500 mt-0.5">
                            <span className="font-bold text-xs">Total</span>
                        </div>
                        <div>
                            <p className="text-slate-300 text-xs font-bold">POI Censiti</p>
                            <p className="text-[10px] text-slate-500 leading-tight">Numero totale di punti di interesse nel database (esclusi quelli eliminati).</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-500 mt-0.5">
                            <span className="font-bold text-xs">Draft</span>
                        </div>
                        <div>
                            <p className="text-slate-300 text-xs font-bold">In Bozza</p>
                            <p className="text-[10px] text-slate-500 leading-tight">POI generati dall'AI o importati manualmente che necessitano di revisione umana.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (activeTab === 'anomalies') {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-full">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500"/> Tipi di Errore
                </h4>
                <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <MapPinOff className="w-3.5 h-3.5 text-red-400"/>
                        <span><strong className="text-slate-300">No GPS:</strong> Coordinate 0,0</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <ImageOff className="w-3.5 h-3.5 text-orange-400"/>
                        <span><strong className="text-slate-300">No Image:</strong> Nessuna foto/placeholder</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <FileWarning className="w-3.5 h-3.5 text-yellow-400"/>
                        <span><strong className="text-slate-300">Short Desc:</strong> Descrizione &lt; 50 caratteri</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <ShieldAlert className="w-3.5 h-3.5 text-indigo-400"/>
                        <span><strong className="text-slate-300">Low Trust:</strong> Segnalato inaffidabile da AI</span>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};
