import { useState, useEffect, useCallback } from 'react';

export function useAutoRotateSuggestions(itemsCount: number, intervalMs = 5000, isPaused = false) {
  const [activeIndex, setActiveIndex] = useState(0);

  const next = useCallback(() => {
    if (itemsCount <= 1) return;
    setActiveIndex(prev => (prev + 1) % itemsCount);
  }, [itemsCount]);

  useEffect(() => {
    if (isPaused || itemsCount <= 1) return;

    const interval = setInterval(next, intervalMs);
    return () => clearInterval(interval);
  }, [isPaused, itemsCount, intervalMs, next]);

  return { activeIndex, setActiveIndex, next };
}
