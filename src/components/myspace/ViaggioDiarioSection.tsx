import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, Plus, Star } from 'lucide-react';
import type { Itinerary } from '@/types/index';
import type { Viaggio } from '@/types/models/Viaggio';
import {
  createEmptyDiaryForViaggio,
  listDiariesByViaggio,
  setViaggioActiveDiary,
} from '@/services/viaggio/viaggioDiaryService';
import { getViaggio } from '@/services/viaggio/viaggioService';
import { useItinerary } from '@/context/ItineraryContext';
import { useModal } from '@/context/ModalContext';

interface Props {
  viaggioId: string;
  userId: string;
  onViaggioMetaChanged?: (viaggio: Viaggio | null) => void;
}

export const ViaggioDiarioSection: React.FC<Props> = ({
  viaggioId,
  userId,
  onViaggioMetaChanged,
}) => {
  const { loadProject } = useItinerary();
  const { closeModal } = useModal();
  const [diaries, setDiaries] = useState<Itinerary[]>([]);
  const [activeDiaryId, setActiveDiaryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
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
      const [rows, viaggio] = await Promise.all([
        listDiariesByViaggio(viaggioId),
        getViaggio(viaggioId),
      ]);
      if (!mountedRef.current) return;
      setDiaries(rows);
      setActiveDiaryId(viaggio?.activeDiaryId ?? null);
      onViaggioMetaChanged?.(viaggio);
    } catch (e) {
      console.error('[ViaggioDiarioSection] reload failed', e);
      if (!mountedRef.current) return;
      setError('Non è stato possibile caricare i diari.');
      setDiaries([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [viaggioId, onViaggioMetaChanged]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleCreate = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await createEmptyDiaryForViaggio({ viaggioId, userId });
      await reload();
    } catch (e) {
      console.error('[ViaggioDiarioSection] create failed', e);
      setError('Creazione diario non riuscita.');
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

  const handleOpen = (diary: Itinerary) => {
    loadProject(diary);
    closeModal();
  };

  return (
    <div
      data-testid="viaggio-section-diario"
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
          onClick={handleCreate}
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
                onClick={() => d.id && handleOpen(d)}
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
    </div>
  );
};
