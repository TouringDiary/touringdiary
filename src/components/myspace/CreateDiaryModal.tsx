import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen } from 'lucide-react';
import { Z_MODAL, Z_OVERLAY } from '@/constants/zIndex';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import type { Viaggio } from '@/types/models/Viaggio';
import type { ViaggioAssociationChoice, CreateDiaryInput } from '@/types/resourceAssociation';
import { ViaggioAssociationFields } from './ViaggioAssociationFields';
import { listViaggiByUser } from '@/services/viaggio/viaggioService';

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

const todayIso = () => new Date().toISOString().slice(0, 10);

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

  const handleSubmit = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed || !startDate || !endDate) return;
    if (endDate < startDate) return;
    if (viaggioChoice === 'existing' && !existingViaggioId && context === 'tools') return;

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
      className={`td-modal-overlay ${overlayShell} !items-center`}
      onClick={busy ? undefined : onClose}
      style={{ zIndex: Z_OVERLAY }}
    >
      <div
        className={`${containerShell} max-w-md outline-none`}
        style={{ zIndex: Z_MODAL }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-diary-title"
        aria-describedby="create-diary-desc"
      >
        <CloseButton
          onClose={onClose}
          variant="primary"
          position="absolute"
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

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="create-diary-name" className="text-xs font-bold uppercase text-slate-500">
                Nome Diario
              </label>
              <input
                id="create-diary-name"
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={busy}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 focus:outline-none"
                placeholder="Es. Tour Napoli"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label htmlFor="create-diary-start" className="text-xs font-bold uppercase text-slate-500">
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
                <label htmlFor="create-diary-end" className="text-xs font-bold uppercase text-slate-500">
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
              type="button"
              disabled={busy || !name.trim() || endDate < startDate}
              onClick={() => void handleSubmit()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg disabled:opacity-50"
            >
              {busy ? 'Creazione…' : 'Crea e apri Diario'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
