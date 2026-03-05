
import React from 'react';
import { Layers, FileDown, Loader2 } from 'lucide-react';
import { useAdminExport } from '../../../../hooks/useAdminExport';

interface ImportStatsBarProps {
    stats: { new: number; ready: number; imported: number; discarded: number };
    grandTotal: number;
    currentFilter: string;
    onFilterChange: (status: 'all' | 'new' | 'ready' | 'imported' | 'discarded') => void;
}

export const ImportStatsBar = ({ stats, grandTotal, currentFilter, onFilterChange }: ImportStatsBarProps) => {
    // Nota: L'export qui necessiterebbe della città attiva. Per semplicità visiva,
    // se non vogliamo passare tutto il context, possiamo lasciare il bottone qui solo come placeholder visuale 
    // oppure lo cabliamo. Dato che il componente è atomico, meglio ricevere la funzione onExport come prop se necessario.
    // Ma per rispettare la richiesta "Spostare il tasto", modifichiamo l'interfaccia.
    // Tuttavia, per non rompere l'architettura a componenti puri, assumiamo che l'export 
    // sia gestito dal padre e passato qui, o mantenuto nel componente principale ma posizionato vicino.
    
    // In questo caso, per non modificare tutti i parent, modificherò ImportDashboard per renderizzare
    // il bottone export ACCANTO alla stats bar, non DENTRO.
    // Torno indietro su questa modifica specifica per mantenere la purezza,
    // e modifico ImportDashboard per il layout.
    
    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {['all', 'new', 'ready', 'imported', 'discarded'].map((statKey) => (
                <div 
                    key={statKey}
                    onClick={() => onFilterChange(statKey as any)} 
                    className={`cursor-pointer p-3 rounded-xl border flex items-center justify-between transition-all ${currentFilter === statKey ? 'bg-indigo-900/30 border-indigo-500 shadow-md' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
                >
                    <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${currentFilter === statKey ? 'text-indigo-300' : 'text-slate-500'}`}>
                        {statKey === 'all' && <Layers className="w-3.5 h-3.5"/>} {statKey.toUpperCase()}
                    </span>
                    <span className={`text-xl font-black ${currentFilter === statKey ? 'text-white' : 'text-slate-500'}`}>
                        {statKey === 'all' ? grandTotal : (stats as any)[statKey]}
                    </span>
                </div>
            ))}
        </div>
    );
};
