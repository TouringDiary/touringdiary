import { Z_MODAL_NESTED } from '@/constants/zIndex';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Briefcase, Link, Loader2 } from 'lucide-react';
import { LinkModalVariant } from '@/utils/suitcaseAssociation';

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
      className="td-modal-overlay fixed inset-0 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300"
      style={{ zIndex: Z_MODAL_NESTED }}
      onClick={onCancel}
    >
      <div
        className="bg-slate-900 border border-indigo-500/30 p-8 rounded-3xl w-full max-w-md shadow-[0_0_50px_rgba(99,102,241,0.2)] relative animate-in zoom-in-95 duration-300"
        style={{ zIndex: Z_MODAL_NESTED }}
        onClick={(e) => e.stopPropagation()}
      >
        <CloseButton onClose={onCancel} variant="primary" position="absolute" className="top-4 right-4" />

        <div className="flex flex-col items-center text-center gap-6">
          <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30">
            <Briefcase className="w-10 h-10 text-indigo-400" />
          </div>

          <div>
            <h3 className="text-2xl font-black text-white mb-3 font-display uppercase tracking-tight">
              {copy.title}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed max-w-[300px] mx-auto">
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
