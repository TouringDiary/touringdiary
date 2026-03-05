
import React from 'react';
import { CheckSquare, Loader2, Trash2, X } from 'lucide-react';

interface SponsorBulkActionsProps {
    isVisible: boolean;
    selectedCount: number;
    onBulkDelete: () => void;
    isBulkDeleting: boolean;
    onResetSelection: () => void;
}

export const SponsorBulkActions = ({
    isVisible,
    selectedCount,
    onBulkDelete,
    isBulkDeleting,
    onResetSelection
}: SponsorBulkActionsProps) => {
    
    if (!isVisible || selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900 border border-indigo-500/50 rounded-2xl shadow-2xl p-2 flex items-center gap-2 animate-in slide-in-from-bottom-10">
            <div className="bg-indigo-600 px-3 py-1.5 rounded-xl text-white font-bold text-xs flex items-center gap-2 mr-2">
                <CheckSquare className="w-4 h-4"/> {selectedCount}
            </div>
            
            <button 
                onClick={onBulkDelete} 
                disabled={isBulkDeleting} 
                className="px-4 py-2 hover:bg-red-900/30 text-red-400 hover:text-red-300 rounded-lg text-xs font-black uppercase transition-colors flex items-center gap-2 border border-transparent hover:border-red-500/30"
            >
                 {isBulkDeleting ? <Loader2 className="w-3 h-3 animate-spin"/> : <Trash2 className="w-3 h-3"/>}
                 Elimina
            </button>
            
            <div className="w-px h-6 bg-slate-700 mx-1"></div>
            
            <button onClick={onResetSelection} className="ml-1 p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors">
                <X className="w-4 h-4"/>
            </button>
        </div>
    );
};
