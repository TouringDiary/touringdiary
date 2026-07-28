import React, { useMemo, useState } from 'react';
import { Bell, BellOff, ChevronDown, Loader2 } from 'lucide-react';
import { updateViaggio } from '@/services/viaggio/viaggioService';
import type { Viaggio } from '@/types/models/Viaggio';
import {
  getViaggioRicordamiConfig,
  normalizeRicordamiIntervalMonths,
  RICORDAMI_MAX_INTERVAL_MONTHS,
  withViaggioRicordamiConfig,
} from '@/types/models/Viaggio';
import { showGlobalAlert } from '@/services/ui/toastService';
import { RicordamiConfigModal } from './RicordamiConfigModal';

interface Props {
  viaggio: Viaggio;
  /** Gate CC feature.comms.notifications */
  notificationsSiteEnabled: boolean;
  onUpdated: (v: Viaggio) => void;
  /** Compact: riga catalogo (senza testi di aiuto). */
  compact?: boolean;
}

/**
 * Ricordami questo viaggio — catalogo «I miei Viaggi» (DOC 35 §6.5).
 * Autosave immediato; UI sospesa se CC ha disabilitato le notifiche globali.
 */
export const ViaggioRicordamiControl: React.FC<Props> = ({
  viaggio,
  notificationsSiteEnabled,
  onUpdated,
  compact = false,
}) => {
  const [busy, setBusy] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const suspended = viaggio.ricordamiEnabled && !notificationsSiteEnabled;
  const lockedOff = !notificationsSiteEnabled && !viaggio.ricordamiEnabled;
  const ricordamiConfig = useMemo(
    () => getViaggioRicordamiConfig(viaggio.metadata),
    [viaggio.metadata],
  );
  const intervalMonths = normalizeRicordamiIntervalMonths(viaggio.ricordamiIntervalMonths);

  const persist = async (patch: {
    ricordamiEnabled?: boolean;
    ricordamiIntervalMonths?: number;
    ricordamiNextAt?: string | null;
    metadata?: Record<string, unknown>;
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
    // Toggle = SOLO enable/disable. La configurazione resta invariata.
    void persist({ ricordamiEnabled: !viaggio.ricordamiEnabled });
  };

  const persistIntervalMonths = (months: number) => {
    if (!viaggio.ricordamiEnabled || suspended || busy) return;
    const normalized = normalizeRicordamiIntervalMonths(months);
    void persist({
      ricordamiIntervalMonths: normalized,
      metadata: withViaggioRicordamiConfig(viaggio.metadata, { mode: 'interval' }),
    });
  };

  const title =
    suspended
      ? 'Le notifiche del sito sono temporaneamente disabilitate dall’amministrazione.'
      : lockedOff
        ? 'Notifiche sito disabilitate: non puoi attivare Ricordami.'
        : 'Ricordami questo viaggio';

  const pad2 = (n: number) => String(n).padStart(2, '0');
  const formatCustomDate = (customDateIso: string | null): string => {
    if (!customDateIso) return '';
    return new Date(customDateIso).toLocaleDateString('it-IT');
  };
  const formatYearlyDate = (day: number, month: number, withSpaces = false): string => {
    const separator = withSpaces ? ' / ' : '/';
    return `${pad2(day)}${separator}${pad2(month)}`;
  };
  const customModeLabel = useMemo(() => {
    if (ricordamiConfig.mode === 'custom_date' && ricordamiConfig.customDateIso) {
      return formatCustomDate(ricordamiConfig.customDateIso);
    }
    if (ricordamiConfig.mode === 'yearly_date') {
      return formatYearlyDate(ricordamiConfig.yearlyDay, ricordamiConfig.yearlyMonth);
    }
    return '';
  }, [ricordamiConfig]);
  const customDateValue =
    ricordamiConfig.mode === 'custom_date' && ricordamiConfig.customDateIso
      ? formatCustomDate(ricordamiConfig.customDateIso)
      : '';
  const yearlyValue =
    ricordamiConfig.mode === 'yearly_date'
      ? formatYearlyDate(ricordamiConfig.yearlyDay, ricordamiConfig.yearlyMonth, true)
      : '';
  const wrapperClass = compact
    ? 'rounded-xl border border-slate-700/80 bg-slate-950/85 shadow-[0_8px_20px_rgba(2,6,23,0.28)] backdrop-blur-sm'
    : 'rounded-2xl border border-slate-700/80 bg-slate-950/80 shadow-[0_14px_34px_rgba(2,6,23,0.32)] backdrop-blur-sm';
  const accentClass = suspended
    ? 'border-amber-500/40 bg-amber-950/20'
    : viaggio.ricordamiEnabled
      ? 'border-emerald-500/30 bg-emerald-950/10'
      : 'border-slate-700/80 bg-slate-950/85';
  const selectValue =
    ricordamiConfig.mode === 'interval' ? String(intervalMonths) : 'custom';

  return (
    <div
      className={`shrink-0 self-center ${wrapperClass} ${accentClass}`}
      data-testid="viaggio-ricordami-control"
      title={title}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={`flex items-center ${
          compact ? 'gap-2 px-2 py-1.5' : 'gap-3 px-3 py-2'
        }`}
      >
        <div
          role="switch"
          aria-checked={viaggio.ricordamiEnabled}
          aria-label="Ricordami questo viaggio"
          aria-disabled={busy || lockedOff}
          tabIndex={busy || lockedOff ? -1 : 0}
          onClick={onToggle}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggle();
            }
          }}
          className={`group inline-flex items-center gap-2 rounded-xl border px-2 py-1.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 disabled:opacity-60 ${
            suspended
              ? 'border-amber-500/35 bg-amber-950/30 text-amber-100'
              : viaggio.ricordamiEnabled
                ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-100'
                : 'border-slate-700 bg-slate-900/70 text-slate-300 hover:border-slate-500'
          }`}
        >
          <span
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
              suspended
                ? 'bg-amber-500/35'
                : viaggio.ricordamiEnabled
                  ? 'bg-emerald-500/70'
                  : 'bg-slate-700'
            }`}
            aria-hidden
          >
            <span
              className={`absolute top-0.5 left-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow transition-transform ${
                viaggio.ricordamiEnabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            >
              {busy ? (
                <Loader2 className="h-2.5 w-2.5 animate-spin text-slate-500" />
              ) : viaggio.ricordamiEnabled ? (
                <Bell className="h-2.5 w-2.5 text-emerald-600" />
              ) : (
                <BellOff className="h-2.5 w-2.5 text-slate-400" />
              )}
            </span>
          </span>

          {!compact && (
            <span
              className={`text-[10px] font-black uppercase tracking-[0.18em] leading-none ${
                suspended
                  ? 'text-amber-100'
                  : viaggio.ricordamiEnabled
                    ? 'text-emerald-100'
                    : 'text-slate-400'
              }`}
              aria-hidden
            >
              {viaggio.ricordamiEnabled ? 'ON' : 'OFF'}
            </span>
          )}
        </div>

        <div
          className={`flex shrink-0 items-center gap-1.5 overflow-hidden rounded-xl border px-2 py-1.5 transition-colors ${
            viaggio.ricordamiEnabled && !suspended
              ? 'border-slate-700 bg-slate-900/70'
              : 'border-slate-800 bg-slate-900/40'
          }`}
        >
          <div className="relative">
            <select
              key={`${selectValue}-${isConfigOpen ? 'open' : 'closed'}`}
              value={selectValue}
              disabled={!viaggio.ricordamiEnabled || busy || suspended}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === 'custom') {
                  setIsConfigOpen(true);
                  return;
                }
                const n = Number.parseInt(raw, 10);
                if (Number.isFinite(n)) persistIntervalMonths(n);
              }}
              className={`appearance-none rounded-lg border bg-slate-950 px-2.5 py-1 pr-6 text-[10px] font-black uppercase tracking-[0.16em] outline-none transition-colors ${
                viaggio.ricordamiEnabled && !suspended
                  ? 'border-slate-700 text-slate-100 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20'
                  : 'border-slate-800 text-slate-500'
              }`}
              aria-label="Frequenza Ricordami"
            >
              {Array.from({ length: RICORDAMI_MAX_INTERVAL_MONTHS }, (_, idx) => idx + 1).map(
                (month) => (
                  <option key={month} value={month}>
                    {month} {month === 1 ? 'MESE' : 'MESI'}
                  </option>
                ),
              )}
              <option value="custom">PERSONALIZZATO...</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500"
              aria-hidden
            />
          </div>

          {ricordamiConfig.mode !== 'interval' && (
            <button
              type="button"
              onClick={() => setIsConfigOpen(true)}
              disabled={!viaggio.ricordamiEnabled || busy || suspended}
              className={`inline-flex items-center gap-2 rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors ${
                viaggio.ricordamiEnabled && !suspended
                  ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-100 hover:bg-indigo-500/15'
                  : 'border-slate-800 bg-slate-900/40 text-slate-500'
              }`}
              aria-label="Configura Ricordami"
              title="Configura Ricordami"
            >
              <span>PERSONALIZZATO</span>
              <span className="font-mono normal-case text-[10px] text-indigo-100/90">
                {compact
                  ? customModeLabel
                  : ricordamiConfig.mode === 'custom_date'
                    ? customDateValue
                    : yearlyValue}
              </span>
            </button>
          )}
        </div>
      </div>
      {!compact && suspended && (
        <p className="px-3 pb-2 text-[9px] text-amber-200/90 leading-snug max-w-[16rem]">
          Notifiche sito sospese dall’amministrazione. Preferenza salvata.
        </p>
      )}
      {!compact && viaggio.ricordamiEnabled && !suspended && (
        <p className="px-3 pb-2 text-[9px] text-slate-500 leading-snug max-w-[16rem]">
          {ricordamiConfig.mode === 'interval' ? (
            `Ti ricorderemo di rivivere questo viaggio ogni ${intervalMonths} ${
              intervalMonths === 1 ? 'mese' : 'mesi'
            }.`
          ) : ricordamiConfig.mode === 'custom_date' ? (
            customDateValue ? `Promemoria previsto per il ${customDateValue}.` : 'Scegli una data.'
          ) : (
            `Ogni anno il ${pad2(ricordamiConfig.yearlyDay)} / ${pad2(ricordamiConfig.yearlyMonth)}.`
          )}
        </p>
      )}

      <RicordamiConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        viaggio={viaggio}
        onUpdated={(v) => {
          onUpdated(v);
          setIsConfigOpen(false);
        }}
      />
    </div>
  );
};
