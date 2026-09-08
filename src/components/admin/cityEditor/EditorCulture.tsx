import { BookOpen, Loader2, RefreshCw } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { useCityEditor } from '@/context/CityEditorContext';
import { useAiRuntimeGate } from '@/hooks/useAiRuntimeGate';
import { mergePatronDetailsFromAi } from '../../../services/city/parsers/content/mergePatronDetailsFromAi';
import { appendGenerationLogs } from '../../../services/city/parsers/content/parseLogs';
import { deleteCityPerson, saveCityDetails } from '../../../services/cityService';
import type { User } from '../../../types/users';
import { DeleteConfirmationModal } from '../../common/DeleteConfirmationModal';
import { CultureHistory } from './culture/CultureHistory';
import { CulturePatron } from './culture/CulturePatron';
import { CulturePeople } from './culture/CulturePeople';
import {
  fetchCultureRegenerationData,
  insertNewCityPeopleKeepingExisting,
  isPeopleReplacePartialCleanupError,
  prepareCompletePeople,
  removeCityPeopleByIds,
} from './culture/editorCultureRegeneration';

export const EditorCulture = ({ currentUser }: { currentUser?: User }) => {
  const { city, updateDetailField, setCityDirectly, reloadCurrentCity, triggerPreview } =
    useCityEditor();
  const { aiBlocked, blockMessage, guardAiAction } = useAiRuntimeGate();

  const [generating, setGenerating] = useState<string | null>(null);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);

  if (!city) return null;

  const handleRegeneratePage = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!guardAiAction()) return;

    if (!city.name) {
      alert('Inserisci il nome della città!');
      return;
    }
    setShowRegenerateConfirm(true);
  };

  const confirmRegeneratePage = async () => {
    if (!guardAiAction()) {
      setShowRegenerateConfirm(false);
      return;
    }
    setShowRegenerateConfirm(false);
    setGenerating('full_page');

    try {
      const { historyData, patronData, peopleSuggestions } = await fetchCultureRegenerationData(
        city.name,
        5,
      );

      const { prepared, incompleteCount } = await prepareCompletePeople(
        peopleSuggestions ?? [],
        city.name,
      );

      const updatedDetails = { ...city.details };
      updatedDetails.historySnippet = historyData.historySnippet || '';
      updatedDetails.historyFull = historyData.historyFull || '';

      if (patronData.patron) {
        updatedDetails.patronDetails = mergePatronDetailsFromAi(
          updatedDetails.patronDetails,
          patronData.patron,
        );
        updatedDetails.patron = patronData.patron.name;
      }

      const newLog = `[${new Date().toISOString()}] ✅ Fine: Rigenerazione Pagina Storia & Cultura`;
      updatedDetails.generationLogs = appendGenerationLogs(updatedDetails.generationLogs, [newLog]);

      const updatedCity = { ...city, details: updatedDetails };

      if (prepared.length > 0) {
        let createdIds: string[] = [];
        let existingIds: string[] = [];
        try {
          const inserted = await insertNewCityPeopleKeepingExisting(city.id, prepared);
          createdIds = inserted.createdIds;
          existingIds = inserted.existingIds;
        } catch (peopleError: unknown) {
          console.error('[EditorCulture] people insert failed', peopleError);
          await reloadCurrentCity();
          const detail = peopleError instanceof Error ? peopleError.message : String(peopleError);
          alert(
            `Inserimento personaggi non riuscito.\nStoria/Patrono NON aggiornati.\nI personaggi precedenti risultano preservati (eventuali insert parziali sono stati annullati).\n${detail}`,
          );
          return;
        }

        try {
          await saveCityDetails(updatedCity);
        } catch (detailsError: unknown) {
          console.error('[EditorCulture] saveCityDetails failed — rollback nuovi', detailsError);
          await Promise.allSettled(createdIds.map((id) => deleteCityPerson(id)));
          await reloadCurrentCity();
          const detail =
            detailsError instanceof Error ? detailsError.message : String(detailsError);
          alert(
            `Salvataggio Storia/Patrono fallito.\nI nuovi personaggi inseriti sono stati annullati; i personaggi precedenti risultano preservati.\n${detail}`,
          );
          return;
        }

        try {
          await removeCityPeopleByIds(existingIds);
        } catch (cleanupError: unknown) {
          console.error('[EditorCulture] people cleanup failed', cleanupError);
          await reloadCurrentCity();
          if (isPeopleReplacePartialCleanupError(cleanupError)) {
            alert(
              `Storia/Patrono e nuovi personaggi salvati, ma cleanup parziale dei precedenti.\n${cleanupError.message}`,
            );
          } else {
            const detail =
              cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
            alert(
              `Storia/Patrono e nuovi personaggi salvati, ma la rimozione dei precedenti non è riuscita.\n${detail}`,
            );
          }
          return;
        }
      } else {
        try {
          await saveCityDetails(updatedCity);
        } catch (detailsError: unknown) {
          console.error('[EditorCulture] saveCityDetails failed', detailsError);
          await reloadCurrentCity();
          const detail =
            detailsError instanceof Error ? detailsError.message : String(detailsError);
          alert(`Salvataggio Storia/Patrono fallito.\n${detail}`);
          return;
        }
      }

      setCityDirectly(updatedCity);
      await reloadCurrentCity();

      if (prepared.length === 0) {
        alert(
          `Storia/Patrono aggiornati. Nessun personaggio completo prodotto (${incompleteCount} incompleti scartati): i personaggi esistenti sono stati preservati.`,
        );
      } else {
        alert(
          `Pagina Cultura aggiornata. Salvati ${prepared.length} personaggi (draft). Scartati incompleti: ${incompleteCount}.`,
        );
      }
    } catch (e: unknown) {
      console.error(e);
      try {
        await reloadCurrentCity();
      } catch {
        /* ignore reload failure after primary error */
      }
      alert(`Errore rigenerazione: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 lg:items-stretch gap-6 md:gap-8 animate-in fade-in">
      <DeleteConfirmationModal
        isOpen={showRegenerateConfirm}
        onClose={() => setShowRegenerateConfirm(false)}
        onConfirm={confirmRegeneratePage}
        title="Rigenera Pagina Cultura"
        message="Aggiorna Storia e Patrono. I personaggi esistenti saranno sostituiti SOLO se l'AI produce almeno un personaggio completo e la sostituzione riesce interamente. I vecchi restano finché Storia/Patrono non sono salvati; se il salvataggio dettagli fallisce i nuovi insert vengono annullati (nessuna transazione DB)."
        confirmLabel="Sì, Rigenera"
        variant="danger"
      />

      <div className="col-span-1 lg:col-span-2 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-amber-900/20 rounded-lg text-amber-500 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <h2 className="text-lg md:text-xl font-bold text-white truncate">Storia & Cultura</h2>
        </div>
        <button
          type="button"
          onClick={handleRegeneratePage}
          disabled={generating === 'full_page' || aiBlocked}
          title={aiBlocked ? blockMessage : undefined}
          className="w-full sm:w-auto justify-center bg-rose-600 hover:bg-rose-500 text-white px-4 sm:px-6 py-3 min-h-11 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase text-xs tracking-widest border border-rose-500"
        >
          {generating === 'full_page' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {aiBlocked ? 'AI DISABILITATA' : 'RIGENERA PAGINA'}
        </button>
      </div>

      <CultureHistory
        city={city}
        updateDetailField={updateDetailField}
        triggerPreview={triggerPreview}
      />

      <CulturePatron
        city={city}
        updateDetailField={updateDetailField}
        triggerPreview={triggerPreview}
      />

      <div className="col-span-1 lg:col-span-2">
        <CulturePeople cityId={city.id} cityName={city.name} currentUser={currentUser} />
      </div>
    </div>
  );
};
