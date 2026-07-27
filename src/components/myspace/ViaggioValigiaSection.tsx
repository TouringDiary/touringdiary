import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Briefcase } from 'lucide-react';
import type { Suitcase } from '@/types/suitcase';
import { listSuitcasesByViaggio } from '@/services/viaggio/viaggioSuitcaseService';
import { getViaggio } from '@/services/viaggio/viaggioService';
import { useModal } from '@/context/ModalContext';

interface Props {
  viaggioId: string;
}

/**
 * Valigia del Viaggio (DOC 31 Parte A) — distinta da MySpace → Strumenti.
 */
export const ViaggioValigiaSection: React.FC<Props> = ({ viaggioId }) => {
  const { openModal } = useModal();
  const [items, setItems] = useState<Suitcase[]>([]);
  const [activeDiaryId, setActiveDiaryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        listSuitcasesByViaggio(viaggioId),
        getViaggio(viaggioId),
      ]);
      if (!mountedRef.current) return;
      setItems(rows);
      setActiveDiaryId(viaggio?.activeDiaryId ?? null);
    } catch (e) {
      console.error('[ViaggioValigiaSection] reload failed', e);
      if (!mountedRef.current) return;
      setError('Non è stato possibile caricare le valigie.');
      setItems([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [viaggioId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const openPacking = (suitcaseId?: string) => {
    if (!activeDiaryId) {
      setError('Imposta un Diario attivo per aprire la Valigia in editor.');
      return;
    }
    openModal('packingList', {
      itineraryId: activeDiaryId,
      suitcaseId: suitcaseId ?? null,
    });
  };

  return (
    <div
      data-testid="viaggio-section-valigia"
      data-stereotype="Resource"
      className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 md:p-6"
    >
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-bold text-white">Valigia</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {loading ? 'Caricamento…' : `${items.length} valigie di questo viaggio`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => openPacking()}
          className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-amber-300 border border-amber-500/40 hover:bg-amber-500/10"
        >
          Apri packing
        </button>
      </div>

      {error && (
        <p className="text-sm text-rose-400 mb-4" role="alert">
          {error}
        </p>
      )}

      {!loading && items.length === 0 && !error && (
        <div className="flex flex-col items-center text-center py-12 px-4">
          <Briefcase className="w-10 h-10 text-slate-700 mb-3 opacity-60" aria-hidden />
          <p className="text-sm text-slate-400 max-w-sm">
            Qui troverai le valigie di questo viaggio. Non sono gli strumenti permanenti di MySpace.
          </p>
        </div>
      )}

      <ul className="space-y-2">
        {items.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => openPacking(s.id)}
              className="w-full text-left p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-amber-500/40 transition-colors"
            >
              <span className="block text-sm font-bold text-white truncate">
                {s.title || 'Valigia'}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
