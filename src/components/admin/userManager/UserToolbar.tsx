
import React from 'react';
import { Search, FileSpreadsheet, Plus, RefreshCw, FlaskConical } from 'lucide-react';

interface Props {
    filteredCount: number;
    searchTerm: string;
    onSearchChange: (v: string) => void;
    roleFilter: string;
    onRoleFilterChange: (v: string) => void;
    envFilter: 'all' | 'prod' | 'test';
    onEnvFilterChange: (v: any) => void;
    onExport: () => void;
    onCreate: () => void;
    onRefresh: () => void;
    isLoading: boolean;
}

export const UserToolbar = ({ 
    filteredCount, searchTerm, onSearchChange, 
    roleFilter, onRoleFilterChange, 
    envFilter, onEnvFilterChange,
    onExport, onCreate, onRefresh, isLoading
}: Props) => {
    return (
        <div className="flex flex-col md:flex-row gap-3 w-full animate-in fade-in">
            <div className="relative group flex-1 md:min-w-[250px]">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 group-focus-within:text-indigo-500 transition-colors"/>
                <input 
                    type="text" 
                    placeholder="Cerca nome o email..." 
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none placeholder:text-slate-600"
                />
            </div>
            
            <div className="flex gap-2 flex-wrap md:flex-nowrap justify-end">
                <div className="relative">
                    <FlaskConical className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none"/>
                    <select 
                        value={envFilter} 
                        onChange={(e) => onEnvFilterChange(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:border-indigo-500 outline-none w-full md:w-auto cursor-pointer"
                    >
                        <option value="all">Tutti gli Ambienti</option>
                        <option value="prod">Produzione (Reali)</option>
                        <option value="test">Collaudo (Test)</option>
                    </select>
                </div>

                <select 
                    value={roleFilter} 
                    onChange={(e) => onRoleFilterChange(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none w-full md:w-auto cursor-pointer"
                >
                    <option value="all">Tutti i Ruoli</option>
                    <option value="admin_all">Admin</option>
                    <option value="admin_limited">Moderatore</option>
                    <option value="business">Business</option>
                    <option value="user">Utente</option>
                </select>

                <button onClick={onExport} className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-2 rounded-lg border border-slate-700 transition-colors" title="Scarica CSV"><FileSpreadsheet className="w-4 h-4"/></button>
                <button onClick={onCreate} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-emerald-900/20 whitespace-nowrap border border-emerald-500"><Plus className="w-4 h-4"/> Crea</button>
                <button onClick={onRefresh} className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white p-2 rounded-lg border border-slate-700 transition-colors" title="Aggiorna"><RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}/></button>
            </div>
        </div>
    );
};
