import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { DraggableSliderHandle } from '@/components/common/DraggableSlider';
import type { FamousPerson } from '../../types/index';

export interface VisibleBirthYearRange {
  minYear: number | null;
  maxYear: number | null;
}

interface UseCultureCornerTimelineProps {
  isOpen: boolean;
  filteredPeople: FamousPerson[];
  scrollNonce: number;
  timelineRef: RefObject<DraggableSliderHandle | null>;
}

function birthYearOf(person: FamousPerson): number | null {
  if (typeof person.birthYear === 'number' && Number.isFinite(person.birthYear)) {
    return Math.trunc(person.birthYear);
  }
  return null;
}

export function resolveViewportBirthYear(person: FamousPerson): number | null {
  const structured = birthYearOf(person);
  if (structured != null) return structured;

  const display = person.lifespanDisplay?.trim();
  if (!display) return null;

  const rangeMatch = display.match(/(-?\d{1,4})\s*[–\-—]/);
  if (rangeMatch?.[1]) {
    const n = Number(rangeMatch[1]);
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  const singleMatch = display.match(/^(-?\d{1,4})\b/);
  if (singleMatch?.[1]) {
    const n = Number(singleMatch[1]);
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  return null;
}

function intersectionAreaRatio(rootRect: DOMRectReadOnly, childRect: DOMRectReadOnly): number {
  const visibleW = Math.max(
    0,
    Math.min(childRect.right, rootRect.right) - Math.max(childRect.left, rootRect.left),
  );
  const visibleH = Math.max(
    0,
    Math.min(childRect.bottom, rootRect.bottom) - Math.max(childRect.top, rootRect.top),
  );
  const total = childRect.width * childRect.height;
  if (total <= 0) return 0;
  return (visibleW * visibleH) / total;
}

export function useCultureCornerTimeline({
  isOpen,
  filteredPeople,
  scrollNonce,
  timelineRef,
}: UseCultureCornerTimelineProps) {
  const [viewportYears, setViewportYears] = useState<VisibleBirthYearRange>({
    minYear: null,
    maxYear: null,
  });
  const [timelineCanScrollLeft, setTimelineCanScrollLeft] = useState(false);
  const [timelineCanScrollRight, setTimelineCanScrollRight] = useState(false);

  const viewportYearsRef = useRef(viewportYears);
  viewportYearsRef.current = viewportYears;

  const updateTriggerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isOpen || filteredPeople.length === 0) {
      setViewportYears({ minYear: null, maxYear: null });
      setTimelineCanScrollLeft(false);
      setTimelineCanScrollRight(false);
      updateTriggerRef.current = null;
      return;
    }

    let cancelled = false;
    let rafId = 0;
    let rootEl: HTMLDivElement | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const birthYearById = new Map<string, number | null>();
    for (const person of filteredPeople) {
      if (!person.id) continue;
      birthYearById.set(person.id, resolveViewportBirthYear(person));
    }

    const updateTimelineState = () => {
      if (cancelled || !rootEl) return;

      // 1. Measure scroll positions/overflow
      const maxScroll = Math.max(0, rootEl.scrollWidth - rootEl.clientWidth);
      const left = rootEl.scrollLeft;
      const eps = 2;
      const canLeft = maxScroll > eps && left > eps;
      const canRight = maxScroll > eps && left < maxScroll - eps;

      setTimelineCanScrollLeft(canLeft);
      setTimelineCanScrollRight(canRight);

      // 2. Measure viewport birth years (min/max of people in-focus with >= 50% intersection)
      const rootRect = rootEl.getBoundingClientRect();
      let minYear: number | null = null;
      let maxYear: number | null = null;

      const children = rootEl.querySelectorAll<HTMLElement>('[data-person-id]');
      for (const child of children) {
        const id = child.dataset.personId;
        if (!id) continue;
        const ratio = intersectionAreaRatio(rootRect, child.getBoundingClientRect());
        if (ratio < 0.5) continue;
        const year = birthYearById.get(id);
        if (year == null) continue;
        if (minYear == null || year < minYear) minYear = year;
        if (maxYear == null || year > maxYear) maxYear = year;
      }

      const prev = viewportYearsRef.current;
      if (prev.minYear !== minYear || prev.maxYear !== maxYear) {
        setViewportYears({ minYear, maxYear });
      }
    };

    updateTriggerRef.current = updateTimelineState;

    const onScrollOrResize = () => {
      if (cancelled) return;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateTimelineState);
    };

    const attach = () => {
      if (cancelled) return;
      rootEl = timelineRef.current?.getRootElement() ?? null;
      if (!rootEl) {
        rafId = requestAnimationFrame(attach);
        return;
      }
      rootEl.addEventListener('scroll', onScrollOrResize, { passive: true });
      window.addEventListener('resize', onScrollOrResize);

      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          onScrollOrResize();
        });
        resizeObserver.observe(rootEl);
      }

      updateTimelineState();
    };

    rafId = requestAnimationFrame(attach);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      updateTriggerRef.current = null;
      if (rootEl) {
        rootEl.removeEventListener('scroll', onScrollOrResize);
      }
      window.removeEventListener('resize', onScrollOrResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [isOpen, filteredPeople, timelineRef]);

  useEffect(() => {
    if (isOpen && updateTriggerRef.current && scrollNonce !== undefined) {
      const rafId = requestAnimationFrame(() => {
        updateTriggerRef.current?.();
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [scrollNonce, isOpen]);

  return {
    viewportYears,
    timelineCanScrollLeft,
    timelineCanScrollRight,
  };
}
export { birthYearOf };
