
import React from 'react';
import { Search, FileSpreadsheet, CalendarPlus, CheckSquare, Square, Trash2, Mail, MailOpen, ArrowUpDown, Loader2 } from 'lucide-react';
import { SponsorRequest } from '../../../types/index';

interface SponsorToolbarProps {
    isVisible: boolean;
    searchTerm: string;
    onSearchChange: (val: string) => void;
    onExport: () => void;
    onMassExtension: () => void;
    
    // Selection Props
    isSuperAdmin: boolean;
    selectedCount: number;
    totalOnPage: number;
    areAllSelected: boolean;
    onToggleAll: () => void;
    onBulkDeleteClick: () => void;
    isBulkDeleting: boolean;

    // Filter Props
    pageSize: number;
    onPageSizeChange: (size: number) => void;
    onlyUnread: boolean;
    onToggleUnread: () => void;
    
    // Sort Props
    sortConfig: { key: string; direction: 'asc' | 'desc' };
    onSortChange: (config: any) => void;
}

export const SponsorToolbar = ({
    isVisible,
    searchTerm,
    onSearchChange,
    onExport,
    onMassExtension,
    isSuperAdmin,
    selectedCount,
    areAllSelected,
    onToggleAll,
    onBulkDeleteClick,
    isBulkDeleting,
    pageSize,
    onPageSizeChange,
    onlyUnread,
    onToggleUnread,
    sortConfig,
    onSortChange
}: SponsorToolbarProps) => {
    
    if (!isVisible) return null;

    return (
        <div className="flex flex-col md:flex-row w-full xl:w-auto gap-3 items-start md:items-center animate-in fade-in">
            {/* SELECT ALL FOR BULK ACTIONS (SUPER ADMIN ONLY) */}
            {isSuperAdmin && (
                 <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg p-2">
                    <button 
                        onClick={onToggleAll} 
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="Seleziona tutti nella pagina"
                    >
                        {areAllSelected ? <CheckSquare className="w-5 h-5 text-indigo-500"/> : <Square className="w-5 h-5"/>}
                    </button>
                    {selectedCount > 0 && (
                        <button 
                            onClick={onBulkDeleteClick} 
                            disabled={isBulkDeleting}
                            className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-xs font-bold uppercase flex items-center gap-1 shadow-lg transition-all disabled:opacity-50"
                        >
                            {isBulkDeleting ? <Loader2 className="w-3 h-3 animate-spin"/> : <Trash2 className="w-3 h-3"/>}
                            Elimina ({selectedCount})
                        </button>
                    )}
                 </div>
            )}

            <div className="relative group w-full md:w-48">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 group-focus-within:text-indigo-500 transition-colors"/>
                <input 
                    type="text" 
                    placeholder="Cerca Partner..." 
                    value={searchTerm}
                    onChange={e => onSearchChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none placeholder:text-slate-600 transition-colors"
                />
            </div>

            <div className="flex gap-2">
                <button onClick={onExport} className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-800 hover:border-slate-600 flex items-center gap-2 text-xs font-bold uppercase shadow-sm">
                    <FileSpreadsheet className="w-3.5 h-3.5"/> CSV
                </button>
                <button onClick={onMassExtension} className="px-3 py-2 bg-slate-900 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-800 hover:border-indigo-500 flex items-center gap-2 text-xs font-bold uppercase shadow-sm">
                    <CalendarPlus className="w-3.5 h-3.5"/> <span className="hidden lg:inline">Estensione</span>
                </button>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <select 
                    value={pageSize} 
                    onChange={(e) => onPageSizeChange(parseInt(e.target.value))} 
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-xs font-bold text-slate-400 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                    <option value={10}>10 / pag</option>
                    <option value={20}>20 / pag</option>
                    <option value={50}>50 / pag</option>
                    <option value={100}>100 / pag</option>
                    <option value={500}>500 / pag</option>
                </select>

                <button onClick={onToggleUnread} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all text-xs font-bold uppercase shadow-sm ${onlyUnread ? 'bg-rose-600 border-rose-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white'}`}>
                    {onlyUnread ? <Mail className="w-3.5 h-3.5 animate-pulse" /> : <MailOpen className="w-3.5 h-3.5" />}
                    <span className="hidden md:inline">{onlyUnread ? 'SOLO NON LETTI' : 'TUTTI'}</span>
                </button>
                
                <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-lg border border-slate-800 flex-1 md:flex-none justify-between md:justify-start">
                    <select value={sortConfig.key} onChange={(e) => onSortChange({ ...sortConfig, key: e.target.value as any })} className="bg-transparent text-xs text-white focus:outline-none w-full md:w-24 font-bold cursor-pointer pl-1">
                        <option value="lastModified">Recenti</option>
                        <option value="date">Creato</option>
                        <option value="endDate">Scadenza</option>
                    </select>
                    <button onClick={() => onSortChange({ ...sortConfig, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors">
                        <ArrowUpDown className="w-4 h-4"/>
                    </button>
                </div>
            </div>
        </div>
    );
};
