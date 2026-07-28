import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Z_MODAL, Z_OVERLAY } from '@/constants/zIndex';
import { createPortal } from 'react-dom';
import { CustomCalendar } from '@/components/common/CustomCalendar';
import { CalendarDays } from 'lucide-react';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import type { Viaggio, ViaggioRicordamiConfig } from '@/types/models/Viaggio';
import {
  computeRicordamiNextYearlyAt,
  getViaggioRicordamiConfig,
  localDateStringToRicordamiIso,
  withViaggioRicordamiConfig,
} from '@/types/models/Viaggio';
import { updateViaggio } from '@/services/viaggio/viaggioService';
import { showGlobalAlert } from '@/services/ui/toastService';

interface RicordamiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  viaggio: Viaggio;
  onUpdated: (v: Viaggio) => void;
}

type ModalTab = 'specific_date' | 'yearly_date';

const pad2 = (n: number) => String(n).padStart(2, '0');

const toYmdLocal = (d: Date): string => {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}-${pad2(m)}-${pad2(day)}`;
};

function formatYmdToHuman(ymd: string | null): string {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-');
  if (!y || !m || !d) return '';
  return `${d}/${m}/${y}`;
}

function parseDdMmYyyy(value: string): { ymd: string; day: number; month: number; year: number } | null {
  const raw = value.trim().replace(/\s+/g, '');
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null;
  if (day < 1 || day > 31) return null;
  if (month < 1 || month > 12) return null;
  // Validate day against month length (handles Feb 29 correctly for the chosen year).
  const maxDay = new Date(year, month, 0).getDate();
  if (day > maxDay) return null;
  const ymd = `${year}-${pad2(month)}-${pad2(day)}`;
  return { ymd, day, month, year };
}

function formatDdMm(fromIso: string): string {
  const d = new Date(fromIso);
  const dd = pad2(d.getDate());
  const mm = pad2(d.getMonth() + 1);
  return `${dd} / ${mm}`;
}

function getMaxDayForYearlyMonth(monthValue: string): number | null {
  const month = Number.parseInt(monthValue, 10);
  if (!Number.isFinite(month) || month < 1 || month > 12) return null;
  if (month === 2) return 29;
  if ([4, 6, 9, 11].includes(month)) return 30;
  return 31;
}

function parsePositiveInteger(value: string): number | null {
  if (value.trim().length === 0) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseSpecificDateInput(value: string): { ymd: string | null; human: string } {
  const human = value;
  if (value.trim().length === 0) {
    return { ymd: null, human };
  }
  const parsed = parseDdMmYyyy(value);
  return { ymd: parsed ? parsed.ymd : null, human };
}

export const RicordamiConfigModal: React.FC<RicordamiConfigModalProps> = ({
  isOpen,
  onClose,
  viaggio,
  onUpdated,
}) => {
  const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
  const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
  const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
  const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
  const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle);
  const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle);

  useGlobalModalEscape(isOpen, onClose);

  const ricordamiConfig = useMemo(() => getViaggioRicordamiConfig(viaggio.metadata), [viaggio.metadata]);

  const defaultTab: ModalTab = ricordamiConfig.mode === 'yearly_date' ? 'yearly_date' : 'specific_date';
  const [tab, setTab] = useState<ModalTab>(defaultTab);

  // Specific date (A)
  const todayYmd = useMemo(() => toYmdLocal(new Date()), []);
  const initialSpecificYmd = useMemo(() => {
    if (ricordamiConfig.mode !== 'custom_date' || !ricordamiConfig.customDateIso) return null;
    const d = new Date(ricordamiConfig.customDateIso);
    return toYmdLocal(d);
  }, [ricordamiConfig]);
  const [specificYmd, setSpecificYmd] = useState<string | null>(initialSpecificYmd);
  const [specificHuman, setSpecificHuman] = useState<string>(() => formatYmdToHuman(initialSpecificYmd));
  const specificAnchorRef = useRef<HTMLDivElement>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Yearly date (B)
  const [yearlyDayInput, setYearlyDayInput] = useState<string>(() =>
    ricordamiConfig.mode === 'yearly_date' ? String(ricordamiConfig.yearlyDay) : '29',
  );
  const [yearlyMonthInput, setYearlyMonthInput] = useState<string>(() =>
    ricordamiConfig.mode === 'yearly_date' ? String(ricordamiConfig.yearlyMonth) : '7',
  );

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setBusy(false);
    setCalendarOpen(false);

    setTab(defaultTab);

    setSpecificYmd(initialSpecificYmd);
    setSpecificHuman(formatYmdToHuman(initialSpecificYmd));

    if (ricordamiConfig.mode === 'yearly_date') {
      setYearlyDayInput(String(ricordamiConfig.yearlyDay));
      setYearlyMonthInput(String(ricordamiConfig.yearlyMonth));
    } else {
      setYearlyDayInput('29');
      setYearlyMonthInput('7');
    }
  }, [isOpen, defaultTab, initialSpecificYmd, ricordamiConfig]);

  const yearlyDay = useMemo(() => parsePositiveInteger(yearlyDayInput), [yearlyDayInput]);
  const yearlyMonth = useMemo(() => parsePositiveInteger(yearlyMonthInput), [yearlyMonthInput]);
  const yearlyMaxDay = useMemo(
    () => getMaxDayForYearlyMonth(yearlyMonthInput),
    [yearlyMonthInput],
  );
  const yearlyCombinationValid =
    yearlyDay != null &&
    yearlyMonth != null &&
    yearlyMonth >= 1 &&
    yearlyMonth <= 12 &&
    yearlyMaxDay != null &&
    yearlyDay >= 1 &&
    yearlyDay <= yearlyMaxDay;

  const specificIso = useMemo(() => {
    if (!specificYmd) return null;
    return localDateStringToRicordamiIso(specificYmd);
  }, [specificYmd]);

  const yearlyNextAtIso = useMemo(() => {
    if (!yearlyCombinationValid || yearlyDay == null || yearlyMonth == null) return null;
    return computeRicordamiNextYearlyAt(new Date(), yearlyDay, yearlyMonth);
  }, [yearlyCombinationValid, yearlyDay, yearlyMonth]);

  const canSaveSpecific =
    tab === 'specific_date' &&
    Boolean(specificIso) &&
    // Strictly block past dates for UX coherence with one-shot scheduling.
    (() => {
      if (!specificIso) return false;
      const ms = new Date(specificIso).getTime();
      return Number.isFinite(ms) && ms > Date.now();
    })();

  const canSaveYearly =
    tab === 'yearly_date' &&
    yearlyCombinationValid &&
    Boolean(yearlyNextAtIso);

  const selectedSummary = useMemo(() => {
    if (tab === 'specific_date') {
      return specificIso
        ? `Prossimo promemoria: ${new Date(specificIso).toLocaleDateString('it-IT')}`
        : 'Scegli una data';
    }
    return yearlyNextAtIso
      ? `Prossimo promemoria: ${formatDdMm(yearlyNextAtIso)}`
      : 'Scegli giorno/mese';
  }, [tab, specificIso, yearlyNextAtIso]);

  const saveDisabledReason = useMemo(() => {
    if (busy) return null;
    if (tab === 'specific_date') {
      if (specificHuman.trim().length === 0) return 'Inserisci o seleziona una data.';
      if (!specificIso) return 'La data deve essere valida nel formato gg/mm/aaaa.';
      return canSaveSpecific ? null : 'La data deve essere futura.';
    }
    if (yearlyDayInput.trim().length === 0 || yearlyMonthInput.trim().length === 0) {
      return 'Inserisci giorno e mese.';
    }
    return canSaveYearly ? null : 'La combinazione giorno/mese non e valida.';
  }, [
    busy,
    tab,
    specificHuman,
    specificIso,
    canSaveSpecific,
    yearlyDayInput,
    yearlyMonthInput,
    canSaveYearly,
  ]);

  if (!isOpen) return null;

  const onSave = async () => {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      if (tab === 'specific_date') {
        if (!specificIso) throw new Error('Data non valida');
        const chosenMs = new Date(specificIso).getTime();
        if (!Number.isFinite(chosenMs) || chosenMs <= Date.now()) {
          throw new Error('La data deve essere futura');
        }
        const config: ViaggioRicordamiConfig = {
          mode: 'custom_date',
          customDateIso: specificIso,
        };
        const updated = await updateViaggio(viaggio.id, {
          ricordamiEnabled: true,
          ricordamiNextAt: specificIso,
          metadata: withViaggioRicordamiConfig(viaggio.metadata, config),
        });
        onUpdated(updated);
        onClose();
        return;
      }

      if (tab === 'yearly_date') {
        if (!yearlyNextAtIso || yearlyDay == null || yearlyMonth == null) {
          throw new Error('Data annuale non valida');
        }
        const config: ViaggioRicordamiConfig = {
          mode: 'yearly_date',
          yearlyDay,
          yearlyMonth,
        };
        const updated = await updateViaggio(viaggio.id, {
          ricordamiEnabled: true,
          ricordamiNextAt: yearlyNextAtIso,
          metadata: withViaggioRicordamiConfig(viaggio.metadata, config),
        });
        onUpdated(updated);
        onClose();
        return;
      }
    } catch (e) {
      console.error('[RicordamiConfigModal] save failed', e);
      setError('Salvataggio non riuscito. Riprova.');
      showGlobalAlert('Salvataggio non riuscito. Riprova.');
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div
      className={`td-modal-overlay ${overlayShell}`}
      onClick={onClose}
      style={{ zIndex: Z_OVERLAY }}
      role="presentation"
    >
      <div
        className={`${containerShell} max-w-md outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 border-emerald-500/30`}
        style={{ zIndex: Z_MODAL }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ricordami-config-title"
      >
        <div className={`${bodyShell} p-5 md:p-6 flex flex-col gap-4`} style={{ minHeight: 0 }}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 id="ricordami-config-title" className={`${modalTitleShell} mb-1`}>
                Configura Ricordami
              </h3>
              <p className={`${modalSubtitleShell} text-slate-400 text-sm leading-relaxed`}>
                Definisci se il promemoria deve essere “in una data specifica” oppure “ogni anno”.
              </p>
            </div>
            <CloseButton
              onClose={onClose}
              variant="primary"
              position="absolute"
              className={closeOffsetShell}
              withEscape={false}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setTab('specific_date')}
              className={`flex-1 rounded-xl border px-3 py-2 text-left ${
                tab === 'specific_date'
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:bg-slate-900/60'
              }`}
            >
              Ricorda il
            </button>
            <button
              type="button"
              onClick={() => setTab('yearly_date')}
              className={`flex-1 rounded-xl border px-3 py-2 text-left ${
                tab === 'yearly_date'
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:bg-slate-900/60'
              }`}
            >
              Ricorda ogni anno il
            </button>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
            <div className="text-xs text-slate-400 mb-3">{selectedSummary}</div>

            {tab === 'specific_date' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                      Data (gg/mm/aaaa)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="29/07/2026"
                      value={specificHuman}
                      onChange={(e) => {
                        const parsed = parseSpecificDateInput(e.target.value);
                        setSpecificHuman(parsed.human);
                        setSpecificYmd(parsed.ymd);
                      }}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      aria-label="Data personalizzata Ricordami"
                      autoComplete="off"
                      disabled={busy}
                    />
                  </div>

                  <div className="shrink-0">
                    <div ref={specificAnchorRef} className="relative">
                      <button
                        type="button"
                        onClick={() => setCalendarOpen((v) => !v)}
                        disabled={busy}
                        className="rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-2 hover:bg-slate-900/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
                        aria-label="Apri calendario"
                        title="Apri calendario"
                      >
                        <CalendarDays className="w-4 h-4 text-slate-200" aria-hidden />
                      </button>
                      <CustomCalendar
                        isOpen={calendarOpen}
                        value={specificYmd}
                        minDateStr={todayYmd}
                        onChange={(dateYmd) => {
                          setSpecificYmd(dateYmd);
                          setSpecificHuman(formatYmdToHuman(dateYmd));
                        }}
                        onClose={() => setCalendarOpen(false)}
                        anchorRef={specificAnchorRef}
                      />
                    </div>
                  </div>
                </div>

                {specificIso && (
                  <div className="text-[12px] text-slate-400">
                    {new Date(specificIso).toLocaleDateString('it-IT')}
                  </div>
                )}
              </div>
            )}

            {tab === 'yearly_date' && (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                      Giorno (gg)
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={yearlyMaxDay ?? 31}
                      value={yearlyDayInput}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        if (!/^\d*$/.test(nextValue)) return;
                        setYearlyDayInput(nextValue);
                      }}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      placeholder="29"
                      disabled={busy}
                      aria-label="Giorno annuale Ricordami"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                      Mese (mm)
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={12}
                      value={yearlyMonthInput}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        if (!/^\d*$/.test(nextValue)) return;
                        setYearlyMonthInput(nextValue);
                      }}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      placeholder="7"
                      disabled={busy}
                      aria-label="Mese annuale Ricordami"
                    />
                  </div>
                </div>

                {!yearlyCombinationValid && yearlyDayInput.trim().length > 0 && yearlyMonthInput.trim().length > 0 && (
                  <div className="text-[12px] text-rose-400">
                    Combinazione giorno/mese non valida.
                  </div>
                )}

                <div className="text-[12px] text-slate-400">
                  {yearlyDay != null && yearlyMonth != null && yearlyCombinationValid
                    ? `Ogni anno il ${pad2(yearlyDay)} / ${pad2(yearlyMonth)}`
                    : 'Inserisci giorno e mese'}
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-rose-400">{error}</p>}
          {!error && saveDisabledReason && (
            <p className="text-sm text-slate-400">{saveDisabledReason}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors disabled:opacity-60"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={() => void onSave()}
              disabled={busy || !(canSaveSpecific || canSaveYearly)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-emerald-900/20 disabled:opacity-60"
            >
              {busy ? 'Salvataggio...' : 'Salva'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

