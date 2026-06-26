import React from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface SuitcaseMobileSuggestionsDrawerProps {
  children: React.ReactNode;
  title?: string;
  isOpen: boolean;
  onToggle: () => void;
}

const TOGGLE_BAR_CLASS =
  'w-full h-11 shrink-0 bg-slate-900 border-slate-800 flex items-center justify-center gap-2 px-4 cursor-pointer active:bg-slate-800 transition-colors shadow-md touch-manipulation';

/**
 * Mobile-only (< lg) suggestions drawer rendered inside the workspace editor area.
 *
 * Layout: the wrapper is `absolute inset-0` over the editor body, so the panel
 * expands from the bottom toggle bar up to immediately below the page header.
 *
 * Stacking: this is an in-surface LOCAL drawer (z-local-drawer / Z_LOCAL_DRAWER). It
 * stays above the editor list content (including its sticky category headers) yet is
 * confined to the Valigia workspace surface — never portaled. See the localDrawer tier
 * in src/layering/layerRegistry.ts. The wrapper is pointer-events-none so taps fall
 * through to the list, while the interactive surfaces (toggle bar / open panel)
 * re-enable pointer events explicitly.
 */
export const SuitcaseMobileSuggestionsDrawer: React.FC<SuitcaseMobileSuggestionsDrawerProps> = ({
  children,
  title = 'Suggerimenti',
  isOpen,
  onToggle,
}) => {
  return (
    <div
      className={`lg:hidden absolute inset-0 z-local-drawer flex flex-col pointer-events-none ${
        isOpen ? '' : 'justify-end'
      }`}
    >
      {isOpen ? (
        <div className="flex flex-1 flex-col min-h-0 pointer-events-auto bg-[#030508] border-t border-white/10 animate-in slide-in-from-bottom-4 duration-300">
          <button
            type="button"
            onClick={onToggle}
            className={`${TOGGLE_BAR_CLASS} border-b shrink-0`}
            aria-expanded
            aria-label="Nascondi suggerimenti"
            title="Nascondi suggerimenti"
          >
            <ChevronDown className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="font-handwriting text-lg font-bold text-white pt-0.5 truncate">
              Nascondi suggerimenti
            </span>
            <ChevronDown className="w-4 h-4 text-amber-500 shrink-0" />
          </button>

          <div className="flex flex-1 flex-col min-h-0 p-6 overflow-hidden">
            <div className="flex items-center mb-1 px-1 h-6 shrink-0">
              <div className="w-[3px] h-full bg-amber-500 rounded-full mr-3" />
              <h3 className="text-[11px] font-black text-amber-500 uppercase tracking-[0.2em]">
                {title}
              </h3>
            </div>
            <div className="w-full mt-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              {children}
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          className={`${TOGGLE_BAR_CLASS} border-t pointer-events-auto`}
          aria-expanded={false}
          aria-label="Mostra suggerimenti"
          title="Mostra suggerimenti"
        >
          <ChevronUp className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="font-handwriting text-lg font-bold text-white pt-0.5 truncate">
            Mostra suggerimenti
          </span>
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        </button>
      )}
    </div>
  );
};
