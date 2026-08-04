import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Save, AlertTriangle } from 'lucide-react';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { useSystemMessage } from '../../hooks/useSystemMessage';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
import type { ViaggioAssociationChoice, SaveAsViaggioOptions } from '@/types/resourceAssociation';
import { ViaggioAssociationFields } from '@/components/myspace/ViaggioAssociationFields';
import { listViaggiByUser } from '@/services/viaggio/viaggioService';
import type { Viaggio } from '@/types/models/Viaggio';

export interface SaveAsConfirmPayload {
  name: string;
  viaggio?: SaveAsViaggioOptions;
}

interface SaveAsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: SaveAsConfirmPayload) => void;
  currentName: string;
  /** Abilita scelta associazione Viaggio (DOC 35 §9.6 / §9.8). */
  showViaggioAssociation?: boolean;
  userId?: string | null;
  resourceLabel?: string;
}

export const SaveAsModal = ({
  isOpen,
  onClose,
  onConfirm,
  currentName,
  showViaggioAssociation = false,
  userId,
  resourceLabel = 'progetto',
}: SaveAsModalProps) => {
  const [name, setName] = useState(currentName);
  const [showConfirm, setShowConfirm] = useState(false);
  const [viaggioChoice, setViaggioChoice] = useState<ViaggioAssociationChoice>('none');
  const [existingViaggioId, setExistingViaggioId] = useState('');
  const [viaggi, setViaggi] = useState<Viaggio[]>([]);

  const { getText } = useSystemMessage('modal_save_as');
  const msg = getText();

  const isMobile = useMobileDetect();
  const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
  const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
  const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
  const footerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalFooter);
  const footerActionsShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalFooterActions);
  const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
  const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);
  const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle, isMobile);
  const btnPrimaryShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.btnPrimary, isMobile);
  const btnCancelShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.btnCancel, isMobile);

  useGlobalModalEscape(isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setShowConfirm(false);
      setViaggioChoice('none');
      setExistingViaggioId('');
    }
  }, [isOpen, currentName]);

  useEffect(() => {
    if (!isOpen || !showViaggioAssociation || !userId) return;
    let cancelled = false;
    void listViaggiByUser(userId).then((rows) => {
      if (!cancelled) setViaggi(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, showViaggioAssociation, userId]);

  if (!isOpen) return null;

  const buildPayload = (): SaveAsConfirmPayload => ({
    name,
    viaggio: showViaggioAssociation
      ? {
          viaggioChoice,
          existingViaggioId: viaggioChoice === 'existing' ? existingViaggioId : null,
        }
      : undefined,
  });

  const handleSaveClick = () => {
    if (!name.trim()) return;
    if (showViaggioAssociation && viaggioChoice === 'existing' && !existingViaggioId) return;

    if (name === currentName) {
      setShowConfirm(true);
    } else {
      onConfirm(buildPayload());
    }
  };

  return createPortal(
    <div
      className={`td-modal-overlay ${overlayShell} !items-center`}
      onClick={onClose}
      style={{ zIndex: Z_OVERLAY }}
    >
      <div
        className={`${containerShell} max-w-md outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900`}
        style={{ zIndex: Z_MODAL }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-as-title"
        aria-describedby="save-as-desc"
      >
        <CloseButton
          onClose={onClose}
          variant="primary"
          position="absolute"
          className={`${closeOffsetShell} z-local-overlay`}
        />

        <div className={`${bodyShell} min-h-0`}>
          <div className="flex items-center gap-3 mb-6 pr-10">
            <div className="p-2 bg-amber-600 rounded-lg shrink-0">
              <Save className="w-6 h-6 text-white" aria-hidden />
            </div>
            <div>
              <h3 id="save-as-title" className={modalTitleShell}>
                {msg.title || 'Salva con nome'}
              </h3>
              <p id="save-as-desc" className={`${modalSubtitleShell} whitespace-pre-line`}>
                {msg.body || `Dai un nome al tuo ${resourceLabel}`}
              </p>
            </div>
          </div>

          {showConfirm ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-amber-950/50 border border-amber-500/30 rounded-xl p-4 flex gap-3 items-start">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" aria-hidden />
                <div>
                  <h4 className="text-amber-500 font-bold mb-1">Sovrascrivere?</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Stai salvando con lo stesso nome (&quot;{name}&quot;). Questo sovrascriverà il{' '}
                    {resourceLabel} esistente. Vuoi procedere?
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500">Nome</label>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 focus:outline-none"
                  placeholder="Es. Vacanze Estive 2025"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && name.trim()) {
                      handleSaveClick();
                    }
                  }}
                />
              </div>

              {showViaggioAssociation && userId && (
                <ViaggioAssociationFields
                  choice={viaggioChoice}
                  onChoiceChange={setViaggioChoice}
                  existingViaggioId={existingViaggioId}
                  onExistingViaggioIdChange={setExistingViaggioId}
                  viaggi={viaggi}
                />
              )}
            </div>
          )}
        </div>

        <footer className={footerShell}>
          <div className={footerActionsShell}>
            {showConfirm ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className={btnCancelShell || 'bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg transition-colors border border-slate-700'}
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={() => onConfirm(buildPayload())}
                  className={btnPrimaryShell || 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg'}
                >
                  Sovrascrivi
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className={btnCancelShell || 'bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg transition-colors border border-slate-700'}
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleSaveClick}
                  className={btnPrimaryShell || 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg'}
                >
                  Salva
                </button>
              </>
            )}
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
};
