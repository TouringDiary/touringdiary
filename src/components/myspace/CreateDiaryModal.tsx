import { BookOpen } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_MODAL, Z_OVERLAY } from '@/constants/zIndex';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { listViaggiByUser } from '@/services/viaggio/viaggioService';
import type { Viaggio } from '@/types/models/Viaggio';
import type { CreateDiaryInput, ViaggioAssociationChoice } from '@/types/resourceAssociation';
import { ViaggioAssociationFields } from './ViaggioAssociationFields';

export type CreateDiaryModalContext = 'viaggio-detail' | 'tools';

export interface CreateDiaryModalResult {
  input: CreateDiaryInput;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (result: CreateDiaryModalResult) => void | Promise<void>;
  userId: string;
  context: CreateDiaryModalContext;
  fixedViaggioId?: string;
  fixedViaggioTitle?: string;
  defaultName?: string;
  defaultStartDate?: string;
  defaultEndDate?: string;
  busy?: boolean;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Local calendar date YYYY-MM-DD (not UTC) for `<input type="date">` defaults. */
const todayIso = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
};

export const CreateDiaryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  userId,
  context,
  fixedViaggioId,
  fixedViaggioTitle,
  defaultName = '',
  defaultStartDate,
  defaultEndDate,
  busy,
}) => {
  const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
  const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
  const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
  const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
  const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle);
  const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle);

  const [name, setName] = useState(defaultName);
  const [startDate, setStartDate] = useState(defaultStartDate ?? todayIso());
  const [endDate, setEndDate] = useState(defaultEndDate ?? defaultStartDate ?? todayIso());
  const [viaggioChoice, setViaggioChoice] = useState<ViaggioAssociationChoice>('none');
  const [existingViaggioId, setExistingViaggioId] = useState('');
  const [viaggi, setViaggi] = useState<Viaggio[]>([]);
  const [viaggiLoading, setViaggiLoading] = useState(false);

  useGlobalModalEscape(isOpen && !busy, onClose);

  useEffect(() => {
    if (!isOpen) return;
    setName(defaultName);
    setStartDate(defaultStartDate ?? todayIso());
    setEndDate(defaultEndDate ?? defaultStartDate ?? todayIso());
    setViaggioChoice(context === 'tools' ? 'none' : 'existing');
    setExistingViaggioId('');
  }, [isOpen, defaultName, defaultStartDate, defaultEndDate, context]);

  useEffect(() => {
    if (!isOpen || context !== 'tools') return;
    let cancelled = false;
    setViaggiLoading(true);
    setViaggi([]);
    void listViaggiByUser(userId)
      .then((rows) => {
        if (!cancelled) setViaggi(rows);
      })
      .catch((e) => {
        console.error('[CreateDiaryModal] listViaggiByUser failed', e);
        if (!cancelled) setViaggi([]);
      })
      .finally(() => {
        if (!cancelled) setViaggiLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, context, userId]);

  const isViaggioValid =
    context === 'viaggio-detail' || viaggioChoice !== 'existing' || Boolean(existingViaggioId);
  const isFormValid =
    Boolean(name.trim()) &&
    Boolean(startDate) &&
    Boolean(endDate) &&
    endDate >= startDate &&
    isViaggioValid;

  const handleSubmit = useCallback(async () => {
    if (!isFormValid || busy) return;

    const trimmed = name.trim();
    const input: CreateDiaryInput = {
      userId,
      name: trimmed,
      startDate,
      endDate,
      viaggioChoice: context === 'viaggio-detail' ? 'existing' : viaggioChoice,
      existingViaggioId: context === 'tools' ? existingViaggioId : undefined,
      fixedViaggioId: context === 'viaggio-detail' ? fixedViaggioId : undefined,
    };
    await onConfirm({ input });
  }, [
    isFormValid,
    busy,
    name,
    startDate,
    endDate,
    viaggioChoice,
    existingViaggioId,
    context,
    userId,
    fixedViaggioId,
    onConfirm,
  ]);

  if (!isOpen) return null;

  const subtitle =
    context === 'viaggio-detail'
      ? `Il nuovo Diario sarà associato al Viaggio «${fixedViaggioTitle || 'corrente'}».`
      : 'Crea un nuovo Diario di viaggio.';

  return createPortal(
    <div
      className={`td-modal-overlay ${overlayShell}`}
      style={{ zIndex: Z_OVERLAY }}
      role="presentation"
    >
      {/* Backdrop dismiss: sibling control (never onClick on td-modal-overlay). Hidden while busy. */}
      {!busy ? (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Chiudi"
          className="absolute inset-0 h-full w-full cursor-default border-0 bg-transparent p-0"
          onClick={onClose}
        />
      ) : null}
      <div
        className={`relative ${containerShell} max-w-md outline-none`}
        style={{ zIndex: Z_MODAL }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-diary-title"
        aria-describedby="create-diary-desc"
      >
        <CloseButton
          onClose={onClose}
          variant="primary"
          position="absolute"
          withEscape={false}
          className={`${closeOffsetShell} z-local-overlay`}
        />
        <div className={`${bodyShell} min-h-0`}>
          <div className="flex items-center gap-3 mb-4 pr-10">
            <div className="p-2 bg-indigo-600 rounded-lg shrink-0">
              <BookOpen className="w-6 h-6 text-white" aria-hidden />
            </div>
            <div>
              <h3 id="create-diary-title" className={modalTitleShell}>
                Nuovo Diario
              </h3>
              <p id="create-diary-desc" className={`${modalSubtitleShell} mt-1`}>
                {subtitle}
              </p>
            </div>
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit();
            }}
          >
            <div className="space-y-2">
              <label
                htmlFor="create-diary-name"
                className="text-xs font-bold uppercase text-slate-500"
              >
                Nome Diario
              </label>
              <input
                id="create-diary-name"
                autoFocus
                type="text"
                autoComplete="off"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={busy}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 focus:outline-none"
                placeholder="Es. Tour Napoli"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="create-diary-start"
                  className="text-xs font-bold uppercase text-slate-500"
                >
                  Data dal
                </label>
                <input
                  id="create-diary-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={busy}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="create-diary-end"
                  className="text-xs font-bold uppercase text-slate-500"
                >
                  Data al
                </label>
                <input
                  id="create-diary-end"
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={busy}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <ViaggioAssociationFields
              choice={viaggioChoice}
              onChoiceChange={setViaggioChoice}
              existingViaggioId={existingViaggioId}
              onExistingViaggioIdChange={setExistingViaggioId}
              viaggi={viaggi}
              hidden={context === 'viaggio-detail'}
              disabled={busy}
              loading={viaggiLoading}
            />

            <button
              type="submit"
              disabled={busy || !isFormValid}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? 'Creazione…' : 'Crea e apri Diario'}
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
};
