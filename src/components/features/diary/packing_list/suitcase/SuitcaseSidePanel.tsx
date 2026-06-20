import React from 'react';
import { ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import { Z_MODAL } from '@/constants/zIndex';

interface SuitcaseSidePanelProps {
  children: React.ReactNode;
  title?: string;
  isOpen?: boolean;
  onToggle?: () => void;
  isCollapsible?: boolean;
  className?: string;
  sticky?: boolean;
}

const MOBILE_COLLAPSE_BAR_CLASS =
  'lg:hidden w-full h-11 shrink-0 bg-slate-900 border-slate-800 flex items-center justify-center gap-2 px-4 cursor-pointer active:bg-slate-800 transition-colors shadow-md pointer-events-auto';

export const SuitcaseSidePanel: React.FC<SuitcaseSidePanelProps> = ({
  children,
  title = "Suggerimenti",
  isOpen = true,
  onToggle,
  isCollapsible = false,
  className = "",
  sticky = false
}) => {
  return (
    <div 
      className={`flex flex-col shrink-0 lg:border-l border-white/10 bg-[#030508] lg:bg-[#030508]/80 h-auto lg:min-h-full relative z-30 overflow-visible transition-all duration-500 ease-in-out ${
        sticky ? 'sticky top-0' : ''
      } ${
        isOpen 
          ? 'w-full lg:w-[280px] xl:w-[360px] 2xl:w-[440px]' 
          : 'w-full lg:w-[60px]'
      } ${className}`}
    >
      {isCollapsible && (
        <button
          type="button"
          onClick={onToggle}
          className={`${MOBILE_COLLAPSE_BAR_CLASS} ${
            isOpen ? 'border-b' : 'border-t'
          }`}
          style={{ zIndex: Z_MODAL }}
          aria-label={isOpen ? 'Nascondi suggerimenti' : 'Mostra suggerimenti'}
          title={isOpen ? 'Nascondi suggerimenti' : 'Mostra suggerimenti'}
        >
          {isOpen ? (
            <>
              <ChevronUp className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="font-handwriting text-lg font-bold text-white pt-0.5 truncate">
                Nascondi suggerimenti
              </span>
              <ChevronUp className="w-4 h-4 text-amber-500 shrink-0" />
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="font-handwriting text-lg font-bold text-white pt-0.5 truncate">
                Mostra suggerimenti
              </span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            </>
          )}
        </button>
      )}

      {isCollapsible && (
        <button
          type="button"
          onClick={onToggle}
          className="hidden lg:flex absolute -left-3 top-12 w-6 h-6 bg-amber-500 rounded-full border border-slate-900 items-center justify-center text-slate-950 hover:bg-amber-400 transition-colors z-dropdown shadow-lg shadow-amber-500/20 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60"
          aria-label={isOpen ? 'Chiudi suggerimenti' : 'Apri suggerimenti'}
          title={isOpen ? 'Chiudi Suggerimenti' : 'Apri Suggerimenti'}
        >
          {isOpen ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      )}

      <div
        className={`flex-1 flex-col p-6 transition-all duration-300 ${
          isOpen ? 'flex opacity-100' : 'hidden lg:flex lg:opacity-0 lg:pointer-events-none'
        }`}
      >
        <div className="flex items-center mb-1 px-1 h-6 shrink-0">
          <div className="w-[3px] h-full bg-amber-500 rounded-full mr-3" />
          <h3 className="text-[11px] font-black text-amber-500 uppercase tracking-[0.2em]">{title}</h3>
        </div>
        <div className="w-full mt-6 flex-1">
          {children}
        </div>
      </div>

      {!isOpen && isCollapsible && (
        <div 
          onClick={onToggle}
          className="absolute inset-0 hidden lg:flex flex-col items-center pt-24 cursor-pointer hover:bg-white/[0.02] transition-colors group"
        >
          <div className="flex flex-col items-center gap-12">
             <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-amber-500/30 to-transparent group-hover:via-amber-500 transition-all duration-500" />
             <div className="rotate-90 origin-center whitespace-nowrap">
                <span className="text-[9px] font-black text-amber-500/20 group-hover:text-amber-500 uppercase tracking-[0.4em] transition-all duration-500">
                  {title}
                </span>
             </div>
             <Sparkles className="w-3.5 h-3.5 text-amber-500/10 group-hover:text-amber-500 transition-all duration-500" />
          </div>
        </div>
      )}
    </div>
  );
};
