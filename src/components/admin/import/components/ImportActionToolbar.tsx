
import React from 'react';
import { Loader2, Download, Sparkles, CheckCircle, XCircle, Trash2, Database, Eraser, Wrench, PlayCircle } from 'lucide-react';

interface ImportActionToolbarProps {
    selectedCount: number;
    
    // Status Flags
    isExporting: boolean;
    isAnalyzing: boolean;
    isBulkUpdating: boolean;
    isPublishing: boolean;
    
    // Progress Strings
    analysisProgress: string;
    publishProgress: string;
    
    // Action Handlers
    onExport: () => void;
    onFetchOsm: () => void;
    
    // Bulk Action Handlers
    onAiAnalysis: () => void;
    onBulkStatus: (status: 'ready' | 'discarded') => void;
    onPublish: () => void;
    onBulkDelete: () => void;
    
    // New
    onDeduplicate: () => void;
    isDeduplicating: boolean;
}

export const ImportActionToolbar = ({
    selectedCount,
    isAnalyzing,
    isBulkUpdating,
    isPublishing,
    analysisProgress,
    publishProgress,
    onFetchOsm,
    onAiAnalysis,
    onBulkStatus,
    onPublish,
    onBulkDelete,
    onDeduplicate,
    isDeduplicating
}: ImportActionToolbarProps) => {
    
    return (
        <div className="flex flex-wrap gap-2 items-center w-full justify-end">
             {/* GROUP 1: TOOLS (Sempre visibili) */}
             <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
                 {/* SCARICA OSM */}
                 <button 
                     onClick={onFetchOsm} 
                     className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors" 
                     title="Scarica da OSM"
                 >
                    <Download className="w-4 h-4"/> 
                    <span className="text-[10px] font-black uppercase tracking-wider">SCARICA OSM</span>
                 </button>
                 
                 <div className="w-px h-6 bg-slate-800 mx-1"></div>

                 {/* DEDUPLICA */}
                 <button 
                    onClick={onDeduplicate} 
                    disabled={isDeduplicating} 
                    className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors disabled:opacity-50" 
                    title="Deduplica Smart (Highlander)"
                 >
                    {isDeduplicating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Eraser className="w-4 h-4"/>}
                    <span className="text-[10px] font-black uppercase tracking-wider">DEDUPLICA</span>
                 </button>
             </div>
             
             {/* SEPARATOR */}
             {selectedCount > 0 && <div className="w-px h-6 bg-slate-800 mx-1"></div>}
             
             {/* GROUP 2: ACTIONS ON SELECTION */}
             {selectedCount > 0 ? (
                <>
                    {/* AI QUALITY */}
                    <button 
                        onClick={onAiAnalysis} 
                        disabled={isAnalyzing || isPublishing || isBulkUpdating}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 shadow-lg transition-colors disabled:opacity-50 min-w-max"
                    >
                        {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Sparkles className="w-3.5 h-3.5"/>} 
                        {isAnalyzing ? 'Analisi...' : 'AI QUALITY'}
                    </button>

                    {/* SEND TO READY */}
                    <button onClick={() => onBulkStatus('ready')} disabled={isBulkUpdating} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 shadow-lg transition-colors disabled:opacity-50 min-w-max">
                        {isBulkUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <CheckCircle className="w-3.5 h-3.5"/>} SEND TO READY
                    </button>
                    
                    {/* SEND TO DB (BOZZE) */}
                    <button 
                        onClick={onPublish}
                        disabled={isPublishing || isAnalyzing || isBulkUpdating}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 shadow-lg transition-colors disabled:opacity-50 border border-indigo-400 min-w-max"
                        title="Importa nel DB reale come Bozze"
                    >
                        {isPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Database className="w-3.5 h-3.5"/>} 
                        {isPublishing ? 'Importing...' : 'SEND TO DB (BOZZE)'}
                    </button>

                    {/* Secondary Actions Group */}
                    <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
                         {/* SEND TO DISCARDED */}
                         <button 
                            onClick={() => onBulkStatus('discarded')} 
                            disabled={isBulkUpdating} 
                            className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded transition-colors disabled:opacity-50" 
                            title="Scarta Selezionati"
                        >
                            <XCircle className="w-4 h-4"/>
                            <span className="text-[10px] font-black uppercase tracking-wider">SEND TO DISCARDED</span>
                        </button>
                        
                        <div className="w-px h-6 bg-slate-800 mx-1"></div>

                        {/* DELETE (Cestino) */}
                        <button onClick={onBulkDelete} disabled={isBulkUpdating} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-900/20 rounded transition-colors disabled:opacity-50" title="Elimina Definitivamente">
                            <Trash2 className="w-4 h-4"/>
                        </button>
                    </div>
                </>
             ) : (
                <span className="text-[10px] text-slate-500 italic ml-auto md:ml-0">Seleziona item per azioni.</span>
             )}
        </div>
    );
};
