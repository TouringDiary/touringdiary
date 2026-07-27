import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Plus } from 'lucide-react';
import type { Itinerary } from '@/types/index';
import type { Viaggio } from '@/types/models/Viaggio';
import type {
  ViaggioRicordoDayNote,
  ViaggioRicordoMedia,
  ViaggioRicordiStructureMode,
} from '@/types/models/ViaggioRicordi';
import { getViaggio } from '@/services/viaggio/viaggioService';
import { listDiariesByViaggio } from '@/services/viaggio/viaggioDiaryService';
import { buildRicordiDaySlots } from '@/services/viaggio/viaggioRicordiDayStructure';
import {
  deleteRicordoMedia,
  listRicordiDayNotesByViaggio,
  listRicordiMediaByViaggio,
  uploadRicordoMedia,
  upsertRicordiDayNote,
} from '@/services/viaggio/viaggioRicordiService';

interface Props {
  viaggioId: string;
  userId: string;
}

/**
 * Resource Ricordi — Foto / Video / Note-giorno (DOC 37 §6).
 * Due modalità struttura giorni; ownership media sul Viaggio.
 */
export const ViaggioRicordiSection: React.FC<Props> = ({ viaggioId, userId }) => {
  const [viaggio, setViaggio] = useState<Viaggio | null>(null);
  const [diaries, setDiaries] = useState<Itinerary[]>([]);
  const [mode, setMode] = useState<ViaggioRicordiStructureMode>('viaggio_period');
  const [diaryId, setDiaryId] = useState('');
  const [media, setMedia] = useState<ViaggioRicordoMedia[]>([]);
  const [notes, setNotes] = useState<ViaggioRicordoDayNote[]>([]);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
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
      const [v, diaryRows, mediaRows, noteRows] = await Promise.all([
        getViaggio(viaggioId),
        listDiariesByViaggio(viaggioId),
        listRicordiMediaByViaggio(viaggioId),
        listRicordiDayNotesByViaggio(viaggioId),
      ]);
      if (!mountedRef.current) return;
      setViaggio(v);
      setDiaries(diaryRows);
      setMedia(mediaRows);
      setNotes(noteRows);
      setDiaryId((prev) => {
        if (prev && diaryRows.some((d) => d.id === prev)) return prev;
        return v?.activeDiaryId || diaryRows[0]?.id || '';
      });
    } catch (e) {
      console.error('[ViaggioRicordiSection] reload failed', e);
      if (!mountedRef.current) return;
      setError('Non è stato possibile caricare i Ricordi.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [viaggioId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const selectedDiary = useMemo(
    () => diaries.find((d) => d.id === diaryId) ?? null,
    [diaries, diaryId],
  );

  const daySlots = useMemo(() => {
    if (!viaggio) return [];
    return buildRicordiDaySlots({ mode, viaggio, diary: selectedDiary });
  }, [mode, viaggio, selectedDiary]);

  useEffect(() => {
    if (daySlots.length === 0) {
      setSelectedDayKey(null);
      return;
    }
    setSelectedDayKey((prev) =>
      prev && daySlots.some((d) => d.dayKey === prev) ? prev : daySlots[0].dayKey,
    );
  }, [daySlots]);

  useEffect(() => {
    if (!selectedDayKey) {
      setNoteDraft('');
      return;
    }
    const existing = notes.find((n) => n.dayKey === selectedDayKey);
    setNoteDraft(existing?.body ?? '');
  }, [selectedDayKey, notes]);

  const dayMedia = useMemo(
    () => media.filter((m) => m.dayKey === selectedDayKey),
    [media, selectedDayKey],
  );

  const handleUpload = async (file: File | undefined) => {
    if (!file || !selectedDayKey || busy) return;
    setBusy(true);
    setError(null);
    try {
      await uploadRicordoMedia({
        viaggioId,
        userId,
        dayKey: selectedDayKey,
        file,
      });
      await reload();
    } catch (e) {
      console.error('[ViaggioRicordiSection] upload failed', e);
      setError(e instanceof Error ? e.message : 'Upload non riuscito.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSaveNote = async () => {
    if (!selectedDayKey || busy) return;
    setBusy(true);
    setError(null);
    try {
      await upsertRicordiDayNote({
        viaggioId,
        userId,
        dayKey: selectedDayKey,
        body: noteDraft,
      });
      await reload();
    } catch (e) {
      console.error('[ViaggioRicordiSection] note save failed', e);
      setError('Salvataggio nota non riuscito.');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteMedia = async (row: ViaggioRicordoMedia) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await deleteRicordoMedia(row);
      await reload();
    } catch (e) {
      console.error('[ViaggioRicordiSection] delete failed', e);
      setError('Eliminazione non riuscita.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      data-testid="viaggio-section-ricordi"
      data-stereotype="Resource"
      className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 md:p-6"
    >
      <div className="flex flex-col gap-4 mb-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">Ricordi</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Resource · Foto / Video / Note-giorno · ownership sul Viaggio
            </p>
          </div>
          <Camera className="w-5 h-5 text-slate-600 shrink-0" aria-hidden />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Struttura giorni
          </label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as ViaggioRicordiStructureMode)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1.5"
            data-testid="ricordi-structure-mode"
          >
            <option value="viaggio_period">Periodo del Viaggio</option>
            <option value="diary_timeline">Timeline di un Diario</option>
          </select>
          {mode === 'diary_timeline' && (
            <select
              value={diaryId}
              onChange={(e) => setDiaryId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1.5 min-w-[10rem]"
              data-testid="ricordi-diary-select"
            >
              {diaries.length === 0 && <option value="">Nessun diario</option>}
              {diaries.map((d) => (
                <option key={d.id ?? d.name} value={d.id ?? ''}>
                  {d.name || 'Diario'}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-rose-400 mb-4" role="alert">
          {error}
        </p>
      )}

      {loading && <p className="text-sm text-slate-500">Caricamento…</p>}

      {!loading && daySlots.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-10">
          {mode === 'viaggio_period'
            ? 'Imposta il periodo del Viaggio per strutturare i giorni, oppure passa alla timeline di un Diario.'
            : 'Seleziona un Diario del Viaggio per usare la sua timeline.'}
        </p>
      )}

      {!loading && daySlots.length > 0 && (
        <div className="grid md:grid-cols-[12rem_1fr] gap-4">
          <ul className="space-y-1" data-testid="ricordi-day-list">
            {daySlots.map((slot) => {
              const count = media.filter((m) => m.dayKey === slot.dayKey).length;
              const active = slot.dayKey === selectedDayKey;
              return (
                <li key={slot.dayKey}>
                  <button
                    type="button"
                    onClick={() => setSelectedDayKey(slot.dayKey)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                      active
                        ? 'bg-amber-500/15 text-amber-200 border border-amber-500/40'
                        : 'text-slate-400 hover:bg-slate-900 border border-transparent'
                    }`}
                  >
                    <span className="font-semibold block truncate">{slot.label}</span>
                    <span className="text-[10px] text-slate-500">{count} media</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="min-w-0 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-slate-200">
                {daySlots.find((d) => d.dayKey === selectedDayKey)?.label ?? 'Giorno'}
              </h4>
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  onChange={(e) => void handleUpload(e.target.files?.[0])}
                />
                <button
                  type="button"
                  disabled={busy || !selectedDayKey}
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-amber-300 border border-amber-500/40 hover:bg-amber-500/10 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden />
                  Foto / Video
                </button>
              </div>
            </div>

            {dayMedia.length === 0 ? (
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" aria-hidden />
                Nessun media per questo giorno.
              </p>
            ) : (
              <ul className="space-y-2">
                {dayMedia.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-slate-200 truncate">{m.title || m.kind}</p>
                      <p className="text-[10px] text-slate-500 uppercase">
                        {m.kind}
                        {m.coordsLat != null ? ' · GPS' : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleDeleteMedia(m)}
                      className="text-[10px] font-bold uppercase text-rose-300 hover:text-rose-200 disabled:opacity-50"
                    >
                      Elimina
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Nota del giorno (Ricordi)
              </label>
              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-200 p-3"
                placeholder="Ricordo testuale di questo giorno…"
                data-testid="ricordi-day-note"
              />
              <button
                type="button"
                disabled={busy || !selectedDayKey}
                onClick={() => void handleSaveNote()}
                className="mt-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-amber-300 border border-amber-500/40 hover:bg-amber-500/10 disabled:opacity-50"
              >
                Salva nota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
