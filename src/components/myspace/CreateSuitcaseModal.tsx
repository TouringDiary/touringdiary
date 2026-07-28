import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Briefcase } from 'lucide-react';
import { Z_MODAL, Z_OVERLAY } from '@/constants/zIndex';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import type { Viaggio } from '@/types/models/Viaggio';
import type { ViaggioAssociationChoice, CreateSuitcaseInput } from '@/types/resourceAssociation';
import { ViaggioAssociationFields } from './ViaggioAssociationFields';
import { listViaggiByUser } from '@/services/viaggio/viaggioService';

export type CreateSuitcaseModalContext = 'viaggio-detail' | 'tools';

export interface CreateSuitcaseModalResult {
  input: CreateSuitcaseInput;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (result: CreateSuitcaseModalResult) => void | Promise<void>;
  userId: string;
  context: CreateSuitcaseModalContext;
  fixedViaggioId?: string;
  fixedViaggioTitle?: string;
  defaultName?: string;
  busy?: boolean;
}

export const CreateSuitcaseModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  userId,
  context,
  fixedViaggioId,
  fixedViaggioTitle,
  defaultName = '',
  busy,
}) => {
  const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
  const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
  const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
  const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
  const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle);
  const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle);

  const [name, setName] = useState(defaultName);
  const [viaggioChoice, setViaggioChoice] = useState<ViaggioAssociationChoice>('none');
  const [existingViaggioId, setExistingViaggioId] = useState('');
  const [viaggi, setViaggi] = useState<Viaggio[]>([]);
  const [viaggiLoading, setViaggiLoading] = useState(false);

  useGlobalModalEscape(isOpen && !busy, onClose);

  useEffect(() => {
    if (!isOpen) return;
    setName(defaultName || 'Nuova valigia');
    setViaggioChoice(context === 'tools' ? 'none' : 'existing');
    setExistingViaggioId('');
  }, [isOpen, defaultName, context]);

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
        console.error('[CreateSuitcaseModal] listViaggiByUser failed', e);
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
    if (!trimmed) return;
    if (viaggioChoice === 'existing' && !existingViaggioId && context === 'tools') return;

    const input: CreateSuitcaseInput = {
      userId,
      name: trimmed,
      viaggioChoice: context === 'viaggio-detail' ? 'existing' : viaggioChoice,
      existingViaggioId: context === 'tools' ? existingViaggioId : undefined,
      fixedViaggioId: context === 'viaggio-detail' ? fixedViaggioId : undefined,
    };
    await onConfirm({ input });
  }, [name, viaggioChoice, existingViaggioId, context, userId, fixedViaggioId, onConfirm]);

  if (!isOpen) return null;

  const subtitle =
    context === 'viaggio-detail'
      ? `La nuova Valigia sarà associata al Viaggio «${fixedViaggioTitle || 'corrente'}».`
      : 'Crea una nuova valigia personale.';

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
        aria-labelledby="create-suitcase-title"
        aria-describedby="create-suitcase-desc"
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
              <Briefcase className="w-6 h-6 text-white" aria-hidden />
            </div>
            <div>
              <h3 id="create-suitcase-title" className={modalTitleShell}>
                Nuova Valigia
              </h3>
              <p id="create-suitcase-desc" className={`${modalSubtitleShell} mt-1`}>
                {subtitle}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="create-suitcase-name" className="text-xs font-bold uppercase text-slate-500">
                Nome Valigia
              </label>
              <input
                id="create-suitcase-name"
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={busy}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 focus:outline-none"
              />
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
              disabled={busy || !name.trim()}
              onClick={() => void handleSubmit()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg disabled:opacity-50"
            >
              {busy ? 'Creazione…' : 'Crea e apri Valigia'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
