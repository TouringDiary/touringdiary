import { Compass } from 'lucide-react';
import type React from 'react';

export const CompassExploreButton: React.FC<{ onClick: (e: React.MouseEvent) => void }> = ({
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex items-center justify-center gap-2 bg-amber-600/10 hover:bg-amber-600/20 border border-amber-500/20 hover:border-amber-500 px-3 py-1.5 min-h-11 rounded-full transition-all active:scale-95 shrink-0 shadow-lg"
    aria-label="Scopri dintorni"
  >
    <span className="flex items-center justify-center shrink-0" aria-hidden>
      <Compass className="w-4 h-4 text-amber-500 group-hover:rotate-45 transition-transform duration-500" />
    </span>
    <span className="hidden md:inline text-[10px] font-black uppercase tracking-[0.1em] leading-none text-amber-500">
      Scopri dintorni
    </span>
  </button>
);
