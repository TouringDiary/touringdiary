
import React from 'react';
import { Check, X, Undo2, RefreshCw, Edit3, Crop, Trash2, AlertTriangle, Link } from 'lucide-react';
import { PhotoSubmission, CitySummary } from '../../../types/index';
import { ImageWithFallback } from '../../common/ImageWithFallback';

interface PhotoRowProps {
    photo: PhotoSubmission;
    manifest: CitySummary[];
    isSuperAdmin: boolean;
    actions: {
        onStatusUpdate: (id: string, status: 'approved' | 'rejected' | 'pending') => void;
        onDeleteRequest: (photo: PhotoSubmission) => void;
        onOpenInspector: (photo: PhotoSubmission) => void;
        onOpenMetadata: (photo: PhotoSubmission) => void;
    };
}

// Helpers
const getCleanFilename = (photo: PhotoSubmission) => {
    if (!photo.url) return 'no-file';
    try {
        const urlObj = new URL(photo.url);
        const pathParts = urlObj.pathname.split('/');
        const rawName = pathParts[pathParts.length - 1];
        // Rimuove prefissi numerici/timestamp comuni
        const cleaned = rawName.replace(/^[^_]+_\d+_/, '');
        if (cleaned && cleaned.length < 20) return cleaned;
        if (cleaned.length >= 20) return cleaned.substring(0, 15) + '...';
        return 'file.jpg';
    } catch (e) {
        return 'image';
    }
};

const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export const PhotoRow: React.FC<PhotoRowProps> = ({ photo, manifest, isSuperAdmin, actions }) => {
    const filename = getCleanFilename(photo);
    
    const cityInfo = manifest.find(c => c.name.toLowerCase() === photo.locationName.toLowerCase());
    const isOrphan = !cityInfo && photo.status === 'city_deleted';
    const safeAlt = photo.locationName || 'Foto';
    
    // FIX: Usa l'URL originale senza manipolazioni aggressive. 
    // Il browser e ImageWithFallback gestiscono correttamente gli spazi e l'encoding.
    const displayUrl = photo.url ? photo.url.trim() : '';
    
    return (
        <tr className={`hover:bg-slate-800/30 transition-colors group text-xs ${isOrphan ? 'bg-red-950/10' : ''}`}>
            <td className="px-4 py-3 text-center align-middle w-20">
                <div 
                    className="w-12 h-9 bg-slate-800 rounded mx-auto overflow-hidden border border-slate-700 cursor-pointer hover:border-indigo-500 transition-all shadow-sm group-hover:scale-110 relative"
                    title={displayUrl}
                    onClick={() => actions.onOpenInspector(photo)}
                >
                    {displayUrl ? (
                         <ImageWithFallback 
                            src={displayUrl} 
                            className="w-full h-full object-cover" 
                            alt={safeAlt}
                            size="original" 
                            category="discovery" 
                            priority={true} 
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">N/D</div>
                    )}
                </div>
            </td>
            <td className="px-4 py-3 align-middle">
                <div className="flex flex-col">
                    <span className={`text-xs font-bold mb-0.5 flex items-center gap-1.5 ${isOrphan ? 'text-red-400 line-through decoration-red-500/50' : 'text-white'}`}>
                        {photo.locationName}
                        {displayUrl && (
                             <a href={displayUrl} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-blue-400" onClick={e => e.stopPropagation()}>
                                <Link className="w-3 h-3"/>
                             </a>
                        )}
                    </span>
                    
                    {cityInfo ? (
                        <div className="flex gap-1 mb-1 opacity-70">
                            <span className="text-[8px] bg-slate-800 text-slate-400 px-1.5 rounded uppercase font-mono">{cityInfo.zone}</span>
                        </div>
                    ) : isOrphan ? (
                        <div className="flex gap-1 mb-1">
                            <span className="text-[8px] bg-red-900/30 text-red-400 px-1.5 rounded uppercase font-bold flex items-center gap-1 border border-red-500/30">
                                <AlertTriangle className="w-2.5 h-2.5"/> Città Eliminata
                            </span>
                        </div>
                    ) : (
                        <div className="flex gap-1 mb-1">
                             <span className="text-[8px] bg-slate-800 text-slate-500 px-1.5 rounded uppercase font-mono italic">Zona N/D</span>
                        </div>
                    )}

                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span className="font-bold text-slate-400">{photo.user}</span>
                        <span className="text-slate-700">•</span>
                        <span className="font-mono truncate max-w-[100px] opacity-60" title={photo.url}>{filename}</span>
                    </div>
                    {photo.description && (
                        <div className="flex items-center gap-1 mt-0.5">
                            <p className="text-[10px] text-slate-400 italic truncate max-w-md border-l-2 border-slate-700 pl-2">
                                {photo.description}
                            </p>
                        </div>
                    )}
                </div>
            </td>
            
            <td className="px-4 py-3 text-center align-middle font-mono text-[10px] text-slate-500">
                {formatDate(photo.date)}
            </td>
            <td className="px-4 py-3 text-center align-middle font-mono text-[10px] text-emerald-500 font-bold">
                {photo.publishedAt ? formatDate(photo.publishedAt) : '-'}
            </td>
            
            <td className="px-4 py-3 text-center align-middle">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight border ${
                        photo.status === 'approved' ? 'bg-emerald-900/20 text-emerald-500 border-emerald-500/30' : 
                        photo.status === 'rejected' ? 'bg-red-900/20 text-red-500 border-red-500/30' : 
                        photo.status === 'city_deleted' ? 'bg-slate-800 text-slate-400 border-slate-600' :
                        'bg-amber-900/20 text-amber-500 border-amber-500/30'
                    }`}>
                    {photo.status === 'approved' ? 'PUBBLICATO' : photo.status === 'rejected' ? 'RIFIUTATO' : photo.status === 'city_deleted' ? 'ORFANO' : 'IN REVISIONE'}
                </span>
            </td>

            <td className="px-4 py-3 align-middle text-right">
                <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    {photo.status === 'pending' && (
                        <>
                            <button onClick={() => actions.onStatusUpdate(photo.id, 'approved')} className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-lg transition-transform active:scale-95" title="Approva"><Check className="w-3.5 h-3.5"/></button>
                            <button onClick={() => actions.onStatusUpdate(photo.id, 'rejected')} className="p-1.5 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700 hover:border-red-500" title="Rifiuta"><X className="w-3.5 h-3.5"/></button>
                        </>
                    )}

                    {photo.status === 'city_deleted' && (
                        <button onClick={() => actions.onStatusUpdate(photo.id, 'approved')} className="p-1.5 bg-slate-800 hover:bg-emerald-600 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700 hover:border-emerald-500 flex items-center gap-1" title="Ripristina (Se città esiste)">
                            <RefreshCw className="w-3.5 h-3.5"/>
                        </button>
                    )}

                    {photo.status !== 'pending' && photo.status !== 'city_deleted' && (
                        <>
                            <button onClick={() => actions.onStatusUpdate(photo.id, 'pending')} className="p-1.5 hover:bg-blue-900/30 text-slate-500 hover:text-blue-400 rounded transition-colors" title="Ripristina"><Undo2 className="w-3.5 h-3.5"/></button>
                        </>
                    )}
                    
                    <button onClick={() => actions.onOpenMetadata(photo)} className="p-1.5 hover:bg-indigo-900/30 text-slate-500 hover:text-indigo-400 rounded transition-colors" title="Modifica Dati"><Edit3 className="w-3.5 h-3.5"/></button>
                    <button onClick={() => actions.onOpenInspector(photo)} className="p-1.5 hover:bg-indigo-900/30 text-slate-500 hover:text-indigo-400 rounded transition-colors" title="Ritaglia"><Crop className="w-3.5 h-3.5"/></button>

                    {isSuperAdmin && (
                        <button onClick={() => actions.onDeleteRequest(photo)} className="p-1.5 hover:bg-red-900/20 text-slate-600 hover:text-red-500 rounded transition-colors" title="Elimina Definitivamente"><Trash2 className="w-3.5 h-3.5"/></button>
                    )}
                </div>
            </td>
        </tr>
    );
};
