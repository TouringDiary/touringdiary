import React from 'react';
import { Compass } from 'lucide-react';

export const CompassExploreButton: React.FC<{ onClick: (e: React.MouseEvent) => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="group flex items-center gap-2 bg-amber-600/10 hover:bg-amber-600/20 border border-amber-500/20 hover:border-amber-500 px-3 py-1.5 rounded-full transition-all active:scale-95 shrink-0 shadow-lg"
    aria-label="Scopri dintorni"
  >
    <div className="flex items-center justify-center">
      <Compass className="w-4 h-4 text-amber-500 group-hover:rotate-45 transition-transform duration-500" />
    </div>
    <span className="text-[10px] font-black uppercase tracking-[0.1em] text-amber-500">
      Scopri dintorni
    </span>
  </button>
);
