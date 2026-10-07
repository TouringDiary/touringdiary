import { Loader2, Trash2 } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { assignmentStatusLabel } from '@/constants/governance';
import { useDialogFocusTrap } from '@/hooks/useDialogFocusTrap';
import {
  type HardDeletePhotoOutcome,
  hardDeletePhotoAsset,
  hardDeletePhotoAssignment,
  removeAuthorizedMediaObjects,
  type StorageObjectRef,
} from '@/services/media/hardDeleteMediaPhotoService';
import {
  listMediaAssetUsages,
  type MediaAssetUsage,
} from '@/services/media/mediaAssetSuspendService';

type HardDeleteMediaPhotoModalProps = {
  isOpen: boolean;
  mediaAssetId: string | null;
  onClose: () => void;
  onDatabaseDeleted: (scope: { assignmentId: string | null }) => void;
};

const ROLE_LABEL: Record<string, string> = {
  primary: 'Primaria',
  gallery: 'Galleria',
};

function usageCountLabel(count: number): string {
  if (count === 1) return 'Questa foto è utilizzata in 1 punto.';
  return `Questa foto è utilizzata in ${count} punti.`;
}

function outcomeNotice(outcome: HardDeletePhotoOutcome): string | null {
  const parts: string[] = [];
  if (outcome.storagePathAbsent) {
    parts.push(
      "La foto è stata eliminata dal database. Nessun file Storage era registrato sull'asset.",
    );
  }
  if (outcome.failedObjects.length > 0) {
    const names = outcome.failedObjects.map((objectRef) => `${objectRef.bucket}/${objectRef.path}`);
    parts.push(
      `La foto è stata eliminata dal database, ma questi file non sono stati rimossi dallo Storage: ${names.join(', ')}.`,
    );
  }
  if (outcome.releaseError) {
    parts.push(
      `I file confermati come rimossi restano registrati nell'autorizzazione Storage: ${outcome.releaseError}`,
    );
  }
  return parts.length > 0 ? parts.join(' ') : null;
}

export const HardDeleteMediaPhotoModal = ({
  isOpen,
  mediaAssetId,
  onClose,
  onDatabaseDeleted,
}: HardDeleteMediaPhotoModalProps) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [usages, setUsages] = useState<MediaAssetUsage[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<StorageObjectRef[]>([]);
  const [sealed, setSealed] = useState(false);

  useDialogFocusTrap(isOpen, dialogRef, loading);

  useEffect(() => {
    if (!isOpen || !mediaAssetId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setReady(false);
    setConfirmAll(false);
    setPendingFiles([]);
    setSealed(false);
    setUsages([]);
    void listMediaAssetUsages(mediaAssetId)
      .then((next) => {
        if (!cancelled) {
          setUsages(next);
          setReady(true);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Lettura utilizzi fallita.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, mediaAssetId]);

  if (!isOpen || !mediaAssetId) return null;

  const requestClose = () => {
    if (loading) return;
    onClose();
  };

  const applyOutcome = (outcome: HardDeletePhotoOutcome, assignmentId: string | null) => {
    onDatabaseDeleted({ assignmentId });
    setSealed(true);
    const notice = outcomeNotice(outcome);
    if (!notice) {
      onClose();
      return;
    }
    setPendingFiles(outcome.failedObjects);
    setError(notice);
    setConfirmAll(false);
    setReady(true);
  };

  const deleteOne = async (assignmentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const outcome = await hardDeletePhotoAssignment(mediaAssetId, assignmentId);
      applyOutcome(outcome, assignmentId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Cancellazione foto fallita.');
    } finally {
      setLoading(false);
    }
  };

  const deleteAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const outcome = await hardDeletePhotoAsset(mediaAssetId);
      applyOutcome(outcome, null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Cancellazione foto fallita.');
    } finally {
      setLoading(false);
    }
  };

  const retryFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const removal = await removeAuthorizedMediaObjects(pendingFiles);
      if (removal.failed.length === 0 && !removal.releaseError) {
        onClose();
        return;
      }
      setPendingFiles(removal.failed);
      const parts: string[] = [];
      if (removal.failed.length > 0) {
        const names = removal.failed.map((objectRef) => `${objectRef.bucket}/${objectRef.path}`);
        parts.push(
          `Questi file sono ancora nello Storage: ${names.join(', ')}. La foto non è più nel database.`,
        );
      }
      if (removal.releaseError) {
        parts.push(
          `I file confermati come rimossi restano registrati nell'autorizzazione Storage: ${removal.releaseError}`,
        );
      }
      setError(parts.join(' '));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Rimozione file fallita.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-admin-modal flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Chiudi finestra"
        disabled={loading}
        className="absolute inset-0 h-full w-full cursor-default border-0 bg-transparent p-0"
        onClick={requestClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl outline-none"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-800 bg-[#0f172a] px-4 py-4 sm:px-6">
          <h2 id={titleId} className="min-w-0 text-lg font-bold text-white sm:text-xl">
            CANCELLA FOTO
          </h2>
          <CloseButton onClose={requestClose} disabled={loading} />
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6">
          {confirmAll ? (
            <p className="text-sm leading-relaxed text-rose-200">
              Cancella da tutti i punti elimina la foto, tutti i suoi utilizzi e il file.
              L'operazione è definitiva e non si può annullare.
            </p>
          ) : (
            <>
              {ready ? (
                <p className="text-sm text-amber-200">{usageCountLabel(usages.length)}</p>
              ) : null}
              {usages.length === 1 ? (
                <p className="text-sm text-slate-300">
                  È l'ultimo utilizzo registrato. L'operazione chiederà la rimozione di questo
                  utilizzo e, se il server non trova altri utilizzi, potrà rimuovere anche l'asset e
                  il file.
                </p>
              ) : null}
              {loading && !ready ? (
                <p className="text-sm text-slate-400">Lettura utilizzi...</p>
              ) : null}
              {ready && usages.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Non risultano utilizzi collegati. L'esito della cancellazione dell'asset è quello
                  della procedura server.
                </p>
              ) : null}
              {usages.length > 0 ? (
                <ul className="space-y-3">
                  {usages.map((usage) => (
                    <li
                      key={usage.assignmentId}
                      className="min-w-0 rounded-xl border border-white/10 bg-black/20 p-3"
                    >
                      <p className="text-sm font-semibold text-white">{usage.entityLabel}</p>
                      <p className="mt-1 break-words text-sm text-slate-300">
                        {usage.entityType} · {usage.cityName} ·{' '}
                        {ROLE_LABEL[usage.role] ?? usage.role} ·{' '}
                        {assignmentStatusLabel(usage.assignmentStatus)}
                        {usage.isCurrent ? '' : ' · non corrente'}
                      </p>
                      <button
                        type="button"
                        onClick={() => void deleteOne(usage.assignmentId)}
                        disabled={loading || !ready || sealed}
                        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-rose-500/60 px-3 text-xs font-bold uppercase tracking-wide text-rose-100 hover:bg-rose-900/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 sm:w-auto"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                        Cancella da questo punto
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
          {error ? (
            <p className="break-words text-sm text-red-300" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col gap-2 border-t border-slate-800 px-4 py-4 sm:px-6">
          {pendingFiles.length > 0 ? (
            <button
              type="button"
              onClick={() => void retryFiles()}
              disabled={loading}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-rose-700 px-4 text-xs font-bold uppercase tracking-wide text-white hover:bg-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
              Riprova rimozione file
            </button>
          ) : null}
          {pendingFiles.length === 0 && confirmAll && !sealed ? (
            <>
              <button
                type="button"
                onClick={() => void deleteAll()}
                disabled={loading}
                aria-busy={loading}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-rose-700 px-4 text-xs font-bold uppercase tracking-wide text-white hover:bg-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
                Conferma cancellazione definitiva
              </button>
              <button
                type="button"
                onClick={() => setConfirmAll(false)}
                disabled={loading}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-600 px-4 text-xs font-bold uppercase tracking-wide text-slate-100 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50"
              >
                Torna all'elenco
              </button>
            </>
          ) : !sealed ? (
            <>
              <button
                type="button"
                onClick={() => setConfirmAll(true)}
                disabled={loading || !ready}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-rose-700 px-4 text-xs font-bold uppercase tracking-wide text-white hover:bg-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50"
              >
                Cancella da tutti i punti
              </button>
              <button
                type="button"
                onClick={requestClose}
                disabled={loading}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-600 px-4 text-xs font-bold uppercase tracking-wide text-slate-100 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50"
              >
                Annulla
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={requestClose}
              disabled={loading}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-600 px-4 text-xs font-bold uppercase tracking-wide text-slate-100 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50"
            >
              Chiudi
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
