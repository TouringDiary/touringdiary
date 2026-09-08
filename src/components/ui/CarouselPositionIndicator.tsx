import type React from 'react';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';

const THUMB_WIDTH_PX = 24; // w-6

export interface CarouselPositionIndicatorProps {
  count: number;
  /**
   * `progress` (default): thumb by scroll progress 0–1 (Suitcase).
   * `index`: thumb by selectedIndex / (count - 1); announces “Personaggio X di Y”.
   */
  mode?: 'progress' | 'index';
  /** Scroll progress 0 (start) → 1 (end). Used when mode is `progress`. */
  progress?: number;
  /** 0-based selected item. Used when mode is `index`. */
  selectedIndex?: number;
  className?: string;
}

function buildDotKeys(count: number): string[] {
  const keys: string[] = [];
  for (let n = 0; n < count; n += 1) {
    keys.push(`cpi-${count}-${n}`);
  }
  return keys;
}

/** Dot track + sliding amber thumb — progress (0–1) or discrete index. */
export const CarouselPositionIndicator: React.FC<CarouselPositionIndicatorProps> = ({
  count,
  mode = 'progress',
  progress = 0,
  selectedIndex = 0,
  className = '',
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [travelPx, setTravelPx] = useState(0);
  const dotKeys = useMemo(() => buildDotKeys(count), [count]);

  const ratio =
    mode === 'index'
      ? count <= 1
        ? 0
        : Math.min(1, Math.max(0, selectedIndex / (count - 1)))
      : Math.min(1, Math.max(0, progress));

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const updateTravel = () => {
      setTravelPx(Math.max(0, track.offsetWidth - THUMB_WIDTH_PX));
    };

    updateTravel();

    const observer = new ResizeObserver(updateTravel);
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  if (count <= 1) return null;

  const clampedIndex = Math.min(Math.max(0, selectedIndex), count - 1);
  const liveLabel = mode === 'index' ? `Personaggio ${clampedIndex + 1} di ${count}` : undefined;

  return (
    <div
      className={`flex justify-center ${className}`.trim()}
      aria-hidden={mode === 'progress' ? true : undefined}
      aria-live={mode === 'index' ? 'polite' : undefined}
      aria-atomic={mode === 'index' ? true : undefined}
    >
      {liveLabel ? <span className="sr-only">{liveLabel}</span> : null}
      <div ref={trackRef} className="relative inline-flex gap-1" aria-hidden={mode === 'index'}>
        {dotKeys.map((dotKey) => (
          <div key={dotKey} className="h-1 w-1 shrink-0 rounded-full bg-slate-800" />
        ))}
        <div
          className="pointer-events-none absolute top-0 left-0 h-1 w-6 rounded-full bg-amber-500 transition-[transform] duration-150 ease-out"
          style={{ transform: `translateX(${ratio * travelPx}px)` }}
        />
      </div>
    </div>
  );
};
