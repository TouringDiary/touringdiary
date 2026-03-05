
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Loader2, Trash2, FolderOpen, Image as ImageIcon, Copy, Check, Download, AlertTriangle, User, MapPin, CheckSquare, Square, X, Link as LinkIcon, Filter } from 'lucide-react';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { getAssetUsageMap } from '../../services/mediaService';
import { useAdminStyles } from '../../hooks/useAdminStyles'; // IMPORTATO STYLES

interface AssetFile {
    name: string;
    url: string;
    id: string; 
    created_at: string;
    metadata: any;
}

const BUCKET_NAME = 'public-media';
const FOLDERS = ['people_portraits', 'ai_generated', 'general', 'admin_assets', 'edited_assets', 'shop_products', 'comms_assets', 'onboarding_assets', 'social_templates'];

export const AdminAssetLibrary = () => {
    const [currentFolder, setCurrentFolder] = useState('people_portraits');
    const [files, setFiles] = useState<AssetFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const { styles } = useAdminStyles(); // USATO STILI DINAMICI
    
    // --- DB USAGE DATA ---
    const [usageMap, setUsageMap] = useState<Record<string, string[]>>({});
    
    // --- FILTERS ---
    const [filterUsage, setFilterUsage] = useState<'all' | 'used' | 'unused'>('all');
    
    // --- SELECTION & DELETE STATES ---
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [deleteTarget, setDeleteTarget] = useState<{ count: number, names: string[], hasUsed: boolean } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

    // Caricamento Iniziale Dati Utilizzo (RPC)
    useEffect(() => {
        const loadUsageData = async () => {
             const map = await getAssetUsageMap();
             setUsageMap(map);
        };
        loadUsageData();
    }, []);

    // Caricamento Files Storage
    const loadFiles = async () => {
        setIsLoading(true);
        setSelectedFiles(new Set()); // Reset selezione al cambio cartella
        try {
            const { data, error } = await supabase.storage.from(BUCKET_NAME).list(currentFolder, {
                limit: 100,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' },
            });

            if (error) throw error;

            const mappedFiles = data
                .filter(f => f.name !== '.emptyFolderPlaceholder')
                .map(f => {
                    const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(`${currentFolder}/${f.name}`);
                    return {
                        name: f.name,
                        url: publicUrl,
                        id: f.id || f.name,
                        created_at: f.created_at,
                        metadata: f.metadata
                    };
                });

            setFiles(mappedFiles);
        } catch (e) {
            console.error("Error loading assets:", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadFiles();
    }, [currentFolder]);

    // Check Usage Helper
    const getUsageInfo = (fileUrl: string) => {
        const cleanFileUrl = fileUrl.split('?')[0].trim();
        const usage = usageMap[cleanFileUrl];
        return {
            isUsed: !!usage && usage.length > 0,
            contexts: usage || []
        };
    };

    // --- FILTERED FILES ---
    const filteredFiles = useMemo(() => {
        if (filterUsage === 'all') return files;
        return files.filter(f => {
            const { isUsed } = getUsageInfo(f.url);
            return filterUsage === 'used' ? isUsed : !isUsed;
        });
    }, [files, filterUsage, usageMap]);

    // --- ACTIONS ---

    const handleCopy = (url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        setTimeout(() => setCopiedUrl(null), 2000);
    };

    const toggleSelection = (fileName: string) => {
        const newSet = new Set(selectedFiles);
        if (newSet.has(fileName)) newSet.delete(fileName);
        else newSet.add(fileName);
        setSelectedFiles(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedFiles.size === filteredFiles.length) {
            setSelectedFiles(new Set());
        } else {
            setSelectedFiles(new Set(filteredFiles.map(f => f.name)));
        }
    };

    const handleDeleteRequest = (fileNames: string[]) => {
        if (fileNames.length === 0) return;
        
        // Check if any selected file is in use
        let hasUsed = false;
        for (const name of fileNames) {
            const file = files.find(f => f.name === name);
            if (file) {
                const info = getUsageInfo(file.url);
                if (info.isUsed) { hasUsed = true; break; }
            }
        }
        
        setDeleteTarget({ count: fileNames.length, names: fileNames, hasUsed });
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            const paths = deleteTarget.names.map(name => `${currentFolder}/${name}`);
            const { error } = await supabase.storage.from(BUCKET_NAME).remove(paths);
            
            if (error) throw error;
            
            // Aggiorna UI locale
            setFiles(prev => prev.filter(f => !deleteTarget.names.includes(f.name)));
            setSelectedFiles(new Set()); // Pulisce selezione
            setDeleteTarget(null);
            
        } catch (e) {
            alert("Errore cancellazione file.");
            console.error(e);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex flex-col h-full space-y-6 relative">
            {/* MODALE CONFERMA CANCELLAZIONE */}
            <DeleteConfirmationModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title={deleteTarget?.count === 1 ? "Eliminare File?" : `Eliminare ${deleteTarget?.count} File?`}
                message={deleteTarget?.hasUsed 
                    ? `⚠️ ATTENZIONE: Alcuni file selezionati risultano "IN USO" nel sito. Se li elimini, si vedranno errori (immagini rotte) nelle pagine pubbliche.`
                    : `Stai per cancellare definitivamente ${deleteTarget?.count} element${deleteTarget?.count === 1 ? 'o' : 'i'} dallo storage.`
                }
                isDeleting={isDeleting}
                icon={<Trash2 className={`w-8 h-8 ${deleteTarget?.hasUsed ? 'text-amber-500 animate-pulse' : 'text-red-500'}`}/>}
                confirmLabel="Elimina Definitivamente"
                variant={deleteTarget?.hasUsed ? 'danger' : 'danger'} // Visivamente rosso se pericolo
            />

            {/* HEADER CLEAN DESIGN */}
            <div className="flex justify-between items-center mb-2 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-cyan-600 rounded-xl shadow-lg">
                        <ImageIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h2 className={styles.admin_page_title}>Libreria Media</h2>
                        <p className={styles.admin_page_subtitle}>Esplora, bonifica e gestisci i file del cloud</p>
                    </div>
                </div>
            </div>

            <div className="flex bg-slate-900 p-2 rounded-xl border border-slate-800 gap-2 overflow-x-auto shrink-0">
                {FOLDERS.map(folder => (
                    <button
                        key={folder}
                        onClick={() => setCurrentFolder(folder)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase whitespace-nowrap flex items-center gap-2 transition-all ${currentFolder === folder ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-950 text-slate-500 hover:text-white border border-slate-800'}`}
                    >
                        <FolderOpen className="w-3.5 h-3.5"/> {folder.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* ACTION BAR & FILTER */}
            <div className="flex flex-col md:flex-row items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-800 shrink-0 gap-3">
                <div className="flex items-center gap-2 w-full md:w-auto">
                     <button onClick={() => setFilterUsage('all')} className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${filterUsage === 'all' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}>Tutti</button>
                     <button onClick={() => setFilterUsage('used')} className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1 ${filterUsage === 'used' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30' : 'text-slate-500 hover:text-emerald-400'}`}><LinkIcon className="w-3 h-3"/> In Uso</button>
                     <button onClick={() => setFilterUsage('unused')} className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1 ${filterUsage === 'unused' ? 'bg-slate-800 text-slate-300 border border-slate-600' : 'text-slate-500 hover:text-white'}`}><Trash2 className="w-3 h-3"/> Inutilizzati</button>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                    <button onClick={toggleSelectAll} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold uppercase transition-colors">
                        {selectedFiles.size === filteredFiles.length && filteredFiles.length > 0 ? <CheckSquare className="w-4 h-4 text-indigo-500"/> : <Square className="w-4 h-4"/>}
                        Seleziona Tutto ({filteredFiles.length})
                    </button>
                    
                    {selectedFiles.size > 0 && (
                        <button 
                            onClick={() => handleDeleteRequest(Array.from(selectedFiles))}
                            className="flex items-center gap-2 px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold uppercase shadow-lg transition-all animate-in fade-in"
                        >
                            <Trash2 className="w-4 h-4"/> Elimina ({selectedFiles.size})
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col min-h-0 relative">
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center text-slate-500 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-cyan-500"/>
                        <span className="text-xs font-bold uppercase tracking-widest">Scansione Bucket...</span>
                    </div>
                ) : filteredFiles.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4">
                        <FolderOpen className="w-16 h-16 opacity-20"/>
                        <p className="text-sm italic">Nessun file trovato con questo filtro.</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-6">
                            {filteredFiles.map(file => {
                                const isSelected = selectedFiles.has(file.name);
                                const { isUsed, contexts } = getUsageInfo(file.url);
                                
                                return (
                                    <div 
                                        key={file.id} 
                                        onClick={() => toggleSelection(file.name)}
                                        className={`group relative bg-slate-950 rounded-xl border overflow-hidden shadow-md transition-all flex flex-col h-72 cursor-pointer ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500/50' : 'border-slate-800 hover:border-slate-600'}`}
                                    >
                                        {/* CHECKBOX OVERLAY */}
                                        <div className="absolute top-2 left-2 z-20">
                                            <div className={`p-1 rounded-md shadow-lg transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'bg-black/40 text-slate-300 hover:bg-black/60'}`}>
                                                {isSelected ? <CheckSquare className="w-4 h-4"/> : <Square className="w-4 h-4"/>}
                                            </div>
                                        </div>

                                        {/* USAGE BADGE */}
                                        <div className="absolute top-2 right-2 z-20">
                                            {isUsed ? (
                                                <div className="bg-emerald-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded shadow-lg flex items-center gap-1 group/tooltip relative">
                                                    <LinkIcon className="w-3 h-3"/> IN USO
                                                    {/* TOOLTIP ON HOVER */}
                                                    <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800 border border-slate-700 text-slate-300 p-2 rounded-lg text-[9px] shadow-xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity z-50">
                                                        <div className="font-bold text-white mb-1 border-b border-slate-700 pb-1">Usato in:</div>
                                                        <ul className="list-disc list-inside">
                                                            {contexts.slice(0, 5).map((c, i) => <li key={i} className="truncate">{c}</li>)}
                                                            {contexts.length > 5 && <li>...e altri {contexts.length - 5}</li>}
                                                        </ul>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-slate-700/50 text-slate-400 text-[8px] font-black uppercase px-2 py-0.5 rounded shadow-lg">
                                                    INUTILIZZATO
                                                </div>
                                            )}
                                        </div>

                                        <div className="h-40 overflow-hidden relative bg-[#050505] shrink-0">
                                            <ImageWithFallback src={file.url} alt={file.name} className="w-full h-full object-cover transition-transform group-hover:scale-105"/>
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); window.open(file.url, '_blank'); }} className="p-2 bg-slate-800 text-white rounded-full hover:bg-indigo-600 transition-colors shadow-lg" title="Apri Originale">
                                                    <Download className="w-4 h-4"/>
                                                </button>
                                                {/* TRASH SINGLE */}
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteRequest([file.name]); }} className="p-2 bg-slate-800 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg" title="Elimina">
                                                    <Trash2 className="w-4 h-4"/>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-3 flex-1 flex flex-col justify-between text-xs">
                                            <div className="space-y-1">
                                                <div className="text-[10px] text-slate-500 font-mono truncate" title={file.name}>
                                                    {file.name}
                                                </div>
                                            </div>
                                            
                                            <div className="pt-2 border-t border-slate-800 mt-2">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[9px] text-slate-600 font-mono">{new Date(file.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleCopy(file.url); }} 
                                                    className={`w-full text-[9px] font-bold px-2 py-1.5 rounded uppercase flex items-center justify-center gap-1 transition-colors ${copiedUrl === file.url ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30' : 'bg-slate-900 text-slate-500 hover:text-white border border-slate-800 hover:bg-slate-800'}`}
                                                >
                                                    {copiedUrl === file.url ? <Check className="w-3 h-3"/> : <Copy className="w-3 h-3"/>}
                                                    {copiedUrl === file.url ? 'Copiato' : 'Copia Link'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
