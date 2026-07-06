import { Z_MODAL_NESTED } from '@/constants/zIndex';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Briefcase, Link, Loader2 } from 'lucide-react';
import { LinkModalVariant } from '@/utils/suitcaseAssociation';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';

interface LinkSuitcaseModalProps {
  isOpen: boolean;
  variant: LinkModalVariant;
  defaultDiaryName?: string;
  defaultSuitcaseName?: string;
  isSubmitting?: boolean;
  onConfirm: (values: { diaryName?: string; suitcaseName?: string }) => void;
  onCancel: () => void;
}

const COPY: Record<
  LinkModalVariant,
  { title: string; message: string }
> = {
  'diary-only': {
    title: 'Salva il diario',
    message:
      'Per associare la valigia al diario di viaggio devi prima salvarlo con un nome.',
  },
  'suitcase-only': {
    title: 'Salva la valigia',
    message:
      'Per associarla al diario di viaggio devi prima salvarla con un nome.',
  },
  both: {
    title: 'Salva diario e valigia',
    message:
      'Per associare una valigia a un diario devi prima salvarli entrambi.',
  },
};

export const LinkSuitcaseModal: React.FC<LinkSuitcaseModalProps> = ({
  isOpen,
  variant,
  defaultDiaryName = '',
  defaultSuitcaseName = '',
  isSubmitting = false,
  onConfirm,
  onCancel,
}) => {
  const [diaryName, setDiaryName] = useState(defaultDiaryName);
  const [suitcaseName, setSuitcaseName] = useState(defaultSuitcaseName);

  const isMobile = useMobileDetect();
  const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
  const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
  const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
  const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
  const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);
  const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle, isMobile);

  useEffect(() => {
    if (isOpen) {
      setDiaryName(defaultDiaryName);
      setSuitcaseName(defaultSuitcaseName);
    }
  }, [isOpen, defaultDiaryName, defaultSuitcaseName]);

  if (!isOpen) return null;

  const copy = COPY[variant];
  const showDiary = variant === 'diary-only' || variant === 'both';
  const showSuitcase = variant === 'suitcase-only' || variant === 'both';

  const handleSubmit = () => {
    onConfirm({
      diaryName: showDiary ? diaryName : undefined,
      suitcaseName: showSuitcase ? suitcaseName : undefined,
    });
  };

  const canSubmit =
    (!showDiary || diaryName.trim().length > 0) &&
    (!showSuitcase || suitcaseName.trim().length > 0) &&
    !isSubmitting;

  return createPortal(
    <div
      className={`td-modal-overlay ${overlayShell}`}
      style={{ zIndex: Z_MODAL_NESTED }}
      onClick={onCancel}
    >
      <div
        className={`${containerShell} max-w-md outline-none`}
        style={{ zIndex: Z_MODAL_NESTED }}
        onClick={(e) => e.stopPropagation()}
      >
        <CloseButton
          onClose={onCancel}
          variant="primary"
          position="absolute"
          className={`${closeOffsetShell} z-local-overlay`}
        />

        <div className={`${bodyShell} flex flex-col items-center text-center gap-6`}>
          <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30">
            <Briefcase className="w-10 h-10 text-indigo-400" />
          </div>

          <div>
            <h3 className={`${modalTitleShell} mb-3`}>
              {copy.title}
            </h3>
            <p className={`${modalSubtitleShell} leading-relaxed max-w-[300px] mx-auto`}>
              {copy.message}
            </p>
          </div>

          <div className="flex flex-col gap-4 w-full mt-2 text-left">
            {showDiary && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Nome diario
                </label>
                <input
                  autoFocus
                  type="text"
                  value={diaryName}
                  onChange={(e) => setDiaryName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="Es. Vacanze Estive 2025"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && canSubmit) handleSubmit();
                  }}
                />
              </div>
            )}

            {showSuitcase && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Nome valigia
                </label>
                <input
                  autoFocus={variant === 'suitcase-only'}
                  type="text"
                  value={suitcaseName}
                  onChange={(e) => setSuitcaseName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="Es. Valigia Mare"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && canSubmit) handleSubmit();
                  }}
                />
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] text-[10px] uppercase tracking-widest ${
                  !canSubmit ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Link className="w-4 h-4" />
                )}
                {isSubmitting ? 'Associazione in corso...' : 'Salva e associa'}
              </button>

              <button
                onClick={onCancel}
                disabled={isSubmitting}
                className="w-full bg-slate-800/50 hover:bg-slate-800 text-slate-400 font-bold py-4 rounded-2xl transition-all text-[10px] uppercase tracking-widest border border-white/5"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
