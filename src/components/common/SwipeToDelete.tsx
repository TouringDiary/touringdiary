import React, { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useBelowLg } from '@/hooks/ui/useBelowLg';

interface SwipeToDeleteProps {
  /**
   * Invoked when the swipe crosses the trigger threshold. This must hook into the
   * EXISTING delete flow (e.g. open DeleteConfirmationModal / ItemDeleteConfirmationModal).
   * No deletion is performed here — confirmation stays the responsibility of the caller.
   */
  onDelete: () => void;
  children: React.ReactNode;
  /** Disable the gesture (e.g. read-only rows or AI suggestions). Renders children untouched. */
  disabled?: boolean;
  /** Applied to the swipe viewport so it matches the row shape (rounding, etc.). */
  className?: string;
  /** Label shown on the red reveal background. */
  label?: string;
}

/** Horizontal travel (px) at full reveal. */
const REVEAL_WIDTH = 96;
/** Fraction of REVEAL_WIDTH after which releasing triggers the confirmation. */
const TRIGGER_RATIO = 0.6;
/** Movement (px) before a gesture is locked as a horizontal swipe. */
const ACTIVATION = 8;
const SPRING = 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)';

/**
 * Shared swipe-to-delete wrapper (mobile + tablet, below `lg`).
 *
 * Swipe a row left → a red background with a trash icon and label is progressively
 * revealed. Releasing before the threshold springs the row back to rest; crossing the
 * threshold springs back AND calls `onDelete`, which must open the existing confirmation
 * modal. On desktop (>= lg) or when `disabled`, children render untouched.
 *
 * Vertical scrolling is preserved via `touch-action: pan-y`; taps on inner controls keep
 * working because the gesture only engages after a horizontal movement past ACTIVATION.
 */
export const SwipeToDelete: React.FC<SwipeToDeleteProps> = ({
  onDelete,
  children,
  disabled = false,
  className = '',
  label = 'Elimina',
}) => {
  const isBelowLg = useBelowLg();
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const startX = useRef(0);
  const startY = useRef(0);
  const decided = useRef(false);
  const horizontal = useRef(false);
  // True once a horizontal swipe has actually engaged. The browser-synthesized `click` that follows
  // a touch sequence can still target an inner control (Modifica/Duplica), so we swallow that click in
  // the capture phase. It is NOT cleared on pointerup (the click fires afterwards) — it is consumed by
  // the next click and reset at the start of every new gesture (pointerdown).
  const swiped = useRef(false);

  if (!isBelowLg || disabled) {
    return <>{children}</>;
  }

  const reset = () => {
    decided.current = false;
    horizontal.current = false;
    setDragging(false);
    setOffset(0);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return; // touch/pen only — desktop pointers never engage
    startX.current = e.clientX;
    startY.current = e.clientY;
    decided.current = false;
    horizontal.current = false;
    swiped.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    if (!decided.current) {
      if (Math.abs(dx) < ACTIVATION && Math.abs(dy) < ACTIVATION) return;
      decided.current = true;
      horizontal.current = Math.abs(dx) > Math.abs(dy) && dx < 0;
      if (horizontal.current) {
        swiped.current = true;
        setDragging(true);
        try {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch {
          /* capture is best-effort */
        }
      }
    }

    if (!horizontal.current) return;
    setOffset(Math.max(-REVEAL_WIDTH, Math.min(0, dx)));
  };

  const handlePointerUp = () => {
    const shouldTrigger =
      horizontal.current && Math.abs(offset) >= REVEAL_WIDTH * TRIGGER_RATIO;
    reset();
    if (shouldTrigger) onDelete();
  };

  // Suppress the click that the browser emits after a swipe so inner controls (e.g. Modifica /
  // Duplica) never fire accidentally. A pure tap never sets `swiped`, so taps pass through untouched.
  const handleClickCapture = (e: React.MouseEvent) => {
    if (!swiped.current) return;
    e.preventDefault();
    e.stopPropagation();
    swiped.current = false;
  };

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ touchAction: 'pan-y' }}>
      {/*
        * Red action strip anchored to the right, as wide as the swipe distance: it occupies
        * exactly the gap left by the translated row, so it never bleeds through translucent
        * rows. The trash + label slide into view progressively (clipped by overflow-hidden).
        */}
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 flex items-center justify-end gap-2 pr-4 bg-rose-800 text-white overflow-hidden"
        style={{ width: Math.abs(offset) }}
      >
        <Trash2 className="w-5 h-5 shrink-0" />
        <span className="text-xs font-black uppercase tracking-widest whitespace-nowrap">{label}</span>
      </div>

      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={reset}
        // Any abnormal end of the gesture funnels into the SAME reset as pointercancel, so the drag
        // state machine (offset/dragging/decided/horizontal) can never get stuck mid-swipe. On a normal
        // release lostpointercapture fires AFTER pointerup, so the trigger logic still runs first, and
        // reset never clears `swiped` (the post-swipe click guard stays intact).
        onPointerLeave={reset}
        onLostPointerCapture={reset}
        onClickCapture={handleClickCapture}
        className="relative"
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? 'none' : SPRING,
        }}
      >
        {children}
      </div>
    </div>
  );
};
