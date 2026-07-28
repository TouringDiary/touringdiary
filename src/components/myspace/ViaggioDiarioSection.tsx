import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, Copy, Link2, Plus, Star } from 'lucide-react';
import type { Itinerary } from '@/types/index';
import type { Viaggio } from '@/types/models/Viaggio';
import {
  listDiariesByViaggio,
  setViaggioActiveDiary,
} from '@/services/viaggio/viaggioDiaryService';
import { getViaggio } from '@/services/viaggio/viaggioService';
import {
  associateDiaryToViaggio,
  copyDiaryAndAssociateToViaggio,
  createDiaryWithAssociation,
  getDiaryAssociationConflict,
  listDiariesAssociableToViaggio,
} from '@/services/viaggio/resourceAssociationService';
import { duplicatePersonalDiary } from '@/services/collaboration/personalShareService';
import { useItinerary } from '@/context/ItineraryContext';
import { useModal } from '@/context/ModalContext';
import { CreateDiaryModal, type CreateDiaryModalResult } from './CreateDiaryModal';
import { ResourceConflictCopyModal } from './ResourceConflictCopyModal';

interface Props {
  viaggioId: string;
  userId: string;
  viaggioTitle?: string;
  onViaggioMetaChanged?: (viaggio: Viaggio | null) => void;
  /** Persiste path MySpace prima di closeModal (DOC 35 memoria navigazione). */
  onBeforeLeaveMySpace?: () => void;
}

export const ViaggioDiarioSection: React.FC<Props> = ({
  viaggioId,
  userId,
  viaggioTitle,
  onViaggioMetaChanged,
  onBeforeLeaveMySpace,
}) => {
  const { loadProject } = useItinerary();
  const { closeModal } = useModal();
  const [diaries, setDiaries] = useState<Itinerary[]>([]);
  const [associable, setAssociable] = useState<Itinerary[]>([]);
  const [activeDiaryId, setActiveDiaryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [linkDiaryId, setLinkDiaryId] = useState('');
  const [conflictDiaryId, setConflictDiaryId] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rows, viaggio, linkable] = await Promise.all([
        listDiariesByViaggio(viaggioId),
        getViaggio(viaggioId),
        listDiariesAssociableToViaggio(userId, viaggioId),
      ]);
      if (!mountedRef.current) return;
      setDiaries(rows);
      setActiveDiaryId(viaggio?.activeDiaryId ?? null);
      setAssociable(linkable.filter((d) => !rows.some((r) => r.id === d.id)));
      setLinkDiaryId('');
      onViaggioMetaChanged?.(viaggio);
    } catch (e) {
      console.error('[ViaggioDiarioSection] reload failed', e);
      if (!mountedRef.current) return;
      setError('Non è stato possibile caricare i diari.');
      setDiaries([]);
      setAssociable([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [viaggioId, userId, onViaggioMetaChanged]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const openDiary = useCallback(
    (diary: Itinerary) => {
      onBeforeLeaveMySpace?.();
      // Ordine intenzionale: prima loadProject (modello Diario nel context genitore),
      // poi closeModal. Invertire non cambierebbe il batch React tipico, ma lasciare
      // MySpace montato finché l’itinerario non è impostato evita un frame intermedio
      // con overlay chiuso e Diario ancora vecchio.
      loadProject(diary);
      closeModal();
    },
    [onBeforeLeaveMySpace, loadProject, closeModal],
  );

  const handleCreateConfirm = async ({ input }: CreateDiaryModalResult) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const created = await createDiaryWithAssociation(input);
      if (!mountedRef.current) return;
      setCreateOpen(false);
      // reload prima di openDiary: sincronizza la lista locale della sezione e evita
      // stati incoerenti se l’apertura editor / chiusura MySpace non va a buon fine.
      await reload();
      openDiary(created);
    } catch (e) {
      console.error('[ViaggioDiarioSection] create failed', e);
      if (!mountedRef.current) return;
      setError(e instanceof Error ? e.message : 'Creazione diario non riuscita.');
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  const handleLink = async () => {
    if (!linkDiaryId || busy) return;
    setBusy(true);
    setError(null);
    try {
      const conflict = await getDiaryAssociationConflict(linkDiaryId, viaggioId, userId);
      if (conflict.type === 'other_viaggio') {
        // Return anticipato: apre ResourceConflictCopyModal via conflictDiaryId.
        // busy viene comunque rilasciato nel finally sotto.
        setConflictDiaryId(linkDiaryId);
        return;
      }
      await associateDiaryToViaggio({ diaryId: linkDiaryId, viaggioId, userId });
      // Associazione = azione di catalogo: resta in sezione e aggiorna la lista.
      // L’apertura editor è riservata a creazione (e click esplicito sulla riga).
      await reload();
    } catch (e) {
      console.error('[ViaggioDiarioSection] link failed', e);
      setError('Collegamento non riuscito.');
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmCopyAndAssociate = async () => {
    if (!conflictDiaryId || busy) return;
    setBusy(true);
    setError(null);
    try {
      await copyDiaryAndAssociateToViaggio({
        sourceDiaryId: conflictDiaryId,
        viaggioId,
        userId,
      });
      setConflictDiaryId(null);
      // Stesso comportamento del link normale: aggiorna lista, non apre l’editor
      // (DOC 35 §9.7 — la copia viene associata; l’apertura non è richiesta).
      await reload();
    } catch (e) {
      console.error('[ViaggioDiarioSection] copy+associate failed', e);
      setError('Copia e associazione non riuscite.');
    } finally {
      setBusy(false);
    }
  };

  const handleDuplicate = async (diaryId: string) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const dup = await duplicatePersonalDiary(diaryId, userId);
      if (dup.success === false) {
        throw new Error(dup.error);
      }
      // UX intenzionale (DOC 35 §6.4.2 / DOC 37 §4.0.2): il duplicato nasce SENZA
      // associazione Viaggio → non entra nella lista di questa sezione; compare in
      // Strumenti e nel pannello «Collega». Non apriamo l’editor: basta aggiornare
      // le liste (associable) restando in cartella.
      await reload();
    } catch (e) {
      console.error('[ViaggioDiarioSection] duplicate failed', e);
      setError(e instanceof Error ? e.message : 'Duplicazione non riuscita.');
    } finally {
      setBusy(false);
    }
  };

  const handleSetActive = async (diaryId: string) => {
    if (busy || diaryId === activeDiaryId) return;
    setBusy(true);
    try {
      await setViaggioActiveDiary(viaggioId, diaryId);
      await reload();
    } catch (e) {
      console.error('[ViaggioDiarioSection] setActive failed', e);
      setError('Impostazione diario attivo non riuscita.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      data-testid="viaggio-section-diario"
      data-stereotype="Resource"
      className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 md:p-6"
    >
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-bold text-white">Diario</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {loading ? 'Caricamento…' : `${diaries.length} diari · attivo scelto dall’utente`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          disabled={busy || loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-amber-300 border border-amber-500/40 hover:bg-amber-500/10 disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden />
          Nuovo
        </button>
      </div>

      {error && (
        <p className="text-sm text-rose-400 mb-4" role="alert">
          {error}
        </p>
      )}

      {!loading && associable.length > 0 && (
        <div
          className="mb-5 flex flex-wrap items-end gap-2 rounded-xl border border-slate-800 bg-slate-950/50 p-3"
          data-testid="diario-link-panel"
        >
          <div className="min-w-[12rem] flex-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Collega diario esistente
            </label>
            <select
              value={linkDiaryId}
              onChange={(e) => setLinkDiaryId(e.target.value)}
              className="mt-1 w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1.5"
            >
              <option value="">Seleziona…</option>
              {associable.map((d) => (
                <option key={d.id} value={d.id!}>
                  {d.name || 'Diario'}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            disabled={busy || !linkDiaryId}
            onClick={() => void handleLink()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-amber-300 border border-amber-500/40 hover:bg-amber-500/10 disabled:opacity-50"
          >
            <Link2 className="w-3.5 h-3.5" aria-hidden />
            Collega
          </button>
        </div>
      )}

      {!loading && diaries.length === 0 && !error && (
        <div className="flex flex-col items-center text-center py-12 px-4">
          <BookOpen className="w-10 h-10 text-slate-700 mb-3 opacity-60" aria-hidden />
          <p className="text-sm text-slate-400 max-w-sm">
            Qui troverai i diari di questo viaggio. Puoi crearne uno quando sei pronto.
          </p>
        </div>
      )}

      <ul className="space-y-2">
        {diaries.map((d) => {
          const isActive = d.id != null && d.id === activeDiaryId;
          return (
            <li
              key={d.id ?? d.name}
              className="flex items-center gap-2 p-3 rounded-xl border border-slate-800 bg-slate-900/60"
            >
              <button
                type="button"
                onClick={() => d.id && openDiary(d)}
                className="min-w-0 flex-1 text-left"
              >
                <span className="block text-sm font-bold text-white truncate">
                  {d.name || 'Diario'}
                </span>
                {isActive && (
                  <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">
                    Attivo
                  </span>
                )}
              </button>
              {d.id && (
                <button
                  type="button"
                  onClick={() => void handleDuplicate(d.id!)}
                  disabled={busy}
                  className="p-2 rounded-lg text-slate-500 hover:text-indigo-300 hover:bg-slate-800 disabled:opacity-50"
                  aria-label="Duplica diario"
                  title="Duplica"
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
              {!isActive && d.id && (
                <button
                  type="button"
                  onClick={() => handleSetActive(d.id!)}
                  disabled={busy}
                  className="p-2 rounded-lg text-slate-500 hover:text-amber-300 hover:bg-slate-800 disabled:opacity-50"
                  aria-label="Imposta come diario attivo"
                  title="Imposta come attivo"
                >
                  <Star className="w-4 h-4" />
                </button>
              )}
              {isActive && (
                <Star className="w-4 h-4 text-amber-400 shrink-0" aria-label="Diario attivo" />
              )}
            </li>
          );
        })}
      </ul>

      <CreateDiaryModal
        isOpen={createOpen}
        onClose={() => !busy && setCreateOpen(false)}
        onConfirm={handleCreateConfirm}
        userId={userId}
        context="viaggio-detail"
        fixedViaggioId={viaggioId}
        fixedViaggioTitle={viaggioTitle}
        busy={busy}
      />

      <ResourceConflictCopyModal
        isOpen={conflictDiaryId != null}
        kind="diary"
        onClose={() => !busy && setConflictDiaryId(null)}
        onConfirmCopy={() => void handleConfirmCopyAndAssociate()}
        busy={busy}
      />
    </div>
  );
};
