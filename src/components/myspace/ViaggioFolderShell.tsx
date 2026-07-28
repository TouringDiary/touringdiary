import React, { useEffect, useState } from 'react';
import { ArrowLeft, Trash2, Users } from 'lucide-react';
import type { Viaggio } from '@/types/models/Viaggio';
import { deleteViaggio, getViaggio } from '@/services/viaggio/viaggioService';
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
import { MySpaceViaggioDeleteModal } from './MySpaceViaggioDeleteModal';
import { syncVisitedCitiesFromViaggio } from '@/services/myspace/userVisitedCitiesService';
import { getCitiesMinimalByIds } from '@/services/myspace/cityMinimalRead';

interface Props {
  viaggioId: string;
  userId: string;
  section: ViaggioFolderSectionId;
  onSectionChange: (section: ViaggioFolderSectionId) => void;
  onBackToCatalog: () => void;
  onViaggioLoaded?: (viaggio: Viaggio | null) => void;
  onDeleted?: () => void;
  onBeforeLeaveMySpace?: () => void;
}

/**
 * Cartella Viaggio — chrome compatto (DOC 35 §6.3); no fascia cover alta (MP-02 STEP-1).
 */
export const ViaggioFolderShell: React.FC<Props> = ({
  viaggioId,
  userId,
  section,
  onSectionChange,
  onBackToCatalog,
  onViaggioLoaded,
  onDeleted,
  onBeforeLeaveMySpace,
}) => {
  const [viaggio, setViaggio] = useState<Viaggio | null>(null);
  const [destinationLabel, setDestinationLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const currentSection = getViaggioFolderSection(section);
  const openWorkspaceFromViaggio = useOpenWorkspaceFromViaggio();
  const canOpenWorkspace = isCollaborationEngineEnabled();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setDestinationLabel(null);
      try {
        const row = await getViaggio(viaggioId);
        if (cancelled) return;

        if (!row) {
          setViaggio(null);
          setError('Viaggio non trovato.');
          setDestinationLabel(null);
          return;
        }

        // Destinazione risolto nello stesso caricamento (evita secondo render da effect separato).
        let resolvedDestination: string | null = null;
        const destId = row.destination?.trim();
        if (destId) {
          try {
            const cities = await getCitiesMinimalByIds([destId]);
            if (!cancelled) {
              resolvedDestination = cities[0]?.name ?? null;
            }
          } catch (e) {
            console.error('[ViaggioFolderShell] getCitiesMinimalByIds failed', e);
            resolvedDestination = null;
          }
        }

        if (cancelled) return;
        setViaggio(row);
        setDestinationLabel(resolvedDestination);

        // --- Esploratore: sync città visitate (fire-and-forget, non blocca UI) ---
        // Idempotente: upsert ignoreDuplicates; sicuro a ogni apertura cartella.
        void syncVisitedCitiesFromViaggio(userId, row.id, row.destination).catch((syncError) => {
          console.error('[ViaggioFolderShell] syncVisitedCitiesFromViaggio failed:', syncError);
        });
      } catch (e) {
        console.error('[ViaggioFolderShell] getViaggio failed', e);
        if (!cancelled) {
          setViaggio(null);
          setDestinationLabel(null);
          setError('Non è stato possibile aprire il viaggio.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [viaggioId, userId]);

  useEffect(() => {
    onViaggioLoaded?.(viaggio);
  }, [viaggio, onViaggioLoaded]);

  // Ricordami: intenzionalmente assente dalla cartella — DOC 35 §6.5 / changelog 2.2.2
  // (UI su riga catalogo a sx della cover, non in cartella).

  const renderSection = () => {
    switch (section) {
      case 'diario':
        return (
          <ViaggioDiarioSection
            viaggioId={viaggioId}
            userId={userId}
            viaggioTitle={viaggio?.title}
            onViaggioMetaChanged={onViaggioLoaded}
            onBeforeLeaveMySpace={onBeforeLeaveMySpace}
          />
        );
      case 'valigia':
        return (
          <ViaggioValigiaSection viaggioId={viaggioId} viaggioTitle={viaggio?.title} />
        );
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

  const handleDeleted = async () => {
    await deleteViaggio(viaggioId);
    setShowDelete(false);
    onDeleted?.();
  };

  return (
    <div
      id="myspace-root-panel-trips"
      role="tabpanel"
      aria-labelledby="myspace-root-tab-trips"
      data-testid="myspace-viaggio-folder"
      className="flex-1 min-h-0 flex flex-col overflow-hidden"
    >
      <div className="shrink-0 border-b border-slate-800 bg-slate-950/90">
        <div className="px-3 py-2.5 flex flex-wrap items-center gap-2 md:gap-3">
          <button
            type="button"
            onClick={onBackToCatalog}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors shrink-0"
            aria-label="Torna al catalogo viaggi"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-base md:text-lg font-black text-white tracking-tight truncate">
              {loading ? '…' : viaggio?.title || 'Viaggio'}
            </h2>
            {!loading && destinationLabel ? (
              <p className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">
                {destinationLabel}
              </p>
            ) : null}
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
          {!loading && viaggio && (
            <button
              type="button"
              onClick={() => setShowDelete(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-300 hover:bg-slate-800/80 shrink-0"
              aria-label="Elimina viaggio"
              title="Elimina viaggio"
              data-testid="myspace-viaggio-folder-delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
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
                  px-3 py-2 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap
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

      {showDelete && viaggio && (
        <MySpaceViaggioDeleteModal
          viaggioTitle={viaggio.title}
          onCancel={() => setShowDelete(false)}
          onConfirm={handleDeleted}
        />
      )}
    </div>
  );
};
