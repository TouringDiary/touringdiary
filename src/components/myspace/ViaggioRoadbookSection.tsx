import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import type { ViaggioRoadbookArtifact } from '@/types/models/ViaggioRoadbookArtifact';
import type { Itinerary } from '@/types/index';
import {
  createRoadbookArtifactFromDiary,
  listRoadbookArtifactsByViaggio,
} from '@/services/viaggio/viaggioRoadbookService';
import { listDiariesByViaggio } from '@/services/viaggio/viaggioDiaryService';
import { getViaggio } from '@/services/viaggio/viaggioService';

interface Props {
  viaggioId: string;
  userId: string;
}

/**
 * Library Roadbook del Viaggio — artifact immutabili generati da un Diario (DOC 37 §5).
 */
export const ViaggioRoadbookSection: React.FC<Props> = ({ viaggioId, userId }) => {
  const [artifacts, setArtifacts] = useState<ViaggioRoadbookArtifact[]>([]);
  const [diaries, setDiaries] = useState<Itinerary[]>([]);
  const [activeDiaryId, setActiveDiaryId] = useState<string | null>(null);
  const [selectedDiaryId, setSelectedDiaryId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState<ViaggioRoadbookArtifact | null>(null);
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
      const [arts, diaryRows, viaggio] = await Promise.all([
        listRoadbookArtifactsByViaggio(viaggioId),
        listDiariesByViaggio(viaggioId),
        getViaggio(viaggioId),
      ]);
      if (!mountedRef.current) return;
      setArtifacts(arts);
      setDiaries(diaryRows);
      const active = viaggio?.activeDiaryId ?? null;
      setActiveDiaryId(active);
      setSelectedDiaryId((prev) => {
        if (prev && diaryRows.some((d) => d.id === prev)) return prev;
        return active || diaryRows[0]?.id || '';
      });
    } catch (e) {
      console.error('[ViaggioRoadbookSection] reload failed', e);
      if (!mountedRef.current) return;
      setError('Non è stato possibile caricare la libreria Roadbook.');
      setArtifacts([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [viaggioId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleGenerate = async () => {
    if (creating) return;
    const diaryId = selectedDiaryId || activeDiaryId;
    if (!diaryId) {
      setError('Seleziona un Diario del Viaggio (o impostane uno attivo).');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const created = await createRoadbookArtifactFromDiary({
        viaggioId,
        diaryId,
        userId,
      });
      if (!mountedRef.current) return;
      setPreview(created);
      await reload();
    } catch (e) {
      console.error('[ViaggioRoadbookSection] generate failed', e);
      if (mountedRef.current) {
        setError('Generazione Roadbook non riuscita.');
      }
    } finally {
      if (mountedRef.current) setCreating(false);
    }
  };

  return (
    <div
      data-testid="viaggio-section-roadbook"
      data-stereotype="Library"
      className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 md:p-6"
    >
      <div className="flex flex-col gap-3 mb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base font-bold text-white">Roadbook</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {loading ? 'Caricamento…' : `${artifacts.length} artifact immutabili`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="roadbook-source-diary">
            Diario sorgente
          </label>
          <select
            id="roadbook-source-diary"
            value={selectedDiaryId}
            onChange={(e) => setSelectedDiaryId(e.target.value)}
            disabled={diaries.length === 0 || creating}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1.5 max-w-[14rem]"
          >
            {diaries.length === 0 && <option value="">Nessun diario</option>}
            {diaries.map((d) => (
              <option key={d.id!} value={d.id!}>
                {d.name || 'Diario'}
                {d.id === activeDiaryId ? ' (attivo)' : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={creating || diaries.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-amber-300 border border-amber-500/40 hover:bg-amber-500/10 disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden />
            Genera
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-rose-400 mb-4" role="alert">
          {error}
        </p>
      )}

      {!loading && artifacts.length === 0 && !error && (
        <div className="flex flex-col items-center text-center py-12 px-4">
          <FileText className="w-10 h-10 text-slate-700 mb-3 opacity-60" aria-hidden />
          <p className="text-sm text-slate-400 max-w-sm">
            Qui troverai i roadbook di questo viaggio. Ogni generazione crea uno snapshot immutabile.
          </p>
        </div>
      )}

      <ul className="space-y-2 mb-6">
        {artifacts.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => setPreview(a)}
              className="w-full text-left p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-amber-500/40 transition-colors"
            >
              <span className="block text-sm font-bold text-white truncate">{a.name}</span>
              <span className="block text-[11px] text-slate-500 mt-1">
                {new Date(a.createdAt).toLocaleString('it-IT')}
                {a.sourceDiaryId ? ` · Diario ${a.sourceDiaryId.slice(0, 8)}…` : ''}
                {` · ${a.snapshot.length} giorni`}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {preview && (
        <div
          className="rounded-xl border border-slate-700 bg-slate-950/80 p-4"
          data-testid="viaggio-roadbook-preview"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <h4 className="text-sm font-bold text-white truncate">{preview.name}</h4>
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Chiudi
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mb-3">
            Snapshot immutabile — le modifiche al Diario non alterano questo artifact.
          </p>
          {preview.snapshot.length === 0 ? (
            <p className="text-sm text-slate-400">Nessun segmento (diario vuoto o snapshot vuoto).</p>
          ) : (
            <ul className="space-y-2 text-xs text-slate-300">
              {preview.snapshot.map((day) => (
                <li key={day.dayIndex} className="border border-slate-800 rounded-lg p-2">
                  Giorno {day.dayIndex + 1}: {day.segments?.length ?? 0} segmenti
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
