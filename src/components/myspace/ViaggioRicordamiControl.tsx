import React, { useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { updateViaggio } from '@/services/viaggio/viaggioService';
import type { Viaggio } from '@/types/models/Viaggio';
import { RICORDAMI_DEFAULT_INTERVAL_MONTHS } from '@/types/models/Viaggio';
import { showGlobalAlert } from '@/services/ui/toastService';

interface Props {
  viaggio: Viaggio;
  /** Gate CC feature.comms.notifications */
  notificationsSiteEnabled: boolean;
  onUpdated: (v: Viaggio) => void;
}

/**
 * Ricordami questo viaggio — chrome cartella (DOC 35 §6.5).
 * Autosave immediato; UI sospesa se CC ha disabilitato le notifiche globali.
 */
export const ViaggioRicordamiControl: React.FC<Props> = ({
  viaggio,
  notificationsSiteEnabled,
  onUpdated,
}) => {
  const [busy, setBusy] = useState(false);
  const suspended = viaggio.ricordamiEnabled && !notificationsSiteEnabled;
  const lockedOff = !notificationsSiteEnabled && !viaggio.ricordamiEnabled;
  const canToggleOn = notificationsSiteEnabled;

  const persist = async (patch: {
    ricordamiEnabled?: boolean;
    ricordamiIntervalMonths?: number;
  }) => {
    if (busy) return;
    setBusy(true);
    try {
      const updated = await updateViaggio(viaggio.id, patch);
      onUpdated(updated);
    } catch (e) {
      console.error('[ViaggioRicordamiControl] update failed', e);
      showGlobalAlert('Salvataggio Ricordami non riuscito. Riprova.');
    } finally {
      setBusy(false);
    }
  };

  const onToggle = () => {
    if (busy) return;
    if (lockedOff) return;
    // Sospeso: si può solo spegnere (preferenza resta finché non lo fa l'utente).
    if (suspended && viaggio.ricordamiEnabled) {
      void persist({ ricordamiEnabled: false });
      return;
    }
    if (suspended) return;
    if (!viaggio.ricordamiEnabled && !canToggleOn) return;
    void persist({
      ricordamiEnabled: !viaggio.ricordamiEnabled,
      ricordamiIntervalMonths:
        Number.isFinite(viaggio.ricordamiIntervalMonths) &&
        viaggio.ricordamiIntervalMonths >= 1
          ? viaggio.ricordamiIntervalMonths
          : RICORDAMI_DEFAULT_INTERVAL_MONTHS,
    });
  };

  const onMonthsChange = (raw: string) => {
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 1 || n > 120) return;
    if (!viaggio.ricordamiEnabled || suspended || busy) return;
    void persist({ ricordamiIntervalMonths: n });
  };

  return (
    <div
      className={`shrink-0 rounded-lg border px-2.5 py-1.5 ${
        suspended
          ? 'border-amber-500/40 bg-amber-950/30'
          : 'border-slate-700 bg-slate-900/70'
      }`}
      data-testid="viaggio-ricordami-control"
      title={
        suspended
          ? 'Le notifiche del sito sono temporaneamente disabilitate dall’amministrazione.'
          : lockedOff
            ? 'Notifiche sito disabilitate: non puoi attivare Ricordami.'
            : 'Ricordami questo viaggio'
      }
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={viaggio.ricordamiEnabled}
          disabled={busy || lockedOff}
          onClick={onToggle}
          className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${
            suspended
              ? 'text-amber-200'
              : viaggio.ricordamiEnabled
                ? 'text-emerald-300'
                : 'text-slate-400'
          } disabled:opacity-60`}
        >
          {viaggio.ricordamiEnabled ? (
            <Bell className="w-3.5 h-3.5" aria-hidden />
          ) : (
            <BellOff className="w-3.5 h-3.5" aria-hidden />
          )}
          Ricordami
        </button>

        {viaggio.ricordamiEnabled && (
          <label className="inline-flex items-center gap-1 text-[10px] text-slate-400">
            Ogni
            <input
              type="number"
              min={1}
              max={120}
              value={viaggio.ricordamiIntervalMonths}
              disabled={busy || suspended}
              onChange={(e) => onMonthsChange(e.target.value)}
              className="w-10 rounded border border-slate-700 bg-slate-950 px-1 py-0.5 text-center text-slate-200 disabled:opacity-50"
              aria-label="Intervallo mesi Ricordami"
            />
            mesi
          </label>
        )}
      </div>
      {suspended && (
        <p className="mt-1 text-[9px] text-amber-200/90 leading-snug max-w-[14rem]">
          Notifiche sito sospese dall’amministrazione. Preferenza salvata.
        </p>
      )}
      {viaggio.ricordamiEnabled && !suspended && (
        <p className="mt-1 text-[9px] text-slate-500 leading-snug max-w-[14rem]">
          Ti ricorderemo di rivivere questo viaggio ogni{' '}
          {viaggio.ricordamiIntervalMonths} mesi.
        </p>
      )}
    </div>
  );
};
