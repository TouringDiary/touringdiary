import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, FolderOpen, Image as ImageIcon, Plus, Video } from 'lucide-react';
import type { Itinerary } from '@/types/index';
import type { Viaggio } from '@/types/models/Viaggio';
import type {
  ViaggioRicordoDayNote,
  ViaggioRicordoMedia,
  ViaggioRicordiStructureMode,
} from '@/types/models/ViaggioRicordi';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import { getViaggio } from '@/services/viaggio/viaggioService';
import { listDiariesByViaggio } from '@/services/viaggio/viaggioDiaryService';
import { buildRicordiDaySlots } from '@/services/viaggio/viaggioRicordiDayStructure';
import {
  createSignedRicordoMediaUrl,
  deleteRicordoMedia,
  filterRicordiMediaForScope,
  linkRicordoMediaToDay,
  listRicordiDayNotesByViaggio,
  listRicordiMediaByViaggio,
  moveRicordoMediaDay,
  uploadRicordoMedia,
  upsertRicordiDayNote,
} from '@/services/viaggio/viaggioRicordiService';
import { showGlobalAlert } from '@/services/ui/toastService';

interface Props {
  viaggioId: string;
  userId: string;
}

type MediaFolder = 'photo' | 'video';

function primaryDayLabelForMedia(
  media: ViaggioRicordoMedia,
  dayLabelByKey: Record<string, string>,
): string {
  if (media.dayKeys.length > 1) return `${media.dayKeys.length} giorni`;
  if (media.dayKeys[0]) return dayLabelByKey[media.dayKeys[0]] || media.dayKeys[0];
  return 'Solo viaggio';
}

const MediaThumb: React.FC<{ media: ViaggioRicordoMedia }> = ({ media }) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // TODO: cache Signed URL indicizzata per storagePath, con rispetto della
    // scadenza (expiration) della URL e dedupe delle richieste concorrenti
    // durante il rendering di molte miniature — senza cambiare il contratto del service.
    void createSignedRicordoMediaUrl(media.storagePath)
      .then((u) => {
        if (!cancelled) setUrl(u);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(
            '[ViaggioRicordiSection] signed URL failed',
            media.storagePath,
            err,
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [media.storagePath]);

  if (!url) {
    return (
      <div className="w-full aspect-square rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
        {media.kind === 'video' ? <Video className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
      </div>
    );
  }

  if (media.kind === 'video') {
    return (
      <video
        src={url}
        className="w-full aspect-square object-cover rounded-lg border border-slate-800 bg-black"
        muted
        playsInline
        preload="metadata"
      />
    );
  }

  return (
    <img
      src={url}
      alt={media.title || 'Foto'}
      className="w-full aspect-square object-cover rounded-lg border border-slate-800"
      loading="lazy"
    />
  );
};

/**
 * Resource Ricordi — libreria viaggio ∪ giorno (DOC 37 §6 / VD-018…020).
 */
export const ViaggioRicordiSection: React.FC<Props> = ({ viaggioId, userId }) => {
  const [viaggio, setViaggio] = useState<Viaggio | null>(null);
  const [diaries, setDiaries] = useState<Itinerary[]>([]);
  const [mode, setMode] = useState<ViaggioRicordiStructureMode>('viaggio_period');
  const [diaryId, setDiaryId] = useState('');
  const [media, setMedia] = useState<ViaggioRicordoMedia[]>([]);
  const [notes, setNotes] = useState<ViaggioRicordoDayNote[]>([]);
  /** null = tutto il Viaggio (DOC 37 §6.3). */
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [folder, setFolder] = useState<MediaFolder>('photo');
  const [noteDraft, setNoteDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moveTarget, setMoveTarget] = useState<Record<string, string>>({});
  const [pendingDelete, setPendingDelete] = useState<ViaggioRicordoMedia | null>(null);
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
    if (!selectedDayKey) return;
    if (!daySlots.some((d) => d.dayKey === selectedDayKey)) {
      setSelectedDayKey(null);
    }
  }, [daySlots, selectedDayKey]);

  useEffect(() => {
    if (!selectedDayKey) {
      setNoteDraft('');
      return;
    }
    const existing = notes.find((n) => n.dayKey === selectedDayKey);
    setNoteDraft(existing?.body ?? '');
  }, [selectedDayKey, notes]);

  const scopedMedia = useMemo(
    () => filterRicordiMediaForScope(media, selectedDayKey),
    [media, selectedDayKey],
  );

  const folderMedia = useMemo(
    () => scopedMedia.filter((m) => m.kind === folder),
    [scopedMedia, folder],
  );

  const dayLabelByKey = useMemo(() => {
    const map: Record<string, string> = {};
    for (const slot of daySlots) {
      map[slot.dayKey] = slot.label;
    }
    return map;
  }, [daySlots]);

  const mediaCountByDay = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of media) {
      for (const key of m.dayKeys) {
        counts[key] = (counts[key] ?? 0) + 1;
      }
    }
    return counts;
  }, [media]);

  const folderLabels = useMemo(() => {
    const dayLabel = selectedDayKey ? (dayLabelByKey[selectedDayKey] ?? 'Giorno') : undefined;
    return {
      photo: selectedDayKey ? `FOTO – ${dayLabel}` : 'FOTO',
      video: selectedDayKey ? `VIDEO – ${dayLabel}` : 'VIDEO',
    };
  }, [selectedDayKey, dayLabelByKey]);

  const folderLabel = folderLabels[folder];

  const folderCounts = useMemo(() => {
    let photo = 0;
    let video = 0;
    for (const m of scopedMedia) {
      if (m.kind === 'photo') photo += 1;
      else if (m.kind === 'video') video += 1;
    }
    return { photo, video };
  }, [scopedMedia]);

  const handleUpload = async (file: File | undefined) => {
    if (!file || busy) return;
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

  const handleDeleteMedia = (row: ViaggioRicordoMedia) => {
    if (busy) return;
    setPendingDelete(row);
  };

  const confirmDeleteMedia = async () => {
    const row = pendingDelete;
    if (!row || busy) return;
    setBusy(true);
    setError(null);
    try {
      await deleteRicordoMedia(row);
      setPendingDelete(null);
      await reload();
    } catch (e) {
      console.error('[ViaggioRicordiSection] delete failed', e);
      setError('Eliminazione non riuscita.');
    } finally {
      setBusy(false);
    }
  };

  const handleMove = async (row: ViaggioRicordoMedia) => {
    const toDay = moveTarget[row.id];
    if (!toDay || busy) return;
    // Già collegato a quel giorno → nessuna chiamata al service
    if (row.dayKeys.includes(toDay)) return;
    setBusy(true);
    setError(null);
    try {
      if (selectedDayKey) {
        await moveRicordoMediaDay({ media: row, fromDayKey: selectedDayKey, toDayKey: toDay });
      } else {
        await linkRicordoMediaToDay(row, toDay);
      }
      showGlobalAlert(selectedDayKey ? 'Media spostato.' : 'Media collegato al giorno.');
      await reload();
    } catch (e) {
      console.error('[ViaggioRicordiSection] move failed', e);
      setError('Spostamento non riuscito.');
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
              Resource · libreria viaggio ∪ giorno · link logici multi-giorno
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

      {!loading && (
        <div className="grid md:grid-cols-[12rem_1fr] gap-4">
          <ul className="space-y-1" data-testid="ricordi-day-list">
            <li>
              <button
                type="button"
                onClick={() => setSelectedDayKey(null)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                  selectedDayKey === null
                    ? 'bg-amber-500/15 text-amber-200 border border-amber-500/40'
                    : 'text-slate-400 hover:bg-slate-900 border border-transparent'
                }`}
                data-testid="ricordi-day-all"
              >
                <span className="font-semibold block truncate">Tutto il Viaggio</span>
                <span className="text-[10px] text-slate-500">{media.length} media</span>
              </button>
            </li>
            {daySlots.length === 0 && (
              <li className="text-[10px] text-slate-600 px-2 py-2">
                {mode === 'viaggio_period'
                  ? 'Imposta il periodo del Viaggio per i giorni, oppure usa la timeline Diario.'
                  : 'Seleziona un Diario del Viaggio per la timeline.'}
              </li>
            )}
            {daySlots.map((slot) => {
              const count = mediaCountByDay[slot.dayKey] ?? 0;
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
            <div className="flex flex-wrap gap-2" data-testid="ricordi-folders">
              {(['photo', 'video'] as const).map((kind) => {
                const count = folderCounts[kind];
                const active = folder === kind;
                return (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setFolder(kind)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors ${
                      active
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                        : 'border-slate-800 text-slate-400 hover:bg-slate-900'
                    }`}
                    data-testid={`ricordi-folder-${kind}`}
                  >
                    {kind === 'photo' ? (
                      <FolderOpen className="w-3.5 h-3.5" aria-hidden />
                    ) : (
                      <Video className="w-3.5 h-3.5" aria-hidden />
                    )}
                    {folderLabels[kind]}
                    <span className="text-[10px] font-semibold text-slate-500 normal-case tracking-normal">
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-slate-200">{folderLabel}</h4>
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept={
                    folder === 'photo'
                      ? 'image/jpeg,image/png,image/webp,image/gif'
                      : 'video/mp4,video/webm,video/quicktime'
                  }
                  className="hidden"
                  onChange={(e) => void handleUpload(e.target.files?.[0])}
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-amber-300 border border-amber-500/40 hover:bg-amber-500/10 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden />
                  {folder === 'photo' ? 'Aggiungi foto' : 'Aggiungi video'}
                </button>
              </div>
            </div>

            {folderMedia.length === 0 ? (
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" aria-hidden />
                Nessun {folder === 'photo' ? 'foto' : 'video'} in questa cartella.
              </p>
            ) : (
              <>
                {!selectedDayKey && daySlots.length > 0 && (
                  <p
                    className="text-[10px] text-slate-500 leading-relaxed"
                    data-testid="ricordi-collega-hint"
                  >
                    Collega aggiunge un giorno di organizzazione: il media resta nel patrimonio del
                    Viaggio.
                  </p>
                )}
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="ricordi-media-grid">
                {folderMedia.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-lg border border-slate-800 bg-slate-900/60 p-2 space-y-2"
                  >
                    <MediaThumb media={m} />
                    <p className="text-xs text-slate-200 truncate">{m.title || m.kind}</p>
                    <p className="text-[10px] text-slate-500">
                      {primaryDayLabelForMedia(m, dayLabelByKey)}
                      {m.coordsLat != null ? ' · GPS' : ''}
                    </p>
                    {daySlots.length > 0 && (
                      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
                        <select
                          value={moveTarget[m.id] ?? ''}
                          onChange={(e) =>
                            setMoveTarget((prev) => ({ ...prev, [m.id]: e.target.value }))
                          }
                          className="w-full sm:w-auto sm:min-w-0 sm:flex-1 sm:basis-[8rem] bg-slate-950 border border-slate-700 text-[10px] text-slate-300 rounded px-2 py-1.5"
                          aria-label="Giorno destinazione"
                        >
                          <option value="">Giorno…</option>
                          {daySlots.map((s) => (
                            <option key={s.dayKey} value={s.dayKey}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                        {!selectedDayKey ? (
                          <span
                            title="Aggiunge il giorno selezionato senza rimuovere il media dal Viaggio"
                            className="shrink-0 inline-flex self-start sm:self-auto"
                          >
                            <button
                              type="button"
                              disabled={
                                busy ||
                                !moveTarget[m.id] ||
                                m.dayKeys.includes(moveTarget[m.id] ?? '')
                              }
                              onClick={() => void handleMove(m)}
                              className="text-[10px] font-bold uppercase text-amber-300 disabled:opacity-40 px-1 py-1"
                            >
                              Collega
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={
                              busy ||
                              !moveTarget[m.id] ||
                              m.dayKeys.includes(moveTarget[m.id] ?? '')
                            }
                            onClick={() => void handleMove(m)}
                            className="shrink-0 self-start sm:self-auto text-[10px] font-bold uppercase text-amber-300 disabled:opacity-40 px-1 py-1"
                          >
                            Sposta
                          </button>
                        )}
                      </div>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDeleteMedia(m)}
                      className="block w-full text-left text-[10px] font-bold uppercase text-rose-300 hover:text-rose-200 disabled:opacity-50"
                    >
                      Elimina da TouringDiary
                    </button>
                  </li>
                ))}
                </ul>
              </>
            )}

            {selectedDayKey && (
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
                  disabled={busy}
                  onClick={() => void handleSaveNote()}
                  className="mt-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-amber-300 border border-amber-500/40 hover:bg-amber-500/10 disabled:opacity-50"
                >
                  Salva nota
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={pendingDelete != null}
        onClose={() => {
          if (!busy) setPendingDelete(null);
        }}
        onConfirm={() => void confirmDeleteMedia()}
        title="Elimina da TouringDiary"
        message="Eliminare questo contenuto solo da TouringDiary (patrimonio del Viaggio)? Non verrà eliminato dal telefono o da cloud esterni."
        isDeleting={busy && pendingDelete != null}
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        variant="danger"
      />
    </div>
  );
};
