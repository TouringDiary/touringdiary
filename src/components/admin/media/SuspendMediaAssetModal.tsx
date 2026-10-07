import { Loader2 } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { assignmentStatusLabel } from '@/constants/governance';
import { useDialogFocusTrap } from '@/hooks/useDialogFocusTrap';
import {
  listMediaAssetUsages,
  type MediaAssetUsage,
  readMediaAssetAdminBlocked,
  setMediaAssetAdminBlock,
} from '@/services/media/mediaAssetSuspendService';

type SuspendIntent = 'poi-sources' | 'wikimedia';

type AssetBundle = {
  assetId: string;
  blocked: boolean;
  usages: MediaAssetUsage[];
};

type SuspendMediaAssetModalProps = {
  isOpen: boolean;
  mediaAssetIds: string[];
  intent: SuspendIntent;
  onClose: () => void;
  onSuspended: () => void;
};

export const SuspendMediaAssetModal = ({
  isOpen,
  mediaAssetIds,
  intent,
  onClose,
  onSuspended,
}: SuspendMediaAssetModalProps) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [bundles, setBundles] = useState<AssetBundle[]>([]);
  const [ready, setReady] = useState(false);
  const [rationale, setRationale] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const targetKey = mediaAssetIds.join(',');

  useDialogFocusTrap(isOpen, dialogRef, loading);

  useEffect(() => {
    const ids = targetKey.split(',').filter((id) => id.length > 0);
    if (!isOpen || ids.length === 0) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setRationale('');
    setReady(false);
    void Promise.all(
      ids.map(async (assetId) => {
        const [usages, blocked] = await Promise.all([
          listMediaAssetUsages(assetId),
          readMediaAssetAdminBlocked(assetId),
        ]);
        return { assetId, blocked, usages };
      }),
    )
      .then((next) => {
        if (!cancelled) {
          setBundles(next);
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
  }, [isOpen, targetKey]);

  if (!isOpen || mediaAssetIds.length === 0) return null;

  const allBlocked = bundles.length > 0 && bundles.every((bundle) => bundle.blocked);

  const requestClose = () => {
    if (loading) return;
    onClose();
  };

  const confirm = async () => {
    if (!rationale.trim()) {
      setError('La motivazione è obbligatoria.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const nextBlocked = !allBlocked;
      for (const bundle of bundles) {
        if (bundle.blocked === nextBlocked) continue;
        await setMediaAssetAdminBlock(bundle.assetId, nextBlocked, rationale.trim());
      }
      onSuspended();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Blocco foto fallito.');
    } finally {
      setLoading(false);
    }
  };

  const explanation = allBlocked
    ? 'Rimuovere il blocco riattiva il file in tutto il sito, non solo in questo POI. Gli assignment non vengono riscritti.'
    : intent === 'poi-sources'
      ? 'Il blocco riguarda le foto di questo POI delle sorgenti Sponsor, Admin, Wikimedia, Community e AI. È globale sul file: vale in tutto il sito, anche se lo stesso file è usato da un altro POI. Il placeholder resta disponibile. Gli assignment non diventano sospesi, rimossi o sostituiti.'
      : 'Blocca globalmente il file Wikimedia collegato a questo POI. Gli altri file del POI restano invariati. Gli assignment non cambiano stato. Non è una segnalazione e non spegne Wikimedia Pubblico.';

  const title = allBlocked
    ? intent === 'wikimedia'
      ? 'Rimuovi blocco foto Wikimedia'
      : 'Rimuovi blocco foto Admin'
    : intent === 'wikimedia'
      ? 'Blocca foto Wikimedia'
      : 'Blocco foto Admin';

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
            {title}
          </h2>
          <CloseButton onClose={requestClose} disabled={loading} />
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
          <p className="text-sm text-amber-200">{explanation}</p>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-300">
              {bundles.length > 1 ? 'File e utilizzi' : 'Questa foto è utilizzata in'}
            </h3>
            {loading && bundles.length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">Lettura utilizzi...</p>
            ) : null}
            {bundles.length > 0 ? (
              <div className="mt-2 space-y-4">
                {bundles.map((bundle, index) => (
                  <div key={bundle.assetId}>
                    {bundles.length > 1 ? (
                      <p className="text-xs font-bold uppercase text-slate-300">
                        File {index + 1}
                        {bundle.blocked ? ' — già bloccato globalmente' : ''}
                      </p>
                    ) : null}
                    {bundle.usages.length === 0 ? (
                      <p className="mt-1 text-sm text-slate-400">Nessun assignment collegato.</p>
                    ) : (
                      <ul className="mt-1 space-y-1">
                        {bundle.usages.map((row) => (
                          <li key={row.assignmentId} className="text-sm text-slate-200">
                            {row.entityLabel} — {row.cityName} —{' '}
                            {assignmentStatusLabel(row.assignmentStatus)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <label
            className="block text-xs font-bold uppercase text-slate-400"
            htmlFor={`${titleId}-why`}
          >
            Motivazione
          </label>
          <textarea
            id={`${titleId}-why`}
            value={rationale}
            onChange={(event) => setRationale(event.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white"
          />
          {error ? (
            <p className="text-sm text-red-300" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col gap-2 border-t border-slate-800 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={requestClose}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-600 px-4 text-xs font-bold uppercase tracking-wide text-slate-100 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={() => void confirm()}
            disabled={loading || !ready}
            aria-busy={loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-rose-700 px-4 text-xs font-bold uppercase tracking-wide text-white hover:bg-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {allBlocked ? 'Rimuovi blocco' : 'Conferma blocco'}
          </button>
        </div>
      </div>
    </div>
  );
};
