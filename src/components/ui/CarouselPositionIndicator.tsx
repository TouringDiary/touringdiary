import React, { useLayoutEffect, useRef, useState } from 'react';

const THUMB_WIDTH_PX = 24; // w-6

export interface CarouselPositionIndicatorProps {
  count: number;
  /** Scroll progress 0 (start) → 1 (end). */
  progress: number;
  className?: string;
}

/** Dot track + sliding amber thumb — position driven by scroll progress (0–1). */
export const CarouselPositionIndicator: React.FC<CarouselPositionIndicatorProps> = ({
  count,
  progress,
  className = '',
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [travelPx, setTravelPx] = useState(0);
  const clamped = Math.min(1, Math.max(0, progress));

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
  }, [count]);

  if (count <= 1) return null;

  return (
    <div className={`flex justify-center ${className}`.trim()} aria-hidden>
      <div ref={trackRef} className="relative inline-flex gap-1">
        {Array.from({ length: count }, (_, idx) => (
          <div key={idx} className="h-1 w-1 shrink-0 rounded-full bg-slate-800" />
        ))}
        <div
          className="pointer-events-none absolute top-0 left-0 h-1 w-6 rounded-full bg-amber-500 transition-[transform] duration-150 ease-out"
          style={{ transform: `translateX(${clamped * travelPx}px)` }}
        />
      </div>
    </div>
  );
};
