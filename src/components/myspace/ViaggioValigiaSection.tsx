import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Briefcase, Link2, Plus } from 'lucide-react';
import type { Suitcase } from '@/types/suitcase';
import {
  linkSuitcaseToViaggio,
  listSuitcasesByViaggio,
  unlinkSuitcaseFromViaggio,
} from '@/services/viaggio/viaggioSuitcaseService';
import { getViaggio } from '@/services/viaggio/viaggioService';
import {
  createSuitcaseAsync,
  fetchUserSuitcasesAsync,
} from '@/services/suitcase/suitcaseCoreService';
import { useModal } from '@/context/ModalContext';
import { useUser } from '@/context/UserContext';

interface Props {
  viaggioId: string;
}

/**
 * Valigia del Viaggio (DOC 31 Parte A / DOC 37 §8) — create / link / reopen.
 */
export const ViaggioValigiaSection: React.FC<Props> = ({ viaggioId }) => {
  const { openModal } = useModal();
  const { user } = useUser();
  const userId = user?.id ?? '';
  const [items, setItems] = useState<Suitcase[]>([]);
  const [allSuitcases, setAllSuitcases] = useState<Suitcase[]>([]);
  const [activeDiaryId, setActiveDiaryId] = useState<string | null>(null);
  const [linkId, setLinkId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
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
      const [rows, viaggio, all] = await Promise.all([
        listSuitcasesByViaggio(viaggioId),
        getViaggio(viaggioId),
        userId ? fetchUserSuitcasesAsync(userId) : Promise.resolve([] as Suitcase[]),
      ]);
      if (!mountedRef.current) return;
      setItems(rows);
      setActiveDiaryId(viaggio?.activeDiaryId ?? null);
      setAllSuitcases(all);
      setLinkId('');
    } catch (e) {
      console.error('[ViaggioValigiaSection] reload failed', e);
      if (!mountedRef.current) return;
      setError('Non è stato possibile caricare le valigie.');
      setItems([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [viaggioId, userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const available = useMemo(() => {
    const linked = new Set(items.map((r) => r.id));
    return allSuitcases.filter((s) => !linked.has(s.id) && !s.is_user_template);
  }, [items, allSuitcases]);

  const openPacking = (suitcaseId?: string) => {
    if (!activeDiaryId) {
      setError('Imposta un Diario attivo nella sezione Diario per aprire la Valigia in editor.');
      return;
    }
    // returnTo non è consumato dalla chiusura packing (WorkspaceHost → closeModal).
    // Il contesto Viaggio resta via mySpaceNavMemory al reopen MySpace.
    openModal('packingList', {
      itineraryId: activeDiaryId,
      suitcaseId: suitcaseId ?? null,
      returnTo: 'mySpace',
    });
  };

  const handleCreate = async () => {
    if (!userId || busy) return;
    setBusy(true);
    setError(null);
    try {
      const created = await createSuitcaseAsync(userId, 'Nuova valigia', '🎒');
      if (!created?.id) throw new Error('Creazione valigia non riuscita.');
      await linkSuitcaseToViaggio(viaggioId, created.id, userId);
      if (!mountedRef.current) return;
      await reload();
      if (!mountedRef.current) return;
      openPacking(created.id);
    } catch (e) {
      console.error('[ViaggioValigiaSection] create failed', e);
      if (!mountedRef.current) return;
      setError(e instanceof Error ? e.message : 'Creazione non riuscita.');
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  const handleLink = async () => {
    if (!userId || !linkId || busy) return;
    setBusy(true);
    setError(null);
    try {
      await linkSuitcaseToViaggio(viaggioId, linkId, userId);
      await reload();
    } catch (e) {
      console.error('[ViaggioValigiaSection] link failed', e);
      setError('Collegamento non riuscito.');
    } finally {
      setBusy(false);
    }
  };

  const handleUnlink = async (suitcaseId: string) => {
    if (busy) return;
    const ok = window.confirm('Scollegare questa valigia dal Viaggio? La valigia non verrà eliminata.');
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      await unlinkSuitcaseFromViaggio(viaggioId, suitcaseId);
      await reload();
    } catch (e) {
      console.error('[ViaggioValigiaSection] unlink failed', e);
      setError('Scollegamento non riuscito.');
    } finally {
      setBusy(false);
    }
  };

  const diaryHint = useMemo(
    () =>
      activeDiaryId
        ? null
        : 'Per l’editor packing serve un Diario attivo (sezione Diario).',
    [activeDiaryId],
  );

  return (
    <div
      data-testid="viaggio-section-valigia"
      data-stereotype="Resource"
      className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 md:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-bold text-white">Valigia</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {loading ? 'Caricamento…' : `${items.length} valigie di questo viaggio`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || !userId}
            onClick={() => void handleCreate()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-amber-300 border border-amber-500/40 hover:bg-amber-500/10 disabled:opacity-50"
            data-testid="valigia-create"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden />
            Nuova
          </button>
          <button
            type="button"
            disabled={!activeDiaryId}
            onClick={() => openPacking()}
            className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-300 border border-slate-700 hover:bg-slate-900 disabled:opacity-50"
          >
            Apri packing
          </button>
        </div>
      </div>

      {diaryHint && (
        <p className="text-xs text-amber-200/80 mb-3" data-testid="valigia-diary-hint">
          {diaryHint}
        </p>
      )}

      {error && (
        <p className="text-sm text-rose-400 mb-4" role="alert">
          {error}
        </p>
      )}

      {!loading && available.length > 0 && (
        <div
          className="mb-5 flex flex-wrap items-end gap-2 rounded-xl border border-slate-800 bg-slate-950/50 p-3"
          data-testid="valigia-link-panel"
        >
          <div className="min-w-[12rem] flex-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Collega valigia esistente
            </label>
            <select
              value={linkId}
              onChange={(e) => setLinkId(e.target.value)}
              className="mt-1 w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1.5"
            >
              <option value="">Seleziona…</option>
              {available.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title || 'Valigia'}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            disabled={busy || !linkId}
            onClick={() => void handleLink()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-amber-300 border border-amber-500/40 hover:bg-amber-500/10 disabled:opacity-50"
          >
            <Link2 className="w-3.5 h-3.5" aria-hidden />
            Collega
          </button>
        </div>
      )}

      {!loading && items.length === 0 && !error && (
        <div className="flex flex-col items-center text-center py-12 px-4">
          <Briefcase className="w-10 h-10 text-slate-700 mb-3 opacity-60" aria-hidden />
          <p className="text-sm text-slate-400 max-w-sm">
            Nessuna valigia collegata. Creane una nuova o collegane una esistente. Non sono gli
            strumenti permanenti di MySpace → Strumenti.
          </p>
        </div>
      )}

      <ul className="space-y-2">
        {items.map((s) => (
          <li
            key={s.id}
            className="flex items-center gap-2 p-3 rounded-xl border border-slate-800 bg-slate-900/60"
          >
            <button
              type="button"
              onClick={() => openPacking(s.id)}
              className="flex-1 min-w-0 text-left hover:opacity-90 transition-opacity"
            >
              <span className="block text-sm font-bold text-white truncate">
                {s.title || 'Valigia'}
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                Riapri packing
              </span>
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleUnlink(s.id)}
              className="text-[10px] font-bold uppercase text-slate-500 hover:text-rose-300 disabled:opacity-50 shrink-0"
            >
              Scollega
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
