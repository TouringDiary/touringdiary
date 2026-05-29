
import React, { useState, useMemo } from 'react';
import { Box, Pencil, Trash2, Filter, ScanSearch, Microscope, Bot, AlertTriangle } from 'lucide-react';
import { CitySummary, AiCitySuggestion } from '../../../types/index';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import { formatVisitors } from '../../../utils/common';

interface MissingItemData {
    name: string;
    visitors: number;
}

type ZoneListItem =
    | { type: 'real'; data: CitySummary }
    | { type: 'missing'; data: MissingItemData };

type SortKey = 'visitors' | 'status' | 'name';

interface ZoneCardProps {
    zoneName: string;
    cities: CitySummary[];
    aiSuggestions: AiCitySuggestion[];
    onSelectCity: (id: string) => void;
    onMagicGenerate: (name: string, poiCount: number, user?: any, existingId?: string, region?: string) => void;
    adminRegion: string;
    onRename: (name: string) => void;
    onDelete: (name: string) => void;
    onAuditCity: (city: CitySummary) => void;
    onImportMissing: (suggestion: AiCitySuggestion) => void;
    onAnalyzeZone: (zoneName: string) => void;
    onDeleteSuggestion: (item: { name: string, zoneName: string }) => void;
}

export const ZoneCard: React.FC<ZoneCardProps> = ({
    zoneName,
    cities,
    aiSuggestions,
    onSelectCity,
    onMagicGenerate,
    onRename,
    onDelete,
    onAuditCity,
    onImportMissing,
    onAnalyzeZone,
    onDeleteSuggestion,
    adminRegion
}) => {
    const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft' | 'missing'>('all');
    const [sortKey, setSortKey] = useState<SortKey>('status');

    const processedList = useMemo<ZoneListItem[]>(() => {
        const realItems: ZoneListItem[] = cities.map(c => ({
            type: 'real',
            data: c
        }));

        const missingItems: ZoneListItem[] = aiSuggestions.map(s => ({
            type: 'missing' as const,
            data: { name: s.name, visitors: s.visitors }
        }));

        let combined: ZoneListItem[] = [];

        switch (activeTab) {
            case 'published':
                combined = cities
                    .filter(c => c.status === 'published')
                    .map(c => ({ type: 'real' as const, data: c }));
                break;
            case 'draft':
                combined = cities
                    .filter(c => c.status !== 'published')
                    .map(c => ({ type: 'real' as const, data: c }));
                break;
            case 'missing':
                combined = missingItems;
                break;
            case 'all':
            default:
                combined = [...realItems, ...missingItems];
                break;
        }

        return combined.sort((a, b) => {
            const getVisitors = (item: ZoneListItem) =>
                item.type === 'real' ? item.data.visitors : item.data.visitors;
            const getName = (item: ZoneListItem) =>
                item.type === 'real' ? item.data.name : item.data.name;

            const getStatusScore = (item: ZoneListItem) => {
                if (item.type === 'missing') return 1;
                if (item.data.status === 'published') return 3;
                return 2;
            };

            if (sortKey === 'visitors') return (getVisitors(b) || 0) - (getVisitors(a) || 0);

            if (sortKey === 'status') {
                const scoreDiff = getStatusScore(b) - getStatusScore(a);
                if (scoreDiff !== 0) return scoreDiff;
                return (getVisitors(b) || 0) - (getVisitors(a) || 0);
            }

            if (sortKey === 'name') return getName(a).localeCompare(getName(b));

            return 0;
        });
    }, [activeTab, cities, aiSuggestions, sortKey]);

    const counts = {
        all: cities.length + aiSuggestions.length,
        published: cities.filter(c => c.status === 'published').length,
        draft: cities.filter(c => c.status !== 'published').length,
        missing: aiSuggestions.length
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all shadow-lg group flex flex-col h-[450px]">

            {/* HEADER ZONA */}
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex justify-between items-start group/header shrink-0">
                <div>
                    <h4 className="text-base font-bold text-white leading-tight mb-0.5">{zoneName}</h4>
                    <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        <Box className="w-3 h-3"/> {counts.all} Città
                    </div>
                </div>

                <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover/header:opacity-100 transition-opacity">
                    <button onClick={(e) => {e.stopPropagation(); onAnalyzeZone(zoneName)}} className="p-1.5 bg-indigo-900/30 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg transition-colors border border-indigo-500/30" title="Analisi AI Zona"><Microscope className="w-3 h-3"/></button>
                    <button onClick={(e) => {e.stopPropagation(); onRename(zoneName)}} className="p-1.5 bg-slate-800 hover:bg-amber-600 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700 hover:border-amber-500/30" title="Rinomina Zona"><Pencil className="w-3 h-3"/></button>
                    <button onClick={(e) => {e.stopPropagation(); onDelete(zoneName)}} className="p-1.5 bg-red-900/30 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-colors border border-red-500/30" title="Elimina Zona"><Trash2 className="w-3 h-3"/></button>
                </div>
            </div>

            {/* TABS */}
            <div className="flex bg-slate-900 p-1 border-b border-slate-800 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('all')} className={`flex-1 py-1 text-[9px] font-bold uppercase rounded transition-all whitespace-nowrap ${activeTab === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}>Tutte ({counts.all})</button>
                <button onClick={() => setActiveTab('published')} className={`flex-1 py-1 text-[9px] font-bold uppercase rounded transition-all whitespace-nowrap ${activeTab === 'published' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-emerald-400'}`}>Online ({counts.published})</button>
                <button onClick={() => setActiveTab('draft')} className={`flex-1 py-1 text-[9px] font-bold uppercase rounded transition-all whitespace-nowrap ${activeTab === 'draft' ? 'bg-amber-600 text-white shadow' : 'text-slate-500 hover:text-amber-400'}`}>Bozza ({counts.draft})</button>
                <button onClick={() => setActiveTab('missing')} className={`flex-1 py-1 text-[9px] font-bold uppercase rounded transition-all whitespace-nowrap ${activeTab === 'missing' ? 'bg-red-600 text-white shadow' : 'text-slate-500 hover:text-red-400'}`}>Mancanti ({counts.missing})</button>
            </div>

            {/* SORTING BAR */}
            <div className="flex justify-between items-center px-3 py-1.5 bg-slate-900 border-b border-slate-800/50">
                 <div className="flex items-center gap-1 text-[9px] text-slate-500 font-bold uppercase">
                    <Filter className="w-3 h-3"/> Ordina:
                 </div>
                 <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                     <button onClick={() => setSortKey('status')} className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-all ${sortKey === 'status' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Stato</button>
                     <button onClick={() => setSortKey('visitors')} className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-all ${sortKey === 'visitors' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Visitatori</button>
                     <button onClick={() => setSortKey('name')} className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-all ${sortKey === 'name' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>A-Z</button>
                 </div>
            </div>

            {/* LISTA UNIFICATA */}
            <div className="p-2 flex-1 bg-slate-900/50 overflow-y-auto custom-scrollbar">
                <div className="space-y-1">
                    {processedList.map((item, idx) => {
                        let cityName = '';
                        let cityVisitors = 0;
                        let cityImage = '';
                        let statusColor = '';
                        let statusText = '';
                        let rowBgClass = '';
                        let mainButton = null;
                        let cityId = '';

                        if (item.type === 'real') {
                            const c = item.data;
                            cityId = c.id;
                            cityName = c.name;
                            cityVisitors = c.visitors;
                            cityImage = c.imageUrl;

                            const isPublished = c.status === 'published';

                            rowBgClass = isPublished
                                ? 'bg-slate-900 border-slate-800 hover:border-emerald-500/30'
                                : 'bg-slate-900/40 border-slate-800 border-dashed hover:border-amber-500/30';

                            statusText = isPublished ? 'ONLINE' : 'BOZZA';
                            statusColor = isPublished ? 'text-emerald-400' : 'text-amber-400';

                            mainButton = (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onAuditCity(c); }}
                                    className="w-full h-full bg-indigo-900/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 rounded-lg transition-colors flex items-center justify-center gap-1"
                                    title="Cerca nuovi POI mancanti"
                                >
                                    <ScanSearch className="w-3.5 h-3.5"/> <span className="text-[8px] font-black uppercase tracking-tight">CERCA POI</span>
                                </button>
                            );

                        } else {
                            const m = item.data;
                            cityName = m.name;
                            cityVisitors = m.visitors || 0;

                            rowBgClass = "border border-red-900/20 bg-red-950/5 hover:bg-red-900/10";
                            statusText = "MANCANTE";
                            statusColor = "text-red-400";

                            mainButton = (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onMagicGenerate(cityName, 10, undefined, undefined, adminRegion); }}
                                    className="w-full h-full bg-purple-900/20 hover:bg-purple-600 border border-purple-500/30 text-purple-400 hover:text-white rounded-lg transition-colors flex items-center justify-center gap-1 shadow-lg"
                                    title="Genera Città e Contenuti con AI"
                                >
                                    <Bot className="w-3.5 h-3.5"/> <span className="text-[8px] font-black uppercase tracking-tight">COMPLETA CITTÀ (AI)</span>
                                </button>
                            );
                        }

                        return (
                            <div
                                key={item.type === 'real' ? cityId : `missing-${idx}`}
                                className={`w-full grid grid-cols-[36px_1fr_50px_85px_56px] gap-1.5 items-center p-2 rounded-xl border cursor-pointer transition-colors group/row text-left relative ${rowBgClass}`}
                                onClick={() => item.type === 'real'
                                    ? onSelectCity(cityId)
                                    : onMagicGenerate(cityName, 15, undefined, undefined, adminRegion)
                                }
                            >
                                <div className="w-9 h-8 rounded-lg overflow-hidden border border-slate-700 relative shrink-0 bg-slate-950 flex items-center justify-center">
                                    {item.type === 'real' ? (
                                        <ImageWithFallback src={cityImage} alt={cityName} className="w-full h-full object-cover"/>
                                    ) : (
                                        <div className="text-red-500/50"><AlertTriangle className="w-4 h-4"/></div>
                                    )}
                                </div>

                                <div className="min-w-0 overflow-hidden">
                                    <div className={`text-sm font-bold truncate leading-tight ${item.type === 'missing' ? 'text-red-300' : 'text-slate-200 group-hover/row:text-white'}`}>{cityName}</div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${item.type === 'real' ? (statusText === 'ONLINE' ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-red-500'}`}></div>
                                        <span className={`text-[8px] font-bold uppercase tracking-wide truncate ${statusColor}`}>
                                            {statusText}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <span className={`text-[10px] font-mono font-bold ${cityVisitors > 0 ? 'text-indigo-400' : 'text-slate-600'}`}>
                                        {formatVisitors(cityVisitors)}
                                    </span>
                                </div>

                                <div className="h-7 w-full">
                                    {mainButton}
                                </div>

                                <div className="h-7 w-full flex justify-end gap-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (item.type === 'real') {
                                                onSelectCity(cityId);
                                            } else {
                                                onMagicGenerate(cityName, 15, undefined, undefined, adminRegion);
                                            }
                                        }}
                                        className={`
                                            w-7 h-full rounded-lg flex items-center justify-center border transition-colors
                                            ${item.type === 'real'
                                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700'
                                                : 'bg-slate-900 border-slate-800 text-purple-400 hover:text-white hover:bg-purple-600 hover:border-purple-500'
                                            }
                                        `}
                                        title={item.type === 'real' ? "Modifica Manuale" : "Crea Città e Cerca POI"}
                                    >
                                        <Pencil className="w-3.5 h-3.5"/>
                                    </button>

                                    {item.type === 'missing' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteSuggestion({ name: cityName, zoneName });
                                            }}
                                            className="w-7 h-full rounded-lg flex items-center justify-center border transition-colors bg-red-900/20 hover:bg-red-600 border-red-500/30 text-red-500 hover:text-white"
                                            title="Rimuovi suggerimento AI"
                                        >
                                            <Trash2 className="w-3.5 h-3.5"/>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {processedList.length === 0 && (
                        <div className="text-center py-10 text-slate-600 italic text-xs">
                             Nessuna città nella lista.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
