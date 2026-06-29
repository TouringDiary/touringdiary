import React from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useControlledSlidePanel } from '@/hooks/ui/useControlledSlidePanel';
import {
  SLIDE_PANEL_TRANSITION_CLASS,
  slidePanelEaseClass,
  slidePanelTransformClass,
} from '@/constants/slidePanelMotion';

interface SuitcaseMobileSuggestionsDrawerProps {
  children: React.ReactNode;
  title?: string;
  isOpen: boolean;
  onToggle: () => void;
  /**
   * Collapsed-state layout:
   * - 'overlay' (default): the collapsed toggle bar floats at the bottom over the surface
   *   (absolute, pointer-events fall through). Original behavior — used by the Editor.
   * - 'docked': the collapsed toggle bar participates in the parent flex column flow
   *   (shrink-0), so the surrounding layout reserves its height structurally with NO manual
   *   padding compensation. Used by the Dashboard.
   *
   * The OPEN state is an absolute overlay in BOTH modes.
   */
  collapsedLayout?: 'overlay' | 'docked';
}

// Altezza applicata per variante: docked compatto (parte direttamente dal bordo + label),
// overlay/aperto invariati (h-11) per non toccare l'editor.
const TOGGLE_BAR_CLASS =
  'w-full shrink-0 bg-slate-950 border-slate-800 flex items-center justify-center gap-2 px-4 cursor-pointer active:bg-slate-900 transition-colors touch-manipulation';

/**
 * Mobile-only (< lg) suggestions drawer rendered inside the workspace area.
 *
 * Open state: the wrapper is `absolute inset-0` over the surface, so the panel expands from
 * the bottom up to immediately below the page header.
 *
 * Stacking: this is an in-surface LOCAL drawer (z-local-drawer / Z_LOCAL_DRAWER). It stays
 * above the list content (including its sticky category headers) yet is confined to the
 * Valigia workspace surface — never portaled. See the localDrawer tier in
 * src/layering/layerRegistry.ts. The open wrapper is pointer-events-none so taps fall through
 * to the list, while the interactive surfaces re-enable pointer events explicitly.
 */
export const SuitcaseMobileSuggestionsDrawer: React.FC<SuitcaseMobileSuggestionsDrawerProps> = ({
  children,
  title = 'Suggerimenti',
  isOpen,
  onToggle,
  collapsedLayout = 'overlay',
}) => {
  // Ciclo di vita slide condiviso (stessa durata/easing/direzione di Diario e Valigia):
  // sale dal basso in apertura, scende in chiusura prima di smontare.
  const { panelRef, shouldRender, isPanelRaised, isClosing } = useControlledSlidePanel(isOpen);

  // Docked: barra in-flow, il bordo superiore funge da linea divisoria → niente
  // drop-shadow che la farebbe "galleggiare" sopra la propria riga.
  // Overlay: la barra flotta sulla superficie → mantiene l'ombra per lo stacco.
  const collapsedBar = (
    <button
      type="button"
      onClick={onToggle}
      className={`${TOGGLE_BAR_CLASS} border-t ${collapsedLayout === 'docked' ? 'h-9' : 'h-11 shadow-md'}`}
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
  );

  // Barra compressa: sempre presente sotto l'overlay così che la chiusura riveli lo sfondo.
  const collapsedLayer =
    collapsedLayout === 'docked' ? (
      // In-flow bar: the parent flex column reserves its height naturally (no padding hacks).
      <div className="lg:hidden shrink-0">{collapsedBar}</div>
    ) : (
      // Overlay collapsed bar (original behavior): floats at the bottom of the surface.
      <div className="lg:hidden absolute inset-0 z-local-drawer flex flex-col justify-end pointer-events-none">
        <div className="pointer-events-auto">{collapsedBar}</div>
      </div>
    );

  return (
    <>
      {collapsedLayer}

      {shouldRender && (
        <div className="lg:hidden absolute inset-0 z-local-drawer flex flex-col pointer-events-none overflow-hidden">
          <div
            ref={panelRef}
            className={`flex flex-1 flex-col min-h-0 pointer-events-auto bg-[#030508] border-t border-white/10 ${SLIDE_PANEL_TRANSITION_CLASS} ${slidePanelTransformClass(isPanelRaised)} ${slidePanelEaseClass(isClosing)}`}
          >
            <button
              type="button"
              onClick={onToggle}
              className={`${TOGGLE_BAR_CLASS} h-11 border-b shrink-0 shadow-md`}
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
        </div>
      )}
    </>
  );
};
