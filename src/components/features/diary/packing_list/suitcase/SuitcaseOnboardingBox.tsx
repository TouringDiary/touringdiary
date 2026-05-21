import React from 'react';
import { Sparkles, Plus, Layout } from 'lucide-react';

interface SuitcaseOnboardingBoxProps {
  onCreateSuitcase?: () => void;
  onUsaTemplateClick: () => void;
}

export const SuitcaseOnboardingBox: React.FC<SuitcaseOnboardingBoxProps> = ({
  onCreateSuitcase,
  onUsaTemplateClick
}) => {
  return (
    <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border-2 border-indigo-500/20 p-8 flex flex-col items-center text-center gap-6 animate-in fade-in zoom-in duration-700">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
        <Sparkles className="w-8 h-8" />
      </div>
      
      <div className="max-w-[280px]">
        <h3 className="text-lg font-black text-white mb-2 tracking-tight">
          Prepariamo la tua prima valigia
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed font-medium">
          Scegli un template o crea una nuova valigia per il tuo prossimo itinerario!
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[400px]">
        <button
          onClick={onUsaTemplateClick}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black transition-all shadow-lg shadow-indigo-500/20 active:scale-95 group"
        >
          <Plus className="w-4 h-4" />
          Usa un template
        </button>
        
        <button
          onClick={() => onCreateSuitcase?.()}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold border border-white/5 transition-all active:scale-95"
        >
          Crea una valigia
        </button>
      </div>
    </div>
  );
};
