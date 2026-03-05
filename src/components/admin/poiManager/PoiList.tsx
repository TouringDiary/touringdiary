
import React from 'react';
import { CheckSquare, Square, Star, Calendar, RefreshCw, Eye, Trash2, Loader2, Check, Layers, X, User, ImageOff, ShieldCheck, ShieldAlert, Shield, ShieldQuestion, FilterX, ListPlus, LayoutList, TrendingUp } from 'lucide-react';
import { PointOfInterest } from '../../../types/index';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import { getPoiCategoryLabel, getSubCategoryLabel } from '../../../utils/common';
import { PaginationControls } from '../../common/PaginationControls';
import { getCachedPlaceholder } from '../../../services/settingsService'; 

interface PoiListProps {
    pois: PointOfInterest[];
    selectedIds: Set<string>;
    isLoading: boolean;
    page: number;
    totalItems: number;
    pageSize: number;
    sortBy: string;
    isBulkProcessing: boolean;
    viewStatus: 'published' | 'draft' | 'needs_check' | 'all'; 
    
    actions: {
        toggleSelection: (id: string) => void;
        onEdit: (poi: PointOfInterest) => void;
        onPreview: (poi: PointOfInterest) => void;
        onDeleteRequest: (poi: PointOfInterest) => void;
        setPage: (p: number | ((prev: number) => number)) => void;
        setPageSize: (size: number) => void; 
        bulkStatusChange: (status: 'published' | 'draft') => void;
        bulkDelete: () => void;
        resetSelection: () => void;
        resetFiltersAndReload: () => void; 
    };
    isSuperAdmin: boolean;
}

export const PoiList: React.FC<PoiListProps> = ({ 
    pois, selectedIds, isLoading, page, totalItems, pageSize, sortBy, 
    isBulkProcessing, viewStatus, actions, isSuperAdmin 
}) => {

    const isExpandedMode = pageSize > 20; 

    // FIX: Aggiunto index per fallback chiave
    const renderPoiCard = (poi: PointOfInterest, idx: number) => {
        const isSelected = selectedIds.has(poi.id);
        const editorName = poi.updatedBy || poi.createdBy || 'Sistema';
        
        const hasSpecific = !!poi.imageUrl;
        const hasPlaceholder = !!getCachedPlaceholder(poi.category);
        const isAssetMissing = !hasSpecific && !hasPlaceholder;
        
        // RELIABILITY BADGE
        let RelIcon = ShieldQuestion;
        let relColor = "text-slate-400 border-slate-600 bg-slate-900/80";
        let relLabel = "N/A";
        
        if (poi.aiReliability === 'high') {
             RelIcon = ShieldCheck;
             relColor = "text-emerald-400 border-emerald-500/50 bg-emerald-900/80";
             relLabel = "High";
        } else if (poi.aiReliability === 'medium') {
             RelIcon = Shield;
             relColor = "text-amber-400 border-amber-500/50 bg-amber-900/80";
             relLabel = "Med";
        } else if (poi.aiReliability === 'low') {
             RelIcon = ShieldAlert;
             relColor = "text-red-400 border-red-500/50 bg-red-900/80";
             relLabel = "Low";
        } else if (poi.aiReliability === 'invalidated') {
             RelIcon = X;
             relColor = "text-red-600 border-red-600 bg-red-950 text-white font-bold";
             relLabel = "INVALIDATO";
        }

        // INTEREST BADGE (Corrected Logic)
        let interestColor = "bg-slate-800 text-slate-500 border-slate-600";
        let interestLabel = "N/C";
        
        if (poi.tourismInterest === 'high') {
            interestColor = "bg-fuchsia-900/80 text-fuchsia-300 border-fuchsia-500/50 shadow-[0_0_10px_rgba(232,121,249,0.3)]";
            interestLabel = "TOP";
        } else if (poi.tourismInterest === 'medium') {
            interestColor = "bg-blue-900/80 text-blue-300 border-blue-500/50";
            interestLabel = "MED";
        } else if (poi.tourismInterest === 'low') {
            interestColor = "bg-slate-900/80 text-slate-400 border-slate-600";
            interestLabel = "LOW";
        }

        // Status Badge (Visible only in 'ALL' view)
        let statusBadge = null;
        if (viewStatus === 'all') {
            const statusColors: any = { 
                published: 'text-emerald-500 border-emerald-500/30 bg-emerald-900/20', 
                draft: 'text-amber-500 border-amber-500/30 bg-amber-900/20',
                needs_check: 'text-red-500 border-red-500/30 bg-red-900/20'
            };
            const sColor = statusColors[poi.status || 'draft'] || statusColors.draft;
            statusBadge = (
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${sColor} ml-2`}>
                    {poi.status === 'needs_check' ? 'CHECK' : poi.status}
                </span>
            );
        }

        return (
            <div key={poi.id || `poi-card-${idx}`} className={`bg-slate-900 rounded-2xl border overflow-hidden group hover:border-slate-600 transition-all shadow-md flex flex-col h-[340px] relative ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500' : isAssetMissing ? 'border-red-500/50' : 'border-slate-800'}`}>
                
                <div className="absolute top-2 left-2 z-30 flex items-center">
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); actions.toggleSelection(poi.id); }} className={`p-1.5 rounded-lg shadow-lg border transition-all ${isSelected ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-black/50 border-white/20 text-slate-300 hover:bg-black/70'}`}>
                        {isSelected ? <CheckSquare className="w-4 h-4"/> : <Square className="w-4 h-4"/>}
                    </button>
                    {statusBadge}
                </div>
                
                <div className={`absolute top-2 left-12 z-30 flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase border backdrop-blur-md shadow-lg ${relColor}`} title={`Affidabilità AI: ${relLabel}`} style={{marginLeft: viewStatus === 'all' ? '40px' : '0px'}}>
                    <RelIcon className="w-3 h-3"/> {relLabel}
                </div>
                
                {/* INTEREST BADGE ALWAYS VISIBLE (Shows N/C if missing) */}
                <div className={`absolute top-2 right-2 z-30 flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase border backdrop-blur-md shadow-lg ${interestColor}`} title={`Interesse Turistico: ${poi.tourismInterest || 'Non Classificato'}`}>
                    <TrendingUp className="w-3 h-3"/> {interestLabel}
                </div>
                
                {isAssetMissing && (
                    <div className="absolute top-10 right-2 z-30 bg-red-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded shadow-lg border border-red-400 flex items-center gap-1 animate-pulse pointer-events-none">
                        <ImageOff className="w-3 h-3"/> No Asset
                    </div>
                )}

                <div className="h-36 relative flex-shrink-0">
                    <ImageWithFallback src={poi.imageUrl} alt={poi.name} category={poi.category} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"/>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-transparent h-12"></div>
                    <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase backdrop-blur-sm border border-white/10">{getPoiCategoryLabel(poi.category)}</div>
                </div>
                <div className="p-4 flex flex-col flex-1 min-h-0 relative">
                    <div className="flex justify-between mb-2">
                        <h4 className="font-bold text-white text-sm truncate pr-2 cursor-pointer hover:text-indigo-400 transition-colors" onClick={() => actions.onEdit(poi)}>{poi.name}</h4>
                        <div className="flex flex-col items-end shrink-0">
                            <div className="flex items-center gap-1 text-amber-500 text-xs font-bold"><Star className="w-3 h-3 fill-current"/> {poi.rating}</div>
                            <div className="text-[9px] text-slate-500 flex items-center gap-1 mt-1">{sortBy === 'updated_at' ? <RefreshCw className="w-2.5 h-2.5"/> : <Calendar className="w-2.5 h-2.5"/>}{new Date(poi.updatedAt || poi.dateAdded || '').toLocaleDateString(undefined, {month:'short', day:'numeric'})}</div>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                         {poi.subCategory && <span className="text-[9px] bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded uppercase font-bold">{getSubCategoryLabel(poi.subCategory)}</span>}
                         <div className="flex items-center gap-1 text-[8px] text-slate-500 font-bold uppercase" title={`Modificato da ${editorName}`}>
                             <User className="w-2.5 h-2.5"/> {editorName.split(' ')[0]}
                         </div>
                    </div>
                    
                    <div className="flex-1 overflow-hidden mt-1"><p className="text-sm text-slate-400 line-clamp-3 leading-relaxed italic">"{poi.description || 'Nessuna descrizione.'}"</p></div>
                    <div className="flex gap-2 mt-auto pt-3 border-t border-slate-800/50 relative z-30">
                        <button onClick={() => actions.onPreview(poi)} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition-colors" title="Anteprima"><Eye className="w-4 h-4"/></button>
                        <button onClick={() => actions.onEdit(poi)} className="flex-1 bg-slate-800 hover:bg-indigo-600 text-white px-2 py-0.5 rounded-xl text-[10px] font-black border border-slate-700 uppercase transition-all shadow-md">Modifica</button>
                        {isSuperAdmin && (<button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); actions.onDeleteRequest(poi); }} className="p-2 rounded-xl border border-red-500/30 text-red-500 bg-red-900/10 hover:bg-red-900/40 transition-all cursor-pointer relative z-50 pointer-events-auto" title="Elimina Definitivamente"><Trash2 className="w-4 h-4 pointer-events-none"/></button>)}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col flex-1 min-h-0">
            {selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900 border border-indigo-500/50 rounded-2xl shadow-2xl p-2 flex items-center gap-2 animate-in slide-in-from-bottom-10">
                    <div className="bg-indigo-600 px-3 py-1.5 rounded-xl text-white font-bold text-xs flex items-center gap-2 mr-2">
                        <CheckSquare className="w-4 h-4"/> {selectedIds.size}
                    </div>
                    
                    <button onClick={() => actions.bulkStatusChange('published')} disabled={isBulkProcessing} className="px-4 py-2 hover:bg-emerald-900/30 text-emerald-400 hover:text-emerald-300 rounded-lg text-xs font-black uppercase transition-colors flex items-center gap-2 border border-transparent hover:border-emerald-500/30">
                        {isBulkProcessing ? <Loader2 className="w-3 h-3 animate-spin"/> : <Check className="w-3 h-3"/>} Pubblica
                    </button>
                    <button onClick={() => actions.bulkStatusChange('draft')} disabled={isBulkProcessing} className="px-4 py-2 hover:bg-amber-900/30 text-amber-400 hover:text-amber-300 rounded-lg text-xs font-black uppercase transition-colors flex items-center gap-2 border border-transparent hover:border-amber-500/30">
                        <Layers className="w-3 h-3"/> Bozza
                    </button>
                    <div className="w-px h-6 bg-slate-700 mx-1"></div>
                    <button onClick={actions.bulkDelete} disabled={isBulkProcessing} className="px-4 py-2 hover:bg-red-900/30 text-red-400 hover:text-red-300 rounded-lg text-xs font-black uppercase transition-colors flex items-center gap-2 border border-transparent hover:border-red-500/30">
                         <Trash2 className="w-3 h-3"/> Elimina
                    </button>
                    
                    <button onClick={actions.resetSelection} className="ml-2 p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors">
                        <X className="w-4 h-4"/>
                    </button>
                </div>
            )}

            <div className="flex-1">
                {isLoading ? (
                     <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-4">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-500"/>
                        <p className="font-bold uppercase tracking-widest text-xs">Caricamento...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {pois.map((poi, idx) => renderPoiCard(poi, idx))}
                        {pois.length === 0 && (
                            <div className="col-span-full py-20 text-center text-slate-500 italic bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed flex flex-col items-center justify-center gap-3">
                                <p>Nessun luogo trovato in questa vista ({viewStatus}).</p>
                                <button 
                                    onClick={actions.resetFiltersAndReload} 
                                    className="flex items-center gap-2 text-xs font-bold uppercase text-indigo-400 hover:text-white bg-slate-800 px-4 py-2 rounded-lg transition-colors border border-slate-700"
                                >
                                    <FilterX className="w-4 h-4"/> Reset Filtri
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* FOOTER DI NAVIGAZIONE ANCORATO */}
            <div className="mt-auto pt-6 pb-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                
                <div className="flex-1 w-full md:w-auto">
                    <PaginationControls 
                        currentPage={page} 
                        maxPage={Math.ceil(totalItems / pageSize)} 
                        onNext={() => actions.setPage(p => p + 1)} 
                        onPrev={() => actions.setPage(p => Math.max(1, p - 1))} 
                        totalItems={totalItems} 
                    />
                </div>

                <div className="flex items-center gap-4 text-right">
                    <div className="hidden md:block">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mr-2">Visualizzati</span>
                        <span className="text-white font-mono font-bold text-sm">
                            {pois.length} <span className="text-slate-600">/</span> {totalItems}
                        </span>
                    </div>

                    {isExpandedMode && (
                        <button 
                            onClick={() => { 
                                actions.setPageSize(12); 
                                actions.setPage(1); 
                            }} 
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-700 flex items-center gap-2 transition-transform active:scale-95 whitespace-nowrap w-full md:w-auto justify-center"
                        >
                            <LayoutList className="w-4 h-4"/> Paginazione
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
