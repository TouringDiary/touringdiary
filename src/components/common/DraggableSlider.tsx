import type React from 'react';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

interface Props {
  children?: React.ReactNode;
  className?: string;
  onScroll?: React.UIEventHandler<HTMLDivElement>;
}

export interface DraggableSliderHandle {
  scroll: (direction: 'left' | 'right') => void;
  getScrollLeft: () => number;
  setScrollLeft: (n: number) => void;
  scrollToChild: (index: number, behavior?: ScrollBehavior) => void;
  /** Elemento scrollabile (root IntersectionObserver / misure viewport). */
  getRootElement: () => HTMLDivElement | null;
}

const isHTMLElement = (el: unknown): el is HTMLElement =>
  typeof window !== 'undefined' && el instanceof HTMLElement;

export const DraggableSlider = forwardRef<DraggableSliderHandle, Props>(
  ({ children, className = '', onScroll }, ref) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Refs for drag state
    const stateRef = useRef({
      isDown: false,
      isDragging: false,
      startX: 0,
      startY: 0,
      scrollLeft: 0,
      touchDirection: null as 'horizontal' | 'vertical' | null,
    });

    useImperativeHandle(ref, () => ({
      scroll: (direction: 'left' | 'right') => {
        const el = scrollRef.current;
        if (!el) return;
        // Una “pagina” ≈ 80% della viewport dello slider (clamp): più coerente di 400px fissi
        // su thumb piccole (Patrono), card medie (Home) e slide full-width (ShopHero).
        const amount = Math.max(120, Math.min(Math.round(el.clientWidth * 0.8), 560));
        el.scrollBy({
          left: direction === 'left' ? -amount : amount,
          behavior: 'smooth',
        });
      },
      getScrollLeft: () => scrollRef.current?.scrollLeft ?? 0,
      setScrollLeft: (n: number) => {
        const el = scrollRef.current;
        if (!el) return;
        const max = Math.max(0, el.scrollWidth - el.clientWidth);
        el.scrollLeft = Math.min(Math.max(0, n), max);
      },
      scrollToChild: (index: number, behavior: ScrollBehavior = 'smooth') => {
        const el = scrollRef.current;
        if (!el) return;
        if (!Number.isFinite(index) || index < 0) return;
        const child = el.children.item(index);
        if (!isHTMLElement(child)) return;
        const target = child.offsetLeft - Math.max(0, (el.clientWidth - child.offsetWidth) / 2);
        const max = Math.max(0, el.scrollWidth - el.clientWidth);
        el.scrollTo({
          left: Math.min(Math.max(0, target), max),
          behavior,
        });
      },
      getRootElement: () => scrollRef.current,
    }));

    // Cleanup listeners on unmount
    useEffect(() => {
      const handleUp = () => {
        if (stateRef.current.isDown) {
          setIsDragging(false);
          stateRef.current.isDown = false;
          stateRef.current.isDragging = false;
        }
      };
      // Use window for mouseup to catch release outside component
      window.addEventListener('mouseup', handleUp);
      return () => window.removeEventListener('mouseup', handleUp);
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
      if (!scrollRef.current) return;
      stateRef.current = {
        isDown: true,
        isDragging: false,
        startX: e.pageX,
        startY: e.pageY,
        scrollLeft: scrollRef.current.scrollLeft,
        touchDirection: null,
      };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!stateRef.current.isDown || !scrollRef.current) return;

      const x = e.pageX;
      const walk = (x - stateRef.current.startX) * 2;

      if (!stateRef.current.isDragging) {
        if (Math.abs(x - stateRef.current.startX) > 4) {
          stateRef.current.isDragging = true;
          setIsDragging(true);
        } else {
          return;
        }
      }

      e.preventDefault();
      scrollRef.current.scrollLeft = stateRef.current.scrollLeft - walk;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      stateRef.current.isDown = false;
      stateRef.current.isDragging = false;
    };

    const handleTouchStart = (e: React.TouchEvent) => {
      if (!scrollRef.current) return;
      const touch = e.touches[0];
      stateRef.current = {
        isDown: true,
        isDragging: false,
        startX: touch.pageX,
        startY: touch.pageY,
        scrollLeft: scrollRef.current.scrollLeft,
        touchDirection: null,
      };
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      if (!scrollRef.current || !stateRef.current.isDown) return;

      const touch = e.touches[0];
      if (!touch) return;
      const x = touch.pageX;
      const y = touch.pageY;

      const walkX = x - stateRef.current.startX;
      const walkY = y - stateRef.current.startY;

      if (stateRef.current.touchDirection === null) {
        const threshold = 6;
        const absX = Math.abs(walkX);
        const absY = Math.abs(walkY);
        if (absX > threshold || absY > threshold) {
          if (absX > absY) {
            stateRef.current.touchDirection = 'horizontal';
            stateRef.current.isDragging = true;
            setIsDragging(true);
          } else {
            stateRef.current.touchDirection = 'vertical';
          }
        } else {
          return;
        }
      }

      if (stateRef.current.touchDirection === 'vertical') {
        return;
      }

      if (e.cancelable) e.preventDefault();

      scrollRef.current.scrollLeft = stateRef.current.scrollLeft - walkX * 1.5;
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      stateRef.current.isDown = false;
      stateRef.current.isDragging = false;
    };

    return (
      <>
        <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        {/* Superficie drag/scroll orizzontale (mouse + touch) — non un controllo singolo. */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: track DraggableSlider, interazione intenzionale */}
        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onScroll={onScroll}
          className={`
                    flex min-w-0 w-full max-w-full gap-4 overflow-x-auto hide-scrollbar select-none
                    ${isDragging ? 'cursor-grabbing snap-none' : 'cursor-grab snap-x snap-mandatory'} 
                    ${className}
                `}
          style={{ touchAction: 'pan-y', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {children}
        </div>
      </>
    );
  },
);
DraggableSlider.displayName = 'DraggableSlider';
