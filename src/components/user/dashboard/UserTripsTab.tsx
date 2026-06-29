import React, { useState } from 'react';
import { Map, Calendar, PencilLine, Pencil, Trash2, MapPin } from 'lucide-react';
import { Itinerary } from '../../../types/index';
import { useItinerary } from '@/context/ItineraryContext';
import { DeleteConfirmationModal } from '../../common/DeleteConfirmationModal';
import {
  IconActionButton,
  ICON_ACTION_DANGER_CLASS,
  ICON_ACTION_AMBER_SOLID_CLASS,
} from '../../features/diary/packing_list/suitcase/DashboardActionGroup';
import { SUITCASE_TOOLBAR_BTN_CLASS } from '../../features/diary/packing_list/suitcase/SuitcaseUtils';
import { formatItalianDateTime } from '@/utils/dateFormatters';
import { safeArray } from '../../../utils/safeTypes';

interface Props {
  /** Chiude il Profilo Utente dopo aver avviato il Diario (stessa pipeline odierna). */
  onClose: () => void;
}

export const UserTripsTab: React.FC<Props> = ({ onClose }) => {
  const { savedProjects, loadProject, deleteProject } = useItinerary();
  const trips = safeArray<Itinerary>(savedProjects);

  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Riusa la pipeline esistente: carica l'itinerario in contesto e chiude il modale.
  const handleOpenDiary = (proj: Itinerary) => {
    loadProject(proj);
    onClose();
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProject(projectToDelete.id);
      setProjectToDelete(null);
    } catch (e) {
      console.error('Eliminazione viaggio non riuscita', e);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <DeleteConfirmationModal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={confirmDeleteProject}
        title="Eliminare Viaggio?"
        message={`Vuoi davvero eliminare "${projectToDelete?.name}"? L'azione è irreversibile.`}
        isDeleting={isDeleting}
        variant="danger"
      />

      {/* HEADER */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
        <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400">
          <Map className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">I Miei Viaggi</h2>
          <p className="text-sm text-slate-400">{trips.length} itinerari salvati nel tuo diario.</p>
        </div>
      </div>

      {/* LISTA VIAGGI */}
      {trips.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 rounded-2xl border border-slate-800 border-dashed">
          <Map className="w-12 h-12 text-slate-700 mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-bold text-white mb-1">Nessun viaggio salvato</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Crea il tuo primo itinerario dal Diario di Viaggio: lo ritroverai qui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map((proj) => (
            <div
              key={proj.id}
              className="group flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5 bg-slate-900/80 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition-all"
            >
              {/* INFO */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-lg font-bold text-white leading-tight truncate group-hover:text-amber-400 transition-colors">
                    {proj.name || 'Senza Nome'}
                  </h3>
                  <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-800/70 border border-slate-700/50 px-2 py-0.5 rounded-full uppercase tracking-wide">
                    <MapPin className="w-3 h-3" /> {safeArray(proj.items).length} tappe
                  </span>
                </div>

                {/* Date incolonnate: icona | label | valore */}
                <div className="grid grid-cols-[auto_auto_auto] items-center gap-x-2.5 gap-y-1.5 w-fit">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Data Creazione:</span>
                  <span className="text-xs text-slate-300 font-medium tabular-nums">{formatItalianDateTime(proj.createdAt)}</span>

                  <PencilLine className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Data Modifica:</span>
                  <span className="text-xs text-slate-300 font-medium tabular-nums">{proj.updatedAt ? formatItalianDateTime(proj.updatedAt) : '—'}</span>
                </div>
              </div>

              {/* AZIONI (allineate a destra: Modifica Diario evidenziata, poi Elimina) */}
              <div className="flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenDiary(proj)}
                  aria-label="Modifica Diario"
                  className={`${SUITCASE_TOOLBAR_BTN_CLASS} ${ICON_ACTION_AMBER_SOLID_CLASS}`}
                >
                  <Pencil className="w-4 h-4" aria-hidden /> Modifica Diario
                </button>
                <IconActionButton
                  label="Elimina Diario"
                  icon={Trash2}
                  className={ICON_ACTION_DANGER_CLASS}
                  onClick={() => setProjectToDelete({ id: proj.id, name: proj.name || 'Senza Nome' })}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
