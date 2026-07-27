import React, { useEffect, useState } from 'react';
import { Map, ArrowLeft, Users } from 'lucide-react';
import type { Viaggio } from '@/types/models/Viaggio';
import { getViaggio } from '@/services/viaggio/viaggioService';
import {
  VIAGGIO_FOLDER_SECTIONS,
  getViaggioFolderSection,
  type ViaggioFolderSectionId,
} from '@/myspace/viaggioFolderSections';
import { ViaggioSectionPlaceholder } from './ViaggioSectionPlaceholder';
import { ViaggioDiarioSection } from './ViaggioDiarioSection';
import { ViaggioValigiaSection } from './ViaggioValigiaSection';
import { ViaggioRoadbookSection } from './ViaggioRoadbookSection';
import { ViaggioRicordiSection } from './ViaggioRicordiSection';
import { ViaggioAllegatiSection } from './ViaggioAllegatiSection';
import { ViaggioMappaSection } from './ViaggioMappaSection';
import { ViaggioRiepilogoSection } from './ViaggioRiepilogoSection';
import { useOpenWorkspaceFromViaggio } from '@/hooks/useOpenWorkspaceFromViaggio';
import { isCollaborationEngineEnabled } from '@/services/collaboration/workspaceEngineConfigService';

interface Props {
  viaggioId: string;
  userId: string;
  section: ViaggioFolderSectionId;
  onSectionChange: (section: ViaggioFolderSectionId) => void;
  onBackToCatalog: () => void;
  /** Espone titolo caricato per breadcrumb shell. */
  onViaggioLoaded?: (viaggio: Viaggio | null) => void;
}

/**
 * Cartella Viaggio — copertina + nav DOC 37.
 * STEP-3: Diario / Valigia / Roadbook operativi.
 * STEP-4: entry «Workspace da Viaggio».
 * STEP-5: Ricordi / Allegati / Mappa / Riepilogo; stereotipi in nav.
 */
export const ViaggioFolderShell: React.FC<Props> = ({
  viaggioId,
  userId,
  section,
  onSectionChange,
  onBackToCatalog,
  onViaggioLoaded,
}) => {
  const [viaggio, setViaggio] = useState<Viaggio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentSection = getViaggioFolderSection(section);
  const openWorkspaceFromViaggio = useOpenWorkspaceFromViaggio();
  const canOpenWorkspace = isCollaborationEngineEnabled();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const row = await getViaggio(viaggioId);
        if (!cancelled) {
          setViaggio(row);
          if (!row) setError('Viaggio non trovato.');
        }
      } catch (e) {
        console.error('[ViaggioFolderShell] getViaggio failed', e);
        if (!cancelled) {
          setViaggio(null);
          setError('Non è stato possibile aprire il viaggio.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [viaggioId]);

  useEffect(() => {
    onViaggioLoaded?.(viaggio);
  }, [viaggio, onViaggioLoaded]);

  const renderSection = () => {
    switch (section) {
      case 'diario':
        return (
          <ViaggioDiarioSection
            viaggioId={viaggioId}
            userId={userId}
            onViaggioMetaChanged={onViaggioLoaded}
          />
        );
      case 'valigia':
        return <ViaggioValigiaSection viaggioId={viaggioId} />;
      case 'roadbook':
        return <ViaggioRoadbookSection viaggioId={viaggioId} userId={userId} />;
      case 'ricordi':
        return <ViaggioRicordiSection viaggioId={viaggioId} userId={userId} />;
      case 'allegati':
        return <ViaggioAllegatiSection viaggioId={viaggioId} userId={userId} />;
      case 'mappa':
        return <ViaggioMappaSection viaggioId={viaggioId} />;
      case 'riepilogo':
        return <ViaggioRiepilogoSection viaggioId={viaggioId} userId={userId} />;
      default:
        return <ViaggioSectionPlaceholder section={currentSection} />;
    }
  };

  return (
    <div
      id="myspace-root-panel-trips"
      role="tabpanel"
      aria-labelledby="myspace-root-tab-trips"
      data-testid="myspace-viaggio-folder"
      className="flex-1 min-h-0 flex flex-col overflow-hidden"
    >
      <div className="shrink-0 border-b border-slate-800">
        <div className="relative w-full h-28 md:h-36 bg-slate-900 overflow-hidden">
          {viaggio?.coverImage ? (
            <img
              src={viaggio.coverImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-70"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
              <Map className="w-10 h-10 text-slate-700" aria-hidden />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end gap-3">
            <button
              type="button"
              onClick={onBackToCatalog}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors shrink-0"
              aria-label="Torna al catalogo viaggi"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg md:text-xl font-black text-white tracking-tight truncate">
                {loading ? '…' : viaggio?.title || 'Viaggio'}
              </h2>
              {viaggio?.destination && (
                <p className="text-xs text-slate-400 truncate">{viaggio.destination}</p>
              )}
            </div>
            {canOpenWorkspace && !loading && viaggio && (
              <button
                type="button"
                onClick={() =>
                  openWorkspaceFromViaggio({
                    viaggioId,
                    viaggioTitle: viaggio.title,
                  })
                }
                className="inline-flex items-center gap-1.5 shrink-0 rounded-lg border border-indigo-500/40 bg-indigo-500/15 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-indigo-100 hover:bg-indigo-500/25 transition-colors"
                data-testid="myspace-workspace-from-viaggio"
              >
                <Users className="w-3.5 h-3.5" aria-hidden />
                Workspace
              </button>
            )}
          </div>
        </div>

        <nav
          className="flex overflow-x-auto border-t border-slate-800/80 bg-slate-950/80 min-w-0"
          role="tablist"
          aria-label="Sezioni del viaggio"
        >
          {VIAGGIO_FOLDER_SECTIONS.map((s) => {
            const isActive = s.id === section;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                id={`viaggio-section-tab-${s.id}`}
                aria-controls={`viaggio-section-panel-${s.id}`}
                onClick={() => onSectionChange(s.id)}
                className={`
                  px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap
                  border-b-2 transition-colors shrink-0
                  ${isActive
                    ? 'border-amber-500 text-white'
                    : 'border-transparent text-slate-500 hover:text-slate-300'}
                `}
                title={`${s.label} · ${s.stereotype}`}
              >
                {s.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {error && (
          <p className="text-sm text-rose-400 p-6 text-center" role="alert">
            {error}
          </p>
        )}
        {!error && !loading && renderSection()}
        {loading && (
          <p className="text-sm text-slate-500 p-8 text-center">Caricamento…</p>
        )}
      </div>
    </div>
  );
};
