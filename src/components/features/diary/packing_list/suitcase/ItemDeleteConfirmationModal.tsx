import { Z_MODAL_NESTED } from '@/constants/zIndex';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '@/components/ui/controls/CloseButton';

import { Trash2, AlertTriangle, XCircle } from 'lucide-react';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';

interface ItemDeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  category: string;
  isAiSuggestion?: boolean;
}

export const ItemDeleteConfirmationModal: React.FC<ItemDeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  category,
  isAiSuggestion = false
}) => {
  useGlobalModalEscape(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') onConfirm();
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onConfirm]);

  if (!isOpen) return null;

  const title = isAiSuggestion ? "Rifiuta Suggerimento?" : "Elimina Oggetto?";
  const description = isAiSuggestion 
    ? <>Vuoi davvero escludere <span className="text-white font-bold">{itemName}</span> dai suggerimenti? Verrà inserito nella blacklist per questa valigia.</>
    : <>Vuoi davvero eliminare <span className="text-white font-bold">{itemName}</span> dalla categoria <span className="text-indigo-400 font-bold">{category}</span>?</>;
  const confirmLabel = isAiSuggestion ? "Rifiuta Suggerimento" : "Elimina Oggetto";
  const Icon = isAiSuggestion ? XCircle : Trash2;
  

    return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300" style={{ zIndex: Z_MODAL_NESTED }}>
      <div 
        className={`bg-slate-900 border ${isAiSuggestion ? 'border-amber-500/30' : 'border-rose-500/30'} p-8 rounded-3xl w-full max-w-md shadow-[0_0_50px_rgba(244,63,94,0.1)] relative animate-in zoom-in-95 duration-300`}
        style={{ zIndex: Z_MODAL_NESTED }}
      >

        <div className="flex flex-col items-center text-center gap-6">
          {/* Icon Header */}
          <div className={`w-20 h-20 rounded-full ${isAiSuggestion ? 'bg-amber-500/10 border-amber-500/30' : 'bg-rose-500/10 border-rose-500/30'} flex items-center justify-center border relative`}>
            <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full ${isAiSuggestion ? 'bg-amber-500' : 'bg-amber-500'} flex items-center justify-center border-2 border-slate-900 shadow-lg`}>
              <AlertTriangle className="w-3 h-3 text-white" />
            </div>
            <Icon className={`w-10 h-10 ${isAiSuggestion ? 'text-amber-500' : 'text-rose-500'} animate-pulse`} />
          </div>

          <div>
            <h3 className="text-2xl font-black text-white mb-3 font-display uppercase tracking-tight">{title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed max-w-[280px] mx-auto">
              {description}
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full mt-4">
            <button
              onClick={onConfirm}
              className={`w-full ${isAiSuggestion ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'} text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] text-[10px] uppercase tracking-widest group`}
            >
              <Icon className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              {confirmLabel}
            </button>

            <button
              onClick={onClose}
              className="w-full bg-slate-800/50 hover:bg-slate-800 text-slate-400 font-bold py-4 rounded-2xl transition-all text-[10px] uppercase tracking-widest border border-white/5"
            >
              Annulla
            </button>
          </div>
        </div>

        <CloseButton onClose={onClose} variant="primary" position="absolute" className="top-4 right-4" />
      </div>
    </div>,
    document.body
  );
};
