import {
  Check,
  CheckSquare,
  Copy,
  Download,
  FolderOpen,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  Square,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAssetUsageMap } from '../../services/mediaService';
import { supabase } from '../../services/supabaseClient';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { AdminPageHeader } from './common/AdminPageHeader';

interface AssetFile {
  name: string;
  url: string;
  id: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

const BUCKET_NAME = 'public-media';
const FOLDERS = [
  'people_portraits',
  'ai_generated',
  'general',
  'admin_assets',
  'edited_assets',
  'shop_products',
  'comms_assets',
  'onboarding_assets',
  'social_templates',
];

export const AdminAssetLibrary = () => {
  const [currentFolder, setCurrentFolder] = useState('people_portraits');
  const [files, setFiles] = useState<AssetFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- DB USAGE DATA ---
  const [usageMap, setUsageMap] = useState<Record<string, string[]>>({});

  // --- FILTERS ---
  const [filterUsage, setFilterUsage] = useState<'all' | 'used' | 'unused'>('all');

  // --- SELECTION & DELETE STATES ---
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{
    count: number;
    names: string[];
    hasUsed: boolean;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Caricamento Iniziale Dati Utilizzo (RPC)
  useEffect(() => {
    const loadUsageData = async () => {
      const map = await getAssetUsageMap();
      setUsageMap(map);
    };
    void loadUsageData();
  }, []);

  // Caricamento Files Storage
  const loadFiles = useCallback(async () => {
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
        .filter((f) => f.name !== '.emptyFolderPlaceholder')
        .map((f) => {
          const {
            data: { publicUrl },
          } = supabase.storage.from(BUCKET_NAME).getPublicUrl(`${currentFolder}/${f.name}`);
          return {
            name: f.name,
            url: publicUrl,
            id: f.id || f.name,
            created_at: f.created_at ?? '',
            metadata: (f.metadata ?? null) as Record<string, unknown> | null,
          };
        });

      setFiles(mappedFiles);
    } catch (e) {
      console.error('Error loading assets:', e);
    } finally {
      setIsLoading(false);
    }
  }, [currentFolder]);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  // Check Usage Helper
  const getUsageInfo = (fileUrl: string) => {
    const cleanFileUrl = fileUrl.split('?')[0]?.trim() ?? '';
    const usage = usageMap[cleanFileUrl];
    return {
      isUsed: !!usage && usage.length > 0,
      contexts: usage || [],
    };
  };

  // --- FILTERED FILES ---
  const filteredFiles = useMemo(() => {
    if (filterUsage === 'all') return files;
    return files.filter((f) => {
      const cleanFileUrl = f.url.split('?')[0]?.trim() ?? '';
      const usage = usageMap[cleanFileUrl];
      const isUsed = !!usage && usage.length > 0;
      return filterUsage === 'used' ? isUsed : !isUsed;
    });
  }, [files, filterUsage, usageMap]);

  // --- ACTIONS ---

  const handleCopy = (url: string) => {
    void navigator.clipboard.writeText(url);
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
      setSelectedFiles(new Set(filteredFiles.map((f) => f.name)));
    }
  };

  const handleDeleteRequest = (fileNames: string[]) => {
    if (fileNames.length === 0) return;

    // Check if any selected file is in use
    let hasUsed = false;
    for (const name of fileNames) {
      const file = files.find((f) => f.name === name);
      if (file) {
        const info = getUsageInfo(file.url);
        if (info.isUsed) {
          hasUsed = true;
          break;
        }
      }
    }

    setDeleteTarget({ count: fileNames.length, names: fileNames, hasUsed });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const paths = deleteTarget.names.map((name) => `${currentFolder}/${name}`);
      const { error } = await supabase.storage.from(BUCKET_NAME).remove(paths);

      if (error) throw error;

      // Aggiorna UI locale
      setFiles((prev) => prev.filter((f) => !deleteTarget.names.includes(f.name)));
      setSelectedFiles(new Set()); // Pulisce selezione
      setDeleteTarget(null);
    } catch (e) {
      alert('Errore cancellazione file.');
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative flex h-full flex-col space-y-6">
      {/* MODALE CONFERMA CANCELLAZIONE */}
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={
          deleteTarget?.count === 1 ? 'Eliminare File?' : `Eliminare ${deleteTarget?.count} File?`
        }
        message={
          deleteTarget?.hasUsed
            ? `⚠️ ATTENZIONE: Alcuni file selezionati risultano "IN USO" nel sito. Se li elimini, si vedranno errori (immagini rotte) nelle pagine pubbliche.`
            : `Stai per cancellare definitivamente ${deleteTarget?.count} element${deleteTarget?.count === 1 ? 'o' : 'i'} dallo storage.`
        }
        isDeleting={isDeleting}
        icon={
          <Trash2
            className={`h-8 w-8 ${deleteTarget?.hasUsed ? 'animate-pulse text-amber-500' : 'text-red-500'}`}
          />
        }
        confirmLabel="Elimina Definitivamente"
        variant={deleteTarget?.hasUsed ? 'danger' : 'danger'} // Visivamente rosso se pericolo
      />

      <AdminPageHeader
        icon={ImageIcon}
        accent="cyan"
        title="Libreria Media"
        subtitle="Esplora, bonifica e gestisci i file del cloud"
      />

      <div className="flex shrink-0 gap-2 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-2">
        {FOLDERS.map((folder) => (
          <button
            type="button"
            key={folder}
            onClick={() => setCurrentFolder(folder)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold uppercase transition-all ${currentFolder === folder ? 'bg-indigo-600 text-white shadow-lg' : 'border border-slate-800 bg-slate-950 text-slate-500 hover:text-white'}`}
          >
            <FolderOpen className="h-3.5 w-3.5" /> {folder.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* ACTION BAR & FILTER */}
      <div className="flex shrink-0 flex-col items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-2 md:flex-row">
        <div className="flex w-full items-center gap-2 md:w-auto">
          <button
            type="button"
            onClick={() => setFilterUsage('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase transition-all ${filterUsage === 'all' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}
          >
            Tutti
          </button>
          <button
            type="button"
            onClick={() => setFilterUsage('used')}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold uppercase transition-all ${filterUsage === 'used' ? 'border border-emerald-500/30 bg-emerald-900/30 text-emerald-400' : 'text-slate-500 hover:text-emerald-400'}`}
          >
            <LinkIcon className="h-3 w-3" /> In Uso
          </button>
          <button
            type="button"
            onClick={() => setFilterUsage('unused')}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold uppercase transition-all ${filterUsage === 'unused' ? 'border border-slate-600 bg-slate-800 text-slate-300' : 'text-slate-500 hover:text-white'}`}
          >
            <Trash2 className="h-3 w-3" /> Inutilizzati
          </button>
        </div>

        <div className="flex w-full items-center justify-between gap-2 md:w-auto md:justify-end">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold uppercase text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            {selectedFiles.size === filteredFiles.length && filteredFiles.length > 0 ? (
              <CheckSquare className="h-4 w-4 text-indigo-500" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            Seleziona Tutto ({filteredFiles.length})
          </button>

          {selectedFiles.size > 0 && (
            <button
              type="button"
              onClick={() => handleDeleteRequest(Array.from(selectedFiles))}
              className="flex animate-in fade-in items-center gap-2 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold uppercase text-white shadow-lg transition-all hover:bg-red-500"
            >
              <Trash2 className="h-4 w-4" /> Elimina ({selectedFiles.size})
            </button>
          )}
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center gap-3 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
            <span className="text-xs font-bold uppercase tracking-widest">Scansione Bucket...</span>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-slate-500">
            <FolderOpen className="h-16 w-16 opacity-20" />
            <p className="text-sm italic">Nessun file trovato con questo filtro.</p>
          </div>
        ) : (
          <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4 xl:grid-cols-6">
              {filteredFiles.map((file) => {
                const isSelected = selectedFiles.has(file.name);
                const { isUsed, contexts } = getUsageInfo(file.url);

                return (
                  <div
                    key={file.id}
                    className={`group relative flex h-72 flex-col overflow-hidden rounded-xl border bg-slate-950 shadow-md transition-all ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500/50' : 'border-slate-800 hover:border-slate-600'}`}
                  >
                    {/* Hit-area selezione (intera card) — button aria; azioni nested restano sopra con z-index */}
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      aria-label={
                        isSelected ? `Deseleziona ${file.name}` : `Seleziona ${file.name}`
                      }
                      onClick={() => toggleSelection(file.name)}
                      className="absolute inset-0 z-0 cursor-pointer"
                    />

                    {/* CHECKBOX OVERLAY */}
                    <div className="pointer-events-none absolute top-2 left-2 z-dropdown">
                      <div
                        className={`rounded-md p-1 shadow-lg transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'bg-black/40 text-slate-300'}`}
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </div>
                    </div>

                    {/* USAGE BADGE */}
                    <div className="pointer-events-none absolute top-2 right-2 z-dropdown">
                      {isUsed ? (
                        <div className="group/tooltip relative flex items-center gap-1 rounded bg-emerald-600 px-2 py-0.5 text-[8px] font-black text-white uppercase shadow-lg">
                          <LinkIcon className="h-3 w-3" /> IN USO
                          {/* TOOLTIP ON HOVER */}
                          <div className="absolute top-full right-0 z-admin-modal mt-2 w-48 rounded-lg border border-slate-700 bg-slate-800 p-2 text-[9px] text-slate-300 opacity-0 shadow-xl transition-opacity group-hover/tooltip:opacity-100">
                            <div className="mb-1 border-b border-slate-700 pb-1 font-bold text-white">
                              Usato in:
                            </div>
                            <ul className="list-inside list-disc">
                              {contexts.slice(0, 5).map((c) => (
                                <li key={c} className="truncate">
                                  {c}
                                </li>
                              ))}
                              {contexts.length > 5 && <li>...e altri {contexts.length - 5}</li>}
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded bg-slate-700/50 px-2 py-0.5 text-[8px] font-black text-slate-400 uppercase shadow-lg">
                          INUTILIZZATO
                        </div>
                      )}
                    </div>

                    <div className="pointer-events-none relative z-10 flex h-full flex-col">
                      <div className="relative h-40 shrink-0 overflow-hidden bg-[#050505]">
                        <ImageWithFallback
                          src={file.url}
                          alt={file.name}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(file.url, '_blank');
                            }}
                            className="rounded-full bg-slate-800 p-2 text-white shadow-lg transition-colors hover:bg-indigo-600"
                            title="Apri Originale"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          {/* TRASH SINGLE */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRequest([file.name]);
                            }}
                            className="rounded-full bg-slate-800 p-2 text-white shadow-lg transition-colors hover:bg-red-600"
                            title="Elimina"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col justify-between p-3 text-xs">
                        <div className="space-y-1">
                          <div
                            className="truncate font-mono text-[10px] text-slate-500"
                            title={file.name}
                          >
                            {file.name}
                          </div>
                        </div>

                        <div className="pointer-events-auto mt-2 border-t border-slate-800 pt-2">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="font-mono text-[9px] text-slate-600">
                              {new Date(file.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(file.url);
                            }}
                            className={`flex w-full items-center justify-center gap-1 rounded px-2 py-1.5 text-[9px] font-bold uppercase transition-colors ${copiedUrl === file.url ? 'border border-emerald-500/30 bg-emerald-900/30 text-emerald-400' : 'border border-slate-800 bg-slate-900 text-slate-500 hover:bg-slate-800 hover:text-white'}`}
                          >
                            {copiedUrl === file.url ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            {copiedUrl === file.url ? 'Copiato' : 'Copia Link'}
                          </button>
                        </div>
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
