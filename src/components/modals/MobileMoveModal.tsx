import { ArrowRightLeft, Calendar, CheckCircle, Clock, RefreshCw } from 'lucide-react';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_MODAL, Z_OVERLAY } from '@/constants/zIndex';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import type { ItineraryItem } from '../../types/index';

interface MobileMoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dayIndex: number, time: string, forceSwap?: boolean) => void;
  item: ItineraryItem;
  days: Date[];
  allItems: ItineraryItem[];
}

const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }
  return slots;
})();

export const MobileMoveModal = ({
  isOpen,
  onClose,
  onConfirm,
  item,
  days,
  allItems,
}: MobileMoveModalProps) => {
  const [selectedDay, setSelectedDay] = useState<number>(item.dayIndex);
  const [selectedTime, setSelectedTime] = useState<string>(item.timeSlotStr);

  const isMobile = useMobileDetect();
  const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
  const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
  const headerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalHeader);
  const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
  const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
  const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);
  const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle, isMobile);

  // Sync on open / real slot changes — not on parent object identity churn.
  useEffect(() => {
    if (!isOpen) return;
    setSelectedDay(item.dayIndex);
    setSelectedTime(item.timeSlotStr);
  }, [isOpen, item.dayIndex, item.timeSlotStr]);

  useGlobalModalEscape(isOpen, onClose);

  /** Slot occupati del giorno selezionato (escluso l'item corrente), O(N) una volta. */
  const occupiedSlots = useMemo(() => {
    const occupied = new Set<string>();
    for (const i of allItems) {
      if (i.dayIndex === selectedDay && i.id !== item.id) {
        occupied.add(i.timeSlotStr);
      }
    }
    return occupied;
  }, [allItems, selectedDay, item.id]);

  const isTargetOccupied = occupiedSlots.has(selectedTime);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(selectedDay, selectedTime, isTargetOccupied);
    onClose();
  };

  return createPortal(
    <div
      className={`td-modal-overlay ${overlayShell}`}
      style={{ zIndex: Z_OVERLAY }}
      role="presentation"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full cursor-default border-0 bg-transparent p-0"
        onClick={onClose}
      />
      <div
        className={`${containerShell} max-w-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900`}
        style={{ zIndex: Z_MODAL }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-move-title"
        aria-describedby="mobile-move-desc"
      >
        <CloseButton
          onClose={onClose}
          variant="primary"
          position="absolute"
          className={`${closeOffsetShell} z-local-overlay`}
        />

        <header className={headerShell}>
          <div className="flex items-center gap-3 pr-10 min-w-0">
            <div className="p-2 bg-indigo-900/30 rounded-lg border border-indigo-500/30 shrink-0">
              <ArrowRightLeft className="w-5 h-5 text-indigo-400" aria-hidden />
            </div>
            <div className="min-w-0">
              <h3 id="mobile-move-title" className={`${modalTitleShell} leading-none`}>
                Sposta Tappa
              </h3>
              <p id="mobile-move-desc" className={`${modalSubtitleShell} mt-1 truncate`}>
                {item.poi.name}
              </p>
            </div>
          </div>
        </header>

        <div className={`${bodyShell} space-y-6 min-h-0`}>
          <div className="space-y-2">
            <label
              htmlFor="fld-modals-mobilemovemodal-tsx-l110"
              className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5 ml-1"
            >
              <Calendar className="w-3.5 h-3.5" /> Seleziona Giorno
            </label>
            <select
              id="fld-modals-mobilemovemodal-tsx-l110"
              value={selectedDay}
              onChange={(e) => setSelectedDay(parseInt(e.target.value, 10))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white focus:border-indigo-500 outline-none text-base appearance-none shadow-inner cursor-pointer"
            >
              {days.map((d, idx) => (
                <option key={idx} value={idx}>
                  Giorno {idx + 1} -{' '}
                  {d.toLocaleDateString('it-IT', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="fld-modals-mobilemovemodal-tsx-l132"
              className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5 ml-1"
            >
              <Clock className="w-3.5 h-3.5" /> Seleziona Orario
            </label>
            <select
              id="fld-modals-mobilemovemodal-tsx-l132"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className={`w-full bg-slate-950 border rounded-xl p-4 text-base appearance-none font-mono shadow-inner cursor-pointer outline-none ${isTargetOccupied ? 'border-amber-500 text-amber-500 font-bold' : 'border-slate-700 text-white focus:border-indigo-500'}`}
            >
              {TIME_SLOTS.map((t) => {
                const isOccupied = occupiedSlots.has(t);

                return (
                  <option
                    key={t}
                    value={t}
                    className={isOccupied ? 'text-amber-500 bg-slate-900 font-bold' : 'text-white'}
                  >
                    {t} {isOccupied ? '(Occupato - Scambia)' : ''}
                  </option>
                );
              })}
            </select>
            {isTargetOccupied && (
              <p className="text-[10px] text-amber-500 font-bold ml-1 animate-pulse">
                Attenzione: Orario occupato. Conferma per invertire le tappe.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className={`w-full text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 text-sm uppercase tracking-widest mt-4 ${isTargetOccupied ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20'}`}
          >
            {isTargetOccupied ? (
              <RefreshCw className="w-5 h-5" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            {isTargetOccupied ? 'Conferma e Inverti' : 'Conferma Spostamento'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
