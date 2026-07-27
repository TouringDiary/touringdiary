import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Paperclip, Plus } from 'lucide-react';
import type { ViaggioAttachment, ViaggioAttachmentCategory } from '@/types/models/ViaggioAttachment';
import { VIAGGIO_ATTACHMENT_CATEGORIES } from '@/types/models/ViaggioAttachment';
import {
  createSignedViaggioAttachmentUrl,
  deleteViaggioAttachment,
  listViaggioAttachments,
  uploadViaggioAttachment,
} from '@/services/viaggio/viaggioAttachmentService';

interface Props {
  viaggioId: string;
  userId: string;
}

/**
 * Resource Allegati del Viaggio (DOC 37 §7).
 * Ownership personale sul Viaggio — distinto dagli Allegati Workspace.
 */
export const ViaggioAllegatiSection: React.FC<Props> = ({ viaggioId, userId }) => {
  const [rows, setRows] = useState<ViaggioAttachment[]>([]);
  const [category, setCategory] = useState<ViaggioAttachmentCategory>('misc');
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
      const list = await listViaggioAttachments(viaggioId);
      if (!mountedRef.current) return;
      setRows(list);
    } catch (e) {
      console.error('[ViaggioAllegatiSection] reload failed', e);
      if (!mountedRef.current) return;
      setError('Non è stato possibile caricare gli allegati del Viaggio.');
      setRows([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [viaggioId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleUpload = async (file: File | undefined) => {
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    try {
      await uploadViaggioAttachment({
        viaggioId,
        userId,
        file,
        category,
      });
      await reload();
    } catch (e) {
      console.error('[ViaggioAllegatiSection] upload failed', e);
      setError(e instanceof Error ? e.message : 'Upload non riuscito.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleOpen = async (row: ViaggioAttachment) => {
    const url = await createSignedViaggioAttachmentUrl(row.storagePath);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDelete = async (row: ViaggioAttachment) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await deleteViaggioAttachment(row);
      await reload();
    } catch (e) {
      console.error('[ViaggioAllegatiSection] delete failed', e);
      setError('Eliminazione non riuscita.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      data-testid="viaggio-section-allegati"
      data-stereotype="Resource"
      className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 md:p-6"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="text-base font-bold text-white">Allegati</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Resource del Viaggio · non sono gli Allegati Workspace
          </p>
        </div>
        <Paperclip className="w-5 h-5 text-slate-600 shrink-0" aria-hidden />
      </div>

      <p
        className="text-[11px] text-slate-500 mb-4 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2"
        data-testid="allegati-ownership-note"
      >
        Questi file appartengono al <strong className="text-slate-300">Viaggio personale</strong>.
        Gli allegati di un Workspace restano del gruppo e non compaiono qui.
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ViaggioAttachmentCategory)}
          className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1.5"
        >
          {VIAGGIO_ATTACHMENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(e) => void handleUpload(e.target.files?.[0])}
        />
        <button
          type="button"
          disabled={busy || loading}
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-amber-300 border border-amber-500/40 hover:bg-amber-500/10 disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden />
          Carica
        </button>
      </div>

      {error && (
        <p className="text-sm text-rose-400 mb-4" role="alert">
          {error}
        </p>
      )}

      {loading && <p className="text-sm text-slate-500">Caricamento…</p>}

      {!loading && rows.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-10">Nessun allegato del Viaggio.</p>
      )}

      {!loading && rows.length > 0 && (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2"
            >
              <button
                type="button"
                onClick={() => void handleOpen(row)}
                className="min-w-0 text-left"
              >
                <p className="text-sm text-slate-200 truncate">{row.fileName}</p>
                <p className="text-[10px] text-slate-500 uppercase">
                  {row.category} · {(row.sizeBytes / 1024).toFixed(0)} KB
                </p>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleDelete(row)}
                className="text-[10px] font-bold uppercase text-rose-300 hover:text-rose-200 disabled:opacity-50"
              >
                Elimina
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
