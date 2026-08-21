import type React from 'react';
import { useLayoutEffect, useRef } from 'react';
import { useMobileCompact } from '@/hooks/ui/useMobileCompact';
import { HERO_COMPACT, heroCompactFieldShell } from '../heroCompactTokens';

type HeroCompactTypingVariant = 'ai' | 'inspiration';

interface HeroCompactTypingFieldProps {
  text: string;
  variant?: HeroCompactTypingVariant;
  showCursor?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  /** When true, renders only inner content (parent supplies the field shell). */
  bare?: boolean;
  'aria-label'?: string;
}

const VARIANT_STYLES: Record<HeroCompactTypingVariant, { text: string; cursor: string }> = {
  ai: {
    text: 'text-slate-300 font-mono',
    cursor: 'bg-purple-500',
  },
  inspiration: {
    text: 'text-slate-300',
    cursor: 'bg-amber-500',
  },
};

export const HeroCompactTypingField: React.FC<HeroCompactTypingFieldProps> = ({
  text,
  variant = 'ai',
  showCursor = true,
  onClick,
  disabled = false,
  bare = false,
  'aria-label': ariaLabel,
}) => {
  const styles = VARIANT_STYLES[variant];
  /** Con onClick resta sempre un <button>; disabled non degrada a elemento non interattivo. */
  const isControl = onClick != null;
  const isMobileCompact = useMobileCompact();
  const scrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!isMobileCompact) return;
    const el = scrollRef.current;
    if (!el) return;

    // text/showCursor cambiano la larghezza: rimisura e porta a fine testo (o a 0 se vuoto).
    if (text.length === 0 && !showCursor) {
      el.scrollLeft = 0;
      return;
    }
    el.scrollLeft = el.scrollWidth - el.clientWidth;
  }, [text, isMobileCompact, showCursor]);

  const textClasses = isMobileCompact
    ? `text-xs leading-tight whitespace-nowrap ${styles.text}`
    : `${HERO_COMPACT.fieldText} ${styles.text}`;

  // Solo phrasing content: può stare dentro <button> senza violare il content model HTML.
  const textNode = (
    <span className={textClasses}>
      {text}
      {showCursor ? (
        <span
          className={`w-0.5 h-3.5 ${styles.cursor} inline-block ml-0.5 animate-pulse translate-y-0.5`}
        />
      ) : null}
    </span>
  );

  // Scroll container FUORI dal button: overflow sul div, click sul button (phrasing only).
  const scrollShell = (child: React.ReactNode) => (
    <div
      ref={scrollRef}
      className="min-w-0 w-full overflow-x-auto overflow-y-hidden scrollbar-hide"
    >
      {child}
    </div>
  );

  let inner: React.ReactNode;

  if (isControl) {
    const control = (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        aria-label={ariaLabel}
        className={`min-w-0 w-full text-left transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 cursor-pointer'
        }`}
      >
        {textNode}
      </button>
    );
    inner = isMobileCompact ? scrollShell(control) : control;
  } else {
    inner = isMobileCompact ? (
      scrollShell(textNode)
    ) : (
      <div className="min-w-0 w-full">{textNode}</div>
    );
  }

  if (bare) return inner;

  return (
    <section
      className={`${heroCompactFieldShell} ${HERO_COMPACT.fieldPadding}`}
      aria-label={isControl ? undefined : ariaLabel}
    >
      {inner}
    </section>
  );
};
