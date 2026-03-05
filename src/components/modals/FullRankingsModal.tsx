
import React, { useState } from 'react';
import { X, Trophy, Loader2, ArrowUpDown, ChevronUp, ChevronDown, Info } from 'lucide-react';
import { PointOfInterest } from '../../types/index';
import { useRankingsLogic, SortKey } from '../../hooks/useRankingsLogic';
import { PaginationControls } from '../common/PaginationControls'; // NEW IMPORT

// Sub-Components
import { CityRow } from '../rankings/CityRow';
import { PhotoGrid } from '../rankings/PhotoGrid';
import { PoiList } from '../rankings/PoiList';
import { RankingFilters, ALGO_CONFIG } from '../rankings/RankingFilters';

interface Props {
    onClose: () => void;
    onNavigateToCity?: (cityId: string) => void;
    onOpenPoi?: (poi: PointOfInterest) => void;
    onOpenPhoto?: (url: string) => void;
}

export const FullRankingsModal = ({ onClose, onNavigateToCity, onOpenPoi, onOpenPhoto }: Props) => {
    // USE HOOK
    const {
        mainTab, setMainTab,
        cityAlgo, setCityAlgo,
        sortKey, sortDir,
        search, setSearch,
        selectedZone, setSelectedZone,
        availableZones,
        loading,
        processedData,
        handleSort,
        // Pagination Props
        page, pageSize, totalItems, nextPage, prevPage
    } = useRankingsLogic();

    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const SortIcon = ({ col }: { col: SortKey }) => {
        // Se siamo su cities, il sort è disabilitato (server-side fisso su algo)
        if (mainTab === 'cities') return null;
        if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-50"/>;
        return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-amber-500"/> : <ChevronDown className="w-3 h-3 text-amber-500"/>;
    };

    return (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-0 md:p-4">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose}></div>
            
            {/* IMAGE PREVIEW OVERLAY */}
            {previewImage && (
                <div className="absolute inset-0 z-[3000] bg-black/95 flex items-center justify-center p-4 animate-in fade-in" onClick={() => setPreviewImage(null)}>
                    <div className="relative max-w-5xl max-h-full">
                        <img src={previewImage} alt="Preview" className="max-w-full max-h-[85vh] rounded-lg shadow-2xl border border-slate-700"/>
                        <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-red-600 transition-colors">
                            <X className="w-6 h-6"/>
                        </button>
                    </div>
                </div>
            )}

            <div className="relative bg-[#020617] w-full max-w-6xl h-full md:h-[90vh] md:rounded-3xl border-0 md:border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
                
                {/* HEADER & FILTERS */}
                <div className="flex flex-col p-6 border-b border-slate-800 bg-[#0f172a] shrink-0 gap-4">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-600 rounded-xl shadow-lg shadow-amber-900/20 text-white">
                                <Trophy className="w-8 h-8"/>
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-display font-bold text-white uppercase tracking-wide leading-none">Classifiche</h2>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Il meglio della Campania</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg">
                            <X className="w-6 h-6"/>
                        </button>
                    </div>

                    <RankingFilters 
                        mainTab={mainTab} setMainTab={setMainTab}
                        cityAlgo={cityAlgo} setCityAlgo={setCityAlgo}
                        search={search} setSearch={setSearch}
                        selectedZone={selectedZone} setSelectedZone={setSelectedZone}
                        availableZones={availableZones}
                        onClose={onClose}
                    />
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-[#020617] relative flex flex-col">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin"/>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Calcolo classifiche...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {mainTab === 'cities' && (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-[#0f172a] sticky top-0 z-10 shadow-sm border-b border-slate-800">
                                        <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            <th className="px-4 py-3 text-center cursor-pointer hover:text-white group" onClick={() => handleSort('rank')}><div className="flex justify-center items-center gap-1">Rank <SortIcon col="rank"/></div></th>
                                            <th className="px-4 py-3">Foto</th>
                                            <th className="px-4 py-3 cursor-pointer hover:text-white group" onClick={() => handleSort('name')}><div className="flex items-center gap-1">Città <SortIcon col="name"/></div></th>
                                            <th className="px-4 py-3 cursor-pointer hover:text-white group" onClick={() => handleSort('zone')}><div className="flex items-center gap-1">Zona <SortIcon col="zone"/></div></th>
                                            <th className="px-4 py-3 hidden md:table-cell">Contesto</th>
                                            <th className="px-4 py-3">Badge</th>
                                            <th className="px-4 py-3 text-right cursor-pointer hover:text-white group" onClick={() => handleSort('visitors')}><div className="flex justify-end items-center gap-1">Visitatori <SortIcon col="visitors"/></div></th>
                                            <th className="px-4 py-3 text-right cursor-pointer hover:text-white group" onClick={() => handleSort('rating')}><div className="flex justify-end items-center gap-1">Rating <SortIcon col="rating"/></div></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {processedData.map((city: any, idx: number) => (
                                            <CityRow 
                                                key={city.id} 
                                                item={city} 
                                                originalRank={city.originalRank || idx + 1}
                                                type={cityAlgo} 
                                                onNavigate={() => { onClose(); if (onNavigateToCity) onNavigateToCity(city.id); }}
                                                onZoom={setPreviewImage}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {mainTab === 'gallery' && (
                                <PhotoGrid photos={processedData as any} onClick={(url) => { if (onOpenPhoto) onOpenPhoto(url); }} />
                            )}

                            {mainTab === 'pois' && (
                                <PoiList pois={processedData as any} onClick={(poi) => { if (onOpenPoi) onOpenPoi(poi); }} />
                            )}

                            {processedData.length === 0 && (
                                <div className="text-center py-20 text-slate-500 italic bg-slate-900/30 m-6 rounded-3xl border border-slate-800 border-dashed">
                                    Nessun risultato trovato per la ricerca "{search}" {selectedZone ? `in zona "${selectedZone}"` : ''}.
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* FOOTER INFO - SOLO PER CITTÀ PAGINATE */}
                {mainTab === 'cities' && (
                    <div className="bg-[#0f172a] border-t border-slate-800 p-4 shrink-0 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-start gap-3 w-full md:w-auto">
                            <div className="p-2 bg-slate-800 rounded-full text-slate-400 shrink-0">
                                <Info className="w-4 h-4"/>
                            </div>
                            <div>
                                <h5 className="text-[10px] font-black uppercase text-slate-300 tracking-widest mb-1">
                                    Modalità Calcolo: {ALGO_CONFIG[cityAlgo].label}
                                </h5>
                                <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                                    {ALGO_CONFIG[cityAlgo].desc}
                                </p>
                            </div>
                        </div>
                        
                        {/* PAGINAZIONE */}
                        <div className="w-full md:w-auto flex justify-center">
                            <PaginationControls 
                                currentPage={page} 
                                maxPage={Math.ceil(totalItems / pageSize)} 
                                onNext={nextPage} 
                                onPrev={prevPage} 
                                totalItems={totalItems} 
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
