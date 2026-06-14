import React from 'react';
import { createPortal } from 'react-dom';
import { Z_MODAL_NESTED } from '@/constants/zIndex';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Plus, Sparkles, Ghost } from 'lucide-react';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { SuitcaseRejection } from '@/types/suitcase';

interface BlacklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: SuitcaseRejection[];
  onRestore: (rejection: SuitcaseRejection) => Promise<void>;
  onRemove: (rejectionId: string, name: string) => Promise<void>;
  isFetching?: boolean;
}

export const BlacklistModal: React.FC<BlacklistModalProps> = ({
  isOpen,
  onClose,
  items,
  onRestore,
  onRemove,
  isFetching = false
}) => {
  useGlobalModalEscape(isOpen, onClose);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300" style={{ zIndex: Z_MODAL_NESTED }}>
      <div 
        className="bg-slate-900 border border-white/10 p-5 md:p-7 rounded-3xl w-full max-w-2xl shadow-2xl relative animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]"
        style={{ zIndex: Z_MODAL_NESTED }}
      >
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
            <Ghost className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white font-display uppercase tracking-tight">Oggetti rifiutati</h3>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Blacklist Suggerimenti AI</p>
          </div>
        </div>

        <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 mb-5">
          <p className="text-[12px] text-slate-400 mb-3 font-medium">
            Questi oggetti sono stati esclusi dai suggerimenti per questa valigia.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
              <span className="text-indigo-400">➕ AGGIUNGI</span>
              <span className="opacity-50">→ in valigia</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
              <span className="text-emerald-400">🟢 CONSENTI</span>
              <span className="opacity-50">→ suggerimenti</span>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto custom-scrollbar pr-2 min-h-0">
          {isFetching ? (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Caricamento...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-600">
                <Ghost className="w-8 h-8 opacity-20" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400">Nessun oggetto rifiutato</p>
                <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest mt-1">
                  Gli oggetti che rifiuti dai suggerimenti AI compariranno qui
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div 
                  key={item.id} 
                  className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all gap-4"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {item.name}
                    </span>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.category}</span>
                  </div>
                  
                  <div className="flex w-full sm:w-auto items-center gap-3 sm:gap-4">
                    <button
                      onClick={() => onRestore(item)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 whitespace-nowrap shadow-lg shadow-indigo-500/5"
                      title="Aggiungi alla valigia"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Aggiungi</span>
                    </button>
                    
                    <button
                      onClick={() => onRemove(item.id, item.name)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-all text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 hover:border-emerald-500/40 whitespace-nowrap"
                      title="Consenti nuovi suggerimenti"
                    >
                      <Sparkles className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                      <span>Consenti</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 pt-5 border-t border-white/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 hover:border-white/10"
          >
            Chiudi
          </button>
        </div>

        <CloseButton onClose={onClose} variant="primary" position="absolute" className="top-4 right-4" />
      </div>
    </div>,
    document.body
  );
};
