
import React from 'react';
import { CheckSquare, Square, Loader2, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { DatabasePoiStaging } from '../../../../types/database';

interface ImportTableProps {
    items: DatabasePoiStaging[];
    selectedIds: Set<string>;
    isLoading: boolean;
    totalItems: number;
    isSelectingAll: boolean;
    onSelectAll: () => void;
    onToggleSelection: (id: string) => void;
    
    // Sorting Props
    sortKey: string;
    sortDir: 'asc' | 'desc';
    onSort: (key: string) => void;
}

export const ImportTable = ({ 
    items, selectedIds, isLoading, totalItems, isSelectingAll, 
    onSelectAll, onToggleSelection, sortKey, sortDir, onSort 
}: ImportTableProps) => {

    const isAllSelected = items.length > 0 && selectedIds.size === totalItems;
    const isPartialSelected = selectedIds.size > 0 && selectedIds.size < totalItems;

    const SortIcon = ({ colKey }: { colKey: string }) => {
        if (sortKey !== colKey) return <ArrowUpDown className="w-2.5 h-2.5 text-slate-600 opacity-20 ml-1 inline"/>;
        return sortDir === 'asc' ? <ChevronUp className="w-2.5 h-2.5 text-amber-500 ml-1 inline"/> : <ChevronDown className="w-2.5 h-2.5 text-amber-500 ml-1 inline"/>;
    };

    const Th = ({ label, k, w }: { label: string, k: string, w: string }) => (
        <th 
            className={`p-3 cursor-pointer hover:bg-slate-900 transition-colors group whitespace-nowrap ${w}`} 
            onClick={() => onSort(k)}
        >
            <div className="flex items-center gap-1">{label} <SortIcon colKey={k}/></div>
        </th>
    );

    return (
        <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl min-h-0 flex flex-col">
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-[#0f172a] sticky top-0 z-10 shadow-sm border-b border-slate-800">
                        <tr className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                            <th className="p-3 w-10 text-center">
                                <button onClick={onSelectAll} disabled={isSelectingAll}>
                                    {isSelectingAll ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-slate-500"/>
                                    ) : (
                                        (isAllSelected || isPartialSelected) ? (
                                            isAllSelected ? <CheckSquare className="w-4 h-4 text-cyan-500"/> : <div className="w-4 h-4 bg-cyan-900 border border-cyan-500 rounded flex items-center justify-center text-cyan-500 font-bold">-</div>
                                        ) : <Square className="w-4 h-4"/>
                                    )}
                                </button>
                            </th>
                            <Th label="Nome (OSM)" k="name" w="w-64" />
                            <Th label="Categoria Raw" k="raw_category" w="w-32" />
                            <Th label="Indirizzo" k="address" w="w-48" />
                            <Th label="Status" k="processing_status" w="w-24 text-center" />
                            <Th label="AI Rating" k="ai_rating" w="w-24 text-center" />
                            <th className="p-3 w-32 text-right">Coordinate</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-xs text-slate-300 font-mono">
                        {isLoading ? (
                             <tr><td colSpan={7} className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-cyan-500 mx-auto"/></td></tr>
                        ) : items.map(item => (
                            <tr key={item.id} className={`hover:bg-slate-800/30 transition-colors ${selectedIds.has(item.id) ? 'bg-cyan-900/10' : ''}`}>
                                <td className="p-3 text-center align-middle">
                                    <button onClick={() => onToggleSelection(item.id)}>
                                        {selectedIds.has(item.id) ? <CheckSquare className="w-4 h-4 text-cyan-500"/> : <Square className="w-4 h-4 text-slate-600"/>}
                                    </button>
                                </td>
                                <td className="p-3 font-bold text-white truncate max-w-[200px]" title={item.name}>{item.name}</td>
                                <td className="p-3 text-slate-400 truncate max-w-[150px]" title={item.raw_category || ''}>{item.raw_category || '-'}</td>
                                <td className="p-3 text-slate-500 truncate max-w-[200px]" title={item.address || ''}>{item.address || '-'}</td>
                                <td className="p-3 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${item.processing_status === 'new' ? 'bg-blue-500/20 text-blue-400' : item.processing_status === 'ready' ? 'bg-emerald-500/20 text-emerald-400' : item.processing_status === 'discarded' ? 'bg-slate-700 text-slate-500' : 'bg-indigo-500/20 text-indigo-400'}`}>
                                        {item.processing_status}
                                    </span>
                                </td>
                                <td className="p-3 text-center">
                                    {item.ai_rating === 'high' && <span className="text-emerald-500 font-bold bg-emerald-900/20 px-2 py-0.5 rounded border border-emerald-500/20">HIGH</span>}
                                    {item.ai_rating === 'medium' && <span className="text-amber-500 font-bold bg-amber-900/20 px-2 py-0.5 rounded border border-amber-500/20">MED</span>}
                                    {item.ai_rating === 'service' && <span className="text-blue-400 font-bold bg-blue-900/20 px-2 py-0.5 rounded border border-blue-500/20">SVC</span>}
                                    {item.ai_rating === 'low' && <span className="text-red-500 font-bold bg-red-900/20 px-2 py-0.5 rounded border border-red-500/20">LOW</span>}
                                    {!item.ai_rating && <span className="text-slate-600">-</span>}
                                </td>
                                <td className="p-3 text-right text-[10px] text-slate-500">
                                    {item.coords_lat.toFixed(4)}, {item.coords_lng.toFixed(4)}
                                </td>
                            </tr>
                        ))}
                        {!isLoading && items.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-slate-500 italic">Nessun dato trovato.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
