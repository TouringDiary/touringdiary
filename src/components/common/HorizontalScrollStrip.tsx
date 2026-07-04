import React, { useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SCROLL_STEP_PX = 120;

export interface HorizontalScrollStripProps {
  children: React.ReactNode;
  /** Contenuto fisso a sinistra (es. pulsante +) */
  leading?: React.ReactNode;
  /** Contenuto fisso a destra */
  trailing?: React.ReactNode;
  className?: string;
  scrollClassName?: string;
  /** Classi opzionali per i pulsanti freccia (desktop) */
  arrowClassName?: string;
  showArrows?: boolean;
  ariaLabel?: string;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * Fascia scrollabile orizzontale con frecce opzionali (desktop).
 * Su tablet/mobile le frecce sono nascoste: swipe nativo.
 */
export const HorizontalScrollStrip: React.FC<HorizontalScrollStripProps> = ({
  children,
  leading,
  trailing,
  className = '',
  scrollClassName = '',
  arrowClassName = 'hidden lg:inline-flex items-center justify-center self-center p-0.5 text-slate-500 hover:text-white shrink-0',
  showArrows = true,
  ariaLabel,
  scrollRef: externalScrollRef,
}) => {
  const internalScrollRef = useRef<HTMLDivElement>(null);
  const scrollRef = externalScrollRef ?? internalScrollRef;

  const scrollBy = useCallback((direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === 'left' ? -SCROLL_STEP_PX : SCROLL_STEP_PX,
      behavior: 'smooth',
    });
  }, [scrollRef]);

  return (
    <div className={`flex items-center gap-1 min-w-0 ${className}`}>
      {leading}

      {showArrows && (
        <button
          type="button"
          onClick={() => scrollBy('left')}
          className={arrowClassName}
          aria-label="Scorri a sinistra"
        >
          <ChevronLeft className="block w-3 h-3 shrink-0" aria-hidden />
        </button>
      )}

      <div
        ref={scrollRef as React.RefObject<HTMLDivElement>}
        className={`flex-1 min-w-0 overflow-x-auto scrollbar-hide scroll-smooth flex items-center gap-1 [-webkit-overflow-scrolling:touch] ${scrollClassName}`}
        role={ariaLabel ? 'tablist' : undefined}
        aria-label={ariaLabel}
      >
        {children}
      </div>

      {showArrows && (
        <button
          type="button"
          onClick={() => scrollBy('right')}
          className={arrowClassName}
          aria-label="Scorri a destra"
        >
          <ChevronRight className="block w-3 h-3 shrink-0" aria-hidden />
        </button>
      )}

      {trailing}
    </div>
  );
};

HorizontalScrollStrip.displayName = 'HorizontalScrollStrip';
