import { Loader2 } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { useDialogFocusTrap } from '@/hooks/useDialogFocusTrap';
import {
  validateWikimediaForSelectedPois,
  type WikimediaBulkPoiOutcome,
} from '@/services/media/wikimediaValidationService';

type WikimediaBulkValidationDialogProps = {
  isOpen: boolean;
  cityId: string;
  pois: Array<{ id: string; name: string }>;
  onClose: () => void;
};

export const WikimediaBulkValidationDialog = ({
  isOpen,
  cityId,
  pois,
  onClose,
}: WikimediaBulkValidationDialogProps) => {
  const titleId = useId();
  const helpId = useId();
  const rationaleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const operationRef = useRef(0);
  const inFlightRef = useRef(false);
  const [rationale, setRationale] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<WikimediaBulkPoiOutcome[] | null>(null);

  useDialogFocusTrap(isOpen, dialogRef, busy);

  useEffect(() => {
    operationRef.current += 1;
    if (!isOpen) return;
    setRationale('');
    setError(null);
    setOutcomes(null);
    setBusy(inFlightRef.current);
  }, [isOpen]);

  if (!isOpen) return null;

  const requestClose = () => {
    if (busy) return;
    onClose();
  };

  const submit = async () => {
    if (inFlightRef.current) return;
    const trimmed = rationale.trim();
    if (trimmed.length === 0) {
      setError('La motivazione è obbligatoria.');
      return;
    }
    const operation = operationRef.current;
    inFlightRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const next = await validateWikimediaForSelectedPois({
        cityId,
        pois,
        adminRationale: trimmed,
      });
      if (operationRef.current !== operation) return;
      setOutcomes(next);
    } catch (err: unknown) {
      if (operationRef.current !== operation) return;
      setError(err instanceof Error ? err.message : 'Validazione massiva fallita.');
    } finally {
      inFlightRef.current = false;
      setBusy(false);
    }
  };

  const validated = outcomes?.filter((row) => row.result === 'validated').length ?? 0;
  const skipped = outcomes?.filter((row) => row.result === 'skipped').length ?? 0;
  const failed = outcomes?.filter((row) => row.result === 'failed').length ?? 0;

  return (
    <div className="fixed inset-0 z-admin-modal flex items-end justify-center bg-black/90 p-3 backdrop-blur-sm sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Chiudi finestra"
        onClick={requestClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={helpId}
        tabIndex={-1}
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#0f172a] shadow-2xl"
      >
        <CloseButton onClose={requestClose} disabled={busy} />
        <form
          className="flex min-h-0 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <div className="space-y-4 overflow-y-auto px-4 py-6 sm:px-6">
            <h2
              id={titleId}
              className="pr-10 text-sm font-black uppercase tracking-wide text-white"
            >
              Valida Wikimedia
            </h2>
            <p id={helpId} className="text-sm text-slate-300">
              Una validazione per ogni POI selezionato ({pois.length}). I POI senza Wikimedia
              pertinente vengono saltati. La stessa foto in più POI viene validata una volta per
              ciascun POI. Il toggle Wikimedia Pubblico non cambia.
            </p>
            <label
              className="block text-xs font-bold uppercase text-slate-400"
              htmlFor={rationaleId}
            >
              Motivazione
            </label>
            <textarea
              id={rationaleId}
              value={rationale}
              onChange={(event) => setRationale(event.target.value)}
              rows={3}
              disabled={busy}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white"
            />
            {error ? (
              <p className="text-sm text-red-300" role="alert">
                {error}
              </p>
            ) : null}
            {outcomes ? (
              <div role="status" className="space-y-2">
                <p className="text-sm text-slate-200">
                  Validate {validated}. Saltate {skipped}. Non riuscite {failed}.
                </p>
                <ul className="max-h-48 space-y-1 overflow-y-auto text-sm text-slate-300">
                  {outcomes.map((row) => (
                    <li key={row.poiId}>
                      {row.poiName}:{' '}
                      {row.result === 'validated'
                        ? 'validata'
                        : row.result === 'skipped'
                          ? 'saltata'
                          : `non riuscita${row.message ? ` — ${row.message}` : ''}`}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-slate-800 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={requestClose}
              disabled={busy}
              className="min-h-11 rounded-lg border border-slate-700 px-4 text-xs font-bold uppercase text-slate-300"
            >
              Chiudi
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-xs font-bold uppercase text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Valida Wikimedia
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
