import { BookOpen, Loader2, RefreshCw } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { useCityEditor } from '@/context/CityEditorContext';
import { useAiRuntimeGate } from '@/hooks/useAiRuntimeGate';
import { mergePatronDetailsFromAi } from '../../../../services/city/parsers/content/mergePatronDetailsFromAi';
import { appendGenerationLogs } from '../../../../services/city/parsers/content/parseLogs';
import { saveCityDetails } from '../../../../services/cityService';
import type { User } from '../../../../types/users';
import { DeleteConfirmationModal } from '../../../common/DeleteConfirmationModal';
import { CultureHistory } from '../culture/CultureHistory';
import { CulturePatron } from '../culture/CulturePatron';
import { CulturePeople } from '../culture/CulturePeople';
import {
  fetchCultureRegenerationData,
  insertNewCityPeopleKeepingExisting,
  isPeopleReplacePartialCleanupError,
  prepareCompletePeople,
  removeCityPeopleByIds,
  rollbackCreatedCityPeopleIds,
} from '../culture/editorCultureRegeneration';

async function reloadCityPreservingPrimaryError(
  reload: () => Promise<void>,
  context: string,
): Promise<void> {
  try {
    await reload();
  } catch (reloadError: unknown) {
    console.error(`[TabCulture] reloadCurrentCity fallito (${context})`, reloadError);
  }
}

export const TabCulture = ({ currentUser }: { currentUser?: User }) => {
  const { city, updateDetailField, setCityDirectly, reloadCurrentCity, triggerPreview } =
    useCityEditor();
  const { aiBlocked, blockMessage, guardAiAction } = useAiRuntimeGate();

  const [generating, setGenerating] = useState<string | null>(null);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);

  if (!city) return null;

  const handleRegenerateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!guardAiAction()) return;

    if (!city.name) {
      alert('Inserisci il nome della città!');
      return;
    }

    setShowRegenConfirm(true);
  };

  const executeRegeneration = async () => {
    if (!guardAiAction()) {
      setShowRegenConfirm(false);
      return;
    }
    setShowRegenConfirm(false);
    setGenerating('full_page');

    try {
      const { historyData, patronData, peopleSuggestions } = await fetchCultureRegenerationData(
        city.name,
        4,
      );

      const { prepared, incompleteCount } = await prepareCompletePeople(
        peopleSuggestions ?? [],
        city.id,
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
          console.error('Errore inserimento personaggi Cultura:', peopleError);
          await reloadCityPreservingPrimaryError(reloadCurrentCity, 'insert personaggi');
          const detail = peopleError instanceof Error ? peopleError.message : String(peopleError);
          const rollbackNote =
            isPeopleReplacePartialCleanupError(peopleError) &&
            peopleError.scenario === 'insert_rollback'
              ? `${peopleError.message}\nVerifica in admin quali record sono ancora presenti.\n`
              : 'Eventuali insert parziali sono stati annullati.\n';
          alert(
            `Inserimento personaggi non riuscito.\nStoria e Patrono NON sono stati aggiornati.\nI personaggi precedenti risultano preservati.\n${rollbackNote}${detail}`,
          );
          return;
        }

        try {
          await saveCityDetails(updatedCity);
        } catch (detailsError: unknown) {
          console.error(
            'Errore salvataggio Storia/Patrono — rollback nuovi personaggi:',
            detailsError,
          );
          const failedRollbackIds = await rollbackCreatedCityPeopleIds(createdIds);
          await reloadCityPreservingPrimaryError(
            reloadCurrentCity,
            'saveCityDetails con personaggi',
          );
          const detail =
            detailsError instanceof Error ? detailsError.message : String(detailsError);
          const rollbackNote =
            failedRollbackIds.length > 0
              ? `ATTENZIONE: rollback parziale — ${failedRollbackIds.length} nuovo/i personaggio/i potrebbe/rrano essere ancora presenti (id: ${failedRollbackIds.join(', ')}).\n`
              : createdIds.length > 0
                ? 'I nuovi personaggi inseriti sono stati rimossi.\n'
                : '';
          alert(
            `Salvataggio Storia/Patrono fallito.\nStoria e Patrono NON sono stati aggiornati.\n${rollbackNote}I personaggi precedenti risultano preservati.\n${detail}`,
          );
          return;
        }

        try {
          await removeCityPeopleByIds(existingIds);
        } catch (cleanupError: unknown) {
          console.error('Cleanup personaggi precedenti fallito:', cleanupError);
          await reloadCityPreservingPrimaryError(
            reloadCurrentCity,
            'cleanup personaggi precedenti',
          );
          if (isPeopleReplacePartialCleanupError(cleanupError)) {
            alert(
              `Storia, Patrono e nuovi personaggi sono stati salvati, ma il cleanup dei precedenti è parziale.\n${cleanupError.message}\nRicarica e verifica eventuali duplicati.`,
            );
          } else {
            const detail =
              cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
            alert(
              `Storia, Patrono e nuovi personaggi sono stati salvati, ma la rimozione dei precedenti non è riuscita.\n${detail}\nRicarica e verifica eventuali duplicati.`,
            );
          }
          return;
        }
      } else {
        try {
          await saveCityDetails(updatedCity);
        } catch (detailsError: unknown) {
          console.error('Errore salvataggio Storia/Patrono:', detailsError);
          await reloadCityPreservingPrimaryError(
            reloadCurrentCity,
            'saveCityDetails senza personaggi',
          );
          const detail =
            detailsError instanceof Error ? detailsError.message : String(detailsError);
          alert(`Salvataggio Storia/Patrono fallito.\n${detail}`);
          return;
        }
      }

      setCityDirectly(updatedCity);
      await reloadCityPreservingPrimaryError(reloadCurrentCity, 'reload finale rigenerazione');

      if (prepared.length === 0) {
        alert(
          `Storia e Patrono aggiornati.\nNessun personaggio completo da salvare (${incompleteCount} incompleti scartati).\nI personaggi esistenti sono stati preservati.`,
        );
      } else {
        alert(
          `Rigenerazione completata!\n- Storia e Patrono aggiornati\n- Personaggi salvati: ${prepared.length} (draft)\n- Scartati incompleti: ${incompleteCount}`,
        );
      }
    } catch (e: unknown) {
      console.error('Errore Rigenerazione Cultura:', e);
      try {
        await reloadCurrentCity();
      } catch {
        /* ignore reload failure after primary error */
      }
      alert(`Errore durante la rigenerazione: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 lg:items-stretch gap-6 md:gap-8 animate-in fade-in">
      {showRegenConfirm && (
        <DeleteConfirmationModal
          isOpen={true}
          onClose={() => setShowRegenConfirm(false)}
          onConfirm={executeRegeneration}
          title="Rigenerare Cultura?"
          message={`Questa operazione aggiorna Storia e Patrono.\nI personaggi esistenti saranno sostituiti SOLO se l'AI produce almeno un personaggio completo e la sostituzione riesce interamente.\nI vecchi personaggi restano finché Storia/Patrono non sono salvati; in caso di errore sui dettagli i nuovi insert vengono annullati (nessuna transazione DB).`}
          confirmLabel="Sì, Rigenera"
          cancelLabel="Annulla"
          variant="danger"
          icon={<RefreshCw className="w-8 h-8 text-rose-500 animate-spin-slow" />}
        />
      )}

      <div className="col-span-1 lg:col-span-2 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-amber-900/20 rounded-lg text-amber-500 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <h2 className="text-lg md:text-xl font-bold text-white truncate">Storia & Cultura</h2>
        </div>
        <button
          type="button"
          onClick={handleRegenerateClick}
          disabled={generating === 'full_page' || aiBlocked}
          title={aiBlocked ? blockMessage : undefined}
          className="w-full sm:w-auto justify-center bg-rose-600 hover:bg-rose-500 text-white px-4 sm:px-6 py-3 min-h-11 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase text-xs tracking-widest border border-rose-500"
        >
          {generating === 'full_page' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {generating === 'full_page'
            ? 'RIGENERAZIONE...'
            : aiBlocked
              ? 'AI DISABILITATA'
              : 'RIGENERA PAGINA'}
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
