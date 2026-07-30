import React from 'react';
import { CloudOff } from 'lucide-react';

type GuestDraftBannerProps = {
  isTemplate: boolean;
};

/** Banner presentazionale draft ospite (template / valigia non salvati). */
export const GuestDraftBanner: React.FC<GuestDraftBannerProps> = ({ isTemplate }) => (
  <div
    role="status"
    className="rounded-2xl border border-slate-600/25 bg-slate-950/50 backdrop-blur-sm px-4 py-4 shadow-lg shadow-black/20 ring-1 ring-white/5 animate-in fade-in slide-in-from-top-2 duration-500"
  >
    <div className="flex items-start gap-3.5">
      <div className="w-10 h-10 rounded-xl bg-slate-800/60 border border-white/5 flex items-center justify-center shrink-0 shadow-inner">
        <CloudOff className="w-4 h-4 text-slate-400" aria-hidden />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
            {isTemplate ? 'Template temporaneo' : 'Valigia temporanea'}
          </span>
          <span className="px-1.5 py-0.5 rounded-md bg-slate-800/80 border border-white/5 text-[8px] font-black uppercase tracking-widest text-slate-500">
            Non salvato
          </span>
        </div>
        <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
          {isTemplate
            ? 'Effettua il login per salvare questo template.'
            : 'Effettua il login per salvare questa valigia.'}
        </p>
      </div>
    </div>
  </div>
);
