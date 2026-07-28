import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  viaggioTitle: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

/**
 * Eliminazione Viaggio — modale + checkbox consapevolezza (DOC 35 §6.6).
 */
export const MySpaceViaggioDeleteModal: React.FC<Props> = ({
  viaggioTitle,
  onConfirm,
  onCancel,
}) => {
  const [aware, setAware] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    if (!aware || busy) return;
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-labelledby="myspace-delete-viaggio-title"
      data-testid="myspace-viaggio-delete-modal"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-950 p-5 shadow-2xl space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" aria-hidden />
          <div>
            <h3
              id="myspace-delete-viaggio-title"
              className="text-lg font-bold text-white"
            >
              Eliminare «{viaggioTitle || 'Viaggio'}»?
            </h3>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">
              Conferma esplicita richiesta. L’operazione riguarda il patrimonio
              MySpace; le copie Workspace non vengono eliminate.
            </p>
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 cursor-pointer">
          <input
            type="checkbox"
            checked={aware}
            onChange={(e) => setAware(e.target.checked)}
            className="mt-1"
            data-testid="myspace-delete-viaggio-aware"
          />
          <span className="text-xs text-slate-300 leading-relaxed">
            Sono consapevole che verranno eliminati: viaggio, diario, ricordi,
            foto, video, allegati, documenti e tutti i dati collegati al viaggio.
          </span>
        </label>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-300 hover:bg-slate-800"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={!aware || busy}
            className="px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-rose-600 text-white disabled:opacity-40 hover:bg-rose-500"
            data-testid="myspace-delete-viaggio-confirm"
          >
            {busy ? 'Eliminazione…' : 'Elimina definitivamente'}
          </button>
        </div>
      </div>
    </div>
  );
};
