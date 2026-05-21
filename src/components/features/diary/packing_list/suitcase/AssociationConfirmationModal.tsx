import { Z_MODAL_NESTED } from '@/constants/zIndex';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '@/components/ui/controls/CloseButton';

import { Briefcase, Link, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';

interface AssociationConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void; // "Salva valigia" (stays saved)
  onConfirm: () => void; // "Salva e associa"
  onDiscard: () => void; // "Esci senza salvare" (deletes if new)
  onCancel?: () => void; // "Annulla" (just close modal, stay in editor)
  isDiaryFull?: boolean;
  title: string;
  message: string;
  isLinking?: boolean;
  hasActiveTrip: boolean;
  isGuest?: boolean;
  onLogin?: () => void;
}

export const AssociationConfirmationModal: React.FC<AssociationConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onDiscard,
  onCancel,
  isDiaryFull = true,
  title,
  message,
  isLinking = false,
  hasActiveTrip,
  isGuest = false,
  onLogin
}) => {
  useGlobalModalEscape(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && hasActiveTrip) onConfirm();
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onConfirm, hasActiveTrip]);

  if (!isOpen) return null;

    return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300" style={{ zIndex: Z_MODAL_NESTED }}>
      <div 
        className="bg-slate-900 border border-indigo-500/30 p-8 rounded-3xl w-full max-w-md shadow-[0_0_50px_rgba(99,102,241,0.2)] relative animate-in zoom-in-95 duration-300"
        style={{ zIndex: Z_MODAL_NESTED }}
      >

        <div className="flex flex-col items-center text-center gap-6">
          {/* Icon Header */}
          <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30 relative">
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-slate-900 shadow-lg">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <Briefcase className="w-10 h-10 text-indigo-400 animate-pulse" />
          </div>

          <div>
            <h3 className="text-2xl font-black text-white mb-3 font-display uppercase tracking-tight">{title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed max-w-[280px] mx-auto">
              {message}
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full mt-4">
            {isGuest ? (
              <>
                <button
                  onClick={onLogin}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] text-[10px] uppercase tracking-widest"
                >
                  <ArrowRight className="w-4 h-4" />
                  Effettua Login
                </button>
                <button
                  onClick={onDiscard}
                  className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold py-4 rounded-2xl transition-all text-[10px] uppercase tracking-widest border border-rose-500/20"
                >
                  Esci senza salvare
                </button>
              </>
            ) : hasActiveTrip ? (
              <>
                <button
                  onClick={onConfirm}
                  disabled={isLinking || !isDiaryFull}
                  className={`w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] text-[10px] uppercase tracking-widest group ${(!isDiaryFull && !isLinking) ? 'opacity-50 cursor-not-allowed grayscale-[0.5]' : ''}`}
                >
                  {isLinking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Link className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  )}
                  {isLinking ? 'Associazione in corso...' : !isDiaryFull ? 'Diario vuoto (Impossibile associare)' : 'Salva e associa al diario'}
                </button>

                <button
                  onClick={onClose}
                  className="w-full bg-slate-800/50 hover:bg-slate-800 text-slate-400 font-bold py-4 rounded-2xl transition-all text-[10px] uppercase tracking-widest border border-white/5"
                >
                  Salva valigia
                </button>

                <button
                  onClick={onDiscard}
                  className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold py-4 rounded-2xl transition-all text-[10px] uppercase tracking-widest border border-rose-500/20"
                >
                  Esci senza salvare
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] text-[10px] uppercase tracking-widest"
                >
                  <ArrowRight className="w-4 h-4" />
                  Salva Valigia
                </button>

                <button
                  onClick={onDiscard}
                  className="w-full bg-slate-800/50 hover:bg-slate-800 text-slate-400 font-bold py-4 rounded-2xl transition-all text-[10px] uppercase tracking-widest border border-white/5"
                >
                  Esci senza salvare
                </button>
              </>
            )}
          </div>
        </div>

        {/* Close hint */}
        <CloseButton onClose={onCancel || onClose} variant="primary" position="absolute" className="top-4 right-4" />
      </div>
    </div>,
    document.body
  );
};



