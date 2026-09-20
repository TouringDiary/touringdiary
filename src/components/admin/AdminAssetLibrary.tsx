import {
  Check,
  CheckSquare,
  Copy,
  Database,
  Download,
  FolderOpen,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  Square,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { listMediaCatalogPage, type MediaCatalogRow } from '@/services/media/mediaCatalogService';
import { getAssetUsageMap, publicMediaPathFromUrl } from '../../services/mediaService';
import { supabase } from '../../services/supabaseClient';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { AdminPageHeader } from './common/AdminPageHeader';
import { MediaAssetDetailPanel } from './media/MediaAssetDetailPanel';

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
  'verified/wikimedia',
];

type LibraryMode = 'catalog' | 'storage';

export const AdminAssetLibrary = () => {
  const [libraryMode, setLibraryMode] = useState<LibraryMode>('catalog');
  const [currentFolder, setCurrentFolder] = useState('people_portraits');
  const [files, setFiles] = useState<AssetFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [catalogRows, setCatalogRows] = useState<MediaCatalogRow[]>([]);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [catalogOffset, setCatalogOffset] = useState(0);
  const [catalogPageSize] = useState(48);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogUsageFilter, setCatalogUsageFilter] = useState<'all' | 'used' | 'unused'>('all');
  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null);
  const [detailAsset, setDetailAsset] = useState<MediaCatalogRow | null>(null);

  const [usageMap, setUsageMap] = useState<Record<string, string[]>>({});
  const [filterUsage, setFilterUsage] = useState<'all' | 'used' | 'unused'>('all');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{
    count: number;
    names: string[];
    hasUsed: boolean;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  /** Path oggetto public-media presenti nel catalogo MF4 (evita delete Storage su asset gestiti). */
  const [catalogStoragePaths, setCatalogStoragePaths] = useState<Set<string>>(() => new Set());
  const [catalogPathIndexState, setCatalogPathIndexState] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );

  useEffect(() => {
    const loadUsageData = async () => {
      const map = await getAssetUsageMap();
      setUsageMap(map);
    };
    void loadUsageData();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setCatalogPathIndexState('loading');

    void (async () => {
      try {
        const paths = new Set<string>();
        const pageSize = 200;
        let offset = 0;
        let total = Number.POSITIVE_INFINITY;

        while (offset < total) {
          const page = await listMediaCatalogPage({
            limit: pageSize,
            offset,
            filters: { storageBucket: BUCKET_NAME, includeArchived: true },
          });
          for (const row of page.rows) {
            paths.add(row.storagePath);
          }
          total = page.total;
          if (page.rows.length === 0) break;
          offset += page.rows.length;
        }

        if (!cancelled) {
          setCatalogStoragePaths(paths);
          setCatalogPathIndexState('ready');
        }
      } catch (e) {
        console.error('[AdminAssetLibrary] MF4 catalog path index failed:', e);
        if (!cancelled) {
          setCatalogStoragePaths(new Set());
          setCatalogPathIndexState('error');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const isMf4ManagedStorageObjectPath = useCallback(
    (relativePath: string): boolean => {
      if (catalogStoragePaths.has(relativePath)) return true;
      return (
        relativePath.startsWith('verified/wikimedia/') ||
        relativePath.startsWith('wikimedia/quarantine/') ||
        relativePath.startsWith('wikimedia/')
      );
    },
    [catalogStoragePaths],
  );

  const loadCatalog = useCallback(async () => {
    setIsLoading(true);
    try {
      const page = await listMediaCatalogPage({
        limit: catalogPageSize,
        offset: catalogOffset,
        filters: {
          usage: catalogUsageFilter,
          search: catalogSearch.trim() || undefined,
          storageBucket: BUCKET_NAME,
        },
        sortField: 'created_at',
        sortDir: 'desc',
      });
      setCatalogRows(page.rows);
      setCatalogTotal(page.total);
    } catch (e) {
      console.error('Error loading media catalog:', e);
      setCatalogRows([]);
      setCatalogTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [catalogOffset, catalogPageSize, catalogSearch, catalogUsageFilter]);

  const loadFiles = useCallback(async () => {
    setIsLoading(true);
    setSelectedFiles(new Set());
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
    if (libraryMode === 'catalog') {
      void loadCatalog();
    } else {
      void loadFiles();
    }
  }, [libraryMode, loadCatalog, loadFiles]);

  const getUsageInfo = (fileUrl: string) => {
    const cleanFileUrl = fileUrl.split('?')[0]?.trim() ?? '';
    const usage = usageMap[cleanFileUrl];
    return {
      isUsed: !!usage && usage.length > 0,
      contexts: usage || [],
    };
  };

  const filteredFiles = useMemo(() => {
    if (filterUsage === 'all') return files;
    return files.filter((f) => {
      const cleanFileUrl = f.url.split('?')[0]?.trim() ?? '';
      const usage = usageMap[cleanFileUrl];
      const isUsed = !!usage && usage.length > 0;
      return filterUsage === 'used' ? isUsed : !isUsed;
    });
  }, [files, filterUsage, usageMap]);

  const catalogMaxOffset = Math.max(0, catalogTotal - catalogPageSize);

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
    if (catalogPathIndexState === 'loading') {
      alert(
        'Indice catalogo MF4 in caricamento: cancellazione fisica temporaneamente bloccata (fail-closed).',
      );
      setDeleteTarget(null);
      return;
    }
    if (catalogPathIndexState === 'error') {
      alert(
        'Impossibile verificare il catalogo MF4: cancellazione fisica bloccata. Usa la modalità Catalogo DB per la gestione asset.',
      );
      setDeleteTarget(null);
      return;
    }
    const paths = deleteTarget.names.map((name) => `${currentFolder}/${name}`);
    const blocked = paths.filter((path) => isMf4ManagedStorageObjectPath(path));
    if (blocked.length > 0) {
      alert(
        'Cancellazione fisica bloccata: uno o più file appartengono al catalogo MF4 o a path Wikimedia gestiti. Usa archivio sicuro dal catalogo DB.',
      );
      setDeleteTarget(null);
      return;
    }
    setIsDeleting(true);
    try {
      const { error } = await supabase.storage.from(BUCKET_NAME).remove(paths);
      if (error) throw error;
      setFiles((prev) => prev.filter((f) => !deleteTarget.names.includes(f.name)));
      setSelectedFiles(new Set());
      setDeleteTarget(null);
    } catch (e) {
      alert('Errore cancellazione file.');
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const openCatalogDetail = (row: MediaCatalogRow) => {
    setDetailAsset(row);
    setSelectedCatalogId(row.id);
  };

  return (
    <div className="relative flex h-full flex-col space-y-6">
      {detailAsset ? (
        <MediaAssetDetailPanel
          asset={detailAsset}
          onClose={() => {
            setDetailAsset(null);
            setSelectedCatalogId(null);
          }}
          onArchived={() => void loadCatalog()}
        />
      ) : null}

      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={
          deleteTarget?.count === 1 ? 'Eliminare File?' : `Eliminare ${deleteTarget?.count} File?`
        }
        message={
          deleteTarget?.hasUsed
            ? `⚠️ ATTENZIONE: Alcuni file risultano "IN USO" (mappa URL legacy, non garantia MF4). Preferire archivio sicuro dal catalogo DB.`
            : `Modalità Storage legacy: cancellazione fisica di ${deleteTarget?.count} file. Non usare per asset catalogati MF4/Wikimedia (usa catalogo DB + safe archive).`
        }
        isDeleting={isDeleting}
        icon={
          <Trash2
            className={`h-8 w-8 ${deleteTarget?.hasUsed ? 'animate-pulse text-amber-500' : 'text-red-500'}`}
          />
        }
        confirmLabel="Elimina Definitivamente"
        variant="danger"
      />

      <AdminPageHeader
        icon={ImageIcon}
        accent="cyan"
        title="Libreria Media"
        subtitle="Catalogo relazionale media_assets + browser Storage legacy"
      />

      <div className="flex shrink-0 flex-wrap gap-2 rounded-xl border border-slate-800 bg-slate-900 p-2">
        <button
          type="button"
          onClick={() => setLibraryMode('catalog')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase transition-all ${libraryMode === 'catalog' ? 'bg-indigo-600 text-white shadow-lg' : 'border border-slate-800 bg-slate-950 text-slate-500 hover:text-white'}`}
        >
          <Database className="h-3.5 w-3.5" /> Catalogo DB
        </button>
        <button
          type="button"
          onClick={() => setLibraryMode('storage')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase transition-all ${libraryMode === 'storage' ? 'bg-indigo-600 text-white shadow-lg' : 'border border-slate-800 bg-slate-950 text-slate-500 hover:text-white'}`}
        >
          <FolderOpen className="h-3.5 w-3.5" /> Storage cartelle
        </button>
      </div>

      {libraryMode === 'storage' ? (
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
      ) : (
        <div className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900 p-3 md:flex-row md:items-center">
          <input
            type="search"
            value={catalogSearch}
            onChange={(e) => {
              setCatalogSearch(e.target.value);
              setCatalogOffset(0);
            }}
            placeholder="Cerca path, Q-id, autore, licenza…"
            className="min-h-11 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-white"
          />
          <div className="flex flex-wrap gap-2">
            {(['all', 'used', 'unused'] as const).map((usage) => (
              <button
                key={usage}
                type="button"
                onClick={() => {
                  setCatalogUsageFilter(usage);
                  setCatalogOffset(0);
                }}
                className={`rounded-lg px-3 py-2 text-xs font-bold uppercase ${catalogUsageFilter === usage ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}
              >
                {usage === 'all' ? 'Tutti' : usage === 'used' ? 'In uso' : 'Inutilizzati'}
              </button>
            ))}
          </div>
        </div>
      )}

      {libraryMode === 'storage' ? (
        <div className="flex shrink-0 flex-col items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-2 md:flex-row">
          <div className="flex w-full items-center gap-2 md:w-auto">
            {(['all', 'used', 'unused'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setFilterUsage(filter)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase transition-all ${filterUsage === filter ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}
              >
                {filter === 'all' ? 'Tutti' : filter === 'used' ? 'In Uso' : 'Inutilizzati'}
              </button>
            ))}
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
            {selectedFiles.size > 0 ? (
              <button
                type="button"
                onClick={() => handleDeleteRequest(Array.from(selectedFiles))}
                className="flex animate-in fade-in items-center gap-2 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold uppercase text-white shadow-lg transition-all hover:bg-red-500"
              >
                <Trash2 className="h-4 w-4" /> Elimina ({selectedFiles.size})
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center gap-3 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
            <span className="text-xs font-bold uppercase tracking-widest">
              {libraryMode === 'catalog' ? 'Caricamento catalogo…' : 'Scansione Bucket…'}
            </span>
          </div>
        ) : libraryMode === 'catalog' ? (
          catalogRows.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-slate-500">
              <Database className="h-16 w-16 opacity-20" />
              <p className="text-sm italic">Nessun asset nel catalogo DB.</p>
            </div>
          ) : (
            <>
              <div className="custom-scrollbar flex-1 overflow-y-auto p-4 md:p-6">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                  {catalogRows.map((row) => (
                    <button
                      type="button"
                      key={row.id}
                      onClick={() => openCatalogDetail(row)}
                      className={`group flex flex-col overflow-hidden rounded-xl border bg-slate-950 text-left transition-all ${selectedCatalogId === row.id ? 'border-indigo-500 ring-1 ring-indigo-500/40' : 'border-slate-800 hover:border-slate-600'}`}
                    >
                      <div className="relative h-36 overflow-hidden bg-black">
                        <ImageWithFallback
                          src={row.publicUrl}
                          alt={row.storagePath}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute top-2 right-2 rounded bg-black/60 px-2 py-0.5 text-[8px] font-black uppercase text-white">
                          {row.originType}
                        </div>
                      </div>
                      <div className="space-y-1 p-3 text-[10px]">
                        <div className="truncate font-mono text-slate-400" title={row.storagePath}>
                          {row.storagePath.split('/').pop()}
                        </div>
                        <div className="flex items-center justify-between text-slate-500">
                          <span>{row.assetStatus}</span>
                          <span className="inline-flex items-center gap-1 text-emerald-400">
                            <LinkIcon className="h-3 w-3" />
                            {row.activeUsageCount}
                          </span>
                        </div>
                        {row.licenseCode ? (
                          <div className="truncate text-indigo-300">{row.licenseCode}</div>
                        ) : null}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 px-4 py-3 text-xs text-slate-400">
                <span>
                  {catalogOffset + 1}–{Math.min(catalogOffset + catalogRows.length, catalogTotal)}{' '}
                  di {catalogTotal}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={catalogOffset <= 0}
                    onClick={() => setCatalogOffset((o) => Math.max(0, o - catalogPageSize))}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 font-bold uppercase disabled:opacity-40"
                  >
                    Precedente
                  </button>
                  <button
                    type="button"
                    disabled={catalogOffset >= catalogMaxOffset}
                    onClick={() =>
                      setCatalogOffset((o) => Math.min(catalogMaxOffset, o + catalogPageSize))
                    }
                    className="rounded-lg border border-slate-700 px-3 py-1.5 font-bold uppercase disabled:opacity-40"
                  >
                    Successiva
                  </button>
                </div>
              </div>
            </>
          )
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
                const catalogPath = publicMediaPathFromUrl(file.url);

                return (
                  <div
                    key={file.id}
                    className={`group relative flex h-72 flex-col overflow-hidden rounded-xl border bg-slate-950 shadow-md transition-all ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500/50' : 'border-slate-800 hover:border-slate-600'}`}
                  >
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      aria-label={
                        isSelected ? `Deseleziona ${file.name}` : `Seleziona ${file.name}`
                      }
                      onClick={() => toggleSelection(file.name)}
                      className="absolute inset-0 z-0 cursor-pointer"
                    />
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
                    <div className="pointer-events-none absolute top-2 right-2 z-dropdown">
                      {isUsed ? (
                        <div className="rounded bg-emerald-600 px-2 py-0.5 text-[8px] font-black text-white uppercase shadow-lg">
                          IN USO
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
                        <div
                          className="truncate font-mono text-[10px] text-slate-500"
                          title={file.name}
                        >
                          {file.name}
                        </div>
                        {catalogPath ? (
                          <div className="truncate text-[9px] text-slate-600">{catalogPath}</div>
                        ) : null}
                        {isUsed && contexts.length > 0 ? (
                          <div className="truncate text-[9px] text-emerald-500/80">
                            {contexts[0]}
                          </div>
                        ) : null}
                        <div className="pointer-events-auto mt-2 border-t border-slate-800 pt-2">
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
