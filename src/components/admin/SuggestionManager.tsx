
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, MessageSquare, MapPin, Clock, CheckCircle, XCircle, ChevronRight, Loader2, Award, Info, FileText, AlertTriangle, Calendar, CheckSquare, Plus, PenTool, Edit3, Eye, Trash2 } from 'lucide-react';
import { getAllSuggestionsAsync, deleteSuggestion } from '../../services/communityService';
import { SuggestionRequest } from '../../types/index';
import { SuggestionReviewModal } from './SuggestionReviewModal';
import { User } from '../../types/users';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { useAdminStyles } from '../../hooks/useAdminStyles'; // IMPORTATO STYLES

interface Props {
    onUserUpdate?: (user: User) => void;
}

export const SuggestionManager = ({ onUserUpdate }: Props) => {
    const [suggestions, setSuggestions] = useState<SuggestionRequest[]>([]);
    const [filter, setFilter] = useState<SuggestionRequest['status'] | 'all'>('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSug, setSelectedSug] = useState<SuggestionRequest | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const { styles } = useAdminStyles(); // USATO STILI DINAMICI

    // DELETE STATE (Replicato da PoiManager)
    const [deleteTarget, setDeleteTarget] = useState<SuggestionRequest | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        const data = await getAllSuggestionsAsync();
        setSuggestions(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredList = useMemo(() => {
        return suggestions.filter(s => {
            const matchesStatus = filter === 'all' || s.status === filter;
            const matchesSearch = s.cityName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                (s.details.title && s.details.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                s.userName.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [suggestions, filter, searchTerm]);

    const handleUpdate = () => {
        loadData();
        setSelectedSug(null);
    };

    // Handler apertura modale
    const handleDeleteRequest = (e: React.MouseEvent, item: SuggestionRequest) => {
        e.stopPropagation();
        setDeleteTarget(item);
    };

    // Handler conferma cancellazione
    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await deleteSuggestion(deleteTarget.id);
            setSuggestions(prev => prev.filter(s => s.id !== deleteTarget.id));
            setDeleteTarget(null);
        } catch (e) {
            console.error(e);
            alert("Errore durante l'eliminazione.");
        } finally {
            setIsDeleting(false);
        }
    };

    const pendingCount = suggestions.filter(s => s.status === 'pending').length;

    return (
        <div className="space-y-6 animate-in fade-in flex flex-col h-full relative">
            
            {/* DELETE MODAL */}
            <DeleteConfirmationModal 
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="Eliminare Segnalazione?"
                message={`Stai per eliminare definitivamente la segnalazione di ${deleteTarget?.userName} su "${deleteTarget?.details.title}".\nL'azione è irreversibile.`}
                isDeleting={isDeleting}
            />

            {/* HEADER CLEAN DESIGN */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-600 rounded-xl shadow-lg">
                        <FileText className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className={styles.admin_page_title}>Segnalazioni</h2>
                            {pendingCount > 0 && (
                                <span className="bg-rose-600 text-white text-xs font-black px-2 py-1 rounded-full shadow-lg animate-pulse">
                                    {pendingCount} NUOVE
                                </span>
                            )}
                        </div>
                        <p className={styles.admin_page_subtitle}>Gestisci i contributi editoriali della community</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shrink-0">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center w-full xl:w-auto">
                    <div className="relative group w-full md:w-64">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 group-focus-within:text-indigo-500 transition-colors"/>
                        <input 
                            type="text" 
                            placeholder="Cerca città, luogo, utente..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                        />
                    </div>
                    
                    <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 w-full md:w-auto overflow-x-auto">
                        {(['pending', 'processing', 'approved', 'rejected'] as const).map(s => (
                            <button 
                                key={s} 
                                onClick={() => setFilter(s)} 
                                className={`flex-1 md:flex-none px-4 py-2 rounded-md text-[10px] font-bold uppercase transition-all whitespace-nowrap ${filter === s ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                            >
                                {s === 'pending' ? 'Nuove' : s === 'processing' ? 'In verifica' : s === 'approved' ? 'OK' : 'Rifiutate'}
                                {suggestions.filter(x => x.status === s).length > 0 && <span className="ml-1.5 bg-slate-950 px-1.5 rounded opacity-70">{suggestions.filter(x => x.status === s).length}</span>}
                            </button>
                        ))}
                        <button onClick={() => setFilter('all')} className={`flex-1 md:flex-none px-4 py-2 rounded-md text-[10px] font-bold uppercase transition-all ${filter === 'all' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>Tutte</button>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col min-h-0">
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500"/>
                    </div>
                ) : (
                    <div className="overflow-x-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-slate-950/80 text-slate-500 text-[9px] uppercase font-bold sticky top-0 z-10 border-b border-slate-800 backdrop-blur-md">
                                    <th className="px-6 py-4 w-40">Utente</th>
                                    <th className="px-6 py-4 w-40">Città</th>
                                    <th className="px-6 py-4 w-32">Tipo</th>
                                    <th className="px-6 py-4 w-64">Oggetto</th>
                                    <th className="px-6 py-4 w-32 text-center">Status</th>
                                    <th className="px-6 py-4 text-center">Data</th>
                                    <th className="px-6 py-4 text-right">Azioni</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {filteredList.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-10 text-slate-500 italic">Nessuna segnalazione trovata.</td></tr>
                                ) : (
                                    filteredList.map((s) => (
                                        <tr key={s.id} onClick={() => setSelectedSug(s)} className={`cursor-pointer hover:bg-slate-800/40 transition-colors group ${s.status === 'pending' ? 'bg-indigo-900/10' : ''}`}>
                                            <td className="px-6 py-4 text-xs text-white font-medium">{s.userName}</td>
                                            <td className="px-6 py-4 text-xs text-indigo-400 font-bold uppercase">{s.cityName}</td>
                                            <td className="px-6 py-4">
                                                <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded border ${s.type === 'new_place' ? 'bg-emerald-900/20 text-emerald-500 border-emerald-500/20' : 'bg-blue-900/20 text-blue-400 border-blue-500/20'}`}>
                                                    {s.type === 'new_place' ? 'Nuovo Luogo' : 'Correzione'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-white text-sm truncate max-w-xs">{s.details.title}</div>
                                                <div className="text-[10px] text-slate-500 truncate max-w-xs">{s.details.description}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${s.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : s.status === 'rejected' ? 'bg-red-500/20 text-red-400' : s.status === 'processing' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-500 animate-pulse'}`}>
                                                    {s.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-[10px] font-mono text-slate-500">
                                                {new Date(s.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 items-center">
                                                    {/* TASTO TRASH (Sempre visibile, non propaga click alla riga) */}
                                                    <button 
                                                        onClick={(e) => handleDeleteRequest(e, s)}
                                                        className="p-2 bg-slate-800 hover:bg-red-900/20 text-slate-500 hover:text-red-500 rounded transition-all opacity-0 group-hover:opacity-100"
                                                        title="Elimina"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5"/>
                                                    </button>
                                                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors"/>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedSug && (
                <SuggestionReviewModal 
                    suggestion={selectedSug} 
                    onClose={() => setSelectedSug(null)} 
                    onUpdate={handleUpdate} 
                    onUserUpdate={onUserUpdate}
                />
            )}
        </div>
    );
};
